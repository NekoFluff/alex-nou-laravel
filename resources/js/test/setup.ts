/**
 * Shared test setup.
 *
 * IndexedDB is polyfilled because happy-dom does not provide it, and without it
 * `readCache` silently returns null — every test would run as a cold load and the whole
 * cache-and-revalidate path would go unexercised. That gap is exactly how a bug where a
 * page refresh re-downloaded the subject catalogue slipped through.
 *
 * happy-dom has no working canvas, and ApexCharts measures its container on mount. A
 * minimal 2D context stub keeps chart-bearing components mountable in tests; the stub
 * carries a back-reference to its own canvas because several libraries bail out
 * entirely when `context.canvas` is null.
 */

// A real in-memory IndexedDB, installed before anything touches the cache layer.
import 'fake-indexeddb/auto'

export {}

if (typeof HTMLCanvasElement !== 'undefined') {
    function createContext(canvas: HTMLCanvasElement): unknown {
        const gradient = { addColorStop: () => undefined }
        return {
            canvas,
            clearRect: () => undefined,
            fillRect: () => undefined,
            strokeRect: () => undefined,
            fillText: () => undefined,
            strokeText: () => undefined,
            beginPath: () => undefined,
            closePath: () => undefined,
            moveTo: () => undefined,
            lineTo: () => undefined,
            bezierCurveTo: () => undefined,
            quadraticCurveTo: () => undefined,
            arc: () => undefined,
            rect: () => undefined,
            stroke: () => undefined,
            fill: () => undefined,
            clip: () => undefined,
            save: () => undefined,
            restore: () => undefined,
            resetTransform: () => undefined,
            setTransform: () => undefined,
            translate: () => undefined,
            rotate: () => undefined,
            scale: () => undefined,
            setLineDash: () => undefined,
            getLineDash: () => [],
            measureText: () => ({ width: 0 }),
            createLinearGradient: () => gradient,
            createRadialGradient: () => gradient,
            getImageData: () => ({ data: [] }),
            putImageData: () => undefined,
        }
    }

    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
        configurable: true,
        writable: true,
        value: function (this: HTMLCanvasElement) {
            return createContext(this)
        },
    })

    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 640 })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 320 })
}

if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class {
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
    } as unknown as typeof ResizeObserver
}

if (typeof globalThis.matchMedia === 'undefined') {
    globalThis.matchMedia = (() => ({
        matches: false,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
    })) as unknown as typeof matchMedia
}
