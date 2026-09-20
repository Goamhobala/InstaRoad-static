import { useEffect, useMemo, useState } from 'react'
import SiteMap from './SiteMap'
import Sheet from './Sheet'
import { predict } from './spaceClient'
import { MODELS, SIZES, SPLIT_STYLE, TILE_PX } from './config'

const load = (f) => fetch(`${import.meta.env.BASE_URL}data/${f}`).then((r) => r.json())

/** ZeroGPU bills its daily quota to the CALLER, so an anonymous visitor gets a
 *  small allowance shared by IP. Exhausting it surfaces as a raw error string;
 *  say what actually happened instead of showing the visitor a stack trace. */
function humanError(e) {
  const s = String(e?.message ?? e ?? '')
  if (/ZeroGPU|quota|runs limit/i.test(s))
    return 'This Space\u2019s free GPU allowance for your network is used up for today. '
         + 'Signing in to Hugging Face raises it; otherwise it resets in 24 h.'
  if (/metadata could not be loaded|Failed to fetch/i.test(s))
    return 'Could not reach the inference Space \u2014 it may be asleep. Give it a minute and retry.'
  return s || 'Inference failed.'
}

export default function App() {
  const [data, setData] = useState(null)
  const [site, setSite] = useState(null)
  const [size, setSize] = useState(512)
  const [sel, setSel] = useState(null)
  const [model, setModel] = useState('r2a')
  const [busy, setBusy] = useState(false)
  const [out, setOut] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    Promise.all([load('sites.json'), load('cells.json'), load('selections.json')])
      .then(([sites, cells, selections]) => setData({ sites, cells, selections }))
      .catch((e) => setErr(`could not load manifests: ${e.message}`))
  }, [])

  // Default to a held-out site so the first thing a visitor sees is one the
  // models never trained on.
  useEffect(() => {
    if (data && !site) setSite(data.sites.find((s) => s.split === 'test') ?? data.sites[0])
  }, [data, site])

  useEffect(() => { setSel(null); setOut(null); setErr(null) }, [site, size])

  const anchors = useMemo(
    () => (site && data ? data.selections.sites[site.id].anchors_1024 : []),
    [site, data])

  // 1024 is the one size that can be illegal everywhere in a sparse sheet.
  const sizeLegal = (s) => s !== 1024 || anchors.length > 0

  async function run() {
    setBusy(true); setErr(null); setOut(null)
    try {
      setOut(await predict({ site: site.id, row: sel.row, col: sel.col, size, model,
                             subRow: sel.subRow, subCol: sel.subCol }))
    } catch (e) {
      setErr(humanError(e))
    } finally { setBusy(false) }
  }

  if (err && !data) return <div style={{ padding: 24 }}>{err}</div>
  if (!data) return <div style={{ padding: 24, color: '#9aa6c4' }}>loading manifests…</div>

  const m = MODELS[model]
  const st = site && SPLIT_STYLE[site.split]
  const groundKm = (size * 10) / 1000

  return (
    <div className="app">
      <header>
        <h1>InstaRoad</h1>
        <span className="sub">
          Road extraction from 10 m Sentinel-2, via learned super-resolution —
          60 sampling zones across South Africa
        </span>
      </header>

      <div className="main">
        <div className="mapwrap">
          <SiteMap sites={data.sites} selected={site} onSelect={setSite} />
        </div>

        <aside>
          {site && (
            <>
              <h2>
                {site.city ?? site.biome}{' '}
                <span className={`badge ${site.split}`}>{st.label}</span>
              </h2>
              <div className="meta">
                {site.biome} · {site.urbanisation} · {site.n_tiles} tiles ·{' '}
                {site.crs[0]}
              </div>

              <section>
                <label>Selection size</label>
                <div className="row">
                  {SIZES.map((s) => (
                    <button key={s} aria-pressed={size === s} disabled={!sizeLegal(s)}
                            onClick={() => setSize(s)}
                            title={sizeLegal(s) ? '' : 'no complete 2×2 tile block in this sheet'}>
                      {s}² <span style={{ color: 'var(--muted)' }}>· {(s * 10) / 1000} km</span>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <label>
                  Sheet — {Math.max(...site.rows) + 1}×{Math.max(...site.cols) + 1} tiles
                  {size < TILE_PX && ` · click a sub-cell`}
                </label>
                <Sheet site={site} cells={data.cells[site.id]} sel={sel} size={size}
                       anchors1024={anchors} onPick={setSel} />
                <div className="legend" style={{ marginTop: 8 }}>
                  <span><i style={{ background: 'var(--blue)' }} />selected</span>
                  <span><i style={{ background: '#141b33' }} />no tile (QC)</span>
                </div>
              </section>

              <section>
                <label>Model</label>
                <div className="row">
                  {Object.entries(MODELS).map(([k, v]) => (
                    <button key={k} aria-pressed={model === k} disabled={!v.ready}
                            onClick={() => setModel(k)}
                            title={v.ready ? '' : 'θ* pending — not yet servable'}>
                      {k}
                    </button>
                  ))}
                </div>
                <div className="note" style={{ marginTop: 7 }}>
                  <strong>{m.label}</strong><br />{m.blurb}<br />
                  <kbd>{m.head}</kbd>{' '}
                  <kbd>window {m.windowPx}px</kbd>{' '}
                  <kbd>θ* {m.theta ?? '—'}</kbd>
                </div>
              </section>

              <section>
                <button className="run" disabled={!sel || busy} onClick={run}>
                  {busy ? 'running on ZeroGPU…'
                        : sel ? `Run ${model} on ${groundKm} km²` : 'Pick a cell'}
                </button>
                {site.split !== 'test' && (
                  <div className="note warn" style={{ marginTop: 8 }}>
                    This site was {site.split === 'train' ? 'used to train' : 'used to validate'} the
                    models. Predictions here are not evidence of generalisation.
                  </div>
                )}
                {err && <div className="note warn" style={{ marginTop: 8 }}>{err}</div>}
              </section>

              {out && (
                <section className="results">
                  <figure style={{ margin: 0 }}>
                    <img src={out.sr} alt="super-resolved" />
                    <figcaption>super-resolved 2.5 m — what the head actually saw</figcaption>
                  </figure>
                  <figure style={{ margin: 0 }}>
                    <img src={out.overlay} alt="prediction overlay" />
                    <figcaption>prediction at θ* = {m.theta}</figcaption>
                  </figure>
                </section>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
