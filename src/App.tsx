import { useMemo, useState, useCallback } from 'react'
import paletteGeneralData from './data/palette.json'
import paletteAdditionalData from './data/palette-additional.json'
import {
  parseColor,
  flattenPalette,
  findNearest,
  type DistanceMode,
} from './utils/color'
import './App.css'

export type PaletteSource = 'general' | 'additional'

const paletteGeneral = paletteGeneralData as Record<string, Record<string, string>>
const paletteAdditional = paletteAdditionalData as Record<string, Record<string, string>>
const flatPaletteGeneral = flattenPalette(paletteGeneral)
const flatPaletteAdditional = flattenPalette(paletteAdditional)
const RECOMMEND_COUNT = 5

function App() {
  const [customInput, setCustomInput] = useState('')
  const [selectedHex, setSelectedHex] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [distanceMode, setDistanceMode] = useState<DistanceMode>('rgb')
  const [paletteSource, setPaletteSource] = useState<PaletteSource>('general')

  const activePalette = paletteSource === 'general' ? paletteGeneral : paletteAdditional
  const flatPaletteActive = paletteSource === 'general' ? flatPaletteGeneral : flatPaletteAdditional

  const parsed = useMemo(() => parseColor(customInput), [customInput])
  const previewCss = parsed
    ? `rgb(${parsed.r}, ${parsed.g}, ${parsed.b})`
    : 'transparent'

  const recommendations = useMemo(() => {
    if (!parsed) return []
    return findNearest(flatPaletteActive, parsed, RECOMMEND_COUNT, distanceMode)
  }, [parsed, distanceMode, flatPaletteActive])

  const copyToClipboard = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }, [])

  return (
    <div className="app">
      <header className="header">
        <h1>Plasma Color Finder</h1>
        <p>Pick from the company palette or enter a custom color to get the nearest standard colors.</p>
      </header>

      <section className="custom-section">
        <h2>Your color (hex or rgba)</h2>
        <div className="mode-switcher">
          <span className="mode-label">Find nearest by:</span>
          <div className="mode-options" role="group" aria-label="Distance mode">
            <label className="mode-option">
              <input
                type="radio"
                name="distanceMode"
                value="rgb"
                checked={distanceMode === 'rgb'}
                onChange={() => setDistanceMode('rgb')}
              />
              <span>RGB</span>
            </label>
            <label className="mode-option">
              <input
                type="radio"
                name="distanceMode"
                value="oklch"
                checked={distanceMode === 'oklch'}
                onChange={() => setDistanceMode('oklch')}
              />
              <span>OKLCH</span>
            </label>
          </div>
          <p className="mode-hint">
            {distanceMode === 'rgb'
              ? 'Euclidean distance in RGB space.'
              : 'Perceptually uniform distance (OKLCH).'}
          </p>
        </div>
        <div className="input-row">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="#FF293E, rgba(255,41,62,1), or magenta"
            aria-label="Color input"
          />
          <div
            className="preview-swatch"
            style={{ background: previewCss }}
            title={previewCss}
          />
        </div>
        {customInput.trim() && !parsed && (
          <p className="error-msg">Enter a valid hex, rgba(r, g, b, a), or CSS color name (e.g. magenta).</p>
        )}
        {recommendations.length > 0 && (
          <div className="recommendations">
            <h3>Nearest palette colors</h3>
            <div className="recommendation-list">
              {recommendations.map(({ entry, distance }) => (
                <button
                  key={`${entry.family}-${entry.shade}`}
                  type="button"
                  className="recommendation-item"
                  onClick={() => copyToClipboard(entry.hex, `${entry.family}-${entry.shade}`)}
                  title={`Copy ${entry.hex}`}
                >
                  <div
                    className="recommendation-swatch"
                    style={{ background: entry.hex }}
                  />
                  <div className="recommendation-info">
                    <span className="name">{entry.family} {entry.shade}</span>
                    <span className="hex">{entry.hex}</span>
                    <span> · Δ ≈ {distanceMode === 'oklch' ? distance.toFixed(3) : Math.round(distance)}</span>
                    {copiedKey === `${entry.family}-${entry.shade}` && (
                      <span style={{ marginLeft: '0.5rem', color: '#0C9C0C', fontWeight: 600 }}>Copied!</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="palette-section">
        <div className="palette-section-header">
          <h2>Company palette</h2>
          <div className="palette-source-switcher" role="group" aria-label="Palette source">
            <label className="mode-option">
              <input
                type="radio"
                name="paletteSource"
                value="general"
                checked={paletteSource === 'general'}
                onChange={() => setPaletteSource('general')}
              />
              <span>General</span>
            </label>
            <label className="mode-option">
              <input
                type="radio"
                name="paletteSource"
                value="additional"
                checked={paletteSource === 'additional'}
                onChange={() => setPaletteSource('additional')}
              />
              <span>Additional</span>
            </label>
          </div>
        </div>
        <p style={{ margin: '0 0 1rem 0', color: '#666', fontSize: '0.9rem' }}>
          Click a swatch to select; click a recommendation above to copy its hex. Nearest colors use the selected palette.
        </p>
        <div className="palette-families">
          {Object.entries(activePalette).map(([family, shades]) => (
            <div key={family} className="palette-family">
              <div className="palette-family-name">{family}</div>
              <div className="palette-shades">
                {Object.entries(shades).map(([shade, hex]) => (
                  <button
                    key={shade}
                    type="button"
                    className={`palette-swatch ${selectedHex === hex ? 'selected' : ''}`}
                    style={{ background: hex }}
                    title={`${family} ${shade} — ${hex}`}
                    onClick={() => {
                      setSelectedHex(hex)
                      setCustomInput(hex)
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default App
