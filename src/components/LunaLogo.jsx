export default function LunaLogo({ width = 200 }) {
  return <img src={`${import.meta.env.BASE_URL}brand/luna-transparent.png`} alt="Luna" width={width} height={width * 777 / 2023} style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
}
