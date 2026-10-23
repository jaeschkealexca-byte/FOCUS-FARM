#!/usr/bin/env node
/**
 * Downloads remote sprites listed in `static-asset-manifest.json` into
 * `godot/assets/sprites/` and writes a local `godot/assets/manifest.json`
 * so the Godot 4 project can load all textures offline from `res://assets/sprites/`.
 *
 * Usage:
 *   node scripts/export-assets-to-godot.mjs
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const manifestPath = path.join(rootDir, 'static-asset-manifest.json');
const outSpritesDir = path.join(rootDir, 'godot', 'assets', 'sprites');
const outManifestPath = path.join(rootDir, 'godot', 'assets', 'manifest.json');

async function main() {
  const raw = await fs.readFile(manifestPath, 'utf-8');
  const manifest = JSON.parse(raw);
  const assets = manifest.assets ?? {};

  await fs.mkdir(outSpritesDir, { recursive: true });

  const localManifest = {};
  const entries = Object.entries(assets);
  console.log(`Found ${entries.length} assets in static-asset-manifest.json...`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const [key, info] of entries) {
    const ext = info?.metadata?.format || 'png';
    const fileName = `${key}.${ext}`;
    const destPath = path.join(outSpritesDir, fileName);
    const resPath = `res://assets/sprites/${fileName}`;

    localManifest[key] = {
      path: resPath,
      width: info?.metadata?.width ?? 64,
      height: info?.metadata?.height ?? 64,
    };

    try {
      await fs.access(destPath);
      skipped++;
      continue;
    } catch {
      // File not downloaded yet
    }

    if (!info?.url) continue;

    try {
      const response = await fetch(info.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(destPath, buffer);
      downloaded++;
      process.stdout.write(`\rDownloaded ${downloaded} / ${entries.length} (${key})...`);
    } catch (err) {
      failed++;
      console.warn(`\nCould not download ${key}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  await fs.writeFile(outManifestPath, JSON.stringify(localManifest, null, 2), 'utf-8');
  console.log(`\nDone! Downloaded: ${downloaded}, Skipped (cached): ${skipped}, Failed: ${failed}`);
  console.log(`Wrote Godot asset manifest to ${outManifestPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

