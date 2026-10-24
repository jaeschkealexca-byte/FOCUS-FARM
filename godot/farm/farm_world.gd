class_name FarmWorldData
extends RefCounted
## Complete port of `src/farm/farm-world.ts`, including the 18×10 grid,
## player-following clamped camera zoom, crop hover tooltips, tool actions,
## seed shop purchases, shipping bin sales, and focus session growth.

const WIDTH := 18
const HEIGHT := 10
const ORIGIN_X := 384.0
const ORIGIN_Y := 252.0

var zoom: float = 1.0
var player := FarmPlayerData.new()
var plots: Array[CropPlotData] = []

var seeds: Dictionary = {"carrot": 3, "cabbage": 2, "strawberry": 1}
var produce: Dictionary = {}
var selected_seed_id: String = "carrot"
var toolbar_slots: Array = [null, null, null, null]

var coins: int = 50
var sessions: int = 0
var minutes: int = 0
var message: String = "A small beginning. Press E to till the tile in front of you."

func _init() -> void:
	plots.clear()
	for i in range(WIDTH * HEIGHT):
		plots.append(CropPlotData.new())

func zoom_in() -> void:
	zoom = minf(3.0, roundf((zoom + 0.1) * 10.0) / 10.0)

func zoom_out() -> void:
	zoom = maxf(0.75, roundf((zoom - 0.1) * 10.0) / 10.0)

func total_seeds() -> int:
	var sum := 0
	for count in seeds.values():
		sum += int(count)
	return sum

func total_produce() -> int:
	var sum := 0
	for count in produce.values():
		sum += int(count)
	return sum

func total_produce_value() -> int:
	var total := 0
	for id in produce.keys():
		var count := int(produce[id])
		if count > 0:
			var def := CropDatabase.get_crop_def(id)
			total += int(def["sellPrice"]) * count
	return total

func can_enter(x: int, y: int) -> bool:
	return x >= 0 and y >= 0 and x < WIDTH and y < HEIGHT and not (y == 1 and (x == 1 or x == 2))

func plot_at(x: int, y: int) -> CropPlotData:
	if not can_enter(x, y):
		return null
	return plots[y * WIDTH + x]

func target_plot() -> CropPlotData:
	var t := player.target()
	return plot_at(t.x, t.y)

func cycle_selected_seed(dir: int = 1) -> void:
	var owned_ids: Array[String] = []
	for id in seeds.keys():
		if int(seeds[id]) > 0:
			owned_ids.append(str(id))
	if owned_ids.is_empty():
		message = "Your seed pouch is empty! Open the Seed Shop [B] to buy seeds."
		return
	var current_idx := owned_ids.find(selected_seed_id)
	var next_idx := 0 if current_idx < 0 else posmod(current_idx + dir, owned_ids.size())
	selected_seed_id = owned_ids[next_idx]
	var crop := CropDatabase.get_crop_def(selected_seed_id)
	var count := int(seeds.get(selected_seed_id, 0))
	message = "Selected: %s Seeds (%d in pouch). Press E to plant." % [crop["name"], count]

