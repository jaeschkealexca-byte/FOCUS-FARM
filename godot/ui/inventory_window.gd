class_name InventoryWindowUI
extends RefCounted
## Port of `src/ui/inventory-window.ts` — 8-slot persistent bottom toolbar
## and the filterable farm backpack window.

var world: FarmWorldData
var get_tool: Callable
var set_tool: Callable
var on_save: Callable

var visible: bool = false
var filter: String = "Seeds"
var selected_key: String = ""
var page: int = 0

## Backpack window (Little Acre kit): wooden frame with flowers, 3 tabs, 5×4 slot grid
## and an info bar. The frame is drawn as a 9-slice: the flower corners stay at their
## original pixel size (sharp), only the straight wood edges and the flat parchment
## stretch. Slots, tabs and the close button are scaled down from larger source art.
const X := 46.0
const Y := 200.0
const WIDTH := 514.0
const HEIGHT := 640.0
# 9-slice borders in backpack_frame.png (381 × 486)
const FRAME_SRC := Vector2(381.0, 486.0)
const SLICE_L := 135.0
const SLICE_R := 111.0
const SLICE_T := 172.0
const SLICE_B := 121.0
const FILTERS := ["Harvest", "Seeds", "Tools"]
const TAB_TEX := {"Harvest": "backpack_tab_harvest", "Seeds": "backpack_tab_seeds", "Tools": "backpack_tab_tools"}
const TITLE_POS := Vector2(64.0, 73.0)
const TAB_X := 58.0
const TAB_Y := 113.0
const TAB_W := 126.0
const TAB_H := 38.0
const TAB_GAP := 10.0
const GRID_X := 58.0
const GRID_Y := 176.0
const SLOT_W := 72.0
const SLOT_H := 71.0
const STEP_X := 81.5
const STEP_Y := 79.0
const COLS := 5
const ROWS := 4
const PER_PAGE := COLS * ROWS
const INFO := Rect2(66.0, 499.0, 382.0, 60.0)
const CLOSE := Rect2(453.0, 39.0, 44.0, 43.0)
const BTN_TOOLBAR := Rect2(250.0, 58.0, 92.0, 30.0)
const BTN_DISCARD := Rect2(348.0, 58.0, 92.0, 30.0)
# Bottom toolbar (Little Acre kit): wooden bar, flower end caps, 8 slots
const TB_BAR := Rect2(642.0, 978.0, 636.0, 84.0)
const TB_BAR_SRC_W := 743.0
const TB_BAR_CAP := 40.0
const TB_SLOT_X := 676.0
const TB_SLOT_Y := 989.0
const TB_SLOT_W := 64.0
const TB_SLOT_H := 62.0
const TB_STEP := 72.0
const TB_END_LEFT := Vector2(632.0, 970.0)
const TB_END_RIGHT := Vector2(1237.0, 970.0)
const INK := Color("#5b3a29")
const INK_SOFT := Color("#86634a")
var _font: Font = null

func _init(p_world: FarmWorldData, p_get_tool: Callable, p_set_tool: Callable, p_save: Callable) -> void:
	world = p_world
	get_tool = p_get_tool
	set_tool = p_set_tool
	on_save = p_save

func set_world(p_world: FarmWorldData) -> void:
	world = p_world
	selected_key = ""
	page = 0

func open() -> void:
	visible = true
	page = 0
	if world.total_seeds() > 0:
		filter = "Seeds"
	elif world.total_produce() > 0:
		filter = "Harvest"
	else:
		filter = "Tools"
	var sel_seed := int(world.seeds.get(world.selected_seed_id, 0))
	if sel_seed > 0:
		selected_key = "seed:%s" % world.selected_seed_id
	else:
		var stacks := _owned_stacks()
		selected_key = str(stacks[0]["key"]) if not stacks.is_empty() else ""

func close() -> void:
	visible = false

