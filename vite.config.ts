import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_URL
  if (!apiTarget) {
    throw new Error(
      'Define VITE_API_URL en .env con la URL del backend (por ejemplo http://localhost:3333).',
    )
  }

  return {
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  // Impide que Vite cargue un postcss.config / Tailwind 3 de fuera del repo.
  // Eso dispara: "@layer base is used but no matching @tailwind base directive is present".
  css: {
    postcss: {
      plugins: [],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/__transmit': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
}
})
