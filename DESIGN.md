---
name: Band 9 — landing world (/gioi-thieu)
description: A sunlit gold hall. The app's own gold ground, ivory glass placards, brass frames and metal gold buttons; each part of the app hangs as an exhibit.
colors:
  wall: "#0E1530"
  navy: "#0F1D33"
  navy-2: "#16264A"
  night-screen: "#0A1428"
  cream: "#F3EDE1"
  mist: "#C9CFDF"
  gold: "#E3BE6A"
  gold-hover: "#EDCD84"
  gold-deep: "#B8955A"
  gold-ink: "#7A5E24"
  gold-ground: "#FFFCF3"
  gold-champagne: "#F5E4B6"
  gold-ink-deep: "#3B2A10"
  gold-body: "#6E5626"
  gold-muted: "#9C8552"
  gold-accent: "#8C6A1F"
  gold-button: "#EBC26A"
  ivory-glass: "rgba(255,252,242,0.5)"
  mat: "#EFE7D6"
  paper: "#FBF8F2"
  white: "#FFFFFF"
  ink: "#141A33"
  body: "#4A4F66"
  red: "#E5484D"
  green: "#22A06B"
  green-light: "#5FD39B"
typography:
  display:
    fontFamily: "PlayfairDisplay_700Bold, Playfair Display, Georgia, serif"
    fontSize: "84px"
    fontWeight: 700
    lineHeight: "90px"
    letterSpacing: "-1.5px"
  display-accent:
    fontFamily: "PlayfairDisplay_600SemiBold_Italic, Playfair Display, Georgia, serif"
    fontWeight: 600
  headline:
    fontFamily: "PlayfairDisplay_700Bold, Playfair Display, Georgia, serif"
    fontSize: "60px"
    fontWeight: 700
    lineHeight: "68px"
  placard-title:
    fontFamily: "PlayfairDisplay_700Bold, Playfair Display, Georgia, serif"
    fontSize: "44px"
    fontWeight: 700
    lineHeight: "52px"
  art-title:
    fontFamily: "PlayfairDisplay_600SemiBold_Italic, Playfair Display, Georgia, serif"
    fontSize: "14.5px"
    fontWeight: 600
  lede:
    fontFamily: "PlusJakartaSans_500Medium, Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: "31px"
  body:
    fontFamily: "PlusJakartaSans_400Regular, Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: "29px"
  facts:
    fontFamily: "PlusJakartaSans_600SemiBold, Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: "21px"
  label:
    fontFamily: "PlusJakartaSans_700Bold, Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
  button:
    fontFamily: "PlusJakartaSans_800ExtraBold, Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 800
  wordmark:
    fontFamily: "PlusJakartaSans_800ExtraBold, Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 800
    letterSpacing: "-0.4px"
  timer:
    fontFamily: "PlusJakartaSans_700Bold, Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    fontFeature: "tnum"
rounded:
  thumb-frame: "2px"
  frame: "2px"
  framed-screen: "4px"
  logo: "6px"
  option: "9px"
  feedback: "12px"
  bubble: "14px"
  held-screen: "16px"
  panel: "20px"
  pill: "999px"
spacing:
  frame: "7px"
  mat: "12px"
  rule-gap: "12px"
  line-gap: "14px"
  rule-top: "22px"
  gutter-wide: "72px"
  gutter-mid: "40px"
  gutter-phone: "20px"
  exhibit-gap: "88px"
  exhibit-gap-phone: "28px"
  wall-gap: "150px"
  wall-gap-phone: "88px"
  section-top: "128px"
  section-bottom: "140px"
  section-phone: "72px"
