<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- begin caveman compression agent -->

You are a caveman compression expert. Aggressively remove all stop words and grammatical scaffolding while preserving meaning.

CORE STRATEGY:
1. Remove articles, auxiliary verbs, and redundant words. Keep only content words that carry semantic meaning.
2. Use simple, common words. If there's a simpler word, use it. Think like a caveman.

ALWAYS REMOVE:
- Articles: a, an, the
- Auxiliary verbs: is, are, was, were, am, be, been, being, have, has, had, do, does, did
- Common prepositions when meaning stays clear: of, for, to, in, on, at
- Pronouns when context is clear: it, this, that, these, those
- Pure intensifiers: very, quite, rather, somewhat, really, extremely

ALWAYS KEEP:
- All nouns (people, places, things, concepts)
- All main verbs (actions, not auxiliaries)
- All adjectives that add meaning
- All numbers and quantifiers (at least, approximately, more than, 15, many)
- Uncertainty qualifiers (what sounded like, appears to be, seems, might)
- Critical prepositions that change meaning (from, with, without, stuck to)
- Time/frequency words (every Tuesday, weekly, daily, always, never)
- Names, titles (Dr., Mr., Senator)
- Technical terms and domain-specific language

BE SMART ABOUT:
- Keep prepositions when they define relationships: "made from wood" (keep from), "system for processing" (remove for)
- Keep "in/on/at" when they specify location/position, remove when just grammatical
- Remove "is/are/was/were" unless part of passive voice that matters
- Keep negations (not, no, never, without)

EXAMPLES:

"Caveman Compression is a semantic compression method for LLM contexts"
→ "Caveman Compression semantic compression method LLM contexts."
(Remove: is, a, for)

"It removes predictable grammar while preserving the unpredictable content"
→ "Removes predictable grammar preserving unpredictable content."
(Remove: It, the, while → keep main meaning)

"The system was designed to process data efficiently"
→ "System designed process data efficiently."
(Remove: The, was, to)

"There were at least 20 people"
→ "At least 20 people."
(Keep: at least - quantifier matters)

"Made from wood and metal"
→ "Made from wood and metal."
(Keep: from - shows material relationship)

Output ONLY the caveman compressed text, nothing else.

TEXT TO COMPRESS:
{text}
<!-- end caveman compression agent -->

<!-- start plasma agent  -->
# Plasma — Second Screen Gaming Social Hub

Plasma is a "Second Screen" web application — a supplementary social layer for PC gamers that sits above desktop launchers like Steam or Battle.net. It aggregates live gaming activity, schedules multiplayer sessions, tracks non-Steam libraries, and gamifies achievement hunting — all in a glassmorphic dark-mode UI built for late-night gaming sessions.

---

## Design System

### Color Palette

| Token             | Hex       | Usage                                                        |
| ----------------- | --------- | ------------------------------------------------------------ |
| `--bg`            | `#0D0B14` | App background, deepest layer                                |
| `--slate`         | `#1A1726` | Cards, panels, sidebar background                            |
| `--slate-hover`   | `#28243D` | Hover states, active nav items, elevated cards               |
| `--primary`       | `#563895` | Primary buttons, active tab indicators, selected states      |
| `--secondary`     | `#FF2A7A` | Accent badges, live indicators, notification dots, CTAs      |
| `--text-primary`  | `#F8F9FA` | Headings, body text, primary labels                          |
| `--text-secondary`| `#8A869C` | Timestamps, captions, helper text, placeholders              |
| `--success`       | `#2ECC71` | Online status dot, RSVP confirmed, achievement unlocked      |
| `--warning`       | `#F1C40F` | Pending RSVP, in-progress status                             |
| `--error`         | `#E74C3C` | Error toasts, destructive actions, conflict warnings         |

### Gradients

