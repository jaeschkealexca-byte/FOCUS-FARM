class_name FarmViewportClip
extends Control
## Clipped farm viewport control (`clip_contents = true`) at `(366, 234, 1188, 676)`.
## Renders the zoomed and player-following farm world in local coordinates.

var world: FarmWorldData = null

func _draw() -> void:
	if world == null:
		return
	var center_x := FarmWorldData.ORIGIN_X + float(FarmWorldData.WIDTH) * 32.0 - position.x
	var center_y := FarmWorldData.ORIGIN_Y + float(FarmWorldData.HEIGHT) * 32.0 - position.y
	var cam := world.get_camera_center()
	var d := DrawSurface.new(
		self,
		center_x - cam.x * world.zoom,
		center_y - cam.y * world.zoom,
		world.zoom
	)
	var ox := FarmWorldData.ORIGIN_X
	var oy := FarmWorldData.ORIGIN_Y
	var palette := RealCalendar.palette()
	var season := RealCalendar.season

	d.draw_round_rect(ox - 18.0, oy - 18.0, 1188.0, 676.0, 16.0, {"fill": palette["edge"]})
	d.draw_rect_styled(ox - 7.0, oy - 7.0, 1166.0, 654.0, {"fill": "#f2f6fa" if season == "Winter" else "#b6ad7e"})

	for y in range(FarmWorldData.HEIGHT):
		for x in range(FarmWorldData.WIDTH):
			world.plots[y * FarmWorldData.WIDTH + x].render_base(d, ox + float(x) * 64.0, oy + float(y) * 64.0, x, y)

	world.render_grass_decor(d, ox, oy)

	# Seed Stand landmark at (1, 1)
	var sx := ox + 64.0
	var sy := oy + 64.0
	d.draw_rect_styled(sx + 7.0, sy + 28.0, 50.0, 32.0, {"fill": "#b38358"})
	d.draw_rect_styled(sx + 11.0, sy + 34.0, 42.0, 17.0, {"fill": "#e0c193"})
	d.draw_rect_styled(sx + 3.0, sy + 8.0, 58.0, 23.0, {"fill": "#eee0ac"})
	for i in range(3):
		d.draw_rect_styled(sx + 3.0 + float(i) * 20.0, sy + 8.0, 10.0, 23.0, {"fill": "#8caa80"})
	d.draw_text_styled("SEEDS", sx + 32.0, sy + 43.0, {"size": 10, "align": "center", "fill": "#584936"})

	# Shipping Bin landmark at (2, 1)
	var bx := ox + 128.0
	d.draw_rect_styled(bx + 8.0, sy + 20.0, 48.0, 40.0, {"fill": "#88694c"})
	d.draw_rect_styled(bx + 4.0, sy + 16.0, 56.0, 12.0, {"fill": "#c39f70"})
	d.draw_rect_styled(bx + 16.0, sy + 18.0, 32.0, 4.0, {"fill": "#4a4439"})
	d.draw_text_styled("SHIP", bx + 32.0, sy + 41.0, {"size": 10, "align": "center", "fill": "#eddfb7"})

	var t := world.player.target()
	if world.can_enter(t.x, t.y):
		d.draw_round_rect(ox + float(t.x) * 64.0 + 2.0, oy + float(t.y) * 64.0 + 2.0, 60.0, 60.0, 6.0, {
			"stroke": "#ffe6ab", "lineWidth": 3.0
		})

	if season == "Winter":
		d.draw_rect_styled(sx + 3.0, sy + 7.0, 58.0, 5.0, {"fill": "#f2f7fc"})
		d.draw_rect_styled(bx + 4.0, sy + 15.0, 56.0, 5.0, {"fill": "#f2f7fc"})

	world.player.render(d, ox, oy)

	for y in range(FarmWorldData.HEIGHT):
		for x in range(FarmWorldData.WIDTH):
			var p := world.plots[y * FarmWorldData.WIDTH + x]
			if p.planted:
				p.render_crop_overlay(d, ox + float(x) * 64.0, oy + float(y) * 64.0)

	if RealCalendar.night_alpha > 0.0:
		d.draw_rect_styled(ox, oy, 1152.0, 640.0, {"fill": "#28324f", "alpha": RealCalendar.night_alpha})

