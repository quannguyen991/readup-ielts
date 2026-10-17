# Band 9 Hanoi World — Visual Design Contract

## Goal

Grow the user's reference map into one continuous, explorable Hanoi city while keeping the cozy, lush Gather-style pixel language. The original landmark district remains the center of the composition. Four connected edge gateways let future districts continue the same street network.

## Visual language

- Top-down pixel art with crisp nearest-neighbour scaling, small chibi residents, recognizable Vietnamese landmarks, outdoor cafes, food carts, and shophouses.
- Teal water and stone embankments define the central river/canal. Terracotta brick is for promenades, lanes, bridges, and plazas; asphalt stays around the transit/parking edge.
- Use hedge-framed planted islands, pocket gardens, and fountain squares between close-set destinations. Keep civic landmarks legible by giving them larger, varied parcels.
- Avoid a generic grid, long repeated storefront walls, and broad unstructured lawns. Open space should read as a real gathering plaza or a detailed garden with paths, water, planting, and destinations.

## World structure

- One coordinate system: 128×64 tiles, 16 source pixels per tile, four columns by two rows of chunks. The generated ground is 2048×1024 source pixels; the live scene also has a crisp 4× export.
- The preserved 48-lot Hanoi core sits inside the world and keeps its food, heritage, civic, and transit identities, central avenue, canal, bridges, cafe portal, and lower-right parking.
- The expanded map currently contains 104 non-overlapping building lots. New destinations are interleaved with the core: western Old Quarter/study lanes, eastern food/market blocks, northern cultural garden and frontage shops, and the southern festival/transit edge.
- Lot footprints vary. Every door has a clear walkable threshold and landing. Paths must reach every district gateway and remain continuous when the world is sliced into chunks.

## District character

| District | Character |
|---|---|
| Central riverside core | Existing Hanoi landmarks, avenue, two waterside clusters, bridge approaches and cafe portal. |
| West extension | Narrow Old Quarter lanes, memorial and study places, mixed food/cafe frontages. |
| East extension | Market arcades, craft streets, food stalls and mixed-use access. |
| North cultural garden | Ba Đình and temple landmarks, lotus pond, garden path loop and small frontage cafes. |
| South event/transit | Festival square, pond and garden, city landmarks, transit frontage and parking. |

## Composition and interaction

- Let the east-west avenue establish orientation; smaller brick streets and alleys feed shop doors and plazas. Use the river promenades and bridge approaches as clear secondary routes.
- Keep landmarks readable among cafes and street food. Vary shop width, sprite size, block depth, and planted breaks; avoid blank bands between every row.
- Keep all original 48 POIs, Hanoi names and art. New scenery lots may remain non-quest facades until they receive content entries in `src/data/travel/pois.ts`.
- Preserve collision/depth sorting and the reciprocal cafe portal through the existing `CityMap` adapter.

## Delivery checks

- `npm run world:validate` is the map gate. It verifies plot bounds and overlap, 4×2 chunk coverage and pixel parity, all chunk seams, bridge approaches, all lot doors, four reachable gateways, reciprocal cafe travel, deterministic object ownership, dry-ground props, and sprite files.
- Review the full overview and street crop generated into `tmp/`; then run `npm run world:export` to refresh the live ground and prop assets.
- Do not copy screenshot UI, labels, exact pixel placement, or unrelated landmark layouts. Keep its density, materials, planted framing, and cozy Hanoi atmosphere.