func select_hotbar_slot(slot: int) -> bool:
	if slot < 0 or slot > 7:
		return false
	if slot < 4:
		var changed := int(get_tool.call()) != slot
		set_tool.call(slot)
		if changed:
			on_save.call()
		return changed
	var stack := _toolbar_entry(slot - 4)
	if stack.is_empty():
		return false
	_select_entry(stack)
	return true

func handle_click(mx: float, my: float) -> bool:
	if visible:
		if _hit(CLOSE, mx, my):
			close()
			return true
		if _hit(BTN_TOOLBAR, mx, my):
			var sel_t := _find_selected_entry(_filtered_entries())
			if not sel_t.is_empty() and _is_on_toolbar(str(sel_t["key"])):
				_remove_selected_from_toolbar()
			else:
				_add_selected_to_toolbar()
			return true
		if _hit(BTN_DISCARD, mx, my):
			_discard_selected_item()
			return true

		var tb_slot: int = _toolbar_slot_at(mx, my)
		if tb_slot >= 0:
			if tb_slot < 4:
				select_hotbar_slot(tb_slot)
			else:
				_remove_from_toolbar(tb_slot - 4)
			return true

		for i in range(FILTERS.size()):
			if _hit(_tab_rect(i), mx, my):
				filter = FILTERS[i]
				page = 0
				return true

		var entries: Array[Dictionary] = _filtered_entries()
		var page_count: int = _page_count(entries)
		page = mini(page, page_count - 1)
		var shown: Array[Dictionary] = entries.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE)
		for i in range(shown.size()):
			if _hit(_slot_rect(i), mx, my):
				_select_entry(shown[i])
				return true

		if page_count > 1:
			if _hit(_page_prev_rect(), mx, my) and page > 0:
				page -= 1
				return true
			if _hit(_page_next_rect(), mx, my) and page < page_count - 1:
				page += 1
				return true
		return _contains(mx, my, X, Y, WIDTH, HEIGHT)

	var slot := _toolbar_slot_at(mx, my)
	if slot >= 0:
		if slot == 1 and int(get_tool.call()) == 1:
			world.cycle_selected_seed(1)
			on_save.call()
		else:
			select_hotbar_slot(slot)
		return true
	return false

func render_toolbar(d: DrawSurface, mx: float, my: float) -> void:
	var c: CanvasItem = d.canvas
	_draw_toolbar_bar(c)

	var hovered_slot := _toolbar_slot_at(mx, my)
	for slot in range(8):
		var sx := TB_SLOT_X + float(slot) * TB_STEP
		var sy := TB_SLOT_Y
		var active := (int(get_tool.call()) == slot) if slot < 4 else _selected_stack_matches(_toolbar_entry(slot - 4))
		var hovered := hovered_slot == slot
		_tex_abs(c, "toolbar_slot_selected" if active else ("toolbar_slot_hover" if hovered else "toolbar_slot"), Vector2(sx, sy))
		_text(c, str(slot + 1), sx + 8.0, sy + 10.0, 11, INK_SOFT, "left")
		var cx := sx + TB_SLOT_W * 0.5

		if slot == 1:
			var crop := CropDatabase.get_crop_def(world.selected_seed_id)
			var count := int(world.seeds.get(str(crop["id"]), 0))
			CropDatabase.draw_seed_packet(d, crop, cx - 12.0, sy + 9.0, 24.0, 30.0)
			_text(c, _fit(str(crop["name"]), TB_SLOT_W - 8.0, 10), cx, sy + 50.0, 10, INK, "center")
			var badge := "x%d" % count
			var bw: float = _get_font().get_string_size(badge, HORIZONTAL_ALIGNMENT_LEFT, -1, 10).x + 8.0
			d.draw_round_rect(sx + TB_SLOT_W - bw - 3.0, sy + 3.0, bw, 15.0, 6.0, {"fill": "#5f8a46" if count > 0 else "#a75e49"})
			_text(c, badge, sx + TB_SLOT_W - 3.0 - bw * 0.5, sy + 10.5, 10, Color("#ffffff"), "center")
		elif slot < 4:
			var icons := ["⚒", "🌱", "💧", "✦"]
			var labels := ["Hoe", "Seeds", "Water", "Harvest"]
			d.draw_text_styled(icons[slot], cx, sy + 27.0, {"size": 20, "fill": "#5c7547", "align": "center", "baseline": "middle"})
			_text(c, labels[slot], cx, sy + 50.0, 10, INK, "center")
		else:
			var stack := _toolbar_entry(slot - 4)
			if not stack.is_empty():
				_draw_stack_icon(d, stack, cx, sy + 27.0, 32.0)
				var short_lbl := str(CropDatabase.get_crop_def(stack["id"])["name"])
				_text(c, _fit(short_lbl, TB_SLOT_W - 22.0, 10), sx + 6.0, sy + 50.0, 10, INK, "left")
				_text(c, "x%d" % int(stack["count"]), sx + TB_SLOT_W - 6.0, sy + 50.0, 10, Color("#4c663b"), "right")

	# Flower corners on top of the bar ends (drawn last so slots never cover them)
	_tex_abs(c, "toolbar_end_left", TB_END_LEFT)
	_tex_abs(c, "toolbar_end_right", TB_END_RIGHT)

