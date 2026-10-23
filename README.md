# FOCUS-FARM

**Quiet Acres — Focus Farm** is a cozy farming and productivity game where your crops grow through real-time focus sessions. There are no deadlines or lost streaks—just your own gentle pace.

---

## How to Play

### The Core Loop: `TILL → PLANT → WATER → FOCUS → HARVEST`

1. **Till the Soil (`1` + `E`):** Select the **Hoe** (`1`), face an empty farm tile, and press `E` to till the soil.
2. **Plant Seeds (`2` + `E`):** Select **Seeds** (`2`) and press `E` on tilled soil to plant. Press `Q` (or press `2` again while Seeds is active) to cycle through the seed varieties in your pouch.
3. **Water Your Crops (`3` + `E`):** Select the **Watering Can** (`3`) and press `E` on a planted tile. Only watered crops will grow during a focus session.
4. **Complete a Focus Block (`F`):** Press `F` (or click **Focus & Tasks** in the top-right) to open your focus desk. Start the 25-minute focus timer (`Enter` or click Play) and work on your tasks. When the session completes, all watered crops advance in growth!
   - *Tip:* Watered plots dry out after a completed focus session—rewater them if a crop needs additional focus time to mature.
5. **Harvest Mature Crops (`4` + `E`):** Mature crops sparkle on the field. Select **Harvest** (`4`) and press `E` to gather the produce into your backpack.
6. **Ship Produce & Buy More Seeds (`V` & `B`):**
   - Walk next to the wooden **Shipping Bin** (`SHIP` in the upper-left area of the farm) and press `V` to sell all harvested produce for coins.
   - Press `B` (or click **Seed Shop**) to browse and buy seeds across Spring, Summer, Autumn, and Winter.

### Controls & Shortcuts

| Key / Input | Action |
| :--- | :--- |
| `W` `A` `S` `D` / `Arrow Keys` | Move around the farm and face a target tile |
| `E` | Use the currently selected tool on the tile in front of you |
| `1` | Select **Hoe** (till empty soil) |
| `2` | Select **Seeds** (press `2` again while active to cycle seed types) |
| `3` | Select **Watering Can** (water planted crops) |
| `4` | Select **Harvest** (collect mature crops) |
| `5` – `8` | Use custom quick-access toolbar slots (assigned in Backpack) |
| `Q` | Cycle through owned seed varieties |
| `V` | Sell harvested produce (must stand beside the Shipping Bin) |
| `I` | Open/close **My Backpack** (manage inventory, toolbar slots, or delete stacks) |
| `F` | Open **Focus & Tasks** workspace (`Enter` to start/resume timer) |
| `B` | Open **Seed Shop** (`1`–`4` for seasons, `A`/`D` or `←`/`→` for pages) |
| `Escape` | Close an open window, or return to the title screen from the farm |
| `Mouse` | Hover over planted crops to inspect them; click UI buttons, shop cards, and toolbar slots |

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer) and `npm`

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Then open the local URL printed in the terminal (by default `http://localhost:5173/`) in your browser.

## Building for Production

1. **Typecheck and build the production bundle:**
   ```bash
   npm run build
   ```
   This compiles TypeScript and outputs the bundled static site into the `dist/` directory.

2. **Preview the production build locally:**
   ```bash
   npm run preview
   ```
