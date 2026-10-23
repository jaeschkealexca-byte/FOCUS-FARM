class_name UIOverlayCanvas
extends Control
## Full-screen overlay Control placed after `FarmViewportClip` in the scene tree
## so that HUD panels, seed pouch popups, backpack modal, shop window, and focus
## sanctuary always render on top of the farm world.

var main_controller: Control = null

func _draw() -> void:
	if main_controller != null and main_controller.has_method("draw_overlay"):
		main_controller.call("draw_overlay", self)