func _draw_toolbar_bar(c: CanvasItem) -> void:
	var t: Texture2D = AssetRegistry.get_tex("toolbar_bar")
	if t == null:
		return
	var h: float = TB_BAR.size.y
	var cap: float = TB_BAR_CAP
	var x: float = TB_BAR.position.x
	var y: float = TB_BAR.position.y
	var w: float = TB_BAR.size.x
	c.draw_texture_rect_region(t, Rect2(x, y, cap, h), Rect2(0.0, 0.0, cap, h))
	c.draw_texture_rect_region(t, Rect2(x + cap, y, w - cap * 2.0, h), Rect2(cap, 0.0, TB_BAR_SRC_W - cap * 2.0, h))
	c.draw_texture_rect_region(t, Rect2(x + w - cap, y, cap, h), Rect2(TB_BAR_SRC_W - cap, 0.0, cap, h))

func _tex_abs(c: CanvasItem, key: String, pos: Vector2) -> void:
	var t: Texture2D = AssetRegistry.get_tex(key)
	if t != null:
		c.draw_texture(t, Vector2(roundf(pos.x), roundf(pos.y)))

func render_modal(d: DrawSurface, mx: float, my: float) -> void:
	if not visible:
		return
	var c: CanvasItem = d.canvas
	var entries: Array[Dictionary] = _filtered_entries()
	var page_count: int = _page_count(entries)
	page = mini(page, page_count - 1)
	var vis_entries: Array[Dictionary] = entries.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE)
	var sel: Dictionary = _find_selected_entry(entries)

	_draw_frame(c)
	_text(c, "Backpack", X + TITLE_POS.x, Y + TITLE_POS.y, 30, INK, "left")
	_tex(c, "backpack_close_hover" if _hit(CLOSE, mx, my) else "backpack_close", Vector2(X, Y) + CLOSE.position)

	# Toolbar / discard buttons in the title row
	var can_bar: bool = not sel.is_empty() and str(sel["kind"]) != "tool"
	var on_bar: bool = not sel.is_empty() and _is_on_toolbar(str(sel["key"]))
	_draw_small_btn(d, BTN_TOOLBAR, "- Toolbar" if on_bar else "+ Toolbar", can_bar or on_bar, mx, my)
	_draw_small_btn(d, BTN_DISCARD, "Discard 1", can_bar, mx, my)

	# Tabs: light brown by default, green only for the selected tab
	d.draw_round_rect(X + TAB_X - 6.0, Y + TAB_Y - 8.0, TAB_W * 3.0 + TAB_GAP * 2.0 + 12.0, TAB_H + 16.0, 12.0, {"fill": "#f2dcc0", "stroke": "#e4c7a4", "lineWidth": 1.0})
	for i in range(FILTERS.size()):
		var f: String = FILTERS[i]
		var r: Rect2 = _tab_rect(i)
		if filter == f:
			_tex(c, str(TAB_TEX[f]), Vector2(X, Y) + r.position)
		else:
			var tint: Color = Color(0.93, 0.9, 0.87) if _hit(r, mx, my) else Color.WHITE
			_tex(c, str(TAB_TEX[f]) + "_off", Vector2(X, Y) + r.position, 1.0, tint)

	# 5×4 slot grid
	for i in range(PER_PAGE):
		var entry: Dictionary = vis_entries[i] if i < vis_entries.size() else {}
		var r: Rect2 = _slot_rect(i)
		var pos: Vector2 = Vector2(X, Y) + r.position
		var selected: bool = not entry.is_empty() and selected_key == str(entry["key"])
		var hovered: bool = not entry.is_empty() and _hit(r, mx, my)
		_tex(c, "backpack_slot_selected" if selected else ("backpack_slot_hover" if hovered else "backpack_slot"), pos)
		if entry.is_empty():
			continue
		_draw_stack_icon(d, entry, pos.x + SLOT_W * 0.5, pos.y + SLOT_H * 0.5 - 2.0, 63.0)
		if str(entry["kind"]) != "tool":
			var count_txt: String = "x%d" % int(entry["count"])
			var cw: float = _get_font().get_string_size(count_txt, HORIZONTAL_ALIGNMENT_LEFT, -1, 13).x + 10.0
			d.draw_round_rect(pos.x + SLOT_W - cw - 4.0, pos.y + SLOT_H - 22.0, cw, 18.0, 7.0, {"fill": "#fbefdc", "alpha": 0.92, "stroke": "#d9b98f", "lineWidth": 1.0})
			_text(c, count_txt, pos.x + SLOT_W - 9.0, pos.y + SLOT_H - 13.0, 13, INK, "right")
		if _is_on_toolbar(str(entry["key"])):
			c.draw_circle(Vector2(pos.x + 11.0, pos.y + 11.0), 4.0, Color("#6f9a5a"))

	# Info bar
	var ir := Rect2(Vector2(X, Y) + INFO.position, INFO.size)
	d.draw_round_rect(ir.position.x, ir.position.y, ir.size.x, ir.size.y, 12.0, {"fill": "#f2dcc0", "stroke": "#e4c7a4", "lineWidth": 1.0})
	var text_right: float = ir.end.x - 14.0
	if page_count > 1:
		text_right = ir.end.x - 84.0
		var pr: Rect2 = _page_prev_rect()
		var nr: Rect2 = _page_next_rect()
		_draw_small_btn(d, pr, "<", page > 0, mx, my)
		_draw_small_btn(d, nr, ">", page < page_count - 1, mx, my)
		_text(c, "%d/%d" % [page + 1, page_count], X + (pr.end.x + nr.position.x) * 0.5, Y + pr.get_center().y, 13, INK_SOFT, "center")
	if sel.is_empty():
		var empty_msg: String = "Nothing here yet." if entries.is_empty() else "Select an item to inspect it."
		_text(c, empty_msg, ir.position.x + 16.0, ir.get_center().y, 15, INK_SOFT, "left")
	else:
		_draw_stack_icon(d, sel, ir.position.x + 31.0, ir.get_center().y, 46.0)
		var title: String = str(sel["name"])
		if str(sel["kind"]) != "tool":
			title += "  x%d" % int(sel["count"])
		var tx: float = ir.position.x + 62.0
		_text(c, _fit(title, text_right - tx, 17), tx, ir.position.y + 20.0, 17, INK, "left")
		_text(c, _fit(str(sel["description"]), text_right - tx, 13), tx, ir.position.y + 42.0, 13, INK_SOFT, "left")

