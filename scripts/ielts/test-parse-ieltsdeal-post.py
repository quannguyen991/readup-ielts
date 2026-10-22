import urllib.request
import re

url = 'https://ieltsdeal.com/ielts-academic-reading-cambridge-10-test-1-reading-passage-1-stepwells-with-best-solutions-and-explanations/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        html = r.read().decode('utf-8', errors='ignore')
        # Find all answers
        print('HTML length:', len(html))
        # Look for question & answer patterns like "Question 1: ... Answer: FALSE" or "Answers: 1. FALSE"
        answers = re.findall(r'(?:Question\s*(\d{1,2})|(\d{1,2})\.?)[\s\S]*?(?:Answer|Ans)[\:\s]+(?:<strong>)?([A-Za-z0-9\s/,\(\)]+?)(?:</strong>|</p>|<br|\n)', html, re.I)
        print('Found matches:', len(answers))
        for a in answers[:10]:
            print(' ', a)
except Exception as e:
    print('Error:', e)
