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
import type { CityId, CityMap, MapObject, Npc, Poi, Route, SceneSprite, Tile, TravelState, WeatherPlan } from '@/services/travel/types';
import { hash2, mulberry32 } from '@/data/travel/sprites/paint';
import { getSpriteDef, personFrame, type Dir } from '@/data/travel/sprites';
import { atlasFor, ctx2d, makeCanvas, type Atlas, type Bitmap } from './Atlas';
import { buildWorld, GROUND_CHARS, isBlockedAt, isPoiLocked, pathField, TS, type Placed, type World } from './grid';
import { buildImgWorld, findPathPx, isWalkPx, type ImgWorld, type Pt } from './imageWorld';
import { drawInterior } from './interior';
import { CITY_INTERIOR_ART, INTERIOR_SIZE, type InteriorLayout, type InteriorZone } from '@/data/travel/interiors';
import { buildSceneWorld, footprintRect, INTERIOR_CELL, interiorKindOf, interiorLayout, interiorMaskRows, type InteriorKind } from './scene';
import { ambientAt, Lighting, type Light, type RGB } from './Lighting';
import { Particles, PK } from './Particles';
import { getPoiContent } from '@/data/travel/pois';
import { playSfx } from '@/services/audio/sfx-ui';
import { CHATTER } from './dialogue';
import { Camera, clientToWorld, computeImageView, computeView, viewForK, zoomBounds, type View } from './view';
import { frameInterval, type StickDir } from '../mobile';
import { conversationContextForNpc, type TravelConversationContext } from '@/services/travel/conversation';

/** NPC của nhiệm vụ đứng cạnh một địa điểm trên bản đồ. */
export type MissionNpcDef = { id: string; poi: string; sprite: string; name: string };
/** Vị trí (px CSS trong canvas) của hai nhân vật khi đang nói chuyện: x giữa người, `y` chân, `top` đỉnh đầu. */
export type MissionLayout = { you: { x: number; y: number; top: number }; npc: { x: number; y: number; top: number }; k: number };

export type EngineCallbacks = {
  /** Người chơi đã tới cạnh NPC nhiệm vụ (đi bộ, chạm vào NPC hoặc bấm E). */
  onMissionArrive?(id: string): void;
  /** Đang đứng gần NPC mục tiêu (id) hoặc đã rời xa (null). */
  onMissionNear?(id: string | null): void;
  /** Camera đã khung hai nhân vật xong: toạ độ để đặt bong bóng thoại. */
  onMissionLayout?(layout: MissionLayout): void;
  onEnterPoi(id: string): void;
  onTalkNpc?(context: TravelConversationContext): void;
  onMove(tile: Tile): void;
  /** Chế độ ảnh: không nạp được tranh nền (để lớp trên chuyển sang bản đồ ô dự phòng). */
  onImageError?(): void;
  /** Mức phóng đổi (hoặc đổi cảnh): `z` là số bậc so với mức gốc, `min`/`max` là biên. */
  onZoom?(info: { z: number; min: number; max: number }): void;
  /** Phím F khi bản đồ đang được chọn. */
  onToggleFullscreen?(): void;
  /** Con trỏ đang rê trên một địa điểm (toạ độ CSS trong canvas); `null` khi rời. Dùng cho khung chú thích. */
  onHoverPoi?(id: string | null, at: { x: number; y: number }): void;
  /** Vị trí người chơi (điểm nguồn của bản đồ), ~5 lần/giây — cho bản đồ nhỏ. */
  onPlayer?(p: { x: number; y: number }): void;
};

/** Làm nổi địa điểm: `recommended` = nơi nên đi tiếp, `focus` = đang rê trong danh sách, `locked` = tập địa điểm đang khoá (ghi đè luật cũ). */
export type PoiHighlights = { recommended?: string | null; focus?: string | null; locked?: ReadonlySet<string> };

