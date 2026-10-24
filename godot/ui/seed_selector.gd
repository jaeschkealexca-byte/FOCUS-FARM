class_name SeedSelectorUI
extends RefCounted
## Port of `src/ui/seed-selector.ts` — Interactive Seed Pouch Selector above the bottom hotbar.

var world: FarmWorldData
var get_tool: Callable
var set_tool: Callable
var on_save: Callable
var on_open_shop: Callable

var pouch_open: bool = false
var page: int = 0
const ITEMS_PER_PAGE := 6

const BAR_W := 440.0
const BAR_H := 52.0
const BAR_X := (1920.0 - BAR_W) * 0.5
const BAR_Y := 920.0

const POUCH_W := 600.0
const POUCH_H := 290.0
const POUCH_X := (1920.0 - POUCH_W) * 0.5
const POUCH_Y := 636.0

func _init(
	p_world: FarmWorldData,
	p_get_tool: Callable,
	p_set_tool: Callable,
	p_save: Callable,
	p_open_shop: Callable
) -> void:
	world = p_world
	get_tool = p_get_tool
	set_tool = p_set_tool
	on_save = p_save
	on_open_shop = p_open_shop

func set_world(p_world: FarmWorldData) -> void:
	world = p_world
	ensure_selected_visible()

func on_tool_changed(tool: int) -> void:
	if tool == 1:
		ensure_selected_visible()
	else:
		pouch_open = false

func open_pouch() -> void:
	pouch_open = true
	ensure_selected_visible()

func close_pouch() -> void:
	pouch_open = false

func owned_seed_crops() -> Array[Dictionary]:
	var list: Array[Dictionary] = []
	for crop in CropDatabase.crop_list:
		var cid := str(crop["id"])
		if int(world.seeds.get(cid, 0)) > 0:
			list.append(crop)
	for id in world.seeds.keys():
		if int(world.seeds[id]) > 0:
			var exists := false
			for c in list:
				if str(c["id"]) == str(id):
					exists = true
					break
			if not exists:
				list.append(CropDatabase.get_crop_def(id))
	return list

func ensure_selected_visible() -> void:
	var owned := owned_seed_crops()
	var idx := -1
	for i in range(owned.size()):
		if str(owned[i]["id"]) == world.selected_seed_id:
			idx = i
			break
	if idx >= 0:
		page = int(idx / ITEMS_PER_PAGE)
	else:
		page = 0