func use_tool(tool: int, custom_plot: CropPlotData = null) -> bool:
	var p := custom_plot if custom_plot != null else target_plot()
	if p == null:
		message = "That tile is beyond the farm or reserved for the market."
		return false

	if tool == 0 and not p.tilled:
		p.tilled = true
		message = "Fresh soil. Select Seeds [2], then press E to plant."
		return true

	if tool == 1:
		if not p.tilled:
			message = "Seeds need empty, tilled soil. Use Hoe [1] first."
			return false
		if p.planted:
			message = "A crop is already growing here."
			return false

		var seed_id := selected_seed_id
		if int(seeds.get(seed_id, 0)) <= 0:
			var other := ""
			for id in seeds.keys():
				if int(seeds[id]) > 0:
					other = str(id)
					break
			if not other.is_empty():
				seed_id = other
				selected_seed_id = other
			else:
				message = "No seeds left in your pouch! Open SEED SHOP [B] to buy more."
				return false

		var crop := CropDatabase.get_crop_def(seed_id)
		p.planted = true
		p.crop_id = seed_id
		p.growth = 0.0
		p.preview_growth = null
		p.watered = false
		seeds[seed_id] = maxi(0, int(seeds.get(seed_id, 0)) - 1)
		message = "Planted %s seeds! Water with [3] then E. (%s focus needed)" % [
			crop["name"], CropDatabase.format_growth_time(float(crop["growthMinutes"]))
		]

		if int(seeds.get(seed_id, 0)) <= 0:
			seeds.erase(seed_id)
			for i in range(toolbar_slots.size()):
				if toolbar_slots[i] == "seed:%s" % seed_id:
					toolbar_slots[i] = null
			for id in seeds.keys():
				if int(seeds[id]) > 0:
					selected_seed_id = str(id)
					break
		return true

	if tool == 2:
		if not p.planted or p.mature() or p.watered:
			return false
		p.watered = true
		message = "Watered %s! Press F to begin a real-time focus block." % p.crop_def()["name"]
		return true

	if tool == 3:
		if not p.planted:
			message = "Nothing planted here to harvest."
			return false
		var def := p.crop_def()
		if not p.mature():
			message = "Growing %s: %s / %s focused time completed." % [
				def["name"],
				CropDatabase.format_growth_time(p.growth),
				CropDatabase.format_growth_time(float(def["growthMinutes"]))
			]
			return false
		var cid := str(def["id"])
		produce[cid] = int(produce.get(cid, 0)) + 1
		p.planted = false
		p.crop_id = null
		p.watered = false
		p.growth = 0.0
		p.preview_growth = null
		message = "Harvested a fresh %s! Sell beside the shipping bin with [V] (+%d coins)." % [def["name"], int(def["sellPrice"])]
		return true

	return false

func buy_seed(crop_id: String, quantity: int = 1) -> bool:
	if quantity < 1 or quantity > 20 or not CropDatabase.crops.has(crop_id):
		return false
	var crop := CropDatabase.get_crop_def(crop_id)
	var cost := int(crop["buyPrice"]) * quantity
	if coins < cost:
		message = "Need %d coins for %d× %s. Sell harvested crops with [V]!" % [cost, quantity, crop["seedName"]]
		return false
	coins -= cost
	seeds[crop_id] = int(seeds.get(crop_id, 0)) + quantity
	selected_seed_id = crop_id
	message = "Bought %d× %s! Selected and ready to plant." % [quantity, crop["seedName"]]
	return true

func sell_produce() -> bool:
	if absi(player.grid_x - 2) + absi(player.grid_y - 1) != 1:
		message = "Stand beside the wooden shipping bin to sell your harvest."
		return false
	if total_produce() <= 0:
		message = "Your harvest bag is empty. Harvest mature crops with [4] first."
		return false

	var gained := 0
	var sold_parts: Array[String] = []
	for id in produce.keys():
		var count := int(produce[id])
		if count > 0:
			var crop := CropDatabase.get_crop_def(id)
			var val := int(crop["sellPrice"]) * count
			gained += val
			sold_parts.append("%d× %s" % [count, crop["name"]])
	produce.clear()
	coins += gained
	for i in range(toolbar_slots.size()):
		if toolbar_slots[i] != null and str(toolbar_slots[i]).begins_with("produce:"):
			toolbar_slots[i] = null
	message = "Shipped %s for %d coins!" % [", ".join(sold_parts), gained]
	return true

func watered_growing_indices() -> Array[int]:
	var indices: Array[int] = []
	for i in range(plots.size()):
		var p := plots[i]
		if p.planted and p.watered and not p.mature():
			indices.append(i)
	return indices

