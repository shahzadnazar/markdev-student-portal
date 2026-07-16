---
name: MarkDev
colors:
  surface: '#f9f9fc'
  surface-dim: '#dadadc'
  surface-bright: '#f9f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f6'
  surface-container: '#eeeef0'
  surface-container-high: '#e8e8ea'
  surface-container-highest: '#e2e2e5'
  on-surface: '#1a1c1e'
  on-surface-variant: '#424753'
  inverse-surface: '#2f3133'
  inverse-on-surface: '#f0f0f3'
  outline: '#727784'
  outline-variant: '#c2c6d5'
  surface-tint: '#0e5bbe'
  primary: '#004393'
  on-primary: '#ffffff'
  primary-container: '#0c5abd'
  on-primary-container: '#c7d7ff'
  inverse-primary: '#adc6ff'
  secondary: '#634bbb'
  on-secondary: '#ffffff'
  secondary-container: '#a18afe'
  on-secondary-container: '#36158e'
  tertiary: '#42464b'
  on-tertiary: '#ffffff'
  tertiary-container: '#595e63'
  on-tertiary-container: '#d3d7dd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004494'
  secondary-fixed: '#e7deff'
  secondary-fixed-dim: '#cbbeff'
  on-secondary-fixed: '#1e0060'
  on-secondary-fixed-variant: '#4b30a2'
  tertiary-fixed: '#dfe3e9'
  tertiary-fixed-dim: '#c2c7cd'
  on-tertiary-fixed: '#171c20'
  on-tertiary-fixed-variant: '#42474c'
  background: '#f9f9fc'
  on-background: '#1a1c1e'
  surface-variant: '#e2e2e5'
  surface-ice: '#F5F9FF'
  accent-purple: '#6B53C4'
  deep-ocean: '#0C5ABD'
  text-main: '#1A1C1E'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding: 24px
  gutter: 20px
  sidebar-width: 280px
  card-gap: 24px
---

## Brand & Style

The design system is engineered for a technical, high-performance learning environment. It targets students and developers who require a focused, intellectually stimulating workspace. The brand personality is **Visionary, Technical, and Precise**.

The chosen design style is **Corporate Modern with a "Tech-Glass" influence**. It utilizes the structured reliability of Material-inspired layouts but injects personality through vibrant gradients and subtle translucency. The aesthetic should evoke a sense of "intellectual flow"—clean enough to reduce cognitive load, but sophisticated enough to feel like a premium professional tool. Key characteristics include heavy use of whitespace, refined tonal layering, and high-quality typography that prioritizes legibility during long study sessions.

## Colors

The color strategy leverages a sophisticated "analogous-plus" palette. The **Deep Ocean Blue** (#0C5ABD) serves as the primary driver for action and brand identity, representing trust and stability. The **Accent Purple** (#6B53C4) is used for secondary call-to-actions, progress indicators, and "enlightenment" moments in the learning journey.

**Surface Ice** (#F5F9FF) is the foundational background color, providing a cooler, more modern alternative to pure white that reduces eye strain. Typography and high-contrast elements utilize a near-black **Neutral** (#1A1C1E) to ensure maximum accessibility and a professional finish. Use gradients sparingly, primarily transitioning from Primary to Secondary colors to denote activity or premium states.

## Typography

This design system uses a tripartite typographic scale to balance character with utility. **Hanken Grotesk** is the primary display face, offering a sharp, contemporary look for headlines. **Inter** is the workhorse for body text, chosen for its exceptional legibility in dense data and educational content. For technical metadata, code snippets, and status labels, **JetBrains Mono** is employed to reinforce the developer-centric nature of the platform.

Hierarchies are strictly enforced through weight and letter spacing. Large headlines use tighter tracking to feel more impactful, while small mono labels use increased tracking to maintain clarity at small scales.

## Layout & Spacing

The layout follows a **Fixed Grid within a Fluid Shell**. The dashboard utilizes a persistent left-hand sidebar for primary navigation, with a main content area that expands fluidly up to a maximum width of 1440px, after which it centers.

Spacing follows an 8px rhythmic scale. On Desktop, a 12-column grid is used for the main dashboard area. On Mobile, the layout collapses to a single column with 16px horizontal margins. Use "Content Grouping" via generous padding (24px+) inside cards to maintain an airy, premium feel. Reflow rules: cards should stack vertically on mobile, but may form 2 or 3-column rows on tablet/desktop depending on data density.

## Elevation & Depth

Hierarchy is achieved through **Tonal Layering and Ambient Shadows**. The background uses the Tertiary color (Surface Ice). Elevated elements, such as cards and the sidebar, use pure White (#FFFFFF).

Depth is communicated through two primary levels:
1.  **Low Elevation (Resting Cards):** A very soft, diffused shadow (0px 4px 20px rgba(12, 90, 189, 0.05)). The shadow is slightly tinted with the Primary Blue to create a "glow" rather than a grey "smudge."
2.  **High Elevation (Modals/Dropdowns):** A more pronounced shadow (0px 12px 32px rgba(12, 90, 189, 0.12)).

The sidebar should use a subtle 1px right-border in a light-blue tint instead of a shadow to maintain a clean, architectural vertical line.

## Shapes

The shape language is **Refined and Approachable**. A base roundedness of 0.5rem (8px) is applied to standard UI components like buttons and input fields. Large layout containers and dashboard cards utilize a larger 1rem (16px) radius to soften the overall interface and make it feel more modern. 

Buttons should never be fully pill-shaped (except for specialized chips/tags); they must maintain the 8px corner radius to stay consistent with the "technical" brand personality.

## Components

### Buttons
Primary buttons use a solid Deep Ocean Blue fill with White text. Secondary buttons use an outline style with a 1px border of the Primary color. Hover states should introduce a subtle 10% opacity overlay or a slight vertical lift.

### Cards
Cards are the primary container. They must have a White background, a 16px corner radius, and the "Low Elevation" shadow. Padding inside cards is strictly 24px.

### Chips & Tags
Used for course categories or status (e.g., "In Progress"). These use the Label-Sm (JetBrains Mono) font. Backgrounds should be low-saturation versions of the Primary or Secondary colors (e.g., 10% opacity) with high-saturation text.

### Input Fields
Fields should have a 1px border in a neutral grey-blue. On focus, the border transitions to the Primary Blue with a 2px outer "halo" of 20% opacity Primary Blue.

### Sidebar
The sidebar is pure white with a 280px width. Active states for nav items should be indicated by a vertical 4px bar on the left edge in the Primary color and a subtle background tint.

### Progress Indicators
Progress bars should utilize a gradient from Primary Blue to Secondary Purple to signify movement and growth.