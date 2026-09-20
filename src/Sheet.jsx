import { chipUrl, TILE_PX } from './config'

/**
 * The 5x5 sheet for one site. Each cell is a stored 512 px tile; when the
 * chosen size is smaller, the tile is subdivided into a (512/size)^2 lattice.
 *
 * No legality is computed here. `selections.json` ships the legal set --
 * see demo/build_selections.py for why the arithmetic lives server-side.
 */
export default function Sheet({ site, cells, sel, size, anchors1024, onPick }) {
  const rows = Math.max(...site.rows) + 1
  const cols = Math.max(...site.cols) + 1
  const n = size >= TILE_PX ? 1 : TILE_PX / size       // sub-cells per axis
  const anchorSet = new Set(anchors1024.map(([r, c]) => `${r}_${c}`))

  // For 1024 a selection covers the anchor tile and its three neighbours.
  const covered = (r, c) => {
    if (!sel) return false
    if (size === 1024) return r >= sel.row && r <= sel.row + 1 && c >= sel.col && c <= sel.col + 1
    return r === sel.row && c === sel.col
  }

  return (
    <div className="sheet" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: rows * cols }, (_, i) => {
        const r = Math.floor(i / cols), c = i % cols
        const cell = cells[`${r}_${c}`]
        if (!cell) return <div key={i} className="cell missing" title="no tile here (QC)" />

        const legal = size === 1024 ? anchorSet.has(`${r}_${c}`) : true
        const isSel = covered(r, c)
        return (
          <button
            key={i}
            className={`cell${isSel ? ' sel' : ''}`}
            disabled={!legal}
            title={legal ? cell.id : 'a 1024 block here would span a missing tile'}
            style={{ backgroundImage: `url(${chipUrl(cell.id)})`, opacity: legal ? 1 : .35 }}
            onClick={() => legal && onPick({ row: r, col: c, subRow: 0, subCol: 0 })}
          >
            {n > 1 && (
              <span className="sub" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
                {Array.from({ length: n * n }, (_, j) => {
                  const sr = Math.floor(j / n), sc = j % n
                  const on = isSel && sel.subRow === sr && sel.subCol === sc
                  return (
                    <i
                      key={j}
                      className={on ? 'on' : ''}
                      onClick={(e) => {
                        e.stopPropagation()
                        onPick({ row: r, col: c, subRow: sr, subCol: sc })
                      }}
                      style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                    />
                  )
                })}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
