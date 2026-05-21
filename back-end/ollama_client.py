import requests

def subtract_text(input):
    base_prompt = (
        """
        [ROLE]
        너는 문서 자동 분류 및 요약 전용 AI이다.
        각 페이지마다 핵심 내용을 간추리고, 페이지별 요약들을 기반으로 문서 전체의 category와 summary를 생성하라.

        Focus on:
        - what the document mainly explains
        - what occupies the largest portion of the document
        - the primary business or administrative purpose

        Ignore:
        - login screens
        - navigation menus
        - button labels
        - repeated OCR artifacts
        - sample UI data

        [OUTPUT FORMAT EXAMPLE]
        {
            "category": "CATEGORY_LIST 내부 값",
            "summary": "문서 요약"
        }

        [INPUT]
        """
    )

    prompt = base_prompt + input

    url = "http://ollama:11434/api/generate"

    payload = { 
        "model": "gemma3:4b",
        "prompt": prompt,
        "stream": False,
        "format": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "enum": [
                        "기술/개발문서",
                        "법률/판례",
                        "기획안/제안서",
                        "경영/비즈니스",
                        "교육/학술",
                        "행정/공공문서",
                        "생활/가정",
                        "금융/회계",
                        "의료/건강",
                        "기타/미분류"
                    ],
                    "description": """

                        Classify based on the document's PRIMARY PURPOSE and MAIN DOMAIN.

                        Do NOT classify using isolated keywords.
                        Focus on the overall purpose of the document.

                        Classify by the MAIN BUSINESS DOMAIN, not by technologies used in the document.

                        Category meanings:

                        - 기술/개발문서:
                        software, programming, API, system architecture, database,
                        AI, machine learning, engineering, technical documentation

                        - 법률/판례:
                        law, contract, lawsuit, regulation, policy, legal interpretation,
                        court decision, legal document

                        - 기획안/제안서:
                        proposal, project plan, business proposal, service planning,
                        strategy proposal, presentation planning

                        - 경영/비즈니스:
                        business, management, marketing, sales, market analysis,
                        corporate strategy, business report

                        - 교육/학술:
                        education, lecture, textbook, research paper,
                        academic article, study material, academic report

                        - 행정/공공문서:
                        government document, public institution, official notice,
                        administrative report, civil service document, policy document

                        - 생활/가정:
                        daily life, home, lifestyle, cooking, hobby,
                        travel, consumer information

                        - 금융/회계:
                        finance, accounting, tax, investment, insurance,
                        asset management, financial statement

                        - 의료/건강:
                        medical record, healthcare, diagnosis, hospital,
                        medicine, health management

                        - 기타/미분류:
                        document that does not clearly belong to other categories
                        """
                },
                "summary": {
                    "type": "string"
                },
                
            },
            "required": ["category", "summary"]
        },
        "options": {

            "num_ctx": 4096,        # 모델이 한 번에 참고할 최대 토큰 길이 (GPU VRAM 사용량에 직접 영향)
            "num_batch": 512,       # GPU에서 병렬 처리할 토큰 배치 크기 (GPU 사용률 상승, 속도 개선)

            "temperature": 0.1,     # 낮을수록 안정적/요약형 출력
            "top_k": 20,            # 상위 K개 후보만 선택(단어의 의미) -> 너무 높으면 헛소리 증가/ 낮으면 문장반복 증가
            "top_p": 0.9,           # 확률 누적 기반 sampling 제한 -> 확률높은 후보부터 확률을 더해 멈추는 목표값 설정

            "repeat_penalty": 1.0, # 반복 문장 억제 (요약 품질 유지)
            "num_predict": 1024,    # 생성할 최대 토큰 수 (응답 길이 제한, GPU 사용 시간 증가 요소)


            # "num_thread": 8,      # CPU inference 스레드 수 (GPU 사용 시 영향 거의 없음) → GPU 안 잡히는 환경에서만 중요
            
            # GPU 세팅
            "num_gpu": 999,         # 가능한 모든 layer GPU offload

            "f16_kv": True,         # cache를 FP16으로 저장 → VRAM 절약 + 속도 증가
            "low_vram": False,      # GPU VRAM 부족 모드 (켜면 성능 감소 → 일반적으로 false)

            "use_mmap": True,       # 모델 파일을 memory-mapped 방식으로 로딩 (로드 속도 개선)
            "use_mlock": False,     # RAM lock 여부 (GPU 환경에서는 보통 불필요)
        }
    }

    print("요약 시작")
    

    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()  # 요청 오류 발생 시 예외 발생
        
        result = response.json()
        return result["response"]
    except requests.exceptions.RequestException as e:
        return f"Error: {str(e)}"



'''
로컬 테스트용
'''
# import os

# if __name__ == "__main__":

#     filename = "t1.txt"
#     file_path = os.path.join("util/File", filename)
    
#     with open(file_path, "r") as f:
#         file_text = f.read()

#     result = subtract_text(file_text)

#     print("\n====================")
#     print("FINAL RESULT")
#     print("====================\n")
#     print(result)

'''
로컬 테스트용 END
'''