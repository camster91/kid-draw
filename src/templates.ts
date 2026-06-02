// Kid-friendly templates — simple SVG outlines kids can colour in.
// Each template is a base64 data URL for a black-on-white outline so the
// canvas can be loaded as an image and traced over.

export type Template = {
  id: string
  label: string // emoji label for the picker
  svg: string
}

const outline = (paths: string, w = 800, h = 800): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">` +
  `<rect width="${w}" height="${h}" fill="#ffffff"/>` +
  `<g fill="none" stroke="#1a1a1a" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">` +
  paths +
  `</g></svg>`

export const TEMPLATES: Template[] = [
  {
    id: 'blank',
    label: '✨',
    svg: outline(''),
  },
  {
    id: 'cat',
    label: '🐱',
    svg: outline(`
      <path d="M260 360 L300 220 L380 320 Q400 340 420 320 L500 220 L540 360 Q570 460 510 530 Q440 590 400 580 Q360 590 290 530 Q230 460 260 360 Z" />
      <ellipse cx="350" cy="410" rx="14" ry="18" fill="#fff" stroke="#1a1a1a" stroke-width="6" />
      <ellipse cx="450" cy="410" rx="14" ry="18" fill="#fff" stroke="#1a1a1a" stroke-width="6" />
      <circle cx="350" cy="412" r="6" fill="#1a1a1a" />
      <circle cx="450" cy="412" r="6" fill="#1a1a1a" />
      <path d="M380 470 Q400 490 420 470" />
    `),
  },
  {
    id: 'fish',
    label: '🐟',
    svg: outline(`
      <path d="M150 400 Q300 250 550 400 Q300 550 150 400 Z" />
      <path d="M550 400 L650 320 L650 480 Z" />
      <circle cx="320" cy="370" r="14" fill="#222"/>
      <path d="M250 430 Q300 460 350 430" />
      <path d="M300 430 Q330 380 360 430 Q330 470 300 430 Z" />
      <path d="M400 430 Q430 380 460 430 Q430 470 400 430 Z" />
    `),
  },
  {
    id: 'flower',
    label: '🌸',
    svg: outline(`
      <circle cx="400" cy="300" r="50" />
      <ellipse cx="400" cy="200" rx="60" ry="80" />
      <ellipse cx="400" cy="400" rx="60" ry="80" />
      <ellipse cx="300" cy="300" rx="80" ry="60" />
      <ellipse cx="500" cy="300" rx="80" ry="60" />
      <ellipse cx="335" cy="235" rx="60" ry="80" transform="rotate(-45 335 235)" />
      <ellipse cx="465" cy="235" rx="60" ry="80" transform="rotate(45 465 235)" />
      <ellipse cx="335" cy="365" rx="60" ry="80" transform="rotate(45 335 365)" />
      <ellipse cx="465" cy="365" rx="60" ry="80" transform="rotate(-45 465 365)" />
      <path d="M400 400 L400 700" stroke-width="10" />
      <path d="M400 550 Q350 520 330 480" stroke-width="8" />
      <ellipse cx="320" cy="470" rx="40" ry="20" transform="rotate(-30 320 470)" />
    `),
  },
  {
    id: 'sun',
    label: '☀️',
    svg: outline(`
      <circle cx="400" cy="400" r="120" />
      <line x1="400" y1="200" x2="400" y2="260" stroke-width="10" />
      <line x1="400" y1="540" x2="400" y2="600" stroke-width="10" />
      <line x1="200" y1="400" x2="260" y2="400" stroke-width="10" />
      <line x1="540" y1="400" x2="600" y2="400" stroke-width="10" />
      <line x1="260" y1="260" x2="300" y2="300" stroke-width="10" />
      <line x1="500" y1="500" x2="540" y2="540" stroke-width="10" />
      <line x1="540" y1="260" x2="500" y2="300" stroke-width="10" />
      <line x1="260" y1="540" x2="300" y2="500" stroke-width="10" />
    `),
  },
  {
    id: 'house',
    label: '🏠',
    svg: outline(`
      <path d="M200 400 L400 220 L600 400" stroke-width="10" />
      <rect x="230" y="400" width="340" height="280" />
      <rect x="360" y="500" width="80" height="180" />
      <rect x="270" y="440" width="60" height="60" />
      <rect x="470" y="440" width="60" height="60" />
    `),
  },
  {
    id: 'star',
    label: '⭐',
    svg: outline(`
      <path d="M400 180 L470 360 L660 380 L510 510 L555 700 L400 590 L245 700 L290 510 L140 380 L330 360 Z" />
    `),
  },
  {
    id: 'butterfly',
    label: '🦋',
    svg: outline(`
      <path d="M400 250 Q280 180 220 280 Q180 400 280 460 Q360 480 400 420" />
      <path d="M400 250 Q520 180 580 280 Q620 400 520 460 Q440 480 400 420" />
      <path d="M400 250 Q260 360 240 500 Q280 600 400 560" />
      <path d="M400 250 Q540 360 560 500 Q520 600 400 560" />
      <ellipse cx="400" cy="420" rx="20" ry="120" />
      <circle cx="400" cy="230" r="20" />
      <line x1="400" y1="210" x2="370" y2="180" />
      <line x1="400" y1="210" x2="430" y2="180" />
      <circle cx="370" cy="180" r="6" />
      <circle cx="430" cy="180" r="6" />
    `),
  },
  {
    id: 'rocket',
    label: '🚀',
    svg: outline(`
      <path d="M400 120 Q360 200 360 460 L440 460 Q440 200 400 120 Z" />
      <circle cx="400" cy="260" r="30" />
      <path d="M360 380 L280 480 L360 460 Z" />
      <path d="M440 380 L520 480 L440 460 Z" />
      <path d="M380 460 L380 600 L360 600 L370 540 L350 580 L370 480" />
      <path d="M420 460 L420 600 L440 600 L430 540 L450 580 L430 480" />
    `),
  },
  {
    id: 'apple',
    label: '🍎',
    svg: outline(`
      <path d="M300 360 Q260 400 280 500 Q300 600 400 620 Q500 600 520 500 Q540 400 500 360 Q450 340 400 360 Q350 340 300 360 Z" />
      <path d="M400 360 Q400 280 420 240" stroke-width="8" />
      <path d="M420 280 Q460 260 480 240" stroke-width="6" />
      <ellipse cx="380" cy="420" rx="30" ry="20" transform="rotate(-30 380 420)" />
    `),
  },
  {
    id: 'heart',
    label: '💛',
    svg: outline(`
      <path d="M400 620 L180 400 Q140 340 180 280 Q240 220 320 260 Q360 280 400 320 Q440 280 480 260 Q560 220 620 280 Q660 340 620 400 Z" />
    `),
  },
  {
    id: 'cloud',
    label: '☁️',
    svg: outline(`
      <ellipse cx="300" cy="420" rx="120" ry="80" />
      <ellipse cx="500" cy="420" rx="160" ry="100" />
      <ellipse cx="400" cy="360" rx="120" ry="90" />
      <path d="M180 420 L180 500 L620 500 L620 420" />
    `),
  },
]

export function templateToDataUrl(t: Template): string {
  const encoded = encodeURIComponent(t.svg).replace(/'/g, '%27').replace(/"/g, '%22')
  return `data:image/svg+xml;charset=utf-8,${encoded}`
}