func preview_focus_growth(elapsed_minutes: float, snapshot: Array[int]) -> void:
	for i in snapshot:
		if i >= 0 and i < plots.size():
			var p := plots[i]
			if p.planted and p.watered and not p.mature():
				var max_g := float(p.crop_def()["growthMinutes"])
				p.preview_growth = minf(max_g, p.growth + maxf(0.0, elapsed_minutes))

func clear_growth_preview() -> void:
	for p in plots:
		p.preview_growth = null

func commit_focus_progress(elapsed_minutes: float, snapshot: Array[int], unwater_on_pause: bool = false) -> int:
	var safe_minutes := maxf(0.0, elapsed_minutes)
	var advanced := 0
	for i in snapshot:
		if i >= 0 and i < plots.size():
			var p := plots[i]
			if p.planted and p.watered and not p.mature():
				var max_g := float(p.crop_def()["growthMinutes"])
				if safe_minutes > 0.0:
					p.growth = minf(max_g, p.growth + safe_minutes)
					advanced += 1
				p.preview_growth = null
				if unwater_on_pause or p.mature():
					p.watered = false
	clear_growth_preview()
	return advanced

func complete_focus(focus_minutes: int, snapshot: Array[int]) -> void:
	clear_growth_preview()
	var grown := 0
	for i in snapshot:
		if i >= 0 and i < plots.size():
			var p := plots[i]
			if p.planted and p.watered and not p.mature():
				var max_g := float(p.crop_def()["growthMinutes"])
				p.growth = minf(max_g, p.growth + float(focus_minutes))
				p.preview_growth = null
				p.watered = false
				grown += 1
	sessions += 1
	minutes += focus_minutes
	message = "Lovely work! %d focused minutes completed; %d crops grew. Rewater for the next block." % [focus_minutes, grown]

func get_camera_center() -> Vector2:
	var center_x := ORIGIN_X + float(WIDTH) * 32.0
	var center_y := ORIGIN_Y + float(HEIGHT) * 32.0
	if zoom <= 1.0:
		return Vector2(center_x, center_y)

	var player_x := ORIGIN_X + float(player.grid_x) * 64.0 + 32.0
	var player_y := ORIGIN_Y + float(player.grid_y) * 64.0 + 32.0
	var half_w := (float(WIDTH) * 32.0) / zoom
	var half_h := (float(HEIGHT) * 32.0) / zoom
	var min_x := ORIGIN_X + half_w
	var max_x := ORIGIN_X + float(WIDTH) * 64.0 - half_w
	var min_y := ORIGIN_Y + half_h
	var max_y := ORIGIN_Y + float(HEIGHT) * 64.0 - half_h
	return Vector2(
		clampf(player_x, min_x, max_x),
		clampf(player_y, min_y, max_y)
	)

func screen_to_grid(screen_x: float, screen_y: float) -> Vector2i:
	if (
		screen_x < ORIGIN_X
		or screen_x >= ORIGIN_X + float(WIDTH) * 64.0
		or screen_y < ORIGIN_Y
		or screen_y >= ORIGIN_Y + float(HEIGHT) * 64.0
	):
		return Vector2i(-1, -1)
	var center_x := ORIGIN_X + float(WIDTH) * 32.0
	var center_y := ORIGIN_Y + float(HEIGHT) * 32.0
	var cam := get_camera_center()
	var world_x := cam.x + (screen_x - center_x) / zoom
	var world_y := cam.y + (screen_y - center_y) / zoom
	return Vector2i(
		int(floor((world_x - ORIGIN_X) / 64.0)),
		int(floor((world_y - ORIGIN_Y) / 64.0))
	)

# --- Grass decoration -------------------------------------------------------
# Tufts from grass_1..grass_3 are scattered over untilled tiles. Tilled tiles
# get no tufts of their own, but grass on neighbouring tiles leans slightly
# over the soil edge. Drawn in its own pass after all tile bases so tufts can
# overlap a neighbouring tile without being painted over.

