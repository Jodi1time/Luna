// Luna's AI companion. Backs two features:
//
//   mode: 'daily-thought'  → returns a single short reflection prompt
//                             tuned to the user's phase / cycle day.
//   mode: 'chat'           → continues a brief conversation; client
//                             passes the prior messages.
//
// Auth: requires a valid user JWT in the Authorization header. The
// function only reads the user to attribute rate limiting — content
// never leaves what the user explicitly sends.
//
// Secrets required (set via `supabase secrets set ANTHROPIC_API_KEY=...`):
//   ANTHROPIC_API_KEY
//
// Deploy:
//   supabase functions deploy luna-chat
//
// Cost note: uses Claude Haiku 4.5 by default for both modes. Per-call
// cost is ~$0.0001–0.0005. Daily-thought is cached client-side per
// user per day so we don't re-spend on every Home view.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Per-mode model selection. Defaults to Claude Haiku 4.5 for both —
// matches existing behaviour, keeps cost minimal. Operator can flip
// the chat mode to a stronger model (e.g. Sonnet) without touching
// daily-thought, which is short, cached client-side, and well-served
// by Haiku. Read once at module load so a deploy of new env values
// takes effect; the function instance is short-lived enough that
// stale env caching isn't a real concern.
const ANTHROPIC_MODEL_DEFAULT       = 'claude-haiku-4-5-20251001'
const ANTHROPIC_MODEL_DAILY_THOUGHT = Deno.env.get('ANTHROPIC_MODEL_DAILY_THOUGHT') || ANTHROPIC_MODEL_DEFAULT
const ANTHROPIC_MODEL_CHAT          = Deno.env.get('ANTHROPIC_MODEL_CHAT')          || ANTHROPIC_MODEL_DEFAULT
const MAX_MESSAGE_CHARS = 2000
const MAX_PATTERN_CHARS = 240

function boundedNumber(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback
}

function sanitizeContext(input: any): Record<string, unknown> {
  return {
    phase_name: typeof input?.phase_name === 'string' ? input.phase_name.slice(0, 32) : '',
    cycle_day: boundedNumber(input?.cycle_day, 1, 1, 180),
    cycle_length: boundedNumber(input?.cycle_length, 28, 18, 120),
    hour: boundedNumber(input?.hour, new Date().getUTCHours(), 0, 23),
    pattern_summary: typeof input?.pattern_summary === 'string'
      ? input.pattern_summary.trim().slice(0, MAX_PATTERN_CHARS)
      : '',
  }
}

// Luna's voice + safety rails. Lives server-side so the client can't
// override it. Wording mirrors what Luna says elsewhere in the UI.
const SYSTEM_PROMPT = `You are Luna — a women's wellness companion. Your voice is warm, brief, intimate, and embodied. Never prescriptive, never clinical, never categorical. Never name your own tone or relationship to the user (no "as your friend," "as a doula," "as a wise older sister") — let her attribute it. Never list back what you know about her — speak to her, not about her.

You help with:
- Reflection prompts about the menstrual cycle, mental health, self-care
- Brief conversation about how the user is feeling
- Body literacy and gentle education
- Acknowledging effort and emotional reality

You DO NOT:
- Give medical diagnoses
- Recommend specific medications or dosages
- Replace a clinician
- Tell users they "should" or "must" do anything
- Pathologise normal feelings
- Pretend to be a real person
- Categorise the user back to herself ("I notice you tend toward...", "Your pattern is...", "It sounds like you often...")
- Echo back any provided pattern data as a list, a chart, or an observation
- Name your own role or compare yourself to one (no "like a friend would say...")

When users mention:
- Suicidal thoughts or self-harm: acknowledge briefly, then surface crisis resources (988 Suicide & Crisis Lifeline in US, Crisis Text Line 741741, or "your local equivalent"). Encourage reaching out to a provider. Stop the casual conversation; be direct and warm.
- Severe symptoms (heavy bleeding past 7 days, severe pain, fever with period, fainting, sudden change in cycle): acknowledge and gently suggest seeing a doctor. Don't catastrophise.
- Pregnancy / TTC: be honest that an app's role is limited; recommend an OB-GYN.

Always end interactions feeling lighter, not heavier. Be brief — under 80 words per reply unless context truly demands more.

Tone reference (these match Luna's voice elsewhere in the app):
- "Cramps are real biology, not a personality flaw."
- "Rest is the work this week."
- "Your body is doing something quiet and demanding."
- "What are you longing for this week?"

Never use the words "should" or "must". Never reference being an AI unless directly asked.`

