/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic backward compatibility overrides mapped to the new light theme
        bg: {
          void: '#f8f9ff',           // light background
          panel: '#eff4ff',          // surface-container-low
        },
        border: {
          soft: 'rgba(198, 198, 205, 0.3)', // outline-variant with low opacity
          solid: '#76777d',                 // outline
        },
        accent: {
          sage: '#006a61',           // secondary (Safety Teal)
          amber: '#ffb95f',          // tertiary-fixed-dim (Warning Amber)
          clay: '#ba1a1a',           // error (Severe Red)
          forest: '#006a61',         // secondary / resolution
        },
        // Civic-Tech Precision design system colors
        "tertiary-fixed-dim": "#ffb95f",
        "surface-container-low": "#eff4ff",
        "on-surface": "#0b1c30",
        "outline": "#76777d",
        "surface-variant": "#d3e4fe",
        "surface": "#f8f9ff",
        "on-primary-fixed-variant": "#3f465c",
        "surface-bright": "#f8f9ff",
        "inverse-on-surface": "#eaf1ff",
        "primary-fixed-dim": "#bec6e0",
        "on-tertiary-container": "#b87500",
        "error": "#ba1a1a",
        "primary-container": "#131b2e",
        "on-secondary-fixed-variant": "#005049",
        "on-secondary-fixed": "#00201d",
        "tertiary-container": "#2a1700",
        "secondary-container": "#86f2e4",
        "inverse-surface": "#213145",
        "secondary": "#006a61",
        "on-primary-container": "#7c839b",
        "on-error": "#ffffff",
        "background": "#f8f9ff",
        "on-error-container": "#93000a",
        "inverse-primary": "#bec6e0",
        "primary": "#000000",
        "on-tertiary": "#ffffff",
        "error-container": "#ffdad6",
        "surface-container-highest": "#d3e4fe",
        "on-surface-variant": "#45464d",
        "surface-dim": "#cbdbf5",
        "secondary-fixed-dim": "#6bd8cb",
        "tertiary-fixed": "#ffddb8",
        "on-background": "#0b1c30",
        "outline-variant": "#c6c6cd",
        "on-tertiary-fixed-variant": "#653e00",
        "secondary-fixed": "#89f5e7",
        "on-tertiary-fixed": "#2a1700",
        "surface-container-lowest": "#ffffff",
        "on-secondary-container": "#006f66",
        "primary-fixed": "#dae2fd",
        "surface-container": "#e5eeff",
        "surface-tint": "#565e74",
        "surface-container-high": "#dce9ff",
        "on-secondary": "#ffffff",
        "on-primary": "#ffffff",
        "on-primary-fixed": "#131b2e",
        "tertiary": "#000000"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      spacing: {
        "stack-md": "16px",
        "stack-lg": "32px",
        "margin-mobile": "16px",
        "container-max": "1440px",
        "stack-sm": "8px",
        "gutter": "24px",
        "unit": "4px",
        "margin-desktop": "40px"
      },
      fontFamily: {
        // Redesign standard font stacks
        "body-sm": ["Inter", "sans-serif"],
        "headline-lg-mobile": ["Geist", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "label-md": ["Geist", "sans-serif"],
        "headline-md": ["Geist", "sans-serif"],
        "mono-data": ["Geist", "sans-serif"],
        "display": ["Geist", "sans-serif"],
        "title-lg": ["Inter", "sans-serif"],
        "label-lg": ["Geist", "sans-serif"],
        "headline-lg": ["Geist", "sans-serif"],
        
        // Backward compatibility mappings
        heading: ["Geist", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["Geist Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        "body-sm": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
        "headline-lg-mobile": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
        "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
        "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
        "label-md": ["12px", {"lineHeight": "16px", "fontWeight": "500"}],
        "headline-md": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
        "mono-data": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
        "display": ["48px", {"lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
        "title-lg": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
        "label-lg": ["14px", {"lineHeight": "20px", "letterSpacing": "0.05em", "fontWeight": "600"}],
        "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "600"}]
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(248, 250, 252, 0.7) 0%, rgba(248, 250, 252, 0.3) 100%)',
      },
      boxShadow: {
        'soft-natural': '0 10px 30px -5px rgba(15, 23, 42, 0.08)',
        'sage-glow': '0 8px 24px rgba(0, 106, 97, 0.1)',
        'amber-glow': '0 8px 24px rgba(255, 185, 95, 0.1)',
        'clay-glow': '0 8px 24px rgba(186, 26, 26, 0.1)',
      }
    },
  },
  plugins: [],
}
