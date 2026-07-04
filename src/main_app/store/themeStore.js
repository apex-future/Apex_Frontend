import { create } from 'zustand';

const useThemeStore = create((set, get) => ({
    theme: localStorage.getItem('theme') || 'system',
    resolvedTheme: 'light',
    setTheme: (theme) => {
        localStorage.setItem('theme', theme);
        set({ theme });
        get().updateResolvedTheme();
        // Keep settingsStore in sync so theme persists to Supabase
        // Import is done inline to avoid circular dependency
        import('../store/settingsStore').then(({ default: useSettingsStore }) => {
            useSettingsStore.getState().updateSetting('theme', theme);
        });
    },
    updateResolvedTheme: () => {
        const { theme } = get();
        let resolved;
        if (theme === 'system') {
            resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } else {
            resolved = theme && theme.includes('dark') ? 'dark' : 'light';
        }
        set({ resolvedTheme: resolved });
        document.documentElement.classList.toggle('dark', resolved === 'dark');
    },
    initTheme: () => {
        get().updateResolvedTheme();

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = (e) => {
            if (get().theme === 'system') {
                const resolved = e.matches ? 'dark' : 'light';
                set({ resolvedTheme: resolved });
                document.documentElement.classList.toggle('dark', resolved === 'dark');
            }
        };

        mediaQuery.addEventListener('change', listener);
        
        // Remove global classes just in case they were set by a previous version
        window.document.documentElement.classList.remove('light');
    }
}));

export default useThemeStore;
