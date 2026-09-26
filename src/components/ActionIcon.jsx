// One static, legible icon family. Labels carry the meaning; icons are decorative.
export default function ActionIcon({ name, size = 22 }) {
  const shapes = {
    share: <><path d="M12 15V3m-4 4 4-4 4 4"/><path d="M7 11H5v10h14V11h-2"/></>,
    conditions: <><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/></>,
    library: <><path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1v15"/></>,
    cheatsheet: <><rect x="5" y="4" width="14" height="17" rx="3"/><path d="M9 3h6v4H9zM9 12h6m-6 4h4"/></>,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">{shapes[name] || shapes.cheatsheet}</svg>
}