func handle_click(mx: float, my: float) -> bool:
	if _in_rect(mx, my, BAR_X, BAR_Y, BAR_W, BAR_H):
		if _in_rect(mx, my, BAR_X + 10.0, BAR_Y + 10.0, 32.0, 32.0):
			world.cycle_selected_seed(-1)
			set_tool.call(1)
			ensure_selected_visible()
			on_save.call()
			return true
		if _in_rect(mx, my, BAR_X + BAR_W - 42.0, BAR_Y + 10.0, 32.0, 32.0):
			world.cycle_selected_seed(1)
			set_tool.call(1)
			ensure_selected_visible()
			on_save.call()
			return true
		if _in_rect(mx, my, BAR_X + BAR_W - 142.0, BAR_Y + 10.0, 92.0, 32.0):
			pouch_open = not pouch_open
			if pouch_open:
				ensure_selected_visible()
			return true
		set_tool.call(1)
		pouch_open = not pouch_open
		if pouch_open:
			ensure_selected_visible()
		return true

	if pouch_open:
		if _in_rect(mx, my, POUCH_X, POUCH_Y, POUCH_W, POUCH_H):
			if _in_rect(mx, my, POUCH_X + POUCH_W - 44.0, POUCH_Y + 14.0, 30.0, 28.0):
				pouch_open = false
				return true
			if _in_rect(mx, my, POUCH_X + POUCH_W - 152.0, POUCH_Y + 14.0, 100.0, 28.0):
				pouch_open = false
				on_open_shop.call()
				return true

			var owned := owned_seed_crops()
			var page_count := maxi(1, int(ceil(float(owned.size()) / float(ITEMS_PER_PAGE))))
			page = mini(page, page_count - 1)
			var start := page * ITEMS_PER_PAGE
			var shown := owned.slice(start, start + ITEMS_PER_PAGE)

			var grid_x := POUCH_X + 20.0
			var grid_y := POUCH_Y + 56.0
			var card_w := 180.0
			var card_h := 92.0
			var gap_x := 10.0
			var gap_y := 10.0

			for i in range(shown.size()):
				var col := i % 3
				var row := int(i / 3)
				var cx := grid_x + float(col) * (card_w + gap_x)
				var cy := grid_y + float(row) * (card_h + gap_y)
				if _in_rect(mx, my, cx, cy, card_w, card_h):
					var chosen: Dictionary = shown[i]
					var cid := str(chosen["id"])
					world.selected_seed_id = cid
					var count := int(world.seeds.get(cid, 0))
					world.message = "Selected: %s Seeds (%d in pouch). Press E on tilled soil to plant." % [chosen["name"], count]
					set_tool.call(1)
					on_save.call()
					return true

			if page_count > 1:
				var nav_y := POUCH_Y + POUCH_H - 36.0
				if page > 0 and _in_rect(mx, my, POUCH_X + 220.0, nav_y, 38.0, 26.0):
					page -= 1
					return true
				if page < page_count - 1 and _in_rect(mx, my, POUCH_X + 342.0, nav_y, 38.0, 26.0):
					page += 1
					return true
			return true

		pouch_open = false
	return false

func render(d: DrawSurface, mx: float, my: float) -> void:
	_render_active_bar(d, mx, my)
	if pouch_open:
		_render_pouch_popup(d, mx, my)

