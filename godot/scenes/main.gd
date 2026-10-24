extends Control
## Main Game & Title Scene Controller — Port of `src/scenes/game-scene.ts` and `src/scenes/start-scene.ts`.

@onready var farm_canvas: FarmViewportClip = $FarmViewportClip
@onready var ui_overlay: UIOverlayCanvas = $UIOverlay

var mode: String = "game" # "game" or "start"
var world: FarmWorldData = FarmWorldData.new()
var tool: int = 0

var shop: ShopWindowUI = ShopWindowUI.new()
var focus: FocusWindowUI = FocusWindowUI.new()
var inventory_window: InventoryWindowUI
var seed_selector: SeedSelectorUI
const TimeHudScript := preload("res://ui/time_hud.gd")
var time_hud = TimeHudScript.new()
const CoinHudScript := preload("res://ui/coin_hud.gd")
var coin_hud = CoinHudScript.new()

## The right-hand button column starts below the corner clock.
const RIGHT_Y := 274.0

func _ready() -> void:
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	farm_canvas.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	ui_overlay.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	ui_overlay.main_controller = self
	inventory_window = InventoryWindowUI.new(
		world,
		func() -> int: return tool,
		func(new_tool: int) -> void: _set_active_tool(new_tool),
		func() -> void: _persist()
	)
	seed_selector = SeedSelectorUI.new(
		world,
		func() -> int: return tool,
		func(new_tool: int) -> void: _set_active_tool(new_tool),
		func() -> void: _persist(),
		func() -> void: shop.open(world, func() -> void: _persist())
	)
	_enter_game()

func _set_active_tool(new_tool: int) -> void:
	tool = new_tool
	if seed_selector != null:
		seed_selector.on_tool_changed(tool)

func _enter_game() -> void:
	focus.dispose_session()
	shop.hide()
	inventory_window.close()
	tool = 0
	var loaded: Variant = SaveManager.load_json(SaveManager.FARM_SAVE_PATH)
	world = FarmWorldData.new()
	if SaveManager.is_valid_farm_save(loaded):
		world.restore(loaded as Dictionary)
	farm_canvas.world = world
	inventory_window.set_world(world)
	seed_selector.set_world(world)
	seed_selector.on_tool_changed(tool)

func _persist() -> void:
	SaveManager.save_json(SaveManager.FARM_SAVE_PATH, world.to_save())

func _process(delta: float) -> void:
	focus.update_timer(delta)
	farm_canvas.visible = (mode == "game" and not focus.visible)
	farm_canvas.queue_redraw()
	ui_overlay.queue_redraw()
	queue_redraw()

func _input(event: InputEvent) -> void:
	if mode == "start":
		if event is InputEventKey:
			var ke_start: InputEventKey = event as InputEventKey
			if ke_start.pressed and not ke_start.echo:
				var k: Key = ke_start.keycode
				if k == KEY_ENTER or k == KEY_SPACE or k == KEY_ESCAPE:
					mode = "game"
		elif event is InputEventMouseButton:
			var mb_start: InputEventMouseButton = event as InputEventMouseButton
			if mb_start.pressed and mb_start.button_index == MOUSE_BUTTON_LEFT:
				var mp_start: Vector2 = get_local_mouse_position()
				if _in_rect(mp_start.x, mp_start.y, (1920.0 - 280.0) * 0.5, 640.0, 280.0, 56.0):
					mode = "game"
		return

	if event is InputEventMouseButton:
		var mb: InputEventMouseButton = event as InputEventMouseButton
		if mb.pressed:
			var mp: Vector2 = get_local_mouse_position()
			if mb.button_index == MOUSE_BUTTON_WHEEL_UP and not focus.visible and not shop.visible and not inventory_window.visible:
				world.cycle_selected_seed(-1)
				_set_active_tool(1)
				seed_selector.ensure_selected_visible()
				_persist()
				return
			if mb.button_index == MOUSE_BUTTON_WHEEL_DOWN and not focus.visible and not shop.visible and not inventory_window.visible:
				world.cycle_selected_seed(1)
				_set_active_tool(1)
				seed_selector.ensure_selected_visible()
				_persist()
				return
			if mb.button_index == MOUSE_BUTTON_LEFT:
				_handle_left_click(mp.x, mp.y)
				return

	if event is InputEventKey:
		var ke: InputEventKey = event as InputEventKey
		if ke.pressed and not ke.echo:
			_handle_key_press(ke)

