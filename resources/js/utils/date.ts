const msPerDay = 1000 * 60 * 60 * 24;

export const diffDays = (from: Date | string, to: Date | string) =>
    Math.round((new Date(to).getTime() - new Date(from).getTime()) / msPerDay);

export const addDays = (date: Date, days: number): Date => new Date(date.getTime() + days * msPerDay);