components:
  button-primary:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.navy}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "17px 30px"
  button-primary-hover:
    backgroundColor: "{colors.gold-hover}"
  button-outline:
    backgroundColor: "rgba(8,12,34,0.25)"
    textColor: "{colors.cream}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "17px 30px"
  button-outline-hover:
    backgroundColor: "rgba(243,237,225,0.12)"
  nav-signin:
    backgroundColor: "rgba(8,12,34,0.25)"
    textColor: "{colors.cream}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "9px 18px"
  nav-signin-hover:
    backgroundColor: "rgba(243,237,225,0.12)"
  frame:
    backgroundColor: "{colors.gold-deep}"
    rounded: "{rounded.frame}"
    padding: "{spacing.frame}"
  frame-mat:
    backgroundColor: "{colors.mat}"
    padding: "{spacing.mat}"
  access-panel:
    backgroundColor: "rgba(8,12,30,0.66)"
    rounded: "{rounded.panel}"
    padding: "28px"
  access-chip:
    backgroundColor: "transparent"
    typography: "{typography.facts}"
    rounded: "{rounded.pill}"
    padding: "7px 13px"
  topic-chip:
    backgroundColor: "rgba(15,29,51,0.06)"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  topic-chip-selected:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.cream}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  speech-bubble:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.bubble}"
    padding: "9px 14px"
  speech-bubble-reply:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.cream}"
    rounded: "{rounded.bubble}"
    padding: "9px 14px"
---

# Design System: Band 9 — landing world (/gioi-thieu)

Scope: this file records the visual world of the landing page `app/gioi-thieu.tsx`, and of the bookshelf `app/tu-sach.tsx`, which shares its palette and components (`src/components/gallery/glass.tsx`). From 15/10/2026 the page dropped its Van Gogh paintings and night navy and uses the app's own gold ground (the palette of `PhoneBackdrop`, `GLASS` and `GOLD_BUTTON` in `src/components/layout`). The rest of the app runs on its own tokens (`tailwind.config.js`, `src/theme/tokens.ts`, `src/components/ui`, the gold gradient in `global.css`). Shared ground: Plus Jakarta Sans, the brand gold `#B8955A`, the logo and the city pixel maps. Do not apply these tokens app-wide without a separate decision.

## Overview

**Creative North Star: "The Gold Hall"**

Band 9 is shown as a sunlit gold hall. The first viewport is the app's champagne ground under soft amber light, with a headline in ink brown and a gold italic second sentence. Each room sits on the same ground, each part of the app hangs as a framed exhibit, and a glass plaque at the foot of each room names it. The page closes on a deeper gold field with the access panel.

Proof is shown, not claimed: every exhibit is a small app screen built in code (a marked Reading question, a speaking room with a live voice wave, a vocabulary card, a day plan). Imagery is limited to real app assets: the Paris pixel map from Travel mode, the city thumbnails and the book covers.

The page refuses the category's stock dark SaaS layout (headline + same-size feature tiles) and does not copy TID's identity. The Band 9 logo and gold stay in the top bar (PRODUCT.md brand commitments).

**Key Characteristics:**
- The app's own gold ground: a five-stop champagne gradient, with deeper gold for the closing field.
- Ivory glass for everything that hangs on the wall: top bar, placards, plaques, access panel, city thumbnails.
- Gold metal: brand-gold frames, the solid button in the app's gold button gradient, the gold rule.
- Ink-brown type on gold; Deep Gold for accent text.
- No paintings, no night wall, no stock photos.
- Motion is light and slow; every animation stops under `prefers-reduced-motion`.

## Colors

A warm palette: one champagne ground, ink brown for type, and a gold family that plays metal, accent and light.

### Ground
- **Gold Ground** (`#FFFCF3`, `#FAF0D6`, `#F5E4B6`, `#EED59C`, `#F7EBCB` at 0 / 30 / 60 / 85 / 100%): the page and the rooms. Adjacent rooms share the same stops, so the seams disappear.
- **Deep Ground** (`#FBEFCB`, `#F2DCA2`, `#E9C878`): the closing field only.

### Text
- **Ink Gold** (`#3B2A10`): headlines, placard titles, plaque titles, labels.
- **Body Gold** (`#6E5626`): body copy and placard lines.
- **Muted Gold** (`#9C8552`): small notes and the free-to-start line.
- **Deep Gold** (`#8C6A1F`): the second sentence of every serif headline, the facts line and gold accent text. It reaches about 5:1 on ivory.

### Metal
- **Frame Gold** (`#B8955A`): frame metal (a flat fill), the city-thumbnail frames, the mock avatar disc and the plan progress bar.
- **Gold Button** (`#EBC26A` with `linear-gradient(115deg, #FFF8E0, #F4DA94, #E6BA66, #F7E4B0, #EDC57C)`): the solid primary button only.