const KIND_ICON: Record<string, string> = {
  restaurant: '🍜',
  cafe: '☕',
  hotel: '🛏️',
  station: '🚉',
  market: '🛍️',
  museum: '🏛️',
  landmark: '🏙️',
  garden: '🌳',
  airport: '✈️',
  counter: '🎫',
  secret: '✨',
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
  kind: 'player' | 'npc' | 'animal' | 'vehicle' | 'object';
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

type NpcRun = Ent & { npc: Npc; route: Pt[]; ri: number; wait: number; dir: Dir; walking: boolean; line: number; person: boolean; mission?: { name: string } };
type Player = Ent & { path: Pt[]; dir: Dir; stepT: number; dustT: number; moveAnnounced: boolean };
type Pigeon = Ent & { home: Pt; mode: 0 | 1 | 2; t: number; vx: number; vy: number; hide: number };
type Veh = Ent & { route: Route; pts: Pt[]; cum: number[]; len: number; s: number; dir: 1 | -1; sky: boolean; sp: number };
type Walker = Ent & { path: Pt[]; wait: number; dir: Dir; walking: boolean; seed: number; chat: string | null; chatUntil: number; nextChat: number };
type ObjEnt = Ent & { obj: MapObject };
type Bubble = { en: string; vi: string; wx: number; wy: number; until: number } | null;

export type EngineStats = { fps: number; frameMs: number; particles: number; drawn: number; k: number; W: number; H: number; dpr: number; mode: 'tile' | 'image' };

/** Câu phiếm ngắn của người đi dạo (bong bóng nhỏ, ngẫu nhiên). */

const PANEL_W = 418;
const PANEL_H = 235;

const prevent = (e: Event) => {
  if (e.cancelable) e.preventDefault();
};

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
/** Mã sprite công trình tranh pixel đã gửi đi nạp (`art:<thư mục>/<tệp>`), để không nạp lại mỗi lần vào bản đồ. */
const artRequested = new Set<string>();

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
  private bg: CanvasImageSource | null = null;
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
  private walkers: Walker[] = [];
  private objects: ObjEnt[] = [];
  private interior: { poi: Poi; kind: InteriorKind; zone: InteriorZone; parent: CityMap; since: number; beat: boolean; hosted: boolean; layout: InteriorLayout } | null = null;
  private fade = { a: 0, target: 0, cb: null as (() => void) | null };
  private zoom = 0;
  private baseK = 1;
  private pointers = new Map<number, { x: number; y: number }>();
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
  private hl: PoiHighlights = {};
  private playerCbT = 0;
  private pendingEnter: string | null = null;
  private enterLock: string | null = null;
  private keys: Dir[] = [];
  private inputEnabled = true;
  // ---- chế độ nhiệm vụ du học (NPC hội thoại ngay trên bản đồ)
  private missionMode = false;
  private missionDefs: MissionNpcDef[] = [];
  private missionGoal: string | null = null;
  private missionArrive: string | null = null;
  private missionTalkId: string | null = null;
  private missionNear: string | null = null;
  private camFocus: Pt | null = null;
  private talkT = 0;
  private stuck = { x: 0, y: 0, t: 0 };
  private layoutSent = false;
  /** Hướng từ cần điều khiển ảo (cùng ngữ nghĩa với phím; phím vật lý được ưu tiên). */
  private stick: Dir[] = [];
  private lastActiveAt = 0;
  private lastPlayerCb = { x: NaN, y: NaN };
  private rectW = 0;
  private rectH = 0;
  private focused = false;
  private hovered = false;
  private downAt: { x: number; y: number; t: number } | null = null;

  private raf = 0;
  private gate = { hidden: false, offscreen: false, now: 0, lastActiveAt: 0, busy: false, reducedMotion: false, adaptiveInterval: 0 };
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
    // Toàn màn hình: không để trình duyệt cuộn / phóng / kéo-làm-mới trên canvas.
    canvas.style.touchAction = 'none';
    canvas.style.setProperty('-webkit-touch-callout', 'none');
    canvas.style.setProperty('-webkit-tap-highlight-color', 'transparent');
    canvas.style.userSelect = 'none';
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
  private get isScene(): boolean {
    return !!this.map.scene && !this.interior;
  }
  /** Hệ số nhân tốc độ/khoảng cách: cảnh ảnh nhỏ hơn cảnh ô nên các hằng số được co lại. */
  private get u(): number {
    return this.mode === 'image' ? 0.55 : 1;
  }

  // ------------------------------------------------------------------ cấu hình
  setMap(map: CityMap, state: TravelState, opts?: { bg?: CanvasImageSource; spawn?: Pt; lock?: string | null; interior?: CityEngine['interior'] }) {
    this.map = map;
    this.interior = opts?.interior ?? null;
    this.state = state;
    if (!opts?.interior) this.zoom = loadZoom(map.id);
    this.atlas = atlasFor(map.palette);
    // Công trình và nhân vật tranh pixel (`sprite: 'art:<thư mục>/<tệp>'`): nạp PNG vào Atlas, một lần cho mỗi mã.
    // Nhân vật đã được thu sẵn về cùng chiều cao (24 điểm, khớp khung người chơi), nên nạp đúng cỡ tệp.
    for (const id of [...map.pois.map((p) => p.sprite), ...map.npcs.map((n) => n.sprite), ...(map.routes ?? []).map((r) => r.sprite)]) {
      if (!id?.startsWith('art:') || artRequested.has(id)) continue;
      artRequested.add(id);
      void this.atlas.registerImage(id, `/travel/sprites/${id.slice(4)}.png`);
    }
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
    this.enterLock = opts?.lock ?? null;
    this.walkers = [];
    this.objects = [];
    if (map.image) {
      this.imgW = map.scene ? buildSceneWorld(map) : buildImgWorld(map.image);
      const seq = ++this.loadSeq;
      if (opts?.bg) {
        this.bg = opts.bg;
        this.bgColor = averageColor(opts.bg);
      } else if (map.image.panels && map.image.panels.length > 1) this.loadPanels(map, seq);
      else loadMapImage(map.image.smallSrc ?? map.image.src)
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
    this.initPlayer(opts?.spawn);
    // Xuất hiện sát một cửa (vừa về từ lượt hỏi) thì khoá cửa đó tới khi bước ra xa, khỏi tự vào lại.
    if (map.scene && !this.interior && !this.enterLock) {
      for (const poi of map.pois) {
        const d = this.doorPt(poi);
        if (Math.hypot(d.x - this.player.x, d.y - this.player.y) <= 12) this.enterLock = poi.id;
      }
    }
    this.initNpcs();
    this.initAnimals();
    this.vehicleRetries = 0;
    this.initVehicles();
    this.initScene();
    this.recomputeView();
    this.cam.snapTo(this.player.x, this.player.y - 6, this.view, this.worldW, this.worldH);
    if (!this.isImg) this.rebuildStatic();
  }

  setState(state: TravelState) {
    this.wake();
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

  setHighlights(h: PoiHighlights) {
    this.wake();
    this.hl = h;
  }

  /** Tự đi tới cửa một địa điểm (không vào). Trả về true nếu tìm được đường. */
  walkToPoi(id: string): boolean {
    this.wake();
    if (this.interior) return false;
    const poi = this.map.pois.find((q) => q.id === id);
    if (!poi) return false;
    const door = this.doorPt(poi);
    if (!this.goTo(door)) return false;
    // dừng cách cửa một quãng ngắn để không tự bước vào (muốn vào thì bấm "Vào" hoặc E)
    const p = this.player;
    // Địa điểm có phòng trong (bản lưới): đi thẳng tới cửa để tự vào.
    const stop = this.isImg ? 15 : this.roomKindOf(poi) ? 0 : TS * 1.2;
    while (p.path.length > 1 && Math.hypot(p.path[p.path.length - 1]!.x - door.x, p.path[p.path.length - 1]!.y - door.y) < stop) p.path.pop();
    this.pendingEnter = null;
    return true;
  }

  /** Khoá hay không: ưu tiên tập do lớp trên cấp (cùng luật với danh sách địa điểm), không có thì dùng luật gốc. */
  private lockedPoi(poi: Poi): boolean {
    return this.hl.locked ? this.hl.locked.has(poi.id) : isPoiLocked(poi, this.state);
  }

  setOptions(o: Partial<EngineOptions>) {
    this.wake();
    this.opts = { ...this.opts, ...o };
    if ('hour' in o || 'weather' in o) this.tickClock(true);
    if (o.reducedMotion) this.particles.clear();
  }

  // ------------------------------------------------------------------ khung hình
  private recomputeView() {
    const base = this.isImg ? computeImageView(this.cssW, this.cssH, this.view.dpr, this.imgW!.w, this.imgW!.h) : computeView(this.cssW, this.cssH, this.view.dpr);
    this.baseK = base.k;
    const b = zoomBounds(base.k);
    const z = this.interior ? 0 : Math.max(b.min, Math.min(b.max, this.zoom));
    const v = z === 0 ? base : viewForK(this.cssW, this.cssH, this.view.dpr, base.k + z);
    Object.assign(this.view as View, v);
    this.canvas.width = v.devW;
    this.canvas.height = v.devH;
    this.dctx.imageSmoothingEnabled = false;
    this.lo = makeCanvas(v.W, v.H);
    this.loCtx = ctx2d(this.lo);
    this.lighting.resize(v.W, v.H);
    this.cbs.onZoom?.({ z: this.interior ? 0 : z, min: this.interior ? 0 : b.min, max: this.interior ? 0 : b.max });
    this.stats.k = v.k;
    this.stats.W = v.W;
    this.stats.H = v.H;
    this.stats.dpr = v.dpr;
  }

  /** Đặt mức phóng (bậc nguyên so với mức gốc); lưu theo phiên cho từng thành phố. */
  setZoom(z: number) {
    this.wake();
    if (this.interior) return;
    const b = zoomBounds(this.baseK);
    const nz = Math.max(b.min, Math.min(b.max, Math.round(z)));
    if (nz === this.zoom) return;
    this.zoom = nz;
    saveZoom(this.map.id, nz);
    this.recomputeView();
    this.cam.snapTo(this.player.x, this.player.y - 6, this.view, this.worldW, this.worldH);
    this.renderFrame(0);
  }

  zoomBy(delta: number) {
    this.setZoom(this.zoom + delta);
  }

  resize(cssW: number, cssH: number, dpr: number) {
    this.cssW = cssW;
    this.cssH = cssH;
    this.wake();
    (this.view as View).dpr = dpr;
    this.recomputeView();
    const f = this.camFocus ?? { x: this.player.x, y: this.player.y - 6 };
    this.cam.snapTo(f.x, f.y, this.view, this.worldW, this.worldH);
    this.layoutSent = false;
    this.talkT = 0.5;
    this.renderFrame(0);
  }

  // ------------------------------------------------------------------ vòng đời
  start() {
    if (this.running) return;
    this.running = true;
    this.lastFrame = performance.now();
    this.lastActiveAt = this.lastFrame;
    const loop = (now: number) => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      const gate = this.gate;
      gate.hidden = document.hidden;
      gate.offscreen = !this.visible;
      gate.now = now;
      gate.lastActiveAt = this.lastActiveAt;
      gate.busy = this.isBusy();
      gate.reducedMotion = this.opts.reducedMotion;
      gate.adaptiveInterval = this.minInterval;
      const wait = frameInterval(gate);
      if (wait === Infinity) {
        this.lastFrame = now;
        return;
      }
      const elapsed = now - this.lastFrame;
      if (elapsed < wait - 1) return;
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

  /** Có input / thay đổi từ ngoài → thoát chế độ rảnh (vẽ lại ở tốc độ đầy đủ). */
  wake() {
    this.lastActiveAt = performance.now();
  }

  /** Đang có thứ người chơi điều khiển chuyển động: đi, giữ phím / cần, chuyển cảnh, hội thoại. */
  private isBusy(): boolean {
    return !!this.player && (this.player.path.length > 0 || this.keys.length > 0 || this.stick.length > 0 || this.fade.a > 0 || this.fade.target !== 0 || !!this.bubble || !!this.toast || this.pendingEnter !== null);
  }

  /** Cần điều khiển ảo: tập hướng đang giữ (rỗng = thả). Sao chép vào bộ đệm riêng nên truyền mảng tái dùng được. */
  setStick(dirs: readonly StickDir[]) {
    if (!this.inputEnabled) return;
    this.stick.length = 0;
    for (const d of dirs) this.stick.push(d);
    if (dirs.length) this.wake();
  }

  /** Nút "tương tác" (như phím E): nói chuyện / vào địa điểm gần nhất. */
  interactNow() {
    if (!this.inputEnabled) return;
    this.wake();
    this.interact();
  }

  /** Keep the animated world running while a modal conversation owns player input. */
  setInputEnabled(enabled: boolean) {
    this.inputEnabled = enabled;
    if (!enabled) {
      this.keys = [];
      this.stick = [];
      this.player.path = [];
      this.pendingEnter = null;
      this.downAt = null;
    }
    this.wake();
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
    if (this.isImg && (this.map.scene || this.interior) && getSpriteDef(`chibi_${id}`)) return `chibi_${id}`;
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
    if (sid.startsWith('chibi_')) return 21;
    if (sid.startsWith('mini_player') || sid.startsWith('mini_npc')) return 12;
    if (sid.startsWith('player') || sid.startsWith('npc_')) return 22;
    return h - 1;
  }

  private initPlayer(spawn?: Pt) {
    const outfit = ((this.state.prefs.outfit % 8) + 8) % 8;
    const sid = this.spriteIdFor(`player_${outfit}`);
    const bmps = this.personBitmaps(`player_${outfit}`);
    let start: Pt;
    if (this.isImg) {
      const s = spawn ?? (this.state.city === this.map.id ? this.state.pos : this.map.spawn);
      start = spawn ?? (isWalkPx(this.imgW!, s.x, s.y) ? { x: s.x, y: s.y } : { x: this.map.spawn.x, y: this.map.spawn.y });
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
    this.addMissionNpcs();
  }

  // ------------------------------------------------------------------ nhiệm vụ du học
  /** Đặt các NPC nhiệm vụ (mỗi người đứng cạnh cửa của một địa điểm). Bật chế độ nhiệm vụ: không vào địa điểm nữa. */
  setMissionNpcs(defs: MissionNpcDef[]) {
    this.missionMode = defs.length > 0;
    this.missionDefs = defs;
    if (this.player) {
      this.npcs = this.npcs.filter((n) => !n.mission);
      this.addMissionNpcs();
    }
    this.wake();
  }

  private addMissionNpcs() {
    if (!this.missionDefs.length || !this.player) return;
    for (const def of this.missionDefs) {
      const poi = this.map.pois.find((q) => q.id === def.poi);
      if (!poi) continue;
      const door = this.doorPt(poi);
      const offs: Pt[] = [{ x: 16, y: 4 }, { x: -16, y: 4 }, { x: 0, y: 14 }, { x: 0, y: -12 }, { x: 26, y: 8 }, { x: -26, y: 8 }];
      const at = offs.map((o) => ({ x: door.x + o.x, y: door.y + o.y })).find((q) => this.walkableAtPt(q.x, q.y)) ?? door;
      const sid = this.spriteIdFor(def.sprite);
      const bmps = this.personBitmaps(def.sprite);
      this.npcs.push({
        kind: 'npc',
        bmps,
        x: at.x,
        y: at.y,
        z: 0,
        frame: personFrame('down', 0),
        flip: false,
        footRow: this.footRowOf(sid, bmps[0]?.h ?? 24),
        w: bmps[0]?.w ?? 16,
        h: bmps[0]?.h ?? 24,
        sortY: 0,
        npc: { id: def.id, sprite: def.sprite, at: { x: at.x, y: at.y }, lines: [{ en: '…', vi: '…' }] },
        route: [at],
        ri: 0,
        wait: 99,
        dir: 'down' as Dir,
        walking: false,
        line: 0,
        person: this.atlas.frameCount(sid) >= 12,
        mission: { name: def.name },
      });
    }
  }

  setMissionGoal(id: string | null) {
    this.missionGoal = id;
    this.missionNear = null;
    this.wake();
  }

  private missionNpc(id: string): NpcRun | undefined {
    return this.npcs.find((n) => n.mission && n.npc.id === id);
  }

  /** Tự đi tới đứng cạnh NPC; tới nơi thì báo `onMissionArrive`. */
  missionWalkTo(id: string): boolean {
    const n = this.missionNpc(id);
    if (!n || !this.player) return false;
    this.wake();
    const p = this.player;
    if (Math.hypot(n.x - p.x, n.y - p.y) < 30) {
      this.faceEachOther(n);
      this.missionArrive = null;
      this.cbs.onMissionArrive?.(id);
      return true;
    }
    // Đứng bên cạnh (trái/phải) để hai người quay mặt vào nhau; chỉ khi hai bên đều kẹt mới đứng trên/dưới.
    const dist = (o: Pt) => Math.hypot(n.x + o.x - p.x, n.y + o.y - p.y);
    const order = [...[{ x: -20, y: 2 }, { x: 20, y: 2 }].sort((s, u) => dist(s) - dist(u)), { x: -28, y: 4 }, { x: 28, y: 4 }, { x: 0, y: 15 }, { x: 0, y: -10 }];
    for (const o of order) {
      const to = { x: n.x + o.x, y: n.y + o.y };
      if (!this.walkableAtPt(to.x, to.y)) continue;
      if (this.goTo(to)) {
        this.missionArrive = id;
        this.pendingEnter = null;
        return true;
      }
    }
    // Không có đường đi bộ tới (bản đồ chưa nối liền / bị sông chắn): đưa người chơi tới cạnh NPC luôn để nhiệm vụ không bị kẹt.
    for (const o of order) {
      const to = { x: n.x + o.x, y: n.y + o.y };
      if (!this.walkableAtPt(to.x, to.y)) continue;
      p.x = to.x;
      p.y = to.y;
      p.path = [];
      this.missionArrive = null;
      this.faceEachOther(n);
      this.cbs.onMissionArrive?.(id);
      return true;
    }
    return false;
  }

  private faceEachOther(n: NpcRun) {
    const p = this.player;
    p.dir = this.dirTo(n.x - p.x, n.y - p.y);
    p.frame = personFrame(p.dir, 0);
    n.dir = this.dirTo(p.x - n.x, p.y - n.y);
    n.frame = n.person ? personFrame(n.dir, 0) : n.frame;
  }

  /** Vào / ra cảnh nói chuyện: camera khung hai người, tắt điều khiển. */
  missionTalk(id: string | null) {
    this.wake();
    this.layoutSent = false;
    this.talkT = 0;
    if (!id) {
      this.missionTalkId = null;
      this.camFocus = null;
      this.cam.padY = 0;
      this.setInputEnabled(true);
      return;
    }
    const n = this.missionNpc(id);
    if (!n) return;
    this.setInputEnabled(false);
    this.missionTalkId = id;
    this.missionArrive = null;
    this.player.path = [];
    this.faceEachOther(n);
    this.camFocus = { x: (this.player.x + n.x) / 2, y: (this.player.y + n.y) / 2 - 8 };
    this.cam.padY = this.view.H * 0.45;
  }

  private updateMission(dt: number) {
    if (!this.missionMode || !this.player) return;
    const p = this.player;
    // đang tự đi mà kẹt (mặt nạ đi bộ của bản đồ chưa chuẩn): sau 2 giây gần như không nhúc nhích thì đặt người chơi tới cuối đường.
    if (this.missionArrive && p.path.length > 0) {
      if (Math.hypot(p.x - this.stuck.x, p.y - this.stuck.y) > 4) this.stuck = { x: p.x, y: p.y, t: 0 };
      else {
        this.stuck.t += dt;
        if (this.stuck.t > 2) {
          const end = p.path[p.path.length - 1]!;
          p.x = end.x;
          p.y = end.y;
          p.path = [];
          this.stuck.t = 0;
        }
      }
    } else this.stuck = { x: p.x, y: p.y, t: 0 };
    // tới nơi?
    if (this.missionArrive && p.path.length === 0) {
      const id = this.missionArrive;
      this.missionArrive = null;
      const n = this.missionNpc(id);
      if (n) this.faceEachOther(n);
      this.cbs.onMissionArrive?.(id);
    }
    // đứng gần mục tiêu?
    if (!this.missionTalkId) {
      const g = this.missionGoal ? this.missionNpc(this.missionGoal) : undefined;
      const near = g && Math.hypot(g.x - p.x, g.y - p.y) < 36 ? g.npc.id : null;
      if (near !== this.missionNear) {
        this.missionNear = near;
        this.cbs.onMissionNear?.(near);
      }
    }
    // bố cục lúc nói chuyện, sau khi camera đã kịp trượt tới
    if (this.missionTalkId && !this.layoutSent) {
      this.talkT += dt;
      if (this.talkT > 0.9) {
        const n = this.missionNpc(this.missionTalkId);
        if (n) {
          this.layoutSent = true;
          const v = this.view;
          const css = (wx: number, wy: number) => {
            const d = this.toDev(wx, wy, this.cam.ix, this.cam.iy);
            return { x: d.x / v.dpr, y: d.y / v.dpr };
          };
          const head = (e: Ent) => (e.footRow ?? 20) * (v.k / v.dpr);
          const you = css(p.x, p.y);
          const npc = css(n.x, n.y);
          this.cbs.onMissionLayout?.({ you: { ...you, top: you.y - head(p) }, npc: { ...npc, top: npc.y - head(n) }, k: v.k / v.dpr });
        }
      }
    }
  }

  /** Thẻ tên + mũi tên vàng trên đầu NPC nhiệm vụ. */
  private drawMissionTags(
    d: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    px: (n: number) => number,
    pill: (text: string, cx: number, cy: number, o: { bg: string; fg: string; border: string; size?: number }) => void,
  ) {
    if (!this.missionMode) return;
    const v = this.view;
    const me = this.toDev(this.player.x, this.player.y - this.player.footRow - 3, camX, camY);
    pill(this.opts.locale === 'vi' ? 'Bạn' : 'You', me.x, me.y - px(6), { bg: '#B8955A', fg: '#0F1D33', border: '#0F1D33', size: 12 });
    for (const n of this.npcs) {
      if (!n.mission) continue;
      const head = this.toDev(n.x, n.y - n.footRow - 3, camX, camY);
      if (head.x < -40 || head.x > v.devW + 40 || head.y < -40 || head.y > v.devH + 40) continue;
      pill(n.mission.name, head.x, head.y - px(6), { bg: '#0F1D33', fg: '#F3EDE1', border: '#B8955A', size: 12 });
      if (this.missionGoal === n.npc.id && !this.missionTalkId) {
        const bob = this.opts.reducedMotion ? 0 : Math.sin(this.t * 5) * px(3);
        const ax = head.x;
        const ay = head.y - px(34) + bob;
        d.fillStyle = '#FFD34D';
        d.strokeStyle = '#0F1D33';
        d.lineWidth = px(2);
        d.beginPath();
        d.moveTo(ax - px(9), ay);
        d.lineTo(ax + px(9), ay);
        d.lineTo(ax, ay + px(14));
        d.closePath();
        d.fill();
        d.stroke();
      }
    }
  }

  private initAnimals() {
    this.pigeons = [];
    if (this.interior) return;
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

  private vehicleRetries = 0;

  private initVehicles() {
    this.vehicles = [];
    let missing = false;
    for (const r of this.map.routes ?? []) {
      const def = this.atlas.sprite(r.sprite, 0);
      if (!def) {
        // tranh xe (art:...) đang nạp: thử lại sau, tối đa ~9 giây
        missing = true;
        continue;
      }
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
    if (missing && this.vehicleRetries++ < 30) {
      const map = this.map;
      window.setTimeout(() => {
        if (this.map === map) this.initVehicles();
      }, 300);
    }
  }

  // ------------------------------------------------------------------ thế giới nhiều mảnh
  /** Nạp mọi mảnh, ghép vào một canvas thế giới; mảnh hỏng (trừ mảnh đầu) bị chặn + bỏ vật/địa điểm trong đó. */
  private loadPanels(map: CityMap, seq: number) {
    const im = map.image!;
    const panels = im.panels!;
    void Promise.allSettled(panels.map((p) => loadMapImage(p.src))).then((res) => {
      if (seq !== this.loadSeq) return;
      if (res[0]!.status !== 'fulfilled') {
        this.imgFailed = true;
        this.cbs.onImageError?.();
        return;
      }
      const cv = makeCanvas(im.size.w, im.size.h);
      const c = ctx2d(cv);
      c.fillStyle = '#0b1a22';
      c.fillRect(0, 0, im.size.w, im.size.h);
      const dead: { x: number; y: number; w: number; h: number }[] = [];
      const ov = im.blend ?? 20;
      const drawn: { x: number; y: number; w: number; h: number }[] = [];
      res.forEach((r, i) => {
        const p = panels[i]!;
        if (r.status !== 'fulfilled') {
          dead.push({ x: p.x, y: p.y, w: p.w ?? PANEL_W, h: p.h ?? PANEL_H });
          return;
        }
        const img = r.value;
        const pw = img.naturalWidth;
        const ph = img.naturalHeight;
        const overlaps = drawn.some((d) => p.x < d.x + d.w && d.x < p.x + pw && p.y < d.y + d.h && d.y < p.y + ph);
        if (!overlaps || ov <= 0) c.drawImage(img, p.x, p.y);
        else blendPanel(c, img, p.x, p.y, pw, ph, drawn, ov);
        drawn.push({ x: p.x, y: p.y, w: pw, h: ph });
      });
      if (dead.length) this.dropRegions(dead);
      this.bg = cv;
      this.bgColor = averageColor(res[0]!.value);
    });
  }

  private dropRegions(rs: { x: number; y: number; w: number; h: number }[]) {
    const w = this.imgW!;
    const inAny = (x: number, y: number) => rs.some((r) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h);
    for (let j = 0; j < w.mh; j++)
      for (let i = 0; i < w.mw; i++) if (inAny(i * w.cell + w.cell / 2, j * w.cell + w.cell / 2)) {
        w.walk[j * w.mw + i] = 0;
        w.water[j * w.mw + i] = 0;
      }
    const keep = (idx: Int32Array) => idx.filter((n) => !inAny((n % w.mw) * w.cell, Math.floor(n / w.mw) * w.cell));
    (w as { walkCells: Int32Array }).walkCells = keep(w.walkCells);
    (w as { waterCells: Int32Array }).waterCells = keep(w.waterCells);
    this.objects = this.objects.filter((o) => !inAny(o.x, o.y - 1));
    this.walkers = this.walkers.filter((k) => !inAny(k.x, k.y));
    const pois = this.map.pois.filter((p) => !inAny(p.door.x, p.door.y));
    this.map = { ...this.map, pois, npcs: this.map.npcs.filter((n) => !inAny(n.at.x, n.at.y)) };
    this.npcs = this.npcs.filter((n) => !inAny(n.x, n.y));
  }

  // ------------------------------------------------------------------ cảnh đối tượng
  private spriteCache = new Map<string, Promise<Bitmap | null>>();
  private hostPending = false;
  private lastStationSoundCycle = -1;
  private lastCyc = 0;
  private stepCount = 0;
  private panelIdx = -1;
  private planeT = 6;

  /** Nạp một sprite vật (cắt/xoá theo `SceneSprite`) thành canvas. */
  private loadObjectSprite(id: string, sp: SceneSprite): Promise<Bitmap | null> {
    const key = `${this.map.id}/${id}`;
    let p = this.spriteCache.get(key);
    if (!p) {
      p = loadMapImage(sp.src ?? `/travel/sprites/${this.map.id}/${sp.file ?? `${id}.png`}`)
        .then((img) => {
          const cr = sp.crop ?? { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
          const source = makeCanvas(cr.w, cr.h);
          const sourceCtx = ctx2d(source);
          sourceCtx.imageSmoothingEnabled = false;
          sourceCtx.drawImage(img, cr.x, cr.y, cr.w, cr.h, 0, 0, cr.w, cr.h);
          for (const e of sp.erase ?? []) sourceCtx.clearRect(e.x, e.y, e.w, e.h);
          const cv = makeCanvas(sp.w, sp.h);
          const c = ctx2d(cv);
          c.imageSmoothingEnabled = false;
          c.drawImage(source, 0, 0, sp.w, sp.h);
          return { src: cv, w: sp.w, h: sp.h } as Bitmap;
        })
        .catch(() => null);
      this.spriteCache.set(key, p);
    }
    return p;
  }

  private initScene() {
    const sc = this.map.scene;
    if (!sc || this.interior) return;
    for (const o of sc.objects) {
      const sp = sc.sprites[o.sprite];
      if (!sp) continue;
      const e: ObjEnt = { kind: 'object', bmps: [], x: o.x, y: o.y, z: 0, frame: 0, flip: false, footRow: sp.h, w: sp.w, h: sp.h, sortY: o.y + (o.z ?? 0), obj: o };
      this.objects.push(e);
      const seq = this.loadSeq;
      void this.loadObjectSprite(o.sprite, sp).then((b) => {
        if (b && seq === this.loadSeq) e.bmps = [b];
      });
    }
    // người đi dạo nền
    const n = sc.ambient ?? 8;
    const w = this.imgW!;
    const rnd = mulberry32(hash2(this.map.id.length, 77, 5));
    for (let i = 0; i < n && w.walkCells.length > 0; i++) {
      const bmps = this.personBitmaps(`walker_${i % 8}`);
      if (!bmps.length) break;
      const c = w.walkCells[Math.floor(rnd() * w.walkCells.length)]!;
      const x = (c % w.mw) * w.cell + 1;
      const y = Math.floor(c / w.mw) * w.cell + 1;
      this.walkers.push({
        kind: 'npc',
        bmps,
        x,
        y,
        z: 0,
        frame: personFrame('down', 0),
        flip: false,
        footRow: 21,
        w: 16,
        h: 24,
        sortY: y,
        path: [],
        wait: rnd() * 3,
        dir: 'down',
        walking: false,
        seed: Math.floor(rnd() * 1e6),
        chat: null,
        chatUntil: 0,
        nextChat: 4 + rnd() * 12,
      });
    }
  }

  /** Tiếng nền rất nhẹ: qua mảnh bản đồ khác, máy bay bay qua khi người chơi ở gần cổng sân bay. */
  private updateAmbientSfx(dt: number) {
    if (this.interior || !this.isImg) return;
    const panels = this.map.image?.panels;
    if (panels && panels.length > 1) {
      let best = -1;
      let bd = -1;
      panels.forEach((q, i) => {
        const w = q.w ?? 418;
        const h = q.h ?? 235;
        const px = this.player.x - q.x;
        const py = this.player.y - q.y;
        if (px < 0 || py < 0 || px >= w || py >= h) return;
        const d = Math.min(px, w - px, py, h - py);
        if (d > bd) {
          bd = d;
          best = i;
        }
      });
      if (best >= 0 && best !== this.panelIdx) {
        if (this.panelIdx >= 0) playSfx('seam');
        this.panelIdx = best;
      }
    }
    const gate = this.map.pois.find((q) => q.id.endsWith('-gate'));
    if (gate) {
      this.planeT -= dt;
      if (this.planeT <= 0) {
        this.planeT = 18 + Math.random() * 10;
        const d = this.doorPt(gate);
        if (Math.hypot(d.x - this.player.x, d.y - this.player.y) < 260) playSfx('plane');
      }
    }
  }

  private updateWalkers(dt: number) {
    const w = this.imgW!;
    const nowMs = this.t * 1000;
    for (const k of this.walkers) {
      if (k.path.length === 0) {
        k.walking = false;
        k.wait -= dt;
        if (k.wait <= 0) {
          const c = w.walkCells[hash2(k.seed, Math.floor(this.t * 3), 9) % w.walkCells.length]!;
          const to = { x: (c % w.mw) * w.cell + 1, y: Math.floor(c / w.mw) * w.cell + 1 };
          const path = findPathPx(w, { x: k.x, y: k.y }, to);
          if (path && path.length) k.path = path.slice(0, 12);
          k.wait = 1.5 + (hash2(k.seed, Math.floor(this.t), 4) % 40) / 10;
        }
      } else {
        const next = k.path[0]!;
        const dx = next.x - k.x;
        const dy = next.y - k.y;
        const d = Math.hypot(dx, dy);
        const sp = 15 * dt;
        k.dir = this.dirTo(dx, dy);
        k.walking = true;
        if (d <= sp) {
          k.x = next.x;
          k.y = next.y;
          k.path.shift();
        } else {
          k.x += (dx / d) * sp;
          k.y += (dy / d) * sp;
        }
      }
      const cyc = k.walking ? Math.floor(this.t * 6 + k.seed) % 4 : 0;
      k.frame = personFrame(k.dir, cyc === 1 ? 1 : cyc === 3 ? 2 : 0);
      k.sortY = k.y;
      // chuyện phiếm: bong bóng ngắn thi thoảng hiện
      if (k.chat && nowMs > k.chatUntil) k.chat = null;
      k.nextChat -= dt;
      if (k.nextChat <= 0) {
        const pool = CHATTER;
        k.chat = pool[hash2(k.seed, Math.floor(this.t), 8) % pool.length]!;
        k.chatUntil = nowMs + 2400;
        k.nextChat = 10 + (hash2(k.seed, Math.floor(this.t), 3) % 100) / 5;
      }
    }
  }

  // ------------------------------------------------------------------ vào / ra địa điểm
  private startFade(target: number, cb?: () => void) {
    this.fade.target = target;
    this.fade.cb = cb ?? null;
  }

  private updateFade(dt: number) {
    const f = this.fade;
    if (f.a === f.target) return;
    const step = dt * 4.5;
    f.a = f.a < f.target ? Math.min(f.target, f.a + step) : Math.max(f.target, f.a - step);
    if (f.a === f.target && f.cb) {
      const cb = f.cb;
      f.cb = null;
      cb();
    }
  }

  /** Bước vào địa điểm: có phòng trong → mờ dần rồi vào phòng; còn lại → thẳng vào lượt hỏi. */
  private beginEnter(poi: Poi) {
    if (this.fade.target === 1 || this.missionMode) return;
    const kind = this.roomKindOf(poi);
    this.player.path = [];
    this.keys = [];
    if (!kind || this.interior) {
      playSfx('enter');
      this.startFade(1, () => {
        this.cbs.onEnterPoi(poi.id);
        this.startFade(0);
      });
      return;
    }
    const parent = this.map;
    playSfx('doorOpen');
    this.startFade(1, () => {
      this.openInterior(poi, kind, parent);
      playSfx('enter');
    });
  }

  private openInterior(poi: Poi, kind: InteriorKind, parent: CityMap) {
    const layout = interiorLayout(kind, 'main', parent.id);
    const bg = drawInterior(kind, this.atlas.pal.colors, layout);
    const im = roomMap(parent, poi, layout, roomNpcs(poi, kind, layout, parent.id));
    this.hostPending = false;
    this.setMap(im, this.state, { bg, spawn: layout.spawn, interior: { poi, kind, zone: 'main', parent, since: 0, beat: false, hosted: false, layout } });
    this.startFade(0);
    // Ảnh phòng thật (nếu có) thay phòng vẽ bằng mã; cùng bố cục nên thay êm.
    const seq = this.loadSeq;
    const artDir = (CITY_INTERIOR_ART[parent.id] ?? []).includes(kind) ? `/travel/interiors/${parent.id}` : '/travel/interiors';
    const image = kind === 'garden' || kind === 'landmark' || kind === 'secret'
      ? Promise.reject(new Error('generated outdoor scene'))
      : loadMapImage(`${artDir}/${kind}.small.png`).catch(() => loadMapImage(`${artDir}/${kind}.png`));
    image
      .then((img) => {
        if (seq !== this.loadSeq || !this.interior) return;
        // chuẩn hoá về cỡ phòng (lấy mẫu gần nhất) để khớp bố cục
        let src: CanvasImageSource = img;
        if (img.naturalWidth !== INTERIOR_SIZE.w || img.naturalHeight !== INTERIOR_SIZE.h) {
          const cv = makeCanvas(INTERIOR_SIZE.w, INTERIOR_SIZE.h);
          ctx2d(cv).drawImage(img, 0, 0, INTERIOR_SIZE.w, INTERIOR_SIZE.h);
          src = cv;
        }
        this.bg = src;
        this.bgColor = averageColor(src);
      })
      .catch(() => undefined);
  }

  private closeInterior() {
    const it = this.interior;
    if (!it) return;
    const door = this.doorPt(it.poi);
    playSfx('doorClose');
    this.startFade(1, () => {
      this.setMap(it.parent, this.state, { spawn: { x: door.x, y: door.y }, lock: it.poi.id });
      playSfx('leave');
      this.startFade(0);
    });
  }

  private switchInteriorZone(destination: InteriorZone) {
    const current = this.interior;
    if (!current || current.zone === destination || this.fade.target === 1) return;
    const portal = current.layout.portal;
    if (!portal || portal.destination !== destination) return;
    const layout = interiorLayout(current.kind, destination, current.parent.id);
    playSfx('doorOpen');
    this.startFade(1, () => {
      const bg = drawInterior(current.kind, this.atlas.pal.colors, layout);
      const next = { ...current, zone: destination, since: 0, beat: true, hosted: true, layout };
      this.hostPending = false;
      this.lastStationSoundCycle = -1;
      const npcs = destination === 'back' ? [] : roomNpcs(current.poi, current.kind, layout, current.parent.id);
      this.setMap(roomMap(current.parent, current.poi, layout, npcs), this.state, { bg, spawn: portal.spawn, interior: next });
      if (destination === 'back') this.loadBackArt(current.kind, current.parent.id);
      playSfx('enter');
      this.startFade(0);
    });
  }

  /** Tranh khu phụ `<thành phố>/<loại>-back`, nạp sau khi đã vào; cùng cỡ với tranh phòng chính. */
  private loadBackArt(kind: InteriorKind, cityId: string) {
    const base = `/travel/interiors/${cityId}/${kind}-back`;
    const seq = this.loadSeq;
    loadMapImage(`${base}.small.png`).catch(() => loadMapImage(`${base}.png`))
      .then((img) => {
        if (seq !== this.loadSeq || this.interior?.zone !== 'back') return;
        let src: CanvasImageSource = img;
        if (img.naturalWidth !== INTERIOR_SIZE.w || img.naturalHeight !== INTERIOR_SIZE.h) {
          const cv = makeCanvas(INTERIOR_SIZE.w, INTERIOR_SIZE.h);
          ctx2d(cv).drawImage(img, 0, 0, INTERIOR_SIZE.w, INTERIOR_SIZE.h);
          src = cv;
        }
        this.bg = src;
        this.bgColor = averageColor(src);
      })
      .catch(() => undefined);
  }

  /** Nói chuyện với chủ quán / lễ tân → bắt đầu lượt hỏi. */
  private callHost() {
    const it = this.interior;
    if (!it || it.hosted) return;
    it.hosted = true;
    playSfx('greet');
    this.bubble = { en: 'Welcome! How can I help?', vi: '', wx: it.layout.host.x, wy: it.layout.host.y - 24, until: this.t * 1000 + 1600 };
    const poi = it.poi;
    window.setTimeout(() => this.cbs.onEnterPoi(poi.id), 450);
  }

  private updateInterior() {
    const it = this.interior;
    if (!it || this.fade.target === 1) return;
    const p = this.player;
    const portal = it.layout.portal;
    if (portal && Math.hypot(p.x - portal.at.x, p.y - portal.at.y) < 19) {
      this.switchInteriorZone(portal.destination);
      return;
    }
    if (it.kind === 'station' && it.zone === 'platform') {
      const cycle = Math.floor(this.t / 24);
      const phase = this.t % 24;
      if (phase >= 5 && phase < 5.25 && cycle !== this.lastStationSoundCycle) {
        this.lastStationSoundCycle = cycle;
        playSfx('train');
      }
    }
    // nhịp bước vào 600 ms rồi tự đi tới quầy
    if (!it.beat && this.t > 0.6 && p.path.length === 0) {
      it.beat = true;
      p.path = [{ x: it.layout.hostFront.x, y: it.layout.hostFront.y }];
      p.moveAnnounced = false;
      this.hostPending = true;
    }
    if (this.hostPending && p.path.length === 0 && Math.hypot(p.x - it.layout.hostFront.x, p.y - it.layout.hostFront.y) < 3) {
      this.hostPending = false;
      this.callHost();
    }
    // lối ra ở đáy giữa
    if (this.t > 1 && p.y >= it.layout.doorway.y + 4 && Math.abs(p.x - it.layout.exit.x) < it.layout.doorway.w) this.closeInterior();
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
    if (this.interior) {
      this.hour = 12;
      this.weather = { kind: 'clear', intensity: 0 };
    }
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

    this.updateFade(dt);
    this.updatePlayer(dt);
    if (this.isScene || this.map.interiors) this.autoDoor();
    if (this.interior) this.updateInterior();
    if (!calm) {
      this.updateNpcs(dt);
      this.updatePigeons(dt);
      this.updateVehicles(dt);
      if (!this.interior) this.updateBirds(dt);
      if (this.walkers.length) this.updateWalkers(dt);
    } else this.updateVehicles(0);
    this.updateMission(dt);
    this.updateEffects(dt);
    this.particles.update(dt);
    if (this.bubble && this.t * 1000 > this.bubble.until) this.bubble = null;
    this.updateAmbientSfx(dt);
    this.playerCbT -= dt;
    if (this.playerCbT <= 0 && this.cbs.onPlayer && !this.interior) {
      this.playerCbT = 0.2;
      // Chỉ báo lên giao diện khi vị trí đổi ≥ 1 điểm: đứng yên thì không kéo React dựng lại.
      const px = Math.round(this.player.x);
      const py = Math.round(this.player.y);
      if (px !== this.lastPlayerCb.x || py !== this.lastPlayerCb.y) {
        this.lastPlayerCb.x = px;
        this.lastPlayerCb.y = py;
        this.cbs.onPlayer({ x: px, y: py });
      }
    }
    const camT = this.camFocus ?? { x: this.player.x, y: this.player.y - 6 };
    this.cam.update(dt, camT.x, camT.y, this.view, this.worldW, this.worldH);
    if (this.enterLock) {
      const poi = this.map.pois.find((q) => q.id === this.enterLock);
      if (poi) {
        const d = this.doorPt(poi);
        if (Math.hypot(d.x - this.player.x, d.y - this.player.y) > (this.isImg ? 12 : 14)) this.enterLock = null;
      }
    }
  }

  /** Phòng trong của địa điểm: bản ảnh mọi loại có phòng; bản lưới có phòng chỉ với địa điểm trong nhà (không có lệnh riêng). */
  private roomKindOf(poi: Poi): InteriorKind | null {
    if (this.isImg) return interiorKindOf(poi.kind);
    if (!this.map.interiors || getPoiContent(poi.id)?.action) return null;
    if (poi.kind === 'garden' || poi.kind === 'landmark' || poi.kind === 'secret') return null;
    return interiorKindOf(poi.kind);
  }

  /** Chế độ đối tượng: bước lên ô cửa của địa điểm đang mở thì vào luôn (khoá thì báo). */
  private autoDoor() {
    if (this.fade.target === 1 || this.enterLock) return;
    const p = this.player;
    for (const poi of this.map.pois) {
      if (!this.isScene && !this.roomKindOf(poi)) continue;
      const d = this.doorPt(poi);
      if (Math.hypot(d.x - p.x, d.y - p.y) <= 4) {
        this.tryEnterNear(true, poi.id);
        return;
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
    const keys = this.keys.length ? this.keys : this.stick;
    const held = keys.length ? keys[keys.length - 1]! : null;
    if (this.isImg) {
      // Ảnh: đi mượt theo phím; chạm thì theo đường đã dựng.
      if (held) {
        p.path.length = 0;
        this.pendingEnter = null;
        let dx = 0;
        let dy = 0;
        for (const k of keys) {
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
        if (!this.interior) this.cbs.onMove(this.isImg ? { x: Math.round(p.x), y: Math.round(p.y) } : this.tileOf(p));
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
    if (p === this.player && cyc !== this.lastCyc && (cyc === 1 || cyc === 3)) {
      this.stepCount += 1;
      if (this.stepCount % 2 === 0) playSfx('step');
    }
    if (p === this.player) this.lastCyc = cyc;
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
    if (this.lockedPoi(target)) {
      if (this.enterLock !== target.id) this.showLocked(target);
      this.enterLock = target.id;
      return;
    }
    this.enterLock = target.id;
    this.beginEnter(target);
  }

  private showLocked(poi: Poi) {
    const after = poi.unlock?.after ? this.map.pois.find((q) => q.id === poi.unlock!.after) : undefined;
    playSfx('locked');
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
        if (this.lockedPoi(poi)) continue;
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
  private drawInteriorEffects(c: CanvasRenderingContext2D, camX: number, camY: number, tt: number) {
    const it = this.interior;
    if (!it) return;
    const px = (x: number) => Math.round(x - camX);
    const py = (y: number) => Math.round(y - camY);
    const rect = (x: number, y: number, w: number, h: number, color: string) => {
      c.fillStyle = color;
      c.fillRect(px(x), py(y), w, h);
    };

    if (it.layout.portal && it.kind !== 'station') {
      const d = it.layout.portal.rect;
      rect(d.x - 2, d.y - 2, d.w + 4, d.h + 4, '#2b170b');
      rect(d.x, d.y, d.w, d.h, '#8a5530');
      rect(d.x + 3, d.y + 3, d.w - 6, d.h - 6, '#a86a3a');
      rect(d.x + Math.floor(d.w / 2) - 1, d.y + 3, 2, d.h - 6, '#5b3118');
      rect(d.x + d.w - 7, d.y + Math.floor(d.h / 2) - 1, 2, 3, '#f2d27a');
      c.fillStyle = Math.floor(tt * 2) % 2 ? '#ffe18a' : '#f7f0d8';
      c.font = '6px monospace';
      c.fillText(it.layout.portal.label.vi, px(d.x - 6), py(d.y - 4));
    }
    if (it.kind === 'station' && it.zone === 'main' && it.layout.portal) {
      const { rect: stair } = it.layout.portal;
      rect(stair.x, stair.y, stair.w, stair.h, '#26354b');
      rect(stair.x + 3, stair.y + 3, stair.w - 6, stair.h - 6, '#111d31');
      rect(stair.x + 8, stair.y + 8, stair.w - 16, 13, '#374d67');
      for (let i = 0; i < 6; i++) {
        const x = stair.x + 8 + i * 3;
        const y = stair.y + 27 + i * 5;
        rect(x, y, stair.w - 18 - i * 6, 3, i % 2 ? '#b5c0c4' : '#d8c77b');
      }
      rect(stair.x + 8, stair.y + 4, stair.w - 16, 1, '#9acfc7');
      c.fillStyle = Math.floor(tt * 2) % 2 ? '#ffe18a' : '#a2e6df';
      c.font = '6px monospace';
      c.fillText('PLATFORM ↓', px(stair.x + 13), py(stair.y + 19));
      return;
    }

    if (it.kind === 'station' && it.zone === 'platform') {
      const phase = tt % 24;
      const trainX = phase < 5 ? -365 + (phase / 5) * 435 : phase < 15 ? 70 : phase < 19 ? 70 + (phase - 15) * 112 : -420;
      const x = Math.round(trainX);
      const y = 66;
      rect(x - 5, y + 52, 354, 5, '#080d16');
      rect(x, y, 344, 51, '#e3e5d7');
      rect(x + 4, y + 5, 336, 7, '#e95c4f');
      rect(x + 5, y + 41, 334, 8, '#28558a');
      rect(x, y + 48, 344, 4, '#303944');
      for (let i = 0; i < 7; i++) {
        const wx = x + 12 + i * 45;
        rect(wx, y + 14, 31, 18, '#263b55');
        rect(wx + 2, y + 16, 27, 13, i % 2 ? '#84b9c2' : '#9bc9ce');
        rect(wx + 3, y + 17, 8, 3, '#d9eedb');
      }
      const stopped = phase >= 5 && phase < 15;
      for (const doorX of [145, 235]) {
        rect(x + doorX, y + 13, 21, 28, stopped ? '#132237' : '#d4ddd2');
        if (stopped) {
          rect(x + doorX - 3, y + 12, 2, 30, '#f6d15e');
          rect(x + doorX + 22, y + 12, 2, 30, '#f6d15e');
        }
      }
      rect(x + 331, y + 15, 10, 20, '#b5c3c3');
      rect(x + 340, y + 20, 3, 10, '#f7e18a');
      if (stopped) {
        rect(20, 119, 2, 8, '#f5dc69');
        rect(396, 119, 2, 8, '#f5dc69');
      }
      return;
    }

    // A restrained looping pixel detail keeps each venue alive without obscuring the room art.
    if (it.kind === 'cafe' || it.kind === 'restaurant') {
      for (let i = 0; i < 3; i++) {
        const drift = (tt * 7 + i * 11) % 16;
        c.globalAlpha = 0.52 - drift / 45;
        rect(116 + i * 6, 130 - drift, 2, 3, '#fff0d1');
      }
      c.globalAlpha = 1;
    } else if (it.kind === 'market') {
      if (Math.floor(tt * 3) % 5 === 0) rect(90 + (Math.floor(tt * 9) % 220), 112, 3, 3, '#ffe88c');
    } else if (it.kind === 'museum') {
      const blink = Math.floor(tt * 2) % 2;
      rect(74, 60, 3, 3, blink ? '#ffe596' : '#f5c862');
      rect(351, 104, 3, 3, blink ? '#fff0ad' : '#e2bf6a');
    } else if (it.kind === 'airport') {
      if (Math.floor(tt * 2) % 3 === 0) rect(299, 29, 4, 2, '#ffd666');
    } else if (it.kind === 'hotel') {
      const tick = Math.floor(tt * 2) % 2;
      rect(328, 52, 3, 3, tick ? '#ffe198' : '#f0bc60');
    } else if (it.kind === 'garden') {
      const drift = (tt * 15) % 320;
      rect(35 + drift, 60 + Math.sin(tt + drift) * 18, 3, 2, '#f0d875');
      rect(345 - drift * 0.6, 93 + Math.cos(tt * 0.8) * 12, 2, 3, '#f0d875');
    } else if (it.kind === 'landmark') {
      const flutter = Math.floor(tt * 5) % 2;
      rect(207, 50, 3, 8, '#5a2d30');
      rect(210, 50, 11 + flutter * 2, 5, flutter ? '#ec6a55' : '#e9c65a');
    } else if (it.kind === 'secret') {
      const glow = Math.floor(tt * 3) % 2;
      rect(54, 85, 12, 8, glow ? '#f5c05a' : '#c9924c');
      rect(58, 87, 4, 4, glow ? '#fff2a1' : '#ffd981');
    }
  }

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
    if (this.interior) this.drawInteriorEffects(c, camX, camY, tt);

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
    for (const o of this.objects) {
      if (o.bmps.length === 0) continue;
      if (o.x + o.w / 2 < camX || o.x - o.w / 2 > camX + v.W || o.y < camY || o.y - o.h > camY + v.H) continue;
      list.push(o);
    }
    for (const k of this.walkers) list.push(k);
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
    if (!this.interior) this.drawClouds(c, camX, camY, tt);

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
      if (this.isImg && !this.interior) for (const L of this.map.image!.lights ?? []) push(Math.round(L.x - camX), Math.round(L.y - camY), L.r, 1);
      for (const o of this.objects) if (o.obj.glow) push(Math.round(o.x + o.obj.glow.dx - camX), Math.round(o.y + o.obj.glow.dy - camY), o.obj.glow.r, 1);
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
    for (const o of this.objects) {
      const f = footprintRect(o.obj);
      c.fillStyle = 'rgba(255,0,200,0.35)';
      c.fillRect(f.x - camX, f.y - camY, f.w, f.h);
      c.strokeStyle = 'rgba(255,160,0,0.8)';
      c.strokeRect(o.x - o.w / 2 - camX + 0.5, o.y - o.h - camY + 0.5, o.w - 1, o.h - 1);
      c.fillStyle = '#fff';
      c.fillRect(Math.round(o.x - camX), Math.round(o.y - camY), 1, 1);
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
      const locked = this.lockedPoi(poi);
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

  /** Thẻ tên nổi trên mỗi địa điểm, vòng nhấp nháy ở nơi nên đi tiếp, mũi tên chỉ hướng khi nơi đó ngoài màn hình. */
  private drawPoiTags(
    d: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    px: (n: number) => number,
    pill: (text: string, cx: number, cy: number, o: { bg: string; fg: string; border: string; size?: number }) => void,
  ) {
    const v = this.view;
    const vi = this.opts.locale === 'vi';
    const cssPer = v.k / v.dpr;
    const pulse = this.opts.reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(this.t * 3.2);
    const rec = this.hl.recommended ?? null;
    const focus = this.hl.focus ?? null;
    for (const poi of this.map.pois) {
      const dp = this.doorPt(poi);
      const dist = Math.hypot(dp.x - this.player.x, dp.y - this.player.y);
      const isRec = poi.id === rec;
      const isFocus = poi.id === focus || poi.id === this.hoverPoi;
      const near = dist * cssPer < 220;
      const locked = this.lockedPoi(poi);
      const best = this.state.poi[poi.id]?.best ?? 0;
      const isAction = !!getPoiContent(poi.id)?.action;
      const done = best >= 2 && !isAction;
      const door = this.toDev(dp.x, dp.y, camX, camY);
      const onScreen = door.x > -px(40) && door.x < v.devW + px(40) && door.y > -px(40) && door.y < v.devH + px(40);
      // vòng quanh cửa: nơi nên đi (nhấp nháy) và nơi đã hoàn thành (vòng vàng mảnh)
      if (onScreen && (isRec || done) && !locked) {
        d.lineWidth = Math.max(1, px(isRec ? 2 : 1.5));
        d.strokeStyle = isRec ? `rgba(226,200,143,${(0.55 + 0.4 * pulse).toFixed(2)})` : 'rgba(184,149,90,0.75)';
        d.beginPath();
        d.arc(door.x, door.y, px(isRec ? 11 + pulse * 5 : 9), 0, Math.PI * 2);
        d.stroke();
        if (isRec) {
          d.strokeStyle = `rgba(226,200,143,${(0.3 * (1 - pulse)).toFixed(2)})`;
          d.beginPath();
          d.arc(door.x, door.y, px(18 + pulse * 8), 0, Math.PI * 2);
          d.stroke();
        }
      }
      if (!(near || isFocus || isRec)) continue;
      // thẻ tên phía trên toà nhà (nếu có vùng chạm), không thì ngay dưới cửa
      const rect = this.isImg ? (poi.hotspot ?? poi.footprint) : null;
      const anchor = rect ? this.toDev(rect.x + rect.w / 2, rect.y + 3, camX, camY) : { x: door.x, y: door.y + px(12) };
      if (anchor.x < -px(60) || anchor.x > v.devW + px(60) || anchor.y < -px(30) || anchor.y > v.devH + px(30)) continue;
      const icon = locked ? '🔒' : done ? '✓' : (KIND_ICON[poi.kind] ?? '📍');
      const name = vi ? poi.name.vi : poi.name.en;
      const text = `${icon} ${name}`;
      const size = px(12);
      d.font = `700 ${size}px "Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif`;
      const tw = d.measureText(text).width;
      const w = Math.round(tw + px(14));
      const showStars = !isAction && !locked;
      const h = Math.round(size + px(showStars ? 15 : 9));
      const x = Math.round(Math.max(px(4), Math.min(v.devW - w - px(4), anchor.x - w / 2)));
      const y = Math.round(Math.max(px(4), anchor.y - h - px(2)));
      const bg = locked ? '#D8D2C3' : isRec ? '#FBF1D3' : '#F3EDE1';
      const border = locked ? '#8c8576' : done || isRec ? '#B8955A' : '#0F1D33';
      d.fillStyle = border;
      d.fillRect(x - px(1), y - px(1), w + px(2), h + px(2));
      d.fillStyle = bg;
      d.fillRect(x, y, w, h);
      d.globalAlpha = locked ? 0.7 : 1;
      d.fillStyle = locked ? '#6b6556' : '#0F1D33';
      d.textAlign = 'center';
      d.fillText(text, Math.round(x + w / 2), Math.round(y + size / 2 + px(5)));
      d.globalAlpha = 1;
      if (showStars) {
        for (let i = 0; i < 3; i++) {
          d.fillStyle = i < best ? '#B8955A' : 'rgba(15,29,51,0.22)';
          const sx = Math.round(x + w / 2 + (i - 1) * px(9));
          d.beginPath();
          d.arc(sx, Math.round(y + h - px(5)), px(2.4), 0, Math.PI * 2);
          d.fill();
        }
      }
    }
    // mũi tên mục tiêu ở mép màn hình khi nơi nên đi nằm ngoài khung nhìn
    const target = rec ? this.map.pois.find((q) => q.id === rec) : undefined;
    if (target && !this.interior) {
      const dp = this.toDev(this.doorPt(target).x, this.doorPt(target).y, camX, camY);
      const m = px(34);
      if (dp.x < m || dp.x > v.devW - m || dp.y < m || dp.y > v.devH - m) {
        const cx = v.devW / 2;
        const cy = v.devH / 2;
        const dx = dp.x - cx;
        const dy = dp.y - cy;
        const k = Math.min((cx - m) / Math.max(1e-6, Math.abs(dx)), (cy - m) / Math.max(1e-6, Math.abs(dy)));
        const ax = cx + dx * k;
        const ay = cy + dy * k;
        const ang = Math.atan2(dy, dx);
        d.save();
        d.translate(ax, ay);
        d.rotate(ang);
        d.globalAlpha = 0.75 + 0.25 * pulse;
        d.fillStyle = '#E2C88F';
        d.strokeStyle = '#0F1D33';
        d.lineWidth = Math.max(1, px(1.5));
        d.beginPath();
        d.moveTo(px(12), 0);
        d.lineTo(-px(8), px(9));
        d.lineTo(-px(3), 0);
        d.lineTo(-px(8), -px(9));
        d.closePath();
        d.fill();
        d.stroke();
        d.restore();
        d.globalAlpha = 1;
        const label = vi ? target.name.vi : target.name.en;
        pill(label, Math.min(v.devW - px(60), Math.max(px(60), ax - Math.cos(ang) * px(54))), Math.min(v.devH - px(16), Math.max(px(16), ay - Math.sin(ang) * px(30))), { bg: '#FBF1D3', fg: '#0F1D33', border: '#B8955A', size: 11 });
      }
    }
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

    if (!this.interior) this.drawPoiTags(d, camX, camY, px, pill);
    this.drawMissionTags(d, camX, camY, px, pill);

    // Phòng trong: nhắc phím E gần chủ quán / lối ra
    if (this.interior && this.fade.a < 0.5) {
      const L = this.interior.layout;
      const pl = this.player;
      const vi2 = this.opts.locale === 'vi';
      if (Math.hypot(pl.x - L.host.x, pl.y - L.host.y) < 34) {
        const pp = this.toDev(L.host.x, L.host.y - 30, camX, camY);
        pill(vi2 ? 'E · Nói chuyện' : 'E · Talk', pp.x, pp.y, { bg: '#F3EDE1', fg: '#0F1D33', border: '#B8955A' });
      } else if (Math.hypot(pl.x - L.exit.x, pl.y - L.exit.y) < 30) {
        const pp = this.toDev(L.exit.x, L.exit.y - 22, camX, camY);
        pill(vi2 ? 'E · Ra ngoài' : 'E · Exit', pp.x, pp.y, { bg: '#F3EDE1', fg: '#0F1D33', border: '#B8955A' });
      }
    }

    // chuyện phiếm của người đi dạo: bong bóng nhỏ
    for (const k of this.walkers) {
      if (!k.chat || this.missionTalkId) continue;
      const pos = this.toDev(k.x, k.y - 26, camX, camY);
      if (pos.x < 0 || pos.x > v.devW || pos.y < 0 || pos.y > v.devH) continue;
      pill(k.chat, pos.x, pos.y, { bg: '#FFFFFF', fg: '#0F1D33', border: '#0F1D33', size: 11 });
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
      const l2: string[] = [];
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
        d.fillStyle = '#6b6350';
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

    if (this.fade.a > 0) {
      d.fillStyle = `rgba(15,29,51,${this.fade.a.toFixed(3)})`;
      d.fillRect(0, 0, v.devW, v.devH);
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
    const rect = () => {
      const r = cv.getBoundingClientRect();
      this.rectW = r.width;
      this.rectH = r.height;
      return r;
    };
    on('pointerdown', (e) => {
      if (!this.inputEnabled) return;
      this.wake();
      cv.focus({ preventScroll: true });
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      rect();
      // Hai ngón (định phóng / xoay): không coi là chạm để đi.
      this.downAt = this.pointers.size > 1 ? null : { x: e.clientX, y: e.clientY, t: performance.now() };
    });
    // Safari: chặn cử chỉ phóng bằng hai ngón trên canvas.
    for (const g of ['gesturestart', 'gesturechange', 'gestureend', 'contextmenu']) {
      cv.addEventListener(g, prevent as EventListener, { passive: false });
      this.cleanup.push(() => cv.removeEventListener(g, prevent as EventListener));
    }
    const onVis = () => {
      if (!document.hidden) {
        this.lastFrame = performance.now();
        this.wake();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    this.cleanup.push(() => document.removeEventListener('visibilitychange', onVis));
    on('pointerup', (e) => {
      this.pointers.delete(e.pointerId);
      if (!this.inputEnabled) {
        this.downAt = null;
        return;
      }
      const d = this.downAt;
      this.downAt = null;
      if (!d) return;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 10 || performance.now() - d.t > 600) return;
      const r = rect();
      this.tap(e.clientX - r.left, e.clientY - r.top);
    });
    on('pointercancel', (e) => {
      this.pointers.delete(e.pointerId);
      this.downAt = null;
    });
    on('pointermove', (e) => {
      if (e.pointerType !== 'touch') this.wake();
      if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (e.pointerType === 'touch') return;
      const r = rect();
      const hit = this.hit(e.clientX - r.left, e.clientY - r.top);
      const hp = hit.poi?.id ?? null;
      this.hoverPoi = hp;
      this.cbs.onHoverPoi?.(hp, { x: e.clientX - r.left, y: e.clientY - r.top });
      cv.style.cursor = hit.poi || hit.npc >= 0 ? 'pointer' : 'default';
    });
    on('pointerenter', () => {
      this.hovered = true;
    });
    on('pointerleave', () => {
      this.hovered = false;
      this.hoverPoi = null;
      this.cbs.onHoverPoi?.(null, { x: 0, y: 0 });
    });
    on('focus', () => {
      this.focused = true;
    });
    on('blur', () => {
      this.focused = false;
      this.keys = [];
    });
    const kd = (e: KeyboardEvent) => {
      if (!this.inputEnabled) return;
      if (!this.focused && !this.hovered) return;
      this.wake();
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
      if ((e.key === 'f' || e.key === 'F') && this.cbs.onToggleFullscreen) {
        e.preventDefault();
        this.cbs.onToggleFullscreen();
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
    const w = this.toWorld(cssX, cssY);
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

  /** Toạ độ CSS tương đối canvas → điểm nguồn; chia theo tỉ lệ thực bộ đệm/khung hiển thị (kể cả dpr bị kẹp, letterbox). */
  private toWorld(cssX: number, cssY: number): { x: number; y: number } {
    const r = this.rectW > 0 && this.rectH > 0 ? { left: 0, top: 0, width: this.rectW, height: this.rectH } : { left: 0, top: 0, width: this.cssW, height: this.cssH };
    return clientToWorld(cssX, cssY, r, this.view, this.cam.ix, this.cam.iy);
  }

  private tap(cssX: number, cssY: number) {
    if (!this.inputEnabled) return;
    this.toast = null;
    const h = this.hit(cssX, cssY);
    if (h.npc >= 0) {
      this.talk(h.npc);
      return;
    }
    if (h.poi) {
      const q = h.poi;
      const door = this.doorPt(q);
      if (this.lockedPoi(q)) {
        this.showLocked(q);
        this.goTo(door);
        return;
      }
      this.goTo(door, q.id);
      return;
    }
    const w = this.toWorld(cssX, cssY);
    if (w.x < 0 || w.y < 0 || w.x >= this.worldW || w.y >= this.worldH) return;
    if (!this.goTo({ x: w.x, y: w.y })) this.particles.emit(PK.Ring, w.x, w.y, 0, 0, 0.5);
  }

  private talk(i: number) {
    const n = this.npcs[i];
    if (!n || n.npc.lines.length === 0) return;
    if (n.mission) {
      this.missionWalkTo(n.npc.id);
      return;
    }
    if (this.interior && n.npc.id.startsWith('host-')) {
      this.goTo({ x: this.interior.layout.hostFront.x, y: this.interior.layout.hostFront.y });
      this.hostPending = true;
      return;
    }
    if (this.cbs.onTalkNpc && n.npc.sprite.startsWith('npc_')) {
      this.cbs.onTalkNpc(conversationContextForNpc({
        cityId: this.map.id,
        npc: n.npc,
        ...(this.interior ? { poiId: this.interior.poi.id } : {}),
      }));
      return;
    }
    const line = n.npc.lines[n.line % n.npc.lines.length]!;
    n.line++;
    n.wait = Math.max(n.wait, 3);
    n.dir = this.dirTo(this.player.x - n.x, this.player.y - n.y);
    playSfx('npc');
    this.bubble = { en: line.en, vi: line.vi, wx: n.x, wy: n.y - n.footRow - 3, until: this.t * 1000 + 4800 };
  }

  private interact() {
    const p = this.player;
    if (this.interior) {
      const L = this.interior.layout;
      const portal = L.portal;
      if (portal && Math.hypot(p.x - portal.at.x, p.y - portal.at.y) < 34) return this.switchInteriorZone(portal.destination);
      if (Math.hypot(p.x - L.host.x, p.y - L.host.y) < 34) return this.callHost();
      if (Math.hypot(p.x - L.exit.x, p.y - L.exit.y) < 30) return this.closeInterior();
    }
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

/** Bản đồ của phòng (một zone): sàn đi được theo bố cục, và người đứng trong phòng. */
function roomMap(parent: CityMap, poi: Poi, layout: InteriorLayout, npcs: Npc[]): CityMap {
  return {
    id: parent.id,
    name: poi.name,
    utcOffsetHours: parent.utcOffsetHours,
    palette: parent.palette,
    size: { w: INTERIOR_SIZE.w, h: INTERIOR_SIZE.h },
    layers: { ground: [], objects: [], roofs: [] },
    spawn: layout.spawn,
    pois: [],
    npcs,
    image: { src: 'interior', scale: 1, size: { w: INTERIOR_SIZE.w, h: INTERIOR_SIZE.h }, mask: { cell: INTERIOR_CELL, rows: interiorMaskRows(layout) } },
    ambience: { weather: { kind: 'clear', intensity: 0 }, sounds: [] },
  };
}

/** Người trong phòng chính: chủ quán sau quầy, khách địa phương và du khách. */
function roomNpcs(poi: Poi, kind: InteriorKind, layout: InteriorLayout, cityId: CityId): Npc[] {
  const host: Npc = {
    id: `host-${poi.id}`,
    sprite: kind === 'hotel' || kind === 'airport' || kind === 'counter' || kind === 'station' ? 'npc_staff' : 'npc_vendor',
    at: { x: layout.host.x, y: layout.host.y },
    lines: [{ en: 'Welcome! How can I help?', vi: 'Xin chào! Tôi có thể giúp gì cho bạn?' }],
  };
  return [host, ...interiorNpcs(poi, kind, cityId)];
}

function interiorNpcs(poi: Poi, kind: InteriorKind, cityId: CityId): Npc[] {
  const localName = cityId === 'singapore'
    ? { vi: 'Người Singapore', en: 'Singaporean commuter' }
    : { vi: 'Người địa phương', en: 'Local resident' };
  const first: Npc = {
    id: `${poi.id}-local`,
    sprite: kind === 'station' ? 'npc_business' : 'npc_local',
    chatPersona: 'local',
    chatName: localName,
    at: { x: kind === 'station' ? 118 : 124, y: kind === 'station' ? 146 : 142 },
    path: [{ x: 124, y: 142 }, { x: 182, y: 154 }, { x: 124, y: 142 }],
    lines: [{ en: cityId === 'singapore' ? 'The MRT gets busy around this time.' : 'It is a nice time to be here.', vi: cityId === 'singapore' ? 'Giờ này MRT thường đông đấy.' : 'Đây là lúc khá đẹp để ghé thăm.' }],
  };
  const visitor: Npc = {
    id: `${poi.id}-traveller`,
    sprite: 'npc_tourist',
    chatPersona: 'traveller',
    chatName: { vi: 'Du khách quốc tế', en: 'Fellow traveller' },
    at: { x: 286, y: kind === 'station' ? 145 : 143 },
    path: [{ x: 286, y: 143 }, { x: 242, y: 132 }, { x: 286, y: 143 }],
    lines: [{ en: 'I am still figuring out how this place works.', vi: 'Tôi vẫn đang tìm hiểu cách hoạt động ở đây.' }],
  };
  if (kind === 'station') {
    first.chatName = cityId === 'singapore'
      ? { vi: 'Người đi MRT Singapore', en: 'Singapore MRT commuter' }
      : { vi: 'Hành khách địa phương', en: 'Local commuter' };
    first.lines = [{ en: 'Are you heading to the platform too?', vi: 'Bạn cũng đang xuống sân ga à?' }];
    visitor.lines = [{ en: 'I am trying to work out which train goes downtown.', vi: 'Tôi đang tìm xem tàu nào đi vào trung tâm.' }];
  }
  if (kind === 'market') {
    visitor.chatName = { vi: 'Khách đang đi chợ', en: 'Market visitor' };
    visitor.lines = [{ en: 'Everything here smells amazing.', vi: 'Mọi thứ ở đây thơm quá.' }];
  }
  if (kind === 'museum') {
    visitor.chatName = { vi: 'Khách tham quan', en: 'Museum visitor' };
    visitor.lines = [{ en: 'I did not expect to spend so long looking at this exhibit.', vi: 'Tôi không nghĩ mình sẽ đứng xem hiện vật này lâu đến vậy.' }];
  }
  if (kind === 'hotel') {
    first.chatName = { vi: 'Khách đang nhận phòng', en: 'Another hotel guest' };
    first.lines = [{ en: 'Have you just arrived as well?', vi: 'Bạn cũng vừa mới tới à?' }];
  }
  if (kind === 'airport') {
    first.chatName = { vi: 'Hành khách', en: 'Fellow passenger' };
    first.lines = [{ en: 'I hope our flight is on time.', vi: 'Mong là chuyến bay của chúng ta đúng giờ.' }];
  }
  return [first, visitor];
}

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/**
 * Vẽ mảnh `img` vào canvas thế giới tại (px,py); chỗ chồng lên mảnh đã vẽ thì hoà bằng MẶT NẠ HOÀ SẮC Bayer 4×4
 * (kiểu pixel-art, không alpha mịn): càng gần mép mảnh mới càng giữ điểm cũ, càng vào trong càng lấy điểm mới.
 */
function blendPanel(c: CanvasRenderingContext2D, img: HTMLImageElement, px: number, py: number, pw: number, ph: number, drawn: { x: number; y: number; w: number; h: number }[], ov: number) {
  const tmp = makeCanvas(pw, ph);
  const tc = ctx2d(tmp);
  tc.drawImage(img, 0, 0);
  const src = tc.getImageData(0, 0, pw, ph);
  const dst = c.getImageData(px, py, pw, ph);
  const S = src.data;
  const D = dst.data;
  for (let y = 0; y < ph; y++)
    for (let x = 0; x < pw; x++) {
      const wx = px + x;
      const wy = py + y;
      let covered = false;
      for (const d of drawn) if (wx >= d.x && wy >= d.y && wx < d.x + d.w && wy < d.y + d.h) covered = true;
      let take = true;
      if (covered) {
        const t = Math.min(1, Math.min(x + 0.5, pw - x - 0.5, y + 0.5, ph - y - 0.5) / ov);
        take = BAYER4[(wy & 3) * 4 + (wx & 3)]! < t * 16;
      }
      if (take) {
        const i = (y * pw + x) * 4;
        D[i] = S[i]!;
        D[i + 1] = S[i + 1]!;
        D[i + 2] = S[i + 2]!;
        D[i + 3] = 255;
      }
    }
  c.putImageData(dst, px, py);
}

function loadZoom(id: string): number {
  try {
    const v = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(`travel:zoom:${id}`) : null;
    const n = v === null ? 0 : parseInt(v, 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function saveZoom(id: string, z: number) {
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(`travel:zoom:${id}`, String(z));
  } catch {
    /* không có sessionStorage: bỏ qua */
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
function averageColor(img: CanvasImageSource): string {
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
