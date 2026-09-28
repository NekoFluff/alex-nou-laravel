import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

/**
 * Test config, kept separate from `vite.config.js` so the Laravel plugin (which expects
 * to build an app entry) is not involved in running unit tests.
 */
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./resources/js', import.meta.url)),
            // ApexCharts rejects asynchronously when it cannot find its container, which
            // happy-dom cannot provide. Swapped for a stub rather than fighting it.
            'vue3-apexcharts': fileURLToPath(
                new URL('./resources/js/test/stubs/vue3-apexcharts.ts', import.meta.url),
            ),
        },
    },
    test: {
        environment: 'happy-dom',
        globals: true,
        include: ['resources/js/**/*.test.ts'],
        setupFiles: ['./resources/js/test/setup.ts'],
    },
})
