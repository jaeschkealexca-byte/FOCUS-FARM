class_name ShopWindowUI
extends RefCounted
## Port of `src/ui/shop-window.ts` — Seed Shop with 4 seasonal tabs,
## click-to-select seed cards (`✓ SELECTED`), and the lower Seed Inspector
## & Purchase Panel with the `PURCHASE` button.

var visible: bool = false
var world: FarmWorldData = null
var on_save: Callable
var selected_season: String = "Spring"
var selected_crop_id: Variant = null
var page: int = 0
const ITEMS_PER_PAGE := 7

const WIN_W := 1375.0
const WIN_H := 850.0
const WIN_X := roundf((1920.0 - WIN_W) * 0.5)
const WIN_Y := roundf((1080.0 - WIN_H) * 0.5)

const SEASONS := [
	{"id": "Spring", "label": "Spring", "assetKey": "spring_shop_ui"},
	{"id": "Summer", "label": "Summer", "assetKey": "summer_shop_ui"},
	{"id": "Autumn", "label": "Autumn", "assetKey": "autumn_shop_ui"},
	{"id": "Winter", "label": "Winter", "assetKey": "winter_shop_ui"},
]

func open(p_world: FarmWorldData, p_save: Callable) -> void:
	world = p_world
	on_save = p_save
	visible = true
	selected_season = "Spring"
	selected_crop_id = null
	page = 0

func hide() -> void:
	visible = false

func switch_season(season: String) -> void:
	selected_season = season
	selected_crop_id = null
	page = 0

func handle_key(keycode: Key) -> void:
	if not visible:
		return
	if keycode == KEY_ESCAPE:
		hide()
		return
	if keycode == KEY_1:
		switch_season("Spring")
	elif keycode == KEY_2:
		switch_season("Summer")
	elif keycode == KEY_3:
		switch_season("Autumn")
	elif keycode == KEY_4:
		switch_season("Winter")

	var crops: Array[Dictionary] = CropDatabase.get_crops_by_season(selected_season)
	var page_count: int = maxi(1, int(ceil(float(crops.size()) / float(ITEMS_PER_PAGE))))
	if (keycode == KEY_LEFT or keycode == KEY_A) and page > 0:
		page -= 1
	elif (keycode == KEY_RIGHT or keycode == KEY_D) and page < page_count - 1:
		page += 1

func handle_click(mx: float, my: float) -> void:
	if not visible:
		return
	if not _in_rect(mx, my, WIN_X, WIN_Y, WIN_W, WIN_H):
		hide()
		return

	var close: Dictionary = _close_hitbox()
	if _in_rect(mx, my, float(close["x"]), float(close["y"]), float(close["w"]), float(close["h"])):
		hide()
		return

	var tabs: Dictionary = _season_tab_bounds()
	var tab_x: float = float(tabs["x"])
	var tab_y: float = float(tabs["y"])
	var tab_w: float = float(tabs["w"])
	var tab_h: float = float(tabs["h"])
	var tab_gap: float = float(tabs["gap"])
	for i in range(SEASONS.size()):
		var ty: float = tab_y + float(i) * (tab_h + tab_gap)
		if _in_rect(mx, my, tab_x, ty, tab_w, tab_h):
			switch_season(str(SEASONS[i]["id"]))
			return

	var crops: Array[Dictionary] = CropDatabase.get_crops_by_season(selected_season)
	var shown: Array[Dictionary] = crops.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE)
	var cards: Dictionary = _seed_card_bounds()
	var card_w: float = float(cards["w"])
	var card_h: float = float(cards["h"])
	for i in range(shown.size()):
		var pos: Vector2 = _seed_card_position(i, shown.size())
		if _in_rect(mx, my, pos.x, pos.y, card_w, card_h):
			selected_crop_id = str(shown[i]["id"])
			return

	var buy_btn: Dictionary = _purchase_button_bounds()
	if selected_crop_id != null and _in_rect(mx, my, float(buy_btn["x"]), float(buy_btn["y"]), float(buy_btn["w"]), float(buy_btn["h"])):
		_purchase(CropDatabase.get_crop_def(selected_crop_id))
		return

	var page_count: int = maxi(1, int(ceil(float(crops.size()) / float(ITEMS_PER_PAGE))))
	var nav_y: float = WIN_Y + WIN_H - 170.0
	if page > 0 and _in_rect(mx, my, WIN_X + 710.0, nav_y, 48.0, 36.0):
		page -= 1
	elif page < page_count - 1 and _in_rect(mx, my, WIN_X + 820.0, nav_y, 48.0, 36.0):
		page += 1