### Glass and light
- **Ivory Glass** (`rgba(255,252,242,0.5–0.78)` over a warm gradient, 1px white rim): every glass panel. Navy glass is no longer used on this page.
- **Amber** (`#C89032`) and **Champagne Light** (`#FFF8E0`): soft blooms of light behind the hero and the rooms, at 18–26% alpha. They are light, never a ground, and never carry text.

### Mock colours
- **Navy** (`#0F1D33`), **Navy 2** (`#16264A`), **Night Screen** (`#0A1428`), **Cream** (`#F3EDE1`), **Mist** (`#C9CFDF`): used only inside the code-built app mocks (the exam header, the speaking room, the vocabulary chip).
- **Red** (`#E5484D`) and **Green** (`#22A06B`): wrong and right marks; green text on the free-access chip is `#1E6B4A`.
- **Paper** (`#FBF8F2`) and **White**: grounds of the exam paper and the plan card.

### Named Rules
**The Lamp Rule.** Gold is metal and light. It frames, underlines, marks the second sentence and fills the one primary button. It never fills a section, a card or a placard.

**The Two Golds Rule.** Deep Gold for gold text on light grounds; Frame Gold as metal only. Frame Gold is not a text colour on ivory; it does not reach legible contrast there.

## Typography

**Display Font:** Playfair Display 700 Bold and 600 SemiBold Italic (fallback Georgia, serif)
**Body Font:** Plus Jakarta Sans 400–800 (fallback Inter, system-ui)

**Character:** a high-contrast transitional serif for the gallery voice (what a thing is called), against the app's own geometric sans for the explanation and every control. The page waits for Playfair to load before painting, so headlines never swap faces.

### Hierarchy
- **Display** (Playfair 700, 84/90px, -1.5px; 64/70 at ≥640px; 46/52, -0.8px on phones): the hero headline only. Two sentences with fixed line breaks; the second set in Playfair 600 Italic in Deep Gold, with the gold shimmer.
- **Headline** (Playfair 700, 60/68px; 46/54; 36/44): one per room, centred, in Ink Gold.
- **Placard Title** (Playfair 700, 44/52px; 32/40 below 980px): the name of each exhibit, in Ink Gold.
- **Lede** (Jakarta 500, 20/31px; 17/27 on phones): the sentence under the hero headline, Body Gold, max 540px.
- **Body** (Jakarta 400, 18/29px; 16.5/26 below 980px): the line on each placard, Body Gold, max 480px.
- **Facts** (Jakarta 600, 14/21px, Deep Gold): the placard's last line; items joined with a middle dot.
- **Label** (Jakarta 700, 14–15px): sign-in link, city names, bubble text; access-list heads at 800.
- **Button** (Jakarta 800, 17px).
- **Plaque** (Playfair 600 Italic 15px, Ink Gold title; Jakarta 500 12.5px, Body Gold meta): the room name at the foot of each room.

Text inside the code-built mocks runs 12.5–16px because it depicts app UI at reduced scale; that range is not a size for page copy.

### Named Rules
**The Second Sentence Rule.** Serif headlines are two sentences. The first is Playfair 700 in Ink Gold; the second is Playfair 600 Italic in Deep Gold, with the shimmer. Line breaks are explicit.

**The Gallery Voice Rule.** Serif names things (headlines, placard titles, plaque titles). Anything you read to understand or press to act is Plus Jakarta Sans.

## Layout

The hero (sunlit field, min height = viewport, clamped 720–960px at ≥980px), five rooms (exam room → AI speaking room → Travel → vocabulary and plan → bookshelf), and the closing field with the access panel. Content sits in a centred container: 1180px in the rooms, 820px for the closing section, 720px for the hero text column.

Breakpoints: `mid` at 640px (larger type, buttons in a row, 40px gutter) and `wide` at 980px (two-column hero and exhibits, 72px gutter). Below 640px the gutter is 20px, everything stacks, the hero card is dropped, and the city thumbnails become a horizontal scroller of 150px cards.

