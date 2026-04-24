import { defineConfig } from 'vite'
// import { devtools } from '@tanstack/devtools-vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import {tanstackRouter} from '@tanstack/router-plugin/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [tailwindcss(), tanstackRouter(), viteReact()],
  base: process.env.VITE_BASE_PATH || "traffic-analysis-map",
})

export default config
