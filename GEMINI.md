# CivicLens Design System & UI/UX Standards

This document codifies the design token system, aesthetic direction, and frontend guidelines for **CivicLens** to ensure an elite, high-fidelity visual experience that stands out to the jury.

---

## 🎨 Aesthetic Theme: Biophilic Glassmorphism & Fluid Digital Twin

CivicLens avoids the standard, flat dashboard look by adopting an **Organic Biophilic Glassmorphism** layered over a **Mapbox 3D vector map**. It combines deep, natural forest-obsidian panels, soft warm drop-shadows, and smooth organic animations.

```
┌────────────────────────────────────────────────────────┐
│  MAPBOX 3D VECTOR CANVAS (Layer 0 - Background)        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Pulsing Soft Pins & Extruded 3D Buildings       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  BIOPHILIC GLASS PANELS (Layer 1 - Floating UI)        │
│  ┌────────────────────────┐  ┌───────────────────┐     │
│  │  [+] Active Quests     │  │  [x] Alerts Feed  │     │
│  │  Blur: 24px, Radius: 20│  │  Elegant Mono Text│     │
│  └────────────────────────┘  └───────────────────┘     │
└────────────────────────────────────────────────────────┘
```

---

## 🧭 Design Tokens

### 1. Typography Pairings
*   **Primary Font (Headings & UI Labels):** `Outfit` (Google Font)
    *   *Characteristics:* Modern geometric, humanist sans-serif, warm and approachable.
    *   *Usage:* Title blocks, panel headers, button text, and navigation tabs.
*   **Body Font (Text & Descriptions):** `Manrope` (Google Font)
    *   *Characteristics:* Highly readable, clean, modern, and professional.
    *   *Usage:* Narrative summaries, instructions, legal petitions, and description texts.
*   **Data Font (Metrics & Coordinates):** `Geist Mono` or `Fira Code` (Google Fonts)
    *   *Characteristics:* High-legibility monospace, elegant and clean structure.
    *   *Usage:* Cost invoices, coordinates, JSON reports, decay probabilities, and RTI notices.

### 2. Hand-Picked Color Coordinates (HSL System)
We use a premium biophilic-organic palette that feels premium and calming rather than game-like or neon.

| Design Token | Color Name | HEX Code | HSL Coordinate | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `--bg-void` | Deep Obsidian | `#070A11` | `220, 43%, 4%` | Base background behind map canvas. |
| `--bg-panel` | Biophilic Slate | `#131926` | `220, 33%, 11%` | Floating HUD panels (translucent). |
| `--border-soft` | Glass Border | `#2E364F` | `225, 26%, 24%` | Soft panel boundaries (low opacity). |
| `--accent-sage` | Clean Sage/Teal | `#2DD4BF` | `172, 66%, 50%` | Water grid issues, default state, and search paths. |
| `--accent-amber`| Warm Sand | `#F59E0B` | `38, 92%, 50%` | Streetlights, electrical reports, warnings. |
| `--accent-clay` | Terracotta | `#E07A5F` | `14, 69%, 62%` | Road structural hazards, high risk. |
| `--accent-forest`| Emerald Forest | `#10B981` | `162, 76%, 41%` | Resolved issues, completed quests. |

---

## 🪟 Component Styling Specifications

### 1. The Biophilic Glass Panel
Floating containers feature heavy blur, high saturation, and generous rounded corners:
```css
.glass-panel {
  background-color: hsla(220, 33%, 11%, 0.45); /* --bg-panel with 45% opacity */
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.25);
  transition: border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.glass-panel:hover {
  border-color: rgba(45, 212, 191, 0.15); /* Soft sage tint on hover */
  box-shadow: 0 16px 48px 0 rgba(45, 212, 191, 0.03);
}
```

### 2. The Interactive Button (Fluid UI)
Buttons use smooth cubic-bezier transitions for organic-feeling responses:
```css
.btn-civic-primary {
  background: linear-gradient(135deg, var(--accent-sage) 0%, #0F766E 100%);
  color: #070A11;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
}
.btn-civic-primary:hover {
  box-shadow: 0 8px 24px rgba(45, 212, 191, 0.2);
  transform: translateY(-2px);
}
.btn-civic-primary:active {
  transform: scale(0.96) translateY(0px); /* Natural press deformation */
}
```

### 3. Background Fluidity (Morphing Blobs)
To breathe life into the site, place blurry, organic, slow-moving radial shapes behind the panels:
```css
.organic-blob {
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.12;
  mix-blend-mode: screen;
  pointer-events: none;
  animation: float-slow 12s infinite alternate ease-in-out;
}
@keyframes float-slow {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(80px, 50px) scale(1.15); }
}
```

---

## 🗺️ Mapbox 3D Customization Guidelines

1.  **Style URL:** `mapbox://styles/mapbox/dark-v11` (or custom biophilic dark style).
2.  **3D Extrusions:** Enable 3D building rendering to project architectural depth on tilt.
3.  **Soft Breathing Markers:** Use custom HTML elements for markers that feature a soft, breathing outline rather than flashing strobes:
    ```css
    @keyframes pulse-soft {
      0% { box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(45, 212, 191, 0); }
      100% { box-shadow: 0 0 0 0 rgba(45, 212, 191, 0); }
    }
    ```

---

## ♿ UX & Accessibility Rules (Jury Proof)

1.  **Touch Target Size:** Min `44px x 44px` on all interactive panels.
2.  **Pointer Cursors:** Apply `cursor: pointer` explicitly on all clickable cards, maps, and buttons.
3.  **Text Contrast:** Monospaced data displays are rendered in bright colors against dark panel backdrops, maintaining a `5:1` contrast ratio.
4.  **No Emojis for Icons:** Use Lucide SVG icons exclusively, colored with opacity gradients.
