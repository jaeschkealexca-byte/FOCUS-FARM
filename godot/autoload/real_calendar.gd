extends Node
## RealCalendar Autoload — Local device time and meteorological seasons.
## Direct port of `src/time/real-calendar.ts`.

signal calendar_updated

var southern: bool = false
var time_str: String = ""
var date_str: String = ""
var season: String = "Spring"
var phase: String = "Day"
var night_alpha: float = 0.0
var _last_second: int = -1

func _ready() -> void:
	var saved: Variant = SaveManager.load_json(SaveManager.CALENDAR_SAVE_PATH)
	if saved is Dictionary:
		var saved_dict: Dictionary = saved as Dictionary
		if saved_dict.has("southern"):
			southern = bool(saved_dict["southern"])
	update_calendar(0.0)

func _process(delta: float) -> void:
	update_calendar(delta)

func hemisphere() -> String:
	return "Southern" if southern else "Northern"

func toggle_hemisphere() -> void:
	southern = not southern
	SaveManager.save_json(SaveManager.CALENDAR_SAVE_PATH, {
		"version": 1,
		"southern": southern
	})
	_last_second = -1
	update_calendar(0.0)

func update_calendar(_dt: float) -> void:
	var now_sec: int = int(Time.get_unix_time_from_system())
	if now_sec == _last_second:
		return
	_last_second = now_sec

	var dt: Dictionary = Time.get_datetime_dict_from_system()
	var dt_hour: int = int(dt["hour"])
	var dt_min: int = int(dt["minute"])
	var dt_sec: int = int(dt["second"])
	var dt_weekday: int = int(dt["weekday"])
	var dt_month: int = int(dt["month"])
	var dt_day: int = int(dt["day"])
	var dt_year: int = int(dt["year"])

	time_str = "%02d:%02d:%02d" % [dt_hour, dt_min, dt_sec]
	var weekdays: Array[String] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
	var months: Array[String] = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
	var wd_idx: int = clampi(dt_weekday, 0, 6)
	var mo_idx: int = clampi(dt_month - 1, 0, 11)
	date_str = "%s, %d %s %d" % [weekdays[wd_idx], dt_day, months[mo_idx], dt_year]

	var seasons_list: Array[String] = ["Winter", "Spring", "Summer", "Autumn"]
	var index: int = (int(floor(float(dt_month) / 3.0)) + (2 if southern else 0)) % 4
	season = seasons_list[index]

	var hour: float = float(dt_hour) + float(dt_min) / 60.0
	if hour < 6.0 or hour >= 20.0:
		phase = "Night"
		night_alpha = 0.28
	elif hour < 8.0:
		phase = "Dawn"
		night_alpha = 0.28 * (8.0 - hour) / 2.0
	elif hour >= 18.0:
		phase = "Dusk"
		night_alpha = 0.28 * (hour - 18.0) / 2.0
	else:
		phase = "Day"
		night_alpha = 0.0

	calendar_updated.emit()

func palette() -> Dictionary:
	match season:
		"Winter":
			return {
				"grass": ["#e0e9ef", "#d7e3eb", "#edf2f5", "#dae6ee"],
				"edge": "#bacfdd",
				"detail": "#b0c5d4",
				"flower": "#ffffff",
				"sky": "#dce4f1",
				"tree": "#b6cbd3",
				"treeLight": "#f0f5fa"
			}
		"Autumn":
			return {
				"grass": ["#bba071", "#c4a775", "#cfb27d", "#bca16e"],
				"edge": "#967951",
				"detail": "#bb754f",
				"flower": "#edba6c",
				"sky": "#f0d5cf",
				"tree": "#bd805e",
				"treeLight": "#edbd83"
			}
		"Summer":
			return {
				"grass": ["#7f9e66", "#839f68", "#88a46d", "#809c65"],
				"edge": "#74925e",
				"detail": "#a4b77c",
				"flower": "#ffe6a1",
				"sky": "#d7e5f0",
				"tree": "#7fa774",
				"treeLight": "#b4cf89"
			}
		_:
			return {
				"grass": ["#a3bd85", "#a9c38b", "#b2cb94", "#a7be88"],
				"edge": "#89a66f",
				"detail": "#83a66b",
				"flower": "#f4bbd3",
				"sky": "#ead8ed",
				"tree": "#cc91ae",
				"treeLight": "#efbdd2"
			}

