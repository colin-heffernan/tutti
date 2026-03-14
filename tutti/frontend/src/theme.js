// theme for most base stuff

const THEME = {
    //background themes
    bg: "#1a1a1f",
    bgCard: "#242429",
    bgElevated: "#2e2e35",
    bgHover: "#38383f",

    // Text
    textPrimary: "#f0f0f5",
    textSecondary: "#9d9daa",
    textPlaceholder: "#6b6b78",
    
    // Accent
    accent: "#7c6ff7",
    accentHover: "#9388f9",
    accentMuted: "rgba(124, 111, 247, 0.15)",
    success: "#4ade80",
    error: "#f87171",
    warning: "#fbbf24",

    //borders
    border: "#3a3a42",
    borderFocus: "#7c6ff7",

    //fonts
    fontDisplay: "'Outfit', sans-serif",
    fontBody: "'Nunito', sans-serif",

    //spacing
    space: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },

    //Border radius - kinda giving it a bubbly feel to like the buttons and menus 
    radius: { sm: 8, md: 12, lg: 16, xl: 24, pill: 9999 },

    //shadows
    shadow: {
        sm: "0 2px 8px rgba(0,0,0,0.3)",
        md: "0 4px 16px rgba(0,0,0,0.4)",
        lg: "0 8px 32px rgba(0,0,0,0.5)",
    },

    //transition
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
};

export default THEME;