func _render_active_bar(d: DrawSurface, mx: float, my: float) -> void:
	var is_seed_tool := int(get_tool.call()) == 1
	var crop := CropDatabase.get_crop_def(world.selected_seed_id)
	var count := int(world.seeds.get(str(crop["id"]), 0))
	var varieties := owned_seed_crops().size()

	d.draw_round_rect(BAR_X + 2.0, BAR_Y + 3.0, BAR_W, BAR_H, 14.0, {"fill": "#17130f", "alpha": 0.28})
	d.draw_round_rect(BAR_X, BAR_Y, BAR_W, BAR_H, 14.0, {
		"fill": "#463829" if is_seed_tool else "#3a2f23",
		"alpha": 0.95,
		"stroke": "#e5b96f" if is_seed_tool else "#b59669",
		"lineWidth": 2.5 if is_seed_tool else 1.5
	})
	d.draw_round_rect(BAR_X + 4.0, BAR_Y + 4.0, BAR_W - 8.0, BAR_H - 8.0, 10.0, {
		"fill": "#fff6e0" if is_seed_tool else "#f3e7cf"
	})

	var prev_hover := _in_rect(mx, my, BAR_X + 10.0, BAR_Y + 10.0, 32.0, 32.0)
	d.draw_round_rect(BAR_X + 10.0, BAR_Y + 10.0, 32.0, 32.0, 8.0, {
		"fill": "#e6d2ad" if prev_hover else "#efe1c6",
		"stroke": "#b8996e", "lineWidth": 1.5
	})
	d.draw_text_styled("◀", BAR_X + 26.0, BAR_Y + 26.0, {"size": 14, "fill": "#5c452c", "align": "center", "baseline": "middle"})

	CropDatabase.draw_seed_packet(d, crop, BAR_X + 50.0, BAR_Y + 6.0, 32.0, 40.0)

	var text_x := BAR_X + 90.0
	d.draw_text_styled("%s %s Seeds" % [crop["seasonIcon"], crop["name"]], text_x, BAR_Y + 18.0, {
		"size": 14, "fill": "#3c2e1e", "align": "left", "baseline": "middle"
	})
	var sub_text := "×%d left · %s · Sell %dg" % [
		count, CropDatabase.format_growth_time(float(crop["growthMinutes"])), int(crop["sellPrice"])
	] if count > 0 else "Out of stock — open Shop [B]"
	d.draw_text_styled(sub_text, text_x, BAR_Y + 36.0, {
		"size": 11, "fill": "#4d6b3c" if count > 0 else "#a94a38", "align": "left", "baseline": "middle"
	})

	var pouch_btn_x := BAR_X + BAR_W - 142.0
	var pouch_hover := _in_rect(mx, my, pouch_btn_x, BAR_Y + 10.0, 92.0, 32.0)
	d.draw_round_rect(pouch_btn_x, BAR_Y + 10.0, 92.0, 32.0, 8.0, {
		"fill": "#6f8f58" if pouch_open else ("#dfceb0" if pouch_hover else "#eadbc0"),
		"stroke": "#4e693b" if pouch_open else "#b8996e",
		"lineWidth": 1.5
	})
	d.draw_text_styled("▲ Pouch (%d)" % varieties if pouch_open else "▼ Pouch (%d)" % varieties, pouch_btn_x + 46.0, BAR_Y + 26.0, {
		"size": 11, "fill": "#fff9ea" if pouch_open else "#59432b", "align": "center", "baseline": "middle"
	})

	var next_hover := _in_rect(mx, my, BAR_X + BAR_W - 42.0, BAR_Y + 10.0, 32.0, 32.0)
	d.draw_round_rect(BAR_X + BAR_W - 42.0, BAR_Y + 10.0, 32.0, 32.0, 8.0, {
		"fill": "#e6d2ad" if next_hover else "#efe1c6",
		"stroke": "#b8996e", "lineWidth": 1.5
	})
	d.draw_text_styled("▶", BAR_X + BAR_W - 26.0, BAR_Y + 26.0, {"size": 14, "fill": "#5c452c", "align": "center", "baseline": "middle"})