func _handle_left_click(mx: float, my: float) -> void:
	if focus.visible:
		focus.handle_click(mx, my)
		return
	if shop.visible:
		shop.handle_click(mx, my)
		return

	# Clickable "Shop [B]" button next to the gold balance
	if _is_coin_shop_button_hovered(mx, my):
		inventory_window.close()
		shop.open(world, func() -> void: _persist())
		return

	# Top-right buttons
	if _in_rect(mx, my, 1920.0 - 24.0 - 312.0, RIGHT_Y + 24.0, 312.0, 48.0):
		focus.open(world, func() -> void: _persist())
		return
	if _in_rect(mx, my, 1920.0 - 24.0 - 312.0, RIGHT_Y + 80.0, 312.0, 48.0):
		shop.open(world, func() -> void: _persist())
		return
	if _in_rect(mx, my, 1920.0 - 24.0 - 312.0, RIGHT_Y + 136.0, 312.0, 48.0):
		if inventory_window.visible:
			inventory_window.close()
		else:
			inventory_window.open()
		return
	if _in_rect(mx, my, 1920.0 - 24.0 - 312.0, RIGHT_Y + 192.0, 152.0, 40.0):
		world.zoom_in()
		return
	if _in_rect(mx, my, 1920.0 - 24.0 - 152.0, RIGHT_Y + 192.0, 152.0, 40.0):
		world.zoom_out()
		return

	# Corner clock: click to switch hemisphere
	if time_hud.handle_click(mx, my):
		return

	if inventory_window.visible:
		inventory_window.handle_click(mx, my)
		return

	if seed_selector.handle_click(mx, my):
		return
	if inventory_window.handle_click(mx, my):
		return

	# Click-to-harvest with Harvest tool [4]
	if tool == 3:
		var grid := world.screen_to_grid(mx, my)
		var p := world.plot_at(grid.x, grid.y)
		if p != null and p.planted and world.use_tool(tool, p):
			_persist()

func _handle_key_press(event: InputEventKey) -> void:
	var k := event.keycode
	if focus.visible:
		focus.handle_key_event(event)
		return
	if shop.visible:
		shop.handle_key(k)
		return

	if k == KEY_I:
		if inventory_window.visible:
			inventory_window.close()
		else:
			inventory_window.open()
		return
	if inventory_window.visible:
		if k == KEY_ESCAPE:
			inventory_window.close()
		return

	if k == KEY_ESCAPE:
		if seed_selector.pouch_open:
			seed_selector.close_pouch()
		else:
			mode = "start"
		return
	if k == KEY_B:
		shop.open(world, func() -> void: _persist())
		return
	if k == KEY_F:
		focus.open(world, func() -> void: _persist())
		return
	if k == KEY_Q:
		world.cycle_selected_seed(-1 if event.shift_pressed else 1)
		_set_active_tool(1)
		seed_selector.ensure_selected_visible()
		_persist()
		return

	var move_dir := ""
	if k == KEY_UP or k == KEY_W:
		move_dir = "up"
	elif k == KEY_DOWN or k == KEY_S:
		move_dir = "down"
	elif k == KEY_LEFT or k == KEY_A:
		move_dir = "left"
	elif k == KEY_RIGHT or k == KEY_D:
		move_dir = "right"

	if not move_dir.is_empty():
		world.player.step(move_dir, func(x: int, y: int) -> bool: return world.can_enter(x, y))
		_persist()
		return

	var digit_map := {
		KEY_1: 0, KEY_2: 1, KEY_3: 2, KEY_4: 3,
		KEY_5: 4, KEY_6: 5, KEY_7: 6, KEY_8: 7
	}
	if digit_map.has(k):
		var slot: int = digit_map[k]
		if slot < 4:
			if slot == 1 and tool == 1:
				world.cycle_selected_seed(1)
				seed_selector.open_pouch()
				_persist()
			else:
				_set_active_tool(slot)
		else:
			inventory_window.select_hotbar_slot(slot)
		return

	if k == KEY_E and world.use_tool(tool):
		seed_selector.ensure_selected_visible()
		_persist()
		return
	if k == KEY_V and world.sell_produce():
		_persist()

