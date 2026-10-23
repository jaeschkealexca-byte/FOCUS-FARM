class_name FocusSessionData
extends RefCounted
## Port of `src/farm/focus-session.ts` — uses real wall-clock Unix timestamps
## so focus countdowns remain accurate even if the window is unfocused or minimized.

var minutes: int
var plots: Array[int] = []
var _deadline_ms: float
var _paused_remaining_ms: Variant = null
var _settled: bool = false

func _init(p_minutes: int, p_plots: Array[int]) -> void:
	minutes = p_minutes
	_deadline_ms = Time.get_unix_time_from_system() * 1000.0 + float(p_minutes) * 60000.0
	plots = p_plots.duplicate()

func paused() -> bool:
	return _paused_remaining_ms != null

func remaining_ms() -> float:
	if _paused_remaining_ms != null:
		return float(_paused_remaining_ms)
	return maxf(0.0, _deadline_ms - Time.get_unix_time_from_system() * 1000.0)

func elapsed_minutes() -> float:
	return maxf(0.0, (float(minutes) * 60000.0 - remaining_ms()) / 60000.0)

func pause() -> void:
	if not paused() and not _settled and remaining_ms() > 0.0:
		_paused_remaining_ms = remaining_ms()

func resume() -> void:
	if _paused_remaining_ms == null or _settled:
		return
	_deadline_ms = Time.get_unix_time_from_system() * 1000.0 + float(_paused_remaining_ms)
	_paused_remaining_ms = null

func countdown() -> String:
	var seconds := int(ceil(remaining_ms() / 1000.0))
	var m := int(seconds / 60)
	var s := seconds % 60
	return "%02d:%02d" % [m, s]

func complete() -> bool:
	if _settled or paused() or remaining_ms() > 0.0:
		return false
	_settled = true
	return true

func cancel() -> void:
	_settled = true
