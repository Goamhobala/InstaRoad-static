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
  // Every arm is the seed that scored best on the corrected test bench
  // (pooled F1 over test chips); rl4 is its epoch-50 LP-FT snapshot.
  // windowPx is a HARD constraint, not a preference: the +HC arms carry
  // SEN2SR's FFT mask, which pins the input to 128 px, and a selection must be
  // an exact multiple of the window or the Space rejects it.
  r0: {
    label: 'r0 — bicubic ×4 + U-Net',
    blurb: 'No learned super-resolution at all: a plain bicubic upsample read '
         + 'by a ResNet34 U-Net. The reference every other arm is measured against.',
    head: 'ResNet34 U-Net · 281 tensors',
    windowPx: 256,
    theta: 0.75,
    ready: true,
  },
  r1a: {
    label: 'r1a — frozen SEN2SR + U-Net (+HC)',
    blurb: 'SEN2SR-Lite ×4 kept exactly as pretrained, FFT hard constraint on. '
         + 'Isolates what pretrained super-resolution alone is worth.',
    head: 'ResNet34 U-Net · 486 tensors',
    windowPx: 128,
    theta: 0.70,
    ready: true,
  },
  r1b: {
    label: 'r1b — frozen SEN2SR + U-Net (bare)',
    blurb: 'The same frozen SEN2SR-Lite with the hard constraint off, so the '
         + 'generator is free to move the low frequencies.',
    head: 'ResNet34 U-Net · 485 tensors',
    windowPx: 256,
    theta: 0.75,
    ready: true,
  },
  r2a: {
    label: 'r2a — joint SEN2SR + U-Net (+HC)',
    blurb: 'SEN2SR-Lite ×4 fine-tuned jointly with a ResNet34 U-Net under the '
         + 'segmentation loss. FFT hard constraint on (native).',
    head: 'ResNet34 U-Net · 486 tensors',
    windowPx: 128,
    theta: 0.75,
    ready: true,
  },
  r2b: {
    label: 'r2b — joint SEN2SR + U-Net (bare)',
    blurb: 'The same joint fine-tuning without the hard constraint: the task '
         + 'loss may rewrite the whole spectrum, not just the detail.',
    head: 'ResNet34 U-Net · 485 tensors',
    windowPx: 256,
    theta: 0.75,
    ready: true,
  },
  r3a: {
    label: 'r3a — frozen SR4RS + U-Net (+HC)',
    blurb: 'SR4RS, a GAN super-resolver, kept frozen with SEN2SR’s hard '
         + 'constraint mounted on top of it.',
    head: 'ResNet34 U-Net · 372 tensors',
    windowPx: 128,
    theta: 0.70,
    ready: true,
  },
  r3b: {
    label: 'r3b — frozen SR4RS + U-Net (bare)',
    blurb: 'Frozen SR4RS as shipped. Sharper than SEN2SR-Lite, and more willing '
         + 'to invent detail that is not there.',
    head: 'ResNet34 U-Net · 371 tensors',
    windowPx: 256,
    theta: 0.70,
    ready: true,
  },
  r4a: {
    label: 'r4a — joint SR4RS + U-Net (+HC)',
    blurb: 'SR4RS fine-tuned jointly with the U-Net, held to the low '
         + 'frequencies of the input by the hard constraint.',
    head: 'ResNet34 U-Net · 372 tensors',
    windowPx: 128,
    theta: 0.75,
    ready: true,
  },
  r4b: {
    label: 'r4b — joint SR4RS + U-Net (bare)',
    blurb: 'SR4RS fine-tuned jointly with no constraint. Best precision and '
         + 'APLS of the series, and its output drifts off the reflectance scale.',
    head: 'ResNet34 U-Net · 371 tensors',
    windowPx: 256,
    theta: 0.75,
    ready: true,
  },
  rl2: {
    label: 'rl2 — linear probe on SEN2SR',
    blurb: 'A 1×1 logistic head on jointly-trained SEN2SR-Lite. Two of its '
         + 'three seeds collapse to predicting road everywhere; shown as a '
         + 'negative result, not a competitive arm.',
    head: '1×1 conv · 4 weights + 1 bias',
    windowPx: 256,
    theta: 0.75,
    ready: true,
  },
  rl4: {
    label: 'rl4 — linear probe on SR4RS',
    blurb: 'A 1×1 logistic head reading roads straight out of SR4RS’s '
         + 'task-adapted detail. No decoder, no skip connections.',
    head: '1×1 conv · 4 weights + 1 bias',
    windowPx: 256,
    theta: 0.75,
    ready: true,
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
