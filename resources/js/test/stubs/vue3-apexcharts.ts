/**
 * Stand-in for `vue3-apexcharts` in tests.
 *
 * ApexCharts calls `render()` on a timer and rejects when it cannot find its container
 * element. Under happy-dom that surfaces as an *unhandled rejection* — invisible to the
 * test that caused it, and capable of failing an otherwise green run. Aliasing the module
 * (see `vitest.config.ts`) removes the library from the test environment entirely; the
 * charts themselves are third-party and not what these tests are checking.
 */
import { defineComponent, h } from 'vue'

export default defineComponent({
    name: 'VueApexCharts',
    props: {
        type: { type: String, required: false, default: '' },
        height: { type: [String, Number], required: false, default: 0 },
        options: { type: Object, required: false, default: () => ({}) },
        series: { type: [Array, Object], required: false, default: () => [] },
    },
    setup(props) {
        return () =>
            h('div', {
                class: 'apexcharts-stub',
                'data-chart-type': props.type,
                'data-series-count': String(Array.isArray(props.series) ? props.series.length : 0),
            })
    },
})
