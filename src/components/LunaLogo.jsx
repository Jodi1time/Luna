export default function LunaLogo({ width = 200 }) {
  return <img src={`${import.meta.env.BASE_URL}brand/luna-rounded.png`} alt="Luna" width={width} height={width / 2} style={{ display: 'block', maxWidth: '100%', height: 'auto', borderRadius: 12 }} />
}
