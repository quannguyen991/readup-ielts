/**
 * BỘ VẼ THÀNH PHỐ 2D (canvas) — một canvas, cảnh vẽ vào bộ đệm thấp rồi phóng nguyên lần.
 *
 * HAI CHẾ ĐỘ nền (cùng một vòng vẽ, cùng nhân vật/hiệu ứng):
 *   - Ô (`map.image` trống): đất + vật vẽ bằng mã từ lưới ký tự (xem `grid.ts`), tầng tĩnh cache.
 *   - Ảnh (`map.image`): tranh pixel-art dựng sẵn (418×235 điểm nguồn) làm nền, mặt đất đi được
 *     mô tả bằng lưới thô (`imageWorld.ts`); nhân vật / NPC / xe là sprite nhỏ cùng mật độ điểm ảnh.
 *
 * Tầng: nền (tĩnh) → nước (sóng, lấp lánh, vũng) → vật & người xếp theo y → mái che / vùng che →
 * mây → ánh sáng nhân màu → hạt/mưa/laser → phóng nguyên lần + chữ ở độ phân giải thiết bị.
 * Mọi phép phóng là SỐ NGUYÊN (`view.ts`); máy quay và thực thể làm tròn về điểm nguồn khi vẽ.
 */
import { findPath } from '@/services/travel/pathfinding';
import { daylight, localTime, weatherPlan } from '@/services/travel/clock';
import type { CityMap, Npc, Poi, Route, Tile, TravelState, WeatherPlan } from '@/services/travel/types';
import { hash2, mulberry32 } from '@/data/travel/sprites/paint';
import { getSpriteDef, personFrame, type Dir } from '@/data/travel/sprites';
import { atlasFor, ctx2d, makeCanvas, type Atlas, type Bitmap } from './Atlas';
import { buildWorld, GROUND_CHARS, isBlockedAt, isPoiLocked, pathField, TS, type Placed, type World } from './grid';
import { buildImgWorld, findPathPx, isWalkPx, type ImgWorld, type Pt } from './imageWorld';
import { ambientAt, Lighting, type Light, type RGB } from './Lighting';
import { Particles, PK } from './Particles';
import { Camera, computeImageView, computeView, pointerToWorld, type View } from './view';

export type EngineCallbacks = {
  onEnterPoi(id: string): void;
  onMove(tile: Tile): void;
  /** Chế độ ảnh: không nạp được tranh nền (để lớp trên chuyển sang bản đồ ô dự phòng). */
  onImageError?(): void;
};

export type EngineOptions = {
  reducedMotion: boolean;
  locale: 'vi' | 'en';
  /** Ghi đè giờ địa phương (0..24) — dùng ở trang thử; bỏ trống = giờ thật. */
  hour?: number;
  weather?: WeatherPlan;
  /** Vẽ lớp gỡ lỗi (vùng đi được, vùng chạm, cửa, tuyến). Chỉ có tác dụng khi `__DEV__`. */
  debug?: boolean;
  strings?: Partial<{ locked: string }>;
};

type Ent = {
  kind: 'player' | 'npc' | 'animal' | 'vehicle';
  bmps: Bitmap[];
  /** Chân (điểm nguồn). */
  x: number;
  y: number;
  z: number;
  frame: number;
  flip: boolean;
  /** Hàng chân trong sprite (từ trên xuống). */
  footRow: number;
  w: number;
  h: number;
  sortY: number;
};

type NpcRun = Ent & { npc: Npc; route: Pt[]; ri: number; wait: number; dir: Dir; walking: boolean; line: number; person: boolean };
type Player = Ent & { path: Pt[]; dir: Dir; stepT: number; dustT: number; moveAnnounced: boolean };
type Pigeon = Ent & { home: Pt; mode: 0 | 1 | 2; t: number; vx: number; vy: number; hide: number };
type Veh = Ent & { route: Route; pts: Pt[]; cum: number[]; len: number; s: number; dir: 1 | -1; sky: boolean; sp: number };
type Bubble = { en: string; vi: string; wx: number; wy: number; until: number } | null;

export type EngineStats = { fps: number; frameMs: number; particles: number; drawn: number; k: number; W: number; H: number; dpr: number; mode: 'tile' | 'image' };

const KEYMAP: Record<string, Dir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  W: 'up',
  s: 'down',
  S: 'down',
  a: 'left',
  A: 'left',
  d: 'right',
  D: 'right',
};
const DVEC: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

// ---- tải tranh nền (cache theo URL)
const imageCache = new Map<string, Promise<HTMLImageElement>>();
function loadMapImage(url: string): Promise<HTMLImageElement> {
  let p = imageCache.get(url);
  if (!p) {
    p = new Promise((res, rej) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => res(img);
      img.onerror = () => {
        imageCache.delete(url);
        rej(new Error(`không tải được ${url}`));
      };
      img.src = url;
    });
    imageCache.set(url, p);
  }
  return p;
}

export class CityEngine {
  readonly view: View = computeView(320, 200, 1);
  private cam = new Camera();
  private world: World | null = null;
  private imgW: ImgWorld | null = null;
  private bg: HTMLImageElement | null = null;
  private bgColor = '#141b2c';
  private imgFailed = false;
  private atlas!: Atlas;
  private map!: CityMap;
  private state!: TravelState;
  private opts: EngineOptions;
  private mode: 'tile' | 'image' = 'tile';

  private lo = makeCanvas(16, 16);
  private loCtx = ctx2d(this.lo);
  private dctx: CanvasRenderingContext2D;
  private staticCv: ReturnType<typeof makeCanvas> | null = null;
  private roofCv: ReturnType<typeof makeCanvas> | null = null;
  private lighting = new Lighting();
  private cloud: ReturnType<typeof makeCanvas> | null = null;

  private player!: Player;
  private npcs: NpcRun[] = [];
  private pigeons: Pigeon[] = [];
  private vehicles: Veh[] = [];
  private birds: { x: number; y: number; vx: number; t: number }[] = [];
  private particles = new Particles();
  private list: (Placed | Ent)[] = [];
  private lights: Light[] = [];
  private amb: RGB = [255, 255, 255];

  private t = 0;
  private hour = 12;
  private dayKey = '';
  private weather: WeatherPlan = { kind: 'clear', intensity: 0 };
  private wet = 0;
  private darkness = 0;
  private night = false;
  private lastClockAt = 0;

  private bubble: Bubble = null;
  private toast: { text: string; until: number } | null = null;
  private hoverPoi: string | null = null;
  private pendingEnter: string | null = null;
  private enterLock: string | null = null;
  private keys: Dir[] = [];
  private focused = false;
  private hovered = false;
  private downAt: { x: number; y: number; t: number } | null = null;

  private raf = 0;
  private running = false;
  private visible = true;
  private lastFrame = 0;
  private fpsAcc = 0;
  private fpsN = 0;
  private emaCost = 4;
  private minInterval = 0;
  stats: EngineStats = { fps: 0, frameMs: 0, particles: 0, drawn: 0, k: 1, W: 0, H: 0, dpr: 1, mode: 'tile' };

