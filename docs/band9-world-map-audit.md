# Band 9 Hanoi World — Implementation Audit

Date: 2026-10-15

## Live architecture

- The travel screen uses the Canvas-based `CityEngine` and `CityMap` model.
- Hanoi's live `CITY_MAPS.hanoi` entry now comes from `src/data/travel/maps/hanoi-world.ts`, which adapts the shared 128×64 world blueprint into image terrain, collision rows, POI hit regions, NPCs, routes, and depth-sorted objects.
- `src/world/master-blueprint.ts` is the source of the world geometry. It shifts the original compact 48-lot landmark core inside a four-column by two-row world, then connects extension districts around it.
- `scripts/world/export-world.ts` generates the 2048×1024 small terrain image, a 4× nearest-neighbour image, and the used procedural prop sprites. `npm run world:validate` renders an overview and street crop in `tmp/`.

## Delivered layout

- 104 non-overlapping, in-bounds building lots retain the original 48 core lots and add west/east commercial streets, northern cultural garden/cafe frontage, and a southern festival/transit edge.
- The central canal, riverside avenue, bridge landings, cafe portal, Hanoi POI mapping, NPCs, lower-right parking, and all four extension gateways are connected to the same global walk grid.
- Small storefronts now line the northern garden walk. Shop rows mix food, coffee, market and heritage facades; larger landmarks keep different lot sizes.
- Park blocks receive deterministic shrubs and trees. The festival garden and plaza remain open enough for multiplayer gathering.

## Verification

`npm run world:validate` passes 15 checks: 4×2 chunk coverage, unique lot parcels, pixel-identical chunk crops, the avenue and river across all east-west chunk seams, streets across the north-south seam, bridge approaches, every building door, four gateways, reciprocal cafe travel, object ownership, dry-ground props, and sprite availability.

`npm run world:export` successfully generated the live terrain and 15 unique prop sprite assets.

`npm run typecheck` reports existing errors elsewhere in the repository (HSA paper/question handling, an intro color tuple, an unrelated relocation script, Sidebar `chiikawaTheme`, HSA helper typing, and search catalog typing). No `src/world` or Hanoi world adapter error appears in that output.

## Remaining content extension

Added storefront facades are world scenery until matching quest content is added to `src/data/travel/pois.ts`. Continue extending from the four `Blueprint.gateways` and keep the blueprint, live adapter, generated assets, and validator aligned.
