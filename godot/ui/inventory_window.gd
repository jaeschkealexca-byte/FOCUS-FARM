class_name InventoryWindowUI
extends RefCounted
## Port of `src/ui/inventory-window.ts` — 8-slot persistent bottom toolbar
## and filterable farm backpack modal (`y = 236`).

var world: FarmWorldData
var get_tool: Callable
var set_tool: Callable
var on_save: Callable

var visible: bool = false
var filter: String = "All"
var selected_key: String = ""
var page: int = 0

const X := 46.0
const Y := 236.0
const WIDTH := 430.0
const HEIGHT := 680.0
const PAD_X := 25.0
const CONTENT_W := WIDTH - PAD_X * 2.0 # 380.0
const FILTERS := ["All", "Seeds", "Harvest", "Tools"]

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
	filter = "All"
	page = 0
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
		# Close button inside top-right of green header bar
		if _contains(mx, my, X + WIDTH - 22.0 - 10.0 - 36.0, Y + 22.0 + 10.0, 36.0, 35.0):
			close()
			return true
		# 3 action buttons (+ To Toolbar, - From Bar, Discard 1)
		var btn_y: float = Y + 552.0
		var btn_w: float = 120.0
		var btn_h: float = 32.0
		if _contains(mx, my, X + PAD_X, btn_y, btn_w, btn_h):
			_add_selected_to_toolbar()
			return true
		if _contains(mx, my, X + PAD_X + 130.0, btn_y, btn_w, btn_h):
			_remove_selected_from_toolbar()
			return true
		if _contains(mx, my, X + PAD_X + 260.0, btn_y, btn_w, btn_h):
			_discard_selected_item()
			return true

		var tb_slot: int = _toolbar_slot_at(mx, my)
		if tb_slot >= 0:
			if tb_slot < 4:
				select_hotbar_slot(tb_slot)
			else:
				_remove_from_toolbar(tb_slot - 4)
			return true

		# 4 filter tabs
		var tab_w: float = 89.0
		var tab_gap: float = 8.0
		for i in range(FILTERS.size()):
			var tab_x: float = X + PAD_X + float(i) * (tab_w + tab_gap)
			if _contains(mx, my, tab_x, Y + 88.0, tab_w, 38.0):
				filter = FILTERS[i]
				page = 0
				return true

		# 2x3 item grid
		var entries: Array[Dictionary] = _filtered_entries()
		var page_count: int = maxi(1, int(ceil(float(entries.size()) / 6.0)))
		page = mini(page, page_count - 1)
		var shown: Array[Dictionary] = entries.slice(page * 6, page * 6 + 6)
		var card_w: float = 184.0
		var card_h: float = 74.0
		var card_gap_x: float = 12.0
		var card_gap_y: float = 12.0
		for i in range(shown.size()):
			var col: int = i % 2
			var row: int = int(i / 2)
			var sx: float = X + PAD_X + float(col) * (card_w + card_gap_x)
			var sy: float = Y + 154.0 + float(row) * (card_h + card_gap_y)
			if _contains(mx, my, sx, sy, card_w, card_h):
				_select_entry(shown[i])
				return true

		# Pagination buttons aligned inside CONTENT_W
		var page_y: float = Y + 604.0
		var nav_w: float = 42.0
		var nav_h: float = 32.0
		var prev_x: float = X + PAD_X + CONTENT_W - nav_w * 2.0 - 56.0
		var next_x: float = X + PAD_X + CONTENT_W - nav_w
		if _contains(mx, my, prev_x, page_y, nav_w, nav_h) and page > 0:
			page -= 1
			return true
		if _contains(mx, my, next_x, page_y, nav_w, nav_h) and page < page_count - 1:
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
	var x := (1920.0 - 760.0) * 0.5
	var y := 1003.0
	d.draw_round_rect(x - 15.0, y - 5.0, 790.0, 78.0, 16.0, {"fill": "#17130f", "alpha": 0.3})
	d.draw_round_rect(x - 13.0, y - 7.0, 786.0, 78.0, 16.0, {"fill": "#3e3326", "alpha": 0.94, "stroke": "#c9a878", "lineWidth": 2.0})

	var div_x := x + 4.0 * 95.0 - 5.5
	d.draw_line_styled(div_x, y + 4.0, div_x, y + 60.0, {"stroke": "#7a6348", "lineWidth": 2.0})

	var hovered_slot := _toolbar_slot_at(mx, my)
	for slot in range(8):
		var sx := x + float(slot) * 95.0
		var sy := y
		var active := (int(get_tool.call()) == slot) if slot < 4 else _selected_stack_matches(_toolbar_entry(slot - 4))
		var hovered := hovered_slot == slot

		d.draw_round_rect(sx, sy, 84.0, 64.0, 10.0, {
			"fill": "#f6e4b8" if active else ("#eee0be" if hovered else "#e3d0aa"),
			"stroke": "#b87538" if active else ("#c79252" if hovered else "#aa8a60"),
			"lineWidth": 3.0 if active else 1.5
		})
		d.draw_round_rect(sx + 4.0, sy + 4.0, 76.0, 56.0, 7.0, {
			"fill": "#fff6df" if active else ("#faf1dc" if hovered else "#f4ead3")
		})
		d.draw_text_styled(str(slot + 1), sx + 9.0, sy + 8.0, {"size": 11, "fill": "#6c5034", "align": "left", "baseline": "top"})

		if slot == 1:
			var crop := CropDatabase.get_crop_def(world.selected_seed_id)
			var count := int(world.seeds.get(str(crop["id"]), 0))
			CropDatabase.draw_seed_packet(d, crop, sx + 27.0, sy + 6.0, 30.0, 36.0)
			var sname := "%s…" % str(crop["name"]).substr(0, 8) if str(crop["name"]).length() > 9 else str(crop["name"])
			d.draw_text_styled(sname, sx + 42.0, sy + 51.0, {
				"size": 10, "fill": "#3f5a36" if active else "#59432d", "align": "center", "baseline": "middle"
			})
			d.draw_round_rect(sx + 52.0, sy + 6.0, 26.0, 14.0, 4.0, {"fill": "#4c7a39" if count > 0 else "#a75e49"})
			d.draw_text_styled("×%d" % count, sx + 65.0, sy + 13.0, {"size": 10, "fill": "#ffffff", "align": "center", "baseline": "middle"})
		elif slot < 4:
			var icons := ["⚒", "🌱", "💧", "✦"]
			var labels := ["Hoe", "Seeds", "Water", "Harvest"]
			d.draw_text_styled(icons[slot], sx + 42.0, sy + 25.0, {"size": 22, "fill": "#5c7547", "align": "center", "baseline": "middle"})
			d.draw_text_styled(labels[slot], sx + 42.0, sy + 50.0, {"size": 10, "fill": "#59432d", "align": "center", "baseline": "middle"})
		else:
			var stack := _toolbar_entry(slot - 4)
			if not stack.is_empty():
				_draw_stack_icon(d, stack, sx + 42.0, sy + 27.0, 28.0)
				var short_lbl := str(CropDatabase.get_crop_def(stack["id"])["name"]).substr(0, 7)
				d.draw_text_styled(short_lbl, sx + 9.0, sy + 51.0, {"size": 10, "fill": "#6c5034", "align": "left", "baseline": "middle"})
				d.draw_text_styled("×%d" % int(stack["count"]), sx + 75.0, sy + 51.0, {"size": 10, "fill": "#4c663b", "align": "right", "baseline": "middle"})
			else:
				d.draw_text_styled("·", sx + 42.0, sy + 32.0, {"size": 22, "fill": "#b7a68a", "align": "center", "baseline": "middle"})

