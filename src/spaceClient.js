// Thin wrapper over the ZeroGPU Space.
//
// The browser calls the Space DIRECTLY and deliberately: ZeroGPU bills its
// daily quota to whoever makes the call, so routing inference through a server
// would make one token's allowance the ceiling for every visitor combined.
// Called from here, each visitor spends their own.
//
// The request carries a CELL ID, never pixels. The Space holds its own copy of
// the imagery; a selection is at most a few dozen bytes on the wire.

import { Client } from '@gradio/client'
import { SPACE } from './config'

let clientPromise = null

function client() {
  if (!clientPromise) {
    clientPromise = Client.connect(SPACE).catch((e) => {
      clientPromise = null                 // let a later attempt retry a cold Space
      throw e
    })
  }
  return clientPromise
}

/**
 * ARITY IS LOAD-BEARING. The Space's /predict takes SEVEN positional inputs
 * (site, row, col, size, arm, sub_row, sub_col). Passing five throws a bare
 * `Error: TypeError` from @gradio/client with no indication of the cause --
 * it reads exactly like a network failure, which is what it was mistaken for.
 * Check `/gradio_api/info` if this list ever changes.
 *
 * @param {{site: string, row: number, col: number, size: number,
 *          model: string, subRow?: number, subCol?: number}} sel
 * Returns FIVE outputs: [sr, mask, overlay, gt, meta]. The overlay is
 * confusion-coloured against ground truth (green correct / blue missed /
 * red false alarm) whenever GT resolves, which it does for every cell.
 *
 * @returns {Promise<{sr: string, mask: string, overlay: string,
 *                    gt: string|null, meta: object}>}
 */
export async function predict(sel) {
  const app = await client()
  const r = await app.predict('/predict', [
    sel.site, sel.row, sel.col, sel.size, sel.model,
    sel.subRow ?? 0, sel.subCol ?? 0,
  ])
  const [sr, mask, overlay, gt, meta] = r.data
  const u = (x) => (x?.url ?? x) || null
  return { sr: u(sr), mask: u(mask), overlay: u(overlay), gt: u(gt), meta }
}

export async function wake() {
  try { await client(); return true } catch { return false }
}
