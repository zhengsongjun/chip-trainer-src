import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import svgLoader from 'vite-svg-loader'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    svgLoader({
      svgo: true,
      svgoConfig: {
        plugin: [
          {
            name: 'removeDimensions',
            active: true,
          },
          {
            name: 'prefixIds',
            params: {
              prefix: (_node, { path: filePath }) => path.basename(filePath, '.svg') + '-',
            },
            active: true,
          },
          {
            name: 'removeViewBox',
            active: false,
          },
        ],
      },
    }),
    vueJsx(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  base: '/chip-trainer/',
})
