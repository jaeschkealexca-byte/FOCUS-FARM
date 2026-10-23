extends Node
## CropDatabase Autoload — Complete port of `src/farm/crops.ts`, including all
## 25 crop definitions, seasonal shop filtering, growth time formatting, and
## procedural seed packet & crop emblem vector drawing.

var crops: Dictionary = {}
var crop_list: Array[Dictionary] = []

const SHOP_ARTWORK_KEYS := {
	"carrot_1": true, "potatoe_1": true, "couliflower_1": true, "strawberry_1": true,
	"garlic_1": true, "kale_redesign_1": true, "rhubarb_1": true,
	"tomato_1": true, "corn_1": true, "bok_choy_1": true, "brocolli_1": true,
	"melon_1": true, "red_cabbage_1": true, "blueberry_1": true,
	"cranberrie_1": true, "beet_1": true, "eggplant_1_1": true, "grape_1": true, "pumpkin_1": true,
	"leek_1": true, "parsnip_1": true, "radish_1": true, "spinach": true,
}

func _ready() -> void:
	_init_crops()

func _init_crops() -> void:
	var defs: Array[Dictionary] = [
		{
			"id": "cabbage", "name": "Cabbage", "seedName": "Cabbage Seeds", "season": "Spring",
			"buyPrice": 20, "sellPrice": 45, "growthMinutes": 1.0 / 6.0,
			"seasonIcon": "🌸", "seasonColor": "#b85d85",
			"description": "Crisp and leafy. A hardy spring staple that grows into dense, ruffled heads.",
			"primaryColor": "#72ba59", "accentColor": "#9edb84", "foliageColor": "#53913d",
		},
		{
			"id": "garlic", "name": "Garlic", "seedName": "Garlic Seeds", "season": "Spring",
			"buyPrice": 20, "sellPrice": 50, "growthMinutes": 1.0 / 6.0,
			"seasonIcon": "🌸", "seasonColor": "#b85d85",
			"description": "A fragrant spring allium with papery white bulbs and fresh green shoots.",
			"primaryColor": "#eee8d5", "accentColor": "#fffaf0", "foliageColor": "#71964b",
			"staticAssetKey": "garlic_1", "harvestAssetKey": "garlic_2",
		},
		{
			"id": "kale", "name": "Kale", "seedName": "Kale Seeds", "season": "Spring",
			"buyPrice": 25, "sellPrice": 60, "growthMinutes": 1.0 / 6.0,
			"seasonIcon": "🌸", "seasonColor": "#b85d85",
			"description": "Hardy leafy greens with deep green, ruffled leaves.",
			"primaryColor": "#3f7a43", "accentColor": "#73a85e", "foliageColor": "#2c6038",
			"staticAssetKey": "kale_redesign_1", "harvestAssetKey": "kale_s2_1",
		},
		{
			"id": "rhubarb", "name": "Rhubarb", "seedName": "Rhubarb Seeds", "season": "Spring",
			"buyPrice": 30, "sellPrice": 70, "growthMinutes": 1.0 / 6.0,
			"seasonIcon": "🌸", "seasonColor": "#b85d85",
			"description": "Tart spring stalks with broad, leafy tops.",
			"primaryColor": "#bd435a", "accentColor": "#e58475", "foliageColor": "#53804b",
			"staticAssetKey": "rhubarb_1", "harvestAssetKey": "rhubarb_2",
		},
		{
			"id": "carrot", "name": "Carrot", "seedName": "Carrot Seeds", "season": "Spring",
			"buyPrice": 15, "sellPrice": 35, "growthMinutes": 1.0 / 6.0,
			"seasonIcon": "🌸", "seasonColor": "#b85d85",
			"description": "Sweet, crunchy orange roots. Quick to grow with delicate feathery greens.",
			"primaryColor": "#f17726", "accentColor": "#ffa05c", "foliageColor": "#4f9b3c",
			"staticAssetKey": "carrot_1", "harvestAssetKey": "carrot_2",
		},
		{
			"id": "potato", "name": "Potato", "seedName": "Potato Seeds", "season": "Spring",
			"buyPrice": 20, "sellPrice": 50, "growthMinutes": 1.0 / 6.0,
			"seasonIcon": "🌸", "seasonColor": "#b85d85",
			"description": "Hearty golden tubers resting safely underground in loose farm soil.",
			"primaryColor": "#cca064", "accentColor": "#ebd09e", "foliageColor": "#5c8a42",
			"staticAssetKey": "potatoe_1", "harvestAssetKey": "potato_2",
		},
		{
			"id": "strawberry", "name": "Strawberry", "seedName": "Strawberry Seeds", "season": "Spring",
			"buyPrice": 30, "sellPrice": 70, "growthMinutes": 1.0 / 6.0,
			"seasonIcon": "🌸", "seasonColor": "#b85d85",
			"description": "Juicy, fragrant ruby berries adored by farm visitors and town markets.",
			"primaryColor": "#e63946", "accentColor": "#ff7582", "foliageColor": "#387b32",
			"staticAssetKey": "strawberry_1", "harvestAssetKey": "strawberry_2",
		},
		{
			"id": "cauliflower", "name": "Cauliflower", "seedName": "Cauliflower Seeds", "season": "Spring",
			"buyPrice": 35, "sellPrice": 85, "growthMinutes": 1.0 / 6.0,
			"seasonIcon": "🌸", "seasonColor": "#b85d85",
			"description": "Delicate creamy white curds surrounded by a protective crown of broad leaves.",
			"primaryColor": "#f5edd4", "accentColor": "#ffffff", "foliageColor": "#52834b",
			"staticAssetKey": "couliflower_1", "harvestAssetKey": "cauliflower_2",
		},
		{
			"id": "tomato", "name": "Tomato", "seedName": "Tomato Seeds", "season": "Summer",
			"buyPrice": 25, "sellPrice": 55, "growthMinutes": 1.0 / 6.0,
			"seasonIcon": "🌻", "seasonColor": "#c98a1a",
			"description": "Plump sun-warmed red fruit growing in heavy clusters along lush vines.",
			"primaryColor": "#e03030", "accentColor": "#ff6b6b", "foliageColor": "#3c7e33",
			"staticAssetKey": "tomato_1", "harvestAssetKey": "tomato_2",
		},
		{
			"id": "corn", "name": "Corn", "seedName": "Corn Seeds", "season": "Summer",
			"buyPrice": 30, "sellPrice": 75, "growthMinutes": 1.0 / 6.0,
			"seasonIcon": "🌻", "seasonColor": "#c98a1a",
			"description": "Tall golden stalks carrying sweet ears wrapped in tender green husks.",
			"primaryColor": "#f4c430", "accentColor": "#ffe57f", "foliageColor": "#558b2f",
			"staticAssetKey": "corn_1", "harvestAssetKey": "corn_2",
		},
		{
			"id": "bok_choy", "name": "Bok Choy", "seedName": "Bok Choy Seeds", "season": "Summer",
			"buyPrice": 25, "sellPrice": 60, "growthMinutes": 1.0 / 6.0,
			"seasonIcon": "🌻", "seasonColor": "#c98a1a",
			"description": "Tender green leaves with crisp pale stems.",
			"primaryColor": "#79a94b", "accentColor": "#d6e39b", "foliageColor": "#4d7d3e",
			"staticAssetKey": "bok_choy_1",
		},
		{
			"id": "broccoli", "name": "Broccoli", "seedName": "Broccoli Seeds", "season": "Summer",
			"buyPrice": 30, "sellPrice": 75, "growthMinutes": 1.0 / 6.0,
			"seasonIcon": "🌻", "seasonColor": "#c98a1a",
			"description": "A hearty green floret with thick stems.",
			"primaryColor": "#3f874b", "accentColor": "#74b85f", "foliageColor": "#32673b",
			"staticAssetKey": "brocolli_1", "harvestAssetKey": "broccoli_2",
		},
		{
			"id": "melon", "name": "Melon", "seedName": "Melon Seeds", "season": "Summer",
			"buyPrice": 35, "sellPrice": 85, "growthMinutes": 1.0 / 6.0,
			"seasonIcon": "🌻", "seasonColor": "#c98a1a",
			"description": "Sweet, juicy summer melon with a refreshing golden flesh.",
			"primaryColor": "#76a84a", "accentColor": "#e4c85a", "foliageColor": "#4f7937",
			"staticAssetKey": "melon_1", "harvestAssetKey": "melon_2",
		},
		{
			"id": "red_cabbage", "name": "Red Cabbage", "seedName": "Red Cabbage Seeds", "season": "Summer",
			"buyPrice": 30, "sellPrice": 75, "growthMinutes": 1.0 / 6.0,
			"seasonIcon": "🌻", "seasonColor": "#c98a1a",
			"description": "A colorful summer cabbage with crisp, deep red leaves.",
			"primaryColor": "#8e4b83", "accentColor": "#c27eae", "foliageColor": "#477542",
			"staticAssetKey": "red_cabbage_1",
		},
		{
			"id": "blueberry", "name": "Blueberry", "seedName": "Blueberry Seeds", "season": "Summer",
			"buyPrice": 35, "sellPrice": 90, "growthMinutes": 1.0 / 6.0,
			"seasonIcon": "🌻", "seasonColor": "#c98a1a",
			"description": "Clusters of sweet blue summer berries, ready for a sunny harvest.",
			"primaryColor": "#4568aa", "accentColor": "#839fe0", "foliageColor": "#477542",
			"staticAssetKey": "blueberry_1", "harvestAssetKey": "blueberry_2",
		},
		{
			"id": "cranberry", "name": "Cranberry", "seedName": "Cranberry Seeds", "season": "Autumn",
			"buyPrice": 30, "sellPrice": 75, "growthMinutes": 1.0 / 6.0,
			"seasonIcon": "🍁", "seasonColor": "#c26227",
			"description": "Tart red berries ripening in cool autumn weather.",
			"primaryColor": "#a7293d", "accentColor": "#e45b61", "foliageColor": "#4f7937",
			"staticAssetKey": "cranberrie_1", "harvestAssetKey": "cranberry_2_1",
		},
		{
			"id": "beet", "name": "Beet", "seedName": "Beet Seeds", "season": "Autumn",
			"buyPrice": 25, "sellPrice": 60, "growthMinutes": 1.0 / 6.0,
			"seasonIcon": "🍁", "seasonColor": "#c26227",
			"description": "Earthy crimson roots with leafy tops, ready for the autumn harvest.",
			"primaryColor": "#a7293d", "accentColor": "#e45b61", "foliageColor": "#4f7937",
			"staticAssetKey": "beet_1", "harvestAssetKey": "beet_2",
		},
		{
			"id": "eggplant", "name": "Eggplant", "seedName": "Eggplant Seeds", "season": "Autumn",
			"buyPrice": 25, "sellPrice": 60, "growthMinutes": 1.0 / 6.0,
			"seasonIcon": "🍁", "seasonColor": "#c26227",
			"description": "Glossy deep purple aubergines with a velvety texture and rich flavor.",
			"primaryColor": "#6a1b7a", "accentColor": "#9c4d97", "foliageColor": "#436d33",
			"staticAssetKey": "eggplant_1_1", "harvestAssetKey": "eggplant_2",
		},
		{
			"id": "grape", "name": "Grape", "seedName": "Grape Seeds", "season": "Autumn",
			"buyPrice": 35, "sellPrice": 90, "growthMinutes": 1.0 / 6.0,
			"seasonIcon": "🍁", "seasonColor": "#c26227",
			"description": "Juicy clusters of grapes ready for an autumn harvest.",
			"primaryColor": "#6f4794", "accentColor": "#aa79c5", "foliageColor": "#4f7937",
			"staticAssetKey": "grape_1", "harvestAssetKey": "grape_2",
		},
		{
			"id": "pumpkin", "name": "Pumpkin", "seedName": "Pumpkin Seeds", "season": "Autumn",
			"buyPrice": 40, "sellPrice": 100, "growthMinutes": 1.0 / 6.0,
			"seasonIcon": "🍁", "seasonColor": "#c26227",
			"description": "Prized autumn gourds. Takes longer to mature, but fetches a handsome price.",
			"primaryColor": "#e86a17", "accentColor": "#ff9842", "foliageColor": "#4d7832",
			"staticAssetKey": "pumpkin_1", "harvestAssetKey": "pumpkin_2",
		},
		{
			"id": "snow_berry", "name": "Snow Berry", "seedName": "Snow Berry Seeds", "season": "Winter",
			"buyPrice": 25, "sellPrice": 60, "growthMinutes": 1.0 / 6.0,
			"seasonIcon": "❄️", "seasonColor": "#4a8cb8",
			"description": "Enchanted frosted berries that thrive under gentle winter snowfalls.",
			"primaryColor": "#48bfe3", "accentColor": "#a9e8f8", "foliageColor": "#729bb0",
		},
		{
			"id": "leek", "name": "Leek", "seedName": "Leek Seeds", "season": "Winter",
			"buyPrice": 20, "sellPrice": 50, "growthMinutes": 1.0 / 6.0,
			"seasonIcon": "❄️", "seasonColor": "#4a8cb8",
			"description": "Mild winter alliums with tender white stalks and fresh green tops.",
			"primaryColor": "#dce8c1", "accentColor": "#f4f7df", "foliageColor": "#6f9b4f",
			"staticAssetKey": "leek_1", "harvestAssetKey": "leek_2",
		},
		{
			"id": "parsnip", "name": "Parsnip", "seedName": "Parsnip Seeds", "season": "Winter",
			"buyPrice": 20, "sellPrice": 55, "growthMinutes": 1.0 / 6.0,
			"seasonIcon": "❄️", "seasonColor": "#4a8cb8",
			"description": "Sweet, pale roots made richer by cold winter soil.",
			"primaryColor": "#e8d8b4", "accentColor": "#fff0d4", "foliageColor": "#6e9854",
			"staticAssetKey": "parsnip_1", "harvestAssetKey": "parsnip_2",
		},
		{
			"id": "radish", "name": "Radish", "seedName": "Radish Seeds", "season": "Winter",
			"buyPrice": 15, "sellPrice": 40, "growthMinutes": 1.0 / 6.0,
			"seasonIcon": "❄️", "seasonColor": "#4a8cb8",
			"description": "Peppery, crisp roots with bright color and snowy-season greens.",
			"primaryColor": "#d84769", "accentColor": "#f98da3", "foliageColor": "#688e66",
			"staticAssetKey": "radish_1", "harvestAssetKey": "radish_2",
		},
		{
			"id": "spinach", "name": "Spinach", "seedName": "Spinach Seeds", "season": "Winter",
			"buyPrice": 20, "sellPrice": 50, "growthMinutes": 1.0 / 6.0,
			"seasonIcon": "❄️", "seasonColor": "#4a8cb8",
			"description": "Nutritious, dark leafy greens that thrive in the winter garden.",
			"primaryColor": "#35734b", "accentColor": "#69a66a", "foliageColor": "#285d3b",
			"staticAssetKey": "spinach", "harvestAssetKey": "spinach_2",
		},
		{
			"id": "winter_radish", "name": "Winter Radish", "seedName": "Winter Radish Seeds", "season": "Winter",
			"buyPrice": 15, "sellPrice": 35, "growthMinutes": 1.0 / 6.0,
			"seasonIcon": "❄️", "seasonColor": "#4a8cb8",
			"description": "Crisp magenta winter daikon with a spicy bite and cool frosted greens.",
			"primaryColor": "#c72c57", "accentColor": "#f9a8c2", "foliageColor": "#628a7e",
		},
	]

	for def in defs:
		crops[def["id"]] = def
		if def["id"] != "cabbage":
			crop_list.append(def)

