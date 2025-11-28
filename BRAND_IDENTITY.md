# AMPLIFY Brand Identity Guide

## 🎯 Brand Overview

**AMPLIFY** — 소리를 키우다, 무대를 키우다

A sophisticated concert ticketing platform specializing in international artists' Korean tours.

### Brand Keywords
- 콘서트 (Concert)
- 라이브 (Live)
- 내한 (International Tour to Korea)
- 프리미엄 (Premium)
- 세련 (Sophisticated)
- 비정형 (Non-standard)
- 단정 (Neat)

### Brand Mood
공연장의 암부(어둠) + 스모크(연기) + 잔광(네온)  
_The darkness of the concert hall + Smoke + Neon afterglow_

### Brand Tone
포멀하지만 감각적인 브랜드  
_Formal yet sensuous brand_

---

## 🎨 Color System

### Brand Colors

#### Mist Indigo
```
HEX: #4C4F7A
RGB: 76, 79, 122
Usage: Primary brand color, logo, main CTAs, hover states
Represents: Concert hall darkness + smoke + afterglow mood
```

#### Slate Violet
```
HEX: #7062A6
RGB: 112, 98, 166
Usage: Gradient/sub-brand tone, secondary elements
Represents: Gradient transitions, hover highlights
```

### Accent Colors

#### Neon Peach
```
HEX: #FF8C55
RGB: 255, 140, 85
Usage: Pre-sale alerts, ticket open notifications, highlights
Represents: Concert lighting, uncommon and striking
```

### Neutral Colors

#### White
```
HEX: #FFFFFF
RGB: 255, 255, 255
Usage: Card backgrounds, content backgrounds
```

#### Soft Gray
```
HEX: #F5F5F5
RGB: 245, 245, 245
Usage: Section backgrounds, input fields
```

#### Line Gray
```
HEX: #D7D7D7
RGB: 215, 215, 215
Usage: Dividers, borders, subtle separators
```

#### Text Dark
```
HEX: #232323
RGB: 35, 35, 35
Usage: Primary text, headings, body content
```

#### Sub Gray
```
HEX: #707070
RGB: 112, 112, 112
Usage: Secondary text, labels, supporting information
```

---

## 🅰️ Typography

### UI Primary Fonts

#### English
```
Font Family: General Sans
Fallback: Pretendard, system-ui
Characteristics: Modern, brand-like, clean, rare
Usage: Logo, UI elements, English text
```

#### Korean
```
Font Family: SUIT or LINE Seed KR
Fallback: Pretendard
Characteristics: Less common than Pretendard, UI/UX optimized
Usage: Korean UI text, navigation, buttons
```

### Display Fonts (Hero / Artist Names / Poster Feel)

```
Font Family: Neue Haas Grotesk Display
Alternative: Ogg / Editorial New
Characteristics: Bold, wide letter spacing, concert/poster mood
Usage: Hero sections, artist names, event titles
```

### Font Implementation

```css
/* Global font stack */
font-family: 'SUIT', 'LINE Seed KR', 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;

/* Headings */
font-family: 'General Sans', 'SUIT', 'Pretendard', sans-serif;

/* Display/Hero */
font-family: 'Neue Haas Grotesk Display', 'General Sans', 'Pretendard', sans-serif;
```

---

## 🎨 Logo Usage

### AMPLIFY Logo Specifications

```
Typography: AMPLIFY
Font Weight: 600-700
Letter Spacing: Wide (6px recommended)
Color: Mist Indigo (#4C4F7A) or gradient
```

### Logo Variations

1. **Standard Logo** — Mist Indigo solid color
2. **Optional Symbol** — A or △ shape representing stage lights
3. **Meaning** — Amplifying sound, amplifying the stage

### Logo Don'ts
- Don't use overly bright colors
- Don't compress letter spacing
- Don't use lightweight fonts (under 600)
- Maintain minimum clear space around logo

---

## 🎪 UI Component Guidelines

### Header

```
Height: 72px
Background: White (#FFFFFF)
Border Bottom: 1px solid rgba(0,0,0,0.08)
Container Max Width: 1280px

Logo:
  - Font Weight: 700
  - Letter Spacing: 6px
  - Color: #4C4F7A (Mist Indigo)

Navigation:
  - Color: #232323 (Text Dark)
  - Hover Color: #4C4F7A (Mist Indigo)
  - Font Weight: 600
  - Font Size: 15px

Search Bar:
  - Border Radius: 6px
  - Height: 42px
  - Background: #F5F5F5 (Soft Gray)
  - Border: 1px solid #D7D7D7 (Line Gray)
  - Focus Border: #4C4F7A (Mist Indigo)

Icons:
  - Color: #232323
  - Hover: rgba(76, 79, 122, 0.08) background
  - Hover Color: #4C4F7A
  - Size: 24px
```

### Buttons

```
Primary Button:
  - Background: #4C4F7A (Mist Indigo)
  - Color: #FFFFFF
  - Border Radius: 6-8px
  - Padding: 10px 24px
  - Font Weight: 600
  - Hover: opacity 0.95, scale 1.02
  - Shadow: 0 2px 8px rgba(76, 79, 122, 0.15)

Accent Button:
  - Background: #FF8C55 (Neon Peach)
  - Color: #FFFFFF
  - Border Radius: 6-8px
  - Padding: 10px 24px
  - Font Weight: 600
  - Hover: opacity 0.95, scale 1.02

Secondary Button:
  - Background: transparent
  - Border: 1px solid #D7D7D7
  - Color: #232323
  - Hover Border: #4C4F7A
```

