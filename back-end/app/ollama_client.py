import requests

url = "http://ollama:11434/api/generate"

payload = {
    "model": "gemma3:4b",
    "prompt": "",
    "stream": False
}

response = requests.post(url, json=payload)

print(response.json())