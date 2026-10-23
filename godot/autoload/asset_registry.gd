extends Node
## AssetRegistry Autoload — Loads and caches exported sprites from `res://assets/sprites/`
## if `node scripts/export-assets-to-godot.mjs` has been run, falling back cleanly
## to procedural `_draw()` rendering when a texture is not yet present on disk.

var _textures: Dictionary = {}
var _sizes: Dictionary = {}
var _manifest_loaded: bool = false

func _ready() -> void:
	_load_manifest()

func _load_manifest() -> void:
	if _manifest_loaded:
		return
	_manifest_loaded = true
	var manifest_path := "res://assets/manifest.json"
	if not FileAccess.file_exists(manifest_path):
		return
	var file := FileAccess.open(manifest_path, FileAccess.READ)
	if file == null:
		return
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	file.close()
	if parsed is Dictionary:
		var parsed_dict: Dictionary = parsed as Dictionary
		for key in parsed_dict.keys():
			var entry: Variant = parsed_dict[key]
			if entry is Dictionary:
				var entry_dict: Dictionary = entry as Dictionary
				_sizes[key] = Vector2(
					float(entry_dict.get("width", 64.0)),
					float(entry_dict.get("height", 64.0))
				)

func get_tex(key: String) -> Texture2D:
	if key.is_empty():
		return null
	if _textures.has(key):
		return _textures[key] as Texture2D

	for ext in ["png", "webp", "jpg"]:
		var path: String = "res://assets/sprites/%s.%s" % [key, ext]
		if ResourceLoader.exists(path):
			var tex: Texture2D = load(path) as Texture2D
			if tex != null:
				_textures[key] = tex
				if not _sizes.has(key):
					_sizes[key] = tex.get_size()
				return tex
		elif FileAccess.file_exists(path):
			var img: Image = Image.load_from_file(ProjectSettings.globalize_path(path))
			if img != null and not img.is_empty():
				var tex: ImageTexture = ImageTexture.create_from_image(img)
				_textures[key] = tex
				if not _sizes.has(key):
					_sizes[key] = Vector2(img.get_width(), img.get_height())
				return tex

	_textures[key] = null
	return null

func get_size(key: String) -> Vector2:
	if _sizes.has(key):
		return _sizes[key] as Vector2
	var tex: Texture2D = get_tex(key)
	if tex != null:
		return tex.get_size()
	return Vector2(64, 64)

