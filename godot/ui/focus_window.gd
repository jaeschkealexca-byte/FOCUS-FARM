class_name FocusWindowUI
extends RefCounted
## Port of `src/ui/focus-window.ts` — 25-minute wall-clock Pomodoro Focus timer
## with live crop growth preview, partial progress commit on pause/reset,
## and interactive task list.

var visible: bool = false
var world: FarmWorldData = null
var on_save_farm: Callable
var session: FocusSessionData = null
const DURATION := 25

var tasks: Array[Dictionary] = []
var adding_task: bool = false
var draft_text: String = ""

func _init() -> void:
	_load_tasks()

func _load_tasks() -> void:
	var saved: Variant = SaveManager.load_json(SaveManager.FOCUS_SAVE_PATH)
	if saved is Dictionary:
		var saved_dict: Dictionary = saved as Dictionary
		if saved_dict.has("tasks") and saved_dict["tasks"] is Array:
			tasks.clear()
			var raw_list: Array = saved_dict["tasks"] as Array
			for item in raw_list:
				if item is Dictionary:
					var item_dict: Dictionary = item as Dictionary
					if item_dict.has("label"):
						tasks.append({"label": str(item_dict["label"]), "done": bool(item_dict.get("done", false))})
	if tasks.is_empty():
		tasks = [
			{"label": "Write project proposal", "done": false},
			{"label": "Read for 30 minutes", "done": false},
			{"label": "Plan tomorrow's tasks", "done": false},
			{"label": "Work on portfolio", "done": false},
			{"label": "Tidy up workspace", "done": false},
		]
		_save_tasks()

func _save_tasks() -> void:
	SaveManager.save_json(SaveManager.FOCUS_SAVE_PATH, {
		"version": 1,
		"tasks": tasks,
	})

func open(p_world: FarmWorldData, p_save_farm: Callable) -> void:
	world = p_world
	on_save_farm = p_save_farm
	visible = true
	adding_task = false
	draft_text = ""

func hide() -> void:
	visible = false
	adding_task = false

func dispose_session() -> void:
	if session != null:
		if world != null:
			var grown := world.commit_focus_progress(session.elapsed_minutes(), session.plots)
			if grown > 0:
				on_save_farm.call()
		session.cancel()
		session = null
	visible = false
	adding_task = false

func update_timer(_dt: float) -> void:
	if session == null or world == null:
		return
	if not session.paused():
		world.preview_focus_growth(session.elapsed_minutes(), session.plots)
	if session.complete():
		var snap := session.plots.duplicate()
		session = null
		world.complete_focus(DURATION, snap)
		on_save_farm.call()

func handle_key_event(event: InputEventKey) -> bool:
	if not visible:
		return false
	if adding_task:
		if event.keycode == KEY_ESCAPE:
			adding_task = false
			draft_text = ""
			return true
		if event.keycode == KEY_ENTER or event.keycode == KEY_KP_ENTER:
			_commit_draft_task()
			return true
		if event.keycode == KEY_BACKSPACE:
			if not draft_text.is_empty():
				draft_text = draft_text.substr(0, draft_text.length() - 1)
			return true
		if event.unicode >= 32 and draft_text.length() < 44:
			draft_text += char(event.unicode)
			return true
		return true

	if event.keycode == KEY_ESCAPE or event.keycode == KEY_F:
		hide()
		return true
	if event.keycode == KEY_SPACE:
		_on_play_or_pause()
		return true
	return false

func handle_click(mx: float, my: float) -> void:
	if not visible:
		return

	# Close / Return to Farm button
	if _in_rect(mx, my, 1560.0, 64.0, 240.0, 48.0):
		hide()
		return

	# Timer buttons: Play (260, 740), Pause (480, 740), Reset (700, 740)
	if _in_rect(mx, my, 260.0, 740.0, 190.0, 64.0):
		_on_play_pressed()
		return
	if _in_rect(mx, my, 480.0, 740.0, 190.0, 64.0):
		_on_pause_pressed()
		return
	if _in_rect(mx, my, 700.0, 740.0, 190.0, 64.0):
		_on_reset_pressed()
		return

	# Add Task button
	if _in_rect(mx, my, 1520.0, 210.0, 180.0, 44.0):
		if adding_task:
			_commit_draft_task()
		else:
			adding_task = true
			draft_text = ""
		return

	# Task rows
	var list_x: float = 1040.0
	var list_y: float = 324.0 if adding_task else 280.0
	var row_h: float = 56.0
	for i in range(mini(tasks.size(), 9)):
		var ry: float = list_y + float(i) * row_h
		if _in_rect(mx, my, list_x, ry, 580.0, 46.0):
			tasks[i]["done"] = not bool(tasks[i]["done"])
			_save_tasks()
			return
		if _in_rect(mx, my, list_x + 600.0, ry, 46.0, 46.0):
			tasks.remove_at(i)
			_save_tasks()
			return