const GRASS_KEYS := ["grass_1", "grass_2", "grass_3"]
# Base height per variant at zoom 1, matched to crop sprites (up to ~58 px tall,
# 56 px wide): grass_1 is a wide clump (~56 px), grass_3 a tall bush.
const GRASS_HEIGHTS := [26.0, 36.0, 46.0]
# How far an edge tuft may reach over neighbouring soil, in px.
const GRASS_SOIL_OVERLAP := 11.0

func _hash3(a: int, b: int, c: int) -> int:
	var h: int = (a * 73856093) ^ (b * 19349663) ^ (c * 83492791)
	h = (h ^ (h >> 13)) * 1274126177
	return absi(h ^ (h >> 16))

func _rand01(gx: int, gy: int, salt: int) -> float:
	return float(_hash3(gx, gy, salt) % 10000) / 10000.0

func _is_grass(gx: int, gy: int) -> bool:
	if gx < 0 or gy < 0 or gx >= WIDTH or gy >= HEIGHT:
		return false
	return not plots[gy * WIDTH + gx].tilled

func _is_open_grass(gx: int, gy: int) -> bool:
	return _is_grass(gx, gy) and can_enter(gx, gy)

func _is_soil(gx: int, gy: int) -> bool:
	if gx < 0 or gy < 0 or gx >= WIDTH or gy >= HEIGHT:
		return false
	return plots[gy * WIDTH + gx].tilled

func _make_tuft(gx: int, gy: int, salt: int, cx: float, base_y: float, size_mul: float) -> Dictionary:
	var v: int = _hash3(gx, gy, salt + 999) % GRASS_KEYS.size()
	var key: String = GRASS_KEYS[v]
	var sz: Vector2 = AssetRegistry.get_size(key)
	var h: float = float(GRASS_HEIGHTS[v]) * size_mul * (0.7 + _rand01(gx, gy, salt + 77) * 0.5)
	var w: float = h * sz.x / maxf(1.0, sz.y)
	return {"key": key, "cx": cx, "base_y": base_y, "w": w, "h": h}