- **Primary Gradient**: linear-gradient(135deg, #563895, #FF2A7A) — used for hero CTAs, logo highlight, progress bars, and XP indicators.
- **Card Glow**: 0 0 30px rgba(86, 56, 149, 0.25) box-shadow on hover for interactive cards.
- **Glassmorphism**: background rgba(26, 23, 38, 0.7) with backdrop-filter: blur(16px) and a 1px border of rgba(86, 56, 149, 0.2) — used on modals, dropdowns, and overlay panels.

### Typography

| Element       | Font Family          | Weight   | Size   |
| ------------- | -------------------- | -------- | ------ |
| Display/Logo  | **Rajdhani**         | 700      | 48px   |
| H1            | **Rajdhani**         | 700      | 32px   |
| H2            | **Rajdhani**         | 600      | 24px   |
| H3            | **Rajdhani**         | 600      | 20px   |
| Body          | **Inter**            | 400      | 15px   |
| Body Small    | **Inter**            | 400      | 13px   |
| Caption       | **Inter**            | 500      | 11px   |
| Button        | **Inter**            | 600      | 14px   |
| Monospace/XP  | **JetBrains Mono**   | 500      | 14px   |

Line-height: 1.5 for body, 1.2 for headings. Letter-spacing: 0.02em on captions and buttons.

### Border Radius

| Element           | Radius |
| ----------------- | ------ |
| Buttons           | 8px    |
| Cards             | 12px   |
| Modals            | 16px   |
| Avatars           | 50%    |
| Input fields      | 8px    |
| Pill badges/tags  | 999px  |

### Spacing Scale

4px base unit: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64.

### Iconography

Use Phosphor Icons (bold weight) for all UI icons. 20px default, 24px for nav. All icons inherit `--text-secondary` by default, `--text-primary` on active/hover.

### Motion & Animation

- Default transition: 200ms ease for all interactive elements.
- Card hover: translateY(-2px) + glow box-shadow, 250ms ease.
- Page transitions: fade-in 300ms ease.
- Live pulse: keyframe animation — repeating scale(1) → scale(1.4) with opacity 1 → 0 on the live status dot, 1.5s infinite.
- Skeleton loading: shimmer gradient animation (left-to-right sweep) on placeholder blocks while data loads.

---

## Global Layout

### Desktop (≥ 1024px)

```
┌──────────────────────────────────────────────────────┐
│  Top Bar (64px height)                               │
│  [Logo]  [Search]  [Intent Mode Toggle]  [Notif] [Avatar] │
├────────────┬─────────────────────────────────────────┤
│  Sidebar   │  Main Content Area                      │
│  (240px)   │                                         │
│            │                                         │
│  ☰ Pulse   │  (Scrollable, max-width 960px centered) │
│  ☰ Rally   │                                         │
│  ☰ Library │                                         │
│  ☰ Prestige│                                         │
│            │                                         │
│  ──────    │                                         │
│  Squad     │                                         │
│  Online(5) │                                         │
│  • friend1 │                                         │
│  • friend2 │                                         │
│            │                                         │
└────────────┴─────────────────────────────────────────┘
```

- **Left Sidebar**: Fixed, `--slate` background, 240px wide. Contains nav links with Phosphor icons + labels. Each link has an active indicator (3px left border in `--primary`). Below the nav links is a "Squad Panel" showing online friends with colored status dots and their current game.
- **Top Bar**: Fixed, `--bg` background with a subtle bottom border (1px `--slate-hover`). Contains the Plasma logo (left), a global search input (center), the Intent Mode quick-toggle button (pill shaped), notification bell with `--secondary` dot badge, and user avatar dropdown (right).

### Mobile (< 1024px)

- Sidebar collapses. A fixed bottom navigation bar (56px, `--slate` background) with 5 icon tabs: Pulse, Rally, Library, Prestige, Profile.
- Top bar simplifies to: hamburger menu, logo, notification bell.
- All content is full-width with 16px horizontal padding.

---

## Component Library

### 1. Navigation Item

- Idle: Phosphor icon (20px, `--text-secondary`) + label (14px Inter 500, `--text-secondary`). Padding 12px 16px.
- Hover: Background `--slate-hover`, text `--text-primary`.
- Active: Left border 3px `--primary`, text `--text-primary`, icon `--primary`.

### 2. Primary Button

- Background: `--primary`. Text: `--text-primary`. Padding: 10px 20px. Border-radius: 8px. Font: Inter 600 14px.
- Hover: lighten 10%, box-shadow glow.
- Disabled: opacity 0.5, pointer-events none.

### 3. Secondary Button

- Background: transparent. Border: 1px `--primary`. Text: `--primary`. Same sizing as Primary.
- Hover: background rgba(86, 56, 149, 0.15).

### 4. Accent/CTA Button

- Background: linear-gradient(135deg, #563895, #FF2A7A). Text: white. Used for key actions like "Create Rally" or "Post Moment". Subtle pulse glow on hover.

### 5. User Avatar

- Circle, sizes: 32px (feed inline), 40px (sidebar/list), 64px (profile card), 120px (profile page).
- Border: 2px solid varies by Intent Mode (see below).
- Online dot: 10px circle, `--success`, positioned bottom-right with a 2px `--slate` outline.

### 6. Intent Mode Border Colors

| Mode         | Border Color | Badge Text    |
| ------------ | ------------ | ------------- |
| Competitive  | `#E74C3C`    | ⚔️ COMP       |
| Casual       | `#2ECC71`    | 🎮 CHILL      |
| Offline      | `--text-secondary` | 💤 AWAY  |

### 7. Feed Post Card

- Background: `--slate`. Border-radius: 12px. Padding: 16px. Margin-bottom: 12px.
- Header: UserAvatar (40px) + Username (Inter 600, `--text-primary`) + Timestamp (Inter 400 13px, `--text-secondary`) + Intent badge pill.
- Body: Text content (15px), optional media attachment (image/video with rounded corners, max-height 400px).
- Footer: Row of icon buttons — ❤️ Like, 💬 Comment, 🔗 Share — in `--text-secondary`, `--secondary` when active. Like count displayed.
- Auto-generated posts (e.g. "started playing Elden Ring") get a distinct left border (3px `--primary`) and a Phosphor game controller icon.

### 8. Activity Status Row (Auto-generated feed item)

- Compact row: avatar (32px) + "**Username** started playing **Game Title**" + timestamp. Background: `--slate` with 3px left `--primary` border. Small "Join" pill button on the right if joinable (steam:// link).

### 9. Rally Event Card

- Background: `--slate`. Border-radius: 12px. Padding: 20px.
- Top section: Game cover art thumbnail (80×80, rounded 8px) + Event title (H3, Rajdhani 600) + Game name (Body Small, `--text-secondary`).
- Date/Time row: Calendar icon + date, Clock icon + time (displayed in viewer's local timezone), Intent mode pill badge.
- RSVP section: Row of role slots (e.g., "🛡 Tank: 1/2", "⚔ DPS: 2/4", "💚 Healer: 0/1") with fill progress. Each role has an avatar stack of signed-up users.
- Footer: "RSVP" accent button (gradient CTA), attendee count "5/10 Slots Filled", host avatar + name.
- Upcoming indicator: If within 24hrs, a pulsing `--secondary` "STARTING SOON" badge.

### 10. Game Library Card (Omni-Library)

- Aspect ratio 3:4 portrait card. Background: game cover art fills the card.
- Bottom overlay: glassmorphism bar with game title (Inter 600 14px) + platform icon (Steam/Epic/Riot etc.).
- Hover: scale(1.03), reveal "Set Playing" toggle button + "View Details" link.
- Active "Playing" state: `--secondary` border glow + "NOW PLAYING" badge top-right.

### 11. Achievement Badge (Prestige)

- Circular or shield-shaped container, 72px. Trophy icon or game-specific art in center.
- Rarity ring: color-coded border — Common (gray), Uncommon (`--success`), Rare (`#3498DB`), Epic (`--primary`), Legendary (`--secondary` with glow).
- Below: achievement name (caption, 11px) + XP value (JetBrains Mono, `--secondary`).
- "Pinned" achievements in Hall of Fame get a ⭐ indicator.

### 12. Toast Notification

- Fixed bottom-right (desktop) or top-center (mobile). Glassmorphism background. 12px border-radius. Slide-in from right animation.
- Left accent stripe: color matches type (success/warning/error). Icon + message text + close X. Auto-dismiss 5s.

### 13. Modal / Dialog

- Centered overlay. Background: glassmorphism (rgba(26, 23, 38, 0.85), blur 20px). Border: 1px rgba(86, 56, 149, 0.3). Border-radius: 16px. Max-width: 520px.
- Backdrop: rgba(13, 11, 20, 0.7) with click-to-close.
- Content: H2 title + body + action buttons row (secondary left, primary right).

### 14. Search Input

- Background: `--slate-hover`. Border: 1px transparent, focus: 1px `--primary`. Border-radius: 8px. Padding: 10px 16px. Placeholder: `--text-secondary`.
- Phosphor MagnifyingGlass icon left-aligned inside the input.
- Dropdown results panel: glassmorphism, appears below on focus with matching items. Each result row: thumbnail + title + subtitle.

### 15. Stat Counter / XP Display

- Large number in JetBrains Mono 700, 32px, with `--secondary` color or gradient text.
- Label below in caption style. Small animated increment when value changes.
- Used on profile for "Plasma XP", "Achievements Unlocked", "Rallies Attended".

---

## Screens

### Screen 1: Login / Landing Page

**Purpose**: Unauthenticated entry point. First impression of the brand.

**Layout**:
- Full viewport, `--bg` background.
- Centered card (480px max-width, glassmorphism style).
- Plasma logo large (Rajdhani 700 48px) at top with gradient text effect (primary gradient on the word "PLASMA").
- Tagline below: "Your Second Screen for Gaming" in `--text-secondary`, Inter 400 16px.
- Large CTA button: "Sign in with Steam" — `--primary` background with a Steam icon (white). Full-width inside the card.
- Below the button: small text "Plasma connects to your Steam account to sync your friends and game activity." in `--text-secondary` 13px.
- Background: subtle animated particle effect or abstract geometric shapes in very low opacity `--primary` and `--secondary` tones.

**Interactions**:
- Clicking "Sign in with Steam" redirects to Steam OpenID 2.0 auth flow.
- On successful return, redirect to The Pulse (dashboard).

---

### Screen 2: The Pulse (Main Dashboard / Social Feed)

**Purpose**: The home screen. A unified activity feed combining live Steam statuses and user-generated posts.

**Layout** (uses Global Layout):

**Top Bar additions**:
- Intent Mode toggle prominently displayed as a segmented pill: COMP | CHILL | LFG. Active segment uses corresponding Intent color background. Clicking switches the user's global intent and broadcasts to feed.

**Main Content Area**:
- **Create Post composer** (top): A slim card with user avatar (40px) + placeholder text "Share a moment..." in an input field. Clicking expands to full composer with text area, media upload buttons (image, video clip), and a "Post" accent button. Optional: tag a game from Omni-Library.
- **Feed Filter Bar**: Horizontal pill toggle row: "All" | "Friends Activity" | "My Posts" | "Comp Only" | "Chill Only". Active pill: `--primary` background.
- **Feed Items** (scrollable list):
  - Mix of **Activity Status Rows** (auto-generated, e.g. "Wahaj started playing Counter-Strike 2" with a "Join" button) and **Feed Post Cards** (user-generated moments with text, images, likes, comments).
  - Each item shows the Intent badge of the posting user.
  - Infinite scroll with skeleton loading shimmer.

**Right Rail** (desktop only, 280px, visible ≥ 1280px):
- "Trending in Your Squad" — top 3 games being played right now by friends, with player count badges.
- "Upcoming Rallies" — next 2 scheduled events with countdown timers.
- "Your Prestige" — mini XP counter and rank badge.

**Interactions**:
- Click "Join" on an activity → triggers `steam://connect/...` or `steam://run/<AppID>` URI.
- Click a username → navigate to that user's profile.
- Like/Comment on posts inline. Comment section expands below the post.
- Pull-to-refresh on mobile.

---

### Screen 3: The Rally (Event Scheduling Calendar)

**Purpose**: Calendar-based event coordination for multiplayer sessions.

**Layout**:

**Sub-header**:
- Page title "The Rally" (H1, Rajdhani 700).
- "Create Rally" accent gradient button (top-right).
- View toggle: "Calendar" | "List" pill switcher.
- Intent filter dropdown: "All Intents" | "Comp" | "Chill" | "LFG".

**Calendar View**:
- Monthly grid calendar. `--slate` cell backgrounds. Today's date highlighted with `--primary` border.
- Event dots on days with scheduled Rallies (colored by Intent Mode of the event).
- Clicking a day opens a day-detail panel (right side or bottom sheet on mobile) listing all events for that day as Rally Event Cards.

**List View** (alternative):
- Chronological list of upcoming Rally Event Cards, sorted by date. Grouped by "Today", "This Week", "Later".
- Each card shows: game thumbnail, title, date/time (auto-converted to local timezone), RSVP count, host name, role slots remaining.

**Interactions**:
- "Create Rally" opens a Modal with form: Event title, Game (search via IGDB/Steam), Date & Time picker (stores UTC), Intent Mode selector, Role slots (add custom roles like DPS/Healer/Tank with max count), Invite friends (multi-select from friends list), Description textarea. "Create" accent button to submit.
- Clicking an event card opens expanded detail view with full role roster, RSVP button with role selection dropdown, chat/comment thread for the event, and a "Copy Invite Link" button.
- RSVP: user selects a role → their avatar populates the role slot → RSVP count updates.
- 15-minute reminder: browser push notification.

---

### Screen 4: The Omni-Library (Manual Game Tracking)

**Purpose**: A virtual shelf for tracking non-Steam games with IGDB metadata.

**Layout**:

**Sub-header**:
- Page title "The Omni-Library" (H1).
- Search bar (prominent, full-width on mobile, 400px on desktop): "Search any game..." with IGDB-powered autocomplete dropdown showing game cover art + title + platform + year.
- Filter pills: "All" | "Currently Playing" | "Steam" | "Non-Steam" | by platform icons.

**Library Grid**:
- Responsive grid of Game Library Cards (portrait 3:4 ratio).
- Desktop: 5 columns. Tablet: 3 columns. Mobile: 2 columns.
- Each card: game cover art, bottom glassmorphism bar with title + platform icon.
- Cards marked "Now Playing" have a glowing `--secondary` border and a "NOW PLAYING" pill badge.
- Hovering a card reveals "Set Playing" toggle and "Remove" option.

**Empty State**:
- If library is empty: illustration placeholder + "Your shelf is empty. Search for a game above to start building your collection." text + search CTA button.

**Interactions**:
- Searching a title queries IGDB API, shows autocomplete results. Clicking a result adds it to the user's library with metadata (cover art, platform, release date).
- "Set Playing" toggle: marks game as actively playing → broadcasts "User is now playing [Game]" to The Pulse.
- Clicking a card opens a Game Detail modal: cover art, description, platform, release date, "Set Playing" toggle, link to IGDB page, "Remove from Library" destructive button.

---

### Screen 5: The Prestige (Gamification & Achievements)

**Purpose**: Universal achievement tracker, XP system, and leaderboards.

**Layout**:

**Sub-header**:
- Page title "The Prestige" (H1).
- User's total Plasma XP displayed prominently: large number (JetBrains Mono 700, gradient text), label "PLASMA XP" below.
- "Global Rank: #42" badge to the right.

**Hall of Fame Section**:
- Horizontal scrollable row of up to 5 pinned Achievement Badges (large, 96px). Each shows trophy art, name, rarity ring color, XP value.
- "Edit Hall of Fame" text button to manage pinned achievements.

**Achievement Grid**:
- Tabs: "Steam Trophies" | "Manual Milestones" | "All".
- Grid of Achievement Badges (smaller, 72px). Organized by game. Each badge: icon, name, rarity, XP.
- Locked/unclaimed achievements appear desaturated with a lock icon overlay.
- Filter: by game, by rarity tier (Common → Legendary), by recently unlocked.

**Leaderboard Panel** (sidebar on desktop, tab on mobile):
- "Friends Leaderboard" — ranked list of friends by Plasma XP. Each row: Rank # + avatar + username + XP (JetBrains Mono). Top 3 get gold/silver/bronze medal icons.
- "Global Leaderboard" tab for all users.

**Interactions**:
- Clicking an achievement opens detail modal: full description, game it belongs to, global unlock percentage (with rarity tier label), date unlocked, XP awarded (calculated as inverse of unlock %).
- "Claim Milestone" button for non-Steam games: opens a form to submit a milestone claim (game, milestone description, optional screenshot proof). Pending claims show as "⏳ Pending Verification".
- "Pin to Hall of Fame": available on each achievement, max 5 pinned.

---

### Screen 6: User Profile Page

**Purpose**: A user's public profile showing their gaming identity, stats, and activity.

**Layout**:

**Profile Header** (full-width banner area):
- Background: blurred game art or a gradient (primary gradient at low opacity).
- Large avatar (120px) with Intent Mode colored border + online status dot.
- Username (H1, Rajdhani 700) + Intent Mode pill badge + "Member since [date]" caption.
- Stat row: "Plasma XP: 12,450" | "Achievements: 184" | "Rallies Attended: 23" | "Library: 47 titles" — each in a mini stat card (glassmorphism).

**Hall of Fame Row**:
- The user's 5 pinned Prestige achievements displayed horizontally.

**Tabs below header**:
- "Activity" — user's recent Pulse posts and auto-activity (same feed card format).
- "Library" — grid of their Omni-Library games.
- "Achievements" — their Prestige achievement showcase.
- "Rallies" — upcoming and past events they've participated in.

**Interactions**:
- If viewing own profile: "Edit Profile" button in header for changing avatar, display name.
- If viewing another user: "Add Friend" / "Remove Friend" button, "View on Steam" link.
- Tabs switch content below the header without page reload.

---

### Screen 7: Intent Mode Quick-Toggle (Global Component)

**Purpose**: Accessible from any screen via the top bar. Allows the user to instantly change their social intent.

**Implementation**:
- A segmented control / pill group in the top bar: **COMP** (red) | **CHILL** (green) | **LFG** (yellow).
- Clicking a segment:
  1. Instantly updates the user's avatar border color across all UI surfaces.
  2. Broadcasts a status change event to The Pulse ("Wahaj switched to Comp Mode ⚔️").
  3. Visual feedback: brief pulse animation on the selected segment.
- On mobile: accessible via profile icon or a floating action button.

---

### Screen 8: Notification Panel

**Purpose**: Dropdown panel from the bell icon showing recent alerts.

**Layout**:
- Dropdown from top bar bell icon, glassmorphism panel, 360px wide (desktop), full-width sheet (mobile).
- List of notification items, each with: icon (type-specific), message text, timestamp, unread dot (`--secondary`).
- Types: "Rally starting in 15 min", "Wahaj liked your post", "New friend request", "Achievement unlocked!", "Wahaj started playing [Game]".
- "Mark all read" text button at top-right.
- Clicking a notification navigates to the relevant screen/content.

---

### Screen 9: Create Rally Modal (Event Creation Form)

**Purpose**: Full form for creating a multiplayer gaming event.

**Fields**:
1. **Event Title** — text input, placeholder "Friday Night Ranked Grind".
2. **Game** — search input with IGDB/Steam autocomplete. Shows selected game with cover thumbnail.
3. **Date & Time** — date picker + time picker. Stores as UTC, displays note: "Times will be shown in each viewer's local timezone."
4. **Intent Mode** — radio group: Comp / Chill / LFG. Affects event card styling.
5. **Roles** — dynamic list. Each role: name input (e.g., "DPS") + max count stepper. "Add Role" text button. Preset templates: "Standard MMO (Tank/Healer/DPS)", "FPS Squad (Entry/Support/AWP/IGL)", "Custom".
6. **Invite Friends** — multi-select search of friends list, with avatar chips for selected users.
7. **Description** — textarea for additional notes.
8. **Actions**: "Cancel" secondary button, "Create Rally" accent gradient button.

**Styling**: Modal component with glassmorphism. Form inputs use `--slate-hover` background, `--primary` focus border.

---

### Screen 10: Mobile Bottom Navigation

**Purpose**: Primary navigation on mobile devices.

**Layout**:
- Fixed bottom bar, 56px height, `--slate` background, subtle top border (1px `--slate-hover`).
- 5 equally spaced icon tabs:
  1. ⚡ Pulse (Phosphor Lightning icon)
  2. 📅 Rally (Phosphor CalendarBlank icon)
  3. 📚 Library (Phosphor BookOpen icon)
  4. 🏆 Prestige (Phosphor Trophy icon)
  5. 👤 Profile (Phosphor User icon)
- Active tab: icon and label in `--primary`, inactive in `--text-secondary`.
- Notification badge (red dot) on Pulse and Profile icons when unread items exist.

---

## Responsive Behavior Summary

| Breakpoint   | Layout Changes                                                |
| ------------ | ------------------------------------------------------------- |
| ≥ 1280px     | Sidebar + Main Content + Right Rail (3-column)                |
| 1024–1279px  | Sidebar + Main Content (2-column, no right rail)              |
| 768–1023px   | No sidebar, top tabs or bottom nav, 2–3 column grids         |
| < 768px      | Full mobile: bottom nav bar, single column, bottom sheets     |

---

## Accessibility

- All interactive elements have visible focus rings (2px `--primary` outline, 2px offset).
- Minimum contrast ratio 4.5:1 for body text, 3:1 for large text (verified against `--bg` and `--slate`).
- All icons paired with aria-labels or visible text labels.
- Keyboard navigable: tab order follows visual order, escape closes modals.
- Reduced motion: respect `prefers-reduced-motion` — disable particle effects, use opacity-only transitions.
<!-- end plasma agent -->