func _draw_small_btn(d: DrawSurface, r: Rect2, label: String, enabled: bool, mx: float, my: float) -> void:
	var hov: bool = enabled and _hit(r, mx, my)
	var bx: float = X + r.position.x
	var by: float = Y + r.position.y
	d.draw_round_rect(bx, by, r.size.x, r.size.y, 8.0, {
		"fill": ("#86ad6f" if hov else "#77a05f") if enabled else "#ead6bb",
		"stroke": "#567a45" if enabled else "#dcc3a3",
		"lineWidth": 1.5
	})
	_text(d.canvas, label, bx + r.size.x * 0.5, by + r.size.y * 0.5, 14, Color("#fffaf0") if enabled else Color("#b39a7d"), "center")

func _tab_rect(i: int) -> Rect2:
	return Rect2(TAB_X + float(i) * (TAB_W + TAB_GAP), TAB_Y, TAB_W, TAB_H)

func _slot_rect(i: int) -> Rect2:
	return Rect2(GRID_X + float(i % COLS) * STEP_X, GRID_Y + float(int(i / COLS)) * STEP_Y, SLOT_W, SLOT_H)

func _page_prev_rect() -> Rect2:
	return Rect2(INFO.end.x - 78.0, INFO.position.y + 15.0, 24.0, 30.0)