function dailyThoughtUserPrompt(ctx: any): string {
  const phaseName = ctx?.phase_name || 'cycle'
  const cycleDay = ctx?.cycle_day || '?'
  const cycleLen = ctx?.cycle_length || 28
  const hour = ctx?.hour ?? new Date().getUTCHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  // Pattern summary is a derived, qualitative string from the client
  // (e.g. "tends toward low mood and cramps in late luteal; cycles
  // steady"). NEVER contains raw logs / dates / identifiers. When
  // present, lets the reflection root in patterns the user actually
  // lives. When absent, fall back to the un-personalised prompt so
  // first-cycle users still get a clean reflection.
  const patternSummary = (ctx?.pattern_summary || '').toString().trim()
  const patternLine = patternSummary
    ? `Her cycle pattern, observed across her own tracking: ${patternSummary}. Let it shape the reflection only if it genuinely fits.`
    : ''
  return `Generate ONE short reflection — 1–2 sentences max, ending in a question or open invitation — for a woman in her ${phaseName} phase, day ${cycleDay} of ${cycleLen}, this ${timeOfDay}.

${patternLine}

Topic should be one of: cycle-aware self-care, mental health in hormonal context, body literacy, embodied presence, emotional acceptance, the meaning of small daily acts.

Do not say "you should" or "you must". Do not begin with "Today" or "It's day ${cycleDay}". Do not echo the phase name — just write the thought. Output the reflection only — no preamble, no explanation, no quotes.`
}

function chatSystemAddition(ctx: any): string {
  const phase = ctx?.phase_name ? `Currently in their ${ctx.phase_name} phase, day ${ctx.cycle_day} of ${ctx.cycle_length}.` : ''
  const patternSummary = (ctx?.pattern_summary || '').toString().trim()
  const patternLine = patternSummary
    ? `Her cycle pattern, derived from her own tracking: ${patternSummary}. Let it shape what you say only when it genuinely fits.`
    : ''
  return `CONVERSATION MODE. Listen first. Reply in 1–3 sentences. The user opened this conversation from a reflection prompt; meet them where they are. ${phase} ${patternLine}`.trim()
}

interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string
}

async function callAnthropic(
  messages: AnthropicMessage[],
  system: string,
  model: string,
  maxTokens = 200,
): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages,
    }),
  })
  if (!res.ok) {
    // Do not reflect an upstream response body to the client; provider
    // diagnostics can contain request metadata that users should not see.
    throw new Error(`Anthropic request failed (${res.status})`)
  }
  const json = await res.json()
  return json.content?.[0]?.text?.trim() || ''
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const contentLength = Number(req.headers.get('content-length') || 0)
    if (contentLength > 50000) {
      return new Response(JSON.stringify({ error: 'Request too large' }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Sign in required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify the user via their JWT — confirms they're a real signed-in
    // user before we spend any tokens on their behalf.
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => ({}))
    const mode = body.mode || 'daily-thought'
    const context = sanitizeContext(body.context || {})

    let reply = ''
    let modelUsed = ''
    if (mode === 'daily-thought') {
      modelUsed = ANTHROPIC_MODEL_DAILY_THOUGHT
      reply = await callAnthropic(
        [{ role: 'user', content: dailyThoughtUserPrompt(context) }],
        SYSTEM_PROMPT,
        modelUsed,
        120,
      )
    } else if (mode === 'chat') {
      const messages: AnthropicMessage[] = Array.isArray(body.messages)
        ? body.messages.slice(-12).flatMap((message: any) => {
          if ((message?.role !== 'user' && message?.role !== 'assistant') || typeof message?.content !== 'string') return []
          const content = message.content.trim().slice(0, MAX_MESSAGE_CHARS)
          return content ? [{ role: message.role, content } as AnthropicMessage] : []
        })
        : []
      if (messages.length === 0) {
        return new Response(JSON.stringify({ error: 'Missing messages' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      // Hard cap conversation length to prevent runaway cost.
      modelUsed = ANTHROPIC_MODEL_CHAT
      reply = await callAnthropic(
        messages,
        `${SYSTEM_PROMPT}\n\n${chatSystemAddition(context)}`,
        modelUsed,
        220,
      )
    } else {
      return new Response(JSON.stringify({ error: 'Unknown mode' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ text: reply, model: modelUsed }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Luna could not respond right now' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
