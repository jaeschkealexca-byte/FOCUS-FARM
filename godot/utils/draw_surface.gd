class_name DrawSurface
extends RefCounted
## Lightweight Canvas2D-style drawing helper wrapping any Godot CanvasItem.
## Makes porting HTML5 Canvas drawing code (drawRect, drawRoundRect, drawCircle,
## drawEllipse, drawPolygon, drawText, drawImage) 1-to-1 in Godot 4.

var canvas: CanvasItem
var offset_x: float = 0.0
var offset_y: float = 0.0
var scale_factor: float = 1.0

func _init(p_canvas: CanvasItem, p_offset_x: float = 0.0, p_offset_y: float = 0.0, p_scale: float = 1.0) -> void:
	canvas = p_canvas
	offset_x = p_offset_x
	offset_y = p_offset_y
	scale_factor = p_scale

func tx(x: float) -> float:
	return offset_x + x * scale_factor

func ty(y: float) -> float:
	return offset_y + y * scale_factor

func ts(v: float) -> float:
	return v * scale_factor

static func parse_color(hex_or_color: Variant, alpha_override: float = 1.0) -> Color:
	var c: Color = Color.WHITE
	if hex_or_color is Color:
		c = hex_or_color as Color
	elif hex_or_color is String:
		var str_val: String = hex_or_color as String
		if not str_val.is_empty():
			if str_val.begins_with("rgba("):
				var inner: PackedStringArray = str_val.trim_prefix("rgba(").trim_suffix(")").split(",")
				if inner.size() >= 4:
					c = Color(
						float(inner[0]) / 255.0,
						float(inner[1]) / 255.0,
						float(inner[2]) / 255.0,
						float(inner[3])
					)
			else:
				c = Color.html(str_val)
	c.a *= alpha_override
	return c

func draw_rect_styled(x: float, y: float, w: float, h: float, style: Dictionary = {}) -> void:
	var rect: Rect2 = Rect2(tx(x), ty(y), ts(w), ts(h))
	var alpha: float = float(style.get("alpha", 1.0))
	if style.has("fill") and str(style["fill"]) != "":
		canvas.draw_rect(rect, parse_color(style["fill"], alpha), true)
	if style.has("stroke") and str(style["stroke"]) != "":
		var lw: float = maxf(1.0, ts(float(style.get("lineWidth", 1.0))))
		canvas.draw_rect(rect, parse_color(style["stroke"], alpha), false, lw)

func draw_round_rect(x: float, y: float, w: float, h: float, radius: float, style: Dictionary = {}) -> void:
	var sb: StyleBoxFlat = StyleBoxFlat.new()
	var r: int = int(roundf(ts(radius)))
	sb.corner_radius_top_left = r
	sb.corner_radius_top_right = r
	sb.corner_radius_bottom_left = r
	sb.corner_radius_bottom_right = r

	var alpha: float = float(style.get("alpha", 1.0))
	if style.has("fill") and str(style["fill"]) != "":
		sb.bg_color = parse_color(style["fill"], alpha)
	else:
		sb.bg_color = Color(0, 0, 0, 0)

	if style.has("stroke") and str(style["stroke"]) != "":
		var lw: int = int(maxf(1.0, roundf(ts(float(style.get("lineWidth", 1.0))))))
		sb.border_width_left = lw
		sb.border_width_top = lw
		sb.border_width_right = lw
		sb.border_width_bottom = lw
		sb.border_color = parse_color(style["stroke"], alpha)

	canvas.draw_style_box(sb, Rect2(tx(x), ty(y), ts(w), ts(h)))

func draw_circle_styled(cx: float, cy: float, radius: float, style: Dictionary = {}) -> void:
	var center: Vector2 = Vector2(tx(cx), ty(cy))
	var r: float = ts(radius)
	var alpha: float = float(style.get("alpha", 1.0))
	if style.has("fill") and str(style["fill"]) != "":
		canvas.draw_circle(center, r, parse_color(style["fill"], alpha))
	if style.has("stroke") and str(style["stroke"]) != "":
		var lw: float = maxf(1.0, ts(float(style.get("lineWidth", 1.0))))
		canvas.draw_arc(center, r, 0.0, TAU, 32, parse_color(style["stroke"], alpha), lw)