func _page_next_rect() -> Rect2:
	return Rect2(INFO.end.x - 30.0, INFO.position.y + 15.0, 24.0, 30.0)

func _page_count(entries: Array[Dictionary]) -> int:
	return maxi(1, int(ceil(float(entries.size()) / float(PER_PAGE))))

func _hit(r: Rect2, mx: float, my: float) -> bool:
	return _contains(mx, my, X + r.position.x, Y + r.position.y, r.size.x, r.size.y)

func _tex(c: CanvasItem, key: String, pos: Vector2, alpha: float = 1.0, tint: Color = Color.WHITE) -> void:
	var t: Texture2D = AssetRegistry.get_tex(key)
	if t != null:
		c.draw_texture(t, Vector2(roundf(pos.x), roundf(pos.y)), Color(tint.r, tint.g, tint.b, alpha))

func _get_font() -> Font:
	if _font != null:
		return _font
	var rounded := SystemFont.new()
	rounded.font_names = PackedStringArray(["Arial Rounded MT Bold", "Avenir Next Rounded", "Nunito", "Avenir Next", "Helvetica Neue", "Arial"])
	rounded.font_weight = 700
	rounded.antialiasing = TextServer.FONT_ANTIALIASING_GRAY
	rounded.multichannel_signed_distance_field = false
	rounded.hinting = TextServer.HINTING_LIGHT
	rounded.subpixel_positioning = TextServer.SUBPIXEL_POSITIONING_DISABLED
	rounded.generate_mipmaps = false
	_font = rounded
	return _font

func _draw_frame(c: CanvasItem) -> void:
	var t: Texture2D = AssetRegistry.get_tex("backpack_frame")
	if t == null:
		return
	var sx: Array[float] = [0.0, SLICE_L, FRAME_SRC.x - SLICE_R, FRAME_SRC.x]
	var sy: Array[float] = [0.0, SLICE_T, FRAME_SRC.y - SLICE_B, FRAME_SRC.y]
	var dx: Array[float] = [X, X + SLICE_L, X + WIDTH - SLICE_R, X + WIDTH]
	var dy: Array[float] = [Y, Y + SLICE_T, Y + HEIGHT - SLICE_B, Y + HEIGHT]
	for j in range(3):
		for i in range(3):
			var src := Rect2(sx[i], sy[j], sx[i + 1] - sx[i], sy[j + 1] - sy[j])
			var dst := Rect2(roundf(dx[i]), roundf(dy[j]), roundf(dx[i + 1]) - roundf(dx[i]), roundf(dy[j + 1]) - roundf(dy[j]))
			c.draw_texture_rect_region(t, dst, src)

