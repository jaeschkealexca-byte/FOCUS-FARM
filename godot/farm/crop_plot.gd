class_name CropPlotData
extends RefCounted
## Port of `src/farm/crop-plot.ts` — manages a single 64×64 farm tile's soil,
## planted crop, water state, growth progress, and multi-stage sprite/procedural rendering.

var tilled: bool = false
var planted: bool = false
var crop_id: Variant = null
var watered: bool = false
var growth: float = 0.0
var preview_growth: Variant = null

const STAGE_ASSETS := {
	"carrot": ["carrot_s1", "carrot_s2", "carrot_s2", "carrot_s3"],
	"potato": ["potato_s1", "potato_s2", "potato_s3", "potato_s4_1"],
	"strawberry": ["strawberries_s1", "strawberries_s2", "strawberries_s3", "strawberries_s4"],
	"cauliflower": ["cauliflower_s1", "cauliflower_s2", "cauliflower_s3", "cauliflower_s4"],
	"garlic": ["garlic_1_1", "garlic_s2", "garlic_s3", "garlic_s3"],
	"rhubarb": ["rhubarb_s1", "rhubarb_s2", "rhubarb_s3", "rhubarb_s3"],
	"tomato": ["tomato_s1", "tomato_s2", "tomato_s3", "tomato_s4"],
	"blueberry": ["blueberry_s1", "blueberry_s2", "blueberry_s3", "blueberry_s4"],
	"corn": ["corn_s1", "corn_s2", "corn_s3", "corn_s4"],
	"melon": ["melon_s1", "melon_s2", "melon_s3", "melon_s4"],
	"pumpkin": ["pumpkin_s1", "pumpkin_s2", "pumpkin_s3", "pumpkin_s4"],
	"cranberry": ["cranberry_s1", "cranberry_2", "cranberry_s3", "cranberry_s4"],
	"beet": ["beet_s1", "beet_s2", "beet_s3", "beet_s4"],
	"broccoli": ["broccoli_s1", "broccoli_s2", "broccoli_s3", "broccoli_s4"],
	"parsnip": ["parsnip_s1", "parsnip_s2", "parsnip_s3", "parsnip_s4"],
	"leek": ["leek_s1", "leek_s2", "leek_s3", "leek_s4"],
	"spinach": ["spinach_s1", "spinach_s2", "spinach_s3", "spinach_s4"],
	"kale": ["kale_s1", "kale_s2", "kale_s3", "kale_s4"],
	"radish": ["radish_s1", "radish_s2", "radish_s3", "radish_s4"],
	"grape": ["grape_s1", "grape_s2", "grape_s3", "grape_s4"],
	"eggplant": ["eggplant_s1", "eggplant_s2", "eggplant_s3", "eggplant_s4"],
}

func crop_def() -> Dictionary:
	return CropDatabase.get_crop_def(crop_id)

func mature() -> bool:
	if not planted:
		return false
	return growth >= float(crop_def()["growthMinutes"])

func growth_percent() -> int:
	if not planted:
		return 0
	return mini(100, int(floor((growth / float(crop_def()["growthMinutes"])) * 100.0)))

func render_base(d: DrawSurface, x: float, y: float, grid_x: int, grid_y: int) -> void:
	var palette := RealCalendar.palette()
	var season := RealCalendar.season
	var shade := (grid_x * 7 + grid_y * 3) % 4

	var grass_tex: Texture2D = AssetRegistry.get_tex("grass_tile_1")
	if grass_tex != null:
		d.draw_texture_at(grass_tex, x, y, 64.0, 64.0)
	else:
		var grass_colors: Array = palette["grass"] as Array
		d.draw_rect_styled(x, y, 64.0, 64.0, {"fill": grass_colors[shade]})
		d.draw_rect_styled(x, y + 63.0, 64.0, 1.0, {"fill": palette["edge"]})

	if not tilled:
		var px := x + 9.0 + float((grid_x * 13 + grid_y * 9) % 39)
		var py := y + 10.0 + float((grid_y * 17 + grid_x * 3) % 36)
		d.draw_rect_styled(px, py, 3.0, 7.0, {"fill": palette["detail"]})
		d.draw_rect_styled(px + 4.0, py - 3.0, 3.0, 8.0, {"fill": palette["edge"]})
		if season == "Spring" and shade == 0:
			d.draw_rect_styled(px - 3.0, py - 4.0, 9.0, 5.0, {"fill": palette["flower"]})
			d.draw_rect_styled(px, py - 5.0, 3.0, 3.0, {"fill": "#fff0c6"})
		elif season == "Autumn":
			d.draw_rect_styled(px + 12.0, py + 7.0, 8.0, 4.0, {"fill": "#d58554" if shade % 2 != 0 else "#e6ba69"})
		elif season == "Winter":
			d.draw_line_styled(px - 4.0, py + 1.0, px + 8.0, py + 1.0, {"stroke": "#ffffff", "lineWidth": 2.0})
		return

	var soil_tex := AssetRegistry.get_tex("soil_tile_2" if watered else "soil_tile_1")
	if soil_tex != null:
		d.draw_texture_at(soil_tex, x, y, 64.0, 64.0)
	else:
		d.draw_round_rect(x + 3.0, y + 3.0, 58.0, 58.0, 7.0, {"fill": "#655345" if watered else "#98704f"})
		for i in range(3):
			d.draw_line_styled(
				x + 10.0, y + 15.0 + float(i) * 16.0,
				x + 54.0, y + 15.0 + float(i) * 16.0,
				{"stroke": "#7a6854" if watered else "#ae845c", "lineWidth": 3.0}
			)

	if season == "Winter":
		d.draw_rect_styled(x + 5.0, y + 4.0, 54.0, 5.0, {"fill": "#edf4fa"})

