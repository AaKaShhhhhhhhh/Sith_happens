/** Fixed player-color palette, in assignment order (matches CodeMafia's squares). */
export const PLAYER_COLORS = [
  '#e74c3c', // red
  '#3f8fd6', // blue
  '#4cbb5e', // green
  '#e6902a', // orange
  '#f1c40f', // yellow
  '#9b59b6', // purple
  '#1abc9c', // teal
  '#e84393', // pink
] as const

export const PLAYER_COLOR_NAMES = [
  'Red',
  'Blue',
  'Green',
  'Orange',
  'Yellow',
  'Purple',
  'Teal',
  'Pink',
] as const

export function colorForIndex(i: number): string {
  return PLAYER_COLORS[i % PLAYER_COLORS.length]
}
