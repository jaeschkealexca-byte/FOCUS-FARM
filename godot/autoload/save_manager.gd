extends Node
## SaveManager Autoload — JSON file persistence in `user://` with version checks
## and schema validation matching `src/save/save-manager.ts` and `src/save/focus-farm-save.ts`.

const FARM_SAVE_PATH := "user://quiet_acres_farm.json"
const CALENDAR_SAVE_PATH := "user://quiet_acres_calendar.json"
const FOCUS_SAVE_PATH := "user://quiet_acres_focus_desk.json"

func save_json(path: String, data: Dictionary) -> bool:
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(JSON.stringify(data, "\t"))
	file.close()
	return true

func load_json(path: String) -> Variant:
	if not FileAccess.file_exists(path):
		return null
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return null
	var raw := file.get_as_text()
	file.close()
	var parsed: Variant = JSON.parse_string(raw)
	if parsed is Dictionary:
		return parsed
	return null

func is_valid_farm_save(value: Variant) -> bool:
	if not (value is Dictionary):
		return false
	var d: Dictionary = value as Dictionary
	var ver: int = int(d.get("version", 0))
	if ver != 1 and ver != 2:
		return false
	if int(d.get("width", 0)) != 18 or int(d.get("height", 0)) != 10:
		return false
	var player: Variant = d.get("player")
	if not (player is Dictionary):
		return false
	var player_dict: Dictionary = player as Dictionary
	var px: int = int(player_dict.get("x", -1))
	var py: int = int(player_dict.get("y", -1))
	if px < 0 or px >= 18 or py < 0 or py >= 10:
		return false
	if py == 1 and (px == 1 or px == 2):
		return false
	var dir_str: String = str(player_dict.get("direction", ""))
	if not ["up", "down", "left", "right"].has(dir_str):
		return false
	var plots: Variant = d.get("plots")
	if not (plots is Array) or (plots as Array).size() != 180:
		return false
	return true