func render_crop_overlay(d: DrawSurface, x: float, y: float) -> void:
	if not planted:
		return
	var def := crop_def()
	var id := str(def["id"])
	var vis_growth: float = float(preview_growth) if preview_growth != null else growth
	var ratio := minf(1.0, vis_growth / float(def["growthMinutes"]))
	var stage: int = 0
	if id == "strawberry" or id == "cauliflower":
		stage = 3 if (mature() or ratio >= 1.0) else (0 if ratio < 0.33 else (1 if ratio < 0.66 else 2))
	else:
		stage = 3 if ratio >= 1.0 else (2 if ratio >= 0.6 else (1 if ratio >= 0.25 else 0))

	var cx := x + 32.0
	var cy := y + 30.0
	var drew_sprite := false

	if STAGE_ASSETS.has(id):
		var keys: Array = STAGE_ASSETS[id] as Array
		var asset_key: String = str(keys[clampi(stage, 0, keys.size() - 1)])
		var tex: Texture2D = AssetRegistry.get_tex(asset_key)
		if tex != null:
			var sz: Vector2 = AssetRegistry.get_size(asset_key)
			var max_heights: Array[float] = [24.0, 34.0, 48.0, 58.0]
			var target_h: float = max_heights[clampi(stage, 0, 3)]
			var sc: float = minf(56.0 / maxf(1.0, sz.x), target_h / maxf(1.0, sz.y))
			var draw_w: float = sz.x * sc
			var draw_h: float = sz.y * sc
			d.draw_texture_at(tex, cx - draw_w * 0.5, y + 56.0 - draw_h, draw_w, draw_h)
			drew_sprite = true

	if not drew_sprite:
		_render_procedural_stage(d, cx, cy, def, stage)

	if watered:
		d.draw_circle_styled(x + 53.0, y + 53.0, 4.0, {"fill": "#93cdd0"})
		d.draw_circle_styled(x + 52.0, y + 52.0, 1.5, {"fill": "#ffffff"})

	var is_mature_vis: bool = (float(preview_growth) >= float(def["growthMinutes"])) if preview_growth != null else mature()
	if is_mature_vis:
		var pulse := (sin(float(Time.get_ticks_msec()) / 250.0) + 1.0) * 0.5
		d.draw_circle_styled(x + 48.0, y + 14.0, 2.0 + pulse * 1.5, {"fill": "#fff5b0"})
		d.draw_circle_styled(x + 16.0, y + 46.0, 1.5 + (1.0 - pulse) * 1.5, {"fill": "#ffffff"})

func _render_procedural_stage(d: DrawSurface, cx: float, cy: float, def: Dictionary, stage: int) -> void:
	var foliage := str(def.get("foliageColor", "#4f7937"))
	var primary := str(def.get("primaryColor", "#f17726"))
	if stage == 0:
		d.draw_round_rect(cx - 5.0, cy + 6.0, 10.0, 6.0, 2.0, {"fill": "#835f3d"})
		d.draw_line_styled(cx, cy + 6.0, cx, cy - 2.0, {"stroke": "#70a845", "lineWidth": 2.0})
		d.draw_circle_styled(cx - 3.0, cy - 2.0, 2.5, {"fill": "#8cd357"})
		d.draw_circle_styled(cx + 3.0, cy - 2.0, 2.5, {"fill": "#8cd357"})
		return
	if stage == 1:
		d.draw_line_styled(cx, cy + 8.0, cx, cy - 4.0, {"stroke": "#568b36", "lineWidth": 2.5})
		d.draw_ellipse_styled(cx - 6.0, cy - 2.0, 5.0, 8.0, {"fill": foliage})
		d.draw_ellipse_styled(cx + 6.0, cy - 2.0, 5.0, 8.0, {"fill": foliage})
		d.draw_circle_styled(cx, cy - 7.0, 5.0, {"fill": "#8cd357"})
		return
	if stage == 2:
		d.draw_ellipse_styled(cx - 8.0, cy + 2.0, 7.0, 9.0, {"fill": foliage})
		d.draw_ellipse_styled(cx + 8.0, cy + 2.0, 7.0, 9.0, {"fill": foliage})
		d.draw_ellipse_styled(cx, cy - 6.0, 9.0, 6.0, {"fill": foliage})
		d.draw_circle_styled(cx, cy + 2.0, 6.0, {"fill": primary, "alpha": 0.85})
		return
	CropDatabase.draw_crop_emblem(d, def, cx, cy)
