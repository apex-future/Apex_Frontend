import { create } from 'zustand';

const useThemeStore = create((set, get) => ({
    theme: localStorage.getItem('theme') || 'system',
    resolvedTheme: 'light',
    setTheme: (theme) => {
        localStorage.setItem('theme', theme);
        set({ theme });
        get().updateResolvedTheme();
    },
    updateResolvedTheme: () => {
        const { theme } = get();
        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            set({ resolvedTheme: systemTheme });
        } else {
            const resolved = theme && theme.includes('dark') ? 'dark' : 'light';
            set({ resolvedTheme: resolved });
        }
    },
    initTheme: () => {
        get().updateResolvedTheme();

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = (e) => {
            if (get().theme === 'system') {
                set({ resolvedTheme: e.matches ? 'dark' : 'light' });
            }
        };

        mediaQuery.addEventListener('change', listener);
        
        // Remove global classes just in case they were set by a previous version
        window.document.documentElement.classList.remove('dark', 'light');
    }
}));

export default useThemeStore;
