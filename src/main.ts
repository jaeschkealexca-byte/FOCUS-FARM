/**
 * Entry point — boots MakkoEngine and starts the Game.
 *
 * Use this file as-is when scaffolding a new project. Do NOT hand-roll a
 * separate canvas/game-loop bootstrapper — `MakkoEngine.initEngine()` already
 * wires up the display, managed asset readiness, and input capture; adding parallel
 * boot logic desynchronises the engine from your scenes.
 *
 * Integration:
 *   - MAKKO-managed project assets load automatically. Resolve every asset
 *     identifier with `list_assets` followed by `get_asset` before placing it
 *     in game configuration.
 *   - `EngineInitOptions.manifests` is only for caller-owned extensions. Omit
 *     it for normal projects; extensions load after managed assets and their
 *     keys win collisions.
 *   - Register any gameplay keys through `MakkoEngine.input.capture([...])`
 *     here so they're intercepted before the browser handles them.
 *   - All scene wiring belongs in `Game` (./game/game); this file stays a
 *     thin boot shim — resist adding gameplay logic here.
 */
import { MakkoEngine } from '@makko/engine';
import { Game } from './game/game';

async function main() {
  // Initialize MakkoEngine with canvas and assets
  await MakkoEngine.initEngine({
    canvas: document.getElementById('gameCanvas') as HTMLCanvasElement,
    width: 1920,
    height: 1080
  });

  MakkoEngine.display.setImageSmoothing(false);  // Pixel art

  // Capture game keys
  MakkoEngine.input.capture(['Space', 'Enter', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'KeyE', 'KeyF', 'KeyB', 'KeyI', 'KeyV']);

  // Initialize and start game
  const game = new Game();
  await game.init();
  game.start();
}

main().catch((error: unknown) => {
  if (error instanceof Error) console.error(error.message, error.stack);
});
