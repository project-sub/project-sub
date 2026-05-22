import os
import requests
from dotenv import load_dotenv
from prompts import (
    BASE_PROMPT,
    LENGTH_PROMPT_MAP
)

load_dotenv()

base_url = os.getenv('OLLAMA_URL')
base_model = os.getenv('OLLAMA_MODEL')

def subtract_text(input, length = 'SHORT'):
    length = str(length).upper()

    length_prompt = LENGTH_PROMPT_MAP.get(
        length,
        LENGTH_PROMPT_MAP['MIDDLE']
    )

    print(f'length_prompt: {length_prompt}')
    
    base_prompt = BASE_PROMPT.format(length_prompt=length_prompt)

    print('base_prompt: ', base_prompt)

    url = base_url

    payload = { 
        'model': base_model,
        'system': base_prompt,
        'prompt': input,
        'stream': False,
        'format': {
            'type': 'object',
            'properties': {
                'summary': {
                    'type': 'string',
                },
                'category': {
                    'type': 'string',
                    'enum': [
                        '기술/개발문서',
                        '법률/판례',
                        '기획안/제안서',
                        '경영/비즈니스',
                        '교육/학술',
                        '행정/공공문서',
                        '생활/가정',
                        '금융/회계',
                        '의료/건강',
                        '기타/미분류'
                    ]
                },
            },
            'required': ['summary', 'category']
        },
        'options': {
            'num_ctx': 32768,        # 모델이 한 번에 참고할 최대 토큰 길이 (GPU VRAM 사용량에 직접 영향)
            'num_batch': 512,       # GPU에서 병렬 처리할 토큰 배치 크기 (GPU 사용률 상승, 속도 개선)

            'temperature': 0.1,     # 낮을수록 안정적/요약형 출력
            'top_k': 20,            # 상위 K개 후보만 선택(단어의 의미) -> 너무 높으면 헛소리 증가/ 낮으면 문장반복 증가
            'top_p': 0.8,           # 확률 누적 기반 sampling 제한 -> 확률높은 후보부터 확률을 더해 멈추는 목표값 설정

            'repeat_penalty': 1.0,  # 반복 문장 억제 (요약 품질 유지)
            'num_predict': 2048,    # 생성할 최대 토큰 수 (응답 길이 제한, GPU 사용 시간 증가 요소)


            # 'num_thread': 8,      # CPU inference 스레드 수 (GPU 사용 시 영향 거의 없음) → GPU 안 잡히는 환경에서만 중요
            
            # GPU 세팅
            'num_gpu': 999,         # 가능한 모든 layer GPU offload

            'f16_kv': True,         # cache를 FP16으로 저장 → VRAM 절약 + 속도 증가
            'low_vram': False,      # GPU VRAM 부족 모드 (켜면 성능 감소 → 일반적으로 false)

            'use_mmap': True,       # 모델 파일을 memory-mapped 방식으로 로딩 (로드 속도 개선)
            'use_mlock': False,     # RAM lock 여부 (GPU 환경에서는 보통 불필요)
        }
    }

    print('요약 시작')
    

    try:
        response = requests.post(url, json=payload)

        print(f'응답 상태 코드: {response.status_code}');
        print(f'응답 본문: {response.text}');

        response.raise_for_status()  # 요청 오류 발생 시 예외 발생
        
        result = response.json()
        return result['response']
    except requests.exceptions.RequestException as e:
        return f'Error: {str(e)}'



'''
로컬 테스트용
'''
# import os

# if __name__ == "__main__":

#     filename = "t1.txt"
#     file_path = os.path.join("util/File", filename)
    
#     with open(file_path, "r") as f:
#         file_text = f.read()

#     result = subtract_text(file_text, "SHORT")

#     print("\n====================")
#     print("FINAL RESULT")
#     print("====================\n")
#     print(result)

'''
로컬 테스트용 END
'''