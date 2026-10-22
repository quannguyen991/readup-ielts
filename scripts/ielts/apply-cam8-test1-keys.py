import json

SOURCE_TESTS_PATH = r"d:\Claude\readup-ielts\.local-private\ielts-ocr\source-tests.json"

CAM8_L1_KEYS = {
    "1": "C",
    "2": "B",
    "3": "48 North Avenue",
    "4": "WS6 2YH",
    "5": "01674 553242",
    "6": ["(free) drink(s)", "refreshment(s)", "free drinks", "refreshments"],
    "7": ["(the/a) pianist", "piano player", "pianist"],
    "8": "10.50",
    "9": "4",
    "10": "50%",
    "11": "1.30",
    "12": ["25 December", "Christmas Day"],
    "13": ["car-park", "parking lot", "car park"],
    "14": "45",
    "15": ["(some) tables", "tables"],
    "16": ["C", "F", "G"],
    "17": ["C", "F", "G"],
    "18": ["C", "F", "G"],
    "19": ["B", "E"],
    "20": ["B", "E"],
    "21": "A",
    "22": "C",
    "23": "A",
    "24": "B",
    "25": ["B", "C", "F"],
    "26": ["B", "C", "F"],
    "27": ["B", "C", "F"],
    "28": "12000",
    "29": "horses",
    "30": "caves",
    "31": "surface",
    "32": "environment",
    "33": ["impact(s)", "effect(s)", "impacts", "effects", "impact", "effect"],
    "34": "urban",
    "35": "problems",
    "36": "images",
    "37": "patterns",
    "38": ["distortion(s)", "distortions", "distortion"],
    "39": "traffic",
    "40": "weather"
}

CAM8_R1_KEYS = {
    "1": "D",
    "2": "B",
    "3": "F",
    "4": "E",
    "5": "B",
    "6": "F",
    "7": "D",
    "8": "A",
    "9": ["(ship's) anchor", "anchor", "ships anchor"],
    "10": ["(escape) wheel", "escape wheel", "wheel"],
    "11": "tooth",
    "12": ["(long) pendulum", "long pendulum", "pendulum"],
    "13": "second",
    "14": "ii",
    "15": "iii",
    "16": "v",
    "17": "iv",
    "18": "viii",
    "19": "vii",
    "20": "FALSE",
    "21": "FALSE",
    "22": "NOT GIVEN",
    "23": "TRUE",
    "24": "TRUE",
    "25": "FALSE",
    "26": "TRUE",
    "27": "E",
    "28": "B",
    "29": "A",
    "30": "F",
    "31": "sender",
    "32": ["picture", "image"],
    "33": "receiver",
    "34": "sensory leakage",
    "35": ["(outright) fraud", "fraud"],
    "36": "computers",
    "37": "human involvement",
    "38": "meta-analysis",
    "39": "lack of consistency",
    "40": ["big enough", "large enough", "big / large enough", "big", "large"]
}

with open(SOURCE_TESTS_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

for t in data["tests"]:
    if t["id"] == "cambridge-8-listening-1":
        t["answerKey"] = CAM8_L1_KEYS
        t["answerKeyVerified"] = True
        print("Updated cambridge-8-listening-1 keys (40/40)")
    elif t["id"] == "cambridge-8-reading-1":
        t["answerKey"] = CAM8_R1_KEYS
        t["answerKeyVerified"] = True
        print("Updated cambridge-8-reading-1 keys (40/40)")

with open(SOURCE_TESTS_PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Saved updated Cam 8 keys.")