Exhibits alternate: frame left with placard right, then flipped. Frame column and placard column flex 1.15 : 1 with an 88px gap (28px stacked). Frames have a maximum width per exhibit (460–560px). The Travel exhibit breaks the pattern on purpose: a full-container frame with the placard and five thumbnails beneath it.

Vertical rhythm: 128px top / 140px bottom (72 / 80 below 980px), 110px from section title to plaque (64), 150px between exhibits (88). Placard rhythm: title, 14px, line, 22px, 56px gold rule, 12px, facts.

## Elevation & Depth

Depth is soft and warm. Frames carry a warm drop shadow (`0 34px 70px rgba(60,40,10,.3)`), the mat is flat cream, and the glass casts `0 16px 36px -18px rgba(150,110,40,.34)`. The sunlit ground has no shadow of its own.

### Shadow Vocabulary
- **Frame drop** (`box-shadow: 0 34px 70px rgba(60,40,10,.3)`): every gold frame.
- **Held card** (`box-shadow: 0 30px 60px rgba(120,80,20,0.28)`): the unframed hero exam card, tilted 1.5deg.
- **Gold glow** (pulsing between `0 6px 16px rgba(170,120,40,.24)` and `0 12px 34px rgba(170,120,40,.42)`): the solid primary button only.
- **Bubble lift** (`box-shadow: 0 8px 20px rgba(60,40,10,0.28)`): speech bubbles on the Paris map.

### Named Rules
**The Lit Object Rule.** Only hung or held objects cast shadows, and every shadow is soft and vertical. No hard offset shadows.

## Shapes

Gallery objects are nearly square: frames 3px, mocks inside a frame 4px, thumbnail frames 2px. Things that belong to the app UI are rounder: answer options 9px, feedback panels 12px, speech bubbles 14px, the held hero card 24px, placards 22px, the access panel 20px, plaques 16px. Every control (CTA, sign-in, chips) is a full pill (999px). Borders are thin: 1px for glass rims, the sign-in link and access chips; 1.5px for answer options.

## Components

### Buttons
- **Shape:** full pill (999px), 17px × 30px, label Jakarta 800 at 17px, Ink Gold.
- **Primary:** Gold Button metal with an ink arrow, a glow that breathes, and a single light pass (sheen) on hover. Press nudges 1px down.
- **Outline:** ivory glass with an Ink Gold label; the rim brightens on hover.
- **Focus:** keyboard focus shows a 2px Deep Gold outline at 3px offset.

### Navigation
A single top bar: a 34px logo mark (6px radius) + "Band 9" wordmark, and one "Sign in" pill (1px border at 40% deep gold, 40% white wash). The whole bar is an ivory glass pill. No menu.

### Frame (signature)
A flat 6px Frame Gold border (no gradient), a 12px flat mat mount, and the warm frame drop. Native fallback: flat Frame Gold and mat, no shadow.

### Placard (signature)
Ivory glass, Placard Title in Ink Gold, one Body line in Body Gold, a 56 × 1px gold rule that shimmers on web, then a Facts line in Deep Gold. No icon, no label above the title.

### Plaque (signature)
A small ivory glass pill that closes each room: a Playfair italic room name and a Jakarta line below. It replaces the painter credit of the earlier version. It sits at the foot of each room (right on wide screens, left on phones, centred at the close).

### City thumbnails
Each thumbnail is an ivory glass panel holding a 4px Frame Gold frame around a city pixel map, with an Ink Gold label beneath.

### Chips
- **Topic chip:** pill, 6px × 12px, Jakarta 600 13px; unselected 6% navy wash with Ink, selected Navy with Cream and a leading gold check (app mock).
- **Access chip:** outline pill on the access panel, 7px × 13px, Jakarta 600 14px; green (`#1E6B4A` text) for open features, gold-brown (`#6E5626` text) for account-only, each list headed by a check or lock icon.

### Access Panel
Ivory liquid glass on the closing field: 20px radius, 28px padding (20 on phones), 20px between the two lists.

### Speech Bubble
On the Paris map: white with Ink for the question, Navy with Cream for the reply (right-aligned), Jakarta 700 15px, bubble lift. Below 640px the bubbles move off the image onto a pale strip.