func render_grass_decor(d: DrawSurface, ox: float, oy: float) -> void:
	var tufts: Array = []
	for gy in range(HEIGHT):
		for gx in range(WIDTH):
			if not _is_grass(gx, gy) or not can_enter(gx, gy):
				continue  # soil, or the market tiles under the landmarks
			var x := ox + float(gx) * 64.0
			var y := oy + float(gy) * 64.0

			# Allowed area for this tile's own tufts: they may spill into
			# neighbouring grass, but never onto soil, market tiles or off the farm.
			var left_lim := x - 10.0 if _is_open_grass(gx - 1, gy) else x + 1.0
			var right_lim := x + 74.0 if _is_open_grass(gx + 1, gy) else x + 63.0
			var top_lim := y - 14.0 if _is_open_grass(gx, gy - 1) else y + 1.0
			var bottom_lim := y + 70.0 if _is_open_grass(gx, gy + 1) else y + 63.0

			# 6-9 crop-sized tufts per tile for a wild, overgrown look.
			var count: int = 6 + (_hash3(gx, gy, 1) % 4)
			for i in range(count):
				var t := _make_tuft(gx, gy, 10 + i, 0.0, 0.0, 1.0)
				var w: float = float(t["w"])
				var h: float = float(t["h"])
				var span_x: float = (right_lim - left_lim) - w
				var span_y: float = (bottom_lim - top_lim) - h
				if span_x < 0.0 or span_y < 0.0:
					# Too big for the free space: shrink to fit.
					var s: float = minf((right_lim - left_lim) / w, (bottom_lim - top_lim) / h)
					w *= s
					h *= s
					t["w"] = w
					t["h"] = h
					span_x = maxf(0.0, (right_lim - left_lim) - w)
					span_y = maxf(0.0, (bottom_lim - top_lim) - h)
				t["cx"] = left_lim + w * 0.5 + _rand01(gx, gy, 20 + i) * span_x
				t["base_y"] = top_lim + h + _rand01(gx, gy, 30 + i) * span_y
				tufts.append(t)

			# Edge tufts that reach slightly over neighbouring soil.
			var ov := GRASS_SOIL_OVERLAP
			if _is_soil(gx, gy - 1):  # soil above: tips poke up over its bottom edge
				for i in range(4):
					var t := _make_tuft(gx, gy, 40 + i, 0.0, 0.0, 1.0)
					t["cx"] = x + 8.0 + float(i) * 16.0 + (_rand01(gx, gy, 45 + i) - 0.5) * 10.0
					t["base_y"] = y + float(t["h"]) - ov
					tufts.append(t)
			if _is_soil(gx, gy + 1):  # soil below: bases sit a little on the soil
				for i in range(4):
					var t := _make_tuft(gx, gy, 50 + i, 0.0, 0.0, 1.0)
					t["cx"] = x + 8.0 + float(i) * 16.0 + (_rand01(gx, gy, 55 + i) - 0.5) * 10.0
					t["base_y"] = y + 64.0 + ov * 0.5
					tufts.append(t)
			if _is_soil(gx - 1, gy):  # soil left
				for i in range(4):
					var t := _make_tuft(gx, gy, 60 + i, 0.0, 0.0, 1.0)
					t["cx"] = x + float(t["w"]) * 0.5 - ov
					t["base_y"] = y + 18.0 + float(i) * 15.0 + (_rand01(gx, gy, 65 + i) - 0.5) * 8.0
					tufts.append(t)
			if _is_soil(gx + 1, gy):  # soil right
				for i in range(4):
					var t := _make_tuft(gx, gy, 70 + i, 0.0, 0.0, 1.0)
					t["cx"] = x + 64.0 - float(t["w"]) * 0.5 + ov
					t["base_y"] = y + 18.0 + float(i) * 15.0 + (_rand01(gx, gy, 75 + i) - 0.5) * 8.0
					tufts.append(t)

	# Draw back to front so lower tufts overlap higher ones.
	tufts.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return float(a["base_y"]) < float(b["base_y"]))
	for t in tufts:
		var tex: Texture2D = AssetRegistry.get_tex(str(t["key"]))
		if tex == null:
			continue
		var w: float = float(t["w"])
		var h: float = float(t["h"])
		d.draw_texture_at(tex, float(t["cx"]) - w * 0.5, float(t["base_y"]) - h, w, h)

