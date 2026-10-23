class_name FarmPlayerData
extends RefCounted
## Port of `src/farm/farm-player.ts` and `src/movement/grid-entity.ts`.

var grid_x: int = 2
var grid_y: int = 5
var direction: String = "right"

const DIR_VECTORS := {
	"none": Vector2i(0, 0),
	"up": Vector2i(0, -1),
	"down": Vector2i(0, 1),
	"left": Vector2i(-1, 0),
	"right": Vector2i(1, 0),
}

func target() -> Vector2i:
	var v: Vector2i = DIR_VECTORS.get(direction, Vector2i(1, 0))
	return Vector2i(grid_x + v.x, grid_y + v.y)

func step(new_dir: String, can_enter: Callable) -> void:
	direction = new_dir
	var t := target()
	if bool(can_enter.call(t.x, t.y)):
		grid_x = t.x
		grid_y = t.y

func render(d: DrawSurface, origin_x: float, origin_y: float) -> void:
	var x := origin_x + float(grid_x) * 64.0 + 32.0
	var y := origin_y + float(grid_y) * 64.0 + 32.0
	d.draw_ellipse_styled(x, y + 21.0, 19.0, 7.0, {"fill": "#345b43", "alpha": 0.45})
	d.draw_rect_styled(x - 13.0, y + 13.0, 10.0, 10.0, {"fill": "#3b4140"})
	d.draw_rect_styled(x + 3.0, y + 13.0, 10.0, 10.0, {"fill": "#3b4140"})
	d.draw_rect_styled(x - 15.0, y - 3.0, 30.0, 23.0, {"fill": "#e6a46f"})
	d.draw_rect_styled(x - 10.0, y + 1.0, 20.0, 17.0, {"fill": "#497f89"})
	d.draw_rect_styled(x - 11.0, y - 19.0, 22.0, 18.0, {"fill": "#f4cc98"})
	d.draw_rect_styled(x - 15.0, y - 25.0, 30.0, 12.0, {"fill": "#d8b469"})
	d.draw_rect_styled(x - 23.0, y - 17.0, 46.0, 6.0, {"fill": "#efd18c"})
	d.draw_rect_styled(x - 15.0, y - 20.0, 30.0, 4.0, {"fill": "#937c51"})
	var v: Vector2i = DIR_VECTORS.get(direction, Vector2i(1, 0))
	d.draw_rect_styled(x + float(v.x) * 7.0 - 2.0, y - 7.0 + float(v.y) * 3.0, 4.0, 4.0, {"fill": "#39433b"})

