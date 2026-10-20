"""Collect public test links and source metadata; never synthesize test bodies."""
import html
import json
import re
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

ROOT = Path(__file__).resolve().parents[2]
ORIGIN = 'https://ieltsonlinetests.com'
CHECKED = datetime.now(timezone.utc).isoformat()


def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; ReadUpCatalog/1.0)'})
    with urllib.request.urlopen(request, timeout=25) as response:
        return response.read().decode('utf-8')


def links(text):
    return list(dict.fromkeys(html.unescape(link) for link in re.findall(r'href=[\"\x27]([^\"\x27]+)', text)))


def main():
    collections = set()
    for page in range(3):
        url = f'{ORIGIN}/ielts-exam-library?page={page}'
        try:
            collections.update(link for link in links(fetch(url)) if '/collection/' in link and ('volume' in link or 'mock-test-2026' in link))
        except Exception as error:
            print(f'Could not fetch {url}: {error}', flush=True)
    selected = sorted(collections, key=lambda link: (int(re.search(r'volume-(\d+)', link)[1]) if re.search(r'volume-(\d+)', link) else 2026, link), reverse=True)
    records = {}
    sources = []
    for link in selected:
        url = urljoin(ORIGIN, link)
        try:
            body = fetch(url)
        except Exception as error:
            print(f'Could not fetch {url}: {error}', flush=True); continue
        title_match = re.search(r'<h1[^>]*>(.*?)</h1>', body, re.S | re.I)
        title = html.unescape(re.sub(r'<[^>]*>', '', title_match[1])).strip() if title_match else link.rsplit('/', 1)[-1]
        sources.append({'title': title, 'url': url, 'checkedAt': CHECKED})
        for test_link in links(body):
            path = urlparse(test_link).path.removesuffix('/solution')
            match = re.search(r'/(?:vi/)?([^/]+)-(listening|reading|writing|speaking)-(?:practice-)?test-(\d+)$', path)
            if not match:
                continue
            slug, skill, number = match.groups()
            # Only include links that belong to this collection, not recommendations.
            if slug.replace('volume-', '') not in link.replace('volume-', '') and link.rsplit('/', 1)[-1].replace('volume-', '') not in slug.replace('volume-', ''):
                continue
            test_url = urljoin(ORIGIN, path)
            if urlparse(test_url).hostname != urlparse(ORIGIN).hostname:
                continue
            identifier = f'iot-{slug}-{skill}-{number}'
            records[identifier] = {
                'id': identifier, 'title': f'{title} · {skill.title()} Test {number}', 'source': title,
                'section': skill.title(), 'questionCount': 2 if skill == 'writing' else 3 if skill == 'speaking' else 40,
                'answerMode': 'long' if skill in ('writing', 'speaking') else 'short',
                'pages': [], 'supportPages': [], 'audioFiles': [], 'sourceUrl': test_url,
                'externalOnly': True, 'answerKeyVerified': False, 'contentVerified': False, 'sourceCheckedAt': CHECKED,
            }
        print(f'{title}: {sum(r["source"] == title for r in records.values())} test links', flush=True)

    # Official provider pages contain free sample/practice material. Keep those
    # as source links; the text of their copyrighted papers stays on the provider.
    official_sources = [
        {
            'title': 'British Council · IELTS Listening practice and sample tasks',
            'url': 'https://takeielts.britishcouncil.org/prepare/ielts-free-practice-mock-tests/academic/listening',
            'contentKinds': ['multiple choice', 'matching', 'map/plan labelling', 'note completion', 'table completion', 'sentence completion', 'short answer'],
        },
        {
            'title': 'British Council · IELTS Speaking practice',
            'url': 'https://takeielts.britishcouncil.org/prepare/ielts-free-practice-mock-tests/academic/speaking',
            'contentKinds': ['Part 1 interview', 'Part 2 cue card', 'Part 3 discussion'],
        },
        {
            'title': 'IDP IELTS · Listening free practice tests',
            'url': 'https://ielts.idp.com/prepare/free-practice-tests/listening',
            'contentKinds': ['form/note completion', 'map labelling', 'multiple choice', 'matching', 'table completion', 'flow-chart completion', 'sentence completion', 'short answer'],
        },
        {
            'title': 'IDP IELTS · Academic practice tests',
            'url': 'https://ielts.idp.com/mauritius/prepare/ielts-academic-practice-test',
            'contentKinds': ['Listening', 'Reading', 'Writing', 'Speaking'],
        },
        {
            'title': 'IELTSbiz · Speaking forecast September–December 2026',
            'url': 'https://ieltsbiz.com/ielts-news/ielts-speaking-forecast-sep-dec-2026',
            'contentKinds': ['Part 1 themes', 'Part 2 reported cue-card themes', 'Part 3 discussion themes'],
        },
        {
            'title': 'LinguaPractice · Speaking questions September–December 2026',
            'url': 'https://linguapractice.com/ielts/speaking/recent-questions/2026-september-december',
            'contentKinds': ['Part 1 reported topics', 'Part 2 reported cue cards', 'Part 3 follow-up themes'],
        },
    ]
    sources.extend({**source, 'checkedAt': CHECKED} for source in official_sources)
    records.update({
        'official-british-council-listening-sample': {
            'id': 'official-british-council-listening-sample',
            'title': 'British Council · Full computer Listening sample (40 questions)',
            'source': 'British Council IELTS', 'section': 'Listening', 'questionCount': 40,
            'answerMode': 'short', 'pages': [], 'supportPages': [], 'audioFiles': [],
            'sourceUrl': official_sources[0]['url'], 'externalOnly': True,
            'answerKeyVerified': False, 'contentVerified': False, 'sourceCheckedAt': CHECKED,
        },
        'official-idp-listening-practice': {
            'id': 'official-idp-listening-practice',
            'title': 'IDP IELTS · Listening practice and question types',
            'source': 'IDP IELTS', 'section': 'Listening', 'questionCount': 40,
            'answerMode': 'short', 'pages': [], 'supportPages': [], 'audioFiles': [],
            'sourceUrl': official_sources[2]['url'], 'externalOnly': True,
            'answerKeyVerified': False, 'contentVerified': False, 'sourceCheckedAt': CHECKED,
        },
        'official-british-council-speaking-sample': {
            'id': 'official-british-council-speaking-sample',
            'title': 'British Council · Speaking practice sample',
            'source': 'British Council IELTS', 'section': 'Speaking', 'questionCount': 3,
            'answerMode': 'long', 'pages': [], 'supportPages': [], 'audioFiles': [],
            'sourceUrl': official_sources[1]['url'], 'externalOnly': True,
            'answerKeyVerified': False, 'contentVerified': False, 'sourceCheckedAt': CHECKED,
        },
    })
    sample_url = 'https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test'
    fetch(sample_url)
    for skill in ['Listening', 'Reading', 'Writing', 'Speaking']:
        identifier = f'official-ielts-sample-{skill.lower()}'
        records[identifier] = {'id': identifier, 'title': f'IELTS Official · {skill} sample tasks', 'source': 'IELTS Official Samples', 'section': skill, 'questionCount': 2 if skill == 'Writing' else 3 if skill == 'Speaking' else 40, 'pages': [], 'supportPages': [], 'audioFiles': [], 'sourceUrl': sample_url, 'externalOnly': True, 'answerKeyVerified': False, 'sourceCheckedAt': CHECKED}
    sources.append({'title': 'IELTS Official Academic sample tasks', 'url': sample_url, 'checkedAt': CHECKED,
                    'contentKinds': ['Listening', 'Reading', 'Writing', 'Speaking']})
    output = ROOT / 'src' / 'data' / 'ielts-external-tests.json'
    output.write_text(json.dumps({'checkedAt': CHECKED, 'sources': sources, 'tests': list(records.values())}, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Saved {len(records)} links from {len(sources)} sources', flush=True)


if __name__ == '__main__':
    main()
