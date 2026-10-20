"""Rebuild source-backed local tests without fabricated passages or answer keys."""
from __future__ import annotations

import json
import re
import shutil
from datetime import datetime
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET

import pymupdf
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / '.local-private' / 'ielts-ocr'
MANIFEST = PRIVATE / 'source-tests.json'
SECTIONS = ['Listening', 'Reading', 'Writing', 'Speaking']
STARTS = {
    17: [[3, 9, 21, 23], [24, 30, 43, 45], [46, 52, 65, 67], [68, 74, 86, 88]],
    18: [[12, 18, 31, 33], [34, 41, 54, 56], [57, 63, 77, 79], [80, 86, 98, 100]],
    19: [[9, 15, 29, 31], [32, 39, 51, 53], [54, 61, 74, 76], [77, 83, 95, 97]],
    21: [[11, 17, 30, 32], [33, 39, 52, 54], [55, 61, 73, 75], [76, 82, 95, 97]],
}


def compact(text):
    return re.sub(r'\s+', '', text).lower()


def image_page(document, asset, page):
    name = f'{Path(asset).stem}-page-{page["page"]}.webp'
    target = PRIVATE / name
    pdf_page = document[page['page'] - 1]
    if not target.exists():
        pix = pdf_page.get_pixmap(matrix=pymupdf.Matrix(1.35, 1.35), alpha=False)
        Image.frombytes('RGB', [pix.width, pix.height], pix.samples).save(target, 'WEBP', quality=85)
        del pix
        pymupdf.TOOLS.store_shrink(100)
    rect = pdf_page.rect
    return {**page, 'imageAsset': name, 'imageWidth': round(rect.width), 'imageHeight': round(rect.height)}


def docx_keys(filename):
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    with ZipFile(PRIVATE / filename) as archive:
        document = ET.fromstring(archive.read('word/document.xml'))
    keys = {}
    test = None
    for paragraph in document.findall('.//w:p', ns):
        text = ''.join(node.text or '' for node in paragraph.findall('.//w:t', ns)).strip()
        heading = re.fullmatch(r'test\s*(\d+)', text, re.I)
        if heading:
            test = int(heading[1]); keys[test] = {}; continue
        match = re.match(r'^(\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?[.)]\s*(.+)$', text)
        if not match or test is None:
            continue
        start, end = int(match[1]), int(match[2] or match[1])
        if not 1 <= start <= end <= 40:
            continue
        value = match[3].strip()
        if start != end:
            # Keep the original key page for unordered multi-answer groups.
            # A key is only auto-scored if every slot has a source-backed answer.
            continue
        variants = re.split(r'\s*(?:/|\bor\b)\s*', value, flags=re.I)
        for variant in list(variants):
            if re.search(r'\([^()]+\)', variant):
                variants.extend([re.sub(r'\(([^()]*)\)', r'\1', variant), re.sub(r'\([^()]*\)', '', variant)])
        keys[test][str(start)] = list(dict.fromkeys(v.strip() for v in variants if v.strip()))
    return keys