func render_modal(d: DrawSurface, mx: float, my: float) -> void:
	if not visible:
		return
	var entries: Array[Dictionary] = _filtered_entries()
	var vis_entries: Array[Dictionary] = entries.slice(page * 6, page * 6 + 6)
	var page_count: int = maxi(1, int(ceil(float(entries.size()) / 6.0)))

	d.draw_round_rect(X + 8.0, Y + 10.0, WIDTH, HEIGHT, 24.0, {"fill": "#17130f", "alpha": 0.35})
	d.draw_round_rect(X, Y, WIDTH, HEIGHT, 24.0, {"fill": "#79543a", "stroke": "#503722", "lineWidth": 4.0})
	d.draw_round_rect(X + 8.0, Y + 8.0, WIDTH - 16.0, HEIGHT - 16.0, 19.0, {"fill": "#ead3ac", "stroke": "#bd9567", "lineWidth": 2.0})
	d.draw_round_rect(X + 17.0, Y + 17.0, WIDTH - 34.0, HEIGHT - 34.0, 16.0, {"fill": "#fff5df"})
	d.draw_round_rect(X + 22.0, Y + 22.0, WIDTH - 44.0, 55.0, 13.0, {"fill": "#719166"})
	d.draw_text_styled("✿  MY BACKPACK", X + 38.0, Y + 49.5, {"size": 22, "fill": "#fff8e7", "align": "left", "baseline": "middle"})

	var close_x: float = X + WIDTH - 22.0 - 10.0 - 36.0
	var close_y: float = Y + 22.0 + 10.0
	var close_hover: bool = _contains(mx, my, close_x, close_y, 36.0, 35.0)
	d.draw_round_rect(close_x, close_y, 36.0, 35.0, 9.0, {"fill": "#bf6b53" if close_hover else "#a75e49"})
	d.draw_text_styled("×", close_x + 18.0, close_y + 17.5, {"size": 20, "fill": "#fff8e7", "align": "center", "baseline": "middle"})

	var tab_w: float = 89.0
	var tab_gap: float = 8.0
	for i in range(FILTERS.size()):
		var f: String = FILTERS[i]
		var tx: float = X + PAD_X + float(i) * (tab_w + tab_gap)
		var act: bool = filter == f
		var hov: bool = _contains(mx, my, tx, Y + 88.0, tab_w, 38.0)
		d.draw_round_rect(tx, Y + 88.0, tab_w, 38.0, 10.0, {
			"fill": "#829d70" if act else ("#f7edda" if hov else "#f2e5cc"),
			"stroke": "#58744f" if act else ("#bda37c" if hov else "#d4c09e"),
			"lineWidth": 1.5
		})
		d.draw_text_styled(f, tx + tab_w * 0.5, Y + 107.0, {"size": 13, "fill": "#fff9e9" if act else "#67533b", "align": "center", "baseline": "middle"})

	d.draw_text_styled("YOUR THINGS  (Click a seed to equip)", X + PAD_X + 2.0, Y + 141.0, {"size": 12, "fill": "#8b7151", "align": "left", "baseline": "middle"})

	var card_w: float = 184.0
	var card_h: float = 74.0
	var card_gap_x: float = 12.0
	var card_gap_y: float = 12.0
	for i in range(6):
		var entry: Dictionary = vis_entries[i] if i < vis_entries.size() else {}
		var col: int = i % 2
		var row: int = int(i / 2)
		var sx: float = X + PAD_X + float(col) * (card_w + card_gap_x)
		var sy: float = Y + 154.0 + float(row) * (card_h + card_gap_y)
		var selected: bool = not entry.is_empty() and selected_key == str(entry["key"])
		var hovered: bool = not entry.is_empty() and _contains(mx, my, sx, sy, card_w, card_h)
		var is_eq: bool = not entry.is_empty() and str(entry["kind"]) == "seed" and world.selected_seed_id == str(entry["id"])

		d.draw_round_rect(sx, sy, card_w, card_h, 11.0, {
			"fill": "#e4efcf" if selected else ("#fcf4e6" if hovered else "#f8edda"),
			"stroke": "#779464" if selected else ("#8aa870" if is_eq else ("#cbb492" if hovered else "#dfcdae")),
			"lineWidth": 2.5 if selected else (2.0 if is_eq else 1.0)
		})
		if entry.is_empty():
			continue
		_draw_stack_icon(d, entry, sx + 32.0, sy + card_h * 0.5, 36.0)
		var dname: String = "%s…" % str(entry["name"]).substr(0, 13) if str(entry["name"]).length() > 14 else str(entry["name"])
		d.draw_text_styled(dname, sx + 60.0, sy + 26.0, {"size": 13, "fill": "#513e2b", "align": "left", "baseline": "middle"})
		var qty_str: String = "Farm tool" if str(entry["kind"]) == "tool" else "Quantity  ×%d" % int(entry["count"])
		d.draw_text_styled(qty_str, sx + 60.0, sy + 46.0, {"size": 11, "fill": "#887359", "align": "left", "baseline": "middle"})
		if is_eq:
			d.draw_round_rect(sx + 60.0, sy + 55.0, 66.0, 14.0, 4.0, {"fill": "#5c8248"})
			d.draw_text_styled("✓ ACTIVE", sx + 93.0, sy + 62.0, {"size": 9, "fill": "#ffffff", "align": "center", "baseline": "middle"})

	var info_y: float = Y + 420.0
	var info_h: float = 118.0
	d.draw_round_rect(X + PAD_X, info_y, CONTENT_W, info_h, 13.0, {"fill": "#f0e1c5", "stroke": "#d1b993", "lineWidth": 1.5})
	d.draw_text_styled("A LITTLE ABOUT IT", X + PAD_X + 16.0, info_y + 20.0, {"size": 12, "fill": "#8b7151", "align": "left", "baseline": "middle"})
	var sel: Dictionary = _find_selected_entry(entries)
	if not sel.is_empty():
		_draw_stack_icon(d, sel, X + PAD_X + 38.0, info_y + 72.0, 40.0)
		d.draw_text_styled(str(sel["name"]), X + PAD_X + 72.0, info_y + 52.0, {"size": 16, "fill": "#4f5f3f", "align": "left", "baseline": "middle"})
		var desc_str: String = "%s…" % str(sel["description"]).substr(0, 46) if str(sel["description"]).length() > 47 else str(sel["description"])
		d.draw_text_styled(desc_str, X + PAD_X + 72.0, info_y + 80.0, {"size": 11, "fill": "#5b4834", "align": "left", "baseline": "middle"})
	else:
		d.draw_text_styled("Select an item above to inspect it.", X + PAD_X + 16.0, info_y + 64.0, {"size": 12, "fill": "#8a755b", "align": "left", "baseline": "middle"})

	var btn_y: float = Y + 552.0
	var btn_w: float = 120.0
	var btn_h: float = 32.0
	_draw_action_btn(d, X + PAD_X, btn_y, btn_w, btn_h, "+ To Toolbar", not sel.is_empty() and str(sel["kind"]) != "tool")
	_draw_action_btn(d, X + PAD_X + 130.0, btn_y, btn_w, btn_h, "- From Bar", not sel.is_empty() and _is_on_toolbar(str(sel["key"])))
	_draw_action_btn(d, X + PAD_X + 260.0, btn_y, btn_w, btn_h, "Discard 1", not sel.is_empty() and str(sel["kind"]) != "tool")

	var py: float = Y + 604.0
	var nav_w: float = 42.0
	var nav_h: float = 32.0
	var prev_x: float = X + PAD_X + CONTENT_W - nav_w * 2.0 - 56.0
	var next_x: float = X + PAD_X + CONTENT_W - nav_w
	var page_label_x: float = prev_x + nav_w + 28.0

	d.draw_text_styled("Seeds ×%d · Harvest ×%d" % [world.total_seeds(), world.total_produce()], X + PAD_X + 2.0, py + nav_h * 0.5, {
		"size": 12, "fill": "#65513a", "align": "left", "baseline": "middle"
	})
	_draw_action_btn(d, prev_x, py, nav_w, nav_h, "◀", page > 0)
	d.draw_text_styled("%d/%d" % [page + 1, page_count], page_label_x, py + nav_h * 0.5, {"size": 12, "fill": "#65513a", "align": "center", "baseline": "middle"})
	_draw_action_btn(d, next_x, py, nav_w, nav_h, "▶", page < page_count - 1)

func _draw_action_btn(d: DrawSurface, bx: float, by: float, bw: float, bh: float, label: String, enabled: bool) -> void:
	d.draw_round_rect(bx, by, bw, bh, 7.0, {
		"fill": "#829d70" if enabled else "#dfd2bc",
		"stroke": "#5c764e" if enabled else "#c7b59a",
		"lineWidth": 1.0
	})
	d.draw_text_styled(label, bx + bw * 0.5, by + bh * 0.5, {
		"size": 11, "fill": "#fff9ea" if enabled else "#9d8a70", "align": "center", "baseline": "middle"
	})

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
	var x := (1920.0 - 760.0) * 0.5
	var y := 1003.0
	for slot in range(8):
		if _contains(mx, my, x + float(slot) * 95.0, y, 84.0, 64.0):
			return slot
	return -1

func _contains(mx: float, my: float, rx: float, ry: float, rw: float, rh: float) -> bool:
	return mx >= rx and mx <= rx + rw and my >= ry and my <= ry + rh
