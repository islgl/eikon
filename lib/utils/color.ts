// SVG color manipulation utilities

export function applyColorToSvg(svgContent: string, color: string): string {
  // Replace fill and stroke colors, preserving 'none' values
  return svgContent
    .replace(/fill="(?!none)[^"]*"/g, `fill="${color}"`)
    .replace(/stroke="(?!none)[^"]*"/g, `stroke="${color}"`)
    .replace(/fill:\s*(?!none)[^;"]*/g, `fill: ${color}`)
    .replace(/stroke:\s*(?!none)[^;"]*/g, `stroke: ${color}`)
}

export function applyFillToSvg(svgContent: string, color: string): string {
  return svgContent
    .replace(/fill="(?!none)[^"]*"/g, `fill="${color}"`)
    .replace(/fill:\s*(?!none)[^;"]*/g, `fill: ${color}`)
}

export function applyStrokeToSvg(svgContent: string, color: string): string {
  return svgContent
    .replace(/stroke="(?!none)[^"]*"/g, `stroke="${color}"`)
    .replace(/stroke:\s*(?!none)[^;"]*/g, `stroke: ${color}`)
}

export const TAG_COLORS = [
  { name: 'gray', bg: '#F3F4F6', text: '#6B7280' },
  { name: 'red', bg: '#FEE2E2', text: '#DC2626' },
  { name: 'orange', bg: '#FFEDD5', text: '#EA580C' },
  { name: 'yellow', bg: '#FEF9C3', text: '#CA8A04' },
  { name: 'green', bg: '#DCFCE7', text: '#16A34A' },
  { name: 'teal', bg: '#CCFBF1', text: '#0D9488' },
  { name: 'blue', bg: '#DBEAFE', text: '#2563EB' },
  { name: 'indigo', bg: '#E0E7FF', text: '#4F46E5' },
  { name: 'purple', bg: '#F3E8FF', text: '#9333EA' },
  { name: 'pink', bg: '#FCE7F3', text: '#DB2777' },
]

export function getTagColor(colorName: string) {
  return TAG_COLORS.find((c) => c.name === colorName) ?? TAG_COLORS[0]
}
