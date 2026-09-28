/**
 * Tooltip geometry.
 *
 * These assert the arithmetic that keeps a tooltip readable: a "?" near the top of a
 * card must flip below, and one near either edge must be clamped inside the viewport.
 * The bug they guard against was silent — the tooltip rendered, just clipped.
 */
import { describe, expect, it } from 'vitest'
import { computeTooltipPlacement, type AnchorRect } from '@/domain/tooltipPlacement'

const VIEWPORT = { width: 1024, height: 768 }
const WIDTH = 240

/** An icon 16px square, centred at (x, y). */
function anchor(top: number, left: number, width = 16, height = 16): AnchorRect {
  return { top, left, width, height, bottom: top + height }
}

describe('computeTooltipPlacement', () => {
  it('sits above the anchor when there is headroom', () => {
    const result = computeTooltipPlacement(anchor(400, 200), VIEWPORT, { width: WIDTH })
    expect(result.placement).toBe('top')
    expect(result.top).toBe(392)
    // Centred on the anchor.
    expect(result.left).toBe(200 + 8 - WIDTH / 2)
  })

  it('flips below an anchor with no room above', () => {
    // The reported case: an icon at the top of the grid. Anchor bottom is 26, and the
    // configurable gap is added on top of that.
    const result = computeTooltipPlacement(anchor(10, 200), VIEWPORT, { width: WIDTH })
    expect(result.placement).toBe('bottom')
    expect(result.top).toBe(26 + 8)
  })

  it('flips exactly at the headroom threshold', () => {
    // `anchor.top > flipThreshold` decides it, so with a threshold of 120 an anchor whose
    // top edge is exactly 120 still flips below, and 121 has room above.
    expect(computeTooltipPlacement(anchor(120, 200), VIEWPORT, { width: WIDTH }).placement).toBe('bottom')
    expect(computeTooltipPlacement(anchor(121, 200), VIEWPORT, { width: WIDTH }).placement).toBe('top')
  })

  it('keeps a tooltip on a left-edge icon inside the viewport', () => {
    // Without clamping this would overhang by ~112px and be cut off.
    const result = computeTooltipPlacement(anchor(400, 2), VIEWPORT, { width: WIDTH })
    expect(result.left).toBeGreaterThanOrEqual(8)
  })

  it('keeps a tooltip on a right-edge icon inside the viewport', () => {
    const result = computeTooltipPlacement(anchor(400, VIEWPORT.width - 4), VIEWPORT, { width: WIDTH })
    expect(result.left + WIDTH).toBeLessThanOrEqual(VIEWPORT.width - 8)
  })

  it('never returns a negative position', () => {
    for (const left of [0, 1, 5, 500, 1023]) {
      const result = computeTooltipPlacement(anchor(400, left), VIEWPORT, { width: WIDTH })
      expect(result.left).toBeGreaterThanOrEqual(0)
      expect(result.top).toBeGreaterThanOrEqual(0)
    }
  })

  it('centres a tooltip that fits comfortably', () => {
    const result = computeTooltipPlacement(anchor(400, 512), VIEWPORT, { width: WIDTH })
    // Anchor centre 520, minus half the tooltip width.
    expect(result.left).toBe(400)
  })

  it('degrades sanely when the viewport is narrower than the tooltip', () => {
    // A very narrow phone: clamping must not produce a negative offset.
    const result = computeTooltipPlacement(anchor(400, 40), { width: 200, height: 600 }, { width: WIDTH })
    expect(result.left).toBe(8)
  })

  it('honours custom gap, margin and width', () => {
    const result = computeTooltipPlacement(anchor(400, 200), VIEWPORT, {
      width: 100,
      gap: 20,
      margin: 4,
      flipThreshold: 500,
    })
    // flipThreshold 500 sends a 400px anchor below; gap 20 applies to the bottom edge.
    expect(result.placement).toBe('bottom')
    expect(result.top).toBe(436)
    expect(result.left).toBe(200 + 8 - 50)
  })
})