func _draw() -> void:
	draw_rect(Rect2(0.0, 0.0, 1920.0, 1080.0), Color.html("#101219"), true)

func draw_overlay(canvas: CanvasItem) -> void:
	var d: DrawSurface = DrawSurface.new(canvas)
	var mp: Vector2 = get_local_mouse_position()

	if mode == "start":
		_render_start_screen(d, mp.x, mp.y)
		return

	if not focus.visible and not shop.visible:
		world.render_crop_hover(d, mp.x, mp.y)
		_render_top_right_buttons(d, mp.x, mp.y)
		_render_status_banner(d)
		if not inventory_window.visible:
			seed_selector.render(d, mp.x, mp.y)
		inventory_window.render_toolbar(d, mp.x, mp.y)
		inventory_window.render_modal(d, mp.x, mp.y)

	if not focus.visible and not shop.visible:
		time_hud.render(canvas, d, mp.x, mp.y)

	focus.render(d, mp.x, mp.y)
	shop.render(d, mp.x, mp.y)
	if not focus.visible:
		_render_coin_hud(d, mp.x, mp.y)

func _render_start_screen(d: DrawSurface, mx: float, my: float) -> void:
	d.draw_rect_styled(0.0, 0.0, 1920.0, 1080.0, {"fill": "#101219"})
	d.draw_text_styled("Q U I E T   A C R E S", 960.0, 380.0, {"size": 44, "fill": "#f2d38a", "align": "center", "baseline": "middle"})
	d.draw_text_styled("A little care. A little focus. Something good grows.", 960.0, 455.0, {"size": 20, "fill": "#d8c7a8", "align": "center", "baseline": "middle"})

	var btn_x := (1920.0 - 280.0) * 0.5
	var btn_y := 640.0
	var hov := _in_rect(mx, my, btn_x, btn_y, 280.0, 56.0)
	d.draw_round_rect(btn_x, btn_y, 280.0, 56.0, 14.0, {
		"fill": "#7a965e" if hov else "#69834f", "stroke": "#f2d38a", "lineWidth": 2.0
	})
	d.draw_text_styled("Enter your farm [Enter]", 960.0, btn_y + 28.0, {"size": 16, "fill": "#fff8e7", "align": "center", "baseline": "middle"})

	var pw := 780.0
	var ph := 130.0
	var px := (1920.0 - pw) * 0.5
	var py := 860.0
	d.draw_round_rect(px, py, pw, ph, 14.0, {"fill": "#3e3326", "stroke": "#c9a878", "lineWidth": 2.0})
	d.draw_text_styled("TILL  →  PLANT  →  WATER  →  FOCUS  →  HARVEST", 960.0, py + 34.0, {"size": 16, "fill": "#f2d38a", "align": "center", "baseline": "middle"})
	d.draw_text_styled("Your crops grow only when a real-time focus block is complete.", 960.0, py + 68.0, {"size": 15, "fill": "#fff8e7", "align": "center", "baseline": "middle"})
	d.draw_text_styled("No deadlines. No lost streaks. Just your own gentle pace.", 960.0, py + 100.0, {"size": 13, "fill": "#d8c7a8", "align": "center", "baseline": "middle"})