func render_farm_content(canvas: CanvasItem) -> void:
	var center_x := ORIGIN_X + float(WIDTH) * 32.0
	var center_y := ORIGIN_Y + float(HEIGHT) * 32.0
	var cam := get_camera_center()
	# Project world coordinates around `cam` onto viewport `center_x, center_y`
	var d := DrawSurface.new(
		canvas,
		center_x - cam.x * zoom,
		center_y - cam.y * zoom,
		zoom
	)
	var ox := ORIGIN_X
	var oy := ORIGIN_Y
	var palette := RealCalendar.palette()
	var season := RealCalendar.season

	d.draw_round_rect(ox - 18.0, oy - 18.0, 1188.0, 676.0, 16.0, {"fill": palette["edge"]})
	d.draw_rect_styled(ox - 7.0, oy - 7.0, 1166.0, 654.0, {"fill": "#f2f6fa" if season == "Winter" else "#b6ad7e"})

	for y in range(HEIGHT):
		for x in range(WIDTH):
			plots[y * WIDTH + x].render_base(d, ox + float(x) * 64.0, oy + float(y) * 64.0, x, y)

	render_grass_decor(d, ox, oy)

	# Seed Stand landmark at (1, 1)
	var sx := ox + 64.0
	var sy := oy + 64.0
	d.draw_rect_styled(sx + 7.0, sy + 28.0, 50.0, 32.0, {"fill": "#b38358"})
	d.draw_rect_styled(sx + 11.0, sy + 34.0, 42.0, 17.0, {"fill": "#e0c193"})
	d.draw_rect_styled(sx + 3.0, sy + 8.0, 58.0, 23.0, {"fill": "#eee0ac"})
	for i in range(3):
		d.draw_rect_styled(sx + 3.0 + float(i) * 20.0, sy + 8.0, 10.0, 23.0, {"fill": "#8caa80"})
	d.draw_text_styled("SEEDS", sx + 32.0, sy + 43.0, {"size": 10, "align": "center", "fill": "#584936"})

	# Shipping Bin landmark at (2, 1)
	var bx := ox + 128.0
	d.draw_rect_styled(bx + 8.0, sy + 20.0, 48.0, 40.0, {"fill": "#88694c"})
	d.draw_rect_styled(bx + 4.0, sy + 16.0, 56.0, 12.0, {"fill": "#c39f70"})
	d.draw_rect_styled(bx + 16.0, sy + 18.0, 32.0, 4.0, {"fill": "#4a4439"})
	d.draw_text_styled("SHIP", bx + 32.0, sy + 41.0, {"size": 10, "align": "center", "fill": "#eddfb7"})

	var t := player.target()
	if can_enter(t.x, t.y):
		d.draw_round_rect(ox + float(t.x) * 64.0 + 2.0, oy + float(t.y) * 64.0 + 2.0, 60.0, 60.0, 6.0, {
			"stroke": "#ffe6ab", "lineWidth": 3.0
		})

	if season == "Winter":
		d.draw_rect_styled(sx + 3.0, sy + 7.0, 58.0, 5.0, {"fill": "#f2f7fc"})
		d.draw_rect_styled(bx + 4.0, sy + 15.0, 56.0, 5.0, {"fill": "#f2f7fc"})

	player.render(d, ox, oy)

	for y in range(HEIGHT):
		for x in range(WIDTH):
			var p := plots[y * WIDTH + x]
			if p.planted:
				p.render_crop_overlay(d, ox + float(x) * 64.0, oy + float(y) * 64.0)

	if RealCalendar.night_alpha > 0.0:
		d.draw_rect_styled(ox, oy, 1152.0, 640.0, {"fill": "#28324f", "alpha": RealCalendar.night_alpha})

func render_crop_hover(d: DrawSurface, mouse_x: float, mouse_y: float) -> void:
	var grid := screen_to_grid(mouse_x, mouse_y)
	var p := plot_at(grid.x, grid.y)
	if p == null or not p.planted:
		return

	var crop := p.crop_def()
	var title := "%s %s" % [crop["seasonIcon"], crop["name"]]
	var growth_line := "✦ Mature — Ready to harvest [4]" if p.mature() else "⏱ %s / %s (%d%%)" % [
		CropDatabase.format_growth_time(p.growth),
		CropDatabase.format_growth_time(float(crop["growthMinutes"])),
		p.growth_percent()
	]
	var sub_line := "🪙 Ships for %d coins" % int(crop["sellPrice"]) if p.mature() else (
		"💧 Watered · Grows next Focus [F]" if p.watered else "Needs water · Use Watering Can [3]"
	)

	var padding_x := 14.0
	var content_w := maxf(
		maxf(DrawSurface.measure_text(title, 14), DrawSurface.measure_text(growth_line, 12)),
		maxf(DrawSurface.measure_text(sub_line, 12), 190.0)
	)
	var tooltip_w := content_w + padding_x * 2.0
	var tooltip_h := 82.0
	var tooltip_x := minf(mouse_x + 16.0, 1920.0 - tooltip_w - 12.0)
	var tooltip_y := minf(mouse_y + 16.0, 1080.0 - tooltip_h - 12.0)

	d.draw_round_rect(tooltip_x + 3.0, tooltip_y + 4.0, tooltip_w, tooltip_h, 10.0, {"fill": "#17130f", "alpha": 0.35})
	d.draw_round_rect(tooltip_x, tooltip_y, tooltip_w, tooltip_h, 10.0, {
		"fill": "#fff7e5",
		"stroke": "#c28b2c" if p.mature() else "#779464",
		"lineWidth": 2.0
	})
	d.draw_text_styled(title, tooltip_x + padding_x, tooltip_y + 18.0, {"size": 14, "fill": "#3c5233", "align": "left", "baseline": "middle"})
	d.draw_text_styled(growth_line, tooltip_x + padding_x, tooltip_y + 38.0, {
		"size": 12, "fill": "#8c5d19" if p.mature() else "#526348", "align": "left", "baseline": "middle"
	})

	var bar_w := tooltip_w - padding_x * 2.0
	var bar_y := tooltip_y + 50.0
	d.draw_round_rect(tooltip_x + padding_x, bar_y, bar_w, 6.0, 3.0, {"fill": "#e3d5bc"})
	var fill_ratio := 1.0 if p.mature() else maxf(0.06, float(p.growth_percent()) / 100.0)
	d.draw_round_rect(tooltip_x + padding_x, bar_y, bar_w * fill_ratio, 6.0, 3.0, {
		"fill": "#d99b26" if p.mature() else ("#5698a8" if p.watered else "#7a9e64")
	})
	d.draw_text_styled(sub_line, tooltip_x + padding_x, tooltip_y + 68.0, {
		"size": 12, "fill": "#6e5634" if p.mature() else ("#386f80" if p.watered else "#9c5b3b"),
		"align": "left", "baseline": "middle"
	})

