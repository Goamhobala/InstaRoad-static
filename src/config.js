// Deployment wiring. Everything here is overridable at build time so the same
// tree runs against a local dev copy of the data or the published CDN.

export const HF_USER = 'Goamhobala'
export const DATASET  = import.meta.env.VITE_DATASET ?? `${HF_USER}/instaroad-rosa-tiles`
export const SPACE    = import.meta.env.VITE_SPACE   ?? `${HF_USER}/instaroad-demo`

// RGB chips come from the dataset CDN, NOT from this repo: 1247 chips are
// ~106 MB, which would bloat every Render build and spend Render's included
// bandwidth on bytes Hugging Face already serves for free. The dataset repo
// must be PUBLIC for these to load unauthenticated.
export const chipUrl = (cellId) =>
  import.meta.env.VITE_CHIP_BASE
    ? `${import.meta.env.VITE_CHIP_BASE}/${cellId}.jpg`
    : `https://huggingface.co/datasets/${DATASET}/resolve/main/chips/${cellId}.jpg`

export const ATOM_PX = 128        // r2a's forced SEN2SR window
export const TILE_PX = 512        // the stored unit
export const SIZES   = [128, 256, 512, 1024]

export const MODELS = {
  r2a: {
    label: 'r2a — joint SEN2SR + U-Net',
    blurb: 'SEN2SR-Lite ×4 fine-tuned jointly with a ResNet34 U-Net under the '
         + 'segmentation loss. FFT hard constraint on (native).',
    head: 'ResNet34 U-Net · 278 tensors',
    windowPx: 128,
    theta: 0.70,
    ready: true,
  },
  rl4: {
    label: 'rl4 — linear probe on SR4RS',
    blurb: 'A 1×1 logistic head reading roads straight out of SR4RS’s '
         + 'task-adapted detail. No decoder, no skip connections.',
    head: '1×1 conv · 4 weights + 1 bias',
    windowPx: 256,
    theta: null,                  // pending the val sweep
    ready: false,
  },
}

export const SPLIT_STYLE = {
  test:  { color: '#2196f3', label: 'held out (test)',  weight: 2,   fill: 0.18 },
  val:   { color: '#9c7bd8', label: 'validation',       weight: 1.5, fill: 0.10 },
  train: { color: '#6b7280', label: 'seen in training', weight: 1,   fill: 0.05 },
}

export const BASEMAP = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}
