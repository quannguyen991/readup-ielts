import urllib.request
import re

url = 'https://tuhoc.dolenglish.vn/luyen-thi-ielts/ielts-online-test-answer-key-mock-test-ielts-10-test-1-listening'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        html = r.read().decode('utf-8', errors='ignore')
        print("Success! Length:", len(html))
        # Look for JSON payload in Next.js __NEXT_DATA__
        m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html)
        if m:
            print("Found __NEXT_DATA__! Length:", len(m.group(1)))
            import json
            next_data = json.loads(m.group(1))
            props = next_data.get('props', {})
            print("Props keys:", list(props.keys()))
            page_props = props.get('pageProps', {})
            print("PageProps keys:", list(page_props.keys()))
            # Look for test data or questions/answers in pageProps
            for k, v in page_props.items():
                print(f"  {k}: {type(v)}")
        else:
            print("No __NEXT_DATA__ found")
except Exception as e:
    print("Error:", e)
