# Design System Specification: High-Fidelity Gaming Social Platform

## 1. Overview & Creative North Star: "The Neon Observatory"
This design system is built to transform the second-screen experience into a premium, immersive cockpit for PC gamers. The Creative North Star is **"The Neon Observatory"**—a concept that balances the technical precision of a high-end gaming rig with the atmospheric depth of a late-night social hub.

To move beyond the "standard dashboard" look, this system rejects rigid grids in favor of **intentional depth layering**. We utilize overlapping glass surfaces, "glowing" focal points, and asymmetric content clusters. The interface should feel less like a flat website and more like a liquid-crystal display floating in a dark room.

---

## 2. Colors & Surface Logic

### The Palette
The color logic follows a high-contrast dark-mode philosophy where the "Primary" is a deep, energetic purple and the "Secondary" acts as a high-frequency pink accent.

*   **Background (Surface):** `#0D0B14` (Deep Space)
*   **Surface Container (Slate):** `#1A1726`
*   **Primary (Purple):** `#563895`
*   **Secondary (Pink):** `#FF2A7A`
*   **On-Surface (Text):** `#F8F9FA`
*   **On-Surface Variant (Muted):** `#8A869C`

### The "No-Line" Rule
Traditional 1px solid borders are strictly prohibited for sectioning. Layout boundaries must be defined through:
1.  **Tonal Shifts:** Placing a `surface-container-high` card against a `surface-dim` background.
2.  **Backdrop Blurs:** Using glassmorphic transparency to define the "edge" of a component.
3.  **Glow Radius:** Using a subtle outer glow (Primary Purple at 10% opacity) to denote active containers.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of frosted glass sheets:
*   **Base Level:** `surface` (`#0D0B14`) – The void.
*   **Level 1 (Sections):** `surface-container-low` – Subtle grouping.
*   **Level 2 (Cards):** `surface-container-highest` – Primary interactive units.
*   **Level 3 (Pop-overs):** Glassmorphic overlays with `backdrop-filter: blur(16px)`.

---

## 3. Typography: Technical Precision vs. Human Connection

The typography system uses a "High-Low" strategy: a futuristic, condensed typeface for high-impact data and a neutral, legible face for social interaction.

*   **Display & Headlines (Rajdhani):** Bold, technical, and slightly futuristic. Use `display-lg` and `headline-md` for game titles, user handles, and "Live" status indicators. The squared-off terminals of Rajdhani should feel like a digital readout.
*   **Body & Labels (Inter):** Clean and invisible. Used for chat logs, settings, and descriptions. Inter provides the necessary "breath" between the high-energy headlines.

**Hierarchy Tip:** Always pair a `Rajdhani Bold` headline with an `Inter Medium` sub-label to create a "Technical Editorial" look.

---

## 4. Elevation & Depth: The Glassmorphic Layering

### The Layering Principle
Depth is achieved through **Tonal Layering**. Avoid "Shadows" in the traditional sense; use "Ambient Lifts."

*   **Ambient Shadows:** For floating glass panels, use a shadow with a 40px blur, 0% offset, and 8% opacity using the `secondary` pink token. This creates an "energy bleed" effect rather than a dark drop shadow.
*   **The Ghost Border:** For accessibility on glass cards, use a 1px border with `outline-variant` at **15% opacity**. It should be felt, not seen.
*   **Glassmorphism:** All floating components (Modals, Hover Cards) must use:
    *   `background: rgba(26, 23, 38, 0.6)`
    *   `backdrop-filter: blur(16px)`
    *   `border: 1px solid rgba(248, 249, 250, 0.1)`

---

## 5. Signature Components

### Gradient Pill Buttons
The primary action driver.
*   **Style:** Full rounded corners (`radius-full`).
*   **Fill:** Linear Gradient (45deg) from `#563895` to `#FF2A7A`.
*   **Interaction:** On hover, add a `box-shadow` of the same gradient colors at 30% opacity with a 20px blur to simulate a "power-on" state.

### Avatar Stacks (Intent Mode)
Used for displaying party members or friends in-game.
*   **Visuals:** Overlapping circles with a 2px "Intent Border."
*   **Intent Tokens:** 
    *   *In-Game:* Primary Purple Glow.
    *   *Looking for Group:* Secondary Pink Glow.
    *   *Away:* Muted Slate.

### Glass Cards
The core container for social feeds.
*   **Styling:** No solid background. Use `surface-container-highest` at 40% opacity with 16px blur.
*   **Spacing:** Use `spacing-6` (1.5rem) internal padding to maintain an editorial, airy feel despite the dark theme.

### Floating Mockups
For showcasing shared clips or screenshots.
*   **Visuals:** 12-degree slight rotation on the Z-axis, a `radius-lg` corner, and a "Secondary Pink" ambient glow behind the image to make it "pop" from the dark interface.

---

## 6. Do’s and Don’ts

### Do:
*   **DO** use Phosphor Icons in "Duotone" or "Thin" weights to maintain the technical aesthetic.
*   **DO** use asymmetry. Place a large `display-lg` headline overlapping a glass card to break the "boxed-in" feel.
*   **DO** use vertical whitespace (`spacing-12` and above) to separate major content blocks instead of lines.

### Don't:
*   **DON'T** use pure black (`#000000`). It kills the depth of the glassmorphism. Use the `background` token.
*   **DON'T** use high-contrast white borders. They feel "cheap" and break the immersion.
*   **DON'T** use standard "Material" animations. Use "Spring" physics (snappy but smooth) for all transitions to mimic high-performance gaming software.

### Accessibility Note:
While the theme is "Deep Dark," ensure all `body-sm` text maintains a contrast ratio of at least 4.5:1 against the `surface-container` tiers. Use the `primary-fixed-dim` token for small labels that need extra visibility.