import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Render serves a static site from the root, so no `base` override is needed.
// (GitHub Pages would need base: '/InstaRoad-static/' — see docs/demo_hosting_plan.md §5.)
export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist', sourcemap: false },
})