func render(d: DrawSurface, mx: float, my: float) -> void:
	if not visible:
		return
	d.draw_rect_styled(0.0, 0.0, 1920.0, 1080.0, {"fill": "#17130f", "alpha": 0.66})

	var bg_tex: Texture2D = AssetRegistry.get_tex("shop_ui")
	if bg_tex != null:
		d.draw_texture_at(bg_tex, WIN_X, WIN_Y, WIN_W, WIN_H)
	else:
		d.draw_round_rect(WIN_X, WIN_Y, WIN_W, WIN_H, 24.0, {"fill": "#704526", "stroke": "#462914", "lineWidth": 6.0})
		d.draw_round_rect(WIN_X + 18.0, WIN_Y + 18.0, WIN_W - 36.0, WIN_H - 36.0, 18.0, {"fill": "#f7ebd8", "stroke": "#c9a878", "lineWidth": 3.0})
		d.draw_round_rect(WIN_X + 380.0, WIN_Y + 70.0, 615.0, 96.0, 16.0, {"fill": "#4e3520", "stroke": "#d8b478", "lineWidth": 3.0})
		d.draw_text_styled("🌸  QUIET ACRES SEED SHOP", WIN_X + WIN_W * 0.5, WIN_Y + 118.0, {
			"size": 28, "fill": "#fff8e7", "align": "center", "baseline": "middle"
		})

	var close: Dictionary = _close_hitbox()
	var close_x: float = float(close["x"])
	var close_y: float = float(close["y"])
	var close_w: float = float(close["w"])
	var close_h: float = float(close["h"])
	d.draw_round_rect(close_x, close_y, close_w, close_h, 12.0, {
		"fill": "#ff2948", "alpha": 0.3, "stroke": "#ff2948", "lineWidth": 3.0
	})
	if bg_tex == null:
		d.draw_text_styled("×", close_x + close_w * 0.5, close_y + close_h * 0.5, {
			"size": 28, "fill": "#702028", "align": "center", "baseline": "middle"
		})

	_draw_season_tabs(d, mx, my)
	_draw_crop_grid(d, mx, my)
	_draw_purchase_panel(d, mx, my)

func _close_hitbox() -> Dictionary:
	return {"x": WIN_X + WIN_W - 108.5, "y": WIN_Y + 86.5, "w": 72.0, "h": 72.0}

func _season_tab_bounds() -> Dictionary:
	return {"x": WIN_X + 62.0, "y": WIN_Y + 270.0, "w": 82.0, "h": 82.0, "gap": 10.0}

func _seed_card_bounds() -> Dictionary:
	return {"x": WIN_X + 165.0, "y": WIN_Y + 270.0, "w": 145.0, "h": 180.0, "gap": 12.0, "rowGap": 14.0, "columns": 7}

func _seed_card_position(index: int, total_items: int) -> Vector2:
	var cards: Dictionary = _seed_card_bounds()
	var cols: int = int(cards["columns"])
	var row_start: int = int(index / cols) * cols
	var row_len: int = mini(cols, total_items - row_start)
	var col: int = index - row_start
	var card_w: float = float(cards["w"])
	var card_h: float = float(cards["h"])
	var card_gap: float = float(cards["gap"])
	var card_row_gap: float = float(cards["rowGap"])
	var row_offset: float = (float(cols - row_len) * (card_w + card_gap)) * 0.5 if row_len < cols else 0.0
	return Vector2(
		float(cards["x"]) + row_offset + float(col) * (card_w + card_gap),
		float(cards["y"]) + float(int(index / cols)) * (card_h + card_row_gap)
	)