  private sparkleT = 0;
  private fireworkT = 0;
  private io: IntersectionObserver | null = null;
  private cleanup: (() => void)[] = [];
  private cssW = 320;
  private cssH = 200;
  private loadSeq = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private cbs: EngineCallbacks,
    map: CityMap,
    state: TravelState,
    opts: EngineOptions,
  ) {
    this.opts = opts;
    this.dctx = canvas.getContext('2d', { alpha: false })!;
    this.dctx.imageSmoothingEnabled = false;
    canvas.style.imageRendering = 'pixelated';
    canvas.style.touchAction = 'pan-y pinch-zoom';
    canvas.style.outline = 'none';
    canvas.style.display = 'block';
    canvas.tabIndex = 0;
    this.setMap(map, state);
    this.bindInput();
    if (typeof IntersectionObserver !== 'undefined') {
      this.io = new IntersectionObserver((e) => {
        this.visible = e[0]?.isIntersecting ?? true;
      });
      this.io.observe(canvas);
    }
  }

  // ------------------------------------------------------------------ kích thước thế giới
  private get worldW(): number {
    return this.mode === 'image' ? this.imgW!.w : this.world!.w * TS;
  }
  private get worldH(): number {
    return this.mode === 'image' ? this.imgW!.h : this.world!.h * TS;
  }
  private get isImg(): boolean {
    return this.mode === 'image';
  }
  /** Hệ số nhân tốc độ/khoảng cách: cảnh ảnh nhỏ hơn cảnh ô nên các hằng số được co lại. */
  private get u(): number {
    return this.mode === 'image' ? 0.55 : 1;
  }

  // ------------------------------------------------------------------ cấu hình
  setMap(map: CityMap, state: TravelState) {
    this.map = map;
    this.state = state;
    this.atlas = atlasFor(map.palette);
    this.mode = map.image ? 'image' : 'tile';
    this.stats.mode = this.mode;
    this.world = null;
    this.imgW = null;
    this.bg = null;
    this.imgFailed = false;
    this.staticCv = null;
    this.roofCv = null;
    this.t = 0;
    this.particles.clear();
    this.bubble = null;
    this.pendingEnter = null;
    this.enterLock = null;
    if (map.image) {
      this.imgW = buildImgWorld(map.image);
      const seq = ++this.loadSeq;
      loadMapImage(map.image.smallSrc ?? map.image.src)
        .then((img) => {
          if (seq !== this.loadSeq) return;
          this.bg = img;
          this.bgColor = averageColor(img);
        })
        .catch(() => {
          if (seq !== this.loadSeq) return;
          this.imgFailed = true;
          this.cbs.onImageError?.();
        });
    } else this.world = buildWorld(map);
    this.tickClock(true);
    this.initPlayer();
    this.initNpcs();
    this.initAnimals();
    this.initVehicles();
    this.recomputeView();
    this.cam.snapTo(this.player.x, this.player.y - 6, this.view, this.worldW, this.worldH);
    if (!this.isImg) this.rebuildStatic();
  }

  setState(state: TravelState) {
    const prev = this.state;
    this.state = state;
    if (prev && state.coins > prev.coins) this.coinBurst();
    if (state.city === this.map.id && this.player.path.length === 0 && !this.isImg) {
      const t = this.tileOf(this.player);
      const d = Math.abs(state.pos.x - t.x) + Math.abs(state.pos.y - t.y);
      if (d > 1 && !isBlockedAt(this.world!, state.pos.x, state.pos.y)) this.teleportTile(state.pos);
    }
    if (prev && prev.prefs.outfit !== state.prefs.outfit) this.player.bmps = this.personBitmaps(`player_${((state.prefs.outfit % 8) + 8) % 8}`);
  }

  setOptions(o: Partial<EngineOptions>) {
    this.opts = { ...this.opts, ...o };
    if ('hour' in o || 'weather' in o) this.tickClock(true);
    if (o.reducedMotion) this.particles.clear();
  }

  // ------------------------------------------------------------------ khung hình
  private recomputeView() {
    const v = this.isImg ? computeImageView(this.cssW, this.cssH, this.view.dpr, this.imgW!.w, this.imgW!.h) : computeView(this.cssW, this.cssH, this.view.dpr);
    Object.assign(this.view as View, v);
    this.canvas.width = v.devW;
    this.canvas.height = v.devH;
    this.dctx.imageSmoothingEnabled = false;
    this.lo = makeCanvas(v.W, v.H);
    this.loCtx = ctx2d(this.lo);
    this.lighting.resize(v.W, v.H);
    this.stats.k = v.k;
    this.stats.W = v.W;
    this.stats.H = v.H;
    this.stats.dpr = v.dpr;
  }

  resize(cssW: number, cssH: number, dpr: number) {
    this.cssW = cssW;
    this.cssH = cssH;
    (this.view as View).dpr = dpr;
    this.recomputeView();
    this.cam.snapTo(this.player.x, this.player.y - 6, this.view, this.worldW, this.worldH);
    this.renderFrame(0);
  }

  // ------------------------------------------------------------------ vòng đời
  start() {
    if (this.running) return;
    this.running = true;
    this.lastFrame = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      if (document.hidden || !this.visible) {
        this.lastFrame = now;
        return;
      }
      const elapsed = now - this.lastFrame;
      if (elapsed < this.minInterval - 1) return;
      const dt = Math.min(0.1, elapsed / 1000);
      this.lastFrame = now;
      const t0 = performance.now();
      this.renderFrame(dt);
      const cost = performance.now() - t0;
      this.emaCost += (cost - this.emaCost) * 0.1;
      // Máy yếu: hạ xuống 30 khung/giây; khoẻ lại thì lên 60.
      this.minInterval = this.emaCost > 11 ? 33 : this.emaCost < 7 ? 0 : this.minInterval;
      this.fpsAcc += elapsed;
      this.fpsN++;
      if (this.fpsAcc >= 1000) {
        this.stats.fps = Math.round((this.fpsN * 1000) / this.fpsAcc);
        this.stats.frameMs = Math.round(this.emaCost * 10) / 10;
        this.fpsAcc = 0;
        this.fpsN = 0;
      }
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  dispose() {
    this.stop();
    this.loadSeq++;
    this.io?.disconnect();
    this.cleanup.forEach((f) => f());
    this.cleanup = [];
  }

  // ------------------------------------------------------------------ toạ độ
  private tileFootPt(t: Tile): Pt {
    return { x: t.x * TS + TS / 2, y: t.y * TS + TS - 3 };
  }
  private tileOf(p: Pt): Tile {
    return { x: Math.floor(p.x / TS), y: Math.floor((p.y + 2) / TS) };
  }
  /** Điểm chân đứng vào địa điểm (điểm nguồn). */
  private doorPt(poi: Poi): Pt {
    return this.isImg ? { x: poi.door.x, y: poi.door.y } : this.tileFootPt(poi.door);
  }
  private poiRect(poi: Poi): { x: number; y: number; w: number; h: number } {
    if (this.isImg) return poi.hotspot ?? poi.footprint;
    const f = poi.footprint;
    return { x: f.x * TS, y: f.y * TS, w: f.w * TS, h: f.h * TS };
  }
  private walkableAtPt(x: number, y: number): boolean {
    return this.isImg ? isWalkPx(this.imgW!, x, y) : !isBlockedAt(this.world!, Math.floor(x / TS), Math.floor((y + 2) / TS));
  }
  private pxOf(t: Tile): Pt {
    return this.isImg ? { x: t.x, y: t.y } : this.tileFootPt(t);
  }

  // ------------------------------------------------------------------ khởi tạo thực thể
  private spriteIdFor(id: string): string {
    return this.isImg && getSpriteDef(`mini_${id}`) ? `mini_${id}` : id;
  }

  private personBitmaps(id: string): Bitmap[] {
    const sid = this.spriteIdFor(id);
    const n = this.atlas.frameCount(sid);
    const out: Bitmap[] = [];
    for (let i = 0; i < n; i++) out.push(this.atlas.sprite(sid, i)!);
    return out;
  }

  private footRowOf(sid: string, h: number): number {
    if (sid.startsWith('mini_player') || sid.startsWith('mini_npc')) return 12;
    if (sid.startsWith('player') || sid.startsWith('npc_')) return 22;
    return h - 1;
  }

  private initPlayer() {
    const outfit = ((this.state.prefs.outfit % 8) + 8) % 8;
    const sid = this.spriteIdFor(`player_${outfit}`);
    const bmps = this.personBitmaps(`player_${outfit}`);
    let start: Pt;
    if (this.isImg) {
      const s = this.state.city === this.map.id ? this.state.pos : this.map.spawn;
      start = isWalkPx(this.imgW!, s.x, s.y) ? { x: s.x, y: s.y } : { x: this.map.spawn.x, y: this.map.spawn.y };
    } else {
      const s = this.state.city === this.map.id && !isBlockedAt(this.world!, this.state.pos.x, this.state.pos.y) ? this.state.pos : this.map.spawn;
      start = this.tileFootPt(s);
    }
    this.player = {
      kind: 'player',
      bmps,
      x: start.x,
      y: start.y,
      z: 0,
      frame: personFrame('down', 0),
      flip: false,
      footRow: this.footRowOf(sid, bmps[0]?.h ?? 24),
      w: bmps[0]?.w ?? 16,
      h: bmps[0]?.h ?? 24,
      sortY: 0,
      path: [],
      dir: 'down',
      stepT: 0,
      dustT: 0,
      moveAnnounced: true,
    };
  }

  private teleportTile(t: Tile) {
    const p = this.tileFootPt(t);
    this.player.x = p.x;
    this.player.y = p.y;
    this.player.path = [];
    this.cam.snapTo(p.x, p.y - 6, this.view, this.worldW, this.worldH);
  }

  private initNpcs() {
    this.npcs = this.map.npcs.map((n) => {
      const sid = this.spriteIdFor(n.sprite);
      const person = this.atlas.frameCount(sid) >= 12;
      const bmps = this.personBitmaps(n.sprite);
      const at = this.pxOf(n.at);
      const route = n.path && n.path.length > 0 ? [at, ...n.path.map((p) => this.pxOf(p))] : [at];
      return {
        kind: 'npc',
        bmps,
        x: at.x,
        y: at.y,
        z: 0,
        frame: person ? personFrame('down', 0) : 0,
        flip: false,
        footRow: this.footRowOf(sid, bmps[0]?.h ?? 16),
        w: bmps[0]?.w ?? 16,
        h: bmps[0]?.h ?? 24,
        sortY: 0,
        npc: n,
        route,
        ri: 0,
        wait: 1 + (hash2(n.at.x, n.at.y, 3) % 30) / 10,
        dir: 'down' as Dir,
        walking: false,
        line: 0,
        person,
      };
    });
  }

  private initAnimals() {
    this.pigeons = [];
    const spots: Pt[] = [];
    if (this.isImg) {
      const w = this.imgW!;
      const stride = Math.max(7, Math.floor(w.walkCells.length / 6));
      for (let i = 11; i < w.walkCells.length && spots.length < 5; i += stride) {
        const c = w.walkCells[i]!;
        spots.push({ x: (c % w.mw) * w.cell + 1, y: Math.floor(c / w.mw) * w.cell + 1 });
      }
    } else {
      const wd = this.world!;
      for (let y = 1; y < wd.h - 1 && spots.length < 5; y++)
        for (let x = 1; x < wd.w - 1 && spots.length < 5; x++) {
          const g = wd.ground[y]?.[x];
          if ((g === 'P' || g === 'p' || g === 'c') && !isBlockedAt(wd, x, y) && hash2(x, y, 41) % 100 < 2) spots.push({ x: x * TS + 3, y: y * TS + 8 });
        }
    }
    const pre = this.isImg ? 'mini_' : '';
    const bm = [this.atlas.sprite(`${pre}pigeon_walk`, 0), this.atlas.sprite(`${pre}pigeon_walk`, 1), this.atlas.sprite(`${pre}pigeon_fly`, 0), this.atlas.sprite(`${pre}pigeon_fly`, 1)];
    if (bm.some((b) => !b)) return;
    for (const s of spots) {
      for (let i = 0; i < 3; i++) {
        const x = s.x + (hash2(s.x, s.y, i) % (this.isImg ? 7 : 11));
        const y = s.y + (hash2(s.y, s.x, i) % (this.isImg ? 4 : 7));
        if (!this.walkableAtPt(x, y)) continue;
        this.pigeons.push({
          kind: 'animal',
          bmps: bm as Bitmap[],
          x,
          y,
          z: 0,
          frame: 0,
          flip: hash2(i, s.x, 2) % 2 === 0,
          footRow: this.isImg ? 5 : 11,
          w: 14,
          h: 12,
          sortY: y,
          home: { x, y },
          mode: 0,
          t: (hash2(x, y, 6) % 100) / 40,
          vx: 0,
          vy: 0,
          hide: 0,
        });
      }
    }
  }

  private initVehicles() {
    this.vehicles = [];
    for (const r of this.map.routes ?? []) {
      const def = this.atlas.sprite(r.sprite, 0);
      if (!def) continue;
      const pts: Pt[] = r.path.map((p) => (this.isImg ? { x: p.x, y: p.y } : { x: p.x * TS + TS / 2, y: p.y * TS + TS - 2 }));
      const cum = [0];
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1]! + Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.y - pts[i - 1]!.y));
      const len = cum[cum.length - 1]!;
      if (len <= 0) continue;
      const n = Math.max(1, r.count ?? 1);
      for (let i = 0; i < n; i++) {
        this.vehicles.push({
          kind: 'vehicle',
          bmps: [def],
          x: pts[0]!.x,
          y: pts[0]!.y,
          z: 0,
          frame: 0,
          flip: false,
          footRow: def.h - 1,
          w: def.w,
          h: def.h,
          sortY: 0,
          route: r,
          pts,
          cum,
          len,
          s: (len / n) * i,
          dir: 1,
          sky: r.layer === 'sky',
          sp: r.speed * TS,
        });
      }
    }
  }

  // ------------------------------------------------------------------ giờ & thời tiết
  private tickClock(force = false) {
    const now = Date.now();
    if (!force && now - this.lastClockAt < 1000) return;
    this.lastClockAt = now;
    const lt = localTime(this.map.id, now);
    this.hour = this.opts.hour ?? lt.hourFloat;
    this.dayKey = lt.dayKey;
    const plan = weatherPlan(this.map.id, this.hour, this.dayKey);
    // Tranh nền có thể đã vẽ sẵn mưa (London): khi lịch thời tiết báo nắng mà bản đồ khai khí hậu mưa thì theo bản đồ.
    this.weather = this.opts.weather ?? (plan.kind === 'clear' && this.map.ambience.weather.kind !== 'clear' ? this.map.ambience.weather : plan);
    this.darkness = 1 - daylight(this.hour);
    const night = this.night ? this.darkness > 0.3 : this.darkness > 0.45;
    if (night !== this.night) {
      this.night = night;
      if (this.staticCv) this.rebuildStatic();
    }
  }

  // ------------------------------------------------------------------ tầng tĩnh (chế độ ô)
  private rebuildStatic() {
    if (!this.world) return;
    const { w, h } = this.world;
    const cv = this.staticCv ?? makeCanvas(w * TS, h * TS);
    this.staticCv = cv;
    const c = ctx2d(cv);
    c.clearRect(0, 0, w * TS, h * TS);
    const A = this.atlas;
    for (let y = 0; y < h; y++) {
      const row = this.world.ground[y] ?? '';
      for (let x = 0; x < w; x++) {
        const g = row[x] ?? 'g';
        const def = GROUND_CHARS[g] ?? GROUND_CHARS.g!;
        const hv = hash2(x, y, 11);
        const v = def.variants ? def.variants[hv % def.variants.length]! : hv % 8;
        c.drawImage(A.tile(def.kind, v).src as CanvasImageSource, x * TS, y * TS);
      }
    }
    c.fillStyle = 'rgba(15,29,51,0.22)';
    for (const t of this.world.covers) c.fillRect(t.x * TS, t.y * TS, TS, TS);
    for (const p of this.world.placed) {
      if (!p.flat) continue;
      const b = A.sprite(p.sprite, 0);
      if (b) c.drawImage(b.src as CanvasImageSource, Math.round(p.px - b.w / 2), Math.round(p.py - b.h));
    }
    if (this.night) {
      c.fillStyle = 'rgba(255,225,150,0.22)';
      for (const L of this.world.lights) {
        const cx = Math.round(L.x);
        const cy = Math.round(L.y) + 12;
        const r = Math.min(26, L.r * 0.55);
        for (let y = -6; y <= 6; y++)
          for (let x = -r; x <= r; x++) {
            if ((x * x) / (r * r) + (y * y) / 36 > 1) continue;
            if ((x + y) & 1) continue;
            c.fillRect(cx + x, cy + y, 1, 1);
          }
      }
    }
    if (this.world.covers.length) {
      const rc = this.roofCv ?? makeCanvas(w * TS, h * TS);
      this.roofCv = rc;
      const r = ctx2d(rc);
      r.clearRect(0, 0, w * TS, h * TS);
      for (const t of this.world.covers) {
        const x = t.x * TS;
        const y = t.y * TS;
        r.fillStyle = this.rgbs('W');
        r.fillRect(x, y + 1, TS, TS - 3);
        r.fillStyle = this.rgbs('b');
        r.fillRect(x, y + TS - 3, TS, 2);
        r.fillStyle = this.rgbs('p');
        for (let i = 0; i < TS; i += 4) r.fillRect(x + i, y + 1, 2, TS - 3);
        r.fillStyle = this.rgbs('o');
        r.fillRect(x, y + TS - 1, TS, 1);
      }
    } else this.roofCv = null;
  }

  private rgbs(ch: string): string {
    return this.atlas.pal.colors[ch] ?? '#000';
  }

  // ------------------------------------------------------------------ cập nhật
  private update(dt: number) {
    this.t += dt;
    this.tickClock();
    const calm = this.opts.reducedMotion;
    const wTarget = this.weather.kind === 'rain' || this.weather.kind === 'drizzle' || this.weather.kind === 'shower-evening' ? this.weather.intensity : 0;
    this.wet += (wTarget - this.wet) * Math.min(1, dt * 0.6);

    this.updatePlayer(dt);
    if (!calm) {
      this.updateNpcs(dt);
      this.updatePigeons(dt);
      this.updateVehicles(dt);
      this.updateBirds(dt);
    } else this.updateVehicles(0);
    this.updateEffects(dt);
    this.particles.update(dt);
    if (this.bubble && this.t * 1000 > this.bubble.until) this.bubble = null;
    this.cam.update(dt, this.player.x, this.player.y - 6, this.view, this.worldW, this.worldH);
    if (this.enterLock) {
      const poi = this.map.pois.find((q) => q.id === this.enterLock);
      if (poi) {
        const d = this.doorPt(poi);
        if (Math.hypot(d.x - this.player.x, d.y - this.player.y) > (this.isImg ? 12 : 14)) this.enterLock = null;
      }
    }
  }

  private dirTo(dx: number, dy: number): Dir {
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
  }

  private speed(): number {
    return this.isImg ? 34 : 60;
  }

  private updatePlayer(dt: number) {
    const p = this.player;
    const held = this.keys.length ? this.keys[this.keys.length - 1]! : null;
    if (this.isImg) {
      // Ảnh: đi mượt theo phím; chạm thì theo đường đã dựng.
      if (held) {
        p.path.length = 0;
        this.pendingEnter = null;
        let dx = 0;
        let dy = 0;
        for (const k of this.keys) {
          dx += DVEC[k][0];
          dy += DVEC[k][1];
        }
        const len = Math.hypot(dx, dy);
        if (len > 0) {
          dx /= len;
          dy /= len;
          const s = this.speed() * dt;
          const w = this.imgW!;
          let moved = false;
          if (isWalkPx(w, p.x + dx * s, p.y + dy * s)) {
            p.x += dx * s;
            p.y += dy * s;
            moved = true;
          } else if (dx && isWalkPx(w, p.x + dx * s, p.y)) {
            p.x += dx * s;
            moved = true;
          } else if (dy && isWalkPx(w, p.x, p.y + dy * s)) {
            p.y += dy * s;
            moved = true;
          }
          p.dir = this.dirTo(dx, dy);
          if (moved) p.moveAnnounced = false;
          this.walkAnim(p, dt, moved);
          return;
        }
      }
    } else if (p.path.length === 0 && held) {
      p.dir = held;
      const [dx, dy] = DVEC[held];
      const t = this.tileOf(p);
      const nx = t.x + dx;
      const ny = t.y + dy;
      if (!isBlockedAt(this.world!, nx, ny)) {
        p.path = [this.tileFootPt({ x: nx, y: ny })];
        this.pendingEnter = null;
      } else if (held === 'up') this.tryEnterNear(true);
    }
    if (p.path.length === 0) {
      p.frame = personFrame(p.dir, 0);
      p.stepT = 0;
      if (!p.moveAnnounced) {
        p.moveAnnounced = true;
        this.cbs.onMove(this.isImg ? { x: Math.round(p.x), y: Math.round(p.y) } : this.tileOf(p));
        if (this.pendingEnter) {
          const id = this.pendingEnter;
          this.pendingEnter = null;
          this.tryEnterNear(false, id);
        }
      }
      return;
    }
    p.moveAnnounced = false;
    const next = p.path[0]!;
    const dx = next.x - p.x;
    const dy = next.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.01) p.dir = this.dirTo(dx, dy);
    const step = this.speed() * dt;
    if (dist <= step) {
      p.x = next.x;
      p.y = next.y;
      p.path.shift();
    } else {
      p.x += (dx / dist) * step;
      p.y += (dy / dist) * step;
    }
    this.walkAnim(p, dt, true);
  }

  private walkAnim(p: Player, dt: number, moving: boolean) {
    if (!moving) {
      p.frame = personFrame(p.dir, 0);
      return;
    }
    p.stepT += dt;
    const cyc = Math.floor(p.stepT * 8) % 4;
    p.frame = personFrame(p.dir, cyc === 1 ? 1 : cyc === 3 ? 2 : 0);
    p.dustT -= dt;
    if (p.dustT <= 0 && !this.opts.reducedMotion) {
      p.dustT = 0.22;
      const t = this.isImg ? null : this.tileOf(p);
      const g = t ? (this.world!.ground[t.y]?.[t.x] ?? '.') : '.';
      if (!'dFCt'.includes(g)) this.particles.emit(PK.Dust, p.x + (Math.random() - 0.5) * 3, p.y - 1, (Math.random() - 0.5) * 8 * this.u, (-6 - Math.random() * 4) * this.u, 0.45);
    }
  }

  /** Vào địa điểm nếu đang đứng ở (hoặc rất gần) cửa của nó. */
  private tryEnterNear(bump: boolean, id?: string) {
    const p = this.player;
    const reach = this.isImg ? 10 : 9;
    let target: Poi | undefined;
    let bd = Infinity;
    for (const poi of this.map.pois) {
      if (id && poi.id !== id) continue;
      const d = this.doorPt(poi);
      const dist = Math.hypot(d.x - p.x, d.y - p.y);
      if (dist <= reach && dist < bd) {
        bd = dist;
        target = poi;
      }
    }
    if (!target) return;
    if (this.enterLock === target.id && !bump) return;
    if (isPoiLocked(target, this.state)) {
      this.showLocked(target);
      return;
    }
    this.enterLock = target.id;
    this.cbs.onEnterPoi(target.id);
  }

  private showLocked(poi: Poi) {
    const after = poi.unlock?.after ? this.map.pois.find((q) => q.id === poi.unlock!.after) : undefined;
    const vi = this.opts.locale === 'vi';
    const name = after ? (vi ? after.name.vi : after.name.en) : '';
    this.toast = {
      text: this.opts.strings?.locked ?? (vi ? `Đã khoá — hãy hoàn thành ${name} trước` : `Locked — finish ${name} first`),
      until: this.t * 1000 + 2600,
    };
  }

  /** Đặt đường tới điểm `to` (chạm / bấm). Trả về true nếu có đường. */
  private goTo(to: Pt, enterPoi?: string): boolean {
    const p = this.player;
    const from: Pt = p.path.length ? p.path[0]! : { x: p.x, y: p.y };
    let pts: Pt[] | null;
    if (this.isImg) {
      pts = findPathPx(this.imgW!, from, to);
    } else {
      const wd = this.world!;
      const f = this.tileOf(from);
      const t = { x: Math.floor(to.x / TS), y: Math.floor((to.y + 2) / TS) };
      const path = findPath(pathField(wd), f, t, { allowBlockedGoal: true });
      if (path) while (path.length && isBlockedAt(wd, path[path.length - 1]!.x, path[path.length - 1]!.y)) path.pop();
      pts = path ? path.map((tt) => this.tileFootPt(tt)) : null;
    }
    if (!pts) return false;
    p.path = (p.path.length ? [p.path[0]!] : []).concat(pts);
    this.pendingEnter = enterPoi ?? null;
    p.moveAnnounced = false;
    this.bubble = null;
    return true;
  }

  private updateNpcs(dt: number) {
    const p = this.player;
    for (const n of this.npcs) {
      if (n.route.length > 1) {
        if (n.wait > 0) {
          n.wait -= dt;
          n.walking = false;
        } else {
          const to = n.route[(n.ri + 1) % n.route.length]!;
          const dx = to.x - n.x;
          const dy = to.y - n.y;
          const d = Math.hypot(dx, dy);
          const sp = (this.isImg ? 13 : 20) * dt;
          n.dir = this.dirTo(dx, dy);
          n.walking = true;
          if (d <= sp) {
            n.x = to.x;
            n.y = to.y;
            n.ri = (n.ri + 1) % n.route.length;
            if (hash2(n.ri, n.npc.at.x, 5) % 3 === 0) n.wait = 1.5 + (hash2(n.ri, n.npc.at.y, 2) % 20) / 10;
          } else {
            n.x += (dx / d) * sp;
            n.y += (dy / d) * sp;
          }
        }
      } else if (n.person) {
        const dx = p.x - n.x;
        const dy = p.y - n.y;
        const r = 40 * this.u;
        if (dx * dx + dy * dy < r * r) n.dir = this.dirTo(dx, dy);
        n.walking = false;
      }
      if (n.person) {
        const cyc = n.walking ? Math.floor(this.t * 6 + n.npc.at.x) % 4 : 0;
        n.frame = personFrame(n.dir, cyc === 1 ? 1 : cyc === 3 ? 2 : 0);
      } else n.frame = n.walking ? Math.floor(this.t * 4) % n.bmps.length : 0;
    }
  }

  private updatePigeons(dt: number) {
    const p = this.player;
    const u = this.u;
    for (const g of this.pigeons) {
      g.t += dt;
      if (g.mode === 0) {
        g.frame = Math.floor(g.t * 2 + g.home.x) % 2 === 0 ? 0 : 1;
        const dx = g.x - p.x;
        const dy = g.y - p.y;
        const r = 34 * u;
        if (dx * dx + dy * dy < r * r) {
          g.mode = 1;
          g.t = 0;
          const d = Math.hypot(dx, dy) || 1;
          g.vx = ((dx / d) * 40 + (hash2(g.home.x, g.home.y, 8) % 20) - 10) * u;
          g.vy = ((dy / d) * 14 - 12) * u;
          g.flip = g.vx < 0;
        }
      } else if (g.mode === 1) {
        g.x += g.vx * dt;
        g.y += g.vy * dt * 0.4;
        g.z += 34 * u * dt * (g.t < 1.2 ? 1 : 0.4);
        g.frame = 2 + (Math.floor(g.t * 10) % 2);
        if (g.t > 2.4) {
          g.mode = 2;
          g.hide = 14;
        }
      } else {
        g.hide -= dt;
        if (g.hide <= 0) {
          g.mode = 0;
          g.x = g.home.x;
          g.y = g.home.y;
          g.z = 0;
          g.t = 0;
        }
      }
      g.sortY = g.y + (g.mode === 1 ? 40 : 0);
    }
  }

  private updateVehicles(dt: number) {
    for (const v of this.vehicles) {
      v.s += v.sp * dt * v.dir;
      if (v.route.loop) {
        if (v.s >= v.len) v.s -= v.len;
        if (v.s < 0) v.s += v.len;
      } else if (v.s >= v.len) {
        v.s = v.len;
        v.dir = -1;
      } else if (v.s <= 0) {
        v.s = 0;
        v.dir = 1;
      }
      let i = 1;
      while (i < v.cum.length - 1 && v.cum[i]! < v.s) i++;
      const a = v.pts[i - 1]!;
      const b = v.pts[i]!;
      const seg = v.cum[i]! - v.cum[i - 1]!;
      const t = seg > 0 ? (v.s - v.cum[i - 1]!) / seg : 0;
      v.x = a.x + (b.x - a.x) * t;
      v.y = a.y + (b.y - a.y) * t;
      const heading = (b.x - a.x) * v.dir;
      if (Math.abs(b.x - a.x) > 0.5) v.flip = heading < 0;
      v.sortY = v.y;
      v.z = v.sky ? (this.isImg ? 44 : 70) : 0;
    }
  }

  private updateBirds(dt: number) {
    const W = this.view.W;
    if (this.birds.length === 0 && hash2(Math.floor(this.t * 0.3), 7, 1) % 16 === 0 && Math.floor(this.t * 10) % 7 === 0) {
      const dir = hash2(Math.floor(this.t), 3, 3) % 2 ? 1 : -1;
      this.birds.push({ x: dir > 0 ? this.cam.ix - 20 : this.cam.ix + W + 20, y: this.cam.iy + 20 + (hash2(Math.floor(this.t), 5, 9) % 60), vx: dir * 38 * this.u, t: 0 });
    }
    for (let i = this.birds.length - 1; i >= 0; i--) {
      const b = this.birds[i]!;
      b.x += b.vx * dt;
      b.t += dt;
      if (b.x < this.cam.ix - 40 || b.x > this.cam.ix + W + 40) this.birds.splice(i, 1);
    }
  }

  private updateEffects(dt: number) {
    const calm = this.opts.reducedMotion;
    const v = this.view;
    if (!calm && this.wet > 0.05) {
      const want = Math.round(this.wet * (this.weather.kind === 'drizzle' ? 38 : 80));
      let guard = 0;
      while (this.particles.rain < want && guard++ < 6) {
        const sp = this.weather.kind === 'drizzle' ? 70 : 150;
        this.particles.emit(PK.Rain, Math.random() * (v.W + 40), -6 - Math.random() * 20, -sp * 0.25, sp, ((v.H + 10) / sp) * (0.5 + Math.random() * 0.5));
      }
      if (this.wet > 0.1 && Math.random() < dt * 3) this.emitRing();
    }
    this.sparkleT -= dt;
    if (this.sparkleT <= 0 && !calm) {
      this.sparkleT = 0.5;
      for (const poi of this.map.pois) {
        if (isPoiLocked(poi, this.state)) continue;
        if ((this.state.poi[poi.id]?.best ?? 0) > 0) continue;
        const d = this.doorPt(poi);
        const dx = d.x - this.player.x;
        const dy = d.y - this.player.y;
        const R = this.isImg ? 140 : 220;
        if (dx * dx + dy * dy > R * R) continue;
        const sz = this.isImg ? 8 : 12;
        this.particles.emit(PK.Sparkle, d.x - sz / 2 + Math.random() * sz, d.y - 6 + Math.random() * 6, 0, -10 * this.u, 0.9);
      }
    }
    // Pháo hoa quanh 20:00 (Marina Bay)
    if (!calm && this.map.id === 'singapore' && this.hour >= 19.85 && this.hour < 20.4) {
      this.fireworkT -= dt;
      const mbs = this.map.pois.find((q) => q.id === 'singapore-mbs');
      if (this.fireworkT <= 0 && mbs) {
        this.fireworkT = 1.1 + Math.random() * 0.8;
        const r = this.poiRect(mbs);
        const cx = r.x + r.w / 2 + (Math.random() - 0.5) * (this.isImg ? 90 : 120);
        const cy = this.isImg ? r.y - 6 - Math.random() * 14 : r.y + r.h - 120 - Math.random() * 30;
        const tint = (Math.random() * 4) | 0;
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * Math.PI * 2;
          const s = (26 + Math.random() * 14) * this.u;
          this.particles.emit(PK.Spark, cx, cy, Math.cos(a) * s, Math.sin(a) * s, 0.9 + Math.random() * 0.4, tint);
        }
      }
    }
    if (!calm && this.weather.kind === 'wind' && Math.random() < dt * 2.5) {
      this.particles.emit(PK.Leaf, this.cam.ix - 4, this.cam.iy + Math.random() * v.H, 40 + Math.random() * 30, 6 + Math.random() * 10, 3.5);
    }
  }

  private emitRing() {
    if (this.isImg) {
      const w = this.imgW!;
      if (!w.walkCells.length) return;
      const c = w.walkCells[(Math.random() * w.walkCells.length) | 0]!;
      this.particles.emit(PK.Ring, (c % w.mw) * w.cell + 1, Math.floor(c / w.mw) * w.cell + 1, 0, 0, 0.7);
    } else {
      const pd = this.world!.puddles[(Math.random() * this.world!.puddles.length) | 0];
      if (pd) this.particles.emit(PK.Ring, pd.x * TS + 8, pd.y * TS + 10, 0, 0, 0.7);
    }
  }

  private coinBurst() {
    if (this.opts.reducedMotion) return;
    const top = this.player.y - this.player.footRow - 4;
    for (let i = 0; i < 8; i++) this.particles.emit(PK.Coin, this.player.x + (Math.random() - 0.5) * 10, top, (Math.random() - 0.5) * 50, -70 - Math.random() * 40, 0.9);
  }

  // ------------------------------------------------------------------ vẽ
  private renderFrame(dt: number) {
    if (!this.world && !this.imgW) return;
    if (dt > 0) this.update(dt);
    const v = this.view;
    const c = this.loCtx;
    const camX = this.cam.ix;
    const camY = this.cam.iy;
    const A = this.atlas;
    const calm = this.opts.reducedMotion;
    const tt = calm ? 0 : this.t;

    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;
    c.fillStyle = this.isImg ? this.bgColor : '#141b2c';
    c.fillRect(0, 0, v.W, v.H);

    const mapW = this.worldW;
    const mapH = this.worldH;
    const blitRegion = (src: CanvasImageSource) => {
      const sx = Math.max(0, camX);
      const sy = Math.max(0, camY);
      const ex = Math.min(mapW, camX + v.W);
      const ey = Math.min(mapH, camY + v.H);
      if (ex > sx && ey > sy) c.drawImage(src, sx, sy, ex - sx, ey - sy, sx - camX, sy - camY, ex - sx, ey - sy);
    };

    // 1. nền
    if (this.isImg) {
      if (this.bg) blitRegion(this.bg);
    } else if (this.staticCv) blitRegion(this.staticCv as CanvasImageSource);

    // 2. nước, vũng, vòng cửa
    if (this.isImg) this.drawWaterImg(c, camX, camY, tt);
    else this.drawWater(c, camX, camY, tt);
    if (!this.isImg && this.wet > 0.08) this.drawPuddles(c, camX, camY);
    this.drawDoorMarks(c, camX, camY, tt);
    for (const vh of this.vehicles) {
      if (!vh.sky) continue;
      const sh = A.sprite(this.isImg ? 'mini_plane_shadow' : 'plane_shadow', 0);
      if (sh) c.drawImage(sh.src as CanvasImageSource, Math.round(vh.x - sh.w / 2 - camX), Math.round(vh.y + vh.z - sh.h / 2 - camY));
    }

    // 3. vật & người xếp theo y
    const list = this.list;
    list.length = 0;
    const night = this.night;
    if (this.world) {
      for (const p of this.world.placed) {
        if (p.flat) continue;
        if (p.px + p.w / 2 < camX - 16 || p.px - p.w / 2 > camX + v.W + 16 || p.py < camY - 16 || p.py - p.h > camY + v.H + 16) continue;
        list.push(p);
      }
    }
    const P = this.player;
    P.sortY = P.y;
    list.push(P);
    for (const n of this.npcs) {
      n.sortY = n.y;
      list.push(n);
    }
    for (const g of this.pigeons) if (g.mode !== 2) list.push(g);
    for (const vh of this.vehicles) if (!vh.sky) list.push(vh);
    list.sort(cmpSort);
    for (let i = 0; i < list.length; i++) {
      const it = list[i]!;
      if ('kind' in it) this.drawEnt(c, it, camX, camY);
      else this.drawPlaced(c, it, camX, camY, night, tt);
    }
    this.stats.drawn = list.length;

    // 4. vùng che (ảnh) / mái che (ô)
    if (this.isImg) {
      const occ = this.map.image!.occluders;
      if (occ && this.bg)
        for (const o of occ) {
          if (P.y >= o.baseY) continue;
          c.drawImage(this.bg, o.x, o.y, o.w, o.h, o.x - camX, o.y - camY, o.w, o.h);
        }
    } else if (this.roofCv) blitRegion(this.roofCv as CanvasImageSource);
    for (const vh of this.vehicles) if (vh.sky) this.drawEnt(c, vh, camX, camY);
    for (const b of this.birds) {
      const bm = A.sprite(this.isImg ? 'mini_bird_fly' : 'bird_fly', Math.floor(b.t * 8) % 2);
      if (!bm) continue;
      const x = Math.round(b.x - camX - bm.w / 2);
      const y = Math.round(b.y - camY);
      if (b.vx < 0) c.drawImage(bm.src as CanvasImageSource, x, y);
      else {
        c.save();
        c.translate(x + bm.w, y);
        c.scale(-1, 1);
        c.drawImage(bm.src as CanvasImageSource, 0, 0);
        c.restore();
      }
    }

    // 5. bóng mây
    this.drawClouds(c, camX, camY, tt);

    // 6. sương mù
    if (this.weather.kind === 'fog') {
      c.globalAlpha = 0.22 + 0.1 * this.weather.intensity;
      c.fillStyle = '#dfe6ea';
      c.fillRect(0, 0, v.W, v.H);
      c.globalAlpha = 1;
    }

    // 7. ánh sáng (ảnh: nhẹ tay hơn — tranh đã có sẵn ánh sáng riêng)
    const lights = this.lights;
    let nl = 0;
    if (this.darkness > 0.2) {
      const push = (x: number, y: number, r: number, warm: number) => {
        if (x + r < 0 || y + r < 0 || x - r > v.W || y - r > v.H) return;
        let L = lights[nl];
        if (!L) {
          L = { x: 0, y: 0, r: 0, warm: 0 };
          lights[nl] = L;
        }
        L.x = x;
        L.y = y;
        L.r = r;
        L.warm = warm;
        nl++;
      };
      if (this.world) for (const L of this.world.lights) push(Math.round(L.x - camX), Math.round(L.y - camY), L.r, L.warm);
      if (this.isImg) for (const L of this.map.image!.lights ?? []) push(Math.round(L.x - camX), Math.round(L.y - camY), L.r, 1);
      push(Math.round(P.x - camX), Math.round(P.y - camY - 6), this.isImg ? 14 : 26, 1);
    }
    ambientAt(this.hour, A.pal.ambient, this.wet > 0.05 ? { kind: 'rain', intensity: this.wet } : this.weather.kind === 'fog' ? this.weather : undefined, this.amb);
    if (this.isImg) {
      // Tranh đã có ánh sáng riêng: ban đêm chỉ tối tối đa ~35% (mỗi kênh ≥ 166/255) để vẫn đọc rõ tranh;
      // quầng đèn vẫn sáng lên trên nền đó.
      const minC = Math.min(this.amb[0], this.amb[1], this.amb[2]);
      const k = minC < 166 ? (166 - minC) / (255 - minC) : 0;
      this.amb[0] += (255 - this.amb[0]) * k;
      this.amb[1] += (255 - this.amb[1]) * k;
      this.amb[2] += (255 - this.amb[2]) * k;
    }
    this.lighting.apply(c, this.amb, lights, nl, this.darkness, A);
    this.lighting.bloom(c, lights, nl, this.darkness, A);

    // 8. hạt + laser
    this.drawLasers(c, camX, camY);
    this.drawParticles(c, camX, camY);
    // Ảnh: mọi hiệu ứng (mây, mưa, máy bay, ánh sáng) không tràn ra dải viền ngoài tranh.
    if (this.isImg) {
      const x0 = -camX;
      const y0 = -camY;
      const x1 = this.imgW!.w - camX;
      const y1 = this.imgW!.h - camY;
      c.fillStyle = this.bgColor;
      if (y0 > 0) c.fillRect(0, 0, v.W, y0);
      if (y1 < v.H) c.fillRect(0, Math.max(0, y1), v.W, v.H - Math.max(0, y1));
      if (x0 > 0) c.fillRect(0, 0, x0, v.H);
      if (x1 < v.W) c.fillRect(Math.max(0, x1), 0, v.W - Math.max(0, x1), v.H);
    }
    if (this.debugOn()) this.drawDebug(c, camX, camY);

    // 9. phóng nguyên lần + chữ
    const d = this.dctx;
    d.imageSmoothingEnabled = false;
    d.fillStyle = this.isImg ? this.bgColor : '#141b2c';
    if (v.offX > 0 || v.offY > 0 || v.W * v.k !== v.devW || v.H * v.k !== v.devH) d.fillRect(0, 0, v.devW, v.devH);
    d.drawImage(this.lo as CanvasImageSource, 0, 0, v.W, v.H, v.offX, v.offY, v.W * v.k, v.H * v.k);
    this.drawOverlay(d, camX, camY);
    this.stats.particles = this.particles.n;
  }

  private debugOn(): boolean {
    return !!this.opts.debug && typeof __DEV__ !== 'undefined' && __DEV__;
  }

  /** Lớp gỡ lỗi: vùng đi được (xanh), nước (xanh dương nhạt), vùng chạm (đỏ), cửa (vàng), tuyến NPC/xe. */
  private drawDebug(c: CanvasRenderingContext2D, camX: number, camY: number) {
    const v = this.view;
    if (this.isImg) {
      const w = this.imgW!;
      c.fillStyle = 'rgba(40,255,120,0.28)';
      const i0 = Math.max(0, Math.floor(camX / w.cell));
      const i1 = Math.min(w.mw - 1, Math.ceil((camX + v.W) / w.cell));
      const j0 = Math.max(0, Math.floor(camY / w.cell));
      const j1 = Math.min(w.mh - 1, Math.ceil((camY + v.H) / w.cell));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (w.walk[j * w.mw + i]) c.fillRect(i * w.cell - camX, j * w.cell - camY, w.cell, w.cell);
      c.fillStyle = 'rgba(80,160,255,0.16)';
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (w.water[j * w.mw + i]) c.fillRect(i * w.cell - camX, j * w.cell - camY, w.cell, w.cell);
    } else {
      const wd = this.world!;
      c.fillStyle = 'rgba(255,40,40,0.22)';
      const x0 = Math.max(0, Math.floor(camX / TS));
      const x1 = Math.min(wd.w - 1, Math.ceil((camX + v.W) / TS));
      const y0 = Math.max(0, Math.floor(camY / TS));
      const y1 = Math.min(wd.h - 1, Math.ceil((camY + v.H) / TS));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (wd.blocked[y * wd.w + x]) c.fillRect(x * TS - camX, y * TS - camY, TS, TS);
    }
    for (const poi of this.map.pois) {
      const r = this.poiRect(poi);
      c.strokeStyle = 'rgba(255,60,60,0.95)';
      c.lineWidth = 1;
      c.strokeRect(r.x - camX + 0.5, r.y - camY + 0.5, r.w - 1, r.h - 1);
      const d = this.doorPt(poi);
      c.fillStyle = '#ffe14a';
      c.fillRect(Math.round(d.x - camX) - 2, Math.round(d.y - camY), 5, 1);
      c.fillRect(Math.round(d.x - camX), Math.round(d.y - camY) - 2, 1, 5);
    }
    c.strokeStyle = 'rgba(255,255,255,0.6)';
    for (const n of this.npcs) {
      if (n.route.length < 2) continue;
      c.beginPath();
      n.route.forEach((p, i) => (i ? c.lineTo(p.x - camX + 0.5, p.y - camY + 0.5) : c.moveTo(p.x - camX + 0.5, p.y - camY + 0.5)));
      c.stroke();
    }
    c.strokeStyle = 'rgba(255,160,40,0.7)';
    for (const r of this.map.routes ?? []) {
      c.beginPath();
      r.path.forEach((p0, i) => {
        const p = this.isImg ? p0 : { x: p0.x * TS + 8, y: p0.y * TS + 8 };
        if (i) c.lineTo(p.x - camX + 0.5, p.y - camY + 0.5);
        else c.moveTo(p.x - camX + 0.5, p.y - camY + 0.5);
      });
      c.stroke();
    }
    c.strokeStyle = 'rgba(0,255,255,0.9)';
    if (this.player.path.length) {
      c.beginPath();
      c.moveTo(this.player.x - camX + 0.5, this.player.y - camY + 0.5);
      for (const p of this.player.path) c.lineTo(p.x - camX + 0.5, p.y - camY + 0.5);
      c.stroke();
    }
  }

  private drawPuddles(c: CanvasRenderingContext2D, camX: number, camY: number) {
    const v = this.view;
    const pb = this.atlas.sprite('puddle', 0);
    if (!pb || !this.world) return;
    c.globalAlpha = Math.min(0.85, this.wet * 1.3);
    for (const pd of this.world.puddles) {
      const x = pd.x * TS + 1 - camX;
      const y = pd.y * TS + 5 - camY;
      if (x < -16 || y < -8 || x > v.W || y > v.H) continue;
      c.drawImage(pb.src as CanvasImageSource, x, y);
    }
    c.globalAlpha = 1;
  }

  /** Chế độ ảnh: lấp lánh + gợn trôi trên các ô nước (đã khoanh trong lưới thô). */
  private drawWaterImg(c: CanvasRenderingContext2D, camX: number, camY: number, tt: number) {
    const w = this.imgW!;
    const v = this.view;
    const cells = w.waterCells;
    c.fillStyle = 'rgba(190,235,230,0.5)';
    for (let n = 0; n < cells.length; n++) {
      const ci = cells[n]!;
      const h = hash2(ci, 3, 17);
      if (h % 9 !== 0) continue;
      const x = (ci % w.mw) * w.cell;
      const y = Math.floor(ci / w.mw) * w.cell;
      if (x < camX - 4 || x > camX + v.W || y < camY - 4 || y > camY + v.H) continue;
      const ph = (tt * 0.8 + (h % 100) / 33) % 3;
      if (ph < 0.45) c.fillRect(x - camX, y - camY, 3, 1);
      else if (ph < 0.8) c.fillRect(x - camX + 1, y - camY, 1, 1);
    }
    c.fillStyle = 'rgba(8,48,66,0.35)';
    for (let n = 0; n < cells.length; n++) {
      const ci = cells[n]!;
      const h = hash2(ci, 5, 29);
      if (h % 13 !== 0) continue;
      const x = (ci % w.mw) * w.cell;
      const y = Math.floor(ci / w.mw) * w.cell;
      if (x < camX - 8 || x > camX + v.W || y < camY - 4 || y > camY + v.H) continue;
      const off = Math.floor(tt * 2 + (h % 8)) % 8;
      c.fillRect(x - camX + off - 4, y - camY, 4, 1);
    }
  }

  private drawWater(c: CanvasRenderingContext2D, camX: number, camY: number, tt: number) {
    const wd = this.world!;
    const v = this.view;
    const A = this.atlas;
    const x0 = Math.floor(camX / TS) - 1;
    const x1 = Math.ceil((camX + v.W) / TS);
    const y0 = Math.floor(camY / TS) - 1;
    const y1 = Math.ceil((camY + v.H) / TS);
    const water = wd.water;
    c.fillStyle = this.rgbs('A');
    for (let i = 0; i < water.length; i++) {
      const w = water[i]!;
      if (w.x < x0 || w.x > x1 || w.y < y0 || w.y > y1) continue;
      const h = hash2(w.x, w.y, 21);
      if (h % 3 !== 0) continue;
      const off = Math.floor(tt * 3 + (h % 16)) % 16;
      c.fillRect(w.x * TS + off - camX, w.y * TS + (h % 11) + 2 - camY, 4, 1);
    }
    c.fillStyle = this.rgbs('w');
    for (let i = 0; i < water.length; i++) {
      const w = water[i]!;
      if (w.x < x0 || w.x > x1 || w.y < y0 || w.y > y1) continue;
      const h = hash2(w.x, w.y, 33);
      if (h % 4 !== 0) continue;
      const ph = (tt * 0.9 + (h % 100) / 25) % 3;
      if (ph < 0.35) c.fillRect(w.x * TS + (h % 13) + 1 - camX, w.y * TS + ((h >> 4) % 13) + 1 - camY, 2, 1);
    }
    const f = Math.floor(tt * 1.6) % 2 === 0 ? 0 : 1;
    const sides: ['n' | 'e' | 's' | 'w', number][] = [['n', 1], ['e', 2], ['s', 4], ['w', 8]];
    for (const s of wd.shore) {
      if (s.x < x0 || s.x > x1 || s.y < y0 || s.y > y1) continue;
      for (const [side, bit] of sides) if (s.mask & bit) c.drawImage(A.foam(side, f as 0 | 1).src as CanvasImageSource, s.x * TS - camX, s.y * TS - camY);
    }
  }

  private drawDoorMarks(c: CanvasRenderingContext2D, camX: number, camY: number, tt: number) {
    const A = this.atlas;
    const bob = this.opts.reducedMotion ? 0 : Math.sin(tt * 4) * 1.6 + 1.6;
    for (const poi of this.map.pois) {
      const d = this.doorPt(poi);
      const x = d.x - camX;
      const y = d.y - camY;
      if (x < -20 || y < -40 || x > this.view.W + 20 || y > this.view.H + 20) continue;
      const locked = isPoiLocked(poi, this.state);
      const best = this.state.poi[poi.id]?.best ?? 0;
      const col = locked ? 'n' : best > 0 ? 'L' : 'u';
      const hi = locked ? 'B' : best > 0 ? 'l' : 'e';
      if (this.isImg) {
        const r = locked ? 5 : 5 + (this.opts.reducedMotion ? 0 : Math.round(Math.sin(tt * 3) * 1));
        c.fillStyle = this.rgbs(col);
        c.globalAlpha = 0.55;
        c.fillRect(Math.round(x) - r, Math.round(y) - 1, r * 2 + 1, 3);
        c.fillRect(Math.round(x) - r + 2, Math.round(y) - 2, r * 2 - 3, 5);
        c.globalAlpha = 1;
        c.fillStyle = this.rgbs(hi);
        c.fillRect(Math.round(x) - r + 3, Math.round(y), r * 2 - 5, 1);
      } else {
        c.fillStyle = this.rgbs(col);
        c.globalAlpha = 0.55;
        c.fillRect(poi.door.x * TS + 3 - camX, poi.door.y * TS + 4 - camY, 10, 8);
        c.globalAlpha = 1;
        c.fillStyle = this.rgbs(hi);
        c.fillRect(poi.door.x * TS + 4 - camX, poi.door.y * TS + 5 - camY, 8, 1);
      }
      const dy = this.isImg ? 8 : 14;
      const top = this.isImg ? 6 : 8;
      if (locked) {
        const lk = A.sprite('ui_lock', 0);
        if (lk) c.drawImage(lk.src as CanvasImageSource, Math.round(x - lk.w / 2), Math.round(y - dy - top));
      } else if (best === 0) {
        const ar = A.sprite('ui_arrow', 0);
        if (ar) c.drawImage(ar.src as CanvasImageSource, Math.round(x - ar.w / 2), Math.round(y - dy - top - 2 + bob));
      }
    }
  }

  private drawEnt(c: CanvasRenderingContext2D, e: Ent, camX: number, camY: number) {
    const b = e.bmps[Math.min(e.frame, e.bmps.length - 1)];
    if (!b) return;
    const x = Math.round(e.x - b.w / 2 - camX);
    const y = Math.round(e.y - e.footRow - e.z - camY);
    if (x > this.view.W || y > this.view.H || x + b.w < 0 || y + b.h < 0) return;
    if (e.kind === 'animal' && e.z > 0) {
      c.fillStyle = 'rgba(15,29,51,0.25)';
      c.fillRect(Math.round(e.x - 4 * this.u - camX), Math.round(e.y - camY), Math.round(8 * this.u), 1);
    }
    if (e.flip) {
      c.save();
      c.translate(x + b.w, y);
      c.scale(-1, 1);
      c.drawImage(b.src as CanvasImageSource, 0, 0);
      c.restore();
    } else c.drawImage(b.src as CanvasImageSource, x, y);
  }

  private drawPlaced(c: CanvasRenderingContext2D, p: Placed, camX: number, camY: number, night: boolean, tt: number) {
    let b: Bitmap | undefined;
    if (p.fac) b = this.atlas.facade(p.fac.kind, p.fac.text, p.fac.w, p.fac.h, p.fac.doorCol, p.fac.variant, night);
    else if (p.anim) {
      const windy = this.weather.kind === 'wind' ? 1 + this.weather.intensity * 2 : 1;
      b = this.atlas.sprite(p.sprite, this.opts.reducedMotion ? 0 : Math.floor(tt * 2.4 * windy) % 4);
    } else b = this.atlas.sprite(p.sprite, night && this.atlas.hasDayNight(p.sprite) ? 1 : 0);
    if (!b) return;
    p.w = b.w;
    p.h = b.h;
    c.drawImage(b.src as CanvasImageSource, Math.round(p.px - b.w / 2 - camX), Math.round(p.py - b.h - camY));
  }

  private drawClouds(c: CanvasRenderingContext2D, camX: number, camY: number, tt: number) {
    const day = daylight(this.hour);
    if (day < 0.5 || this.wet > 0.2) return;
    if (!this.cloud) this.cloud = makeCloud();
    const S = 192;
    const ox = tt * 5;
    const oy = tt * 1.5;
    c.globalAlpha = (this.isImg ? 0.09 : 0.11) * Math.min(1, (day - 0.5) * 3);
    const sx = Math.floor((camX - ox) / S);
    const sy = Math.floor((camY - oy) / S);
    const nx = Math.ceil(this.view.W / S) + 1;
    const ny = Math.ceil(this.view.H / S) + 1;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) c.drawImage(this.cloud as CanvasImageSource, Math.round((sx + i) * S + ox - camX), Math.round((sy + j) * S + oy - camY));
    c.globalAlpha = 1;
  }

  private drawLasers(c: CanvasRenderingContext2D, camX: number, camY: number) {
    if (this.map.id !== 'singapore' || this.hour < 19.5 || this.hour > 22 || this.opts.reducedMotion) return;
    const mbs = this.map.pois.find((q) => q.id === 'singapore-mbs' || q.sprite === 'lm_mbs');
    if (!mbs) return;
    const r = this.poiRect(mbs);
    const cx = r.x + r.w / 2 - camX;
    const cy = (this.isImg ? r.y + 8 : r.y + r.h - 84) - camY;
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.55;
    const L = (this.isImg ? 70 : 90) | 0;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + Math.sin(this.t * 0.8 + i * 1.3) * 0.9;
      c.strokeStyle = i % 2 ? '#7dffd9' : '#ff8fe0';
      c.lineWidth = 1;
      const sx = Math.round(cx + (i - 2) * (this.isImg ? 18 : 22)) + 0.5;
      c.beginPath();
      c.moveTo(sx, Math.round(cy) + 0.5);
      c.lineTo(Math.round(sx + Math.cos(a) * L) + 0.5, Math.round(cy + Math.sin(a) * L) + 0.5);
      c.stroke();
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  }

  private drawParticles(c: CanvasRenderingContext2D, camX: number, camY: number) {
    const P = this.particles;
    const A = this.atlas;
    const sparkCols = ['#ffd36b', '#ff7aa8', '#7dffd9', '#9ec9ff'];
    for (let i = 0; i < P.n; i++) {
      const k = P.kind[i]!;
      const life = P.life[i]! / P.max[i]!;
      if (k === PK.Rain) {
        c.fillStyle = this.wet > 0.5 ? 'rgba(200,225,255,0.55)' : 'rgba(210,230,255,0.42)';
        c.fillRect(Math.round(P.x[i]!), Math.round(P.y[i]!), 1, this.isImg ? 2 : 3);
        continue;
      }
      const x = Math.round(P.x[i]! - camX);
      const y = Math.round(P.y[i]! - camY);
      if (k === PK.Dust) {
        c.fillStyle = `rgba(236,217,171,${(life * 0.8).toFixed(2)})`;
        const s = life > 0.5 && !this.isImg ? 2 : 1;
        c.fillRect(x, y, s, s);
      } else if (k === PK.Sparkle) {
        const sp = A.sprite('ui_sparkle', Math.min(3, Math.floor((1 - life) * 4)));
        if (sp) c.drawImage(sp.src as CanvasImageSource, x - 4, y - 4);
      } else if (k === PK.Coin) {
        const cn = A.sprite('ui_coin', Math.floor(this.t * 10) % 4);
        c.globalAlpha = Math.min(1, life * 2);
        if (cn) c.drawImage(cn.src as CanvasImageSource, x - 4, y - 4);
        c.globalAlpha = 1;
      } else if (k === PK.Spark) {
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = sparkCols[P.tint[i]! % 4]!;
        c.globalAlpha = Math.min(1, life * 1.6);
        c.fillRect(x, y, 2, 2);
        c.globalAlpha = 1;
        c.globalCompositeOperation = 'source-over';
      } else if (k === PK.Leaf) {
        c.fillStyle = this.rgbs('l');
        c.fillRect(x, y, 2, 1);
        c.fillRect(x + 1, y + 1, 1, 1);
      } else if (k === PK.Ring) {
        const r = Math.round((1 - life) * 4) + 1;
        c.fillStyle = `rgba(251,247,238,${(life * 0.7).toFixed(2)})`;
        c.fillRect(x - r, y, 1, 1);
        c.fillRect(x + r, y, 1, 1);
        c.fillRect(x - (r >> 1), y - 1, r, 1);
        c.fillRect(x - (r >> 1), y + 1, r, 1);
      }
    }
  }

  // ------------------------------------------------------------------ lớp chữ (độ phân giải thiết bị)
  private toDev(wx: number, wy: number, camX: number, camY: number): { x: number; y: number } {
    const v = this.view;
    return { x: v.offX + (wx - camX) * v.k, y: v.offY + (wy - camY) * v.k };
  }

  private drawOverlay(d: CanvasRenderingContext2D, camX: number, camY: number) {
    const v = this.view;
    const vi = this.opts.locale === 'vi';
    const px = (n: number) => Math.round(n * v.dpr);
    d.textBaseline = 'middle';
    d.textAlign = 'center';
    const pill = (text: string, cx: number, cy: number, o: { bg: string; fg: string; border: string; size?: number }) => {
      const size = px(o.size ?? 13);
      d.font = `700 ${size}px "Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif`;
      const tw = d.measureText(text).width;
      const w = tw + px(16);
      const h = size + px(10);
      const x = Math.round(Math.max(px(4), Math.min(v.devW - w - px(4), cx - w / 2)));
      const y = Math.round(cy - h / 2);
      d.fillStyle = o.border;
      d.fillRect(x - px(1), y - px(1), w + px(2), h + px(2));
      d.fillStyle = o.bg;
      d.fillRect(x, y, w, h);
      d.fillStyle = o.fg;
      d.fillText(text, Math.round(x + w / 2), Math.round(y + h / 2 + px(0.5)));
    };

    if (this.isImg && !this.bg) {
      pill(this.imgFailed ? (vi ? 'Không tải được bản đồ' : 'Could not load the map') : vi ? 'Đang tải bản đồ…' : 'Loading map…', v.devW / 2, v.devH / 2, { bg: '#0F1D33', fg: '#F3EDE1', border: '#B8955A', size: 14 });
    }

    for (const poi of this.map.pois) {
      const dp = this.doorPt(poi);
      const near = Math.hypot(dp.x - this.player.x, dp.y - this.player.y) < (this.isImg ? 70 : 7 * TS);
      if (!near && this.hoverPoi !== poi.id) continue;
      const pos = this.toDev(dp.x, dp.y + (this.isImg ? 9 : TS - 2), camX, camY);
      if (pos.x < -50 || pos.x > v.devW + 50 || pos.y < -20 || pos.y > v.devH + 20) continue;
      const locked = isPoiLocked(poi, this.state);
      const label = (locked ? '🔒 ' : '') + (vi ? poi.name.vi : poi.name.en);
      pill(label, pos.x, pos.y, { bg: locked ? '#E6DFD0' : '#F3EDE1', fg: '#0F1D33', border: locked ? '#8c8576' : '#B8955A' });
    }

    const b = this.bubble;
    if (b) {
      const pos = this.toDev(b.wx, b.wy, camX, camY);
      const maxW = Math.min(px(260), v.devW - px(24));
      const fs = px(14);
      const fs2 = px(12);
      d.font = `600 ${fs}px "Plus Jakarta Sans", system-ui, sans-serif`;
      const l1 = wrap(d, b.en, maxW - px(20));
      d.font = `500 ${fs2}px "Plus Jakarta Sans", system-ui, sans-serif`;
      const l2 = vi ? wrap(d, b.vi, maxW - px(20)) : [];
      const w = maxW;
      const h = l1.length * (fs + px(3)) + (l2.length ? l2.length * (fs2 + px(2)) + px(6) : 0) + px(16);
      const x = Math.round(Math.max(px(6), Math.min(v.devW - w - px(6), pos.x - w / 2)));
      const y = Math.round(Math.max(px(6), pos.y - h - px(10)));
      d.fillStyle = '#0F1D33';
      d.fillRect(x - px(2), y - px(2), w + px(4), h + px(4));
      d.fillStyle = '#F3EDE1';
      d.fillRect(x, y, w, h);
      d.fillStyle = '#B8955A';
      d.fillRect(x, y + h - px(3), w, px(3));
      d.fillStyle = '#0F1D33';
      const tx = Math.round(Math.max(x + px(10), Math.min(x + w - px(10), pos.x)));
      d.fillRect(tx - px(5), y + h + px(2), px(10), px(2));
      d.fillRect(tx - px(3), y + h + px(4), px(6), px(2));
      d.fillRect(tx - px(1), y + h + px(6), px(2), px(2));
      d.textAlign = 'left';
      let ty = y + px(8) + fs / 2;
      d.fillStyle = '#0F1D33';
      d.font = `600 ${fs}px "Plus Jakarta Sans", system-ui, sans-serif`;
      for (const ln of l1) {
        d.fillText(ln, x + px(10), Math.round(ty));
        ty += fs + px(3);
      }
      if (l2.length) {
        ty += px(3);
        d.fillStyle = '#6b6350';
        d.font = `500 ${fs2}px "Plus Jakarta Sans", system-ui, sans-serif`;
        for (const ln of l2) {
          d.fillText(ln, x + px(10), Math.round(ty));
          ty += fs2 + px(2);
        }
      }
      d.textAlign = 'center';
    }

    if (this.toast && this.t * 1000 < this.toast.until) pill(this.toast.text, v.devW / 2, px(36), { bg: '#0F1D33', fg: '#F3EDE1', border: '#B8955A', size: 14 });
  }

  // ------------------------------------------------------------------ nhập liệu
  private bindInput() {
    const cv = this.canvas;
    const on = <K extends keyof HTMLElementEventMap>(t: K, f: (e: HTMLElementEventMap[K]) => void) => {
      cv.addEventListener(t, f as EventListener);
      this.cleanup.push(() => cv.removeEventListener(t, f as EventListener));
    };
    const rect = () => cv.getBoundingClientRect();
    on('pointerdown', (e) => {
      cv.focus({ preventScroll: true });
      this.downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
    });
    on('pointerup', (e) => {
      const d = this.downAt;
      this.downAt = null;
      if (!d) return;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 10 || performance.now() - d.t > 600) return;
      const r = rect();
      this.tap(e.clientX - r.left, e.clientY - r.top);
    });
    on('pointercancel', () => {
      this.downAt = null;
    });
    on('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const r = rect();
      const hit = this.hit(e.clientX - r.left, e.clientY - r.top);
      this.hoverPoi = hit.poi?.id ?? null;
      cv.style.cursor = hit.poi || hit.npc >= 0 ? 'pointer' : 'default';
    });
    on('pointerenter', () => {
      this.hovered = true;
    });
    on('pointerleave', () => {
      this.hovered = false;
      this.hoverPoi = null;
    });
    on('focus', () => {
      this.focused = true;
    });
    on('blur', () => {
      this.focused = false;
      this.keys = [];
    });
    const kd = (e: KeyboardEvent) => {
      if (!this.focused && !this.hovered) return;
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const d = KEYMAP[e.key];
      if (d) {
        e.preventDefault();
        this.keys = this.keys.filter((k) => k !== d);
        this.keys.push(d);
        return;
      }
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        this.interact();
      }
    };
    const ku = (e: KeyboardEvent) => {
      const d = KEYMAP[e.key];
      if (d) this.keys = this.keys.filter((k) => k !== d);
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    this.cleanup.push(() => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    });
  }

  /**
   * Vật nằm dưới điểm chạm. Ưu tiên theo bậc để NPC đứng gần cửa không "ăn" lượt chạm vào công trình:
   * NPC trúng đúng → công trình trúng đúng → NPC trong vùng nới → công trình trong vùng nới (≥ 44 px CSS).
   */
  private hit(cssX: number, cssY: number): { poi?: Poi; npc: number } {
    const v = this.view;
    const w = pointerToWorld(cssX, cssY, v, this.cam.ix, this.cam.iy);
    const slop = 22 / v.cssPerPx;
    const npcAt = (s: number): number => {
      let npc = -1;
      let best = Infinity;
      this.npcs.forEach((n, i) => {
        const dx = Math.abs(w.x - n.x);
        const dy = Math.abs(w.y - (n.y - n.footRow / 2));
        if (dx <= n.w / 2 + s && dy <= n.h / 2 + s) {
          const d = dx * dx + dy * dy;
          if (d < best) {
            best = d;
            npc = i;
          }
        }
      });
      return npc;
    };
    const poiAt = (s: number): Poi | undefined => {
      let poi: Poi | undefined;
      let pd = Infinity;
      for (const q of this.map.pois) {
        const r = this.poiRect(q);
        let rx = r.x;
        let ry = r.y;
        let rw = r.w;
        let rh = r.h;
        if (!this.isImg) {
          const placed = this.world!.placed.find((p) => p.poi === q.id);
          if (placed) {
            rw = placed.w;
            rh = placed.h;
            rx = r.x + r.w / 2 - rw / 2;
            ry = r.y + r.h - rh;
          }
        }
        const inSprite = w.x >= rx - s && w.x <= rx + rw + s && w.y >= ry - s && w.y <= ry + rh + s;
        const d0 = this.doorPt(q);
        const nearDoor = Math.abs(w.x - d0.x) <= 6 + s && Math.abs(w.y - d0.y) <= 6 + s;
        if (inSprite || nearDoor) {
          const d = Math.hypot(w.x - (rx + rw / 2), w.y - (ry + rh / 2));
          if (d < pd) {
            pd = d;
            poi = q;
          }
        }
      }
      return poi;
    };
    let n = npcAt(1);
    if (n >= 0) return { npc: n };
    let p = poiAt(0);
    if (p) return { poi: p, npc: -1 };
    n = npcAt(slop);
    if (n >= 0) return { npc: n };
    p = poiAt(slop);
    return { poi: p, npc: -1 };
  }

  private tap(cssX: number, cssY: number) {
    this.toast = null;
    const h = this.hit(cssX, cssY);
    if (h.npc >= 0) {
      this.talk(h.npc);
      return;
    }
    if (h.poi) {
      const q = h.poi;
      const door = this.doorPt(q);
      if (isPoiLocked(q, this.state)) {
        this.showLocked(q);
        this.goTo(door);
        return;
      }
      this.goTo(door, q.id);
      return;
    }
    const w = pointerToWorld(cssX, cssY, this.view, this.cam.ix, this.cam.iy);
    if (w.x < 0 || w.y < 0 || w.x >= this.worldW || w.y >= this.worldH) return;
    if (!this.goTo({ x: w.x, y: w.y })) this.particles.emit(PK.Ring, w.x, w.y, 0, 0, 0.5);
  }

  private talk(i: number) {
    const n = this.npcs[i];
    if (!n || n.npc.lines.length === 0) return;
    const line = n.npc.lines[n.line % n.npc.lines.length]!;
    n.line++;
    n.wait = Math.max(n.wait, 3);
    n.dir = this.dirTo(this.player.x - n.x, this.player.y - n.y);
    this.bubble = { en: line.en, vi: line.vi, wx: n.x, wy: n.y - n.footRow - 3, until: this.t * 1000 + 4800 };
  }

  private interact() {
    const p = this.player;
    let near = -1;
    const R = (this.isImg ? 18 : 26) ** 2;
    let bd = R;
    this.npcs.forEach((n, i) => {
      const d = (n.x - p.x) ** 2 + (n.y - p.y) ** 2;
      if (d < bd) {
        bd = d;
        near = i;
      }
    });
    if (near >= 0) return this.talk(near);
    this.tryEnterNear(true);
  }

  // ------------------------------------------------------------------ kiểm tra (trang thử, test thủ công)
  /** Đưa người chơi tới điểm (điểm nguồn; chế độ ô: pixel thế giới), như khi chạm. */
  debugGoToPx(x: number, y: number, enterPoi?: string) {
    this.goTo({ x, y }, enterPoi);
  }
  debugGoToPoi(id: string) {
    const q = this.map.pois.find((p) => p.id === id);
    if (q) this.goTo(this.doorPt(q), id);
  }
  debugPlayer(): { x: number; y: number; moving: boolean } {
    return { x: this.player.x, y: this.player.y, moving: this.player.path.length > 0 };
  }
  debugSetPlayer(x: number, y: number) {
    this.player.x = x;
    this.player.y = y;
    this.player.path = [];
    this.cam.snapTo(x, y - 6, this.view, this.worldW, this.worldH);
  }
}

