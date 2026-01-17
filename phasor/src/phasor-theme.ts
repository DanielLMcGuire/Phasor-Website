(() => {
    const STORAGE_KEY = 'phasor-theme';

    type Theme = 'light' | 'dark' | 'system';

    // Get initial theme: check localStorage, then default to system
    function getInitialTheme(): Theme {
        const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
            return stored;
        }
        return 'system';
    }

    // Determine actual theme based on system preference
    function resolveTheme(theme: Theme): 'light' | 'dark' {
        if (theme === 'system') {
            return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        }
        return theme;
    }

    // Apply theme to document
    function applyTheme(theme: Theme): void {
        const resolved = resolveTheme(theme);
        document.documentElement.setAttribute('data-theme', resolved);
        localStorage.setItem(STORAGE_KEY, theme);

        const toggleBtn = document.querySelector<HTMLButtonElement>('.theme-toggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = theme === 'light' ? 'Dark' : theme === 'dark' ? 'System' : 'Light';
        }
    }

    // Cycle through themes: light -> dark -> system -> light
    function toggleTheme(): void {
        const current = (localStorage.getItem(STORAGE_KEY) as Theme) || 'system';
        let next: Theme;
        if (current === 'light') next = 'dark';
        else if (current === 'dark') next = 'system';
        else next = 'light';
        applyTheme(next);
    }

    // Initialize theme on page load
    const initialTheme = getInitialTheme();
    applyTheme(initialTheme);

    // Listen for system theme changes
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
            const current = localStorage.getItem(STORAGE_KEY);
            if (current === 'system') {
                applyTheme('system');
            }
        });
    }

    // Make toggle function globally available
    (window as any).toggleTheme = toggleTheme;

    // Auto-initialize toggle button when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initToggleButton);
    } else {
        initToggleButton();
    }

    function initToggleButton(): void {
        setTimeout(() => {
            const toggleBtn = document.querySelector<HTMLButtonElement>('.theme-toggle');
            if (toggleBtn) {
                const theme = (localStorage.getItem(STORAGE_KEY) as Theme) || 'system';
                toggleBtn.innerHTML = theme === 'light' ? 'Dark' : theme === 'dark' ? 'System' : 'Light';
            }
        }, 100);
    }
})();
