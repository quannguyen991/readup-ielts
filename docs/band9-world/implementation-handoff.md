# Implementation Handoff — Expanded Band 9 Hanoi World

## Live implementation

- `src/world/master-blueprint.ts` is the single source for the expanded, chunk-aware Hanoi world. Its 128×64 tile grid is split into four columns by two rows.
- The compact landmark core is retained, shifted into the middle of the world, and connected to the west Old Quarter, east food/market streets, north cultural garden, and south festival/transit districts.
- `src/data/travel/maps/hanoi-world.ts` adapts the blueprint to the existing `CityMap` and `CityEngine` scene contract. `src/data/travel/maps/index.ts` registers it as the live Hanoi map.
- `npm run world:export` writes the 2048×1024 ground map, 4× nearest-neighbour version, and used prop sprites under `public/travel/`.

## Preserve during follow-up work

- All 48 original landmark/shop lots, the Hanoi sprite library, existing POI identities, NPC scene behavior, and reciprocal cafe portal.
- The dense central landmark/food core, teal river and canal, brick avenue, bridge approaches, ornamental gardens, south event square, lower-right parking, and four edge gateways.
- Irregular block sizes and small shop frontages. The world currently has 104 distinct lots; keep front doors reachable and do not reintroduce broad, unused grass blocks between active streets.
- Existing pixel-art assets and nearest-neighbour rendering. Avoid resampling sprites with smoothing.

## Workflow and quality gate

1. Edit the shared blueprint rather than hand-editing generated terrain images.
2. Run `npm run world:validate`. It checks plot bounds/overlap, chunk-to-world pixel parity, all three east-west seams, the north-south seam, bridge landings, every entrance, all four gateways, cafe portal reciprocity, object ownership, prop placement, and sprite availability. It regenerates previews in `tmp/`.
3. Inspect `tmp/band9-world-overview.png` and `tmp/band9-world-street-view.png` at full size.
4. Run `npm run world:export` after blueprint changes so the live travel scene has matching ground and prop assets.
5. Check relevant app types before delivery. A full repository typecheck may surface unrelated existing failures; report those separately from map diagnostics.
