/**
 * Tooltip placement maths.
 *
 * Kept as a pure function, separate from the component, for two reasons: the geometry is
 * the part worth testing and it needs no DOM to test, and getting it wrong is a silent
 * visual bug — a tooltip that overhangs the viewport just looks broken and nothing
 * throws.
 */

export interface AnchorRect {
    top: number
    left: number
    width: number
    height: number
    bottom: number
}

export interface ViewportSize {
    width: number
    height: number
}

export interface TooltipPlacement {
    /** Top edge of the tooltip when it sits below; bottom edge when it sits above. */
    top: number
    left: number
    placement: 'top' | 'bottom'
}

export interface PlacementOptions {
    width?: number
    /** Vertical gap between the icon and the tooltip. */
    gap?: number
    /** Minimum distance to keep from any viewport edge. */
    margin?: number
    /** Space needed above the anchor before the tooltip flips below it. */
    flipThreshold?: number
}

const DEFAULTS = { width: 240, gap: 8, margin: 8, flipThreshold: 120 }

/**
 * Places a tooltip near its anchor, preferring above.
 *
 * Flips below when there is not enough headroom and clamps horizontally so a tooltip on
 * an icon near either edge is never cut off.
 */
export function computeTooltipPlacement(
    anchor: AnchorRect,
    viewport: ViewportSize,
    options: PlacementOptions = {},
): TooltipPlacement {
    const { width, gap, margin, flipThreshold } = { ...DEFAULTS, ...options }

    const placement: 'top' | 'bottom' = anchor.top > flipThreshold ? 'top' : 'bottom'
    const top = placement === 'top' ? anchor.top - gap : anchor.bottom + gap

    const idealLeft = anchor.left + anchor.width / 2 - width / 2
    const maxLeft = Math.max(margin, viewport.width - width - margin)
    const left = Math.min(Math.max(idealLeft, margin), maxLeft)

    return { top, left, placement }
}
