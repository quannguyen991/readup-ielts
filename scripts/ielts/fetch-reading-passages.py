"""Extract public IELTS Reading passage text into the local-only vocabulary build cache."""

import concurrent.futures
import json
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / 'src' / 'data' / 'ielts-external-tests.json'
OUTPUT = ROOT / '.local-private' / 'ielts-ocr' / 'web-reading-text.json'
ALLOWED_HOSTS = {'ieltsonlinetests.com', 'www.ieltsonlinetests.com'}


def clean_passage(value: str) -> str:
    value = value.replace('\ufffd', "'")
    value = re.sub(r'\s+', ' ', value)
    return value.strip()


def fetch_test(test: dict) -> tuple[dict | None, str | None]:
    url = test.get('sourceUrl', '')
    if urlparse(url).hostname not in ALLOWED_HOSTS:
        return None, 'unsupported host'
    time.sleep(0.25)
    request = Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (compatible; ReadUpVocabularyResearch/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
    })
    try:
        with urlopen(request, timeout=30) as response:
            if response.status != 200:
                return None, f'HTTP {response.status}'
            raw = response.read()
    except (HTTPError, URLError, TimeoutError) as error:
        return None, str(error)

    soup = BeautifulSoup(raw, 'html.parser')
    sections = soup.select('section.test-contents[id^="part-"]')
    pages = []
    for section in sections:
        match = re.search(r'part-(\d+)$', section.get('id', ''))
        passage_number = int(match.group(1)) if match else len(pages) + 1
        passage = section.select_one('.field--name-field-passage')
        if not passage:
            # Some pages place the passage directly inside the part section.
            passage = section
        text = clean_passage(passage.get_text(' ', strip=True))
        if len(text) >= 400:
            pages.append({'page': passage_number, 'text': text})

    if not pages:
        return None, 'no readable passages found'
    return {
        'id': test['id'],
        'title': test['title'],
        'source': test.get('source', 'IELTS Online Tests'),
        'sourceUrl': url,
        'section': 'Reading',
        'pages': pages,
        'sourceRefKind': 'passage',
        'externalOnly': False,
    }, None


def main() -> int:
    catalog = json.loads(CATALOG.read_text(encoding='utf-8'))
    tests = [
        test for test in catalog.get('tests', [])
        if test.get('section') == 'Reading' and test.get('sourceUrl')
        and urlparse(test['sourceUrl']).hostname in ALLOWED_HOSTS
    ]
    print(f'Fetching {len(tests)} public IELTS Reading practice pages (maximum 4 concurrent requests).', flush=True)
    completed = []
    failures = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(fetch_test, test): test for test in tests}
        for future in concurrent.futures.as_completed(futures):
            test = futures[future]
            try:
                result, error = future.result()
            except Exception as exception:  # Keep the batch moving if one page is malformed.
                result, error = None, str(exception)
            if result:
                completed.append(result)
                print(f"OK {test['id']}: {len(result['pages'])} passages", flush=True)
            else:
                failures.append({'id': test['id'], 'url': test.get('sourceUrl'), 'reason': error})
                print(f"SKIP {test['id']}: {error}", flush=True)

    completed.sort(key=lambda test: test['id'])
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps({
        'generatedAt': datetime.now(timezone.utc).isoformat(),
        'distribution': 'local-only extraction cache; passage text is not bundled into the app',
        'tests': completed,
        'failures': failures,
    }, ensure_ascii=False), encoding='utf-8')
    print(f'Extracted text for {len(completed)}/{len(tests)} Reading tests; skipped {len(failures)}.', flush=True)
    print(f'Local-only cache: {OUTPUT.relative_to(ROOT)}', flush=True)
    return 0 if completed else 1


if __name__ == '__main__':
    sys.exit(main())
