import sharp from 'sharp'
import { writeFileSync } from 'fs'

const W = 1200
const H = 630

const platforms = [
  { name: 'Spacelift',        color: '#4B6BFF' },
  { name: 'Env0',             color: '#00B389' },
  { name: 'Scalr',            color: '#8B5CF6' },
  { name: 'Terrateam',        color: '#06B6D4' },
  { name: 'Terramate Cloud',  color: '#F97316' },
  { name: 'HCP Terraform',    color: '#7C3AED' },
  { name: 'OpenTaco',         color: '#10B981' },
]

// Rough char width for Ubuntu/sans-serif at given font-size
function chipWidth(name, fontSize = 15) {
  return Math.round(name.length * fontSize * 0.62) + 40
}

function chip(x, y, name, color) {
  const w = chipWidth(name)
  const h = 38
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"
      fill="${color}" fill-opacity="0.12"
      stroke="${color}" stroke-width="1.2" stroke-opacity="0.5"/>
    <text x="${x + 20}" y="${y + 25}"
      font-family="Ubuntu, Liberation Sans, Arial, sans-serif"
      font-size="15" font-weight="700" fill="${color}">${name}</text>`
}

// Layout chips into rows
const GAP = 12
const ROW_H = 50
const START_X = 60
const START_Y = 380
const MAX_X = W - 60

let cx = START_X, cy = START_Y
let chipsHtml = ''
for (const p of platforms) {
  const w = chipWidth(p.name)
  if (cx + w > MAX_X) { cx = START_X; cy += ROW_H }
  chipsHtml += chip(cx, cy, p.name, p.color)
  cx += w + GAP
}

const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="0.8" fill="#1E293B"/>
    </pattern>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0B0F19"/>
      <stop offset="100%" stop-color="#060912"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#fade)"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>

  <!-- Left teal accent bar -->
  <rect x="60" y="60" width="5" height="90" rx="2.5" fill="#22D3EE"/>

  <!-- Brand: tacos -->
  <text x="82" y="132"
    font-family="Ubuntu, Liberation Sans, Arial, sans-serif"
    font-size="72" font-weight="700" fill="#F1F5F9" letter-spacing="-1">tacos</text>
  <!-- Brand: .guru in teal -->
  <text x="82" y="195"
    font-family="Ubuntu, Liberation Sans, Arial, sans-serif"
    font-size="40" font-weight="300" fill="#22D3EE" letter-spacing="1">.guru</text>

  <!-- Divider -->
  <rect x="60" y="225" width="${W - 120}" height="1" fill="#1E293B"/>

  <!-- Tagline -->
  <text x="60" y="282"
    font-family="Ubuntu, Liberation Sans, Arial, sans-serif"
    font-size="26" font-weight="600" fill="#E2E8F0">
    Compare TACOS platforms for your IaC stack.
  </text>
  <text x="60" y="322"
    font-family="Ubuntu, Liberation Sans, Arial, sans-serif"
    font-size="20" font-weight="400" fill="#64748B">
    Adjust criteria weights · Estimate monthly costs · Pick the right tool
  </text>

  <!-- Platform chips -->
  ${chipsHtml}

  <!-- Footer bar -->
  <rect x="0" y="${H - 56}" width="${W}" height="56" fill="#050810"/>
  <rect x="0" y="${H - 57}" width="${W}" height="1" fill="#1E293B"/>

  <!-- Footer: left — stats -->
  <text x="60" y="${H - 20}"
    font-family="Ubuntu, Liberation Sans, Arial, sans-serif"
    font-size="16" font-weight="600" fill="#22D3EE">7 platforms</text>
  <text x="185" y="${H - 20}"
    font-family="Ubuntu, Liberation Sans, Arial, sans-serif"
    font-size="16" fill="#334155">·</text>
  <text x="200" y="${H - 20}"
    font-family="Ubuntu, Liberation Sans, Arial, sans-serif"
    font-size="16" font-weight="600" fill="#22D3EE">21 criteria</text>
  <text x="315" y="${H - 20}"
    font-family="Ubuntu, Liberation Sans, Arial, sans-serif"
    font-size="16" fill="#334155">·</text>
  <text x="330" y="${H - 20}"
    font-family="Ubuntu, Liberation Sans, Arial, sans-serif"
    font-size="16" font-weight="600" fill="#22D3EE">Pricing calculator</text>

  <!-- Footer: right — domain -->
  <text x="${W - 60}" y="${H - 20}"
    font-family="Ubuntu, Liberation Sans, Arial, sans-serif"
    font-size="16" fill="#475569" text-anchor="end">tacos.guru</text>
</svg>`

const png = await sharp(Buffer.from(svg)).png().toBuffer()
writeFileSync('public/og.png', png)
console.log(`✓ Generated public/og.png (${png.length} bytes)`)