func _purchase_panel_bounds() -> Dictionary:
	return {"x": WIN_X + 165.0, "y": WIN_Y + 468.0, "w": 1087.0, "h": 160.0}

func _purchase_button_bounds() -> Dictionary:
	var p: Dictionary = _purchase_panel_bounds()
	var w: float = 216.0
	var h: float = 58.0
	return {"x": float(p["x"]) + float(p["w"]) - w - 22.0, "y": float(p["y"]) + roundf((float(p["h"]) - h) * 0.5), "w": w, "h": h}

func _purchase(crop: Dictionary) -> void:
	if world == null or world.coins < int(crop["buyPrice"]):
		return
	if world.buy_seed(str(crop["id"]), 1):
		on_save.call()

func _draw_season_tabs(d: DrawSurface, mx: float, my: float) -> void:
	var tabs: Dictionary = _season_tab_bounds()
	var tab_x: float = float(tabs["x"])
	var tab_y: float = float(tabs["y"])
	var tab_w: float = float(tabs["w"])
	var tab_h: float = float(tabs["h"])
	var tab_gap: float = float(tabs["gap"])
	for i in range(SEASONS.size()):
		var s: Dictionary = SEASONS[i]
		var x: float = tab_x
		var y: float = tab_y + float(i) * (tab_h + tab_gap)
		var tex: Texture2D = AssetRegistry.get_tex(str(s["assetKey"]))
		if tex != null:
			d.draw_texture_at(tex, x, y, tab_w, tab_h)
		else:
			d.draw_round_rect(x, y, tab_w, tab_h, 12.0, {"fill": "#e6d3b8", "stroke": "#795532", "lineWidth": 2.0})
			d.draw_text_styled(str(s["label"]), x + tab_w * 0.5, y + tab_h * 0.5, {
				"size": 15, "fill": "#3e2d19", "align": "center", "baseline": "middle"
			})

		if selected_season == str(s["id"]):
			d.draw_round_rect(x - 3.0, y - 3.0, tab_w + 6.0, tab_h + 6.0, 12.0, {"stroke": "#f4c75e", "lineWidth": 4.0})
		elif _in_rect(mx, my, x, y, tab_w, tab_h):
			d.draw_round_rect(x - 2.0, y - 2.0, tab_w + 4.0, tab_h + 4.0, 12.0, {"stroke": "#fff1c9", "lineWidth": 2.0})