func draw_ellipse_styled(cx: float, cy: float, rx: float, ry: float, style: Dictionary = {}) -> void:
	if rx <= 0.0 or ry <= 0.0:
		return
	var pts: PackedVector2Array = PackedVector2Array()
	var segments: int = 24
	for i in range(segments + 1):
		var angle: float = TAU * float(i) / float(segments)
		pts.append(Vector2(tx(cx + cos(angle) * rx), ty(cy + sin(angle) * ry)))
	var alpha: float = float(style.get("alpha", 1.0))
	if style.has("fill") and str(style["fill"]) != "":
		canvas.draw_colored_polygon(pts, parse_color(style["fill"], alpha))
	if style.has("stroke") and str(style["stroke"]) != "":
		var lw: float = maxf(1.0, ts(float(style.get("lineWidth", 1.0))))
		canvas.draw_polyline(pts, parse_color(style["stroke"], alpha), lw)

func draw_line_styled(x1: float, y1: float, x2: float, y2: float, style: Dictionary = {}) -> void:
	var alpha: float = float(style.get("alpha", 1.0))
	var color: Color = parse_color(style.get("stroke", style.get("fill", "#ffffff")), alpha)
	var lw: float = maxf(1.0, ts(float(style.get("lineWidth", 1.0))))
	canvas.draw_line(Vector2(tx(x1), ty(y1)), Vector2(tx(x2), ty(y2)), color, lw)

func draw_polygon_styled(points: Array, style: Dictionary = {}) -> void:
	if points.size() < 3:
		return
	var poly: PackedVector2Array = PackedVector2Array()
	for pt in points:
		if pt is Vector2:
			var v: Vector2 = pt as Vector2
			poly.append(Vector2(tx(v.x), ty(v.y)))
		elif pt is Dictionary:
			var d_pt: Dictionary = pt as Dictionary
			poly.append(Vector2(tx(float(d_pt.get("x", 0.0))), ty(float(d_pt.get("y", 0.0)))))
	var alpha: float = float(style.get("alpha", 1.0))
	if style.has("fill") and str(style["fill"]) != "":
		canvas.draw_colored_polygon(poly, parse_color(style["fill"], alpha))
	if style.has("stroke") and str(style["stroke"]) != "":
		poly.append(poly[0])
		var lw: float = maxf(1.0, ts(float(style.get("lineWidth", 1.0))))
		canvas.draw_polyline(poly, parse_color(style["stroke"], alpha), lw)

func draw_text_styled(text: String, x: float, y: float, style: Dictionary = {}) -> void:
	var font: Font = ThemeDB.fallback_font
	var font_size: int = int(maxf(8.0, roundf(ts(float(style.get("size", 14))))))
	var alpha: float = float(style.get("alpha", 1.0))
	var color: Color = parse_color(style.get("fill", "#fff8e7"), alpha)
	var align_str: String = str(style.get("align", "left"))
	var baseline_str: String = str(style.get("baseline", "middle"))

	var text_size: Vector2 = font.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size)
	var draw_x: float = tx(x)
	if align_str == "center":
		draw_x -= text_size.x * 0.5
	elif align_str == "right":
		draw_x -= text_size.x

	var ascent: float = font.get_ascent(font_size)
	var descent: float = font.get_descent(font_size)
	var draw_y: float = ty(y)
	if baseline_str == "top":
		draw_y += ascent
	elif baseline_str == "middle":
		draw_y += (ascent - descent) * 0.5
	elif baseline_str == "bottom":
		draw_y -= descent

	canvas.draw_string(font, Vector2(roundf(draw_x), roundf(draw_y)), text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size, color)

static func measure_text(text: String, font_size: int = 14) -> float:
	var font: Font = ThemeDB.fallback_font
	return font.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, font_size).x

func draw_texture_at(tex: Texture2D, x: float, y: float, w: float, h: float, alpha: float = 1.0) -> void:
	if tex == null:
		return
	canvas.draw_texture_rect(tex, Rect2(tx(x), ty(y), ts(w), ts(h)), false, Color(1, 1, 1, alpha))
