import re, subprocess, pathlib, os, sys

sys.stdout.reconfigure(encoding="utf-8")
ROOT = pathlib.Path(__file__).resolve().parents[2]
os.chdir(ROOT)
out = subprocess.run([sys.executable, "scripts/dev/find_unused.py"], capture_output=True, text=True, encoding="utf-8").stdout.splitlines()[1:]
dead = [l.split()[1] for l in out if l.strip()]
corpus = []
for base in ("scripts", "supabase", ".github"):
    for p in pathlib.Path(base).rglob("*"):
        if p.is_file() and p.suffix in (".ts", ".tsx", ".js", ".mjs", ".py", ".json", ".yml", ".yaml", ".sh", ".sql") and "node_modules" not in p.parts and "research" not in p.parts:
            try:
                corpus.append((str(p), p.read_text(encoding="utf-8", errors="ignore")))
            except Exception:
                pass
tests = [(str(p), p.read_text(encoding="utf-8", errors="ignore")) for p in pathlib.Path("src").rglob("*.test.ts*")]
pk = pathlib.Path("package.json").read_text(encoding="utf-8")
allsrc = {}
for p in list(pathlib.Path("src").rglob("*")) + list(pathlib.Path("app").rglob("*")):
    if p.is_file() and p.suffix in (".ts", ".tsx") and ".test." not in p.name:
        allsrc[str(p).replace(chr(92), "/")] = p.read_text(encoding="utf-8", errors="ignore")
rows = []
for k in dead:
    stem = k.replace("src/", "", 1).rsplit(".", 1)[0]
    if stem.endswith("/index"):
        stem = stem[:-6]
    base = os.path.basename(stem)
    pat = re.compile(r"['\"](?:@/|\.\.?/)[^'\"]*" + re.escape(base) + r"['\"]")
    s_ref = [n for n, t in corpus if pat.search(t) or os.path.basename(k) in t]
    t_ref = [n for n, t in tests if pat.search(t)]
    p_ref = os.path.basename(k) in pk
    users = [n for n, t in allsrc.items() if n != k and pat.search(t)]
    rows.append((k, len(s_ref), len(t_ref), int(p_ref), len(users)))
for k, s, t, p, u in rows:
    tag = "XOÁ-ĐƯỢC?" if s == 0 and p == 0 else "tooling"
    print(f"{tag:10s} {k:58s} scripts:{s:2d} tests:{t:2d} pkg:{p} srcUsers:{u}")