func _render_calendar_card(d: DrawSurface, mx: float, my: float) -> void:
	var x := 24.0
	var y := 24.0
	var w := 316.0
	var h := 136.0
	d.draw_round_rect(x + 2.0, y + 3.0, w, h, 14.0, {"fill": "#17130f", "alpha": 0.28})
	d.draw_round_rect(x, y, w, h, 14.0, {"fill": "#3e3326", "stroke": "#c9a878", "lineWidth": 2.0})

	d.draw_text_styled("%s  ·  %s" % [RealCalendar.time_str, RealCalendar.season], x + 16.0, y + 24.0, {
		"size": 14, "fill": "#f2d38a", "align": "left", "baseline": "middle"
	})
	d.draw_text_styled(RealCalendar.date_str, x + 16.0, y + 48.0, {
		"size": 13, "fill": "#fff8e7", "align": "left", "baseline": "middle"
	})

	var hem_hov := _in_rect(mx, my, x + 16.0, y + 66.0, w - 32.0, 34.0)
	d.draw_round_rect(x + 16.0, y + 66.0, w - 32.0, 34.0, 10.0, {
		"fill": "#524332" if hem_hov else "#3e3326",
		"stroke": "#e3c79c" if hem_hov else "#c9a878",
		"lineWidth": 1.5
	})
	d.draw_text_styled("%s · Switch" % RealCalendar.hemisphere(), x + w * 0.5, y + 83.0, {
		"size": 13, "fill": "#fff8e7", "align": "center", "baseline": "middle"
	})
	d.draw_text_styled("Local time • real calendar", x + 16.0, y + 116.0, {
		"size": 11, "fill": "#d8c7a8", "align": "left", "baseline": "middle"
	})

func _render_top_right_buttons(d: DrawSurface, mx: float, my: float) -> void:
	var rx := 1920.0 - 24.0 - 312.0
	_draw_primary_btn(d, rx, RIGHT_Y + 24.0, 312.0, 48.0, "⏱ FOCUS & TASKS [F]", 15, _in_rect(mx, my, rx, RIGHT_Y + 24.0, 312.0, 48.0))
	_draw_primary_btn(d, rx, RIGHT_Y + 80.0, 312.0, 48.0, "🌸 SEED SHOP [B]", 15, _in_rect(mx, my, rx, RIGHT_Y + 80.0, 312.0, 48.0))
	_draw_primary_btn(d, rx, RIGHT_Y + 136.0, 312.0, 48.0, "🎒 MY BACKPACK [I]", 15, _in_rect(mx, my, rx, RIGHT_Y + 136.0, 312.0, 48.0))
	_draw_primary_btn(d, rx, RIGHT_Y + 192.0, 152.0, 40.0, "＋ ZOOM IN", 13, _in_rect(mx, my, rx, RIGHT_Y + 192.0, 152.0, 40.0))
	_draw_primary_btn(d, rx + 160.0, RIGHT_Y + 192.0, 152.0, 40.0, "－ ZOOM OUT", 13, _in_rect(mx, my, rx + 160.0, RIGHT_Y + 192.0, 152.0, 40.0))

func _draw_primary_btn(d: DrawSurface, x: float, y: float, w: float, h: float, label: String, font_size: int, hovered: bool) -> void:
	d.draw_round_rect(x + 2.0, y + 3.0, w, h, 10.0, {"fill": "#17130f", "alpha": 0.26})
	d.draw_round_rect(x, y, w, h, 10.0, {
		"fill": "#7a965e" if hovered else "#69834f",
		"stroke": "#e3c79c" if hovered else "#c9a878",
		"lineWidth": 2.0
	})
	d.draw_text_styled(label, x + w * 0.5, y + h * 0.5, {"size": font_size, "fill": "#fff8e7", "align": "center", "baseline": "middle"})

func _render_status_banner(d: DrawSurface) -> void:
	var bw := 840.0
	var bh := 76.0
	var bx := (1920.0 - bw) * 0.5
	var by := 36.0

	d.draw_round_rect(bx + 3.0, by + 4.0, bw, bh, 14.0, {"fill": "#17130f", "alpha": 0.28})
	d.draw_round_rect(bx, by, bw, bh, 14.0, {"fill": "#463829", "alpha": 0.92, "stroke": "#c9a878", "lineWidth": 2.0})
	d.draw_round_rect(bx + 5.0, by + 5.0, bw - 10.0, bh - 10.0, 10.0, {"fill": "#f7edd9", "stroke": "#d3bc97", "lineWidth": 1.0})

	var msg := "%s…" % world.message.substr(0, 85) if world.message.length() > 86 else world.message
	d.draw_text_styled(msg, bx + bw * 0.5, by + 25.0, {"size": 13, "fill": "#463625", "align": "center", "baseline": "middle"})
	d.draw_line_styled(bx + 18.0, by + 42.0, bx + bw - 18.0, by + 42.0, {"stroke": "#dfd0b4", "lineWidth": 1.0})

	var hint := _get_target_action_hint()
	d.draw_text_styled(str(hint["text"]), bx + 20.0, by + 57.0, {"size": 12, "fill": str(hint["color"]), "align": "left", "baseline": "middle"})

	var crop := CropDatabase.get_crop_def(world.selected_seed_id)
	var seed_count := int(world.seeds.get(str(crop["id"]), 0))
	var summary := "🌱 %s: ×%d  ·  🧺 Harvest: ×%d  ·  ⏱ Sessions: %d" % [crop["name"], seed_count, world.total_produce(), world.sessions]
	d.draw_text_styled(summary, bx + bw - 20.0, by + 57.0, {"size": 11, "fill": "#6b5842", "align": "right", "baseline": "middle"})