func get_crop_def(id: Variant) -> Dictionary:
	if id == null or str(id).is_empty():
		return crops["carrot"] as Dictionary
	var key: String = str(id)
	return crops.get(key, crops["carrot"]) as Dictionary

func format_growth_time(minutes: float) -> String:
	var seconds := int(roundf(minutes * 60.0))
	if seconds < 60:
		return "%ds" % seconds
	return "%dm" % int(roundf(float(seconds) / 60.0))

func get_crops_by_season(season: String) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for crop in crop_list:
		var asset_key := str(crop.get("staticAssetKey", ""))
		var valid_shop_crop := str(crop["id"]) == "kale" or (not asset_key.is_empty() and SHOP_ARTWORK_KEYS.has(asset_key))
		if valid_shop_crop and (season == "All" or str(crop["season"]) == season or str(crop["season"]) == "All"):
			result.append(crop)
	return result

func draw_seed_packet(d: DrawSurface, crop: Dictionary, x: float, y: float, w: float = 66.0, h: float = 82.0, owned_count: int = -1) -> void:
	var asset_key := str(crop.get("staticAssetKey", ""))
	if not asset_key.is_empty():
		var tex := AssetRegistry.get_tex(asset_key)
		if tex != null:
			var sz := AssetRegistry.get_size(asset_key)
			var pad := 2.0
			var max_w := w - pad * 2.0
			var max_h := h - pad * 2.0
			var scale := minf(max_w / maxf(1.0, sz.x), max_h / maxf(1.0, sz.y))
			var draw_w := sz.x * scale
			var draw_h := sz.y * scale
			d.draw_texture_at(tex, x + (w - draw_w) * 0.5, y + (h - draw_h) * 0.5, draw_w, draw_h)
			if owned_count > 0:
				var badge_w := minf(36.0, maxf(24.0, w * 0.38))
				var badge_h := minf(22.0, maxf(16.0, h * 0.24))
				var bx := x + w - badge_w + 2.0
				var by := y + h - badge_h + 2.0
				d.draw_round_rect(bx, by, badge_w, badge_h, 5.0, {"fill": "#457b52", "stroke": "#ffffff", "lineWidth": 1.0})
				d.draw_text_styled("×%d" % owned_count, bx + badge_w * 0.5, by + badge_h * 0.5, {
					"size": maxf(9.0, minf(13.0, badge_h * 0.68)),
					"fill": "#ffffff", "align": "center", "baseline": "middle"
				})
			return

	# Vector-drawn kraft paper seed packet
	d.draw_round_rect(x + 2.0, y + 3.0, w, h, 7.0, {"fill": "#000000", "alpha": 0.12})
	d.draw_round_rect(x, y, w, h, 6.0, {"fill": "#deb788", "stroke": "#aa8153", "lineWidth": 1.5})
	d.draw_line_styled(x + 3.0, y + 15.0, x + w - 3.0, y + 15.0, {"stroke": "#be9568", "lineWidth": 1.5})
	d.draw_round_rect(x + 2.0, y + 2.0, w - 4.0, 12.0, 4.0, {"fill": "#c99f6f"})

	var sx := x + 7.0
	while sx < x + w - 6.0:
		d.draw_line_styled(sx, y + 3.0, sx, y + 12.0, {"stroke": "#9b7145", "lineWidth": 1.0})
		sx += 6.0

	var frame_w := w - 16.0
	var frame_h := h - 34.0
	var frame_x := x + 8.0
	var frame_y := y + 18.0
	d.draw_round_rect(frame_x, frame_y, frame_w, frame_h, 5.0, {"fill": "#fffaf0", "stroke": "#d5bea1", "lineWidth": 1.0})
	draw_crop_emblem(d, crop, frame_x + frame_w * 0.5, frame_y + frame_h * 0.5)
	d.draw_round_rect(x + 6.0, y + h - 13.0, w - 12.0, 9.0, 3.0, {"fill": str(crop["primaryColor"]), "alpha": 0.85})

	if owned_count > 0:
		var badge_w := 24.0
		var badge_h := 16.0
		var bx := x + w - badge_w + 3.0
		var by := y + h - badge_h + 3.0
		d.draw_round_rect(bx, by, badge_w, badge_h, 5.0, {"fill": "#457b52", "stroke": "#ffffff", "lineWidth": 1.0})
		d.draw_text_styled("×%d" % owned_count, bx + badge_w * 0.5, by + badge_h * 0.5, {
			"size": 11, "fill": "#ffffff", "align": "center", "baseline": "middle"
		})

