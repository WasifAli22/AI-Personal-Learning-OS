import os

file_path = 'app/services/ai_service.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(',\n                response_format={"type": "json_object"}', '')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
