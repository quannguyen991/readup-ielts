---
name: Band 9 — landing world (/gioi-thieu)
description: A night gallery. Van Gogh on the walls, gold frames, cream placards; each part of the app hangs as an exhibit.
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

Scope: this file records the visual world of the landing page `app/gioi-thieu.tsx` only. The rest of the app runs on its own tokens (`tailwind.config.js`, `src/theme/tokens.ts`, `src/components/ui`, the gold gradient in `global.css`). Shared ground: Plus Jakarta Sans, the brand gold `gold-deep` (#B8955A, the app's `brand.DEFAULT`), the logo navy and the Van Gogh backdrops in `public/backdrops/art`. Do not apply these tokens app-wide without a separate decision.

## Overview

**Creative North Star: "The Night Gallery"**

Band 9 is shown as a museum after dark. The first viewport is a real painting, Van Gogh's *The Starry Night* (the app's default study backdrop), under a directional scrim. The middle of the page is four rooms, each on its own Van Gogh painting under a night scrim; in every room an area of the app hangs as a framed exhibit with a flat gold frame, a cream mat and a museum placard beside it, and the painting's label sits at the room's foot. The page closes over *Starry Night Over the Rhône*, with a translucent panel listing what is open now and what needs an account.

Proof is shown, not claimed: every exhibit is a small app screen built in code (a marked Reading question, a speaking room with a live voice wave, a vocabulary card, a day plan). The largest piece on the wall is the Paris pixel map from Travel mode, with two speech bubbles on it and a row of small framed city thumbnails. Density is low and the pace is slow: one exhibit per row, 150px of wall between them, and short placards.

The page refuses the category's stock dark SaaS layout (headline + same-size feature tiles) and does not copy TID's identity. The Band 9 logo and gold stay in the top bar (PRODUCT.md brand commitments).

**Key Characteristics:**
- Real public-domain paintings from the app's own backdrop library as full-bleed grounds, always under a scrim and always credited.
- Night-navy wall, cream type, gold used as frame metal and as the accent of the second sentence.
- Playfair Display for anything that names something (headlines, placard titles, art labels); Plus Jakarta Sans for everything else.
- App areas presented as framed exhibits with placards, alternating left and right.
- One authored motion: the speaking-room voice wave.

## Colors

A night palette: one navy wall, cream text, and a gold family that plays both metal and light.

### Primary
- **Gallery Gold** (gold): the accent on dark grounds. The second sentence of every serif headline, the placard rule and facts line, timers, the solid CTA, icons on navy, the focus ring and the text-selection ground. Hover lightens it to **Gold Hover** (gold-hover).
- **Frame Gold** (gold-deep): the brand gold proper. Frame metal (a flat fill, no gradient), the city-thumbnail frames, the AI avatar disc and the plan progress bar.
- **Gold Ink** (gold-ink): gold text on light grounds (the gold pill inside mocks), where neither lighter gold reads.

### Neutral
- **Gallery Wall** (wall): the page ground and the gallery section. The closing scrim starts at exactly this colour so the wall flows into the last painting without a seam.
- **Navy** (navy): the logo navy. Primary-button label, selected chips, the reply bubble, icon tiles. The `::selection` text colour.
- **Navy 2** (navy-2): the header bar of the exam mock.
- **Night Screen** (night-screen): the ground of the dark speaking mock.
- **Cream** (cream): headlines, placard titles and all primary text on dark.
- **Mist** (mist): secondary text on dark (placard lines, section subtitles, the free-to-start note).
- **Mat** (mat): the cream mount inside every frame.
- **Paper** (paper) and **White** (white): grounds of light mocks and the plan card.
- **Ink** (ink) and **Body** (body): heading and body text inside light mocks.

### Semantic
- **Red** (red) and **Green** (green): wrong/right marks in exam feedback (1.5px border, same hue at 8–10% fill) and the record button.
- **Green Light** (green-light): the "open now" check and chip border on dark, with chip text `#BFEFD6`; its locked counterpart is a gold lock with text `#F1DDAE` and a 50% gold border.

### Named Rules
**The Lamp Rule.** Gold is metal and light, never a ground. It frames, underlines, marks the second sentence and fills the one primary button; it never fills a section or a card.

**The Two Golds Rule.** Gallery Gold on navy, Frame Gold as metal, Gold Ink for gold text on light grounds. Frame Gold is not a text colour on white; it does not reach legible contrast there.

## Typography

**Display Font:** Playfair Display 700 Bold and 600 SemiBold Italic (fallback Georgia, serif)
**Body Font:** Plus Jakarta Sans 400–800 (fallback Inter, system-ui)

