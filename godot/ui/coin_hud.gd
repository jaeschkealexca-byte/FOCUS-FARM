extends RefCounted
## Gold coin HUD (leafy wooden bar with a gold coin) shown right below the corner clock.
## The bar grows to the left when the balance needs more room: the texture is drawn as
## three slices — coin cap (fixed), middle bar (stretched) and flower cap (fixed).
## Clicking it opens the Seed Shop.
##
## Texture: `res://assets/sprites/coin_panel.png` (247 × 72, pre-scaled to on-screen size).

const TEX_KEY := "coin_panel"
const TEX_SIZE := Vector2(247.0, 72.0)
const LEFT_CAP := 101.0          # coin + frame, never stretched
const RIGHT_CAP_START := 202.0   # flowers + bar end, never stretched
const BAR_TEXT_LEFT := 81.0      # first pixel of the beige bar (inside the frame)
const BAR_TEXT_RIGHT_IN_CAP := 22.0  # usable beige bar inside the right cap
const BAR_CENTER_Y := 40.0
const MIN_MIDDLE := 20.0
const PADDING := 12.0
const FONT_SIZE := 20
const INK := Color("#5b3a29")

## Right edge and top of the panel, set by main.gd so it sits under the clock.
var right_x: float = 1904.0
var top_y: float = 200.0
var _font: Font = null

func _get_font() -> Font:
	if _font != null:
		return _font
	var rounded := SystemFont.new()
	rounded.font_names = PackedStringArray(["Arial Rounded MT Bold", "Avenir Next Rounded", "Nunito", "Avenir Next", "Helvetica Neue", "Arial"])
	rounded.font_weight = 700
	rounded.antialiasing = TextServer.FONT_ANTIALIASING_GRAY
	_font = rounded
	return _font

static func format_coins(amount: int) -> String:
	var digits := str(absi(amount))
	var out := ""
	var count := 0
	for i in range(digits.length() - 1, -1, -1):
		out = digits[i] + out
		count += 1
		if count % 3 == 0 and i > 0:
			out = "," + out
	return ("-" if amount < 0 else "") + out

func _middle_width(text: String) -> float:
	var text_w := _get_font().get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, FONT_SIZE).x
	# Room for the text inside the bar: from BAR_TEXT_LEFT to the bar's end in the right cap.
	var needed := PADDING + text_w + PADDING
	var available_without_middle := (LEFT_CAP - BAR_TEXT_LEFT) + BAR_TEXT_RIGHT_IN_CAP
	return maxf(MIN_MIDDLE, needed - available_without_middle)

func bounds(amount: int) -> Rect2:
	var middle := _middle_width(format_coins(amount))
	var w := LEFT_CAP + middle + (TEX_SIZE.x - RIGHT_CAP_START)
	return Rect2(right_x - w, top_y, w, TEX_SIZE.y)

func is_hovered(amount: int, mx: float, my: float) -> bool:
	var b := bounds(amount)
	# Only the coin + bar, not the leaves sticking out.
	return mx >= b.position.x + 7.0 and mx <= b.end.x - 12.0 and my >= b.position.y + 12.0 and my <= b.end.y - 8.0

func render(canvas: CanvasItem, amount: int, mx: float, my: float) -> void:
	var tex: Texture2D = AssetRegistry.get_tex(TEX_KEY)
	var text := format_coins(amount)
	var b := bounds(amount)
	var x := roundf(b.position.x)
	var y := roundf(b.position.y)
	var middle := b.size.x - LEFT_CAP - (TEX_SIZE.x - RIGHT_CAP_START)
	var right_w := TEX_SIZE.x - RIGHT_CAP_START
	var src_mid_w := RIGHT_CAP_START - LEFT_CAP

	if tex != null:
		canvas.draw_texture_rect_region(tex, Rect2(x, y, LEFT_CAP, TEX_SIZE.y), Rect2(0.0, 0.0, LEFT_CAP, TEX_SIZE.y))
		canvas.draw_texture_rect_region(tex, Rect2(x + LEFT_CAP, y, middle, TEX_SIZE.y), Rect2(LEFT_CAP, 0.0, src_mid_w, TEX_SIZE.y))
		canvas.draw_texture_rect_region(tex, Rect2(x + LEFT_CAP + middle, y, right_w, TEX_SIZE.y), Rect2(RIGHT_CAP_START, 0.0, right_w, TEX_SIZE.y))

	# Balance, centred in the beige bar
	var font := _get_font()
	var text_w := font.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, FONT_SIZE).x
	var bar_left := x + BAR_TEXT_LEFT
	var bar_right := x + LEFT_CAP + middle + BAR_TEXT_RIGHT_IN_CAP
	var tx := roundf((bar_left + bar_right - text_w) * 0.5)
	var ty := roundf(y + BAR_CENTER_Y + (font.get_ascent(FONT_SIZE) - font.get_descent(FONT_SIZE)) * 0.5)
	canvas.draw_string(font, Vector2(tx, ty), text, HORIZONTAL_ALIGNMENT_LEFT, -1, FONT_SIZE, INK)

