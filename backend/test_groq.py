from groq import Groq
import os

client = Groq(api_key='')
prompt = """Generate 5 medium quiz questions. Types: mcq. Return ONLY valid JSON.
{"title":"Quiz on math","questions":[]}
MATERIAL: math"""

try:
    response = client.chat.completions.create(
        model='llama-3.3-70b-versatile',
        messages=[{'role': 'user', 'content': prompt}],
        response_format={'type': 'json_object'}
    )
    print("SUCCESS!")
    print(response.choices[0].message.content)
except Exception as e:
    print("ERROR:")
    print(e)
