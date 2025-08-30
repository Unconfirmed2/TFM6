# Recreate Topbar → Players Overview & OtherPlayer (cards) changes

This document lists the concrete edits made to replace the old `TopBar` with the `players-overview` topbar container and to move / rework the played-cards display (`OtherPlayer`) into the main body. Use this as a checklist and quick reference to re-implement the same behaviour.

Keep changes small and test frequently (build + tsc).

## Goal
- Replace legacy topbar with `players-overview` rendered in a topbar container.
- When rendered as topbar, the overview must be compact: it should not open the player card view, should hide played-card groups and the played-cards button.
- Always render other players' played-cards inline in the main body (under each player's header) when not in topbar mode.
- Group played cards by type and allow per-group display modes (grid / stacked / hidden) with sensible defaults.
- Move tag badges into a second row in topbar mode and allow wrapping for narrow screens.

## Files touched (high level)
- `src/client/components/PlayerHome.vue`
- `src/client/components/overview/PlayersOverview.vue`
- `src/client/components/overview/PlayerInfo.vue`
- `src/client/components/overview/OtherPlayer.vue` (cards panel)
- `src/styles/players_overview.less` (CSS for topbar variants)
- (optional) `src/client/utils/PreferencesManager.ts` and `src/client/components/PreferencesDialog.vue` — only if you added board scaling prefs earlier.

## Step-by-step recreation notes

### 1) `PlayerHome.vue`
- Replace any `<top-bar>` usage with `<player_overview :playerView="playerView" topbar />` (or add a topbar container around the existing overview tag).
- Example placement (wrap in a non-sticky container):

```html
<div class="topbar_container">
  <player_overview :playerView="playerView" topbar />
</div>
```

- Do not make the container `position: sticky`; keep it in the normal flow. Add `background: transparent` and small padding if desired.

### 2) `PlayersOverview.vue`
- Add a `topbar` prop so the component knows when it is rendered as a topbar:

```ts
props: {
  topbar: { type: Boolean },
  playerView: { type: Object as () => PlayerViewModel }
}
```

- When rendering each `player-info` and `other-player`, propagate the flag so child components can change behaviour:

```html
<player-info :player="p" :isTopBar="topbar" />
<other-player v-if="..." :player="p" :topbar="topbar" />
```

- Ensure `players-overview` still renders normally when `topbar` is not present.

### 3) `PlayerInfo.vue` (per-player header)
- Add a boolean prop such as `isTopBar`.
- Use `getClasses()` or similar class helper to add a modifier class when `isTopBar` is true (e.g. `player-info--topbar`).
- Prevent the topbar from opening the playerDetails/card-view UI by making `togglePlayerDetails()` early-return when `isTopBar` is true.
- Hide the played-cards toggle/button in topbar mode with `v-if="!isTopBar"`.

Key behaviours:
- `isTopBar` true → compact header, played-cards button removed, clicking header should not open card view.

### 4) `OtherPlayer.vue` (the cards panel)
This is the major change: instead of being a floating overlay opened from the topbar, `OtherPlayer` is rendered inline under each `player-info` in the main page.

- Add props: `inline?: boolean` and `topbar?: boolean` (so same component handles both inline and topbar rendering modes).

- Data additions:
  - `groupOrder`: array of group keys in the desired render order (for example: `[ 'corporation', 'prelude', 'ceo', 'automated', 'active', 'event', 'self_replicating' ]`).
  - `groupDisplayModes`: map from group key to one of `grid|stacked|hidden` with defaults, e.g.:

```ts
groupDisplayModes: {
  corporation: 'grid',
  prelude: 'grid',
  ceo: 'grid',
  automated: 'stacked',
  active: 'stacked',
  event: 'hidden',
  self_replicating: 'grid'
}
```

- Implement helpers:
  - `getGroupCards(groupKey)` → returns card list for that group for the given player (filter by card.type or custom classification logic).
  - `setMode(groupKey, mode)` → change a group's display mode (UI select calls this).
  - `renderCardsForGroup(groupKey)` → switch between stacked or grid rendering as per `groupDisplayModes[groupKey]`.

- Layout changes:
  - Left column: groups that should be one-column (Corporation, Prelude, CEO) — render them vertically in a single column.
  - Right columns: remaining groups (Automated, Active, Event, Self‑replicating) — can be separate columns or compact grids.

- Topbar behaviour:
  - If `topbar` prop is true, hide the groups entirely (topbar must be compact). Alternatively, render only compact badges as required.
  - Hide the per-player played-cards button when `topbar` is true.

- UI controls:
  - For each group that has cards, render a compact `select` control to switch `grid|stacked|hidden` (or replace with small icon buttons if you prefer). Hide the controls for empty groups.
  - When a group mode is `hidden`, do not render the card list at all.

- Rendering notes:
  - Make sure `other-player` is a sibling of `player-info` in the DOM (not a child inside `player-info`) so it appears inline under the header.
  - Use `v-if` to hide empty groups and `v-show`/`v-if` for per-group rendering depending on the chosen mode.

### 5) CSS changes (`players_overview.less`)
- Add a modifier class for compact topbar headers: `.player-info--topbar`.
- Move tag badges to the second row when `.player-info--topbar` is present. Example rules:

```less
.player-info--topbar {
  .player-status-and-res { order: 1; }
  .player-tags-main, .player-tags-secondary { order: 2; }
  .player-tags-main { flex-wrap: wrap; }
}
```

- Allow the tags row to wrap on narrow screens and reduce spacing/padding to make the topbar compact.
- Remove `position: sticky` if present on topbar container; ensure `.topbar_container` is in normal document flow.



## Verification & QA checklist
- [ ] Build TypeScript: `npx tsc -p tsconfig.json --noEmit`
- [ ] Build client: `npm run build` (or the project's build script)
- [ ] Open a multi-player game and confirm:
  - `players-overview` appears where the topbar used to.
  - Clicking the topbar header does NOT open the card view.
  - When topbar is on, played-card groups and played-cards button are hidden.
  - In the main page (not topbar), each player row contains the inline cards panel under their header.
  - Group controls toggle between grid/stacked/hidden and empty groups are hidden.
  - Tag badges in topbar mode sit in the row below the status block and wrap on narrow screens.

## Edge cases & notes
- When moving `other-player` inline, ensure you render it as a sibling to `player-info` — placing it inside `player-info` without a `<slot>` causes it not to show in the expected layout.
- CSS specificity: the `.player-info--topbar` modifier must be applied on the player-info root node so global styles can override layout for topbar mode.
- Per-group display preferences were implemented as ephemeral (UI-level) state. If you want them persistent across sessions, add preference keys and update `PreferencesManager`.

## Minimal sample snippets
- Prop passthrough in `PlayersOverview.vue`:

```html
<player-info :player="p" :isTopBar="topbar" />
<other-player :player="p" :inline="true" :topbar="topbar" />
```

- `PlayerInfo.vue` header toggle guard:

```ts
methods: {
  togglePlayerDetails() {
    if (this.isTopBar) { return; }
    // ... open details
  }
}
```

- Example `groupDisplayModes` default in `OtherPlayer.vue` data:

```ts
return {
  groupOrder: ['corporation','prelude','ceo','automated','active','event','self_replicating'],
  groupDisplayModes: {
    corporation: 'grid', prelude: 'grid', ceo: 'grid', automated: 'stacked', active: 'stacked', event: 'hidden', self_replicating: 'grid'
  }
}
```