func to_save() -> Dictionary:
	var saved_plots: Array[Dictionary] = []
	for i in range(plots.size()):
		var p := plots[i]
		saved_plots.append({
			"x": i % WIDTH,
			"y": int(i / WIDTH),
			"tilled": p.tilled,
			"crop": p.crop_id if p.planted else null,
			"watered": p.watered,
			"growth": p.growth,
		})
	return {
		"version": 2,
		"width": WIDTH,
		"height": HEIGHT,
		"player": {
			"x": player.grid_x,
			"y": player.grid_y,
			"direction": player.direction,
		},
		"plots": saved_plots,
		"seeds": seeds.duplicate(),
		"produce": produce.duplicate(),
		"selectedSeed": selected_seed_id,
		"coins": coins,
		"sessions": sessions,
		"minutes": minutes,
		"toolbarSlots": toolbar_slots.duplicate(),
		"cropPlotsClearedForGrowthTest": true,
	}

func restore(s: Dictionary) -> void:
	if s.has("player") and s["player"] is Dictionary:
		var pl: Dictionary = s["player"] as Dictionary
		player.grid_x = int(pl.get("x", 2))
		player.grid_y = int(pl.get("y", 5))
		player.direction = str(pl.get("direction", "right"))

	if s.has("seeds") and s["seeds"] is Dictionary:
		seeds = (s["seeds"] as Dictionary).duplicate()
	if s.has("produce") and s["produce"] is Dictionary:
		produce = (s["produce"] as Dictionary).duplicate()
	if s.has("selectedSeed") and str(s["selectedSeed"]) != "":
		selected_seed_id = str(s["selectedSeed"])

	coins = int(s.get("coins", 50))
	sessions = int(s.get("sessions", 0))
	minutes = int(s.get("minutes", 0))

	if s.has("plots") and s["plots"] is Array:
		var saved_plots: Array = s["plots"] as Array
		for sp in saved_plots:
			if sp is Dictionary:
				var sp_dict: Dictionary = sp as Dictionary
				var idx: int = int(sp_dict.get("y", 0)) * WIDTH + int(sp_dict.get("x", 0))
				if idx >= 0 and idx < plots.size():
					var target: CropPlotData = plots[idx]
					target.tilled = bool(sp_dict.get("tilled", false))
					target.planted = sp_dict.get("crop") != null
					target.crop_id = sp_dict.get("crop")
					target.watered = bool(sp_dict.get("watered", false)) and target.planted
					target.growth = float(sp_dict.get("growth", 0.0)) if target.planted else 0.0
					target.preview_growth = null
