class_name TimeHudUI
extends RefCounted
## Corner clock HUD built from the "Little Acre" time UI kit — port of `src/ui/time-hud.ts`.
## A leafy double panel with a sky window (time of day / weather), weekday + season day,
## a 12-hour clock and a round weather badge. Click it to switch hemisphere.
##
## Textures live in `res://assets/sprites/` (time_panel, sky_*, badge_*) and are
## pre-scaled to their on-screen size (65 % of the kit), so they are drawn 1:1.
## Font: a rounded system font (Arial Rounded MT Bold on macOS). Optional: drop
## `PixelifySans.ttf` into `res://assets/fonts/` to use that instead.

const PANEL_SIZE := Vector2(316.0, 203.0)
const SKY_POS := Vector2(52.0, 34.0)
const SKY_SIZE := Vector2(53.0, 53.0)
const DATE_CX := 189.0
const DATE_TOP := 33.0
const DATE_BOTTOM := 94.0
const TIME_CENTER := Vector2(139.0, 142.0)
const BADGE_CENTER := Vector2(267.0, 140.0)
const BADGE_SIZE := 47.0

const INK := Color("#5b3a29")
const INK_SOFT := Color("#7a5238")

const FONT_PATH := "res://assets/fonts/PixelifySans.ttf"

const WEATHER_LABEL := {
	"sunny": "Sunny", "cloudy": "Cloudy", "rainy": "Rain",
	"windy": "Windy", "snowy": "Snow", "rainbow": "Rainbow",
}

var margin: float = 16.0
var _font: Font = null

func bounds() -> Rect2:
	return Rect2(1920.0 - PANEL_SIZE.x - margin, margin - 6.0, PANEL_SIZE.x, PANEL_SIZE.y)

func is_hovered(mx: float, my: float) -> bool:
	var b := bounds()
	return mx >= b.position.x + 40.0 and mx <= b.end.x - 24.0 and my >= b.position.y + 24.0 and my <= b.end.y - 32.0

## Returns true when the click landed on the clock (and toggled the hemisphere).
func handle_click(mx: float, my: float) -> bool:
	if not is_hovered(mx, my):
		return false
	RealCalendar.toggle_hemisphere()
	return true

func render(canvas: CanvasItem, d: DrawSurface, mx: float, my: float) -> void:
	var weather: String = weather_for(RealCalendar.date_key, RealCalendar.season)
	var o := bounds().position
	var hour: float = RealCalendar.hour_f

	_draw_tex(canvas, "time_panel", o)
	_draw_tex(canvas, "sky_%s" % sky_for(hour, weather), o + SKY_POS)
	_draw_tex(canvas, "badge_%s" % badge_for(hour, weather), o + BADGE_CENTER - Vector2(BADGE_SIZE, BADGE_SIZE) * 0.5)

	# Weekday + day of season
	var date_mid := (DATE_TOP + DATE_BOTTOM) * 0.5
	_text(canvas, RealCalendar.weekday_str, o.x + DATE_CX, o.y + date_mid - 10.0, 27, INK, "center")
	_text(canvas, "%s · Day %d" % [RealCalendar.season, RealCalendar.day_of_season], o.x + DATE_CX, o.y + date_mid + 14.0, 12, INK_SOFT, "center")

	# 12-hour clock: big digits + small AM/PM, centred together
	var font := _get_font()
	var big_w := font.get_string_size(RealCalendar.clock_str, HORIZONTAL_ALIGNMENT_LEFT, -1, 29).x
	var small_w := font.get_string_size(RealCalendar.meridiem, HORIZONTAL_ALIGNMENT_LEFT, -1, 17).x
	var gap := 5.0
	var left := o.x + TIME_CENTER.x - (big_w + gap + small_w) * 0.5
	_text(canvas, RealCalendar.clock_str, left, o.y + TIME_CENTER.y, 29, INK, "left")
	_text(canvas, RealCalendar.meridiem, left + big_w + gap, o.y + TIME_CENTER.y + 2.0, 17, INK, "left")

	if is_hovered(mx, my):
		_render_tooltip(d, weather)

func _render_tooltip(d: DrawSurface, weather: String) -> void:
	var lines: Array[String] = [
		"%s · %s" % [RealCalendar.date_str, RealCalendar.phase],
		"Weather: %s" % WEATHER_LABEL.get(weather, "Sunny"),
		"%s hemisphere · click to switch" % RealCalendar.hemisphere(),
	]
	var w := 0.0
	for line in lines:
		w = maxf(w, DrawSurface.measure_text(line, 14))
	w += 28.0
	var h := float(lines.size()) * 20.0 + 18.0
	var b := bounds()
	var tx := b.end.x - w - 20.0
	var ty := b.end.y - 24.0
	d.draw_round_rect(tx + 2.0, ty + 3.0, w, h, 10.0, {"fill": "#17130f", "alpha": 0.25})
	d.draw_round_rect(tx, ty, w, h, 10.0, {"fill": "#f7e3c1", "stroke": "#8a5a36", "lineWidth": 2.0})
	for i in range(lines.size()):
		d.draw_text_styled(lines[i], tx + 14.0, ty + 19.0 + float(i) * 20.0, {"size": 14, "fill": "#5b3a29", "align": "left", "baseline": "middle"})

