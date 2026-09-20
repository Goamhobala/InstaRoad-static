# InstaRoad — static demo UI

Front end for the InstaRoad demo. Pure static: it holds no models and runs no
inference. It reads manifests from `public/data/`, RGB chips from the Hugging
Face dataset CDN, and calls a ZeroGPU Space for predictions.

    npm install
    npm run dev          # http://localhost:5173
    npm run build        # -> dist/

Render static site config:

| Setting | Value |
|---|---|
| Build command | `npm ci && npm run build` |
| Publish directory | `dist` |

## Why the browser calls the Space directly

ZeroGPU bills its daily quota to the *caller*, not the Space owner. Proxying
inference through a server would spend one token's 5 min/day on every visitor
combined; calling from the browser spends each visitor's own allowance.

See `docs/demo_hosting_plan.md` in the parent repo for the full design.