### Voice Wave
Eighteen 4px gold bars scale vertically with `b9wave` (scaleY .35 → 1 → .35), 1.1s `cubic-bezier(.16,1,.3,1)` infinite, staggered 70ms; disabled under `prefers-reduced-motion`. Web only. It sits inside the dark speaking mock.

### Liquid glass
Ivory glass is the standard surface for anything that hangs on the gold ground: the top bar, placards, plaques, the outline button, the city thumbnails, the held exam card and the access panel.
- **Glass:** a warm gradient from 78% to 46% ivory, `backdrop-filter: blur(20px) saturate(125%)`, a 1px white rim, an inset top highlight and a warm drop shadow. Radius is set per element (pill for the bar and buttons, 22px for placards, 16px for plaques, 14px for thumbnails).
- **Rim:** a 1px gradient rim, bright at the top-left and gold at the bottom-right. On desktop with a fine pointer it becomes a slow conic sweep through gold and champagne (9s per turn).
- **Lens:** on Chromium, panels with `lens` bend the ground behind them through an SVG displacement filter (`#b9-lens`). The text is never bent. The lens switches on only after the browser confirms `url()` in `backdrop-filter`, and only on wide screens. Safari and Firefox get the blur without the bend.
- **Native fallback:** a flat 60% ivory wash with the same white rim. No blur, no lens.
- Glass is never filled with gold (The Lamp Rule). Gold appears only in the rim and the metal.

## Motion

All web-only and all off under `prefers-reduced-motion` (glass goes solid under `prefers-reduced-transparency`):
- **Gold shimmer:** the second sentence of the hero and the closing headline, a slow gradient sweep over 8s; the placard rule shimmers too.
- **Aurora:** two amber blooms drifting over 22s, alternate direction.
- **Light rays:** a very slow gold ray turns behind the hero (80s per turn).
- **Motes and sparks:** ten small gold points rise and fade over 9s; five small gold sparks twinkle over the headline.
- **Rise:** hero headline, lede and buttons fade up in sequence on load (1s, 80ms apart).
- **Scroll reveal:** placards, exhibit frames, city thumbnails and the access panel rise and fade in as they enter the viewport (scroll-driven, Chromium). Elsewhere they are simply visible.
- **Tilt and light (pointer, desktop only):** a glass panel tilts up to 7° and 9° toward the pointer, and a soft light follows the cursor inside it. Off on touch and under reduced motion.
- **Sheen:** the primary button gets a single light pass on hover (0.9s).
- **Glow pulse:** the solid primary button breathes its gold glow over 3.6s.
- **Lift:** frames, city thumbnails and glass panels rise 4px on hover.

### Text selection
`::selection` uses a Gold Button ground with Ink Gold text.

## Do's and Don'ts

### Do:
- **Do** use the app's own gold ground and its gold metal for this page.
- **Do** hang every app mock inside a Frame with a Placard, in a Room that closes with a Plaque (the held hero card is the single unframed exception).
- **Do** write serif headlines as two sentences, the second in Deep Gold italic (The Second Sentence Rule).
- **Do** keep controls in Plus Jakarta Sans and in full pills; keep the 2px focus ring at 3px offset.
- **Do** use Deep Gold, not Frame Gold, for gold text on light grounds (The Two Golds Rule).
- **Do** honour `prefers-reduced-motion` for any motion added.
- **Do** keep the Band 9 logo mark, wordmark and gold in the top bar (PRODUCT.md brand commitment).

### Don't:
- **Don't** bring back paintings or the night navy wall on this page. The Van Gogh backgrounds were removed on 15/10/2026 at the owner's request.
- **Don't** fill a section, a card or a placard with gold (The Lamp Rule). Glass is ivory with a gold rim only.
- **Don't** put lavender or teal in this palette; the page is gold.
- **Don't** use hard offset shadows or put shadows on anything that is not hung or held (The Lit Object Rule).
- **Don't** add stock photos, generated people or uncredited art.
- **Don't** add icons or small labels above placard titles; the placard is title, line, rule, facts.
- **Don't** set body text directly on a busy image without a glass panel or a plaque behind it.