func _get_target_action_hint() -> Dictionary:
	var beside_bin := absi(world.player.grid_x - 2) + absi(world.player.grid_y - 1) == 1
	if beside_bin and world.total_produce() > 0:
		return {"text": "📦 Next to Shipping Bin: Press [V] to ship harvest (+%d coins)" % world.total_produce_value(), "color": "#3f6a34"}

	var p := world.target_plot()
	if p == null:
		var t := world.player.target()
		if t.y == 1 and (t.x == 1 or t.x == 2):
			return {
				"text": "📦 Shipping Bin: Press [V] to sell (+%d coins) or [B] for Seed Shop" % world.total_produce_value() if world.total_produce() > 0 else "🌸 Market Stand: Press [B] to open the Seed Shop",
				"color": "#5a4934"
			}
		return {"text": "Use WASD / Arrow Keys to face a farm tile", "color": "#78654e"}

	if not p.tilled:
		return {"text": "⚒ Target tile: Press [E] to till soil with Hoe", "color": "#3f6a34"} if tool == 0 else {"text": "💡 Target tile is untilled — switch to Hoe [1] then press [E]", "color": "#7a5c38"}

	if not p.planted:
		var crop := CropDatabase.get_crop_def(world.selected_seed_id)
		var count := int(world.seeds.get(str(crop["id"]), 0))
		if count <= 0:
			return {"text": "🌸 Tilled soil ready — open Seed Shop [B] to buy seeds!", "color": "#8c4a3b"}
		return {"text": "🌱 Target tile: Press [E] to plant %s Seeds (×%d left)" % [crop["name"], count], "color": "#3f6a34"} if tool == 1 else {"text": "💡 Tilled soil — press [2] for Seeds (%s) then [E] to plant" % crop["name"], "color": "#5c6b45"}

	var crop_def := p.crop_def()
	if p.mature():
		return {"text": "✦ %s is mature! Press [E] to harvest (+%d coins)" % [crop_def["name"], int(crop_def["sellPrice"])], "color": "#9c6514"} if tool == 3 else {"text": "✦ %s is mature! Switch to Harvest [4] then press [E]" % crop_def["name"], "color": "#9c6514"}

	if not p.watered:
		return {"text": "💧 Target tile: Press [E] to water %s" % crop_def["name"], "color": "#2e6b7d"} if tool == 2 else {"text": "💧 %s needs water — switch to Watering Can [3] then press [E]" % crop_def["name"], "color": "#2e6b7d"}

	return {
		"text": "⏱ %s watered (%s / %s) — Press [F] to Focus" % [
			crop_def["name"],
			CropDatabase.format_growth_time(p.growth),
			CropDatabase.format_growth_time(float(crop_def["growthMinutes"]))
		],
		"color": "#48683a"
	}

func _coin_shop_button_bounds() -> Dictionary:
	return {"x": 24.0 + 316.0 - 88.0 - 12.0, "y": 24.0 + (52.0 - 30.0) * 0.5, "w": 88.0, "h": 30.0}

func _is_coin_shop_button_hovered(mx: float, my: float) -> bool:
	if shop.visible or focus.visible:
		return false
	return coin_hud.is_hovered(world.coins, mx, my)