function cmpSort(a: Placed | Ent, b: Placed | Ent): number {
  return a.sortY - b.sortY;
}

function wrap(d: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (d.measureText(t).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Màu trung bình (tối đi) của tranh — dùng làm màu viền khi khung rộng hơn tranh. */
function averageColor(img: HTMLImageElement): string {
  try {
    const c = makeCanvas(8, 8);
    const x = ctx2d(c);
    x.drawImage(img, 0, 0, 8, 8);
    const d = x.getImageData(0, 0, 8, 8).data;
    let r = 0;
    let g = 0;
    let b = 0;
    for (let i = 0; i < d.length; i += 4) {
      r += d[i]!;
      g += d[i + 1]!;
      b += d[i + 2]!;
    }
    const n = d.length / 4;
    return `rgb(${Math.round((r / n) * 0.45)},${Math.round((g / n) * 0.45)},${Math.round((b / n) * 0.45)})`;
  } catch {
    return '#141b2c';
  }
}

/** Ô bóng mây 192×192: nhiễu giá trị ngưỡng hoá, mép hoà sắc caro. Lát kín được. */
function makeCloud(): ReturnType<typeof makeCanvas> {
  const S = 192;
  const cv = makeCanvas(S, S);
  const c = ctx2d(cv);
  const img = c.createImageData(S, S);
  const rnd = mulberry32(99);
  const G = 6;
  const grid: number[][] = [];
  for (let j = 0; j < G; j++) {
    grid[j] = [];
    for (let i = 0; i < G; i++) grid[j]![i] = rnd();
  }
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const val = (x: number, y: number) => {
    const gx = (x / S) * G;
    const gy = (y / S) * G;
    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const fx = smooth(gx - x0);
    const fy = smooth(gy - y0);
    const a = grid[y0 % G]![x0 % G]!;
    const b = grid[y0 % G]![(x0 + 1) % G]!;
    const cc = grid[(y0 + 1) % G]![x0 % G]!;
    const d = grid[(y0 + 1) % G]![(x0 + 1) % G]!;
    return a + (b - a) * fx + (cc - a) * fy + (a - b - cc + d) * fx * fy;
  };
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const n = val(x, y) * 0.7 + val((x * 2) % S, (y * 2) % S) * 0.3;
      const edge = n > 0.62 ? 2 : n > 0.56 ? ((x + y) & 1 ? 2 : 0) : 0;
      if (!edge) continue;
      const i = (y * S + x) * 4;
      img.data[i] = 15;
      img.data[i + 1] = 29;
      img.data[i + 2] = 51;
      img.data[i + 3] = 255;
    }
  c.putImageData(img, 0, 0);
  return cv;
}
