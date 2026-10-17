# Band 9 Hanoi World — Reference Contract

## Goal and target artifact

Expand the reference-driven Hanoi pixel city into the live Band 9 travel map. Preserve the original landmark district as the center and add coherent walkable streets and destinations around it.

**Audience:** players exploring Hanoi and contributors extending its chunked world.

## Reference evidence

| Evidence | What it establishes |
|---|---|
| User's Hanoi pixel-map screenshot | Lush planted blocks; teal water; brick paths; close landmarks, cafes, markets and stalls; bridges; small characters; a readable transit/parking edge. |
| Existing Hanoi map assets and POI catalog | Keep recognizable Hanoi identity, current sprites and all original landmark and shop destinations. |
| Current `src/world` renderer and validator | One global tile world can generate terrain, collision, scene objects, chunk views, and walkability checks. |

## Keep, change, avoid

| Keep | Change | Avoid |
|---|---|---|
| Existing 48 core lots, Vietnamese POI IDs, pixel art, water/bridge character, cafe portal and airport parking. | Make that core the central showcase; add west/east commercial neighborhoods plus north garden and south event/transit districts. Tie lots to a clear street hierarchy and edge gateways. | Sparse planner grids, repeated same-size rows, broad empty lawns, disconnected chunk borders, or smoothing the pixel art. |

## Layout contract

- World grid: 128×64 tiles, 16 pixels per tile, four chunk columns by two rows.
- The central riverside landmarks remain surrounded by teal water and connected by the brick avenue and bridges.
- Closely spaced shop and cafe frontages occupy the west/east extension blocks. The north garden mixes civic landmarks, lotus pond paths and cafes; the south edge keeps an open but detailed event square beside transit and parking.
- Parcels vary by building scale and use. Every threshold and exterior door landing is reachable from the spawn; no lots overlap.
- Four walkable border gateways mark where later Old Quarter, market, cultural, and festival districts can continue.

## Current evidence and limits

- The expanded blueprint is now the live Hanoi `CityMap` via `src/data/travel/maps/index.ts` and `src/data/travel/maps/hanoi-world.ts`.
- It currently places 104 distinct building lots, including the preserved 48-lot core. The additional storefront facades appear in the world scene but remain scenery until they receive entries in the POI content catalog.
- Generated terrain and prop assets are exported under `public/travel/terrain/` and `public/travel/sprites/hanoi-world-props/`.
- Validation confirms chunk pixel parity, all three horizontal seams, the vertical seam, all lot doors, gateways, bridges, portal reciprocity, dry-ground props and sprite availability.

## Quality gate

- [x] Keep the 48 original destinations and landmark identities.
- [x] Expand into four connected districts with four reachable edge gateways.
- [x] Keep the 104 lot footprints in bounds and non-overlapping.
- [x] Keep all doors and bridge approaches walkable from spawn.
- [x] Preserve water continuity and pixel-identical chunk rendering.
- [x] Refresh the generated overview and inspect it at full size.
- [x] Wire the expanded blueprint into the live Hanoi travel scene.