func _on_play_pressed() -> void:
	if world == null:
		return
	if session == null:
		session = FocusSessionData.new(DURATION, world.watered_growing_indices())
		world.message = "Focus block started (%dm). Watered crops are growing in real time!" % DURATION
	elif session.paused():
		var snap := world.watered_growing_indices()
		var rem_min := session.remaining_ms() / 60000.0
		session = FocusSessionData.new(int(ceil(rem_min)), snap)
		world.message = "Focus resumed!"

func _on_pause_pressed() -> void:
	if session != null and not session.paused() and world != null:
		var elapsed := session.elapsed_minutes()
		session.pause()
		world.commit_focus_progress(elapsed, session.plots, true)
		on_save_farm.call()
		world.message = "Focus paused. Rewater crops before resuming if you want them to keep growing."

func _on_reset_pressed() -> void:
	if session != null and world != null:
		var elapsed := session.elapsed_minutes()
		world.commit_focus_progress(elapsed, session.plots)
		on_save_farm.call()
		session.cancel()
		session = null
		world.message = "Focus timer reset."

func _on_play_or_pause() -> void:
	if session == null or session.paused():
		_on_play_pressed()
	else:
		_on_pause_pressed()

func _commit_draft_task() -> void:
	var clean := draft_text.strip_edges()
	if not clean.is_empty() and tasks.size() < 20:
		tasks.append({"label": clean, "done": false})
		_save_tasks()
	adding_task = false
	draft_text = ""

