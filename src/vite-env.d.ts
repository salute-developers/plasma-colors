/// <reference types="vite/client" />

declare module 'culori' {
  export function parseHex(color: string): { mode: string; r: number; g: number; b: number } | undefined
  export function differenceEuclidean(mode?: string): (a: unknown, b: unknown) => number
}
