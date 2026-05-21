import urllib.request
import json

data = json.dumps({"topic": "math", "num_questions": 5, "difficulty": "medium", "question_types": ["mcq"], "document_ids": []}).encode('utf-8')
req = urllib.request.Request('http://localhost:8000/api/generate-quiz', data=data, headers={'Content-Type': 'application/json', 'Authorization': 'test'})
try:
    with urllib.request.urlopen(req) as response:
        print("STATUS:", response.status)
        print("BODY:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("ERROR STATUS:", e.code)
    print("ERROR BODY:", e.read().decode('utf-8'))
