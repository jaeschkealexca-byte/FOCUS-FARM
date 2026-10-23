# FOCUS-FARM (Godot 4)

**Quiet Acres — Focus Farm** is a cozy farming and productivity game built with **Godot 4** where your crops grow through real-time focus sessions. There are no deadlines or lost streaks—just your own gentle pace.

---

## How to Play

### The Core Loop: `TILL → PLANT → WATER → FOCUS → HARVEST`

1. **Till the Soil (`1` + `E`):** Select the **Hoe** (`1`), face an empty farm tile, and press `E` to till the soil.
2. **Plant Seeds (`2` + `E`):** Select **Seeds** (`2`) and press `E` on tilled soil to plant. Press `Q` (or press `2` again while Seeds is active) to cycle through the seed varieties in your pouch.
3. **Water Your Crops (`3` + `E`):** Select the **Watering Can** (`3`) and press `E` on a planted tile. Only watered crops will grow during a focus session.
4. **Complete a Focus Block (`F`):** Press `F` (or click **Focus & Tasks** in the top-right) to open your focus desk. Start the 25-minute focus timer (`Space` or click Start) and work on your tasks. When the session completes, all watered crops advance in growth!
   - *Tip:* Watered plots dry out after a completed focus session—rewater them if a crop needs additional focus time to mature.
5. **Harvest Mature Crops (`4` + `E`):** Mature crops sparkle on the field. Select **Harvest** (`4`) and press `E` (or click the plot) to gather the produce into your backpack.
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
| `Q` / `Shift+Q` / `Mouse Wheel` | Cycle through owned seed varieties |
| `V` | Sell harvested produce (must stand beside the Shipping Bin) |
| `I` | Open/close **My Backpack** (manage inventory, toolbar slots, or discard items) |
| `F` | Open **Focus & Tasks** workspace (`Space` to start/pause timer) |
| `B` | Open **Seed Shop** (`1`–`4` for seasons, click a seed card then click `PURCHASE`) |
| `Escape` | Close an open window, or return to the title screen from the farm |
| `Mouse` | Hover over planted crops to inspect them; click UI buttons, shop cards, and toolbar slots |

---

## Running the Project in Godot 4

1. Open **Godot 4** (4.3+ / 4.7+).
2. Click **Import** in the Project Manager and select [`godot/project.godot`](godot/project.godot).
3. Press **F5** (or click the **Run Project** button in the top-right of the editor) to launch **Quiet Acres — Focus Farm**.
