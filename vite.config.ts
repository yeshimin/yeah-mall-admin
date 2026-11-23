import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue(),
      vueDevTools(),
    ],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://127.0.0.1:8080',
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined
            }
            const match = id.replace(/\\/g, '/').match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/)
            const pkg = match?.[1] || ''
            if (pkg === '@vueup/vue-quill' || pkg === 'quill') {
              return 'vendor-editor'
            }
            if (pkg === '@element-plus/icons-vue') {
              return 'vendor-icons'
            }
            if (pkg === 'element-plus') {
              return 'vendor-element'
            }
            if (pkg === 'vue' || pkg === 'vue-router' || pkg === 'pinia' || pkg.startsWith('@vue/')) {
              return 'vendor-vue'
            }
            return 'vendor'
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
  }
})
