export type ProjectionMode = 'median' | 'average' | 'items' | 'goal';

export const PROJECTION_MODES: { value: ProjectionMode; label: string }[] = [
    { value: 'median', label: 'Median' },
    { value: 'average', label: 'Average' },
    { value: 'items', label: 'Items/day' },
    { value: 'goal', label: 'Goal' },
];