func render(d: DrawSurface, mx: float, my: float) -> void:
	if not visible:
		return
	d.draw_rect_styled(0.0, 0.0, 1920.0, 1080.0, {"fill": "#14110e", "alpha": 0.88})

	# Main sanctuary frame
	d.draw_round_rect(80.0, 40.0, 1760.0, 960.0, 24.0, {"fill": "#3e3326", "stroke": "#c9a878", "lineWidth": 4.0})
	d.draw_round_rect(96.0, 56.0, 1728.0, 928.0, 18.0, {"fill": "#f7edd9", "stroke": "#d8bc8c", "lineWidth": 2.0})

	d.draw_text_styled("⏱  QUIET ACRES FOCUS SANCTUARY", 140.0, 88.0, {"size": 26, "fill": "#3e2d19", "align": "left", "baseline": "middle"})

	var back_hov := _in_rect(mx, my, 1560.0, 64.0, 240.0, 48.0)
	d.draw_round_rect(1560.0, 64.0, 240.0, 48.0, 10.0, {
		"fill": "#7a965e" if back_hov else "#69834f", "stroke": "#4a5e36", "lineWidth": 2.0
	})
	d.draw_text_styled("← Back to Farm [Esc]", 1680.0, 88.0, {"size": 15, "fill": "#fff8e7", "align": "center", "baseline": "middle"})

	# Left Pomodoro Timer Card
	d.draw_round_rect(140.0, 150.0, 820.0, 740.0, 18.0, {"fill": "#efe1c6", "stroke": "#c9ae82", "lineWidth": 2.0})
	d.draw_text_styled("REAL-TIME FOCUS TIMER", 550.0, 220.0, {"size": 20, "fill": "#6b5335", "align": "center", "baseline": "middle"})

	var clock_str := session.countdown() if session != null else "%02d:00" % DURATION
	d.draw_round_rect(250.0, 290.0, 600.0, 240.0, 24.0, {"fill": "#3e3326", "stroke": "#c9a878", "lineWidth": 3.0})
	d.draw_text_styled(clock_str, 550.0, 410.0, {"size": 96, "fill": "#fff8e7", "align": "center", "baseline": "middle"})

	var watering_count := world.watered_growing_indices().size() if world != null else 0
	var status_str := "🌱 %d watered crop(s) ready to grow during focus" % watering_count
	if session != null:
		status_str = "⏸ Session paused — rewater crops before resuming" if session.paused() else "⏳ Focusing… crops are growing in real time!"
	d.draw_text_styled(status_str, 550.0, 600.0, {"size": 16, "fill": "#3f6a34", "align": "center", "baseline": "middle"})

	_draw_timer_btn(d, 260.0, 740.0, 190.0, 64.0, "▶ START", "#69834f", _in_rect(mx, my, 260.0, 740.0, 190.0, 64.0))
	_draw_timer_btn(d, 480.0, 740.0, 190.0, 64.0, "⏸ PAUSE", "#56828f", _in_rect(mx, my, 480.0, 740.0, 190.0, 64.0))
	_draw_timer_btn(d, 700.0, 740.0, 190.0, 64.0, "⏹ RESET", "#a85843", _in_rect(mx, my, 700.0, 740.0, 190.0, 64.0))

	# Right Tasks Card
	d.draw_round_rect(1000.0, 150.0, 760.0, 740.0, 18.0, {"fill": "#efe1c6", "stroke": "#c9ae82", "lineWidth": 2.0})
	d.draw_text_styled("TODAY'S FOCUS TASKS", 1040.0, 232.0, {"size": 20, "fill": "#463219", "align": "left", "baseline": "middle"})

	var add_hov := _in_rect(mx, my, 1520.0, 210.0, 180.0, 44.0)
	d.draw_round_rect(1520.0, 210.0, 180.0, 44.0, 10.0, {
		"fill": "#7a965e" if add_hov else "#69834f", "stroke": "#4a5e36", "lineWidth": 1.5
	})
	d.draw_text_styled("✓ Save Task" if adding_task else "＋ New Task", 1610.0, 232.0, {
		"size": 14, "fill": "#fff8e7", "align": "center", "baseline": "middle"
	})

	if adding_task:
		d.draw_round_rect(1040.0, 266.0, 660.0, 44.0, 8.0, {"fill": "#fffdf7", "stroke": "#69834f", "lineWidth": 2.0})
		var prompt := "%s▌" % draft_text if not draft_text.is_empty() else "Type task name and press Enter…"
		d.draw_text_styled(prompt, 1056.0, 288.0, {"size": 14, "fill": "#3e2d19", "align": "left", "baseline": "middle"})

	var list_x := 1040.0
	var list_y := 324.0 if adding_task else 280.0
	var row_h := 56.0
	for i in range(mini(tasks.size(), 9)):
		var t: Dictionary = tasks[i]
		var ry := list_y + float(i) * row_h
		var done := bool(t["done"])
		d.draw_round_rect(list_x, ry, 580.0, 46.0, 10.0, {
			"fill": "#e2ebd5" if done else "#fcf5e6",
			"stroke": "#8aa870" if done else "#d8c4a1",
			"lineWidth": 1.5
		})
		d.draw_text_styled("☑" if done else "☐", list_x + 24.0, ry + 23.0, {"size": 18, "fill": "#4c7a39" if done else "#786246", "align": "center", "baseline": "middle"})
		d.draw_text_styled(str(t["label"]), list_x + 52.0, ry + 23.0, {
			"size": 15, "fill": "#6e7d62" if done else "#3e2d19", "align": "left", "baseline": "middle"
		})
		d.draw_round_rect(list_x + 600.0, ry, 46.0, 46.0, 10.0, {"fill": "#ead7c3", "stroke": "#c4a788", "lineWidth": 1.0})
		d.draw_text_styled("×", list_x + 623.0, ry + 23.0, {"size": 18, "fill": "#8c4a3b", "align": "center", "baseline": "middle"})

func _draw_timer_btn(d: DrawSurface, bx: float, by: float, bw: float, bh: float, label: String, color: String, hovered: bool) -> void:
	d.draw_round_rect(bx, by, bw, bh, 12.0, {
		"fill": color, "alpha": 1.0 if hovered else 0.9, "stroke": "#f2d38a" if hovered else "#3e2d19", "lineWidth": 2.0
	})
	d.draw_text_styled(label, bx + bw * 0.5, by + bh * 0.5, {"size": 18, "fill": "#fff8e7", "align": "center", "baseline": "middle"})

func _in_rect(mx: float, my: float, rx: float, ry: float, rw: float, rh: float) -> bool:
	return mx >= rx and mx <= rx + rw and my >= ry and my <= ry + rh