func _draw_tex(canvas: CanvasItem, key: String, pos: Vector2) -> void:
	var tex: Texture2D = AssetRegistry.get_tex(key)
	if tex != null:
		canvas.draw_texture(tex, Vector2(roundf(pos.x), roundf(pos.y)))

func _get_font() -> Font:
	if _font != null:
		return _font
	if ResourceLoader.exists(FONT_PATH):
		var loaded: Font = load(FONT_PATH) as Font
		if loaded != null:
			var pixel := FontVariation.new()
			pixel.base_font = loaded
			pixel.variation_opentype = {"wght": 700}
			_font = pixel
			return _font
	var rounded := SystemFont.new()
	rounded.font_names = PackedStringArray(["Arial Rounded MT Bold", "Avenir Next Rounded", "Nunito", "Avenir Next", "Helvetica Neue", "Arial"])
	rounded.font_weight = 700
	rounded.antialiasing = TextServer.FONT_ANTIALIASING_GRAY
	_font = rounded
	return _font

func _text(canvas: CanvasItem, text: String, x: float, y: float, size: int, color: Color, align: String) -> void:
	var font := _get_font()
	var w := font.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x
	var dx := x
	if align == "center":
		dx -= w * 0.5
	elif align == "right":
		dx -= w
	var dy := y + (font.get_ascent(size) - font.get_descent(size)) * 0.5
	var pos := Vector2(roundf(dx), roundf(dy))
	canvas.draw_string(font, pos, text, HORIZONTAL_ALIGNMENT_LEFT, -1, size, color)

# ---------------------------------------------------------------------------
# Weather + icon choice (same rules and same hash as the web version, so both
# versions show the same weather on the same day).

static func _hash01(text: String) -> float:
	var h: int = 2166136261
	for i in range(text.length()):
		h = h ^ text.unicode_at(i)
		h = (h * 16777619) & 0xFFFFFFFF
	return float(h) / 4294967296.0

## Cozy, purely cosmetic daily weather rolled once per local date.
static func weather_for(date_key: String, season: String) -> String:
	var roll := _hash01("%s|%s" % [date_key, season])
	var table: Array = []
	match season:
		"Summer":
			table = [["sunny", 0.62], ["cloudy", 0.14], ["rainy", 0.10], ["windy", 0.06], ["rainbow", 0.08]]
		"Autumn":
			table = [["sunny", 0.32], ["cloudy", 0.26], ["rainy", 0.22], ["windy", 0.16], ["rainbow", 0.04]]
		"Winter":
			table = [["sunny", 0.26], ["cloudy", 0.26], ["snowy", 0.38], ["windy", 0.10]]
		_:
			table = [["sunny", 0.40], ["cloudy", 0.20], ["rainy", 0.22], ["windy", 0.08], ["rainbow", 0.10]]
	var acc := 0.0
	for entry in table:
		acc += float(entry[1])
		if roll < acc:
			return str(entry[0])
	return "sunny"

static func _is_night(hour: float) -> bool:
	return hour < 5.0 or hour >= 20.0

## Square sky window: time of day, replaced by a weather sky when it rains, snows or is overcast.
static func sky_for(hour: float, weather: String) -> String:
	if not _is_night(hour):
		if weather == "rainy":
			return "rain"
		if weather == "snowy":
			return "snow"
		if weather == "cloudy":
			return "clouds"
	if hour < 5.0:
		return "stars"
	if hour < 8.0:
		return "morning"
	if hour < 16.0:
		return "noon"
	if hour < 20.0:
		return "evening"
	return "moon"

## Round badge: the day's weather, or the sun's position on clear days, moon at night.
static func badge_for(hour: float, weather: String) -> String:
	if weather == "rainy":
		return "rain"
	if weather == "snowy":
		return "snow"
	if weather == "cloudy":
		return "cloud"
	if _is_night(hour):
		return "moon_stars" if hour < 5.0 else "moon"
	if weather == "windy":
		return "wind"
	if weather == "rainbow":
		return "rainbow"
	if hour < 8.0:
		return "sunrise"
	if hour < 11.0:
		return "sun"
	if hour < 17.0:
		return "daylight"
	return "sunset"