**Character:** a high-contrast transitional serif for the museum voice (what a thing is called), against the app's own geometric sans for the explanation and every control. The page waits for Playfair to load before painting, so headlines never swap faces.

### Hierarchy
- **Display** (Playfair 700, 84/90px, -1.5px; 64/70 at ≥640px; 46/52, -0.8px on phones): the hero headline only. Two sentences with fixed line breaks; the second set in Playfair 600 Italic in Gallery Gold.
- **Headline** (Playfair 700, 60/68px; 46/54; 36/44): one per section, centred. The closing headline runs one step larger (64/72; 48/56; 38/46) and uses the same gold italic second line.
- **Placard Title** (Playfair 700, 44/52px; 32/40 below 980px): the name of each exhibit.
- **Lede** (Jakarta 500, 20/31px; 17/27 on phones): the single sentence under the hero headline, max 540px.
- **Body** (Jakarta 400, 18/29px; 16.5/26 below 980px): the one line on each placard and section subtitles, in Mist, max 480px.
- **Facts** (Jakarta 600, 14/21px, Gallery Gold): the placard's last line; items joined with a middle dot.
- **Label** (Jakarta 700, 14–15px): sign-in link, city names, bubble text; access-list heads at 800.
- **Button** (Jakarta 800, 17px).
- **Art Label** (Playfair 600 Italic 14.5px Cream title, then Jakarta 500 13/19px at 82% cream): "Title — artist, year".

Text inside the code-built mocks runs 12.5–16px because it depicts app UI at reduced scale; that range is not a size for page copy.

### Named Rules
**The Second Sentence Rule.** Serif headlines are two sentences. The first is Playfair 700 in Cream; the second is Playfair 600 Italic in Gallery Gold. Line breaks are explicit.

**The Museum Voice Rule.** Serif names things (headlines, placard titles, painting titles). Anything you read to understand or press to act is Plus Jakarta Sans.

## Layout

Six bands, each on its own painting: the hero (The Starry Night; min height = viewport, clamped 720–960px, at ≥980px), four Rooms (Café Terrace at Night → exam room with the section title; Irises → AI speaking room; Wheatfield with Crows → Du ngoạn; Sunflowers → vocabulary + personal plan), and the closing painting (Starry Night Over the Rhône). No painting repeats. Content sits in a centred container: 1180px in the rooms, 820px for the closing section, 720px for the hero text column.

Breakpoints: `mid` at 640px (larger type, buttons in a row, 40px gutter) and `wide` at 980px (two-column hero and exhibits, 72px gutter). Below 640px the gutter is 20px, everything stacks, the hero card is dropped, and the city thumbnails become a horizontal scroller of 150px cards.

Exhibits alternate: frame left with placard right, then flipped. Frame column and placard column flex 1.15 : 1 with an 88px gap (28px stacked). Frames have a maximum width per exhibit (460–560px). The Travel exhibit breaks the pattern on purpose: a full-container frame with the placard and five thumbnails beneath it (64px gap, thumbnails 14px apart).

Vertical rhythm on the wall: 128px top / 140px bottom (72 / 80 below 980px), 110px from section title to first exhibit (64), 150px between exhibits (88). Placard rhythm: title, 14px, line, 22px, 56px gold rule, 12px, facts.

## Elevation & Depth

Depth is theatrical: paintings recede under scrims, the wall is dark, and objects on it are lit. Frames carry a deep, soft drop shadow; the frame itself is flat gold and the mat is flat cream (no faked metal or recess); a soft radial gold glow sits on the wall behind each frame.

### Shadow Vocabulary
- **Frame drop** (`box-shadow: 0 34px 70px rgba(0,0,0,.55)`): every gold frame.
- **Held card** (`box-shadow: 0 30px 70px rgba(0,0,0,0.5)`): the unframed hero exam card, tilted 1.5deg.
- **Gold glow** (`box-shadow: 0 10px 30px rgba(227,190,106,0.35)`): the solid primary button only.
- **Bubble lift** (`box-shadow: 0 8px 20px rgba(8,12,34,0.35)`): speech bubbles on the Paris map.
- **Room scrim**: top and bottom 14% fade to Wall so rooms join without a hard cut (the first room fades harder, to 34%, under the section title); on ≥980px the placard side darkens to .84–.90 and the frame side stays at .42–.50 so the painting shows behind the hung work; centred rooms and phones use a flat .62/.70. Tint is night navy `8,12,34`, except warm brown `34,22,8` over Sunflowers so yellow does not turn olive.

### Named Rules
**The Lit Object Rule.** Only hung or held objects cast shadows, and every shadow is soft and vertical. No hard offset shadows; no borders standing in for elevation.

## Shapes