### Cards

```
Background: White (#FFFFFF)
Border Radius: 8px
Shadow: 0 2px 8px rgba(0, 0, 0, 0.06)
Transition: all 0.2s ease

Hover State:
  - Transform: scale(1.02)
  - Shadow: 0 4px 16px rgba(0, 0, 0, 0.1)
  - Border Color: #4C4F7A (if bordered)

Title:
  - Font Family: General Sans Bold
  - Color: #232323

Artist Name:
  - Font Family: Display Font (Neue Haas Grotesk Display)
  - Font Weight: 700-900
  - Letter Spacing: 1-2px
```

### Tabs & Category Bars

```
Style: Underline
Active Color: #4C4F7A (Mist Indigo)
Inactive Color: #707070 (Sub Gray)
Indicator Height: 3px
Line Color: #D7D7D7 (Line Gray)
```

### Seat Map

```
Zone Colors: Indigo spectrum (#4C4F7A family)
Standing Zone: #FF8C55 (Neon Peach)
Selected Seat:
  - Background: #4C4F7A
  - Text: White
  - Border: 2px solid #7062A6
```

### Modals / Overlays

```
Background: rgba(30, 36, 51, 0.58)
Backdrop Blur: 8px
Modal Background: White
Border Radius: 8px
Shadow: 0 8px 32px rgba(0, 0, 0, 0.15)
```

---

## 📐 Layout & Spacing

### Container

```
Max Width: 1280px
Padding: 24px
```

### Spacing Scale

```
Section Spacing: 56px
Component Spacing: 16px
Card Padding: 24px
Button Padding: 10px 24px
```

### Grid

```
Column Gap: 16px
Row Gap: 24px
```

---

## 🖼️ Imagery Guidelines

### Concert Photography

- Emphasize darkness (암부) + light flare (빛의 번짐)
- Use high contrast and sharp images
- Prefer stage haze (smoke) effects
- Add subtle grain texture if needed
- Avoid excessive RGB blue/purple saturation

### Poster Style

- High contrast
- Sharp and clear
- Professional concert photography aesthetic
- Focus on artist and stage presence

### Background Treatments

- Stage haze (스모크) effect
- Subtle grain texture (optional)
- Dark stage-like backgrounds for hero sections
- Avoid overly bright or colorful backgrounds

---

## ✨ Motion & Interaction

### Animation Principles

```
Transitions: 0.2s ease
Subtle fade + slide effects
Scale: 1.02 on hover
Opacity: 0.95 on hover
```

### Neon Effects

- Use sparingly
- Subtle glow on accent elements
- Don't overuse "neon" aesthetic

### Seat Selection

- Solid click feedback
- Instant visual confirmation
- Clear state changes

### Hover States

```css
/* Standard hover */
&:hover {
  transform: scale(1.02);
  opacity: 0.95;
  transition: all 0.2s ease;
}

/* Button hover */
&:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(76, 79, 122, 0.25);
}
```

---

## 🎼 Overall Brand Feeling

> "무대의 어둠과 빛을 담은 Mist Indigo 기반에 Neon Peach 조명을 얹은,  
> 희소성 있는 프리미엄 콘서트 티켓팅 플랫폼 디자인."

**Translation:**  
_A rare and premium concert ticketing platform design based on Mist Indigo that captures the darkness and light of the stage, with Neon Peach lighting accents._

### Design Pillars

1. **Formal yet Sensuous** — Professional platform with artistic touches
2. **Concert Hall Mood** — Darkness, smoke, and neon afterglow
3. **Premium Feel** — High-quality typography, sophisticated colors
4. **Rare Identity** — Uncommon fonts (General Sans, SUIT), distinctive Neon Peach accent
5. **Stage-First** — Concert and artist focus, not search-first

---

## 📋 Implementation Checklist

### Core Files Updated

- ✅ `src/theme.ts` — MUI theme with brand colors and typography
- ✅ `src/index.css` — Global styles with SUIT font and custom scrollbar
- ✅ `src/components/Layout/Header.tsx` — Brand-compliant header with Mist Indigo
- ✅ `src/components/Layout/Footer.tsx` — Updated footer with Slate Violet branding
- ✅ `src/pages/Home/Home.tsx` — Homepage with full brand color implementation
- ✅ `public/index.html` — Updated meta tags with AMPLIFY branding
- ✅ `public/manifest.json` — Updated app name to AMPLIFY
- ✅ `package.json` — Updated project name to amplify-ticket

### Font Loading

```css
/* In index.css */
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
@import url('https://cdn.jsdelivr.net/gh/sunn-us/SUIT/fonts/static/woff2/SUIT.css');
```

**Note:** General Sans and Neue Haas Grotesk Display should be added as web fonts or local font files for complete brand implementation.

---

## 🚀 Future Enhancements

1. Add General Sans and Neue Haas Grotesk Display web fonts
2. Implement stage haze (smoke) effect on hero sections
3. Add subtle grain texture to dark backgrounds
4. Create animated neon glow effects for accent elements
5. Develop seat map with brand-specific color zones
6. Design custom ticket templates with brand identity

---

## 📞 Brand Contact

For questions about brand usage and guidelines, please refer to this document or contact the design team.

**Last Updated:** November 20, 2025  
**Version:** 1.0.0

