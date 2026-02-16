
// Theme Management
const THEME_KEY = 'interia_theme';

function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Default is dark 
    if (savedTheme === 'light') {
        document.body.classList.add('white-theme');
        updateThemeIcon(true);
    } else {
        document.body.classList.remove('white-theme');
        updateThemeIcon(false);
    }
}

function toggleTheme() {
    const isLight = document.body.classList.toggle('white-theme');
    localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
    updateThemeIcon(isLight);

    // Emit event for other components if needed
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { isLight } }));
}

function updateThemeIcon(isLight) {
    const icons = document.querySelectorAll('.theme-toggle-icon');
    icons.forEach(icon => {
        if (isLight) {
            icon.setAttribute('data-lucide', 'moon');
        } else {
            icon.setAttribute('data-lucide', 'sun');
        }
    });
    // Re-render lucide icons if library available
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initTheme);

// Expose to window
window.toggleTheme = toggleTheme;
