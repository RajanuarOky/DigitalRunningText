import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    legacy({
      targets: ['defaults', 'not IE 11', 'Android >= 5', 'Chrome >= 49'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
    }),
  ],
})
