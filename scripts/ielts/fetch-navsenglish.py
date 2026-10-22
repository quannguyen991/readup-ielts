import urllib.request
import re
import json

url = 'https://navsenglish.com/ielts/reading/test?slug=cambridge-10-academic-reading-test-1&ref=vankhongluoi'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        html = r.read().decode('utf-8', errors='ignore')
        print('Status 200, HTML length:', len(html))
        # Check if Next.js hydration data exists: __NEXT_DATA__
        m = re.search(r'<script id="__NEXT_DATA__" type="application/json">([^<]+)</script>', html)
        if m:
            data = json.loads(m.group(1))
            print('Found __NEXT_DATA__! keys:', list(data.keys()))
            props = data.get('props', {}).get('pageProps', {})
            print('pageProps keys:', list(props.keys()))
            test_data = props.get('test', {}) or props.get('data', {}) or props
            print('test keys:', list(test_data.keys()))
            if 'questions' in test_data or 'answers' in test_data:
                print('Has questions/answers!')
except Exception as e:
    print('Error:', e)
