# Change: Enlarge broccoli stage 4

Increase the rendered display size of the managed `static:broccoli_s4` asset from its current 78 px long side to 88 px (default — interpret “1 size bigger” as a +10 px long-side increase; confirm or change). Preserve aspect ratio and bottom-center anchor. Keep broccoli stages 1–3 and all other crops unchanged. Apply this as an asset display-size adjustment, not a code scale multiplier.

## Build plan

### Task 1 — Enlarge broccoli S4 asset
- **What:** Use `resize_asset` to set `static:broccoli_s4` to an 88 px long side (from 78 px), preserving its aspect ratio and bottom-center anchor. Do not change crop rendering logic.
- **Files:** MAKKO-managed sizing for `static:broccoli_s4`; no source files.
- **Verify:** Confirm the asset's configured long side is 88 px, then view a mature broccoli crop in-game: stage 4 renders larger while stages 1–3 and other crops retain their current sizes.
