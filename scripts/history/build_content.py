"""Dựng src/data/history/<topic>/*.json từ các tệp soạn tay trong content/ + ảnh/audio THẬT đang có trong public/history/<topic>/.
python build_content.py [topic]
- Ảnh: tmp-art/hist_<sceneId>__0.png (đã duyệt) → public/history/<topic>/images/<sceneId>.webp (giữ nguyên điểm ảnh, chỉ nén).
- Audio: public/history/<topic>/audio/en/<sceneId>.mp3 (+ .sentences.json) do make_narration.py tạo. Không có file thì đánh cờ *Pending, KHÔNG bịa.
- Cảnh chỉ thành `published` khi có ảnh + audio + mọi khẳng định verified/single-source (cổng thật nằm ở src/services/history/gating.ts).
"""
import sys, json, re, hashlib, pathlib, importlib.util, datetime

sys.stdout.reconfigure(encoding="utf-8")
HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[1]
TOPIC = sys.argv[1] if len(sys.argv) > 1 else "vn-khang-chien-chong-phap"
DATA = ROOT / "src" / "data" / "history" / TOPIC
PUB = ROOT / "public" / "history" / TOPIC
TMP = ROOT / "tmp-art"
CREDIT = "Minh họa pixel tái dựng, không phải ảnh tư liệu"
STYLE = ("true pixel art with chunky visible square pixels, limited warm historical palette, 16-bit adventure-game background style, 16:9; "
         "no text, letters, numbers, signs, flags, banners, emblems or logos; no modern items; anonymous small people; no portraits of real people")
KIND = {"primary-doc": "primary-document", "scholarly": "academic", "tertiary": "encyclopedia"}
ACCESSED = "2026-10-02"


def load(path):
    spec = importlib.util.spec_from_file_location(path.stem, path)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m


sources_all = dict(load(HERE / "content" / "sources_catalog.py").SOURCES)
scenes_src = []
for f in sorted((HERE / "content").glob("scenes_*.py")):
    m = load(f)
    sources_all.update(getattr(m, "SRC_EXTRA", {}))
    scenes_src += m.SCENES
scenes_src.sort(key=lambda s: s["n"])

topic = json.loads((DATA / "topic.json").read_text(encoding="utf-8"))
(PUB / "images").mkdir(parents=True, exist_ok=True)
from PIL import Image

scenes, claims, images_meta, audio_meta, used_sources = [], [], [], [], []
log_path = PUB / "audio" / "en" / "_narration-log.json"
nar_log = json.loads(log_path.read_text(encoding="utf-8")) if log_path.exists() else {}
split_sent = lambda t: [x for x in re.split(r"(?<=[.!?])\s+", t) if x]