func _fit(text: String, max_w: float, size: int) -> String:
	var f: Font = _get_font()
	if f.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x <= max_w:
		return text
	var t: String = text
	while t.length() > 1 and f.get_string_size(t + "…", HORIZONTAL_ALIGNMENT_LEFT, -1, size).x > max_w:
		t = t.substr(0, t.length() - 1)
	return t.strip_edges() + "…"

func _text(c: CanvasItem, text: String, x: float, y: float, size: int, color: Color, align: String) -> void:
	var f: Font = _get_font()
	var w: float = f.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x
	var dx: float = x
	if align == "center":
		dx -= w * 0.5
	elif align == "right":
		dx -= w
	var dy: float = y + (f.get_ascent(size) - f.get_descent(size)) * 0.5
	c.draw_string(f, Vector2(roundf(dx), roundf(dy)), text, HORIZONTAL_ALIGNMENT_LEFT, -1, size, color)

func _draw_stack_icon(d: DrawSurface, entry: Dictionary, cx: float, cy: float, size: float) -> void:
	var kind := str(entry.get("kind", ""))
	if kind == "seed":
		var crop := CropDatabase.get_crop_def(entry["id"])
		CropDatabase.draw_seed_packet(d, crop, cx - size * 0.42, cy - size * 0.52, size * 0.84, size * 1.04)
	elif kind == "produce":
		var crop := CropDatabase.get_crop_def(entry["id"])
		var harvest_key := str(crop.get("harvestAssetKey", ""))
		var tex := AssetRegistry.get_tex(harvest_key) if not harvest_key.is_empty() else null
		if tex != null:
			var sz := AssetRegistry.get_size(harvest_key)
			var sc := minf(size / maxf(1.0, sz.x), size / maxf(1.0, sz.y))
			d.draw_texture_at(tex, cx - sz.x * sc * 0.5, cy - sz.y * sc * 0.5, sz.x * sc, sz.y * sc)
		else:
			CropDatabase.draw_crop_emblem(d, crop, cx, cy)
	else:
		var icons := ["⚒", "🌱", "💧", "✦"]
		var tidx := clampi(int(entry.get("toolIndex", 0)), 0, 3)
		d.draw_text_styled(icons[tidx], cx, cy, {"size": 20, "fill": "#5c7547", "align": "center", "baseline": "middle"})

func _owned_stacks() -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for id in world.seeds.keys():
		var count := int(world.seeds[id])
		if count > 0:
			var crop := CropDatabase.get_crop_def(id)
			result.append({
				"key": "seed:%s" % id, "kind": "seed", "id": str(id),
				"name": str(crop["seedName"]), "count": count, "description": str(crop["description"])
			})
	for id in world.produce.keys():
		var count := int(world.produce[id])
		if count > 0:
			var crop := CropDatabase.get_crop_def(id)
			result.append({
				"key": "produce:%s" % id, "kind": "produce", "id": str(id),
				"name": str(crop["name"]), "count": count, "description": str(crop["description"])
			})
	return result

func _filtered_entries() -> Array[Dictionary]:
	var tools: Array[Dictionary] = [
		{"key": "tool:0", "kind": "tool", "id": "", "name": "Hoe", "count": 1, "toolIndex": 0, "description": "Tills grassy plots into soft garden soil."},
		{"key": "tool:1", "kind": "tool", "id": "", "name": "Seed Pouch", "count": 1, "toolIndex": 1, "description": "Plants your selected seed into tilled soil."},
		{"key": "tool:2", "kind": "tool", "id": "", "name": "Watering Can", "count": 1, "toolIndex": 2, "description": "Waters planted crops before a focus block."},
		{"key": "tool:3", "kind": "tool", "id": "", "name": "Harvest Basket", "count": 1, "toolIndex": 3, "description": "Gathers mature crops into your backpack."},
	]
	var stacks: Array[Dictionary] = _owned_stacks()
	if filter == "Seeds":
		var seeds_only: Array[Dictionary] = []
		for e in stacks:
			if str(e["kind"]) == "seed":
				seeds_only.append(e)
		return seeds_only
	if filter == "Harvest":
		var harvest_only: Array[Dictionary] = []
		for e in stacks:
			if str(e["kind"]) == "produce":
				harvest_only.append(e)
		return harvest_only
	if filter == "Tools":
		return tools
	var all: Array[Dictionary] = []
	all.append_array(stacks)
	all.append_array(tools)
	return all

