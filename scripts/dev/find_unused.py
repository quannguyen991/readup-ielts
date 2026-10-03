"""Tìm tệp nguồn KHÔNG ai dùng (mã chết) trong src/: đi từ các tệp vào app/** (route + api) theo đồ thị import, tệp nào không với tới được là
ứng viên bỏ. Test (*.test.ts) không tính là "người dùng" của mã chạy thật; tệp chỉ được test nhắc tới vẫn là mã chết.
python scripts/dev/find_unused.py        -> in danh sách + tổng dòng
Giới hạn: không thấy import ghép chuỗi động; phải xem tay trước khi xoá."""
import os, re, sys, pathlib

sys.stdout.reconfigure(encoding="utf-8")
ROOT = pathlib.Path(__file__).resolve().parents[2]
EXTS = [".ts", ".tsx", ".js", ".jsx", ".json", ".mjs"]
PLAT = ["", ".web", ".native", ".ios", ".android"]
files = {}
for base in ("src", "app"):
    for p in (ROOT / base).rglob("*"):
        if p.is_file() and p.suffix in EXTS and "node_modules" not in p.parts:
            files[p.relative_to(ROOT).as_posix()] = p
IMP = re.compile(r"""(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|(?:require|import)\(\s*['"]([^'"]+)['"]\s*\)""", re.S)


def resolve(spec, frm):
    if spec.startswith("@/"):
        cand = "src/" + spec[2:]
    elif spec.startswith("."):
        cand = os.path.normpath(os.path.join(os.path.dirname(frm), spec)).replace("\\", "/")
    else:
        return []
    out = []
    for pl in PLAT:
        for e in EXTS:
            for stem in (cand, cand + "/index"):
                k = stem + pl + e
                if k in files:
                    out.append(k)
    if cand in files:
        out.append(cand)
    return out


graph = {}
for k, p in files.items():
    if p.suffix == ".json":
        graph[k] = []
        continue
    try:
        t = p.read_text(encoding="utf-8")
    except Exception:
        graph[k] = []
        continue
    deps = []
    for m in IMP.finditer(t):
        spec = m.group(1) or m.group(2) or m.group(3)
        deps += resolve(spec, k)
    graph[k] = deps

roots = [k for k in files if k.startswith("app/") and not k.endswith(".test.ts")]
# tệp cấu hình / điểm vào ngoài app
for extra in ("src/global.css",):
    if extra in files:
        roots.append(extra)
seen = set()
stack = list(roots)
while stack:
    k = stack.pop()
    if k in seen:
        continue
    seen.add(k)
    stack += graph.get(k, [])

dead = sorted(k for k in files if k not in seen and not k.endswith(".test.ts") and not k.endswith(".test.tsx") and files[k].suffix != ".json")
tests = sorted(k for k in files if (k.endswith(".test.ts") or k.endswith(".test.tsx")))


def lines(k):
    try:
        return sum(1 for _ in files[k].open(encoding="utf-8"))
    except Exception:
        return 0


print(f"tệp nguồn: {len(files)}; với tới được từ app/: {len(seen)}; ứng viên mã chết: {len(dead)} ({sum(lines(k) for k in dead)} dòng)")
for k in dead:
    print(f"  {lines(k):5d}  {k}")
