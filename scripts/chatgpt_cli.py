#!/usr/bin/env python3
"""
ChatGPT / AI CLI Client
Supports querying local and upstream LLM providers via OpenAI-compatible endpoints.
"""

import sys
import os
import json
import argparse
import requests
import io

# Force UTF-8 on Windows
if sys.platform == 'win32':
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    except Exception:
        pass

def load_env():
    env_vars = {}
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    env_vars[k.strip()] = v.strip().strip('"').strip("'")
    return env_vars

def clean_response_text(text: str) -> dict:
    text = text.strip()
    if 'data: [DONE]' in text:
        text = text.split('data: [DONE]')[0].strip()
    return json.loads(text)

def query_chatgpt(prompt: str, system: str = None, model: str = None, provider: str = 'local') -> str:
    env = load_env()
    
    # Provider resolution
    if provider == 'local':
        base_url = env.get('AI_LOCAL_BASE_URL', 'http://localhost:20128/v1')
        api_key = env.get('AI_LOCAL_API_KEY', '')
        default_model = 'gpt-5.4'
    elif provider == 'groq':
        base_url = env.get('AI_PRIMARY_BASE_URL', 'https://api.groq.com/openai/v1')
        api_key = env.get('AI_PRIMARY_API_KEY', '')
        default_model = 'openai/gpt-oss-120b'
    elif provider == 'secondary':
        base_url = env.get('AI_SECONDARY_BASE_URL', 'https://home.ai-box.vn/v1')
        api_key = env.get('AI_SECONDARY_API_KEY', '')
        default_model = 'qwen3.8-max'
    else:
        base_url = env.get('OPENAI_BASE_URL', 'http://localhost:20128/v1')
        api_key = env.get('OPENAI_API_KEY', '')
        default_model = 'gpt-5.4'

    chosen_model = model or default_model
    messages = []
    if system:
        messages.append({'role': 'system', 'content': system})
    messages.append({'role': 'user', 'content': prompt})

    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    payload = {
        'model': chosen_model,
        'messages': messages,
        'temperature': 0.7,
        'max_tokens': 2500
    }

    url = f"{base_url.rstrip('/')}/chat/completions"
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=60)
        if resp.status_code == 200:
            data = clean_response_text(resp.text)
            choice = data['choices'][0]
            content = choice['message'].get('content', '')
            return content
        else:
            if provider != 'groq':
                return query_chatgpt(prompt, system, model='openai/gpt-oss-120b', provider='groq')
            return f"Error {resp.status_code}: {resp.text[:300]}"
    except Exception as e:
        if provider != 'groq':
            return query_chatgpt(prompt, system, model='openai/gpt-oss-120b', provider='groq')
        return f"Request failed: {e}"

def main():
    parser = argparse.ArgumentParser(description="CLI ChatGPT / LLM Query Tool")
    parser.add_argument("prompt", nargs="+", help="User prompt/question")
    parser.add_argument("-s", "--system", help="System prompt", default="You are an expert IELTS and English language education researcher.")
    parser.add_argument("-m", "--model", help="Model name (e.g. gpt-5.4, gpt-5.6-sol, openai/gpt-oss-120b)")
    parser.add_argument("-p", "--provider", choices=["local", "groq", "secondary"], default="local")
    
    args = parser.parse_args()
    full_prompt = " ".join(args.prompt)
    
    result = query_chatgpt(full_prompt, system=args.system, model=args.model, provider=args.provider)
    print(result)

if __name__ == '__main__':
    main()