for s in scenes_src:
    sid = s["id"]
    pids = [f"{sid}-p{i + 1}" for i in range(len(s["paragraphs"]))]
    cl_ids, src_ids = [], []
    for c in s["claims"]:
        cid = c["id"]
        cl_ids.append(cid)
        srcs = []
        for r in c["sources"]:
            sk = r["id"]
            if sk not in sources_all:
                raise SystemExit(f"{cid}: nguồn lạ {sk}")
            if sk not in used_sources:
                used_sources.append(sk)
            if sk not in src_ids:
                src_ids.append(sk)
            srcs.append(dict(sourceId=sk, locator=r["locator"], supports="full" if c["status"] == "verified" else "partial"))
        claims.append(dict(id=cid, sceneId=sid, paragraphId=pids[c["paragraph"]], textEn=c["textEn"], textVi=c["textVi"], date=c["date"],
                           places=c["places"], people=c["people"], sources=srcs, independentSources=c["independentSources"],
                           status=c["status"], notes=c["notes"]))
    # ảnh
    img = None
    src_png = TMP / f"hist_{sid}__0.png"
    out = PUB / "images" / f"{sid}.webp"
    if src_png.exists():
        im = Image.open(src_png).convert("RGB")
        if im.width > 1600:
            im = im.resize((1600, round(im.height * 1600 / im.width)), Image.NEAREST)
        im.save(out, "WEBP", quality=88, method=6)
    if out.exists():
        img = dict(file=f"/history/{TOPIC}/images/{sid}.webp", altVi=s["altVi"], altEn=s["altEn"], captionVi=s["captionVi"], captionEn=s["captionEn"],
                   isGeneralIllustration=s["isGeneralIllustration"], credit=CREDIT)
        b = s["imageBrief"]
        images_meta.append(dict(sceneId=sid, file=img["file"], prompt=f"{STYLE}. Scene: {b['setting']}. Viewpoint: {b['viewpoint']}. Must avoid: {b['mustAvoid']}.",
                                referenceNotes="Không dùng ảnh tư liệu làm mẫu; dựng từ mô tả chữ trong các nguồn đã liệt kê. Ảnh là minh hoạ tái dựng.",
                                createdWith="ChatGPT image generation (tên model không xác định được)", promptVersion="v1"))
    # audio
    au = None
    mp3 = PUB / "audio" / "en" / f"{sid}.mp3"
    sj = PUB / "audio" / "en" / f"{sid}.sentences.json"
    if mp3.exists() and sj.exists():
        sd = json.loads(sj.read_text(encoding="utf-8"))
        track = dict(file=f"/history/{TOPIC}/audio/en/{sid}.mp3", durationSec=sd["durationSec"])
        # câu thật: ghép theo thứ tự với câu của từng đoạn
        sents_text = []
        for i, p in enumerate(s["paragraphs"]):
            for st in split_sent(p["en"]):
                sents_text.append((pids[i], st))
        if sd["sentences"] and len(sd["sentences"]) == len(sents_text):
            track["sentences"] = [dict(start=t["start"], end=t["end"], paragraphId=pid, text=txt) for t, (pid, txt) in zip(sd["sentences"], sents_text)]
        au = dict(en=track)
        full = "\n\n".join(p["en"] for p in s["paragraphs"])
        audio_meta.append(dict(sceneId=sid, lang="en", file=track["file"], voice=nar_log.get("voice"), engine=nar_log.get("model"),
                               textSha256=hashlib.sha256(full.encode("utf-8")).hexdigest(), generatedAt=nar_log.get("date")))
    sc = dict(id=sid, n=s["n"], titleVi=s["titleVi"], titleEn=s["titleEn"], dateLabel=s["dateLabel"], place=s["place"],
              paragraphs=[dict(id=pids[i], vi=p["vi"], en=p["en"]) for i, p in enumerate(s["paragraphs"])],
              claimIds=cl_ids, sourceIds=src_ids, vocab=s["vocab"],
              questions=[dict(id=f"{sid}-q{i + 1}", type="mcq", promptVi=q["promptVi"], promptEn=q["promptEn"], options=q["options"], answerIndex=q["answerIndex"],
                              evidenceParagraphId=pids[q["evidenceParagraph"]], explainVi=q["explainVi"], explainEn=q["explainEn"]) for i, q in enumerate(s["questions"])])
    if s.get("periodNote"):
        sc["periodNote"] = s["periodNote"]
    if img:
        sc["image"] = img
    else:
        sc["imagePending"] = True
    if au:
        sc["audio"] = au
    else:
        sc["audioPending"] = True
    ok_claims = all(c["status"] in ("verified", "single-source") for c in s["claims"])
    sc["status"] = "published" if (img and au and ok_claims) else ("verified" if ok_claims else "draft")
    scenes.append(sc)

sources = []
for k in used_sources:
    v = sources_all[k]
    sources.append(dict(id=k, title=v["title"], publisher=v["publisher"], url=v["url"], kind=KIND.get(v["kind"], v["kind"]), accessed=ACCESSED))

topic["sceneIds"] = [s["id"] for s in scenes]
topic["status"] = "published" if any(s["status"] == "published" for s in scenes) else "draft"
dump = lambda name, obj: (DATA / name).write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
dump("topic.json", topic); dump("scenes.json", scenes); dump("sources.json", sources); dump("claims.json", claims)
dump("images.json", images_meta); dump("audio.json", audio_meta)
print(f"{len(scenes)} cảnh, {len(claims)} khẳng định, {len(sources)} nguồn, {len(images_meta)} ảnh, {len(audio_meta)} audio; "
      f"trạng thái: " + ", ".join(f"{s['id']}={s['status']}" for s in scenes))