func _draw_crop_grid(d: DrawSurface, mx: float, my: float) -> void:
	var crops: Array[Dictionary] = CropDatabase.get_crops_by_season(selected_season)
	var shown: Array[Dictionary] = crops.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE)
	var cards: Dictionary = _seed_card_bounds()
	var cw: float = float(cards["w"])
	var ch: float = float(cards["h"])

	for i in range(shown.size()):
		var crop: Dictionary = shown[i]
		var pos: Vector2 = _seed_card_position(i, shown.size())
		var cx: float = pos.x
		var cy: float = pos.y
		var hovered: bool = _in_rect(mx, my, cx, cy, cw, ch)
		var selected: bool = selected_crop_id != null and str(selected_crop_id) == str(crop["id"])

		var card_tex: Texture2D = AssetRegistry.get_tex("shop_icon_ui")
		if card_tex != null:
			d.draw_texture_at(card_tex, cx, cy, cw, ch)
		else:
			d.draw_round_rect(cx, cy, cw, ch, 14.0, {"fill": "#d7b98c", "stroke": "#805631", "lineWidth": 2.0})
			d.draw_round_rect(cx + 10.0, cy + 122.0, cw - 20.0, 44.0, 8.0, {"fill": "#b58e58", "stroke": "#78532a", "lineWidth": 1.5})

		if selected:
			d.draw_round_rect(cx - 3.0, cy - 3.0, cw + 6.0, ch + 6.0, 16.0, {"stroke": "#69834f", "lineWidth": 4.0})
			d.draw_round_rect(cx + 1.0, cy + 1.0, cw - 2.0, ch - 2.0, 14.0, {"stroke": "#ffe28a", "lineWidth": 3.0})
		elif hovered:
			d.draw_round_rect(cx + 2.0, cy + 2.0, cw - 4.0, ch - 4.0, 14.0, {"stroke": "#ffe28a", "lineWidth": 3.0})

		CropDatabase.draw_seed_packet(d, crop, cx + (cw - 76.0) * 0.5, cy + 16.0, 76.0, 96.0)

		var price_text: String = str(crop["buyPrice"])
		var price_w: float = DrawSurface.measure_text(price_text, 22)
		var coin_size: float = 20.0
		var coin_gap: float = 7.0
		var row_w: float = coin_size + coin_gap + price_w
		var row_left: float = cx + (cw - row_w) * 0.5 - 4.0
		var price_y: float = cy + 145.0
		var coin_cx: float = row_left + coin_size * 0.5
		d.draw_circle_styled(coin_cx, price_y, coin_size * 0.5, {"fill": "#e9a923", "stroke": "#805014", "lineWidth": 2.0})
		d.draw_circle_styled(coin_cx, price_y, 6.0, {"fill": "#ffd968", "stroke": "#fff0a8", "lineWidth": 1.0})
		d.draw_text_styled(price_text, row_left + coin_size + coin_gap, price_y, {
			"size": 22, "fill": "#000000", "align": "left", "baseline": "middle"
		})

		if selected:
			var bw: float = 92.0
			var bh: float = 20.0
			var bx: float = cx + (cw - bw) * 0.5
			var by: float = cy - 10.0
			d.draw_round_rect(bx, by, bw, bh, 6.0, {"fill": "#587444", "stroke": "#f2d38a", "lineWidth": 1.5})
			d.draw_text_styled("✓ SELECTED", bx + bw * 0.5, by + bh * 0.5, {
				"size": 10, "fill": "#fff8e7", "align": "center", "baseline": "middle"
			})

