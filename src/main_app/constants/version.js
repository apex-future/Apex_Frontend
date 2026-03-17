// Single source of truth for app version
// This is read from package.json at build time
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.6.6';
