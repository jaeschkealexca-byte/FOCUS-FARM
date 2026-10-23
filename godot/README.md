# Quiet Acres — Focus Farm (Godot 4 Port)

This folder (`godot/`) is a complete, ready-to-run **Godot 4.x** port of **Quiet Acres (Focus Farm)**.

## Quick Start

1. **(Optional) Export Remote Sprites Locally**
   From the repository root (`FOCUS-FARM/`), run:
   ```bash
   node scripts/export-assets-to-godot.mjs
   ```
   This downloads the crop growth sprites, seed packets, grass tiles, and shop background from `static-asset-manifest.json` into `godot/assets/sprites/`.
   *(Note: Every crop, seed packet, landmark, and UI window also includes full procedural `_draw()` rendering, so the game runs immediately in Godot even before downloading external textures!)*

2. **Open in Godot 4**
   - Launch **Godot 4** (4.3+ / 4.7.2).
   - Click **Import** and select `godot/project.godot`.
   - Press **F5** (Run Project) to play!

## Project Structure

- `project.godot` — 1920×1080 base viewport (`canvas_items` stretch mode), pixel-art nearest filtering, and Autoload registrations.
- `autoload/`
  - `save_manager.gd` — Reads/writes `user://quiet_acres_farm.json`, `user://quiet_acres_calendar.json`, and `user://quiet_acres_focus_desk.json` using the same JSON schema as the web version.
  - `asset_registry.gd` — Loads and caches sprites from `res://assets/sprites/` with automatic fallback to procedural drawing.
  - `real_calendar.gd` — Real-time local clock, Northern/Southern hemisphere toggle, seasonal palettes, and Dawn/Day/Dusk/Night lighting.
  - `crop_database.gd` — All 25 crop definitions, seasonal shop filtering, and seed packet / crop emblem vector drawing.
- `farm/`
  - `farm_world.gd` — 18×10 farm grid, tool actions (`Hoe`, `Seeds`, `Watering Can`, `Harvest`), player-following clamped zoom camera (`get_camera_center()`), `screen_to_grid()`, Seed Stand, and Shipping Bin.
  - `crop_plot.gd` — Soil states, 4 growth stages, water droplet badge, and mature harvest sparkles.
  - `farm_player.gd` — Grid character movement and target tile indicator.
- `focus/`
  - `focus_session.gd` — Wall-clock Pomodoro session countdown using `Time.get_unix_time_from_system()`.
- `ui/`
  - `seed_selector.gd` — Compact active seed bar above the toolbar + expandable Seed Pouch popup (`[Q]` / mouse wheel / click).
  - `inventory_window.gd` — 8-slot bottom hotbar with live seed preview in Slot `[2]` + filterable Backpack modal (`[I]`).
  - `shop_window.gd` — Seasonal Seed Shop (`[B]`) with click-to-select seed cards (`✓ SELECTED`) and the lower Seed Inspector & `PURCHASE` button panel.
  - `focus_window.gd` — 25-minute Pomodoro timer (`[F]`) + interactive task list.
- `scenes/`
  - `main.tscn` & `main.gd` — Root scene combining the clipped farm viewport (`farm_canvas.gd`), top HUD cards, Retro Gold Coin HUD with clickable `Shop [B]` button (and auto-sized centered badge when the shop is open), and modal windows.

