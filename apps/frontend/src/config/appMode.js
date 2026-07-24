export const APP_MODE = import.meta.env.VITE_APP_MODE || 'full';

export const isMini = APP_MODE === 'mini';
export const isFull = APP_MODE !== 'mini';
