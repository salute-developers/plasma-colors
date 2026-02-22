# Plasma Color Finder

A small web app to choose colors for design: pick from the company (Plasma) palette or enter your own color in **hex** or **rgba** and get **3–5 nearest standard colors** from the palette.

## Stack

- **TypeScript**, **React**, **Vite**
- Palette: Plasma Design System `general` palette (from `salute-developers/plasma`)

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Usage

1. **Company palette** — Scroll the page to see all palette families (red, orange, blue, gray, etc.). Click a swatch to select it and fill the custom input with that hex.
2. **Your color** — Type a color in the input:
   - **Hex:** `#FF293E`, `#F31`, `#FF293EAA`
   - **RGBA:** `rgba(255, 41, 62, 1)` or `rgb(255, 41, 62)`
3. **Recommendations** — As soon as the input is valid, the app shows the **5 nearest** palette colors (by RGB distance). Click a recommendation to **copy** its hex to the clipboard.

## Build

```bash
npm run build
```

Output is in `dist/`.
