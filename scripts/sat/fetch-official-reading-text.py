"""Extract SAT Reading and Writing pages from official College Board practice PDFs."""

import concurrent.futures
import json
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlparse

import pymupdf

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / '.local-private' / 'sat-ocr' / 'official-reading-text.json'
BASE = 'https://satsuite.collegeboard.org/media/pdf/sat-practice-test-{number}-digital.pdf'
ALLOWED_HOST = 'satsuite.collegeboard.org'


def fetch_test(number: int) -> tuple[dict | None, str | None]:
    url = BASE.format(number=number)
    if urlparse(url).hostname != ALLOWED_HOST:
        return None, 'unsupported host'
    time.sleep(0.35)
    request = Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (compatible; ReadUpVocabularyResearch/1.0)',
        'Accept': 'application/pdf,*/*',
    })
    try:
        with urlopen(request, timeout=60) as response:
            if response.status != 200:
                return None, f'HTTP {response.status}'
            pdf = response.read()
    except Exception as error:
        return None, str(error)

    document = pymupdf.open(stream=pdf, filetype='pdf')
    active = False
    pages = []
    for page_number, page in enumerate(document, start=1):
        text = page.get_text('text', sort=True).strip()
        if re.search(r'Module\s+[12](?:\s+\d{1,3}){0,3}\s+Reading\s+and\s+Writing\b', text, re.I):
            active = True
        if re.search(r'Module\s+[12](?:\s+\d{1,3}){0,3}\s+(?:Math|Mathematics)\b', text, re.I):
            active = False
        if active and text:
            pages.append({'page': page_number, 'text': text})
    document.close()
    if not pages:
        return None, 'Reading and Writing pages not found in PDF text'
    return {
        'id': f'sat-official-practice-{number}',
        'title': f'SAT Official Practice Test {number}',
        'source': 'College Board official paper practice tests',
        'sourceUrl': url,
        'section': 'SAT R&W',
        'sourceRefKind': 'pdf-page',
        'pages': pages,
        'externalOnly': False,
    }, None


def main() -> int:
    numbers = list(range(4, 12))
    print(f'Extracting Reading and Writing text from {len(numbers)} official College Board PDFs.', flush=True)
    completed = []
    failures = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        futures = {executor.submit(fetch_test, number): number for number in numbers}
        for future in concurrent.futures.as_completed(futures):
            number = futures[future]
            try:
                result, error = future.result()
            except Exception as exception:
                result, error = None, str(exception)
            if result:
                completed.append(result)
                page_count = len(result['pages'])
                char_count = sum(len(page['text']) for page in result['pages'])
                print(f"OK test {number}: {page_count} R&W PDF pages, {char_count:,} text characters", flush=True)
            else:
                failures.append({'id': f'sat-official-practice-{number}', 'url': BASE.format(number=number), 'reason': error})
                print(f'SKIP test {number}: {error}', flush=True)

    completed.sort(key=lambda test: test['id'])
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps({
        'generatedAt': datetime.now(timezone.utc).isoformat(),
        'distribution': 'local-only text extraction cache; full SAT passages are not bundled into the app',
        'tests': completed,
        'failures': failures,
    }, ensure_ascii=False), encoding='utf-8')
    print(f'Extracted text for {len(completed)}/{len(numbers)} official SAT tests; skipped {len(failures)}.', flush=True)
    print(f'Local-only cache: {OUTPUT.relative_to(ROOT)}', flush=True)
    return 0 if completed else 1


if __name__ == '__main__':
    sys.exit(main())