func _render_pouch_popup(d: DrawSurface, mx: float, my: float) -> void:
	var owned := owned_seed_crops()
	var page_count := maxi(1, int(ceil(float(owned.size()) / float(ITEMS_PER_PAGE))))
	var current_page := mini(page, page_count - 1)
	var start := current_page * ITEMS_PER_PAGE
	var shown := owned.slice(start, start + ITEMS_PER_PAGE)

	d.draw_round_rect(POUCH_X + 5.0, POUCH_Y + 6.0, POUCH_W, POUCH_H, 18.0, {"fill": "#17130f", "alpha": 0.35})
	d.draw_round_rect(POUCH_X, POUCH_Y, POUCH_W, POUCH_H, 18.0, {"fill": "#6e4c32", "stroke": "#472f1d", "lineWidth": 3.0})
	d.draw_round_rect(POUCH_X + 7.0, POUCH_Y + 7.0, POUCH_W - 14.0, POUCH_H - 14.0, 14.0, {
		"fill": "#fbf1dc", "stroke": "#cfa978", "lineWidth": 1.5
	})

	d.draw_round_rect(POUCH_X + 14.0, POUCH_Y + 12.0, POUCH_W - 28.0, 34.0, 10.0, {"fill": "#6e8c59"})
	d.draw_text_styled("🌱 SEED POUCH  ·  Click a seed to equip  ([Q] cycles)", POUCH_X + 26.0, POUCH_Y + 29.0, {
		"size": 13, "fill": "#fff9eb", "align": "left", "baseline": "middle"
	})

	var shop_hover := _in_rect(mx, my, POUCH_X + POUCH_W - 152.0, POUCH_Y + 15.0, 100.0, 28.0)
	d.draw_round_rect(POUCH_X + POUCH_W - 152.0, POUCH_Y + 15.0, 100.0, 28.0, 7.0, {
		"fill": "#ffe5a3" if shop_hover else "#f5d487", "stroke": "#8c6728", "lineWidth": 1.0
	})
	d.draw_text_styled("🌸 Shop [B]", POUCH_X + POUCH_W - 102.0, POUCH_Y + 29.0, {
		"size": 11, "fill": "#4a3518", "align": "center", "baseline": "middle"
	})

	var close_hover := _in_rect(mx, my, POUCH_X + POUCH_W - 44.0, POUCH_Y + 15.0, 28.0, 28.0)
	d.draw_round_rect(POUCH_X + POUCH_W - 44.0, POUCH_Y + 15.0, 28.0, 28.0, 7.0, {
		"fill": "#c46c54" if close_hover else "#a85843"
	})
	d.draw_text_styled("×", POUCH_X + POUCH_W - 30.0, POUCH_Y + 29.0, {
		"size": 16, "fill": "#fff8e7", "align": "center", "baseline": "middle"
	})

	if shown.is_empty():
		d.draw_text_styled("Your seed pouch is empty! Click [🌸 Shop] or press [B] to buy seeds.", POUCH_X + POUCH_W * 0.5, POUCH_Y + 155.0, {
			"size": 14, "fill": "#7a6246", "align": "center", "baseline": "middle"
		})
		return

	var grid_x := POUCH_X + 20.0
	var grid_y := POUCH_Y + 56.0
	var card_w := 180.0
	var card_h := 92.0
	var gap_x := 10.0
	var gap_y := 10.0

	for i in range(shown.size()):
		var crop: Dictionary = shown[i]
		var cid := str(crop["id"])
		var count := int(world.seeds.get(cid, 0))
		var col := i % 3
		var row := int(i / 3)
		var cx := grid_x + float(col) * (card_w + gap_x)
		var cy := grid_y + float(row) * (card_h + gap_y)
		var selected := world.selected_seed_id == cid
		var hovered := _in_rect(mx, my, cx, cy, card_w, card_h)

		d.draw_round_rect(cx, cy, card_w, card_h, 11.0, {
			"fill": "#e5f0d2" if selected else ("#fff8ea" if hovered else "#f4e8cf"),
			"stroke": "#5c8544" if selected else ("#c79e67" if hovered else "#d8c4a1"),
			"lineWidth": 2.5 if selected else 1.5
		})
		CropDatabase.draw_seed_packet(d, crop, cx + 8.0, cy + 10.0, 48.0, 64.0, count)

		var tx := cx + 64.0
		var display_name := "%s…" % str(crop["name"]).substr(0, 10) if str(crop["name"]).length() > 11 else str(crop["name"])
		d.draw_text_styled(display_name, tx, cy + 22.0, {"size": 13, "fill": "#3d2e1e", "align": "left", "baseline": "middle"})
		d.draw_text_styled("%s %s" % [crop["seasonIcon"], crop["season"]], tx, cy + 40.0, {
			"size": 11, "fill": str(crop["seasonColor"]), "align": "left", "baseline": "middle"
		})
		d.draw_text_styled("⏱ %s · 🪙 %d" % [CropDatabase.format_growth_time(float(crop["growthMinutes"])), int(crop["sellPrice"])], tx, cy + 58.0, {
			"size": 11, "fill": "#6c5840", "align": "left", "baseline": "middle"
		})
		if selected:
			d.draw_round_rect(tx, cy + 68.0, 68.0, 16.0, 5.0, {"fill": "#5c8544"})
			d.draw_text_styled("✓ EQUIPPED", tx + 34.0, cy + 76.0, {"size": 9, "fill": "#ffffff", "align": "center", "baseline": "middle"})

func _in_rect(mx: float, my: float, rx: float, ry: float, rw: float, rh: float) -> bool:
	return mx >= rx and mx <= rx + rw and my >= ry and my <= ry + rh