func _find_selected_entry(entries: Array[Dictionary]) -> Dictionary:
	for e in entries:
		if str(e["key"]) == selected_key:
			return e
	return entries[0] if not entries.is_empty() else {}

func _select_entry(entry: Dictionary) -> void:
	selected_key = str(entry["key"])
	var kind := str(entry["kind"])
	if kind == "tool":
		set_tool.call(int(entry.get("toolIndex", 0)))
		on_save.call()
	elif kind == "seed":
		world.selected_seed_id = str(entry["id"])
		set_tool.call(1)
		var crop := CropDatabase.get_crop_def(entry["id"])
		world.message = "Equipped %s. Press E on tilled soil to plant." % crop["seedName"]
		on_save.call()

func _toolbar_entry(custom_idx: int) -> Dictionary:
	if custom_idx < 0 or custom_idx >= world.toolbar_slots.size():
		return {}
	var key = world.toolbar_slots[custom_idx]
	if key == null:
		return {}
	for e in _owned_stacks():
		if str(e["key"]) == str(key):
			return e
	return {}

func _selected_stack_matches(entry: Dictionary) -> bool:
	if entry.is_empty():
		return false
	return str(entry["kind"]) == "seed" and int(get_tool.call()) == 1 and world.selected_seed_id == str(entry["id"])

func _is_on_toolbar(key: String) -> bool:
	return world.toolbar_slots.has(key)

func _add_selected_to_toolbar() -> void:
	var sel := _find_selected_entry(_filtered_entries())
	if sel.is_empty() or str(sel["kind"]) == "tool":
		return
	var key := str(sel["key"])
	if world.toolbar_slots.has(key):
		return
	var empty_idx := world.toolbar_slots.find(null)
	var target_idx := empty_idx if empty_idx >= 0 else 0
	world.toolbar_slots[target_idx] = key
	on_save.call()

func _remove_selected_from_toolbar() -> void:
	var sel := _find_selected_entry(_filtered_entries())
	if sel.is_empty():
		return
	var idx := world.toolbar_slots.find(str(sel["key"]))
	if idx >= 0:
		_remove_from_toolbar(idx)

func _remove_from_toolbar(idx: int) -> void:
	if idx >= 0 and idx < world.toolbar_slots.size():
		world.toolbar_slots[idx] = null
		on_save.call()

func _discard_selected_item() -> void:
	var sel := _find_selected_entry(_filtered_entries())
	if sel.is_empty() or str(sel["kind"]) == "tool":
		return
	var id := str(sel["id"])
	if str(sel["kind"]) == "seed":
		var next := maxi(0, int(world.seeds.get(id, 0)) - 1)
		if next == 0:
			world.seeds.erase(id)
		else:
			world.seeds[id] = next
	elif str(sel["kind"]) == "produce":
		var next := maxi(0, int(world.produce.get(id, 0)) - 1)
		if next == 0:
			world.produce.erase(id)
		else:
			world.produce[id] = next
	on_save.call()

func _toolbar_slot_at(mx: float, my: float) -> int:
	for slot in range(8):
		if _contains(mx, my, TB_SLOT_X + float(slot) * TB_STEP, TB_SLOT_Y, TB_SLOT_W, TB_SLOT_H):
			return slot
	return -1

func _contains(mx: float, my: float, rx: float, ry: float, rw: float, rh: float) -> bool:
	return mx >= rx and mx <= rx + rw and my >= ry and my <= ry + rh