func _draw_purchase_panel(d: DrawSurface, mx: float, my: float) -> void:
	var p: Dictionary = _purchase_panel_bounds()
	var buy_btn: Dictionary = _purchase_button_bounds()
	var px: float = float(p["x"])
	var py: float = float(p["y"])
	var pw: float = float(p["w"])
	var ph: float = float(p["h"])
	var bx: float = float(buy_btn["x"])
	var by: float = float(buy_btn["y"])
	var bw: float = float(buy_btn["w"])
	var bh: float = float(buy_btn["h"])

	d.draw_round_rect(px + 3.0, py + 4.0, pw, ph, 16.0, {"fill": "#17130f", "alpha": 0.25})
	d.draw_round_rect(px, py, pw, ph, 16.0, {"fill": "#3e3326", "stroke": "#c9a878", "lineWidth": 2.0})
	d.draw_round_rect(px + 6.0, py + 6.0, pw - 12.0, ph - 12.0, 12.0, {"fill": "#f7edd9", "stroke": "#d8bc8c", "lineWidth": 1.0})

	if selected_crop_id == null:
		d.draw_text_styled("🌱 Select a Seed Packet Above", px + 32.0, py + 58.0, {
			"size": 20, "fill": "#463219", "align": "left", "baseline": "middle"
		})
		d.draw_text_styled("Click any seed packet in the shop above to inspect its details, then click PURCHASE.", px + 32.0, py + 98.0, {
			"size": 14, "fill": "#786246", "align": "left", "baseline": "middle"
		})
		d.draw_round_rect(bx, by, bw, bh, 12.0, {"fill": "#d5c6ad", "stroke": "#a89476", "lineWidth": 2.0})
		d.draw_text_styled("SELECT ITEM", bx + bw * 0.5, by + bh * 0.5, {
			"size": 15, "fill": "#6e5c44", "align": "center", "baseline": "middle"
		})
		return

	var crop: Dictionary = CropDatabase.get_crop_def(selected_crop_id)
	var coins: int = world.coins if world != null else 0
	var owned: int = int(world.seeds.get(str(crop["id"]), 0)) if world != null else 0
	var can_afford: bool = coins >= int(crop["buyPrice"])
	var btn_hovered: bool = can_afford and _in_rect(mx, my, bx, by, bw, bh)

	var prev_x: float = px + 20.0
	var prev_y: float = py + 18.0
	d.draw_round_rect(prev_x, prev_y, 100.0, 124.0, 10.0, {"fill": "#ecdec3", "stroke": "#cbb289", "lineWidth": 1.5})
	CropDatabase.draw_seed_packet(d, crop, prev_x + 12.0, prev_y + 10.0, 76.0, 104.0)

	var info_x: float = prev_x + 122.0
	var title_str: String = "%s %s" % [crop["seasonIcon"], crop["seedName"]]
	d.draw_text_styled(title_str, info_x, py + 34.0, {"size": 20, "fill": "#3e2d19", "align": "left", "baseline": "middle"})

	var pouch_text: String = "In Pouch: ×%d" % owned
	var pouch_w: float = DrawSurface.measure_text(pouch_text, 12) + 20.0
	var title_w: float = DrawSurface.measure_text(title_str, 20)
	var pouch_x: float = info_x + title_w + 16.0
	d.draw_round_rect(pouch_x, py + 21.0, pouch_w, 25.0, 7.0, {"fill": "#dfead2", "stroke": "#799962", "lineWidth": 1.5})
	d.draw_text_styled(pouch_text, pouch_x + pouch_w * 0.5, py + 33.5, {"size": 12, "fill": "#3a5e2c", "align": "center", "baseline": "middle"})

	d.draw_text_styled(str(crop["description"]), info_x, py + 66.0, {"size": 13, "fill": "#6b563e", "align": "left", "baseline": "middle"})

	var profit: int = int(crop["sellPrice"]) - int(crop["buyPrice"])
	var stats_line: String = "⏱ Growth: %s   ·   🪙 Price: %d Coins   ·   📦 Harvest Value: %d Coins (+%d profit)" % [
		CropDatabase.format_growth_time(float(crop["growthMinutes"])),
		int(crop["buyPrice"]), int(crop["sellPrice"]), profit
	]
	d.draw_text_styled(stats_line, info_x, py + 98.0, {"size": 13, "fill": "#513f29", "align": "left", "baseline": "middle"})

	var status_line: String = "✓ Click PURCHASE on the right to buy 1 seed packet" if can_afford else "⚠ Need %d more Coins — sell harvested crops at the shipping bin [V]" % (int(crop["buyPrice"]) - coins)
	d.draw_text_styled(status_line, info_x, py + 128.0, {
		"size": 12, "fill": "#3f6a34" if can_afford else "#9c4b34", "align": "left", "baseline": "middle"
	})

	d.draw_round_rect(bx + 2.0, by + 3.0, bw, bh, 12.0, {"fill": "#17130f", "alpha": 0.22})
	d.draw_round_rect(bx, by, bw, bh, 12.0, {
		"fill": ("#7a965e" if btn_hovered else "#69834f") if can_afford else "#b89c86",
		"stroke": ("#f2d38a" if btn_hovered else "#4a5e36") if can_afford else "#8c6d56",
		"lineWidth": 2.0
	})
	d.draw_text_styled("PURCHASE" if can_afford else "NOT ENOUGH GOLD", bx + bw * 0.5, by + 21.0, {
		"size": 16 if can_afford else 13, "fill": "#fff8e7", "align": "center", "baseline": "middle"
	})
	d.draw_text_styled("%d Coins" % int(crop["buyPrice"]), bx + bw * 0.5, by + 41.0, {
		"size": 12, "fill": "#e5f0d8" if can_afford else "#f2ded0", "align": "center", "baseline": "middle"
	})

func _in_rect(mx: float, my: float, rx: float, ry: float, rw: float, rh: float) -> bool:
	return mx >= rx and mx <= rx + rw and my >= ry and my <= ry + rh