func _render_coin_hud(d: DrawSurface, mx: float, my: float) -> void:
	# On the farm: wooden gold-coin bar under the clock (grows with the balance).
	# While the shop is open the small centred badge below is used instead.
	if not shop.visible:
		coin_hud.right_x = 1920.0 - time_hud.margin - 6.0
		coin_hud.top_y = 206.0
		coin_hud.render(d.canvas, world.coins, mx, my)
		return
	var balance_text: String = "%d Coins" % world.coins
	var font_size: int = 18 if shop.visible else 20
	var text_w: float = ceilf(DrawSurface.measure_text(balance_text, font_size))

	var coin_scale: float = 2.25 if shop.visible else 2.5
	var coin_size: float = roundf(12.0 * coin_scale)
	var pad_left: float = 14.0 if shop.visible else 16.0
	var gap: float = 10.0
	var pad_right: float = 16.0
	var text_x_offset: float = pad_left + coin_size + gap

	var w: float = (text_x_offset + text_w + pad_right) if shop.visible else 316.0
	var h: float = 46.0 if shop.visible else 52.0
	var x: float = roundf((1920.0 - w) * 0.5) if shop.visible else 24.0
	var y: float = 42.0 if shop.visible else 24.0

	d.draw_round_rect(x + 3.0, y + 4.0, w, h, 14.0, {"fill": "#17130f", "alpha": 0.28})
	d.draw_round_rect(x, y, w, h, 14.0, {"fill": "#3e3326", "stroke": "#c9a878", "lineWidth": 2.0})
	d.draw_round_rect(x + 5.0, y + 5.0, w - 10.0, h - 10.0, 10.0, {"fill": "#f7edd9", "stroke": "#d8bc8c", "lineWidth": 1.0})

	_draw_retro_coin_icon(d, x + pad_left, y + roundf((h - coin_size) * 0.5), coin_scale)
	d.draw_text_styled(balance_text, x + text_x_offset, y + h * 0.5, {
		"size": font_size, "fill": "#463219", "align": "left", "baseline": "middle"
	})

	if not shop.visible:
		var btn: Dictionary = _coin_shop_button_bounds()
		var bx: float = float(btn["x"])
		var by: float = float(btn["y"])
		var bw: float = float(btn["w"])
		var bh: float = float(btn["h"])
		var hov: bool = _is_coin_shop_button_hovered(mx, my)
		d.draw_round_rect(bx, by + 1.0, bw, bh, 8.0, {"fill": "#17130f", "alpha": 0.16})
		d.draw_round_rect(bx, by, bw, bh, 8.0, {
			"fill": "#7a965e" if hov else "#69834f",
			"stroke": "#e6cfa3" if hov else "#4a5e36",
			"lineWidth": 1.5
		})
		d.draw_text_styled("Shop [B]", bx + bw * 0.5, by + bh * 0.5, {
			"size": 12, "fill": "#fff8e7", "align": "center", "baseline": "middle"
		})

func _draw_retro_coin_icon(d: DrawSurface, origin_x: float, origin_y: float, pixel_size: float) -> void:
	var palette := {
		"B": "#5a3508",
		"S": "#c47812",
		"G": "#f4b825",
		"Y": "#ffe259",
		"W": "#fff9c4",
	}
	var rows := [
		"....BBBB....",
		"..BBYYYGBB..",
		".BYWWYGGGSB.",
		".BYWYGBSGSB.",
		"BYYYGBWGGGSB",
		"BYGGGBWGGGSB",
		"BGGGGBYGGGSB",
		"BGGGGBYGGSSB",
		".BGGGGBSSSB.",
		".BSGGGGSSSB.",
		"..BBSSSSBB..",
		"....BBBB....",
	]
	var ps := ceilf(pixel_size)
	for r in range(rows.size()):
		var row_str: String = rows[r]
		for c in range(row_str.length()):
			var ch := row_str.substr(c, 1)
			if palette.has(ch):
				d.draw_rect_styled(origin_x + float(c) * pixel_size, origin_y + float(r) * pixel_size, ps, ps, {"fill": palette[ch]})

func _in_rect(mx: float, my: float, rx: float, ry: float, rw: float, rh: float) -> bool:
	return mx >= rx and mx <= rx + rw and my >= ry and my <= ry + rh