def rebuild():
    bundle = json.loads(MANIFEST.read_text(encoding='utf-8'))
    backup = PRIVATE / 'source-tests.before-source-rebuild.json'
    if not backup.exists():
        shutil.copy2(MANIFEST, backup)
    records = []
    for volume, tests in STARTS.items():
        asset = f'cambridge{volume}-book.pdf'
        document = pymupdf.open(PRIVATE / asset)
        if volume == 21:
            pages = [{'page': i + 1, 'text': page.get_text().strip(), 'reviewLines': []} for i, page in enumerate(document)]
        else:
            pages = json.loads((PRIVATE / f'cambridge{volume}-book.ocr.json').read_text(encoding='utf-8'))['pages']
        by_number = {page['page']: page for page in pages}
        keys = {section: [p for p in pages if p['page'] > tests[-1][-1] and 'answerkeywithextraexplanations' in compact(p['text']) and ('part1' if section == 'Listening' else 'readingpassage1') in compact(p['text'])] for section in SECTIONS[:2]}
        for number, starts in enumerate(tests, 1):
            for index, section in enumerate(SECTIONS):
                start = starts[index]
                end = starts[index + 1] - 1 if index < 3 else start
                question_pages = [image_page(document, asset, by_number[p]) for p in range(start, end + 1)]
                support = keys.get(section, [])
                support_pages = [image_page(document, asset, support[number - 1])] if len(support) >= number else []
                audio = f'cambridge{volume}-listening-test{number}.mp3'
                records.append({
                    'id': f'cambridge-{volume}-{section.lower()}-{number}',
                    'title': f'Cambridge IELTS {volume} · {section} Test {number}',
                    'source': f'Cambridge IELTS {volume}', 'section': section,
                    'questionCount': 2 if section == 'Writing' else 3 if section == 'Speaking' else 40,
                    'answerMode': 'long' if section in SECTIONS[2:] else 'short',
                    'responseLabels': ['Task 1', 'Task 2'] if section == 'Writing' else ['Part 1', 'Part 2', 'Part 3'] if section == 'Speaking' else [],
                    'pages': question_pages, 'supportPages': support_pages,
                    'answerKeyVerified': False, 'contentVerified': True,
                    'pdfAsset': asset, 'sourceStartPage': start,
                    'audioFiles': [audio] if section == 'Listening' and (PRIVATE / audio).is_file() else [],
                    'externalOnly': False, 'sourceCheckedAt': '2026-10-20',
                })
        print(f'Cambridge {volume}: 16 sections restored from source', flush=True)
        document.close()
        pymupdf.TOOLS.store_shrink(100)

    # Cambridge 20 has separate digital Reading/Listening papers and an OCR scan
    # for Writing/Speaking. Never preserve synthetic keys from prior seeders.
    keys20 = {s: docx_keys(f'cambridge20-key-{s.lower()}.docx') for s in SECTIONS[:2]}
    scan_asset = 'cambridge20-academic-source.pdf'
    if not (PRIVATE / scan_asset).exists():
        shutil.copy2(Path(r'D:\Cambridge IELTS 20 Academic.pdf'), PRIVATE / scan_asset)
    scan = pymupdf.open(PRIVATE / scan_asset)
    scan_pages = {p['page']: p for p in json.loads((PRIVATE / 'cambridge20-academic.ocr.json').read_text(encoding='utf-8'))['pages']}
    ranges20 = {'Writing': [(30, 31), (66, 68), (105, 106), (140, 141)], 'Speaking': [(35, 35), (73, 73), (110, 110), (145, 145)]}
    support20 = {'Writing': [(31, 34), (68, 72), (106, 109), (141, 144)], 'Speaking': [(36, 36), (74, 77), (111, 113), (146, 149)]}
    engine = None
    def question_page20(page):
        nonlocal engine
        source_page = image_page(scan, scan_asset, page)
        sample = re.search(r'(?:Essay\s*\[|\[?Candidate\s*Essay|This is an answer written)', page['text'], re.I)
        if not sample:
            return source_page
        name = f'{Path(scan_asset).stem}-page-{page["page"]}-prompt.webp'
        target = PRIVATE / name
        if not target.exists():
            import numpy as np
            from rapidocr_onnxruntime import RapidOCR
            if engine is None:
                engine = RapidOCR(use_cls=False, intra_op_num_threads=2, inter_op_num_threads=1)
            with Image.open(PRIVATE / source_page['imageAsset']) as image:
                detected, _ = engine(np.array(image.convert('RGB')))
                tops = [min(point[1] for point in box) for box, text, confidence in (detected or [])
                        if confidence > 0.4 and re.search(r'candidate\s*essay|this\s*is\s*an\s*answer\s*written|essay\s*\[', text, re.I)]
                if not tops:
                    raise ValueError(f'Cannot locate sample boundary on Cambridge 20 page {page["page"]}')
                image.crop((0, 0, image.width, max(1, int(min(tops)) - 5))).save(target, 'WEBP', quality=90)
        with Image.open(target) as image:
            return {**source_page, 'text': page['text'][:sample.start()].strip(), 'imageAsset': name, 'imageWidth': image.width, 'imageHeight': image.height}
    for section in SECTIONS:
        for number in range(1, 5):
            if section in SECTIONS[:2]:
                asset = f'cambridge20-{section.lower()}-test{number}.pdf'
                document = pymupdf.open(PRIVATE / asset)
                pages = json.loads((PRIVATE / f'cambridge20-{section.lower()}-test{number}.pages.json').read_text(encoding='utf-8'))['pages']
                audio = [f'cambridge20-listening-test{number}-part{part}.mp3' for part in range(1, 5)] if section == 'Listening' else []
                audio = [name for name in audio if (PRIVATE / name).exists()]
            else:
                asset, document = scan_asset, scan
                start, end = ranges20[section][number - 1]
                pages = [scan_pages[p] for p in range(start, end + 1)]
                audio = []
            support_pages = []
            if section in support20:
                support_start, support_end = support20[section][number - 1]
                support_pages = [image_page(scan, scan_asset, scan_pages[p]) for p in range(support_start, support_end + 1)]
            answer_key = keys20.get(section, {}).get(number, {})
            records.append({
                'id': f'cambridge-20-{section.lower()}-{number}', 'title': f'Cambridge IELTS 20 · {section} Test {number}',
                'source': 'Cambridge IELTS 20', 'section': section,
                'questionCount': 2 if section == 'Writing' else 3 if section == 'Speaking' else 40,
                'answerMode': 'long' if section in SECTIONS[2:] else 'short',
                'responseLabels': ['Task 1', 'Task 2'] if section == 'Writing' else ['Part 1', 'Part 2', 'Part 3'] if section == 'Speaking' else [],
                'pages': [question_page20(page) if section == 'Writing' else image_page(document, asset, page) for page in pages], 'supportPages': support_pages,
                'answerKey': answer_key or None, 'answerKeyVerified': len(answer_key) == 40,
                'contentVerified': True, 'pdfAsset': asset, 'sourceStartPage': pages[0]['page'], 'audioFiles': audio, 'externalOnly': False,
            })

    # Split the original Cambridge 8 Academic OCR records by their source pages.
    cam8_asset = 'cambridge8-book.pdf'
    if not (PRIVATE / cam8_asset).exists():
        shutil.copy2(Path(r'D:\Cambridge IELTS 8.pdf'), PRIVATE / cam8_asset)
    cam8 = pymupdf.open(PRIVATE / cam8_asset)
    original = json.loads(backup.read_text(encoding='utf-8'))
    cam8_starts = [[9, 17, 29, 31], [32, 40, 52, 54], [55, 64, 77, 79], [80, 87, 100, 102]]
    for number, starts in enumerate(cam8_starts, 1):
        old = next(t for t in original['tests'] if t['id'] == f'cambridge-ielts-8-academic-{number}')
        by_number = {p['page']: p for p in old['pages']}
        for index, section in enumerate(SECTIONS):
            start = starts[index]
            end = starts[index + 1] - 1 if index < 3 else start
            records.append({
                'id': f'cambridge-8-{section.lower()}-{number}', 'title': f'Cambridge IELTS 8 · {section} Test {number}',
                'source': 'Cambridge IELTS 8', 'section': section,
                'questionCount': 2 if section == 'Writing' else 3 if section == 'Speaking' else 40,
                'answerMode': 'long' if section in SECTIONS[2:] else 'short',
                'pages': [image_page(cam8, cam8_asset, by_number[p]) for p in range(start, end + 1)],
                'supportPages': old.get('supportPages', []), 'answerKeyVerified': False,
                'contentVerified': True, 'pdfAsset': cam8_asset, 'sourceStartPage': start, 'audioFiles': [], 'externalOnly': False,
            })

    vol_asset = 'vol10-source.pdf'
    if not (PRIVATE / vol_asset).exists():
        shutil.copy2(Path(r'D:\VOL 10 KEY.pdf'), PRIVATE / vol_asset)
    vol = pymupdf.open(PRIVATE / vol_asset)
    # Several passage headings share a page with the preceding questions.
    vol_ranges = [[(2, 4), (5, 8), (9, 11)], [(17, 19), (19, 21), (22, 26)], [(32, 35), (35, 37), (38, 41)], [(47, 50), (51, 53), (54, 57)], [(63, 66), (67, 70), (71, 73)], [(80, 82), (83, 86), (86, 89)]]
    shared_titles = {(2, 2): r'Bristlecone', (3, 2): r'Yawning', (6, 3): r'Lawrence\s+Johnston'}
    key_ranges = [(12, 15), (27, 30), (42, 45), (58, 61), (74, 78), (90, 92)]
    def vol_page(number, render=True):
        text = re.sub(r'[\u200b\u200c\ufeff]', ' ', vol[number - 1].get_text()).strip()
        page = {'page': number, 'text': text, 'reviewLines': []}
        return image_page(vol, vol_asset, page) if render else page
    for number, ranges in enumerate(vol_ranges, 1):
        parts = []
        for part, (start, end) in enumerate(ranges, 1):
            pages = [vol_page(p) for p in range(start, end + 1)]
            title = shared_titles.get((number, part))
            if title:
                match = re.search(title, pages[0]['text'], re.I)
                if match:
                    pages[0] = {**pages[0], 'text': pages[0]['text'][match.start():]}
            next_title = shared_titles.get((number, part + 1))
            if next_title:
                match = re.search(next_title, pages[-1]['text'], re.I)
                if match:
                    pages[-1] = {**pages[-1], 'text': pages[-1]['text'][:match.start()]}
            parts.append({'id': part, 'label': f'Passage {part}', 'questionStart': [1, 14, 27][part - 1], 'questionEnd': [13, 26, 40][part - 1], 'pages': pages, 'recommendedMinutes': 20})
        start, end = key_ranges[number - 1]
        records.append({'id': f'vol-10-reading-{number}', 'title': f'VOL 10 KEY · Reading Test {number}', 'source': 'VOL 10 KEY', 'section': 'Reading', 'questionCount': 40, 'answerMode': 'short', 'pages': [vol_page(p) for p in range(ranges[0][0], ranges[-1][1] + 1)], 'parts': parts, 'supportPages': [vol_page(p) for p in range(start, end + 1)], 'answerKeyVerified': False, 'contentVerified': True, 'externalOnly': False, 'pdfAsset': vol_asset, 'sourceStartPage': ranges[0][0], 'audioFiles': []})

    for test in original['tests']:
        if test['id'].startswith('cambridge-ielts-8-general-'):
            letter = test['id'][-1]
            for section in ['Reading', 'Writing']:
                selected = test['pages'][:-1] if section == 'Reading' else test['pages'][-1:]
                records.append({**test, 'id': f'cambridge-8-general-{section.lower()}-{letter}', 'title': f'Cambridge IELTS 8 · General Training {section} Test {letter.upper()}', 'section': section, 'questionCount': 40 if section == 'Reading' else 2, 'answerMode': 'short' if section == 'Reading' else 'long', 'pages': [image_page(cam8, cam8_asset, p) for p in selected], 'answerKey': None, 'answerKeyVerified': False, 'contentVerified': True, 'pdfAsset': cam8_asset, 'sourceStartPage': selected[0]['page'], 'audioFiles': []})
        elif re.fullmatch(r'cambridge-(?:10|11|12|13|14|15|16)-(?:reading|listening)-[1-4]', test['id']):
            # Preserve full test text, answer keys and parts; do not strip down to external link
            if test.get('pages') and len(test['pages']) > 0:
                records.append({**test, 'externalOnly': False})
            else:
                records.append({**test, 'pages': [], 'supportPages': [], 'answerKey': None, 'answerKeyVerified': False, 'externalOnly': False, 'contentVerified': True, 'audioFiles': [], 'audioCloudUrl': None})
    bundle.update({'tests': records, 'generatedAt': datetime.now().astimezone().isoformat(), 'distribution': 'local-only; source content excluded from Git and deploys'})
    bundle['sources'] = [{'name': source, 'sets': sum(t['source'] == source for t in records)} for source in dict.fromkeys(t['source'] for t in records)]
    MANIFEST.write_text(json.dumps(bundle, ensure_ascii=False), encoding='utf-8')
    print(f'Saved {len(records)} source-backed or external records; prior bundle preserved at {backup.name}', flush=True)


if __name__ == '__main__':
    rebuild()
