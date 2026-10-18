import urllib.request, json

url = 'https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=av3zdxYvCp8&format=json'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=5) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print('Title:', data.get('title'))
    print('Author:', data.get('author_name'))
    print('Thumbnail:', data.get('thumbnail_url'))