func draw_crop_emblem(d: DrawSurface, crop: Dictionary, cx: float, cy: float) -> void:
	var id := str(crop.get("id", "carrot"))
	match id:
		"cabbage":
			d.draw_circle_styled(cx - 7.0, cy, 10.0, {"fill": "#5e9f4a"})
			d.draw_circle_styled(cx + 7.0, cy, 10.0, {"fill": "#5e9f4a"})
			d.draw_circle_styled(cx, cy + 4.0, 11.0, {"fill": "#6cb854"})
			d.draw_circle_styled(cx, cy - 1.0, 9.0, {"fill": "#94e07b", "stroke": "#498138", "lineWidth": 1.0})
			d.draw_circle_styled(cx + 1.0, cy - 2.0, 5.0, {"fill": "#c0f2ab"})
		"carrot":
			d.draw_line_styled(cx, cy - 4.0, cx - 7.0, cy - 15.0, {"stroke": "#4a9939", "lineWidth": 2.0})
			d.draw_line_styled(cx, cy - 4.0, cx, cy - 17.0, {"stroke": "#5ebb49", "lineWidth": 2.0})
			d.draw_line_styled(cx, cy - 4.0, cx + 7.0, cy - 15.0, {"stroke": "#4a9939", "lineWidth": 2.0})
			d.draw_polygon_styled([
				Vector2(cx - 6.0, cy - 4.0), Vector2(cx + 6.0, cy - 4.0),
				Vector2(cx + 2.0, cy + 12.0), Vector2(cx, cy + 16.0), Vector2(cx - 2.0, cy + 12.0)
			], {"fill": "#f17726"})
			d.draw_line_styled(cx - 4.0, cy + 1.0, cx + 1.0, cy + 1.0, {"stroke": "#d65b10", "lineWidth": 1.0})
			d.draw_line_styled(cx - 3.0, cy + 6.0, cx + 2.0, cy + 6.0, {"stroke": "#d65b10", "lineWidth": 1.0})
			d.draw_line_styled(cx - 2.0, cy - 1.0, cx - 1.0, cy + 10.0, {"stroke": "#ffa76b", "lineWidth": 1.5})
		"potato":
			d.draw_ellipse_styled(cx, cy, 12.0, 9.0, {"fill": "#cca064", "stroke": "#9e733c", "lineWidth": 1.0})
			d.draw_circle_styled(cx - 4.0, cy - 2.0, 6.0, {"fill": "#deb983"})
			d.draw_circle_styled(cx - 5.0, cy - 2.0, 1.0, {"fill": "#805928"})
			d.draw_circle_styled(cx + 4.0, cy + 1.0, 1.0, {"fill": "#805928"})
			d.draw_circle_styled(cx - 1.0, cy + 4.0, 1.0, {"fill": "#805928"})
		"pumpkin":
			d.draw_ellipse_styled(cx - 7.0, cy + 2.0, 7.0, 10.0, {"fill": "#d65d13"})
			d.draw_ellipse_styled(cx + 7.0, cy + 2.0, 7.0, 10.0, {"fill": "#d65d13"})
			d.draw_ellipse_styled(cx, cy + 2.0, 9.0, 11.0, {"fill": "#f07e28", "stroke": "#ba4906", "lineWidth": 1.0})
			d.draw_circle_styled(cx - 2.0, cy, 5.0, {"fill": "#ffa559"})
			d.draw_rect_styled(cx - 2.0, cy - 12.0, 4.0, 6.0, {"fill": "#558738"})
			d.draw_line_styled(cx, cy - 11.0, cx + 4.0, cy - 14.0, {"stroke": "#6aa348", "lineWidth": 2.0})
		"strawberry":
			d.draw_polygon_styled([
				Vector2(cx - 8.0, cy - 7.0), Vector2(cx, cy - 4.0), Vector2(cx + 8.0, cy - 7.0),
				Vector2(cx + 4.0, cy - 3.0), Vector2(cx - 4.0, cy - 3.0)
			], {"fill": "#45993a"})
			d.draw_polygon_styled([
				Vector2(cx - 8.0, cy - 3.0), Vector2(cx + 8.0, cy - 3.0), Vector2(cx + 6.0, cy + 5.0),
				Vector2(cx, cy + 13.0), Vector2(cx - 6.0, cy + 5.0)
			], {"fill": "#e63946", "stroke": "#b01927", "lineWidth": 1.0})
			d.draw_circle_styled(cx - 3.0, cy + 1.0, 3.0, {"fill": "#ff7582"})
			d.draw_circle_styled(cx - 3.0, cy + 1.0, 0.8, {"fill": "#fff275"})
			d.draw_circle_styled(cx + 3.0, cy + 1.0, 0.8, {"fill": "#fff275"})
			d.draw_circle_styled(cx, cy + 6.0, 0.8, {"fill": "#fff275"})
		"tomato":
			d.draw_circle_styled(cx, cy + 2.0, 10.0, {"fill": "#e03030", "stroke": "#b01c1c", "lineWidth": 1.0})
			d.draw_circle_styled(cx - 3.0, cy - 1.0, 4.0, {"fill": "#ff6666"})
			d.draw_line_styled(cx - 6.0, cy - 6.0, cx + 6.0, cy - 6.0, {"stroke": "#4ea03a", "lineWidth": 2.0})
			d.draw_line_styled(cx, cy - 8.0, cx, cy - 3.0, {"stroke": "#4ea03a", "lineWidth": 2.0})
			d.draw_circle_styled(cx, cy - 6.0, 2.0, {"fill": "#3d822b"})
		"corn":
			d.draw_ellipse_styled(cx - 4.0, cy + 2.0, 4.0, 11.0, {"fill": "#558b2f"})
			d.draw_ellipse_styled(cx + 4.0, cy + 2.0, 4.0, 11.0, {"fill": "#558b2f"})
			d.draw_round_rect(cx - 4.0, cy - 6.0, 8.0, 16.0, 4.0, {"fill": "#f4c430", "stroke": "#c99616", "lineWidth": 1.0})
		"cauliflower":
			d.draw_circle_styled(cx - 7.0, cy + 1.0, 8.0, {"fill": "#52834b"})
			d.draw_circle_styled(cx + 7.0, cy + 1.0, 8.0, {"fill": "#52834b"})
			d.draw_circle_styled(cx, cy + 6.0, 8.0, {"fill": "#45733e"})
			d.draw_circle_styled(cx, cy - 1.0, 8.0, {"fill": "#fcf8ea", "stroke": "#d9cdb0", "lineWidth": 1.0})
		_:
			var foliage := str(crop.get("foliageColor", "#4f7937"))
			var primary := str(crop.get("primaryColor", "#f17726"))
			var accent := str(crop.get("accentColor", "#ffa05c"))
			d.draw_line_styled(cx, cy + 2.0, cx, cy - 9.0, {"stroke": foliage, "lineWidth": 2.0})
			d.draw_ellipse_styled(cx - 6.0, cy - 9.0, 5.0, 3.0, {"fill": foliage})
			d.draw_ellipse_styled(cx + 6.0, cy - 9.0, 5.0, 3.0, {"fill": foliage})
			d.draw_ellipse_styled(cx, cy - 12.0, 4.0, 3.0, {"fill": foliage})
			d.draw_ellipse_styled(cx, cy + 5.0, 8.0, 10.0, {"fill": primary, "stroke": foliage, "lineWidth": 1.0})
			d.draw_circle_styled(cx - 2.0, cy + 2.0, 2.5, {"fill": accent})