Gallery objects are nearly square: frames 3px, mocks inside a frame 4px, thumbnail frames 2px. Things that belong to the app UI are rounder: answer options 9px, feedback panels 12px, speech bubbles 14px, the held hero card 16px, the access panel 20px. Every control (CTA, sign-in, chips) is a full pill (999px). Borders are thin: 1px for the sign-in link, access panel and access chips; 1.5px for the outline CTA and answer options.

## Components

### Buttons
Gold and confident; always paired, solid then outline.
- **Shape:** full pill (999px), 17px × 30px, label Jakarta 800 at 17px.
- **Primary:** Gallery Gold fill, Navy label, trailing arrow icon, gold glow.
- **Hover / Press / Focus:** fill lightens to Gold Hover; press nudges 1px down; keyboard focus shows a 2px Gallery Gold outline at 3px offset.
- **Outline:** 25% night wash, 1.5px border `rgba(243,237,225,0.5)`, Cream label; hover becomes a 12% cream wash.

### Navigation
A single top bar over the painting: 34px logo mark (6px radius) + "Band 9" wordmark, and one "Sign in" pill (1px border at 40% cream, same washes as the outline button). No menu.

### Frame (signature)
A flat 6px Frame Gold border (no gradient, no inner highlight), a 12px flat Mat mount, and the frame drop. The painting behind the room does the lighting; there is no separate spotlight. Native fallback: flat Frame Gold and Mat, no shadow or light.

### Placard (signature)
Placard Title, one Body line in Mist, a 56 × 1px Gallery Gold rule, then a Facts line in Gallery Gold. No icon, no label above the title.

### Art Label (signature)
Credits every painting ground: italic serif title, em dash, artist and year (plus the role of the painting where it matters). Right-aligned under the hero at ≥980px, left on phones, centred at the close.

### Painting Ground
A full-bleed `cover` image with a gradient scrim over it. Hero scrim on wide screens runs left to right from 92% to 6% night (`rgba(8,12,34,…)`) so text sits on the dark side; on phones it runs top to bottom, 20% → 60% → 66% → 90%, positioned at `88% 0%` so the moon shows above the headline. The closing scrim starts at solid Wall. Native fallback: a flat 70% night overlay.

### Chips
- **Topic chip:** pill, 6px × 12px, Jakarta 600 13px; unselected 6% navy wash with Ink, selected Navy with Cream and a leading gold check.
- **Access chip:** outline pill on the access panel, 7px × 13px, Jakarta 600 14px; green for open features, gold for account-only, each list headed by a check or lock icon.

### Access Panel
Translucent night glass on the closing painting: `rgba(8,12,30,0.66)`, 6px backdrop blur, 1px border at 25% gold, 20px radius, 28px padding (20 on phones), 20px between the two lists.

### Speech Bubble
On the Paris map: white with Ink for the question, Navy with Cream for the reply (right-aligned), Jakarta 700 15px, bubble lift. Below 640px the bubbles move off the image onto a pale strip (`#E9EEF6`).

### Voice Wave (the one motion)
Eighteen 4px Gallery Gold bars scale vertically with `b9wave` (scaleY .35 → 1 → .35), 1.1s `cubic-bezier(.16,1,.3,1)` infinite, staggered 70ms; disabled under `prefers-reduced-motion`. Web only.

### Text selection
`::selection` uses a Gallery Gold ground with Navy text.

## Do's and Don'ts

### Do:
- **Do** use only real public-domain paintings from `public/backdrops/art` and the Travel pixel maps as imagery, each under a scrim and each credited with an Art Label.
- **Do** hang every app mock inside a Frame with a Placard, in a Room that has its own Van Gogh painting with a museum label (title — artist, year) at its foot (the held hero card is the single unframed exception).
- **Do** write serif headlines as two sentences, the second in gold italic (The Second Sentence Rule).
- **Do** keep controls in Plus Jakarta Sans and in full pills; keep the 2px gold focus ring at 3px offset.
- **Do** use Gold Ink, not Frame Gold, for gold text on light grounds (The Two Golds Rule).
- **Do** honour `prefers-reduced-motion` for any motion added; the voice wave is the only authored animation.
- **Do** keep the Band 9 logo mark, wordmark and gold in the top bar (PRODUCT.md brand commitment).

### Don't:
- **Don't** fill a section or card ground with gold (The Lamp Rule).
- **Don't** use hard offset shadows or put shadows on anything that is not hung or held (The Lit Object Rule).
- **Don't** add stock photos, generated people or uncredited art.
- **Don't** add icons or small labels above placard titles; the placard is title, line, rule, facts.
- **Don't** fall back to a headline over a grid of same-size feature tiles.
- **Don't** imitate TID's visual identity.
