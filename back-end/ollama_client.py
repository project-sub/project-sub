import requests

def subtract_text(input,length = "SHORT"):

    minLength = {"SHORT" : 100, "MIDDLE" : 400, "LONG" : 800}
    maxLength = {"SHORT" : 200, "MIDDLE" : 500, "LONG" : 900}
    TextLength = {"SHORT" : 250, "MIDDLE" : 700, "LONG" : 1500} # 한글이 아닌 byte 기준

    base_prompt = (
        """
        [ROLE]
        You are an AI for document summarization and classification.

        [GLOBAL RULE]
        - Ignore OCR noise, broken text, duplicated text, symbols, menus, headers, and meaningless fragments.
        - Understand the document by its overall meaning and purpose.
        - ALL outputs MUST be written in Korean.

        [TASK]

        Step 1. Understand Document
        - Determine:
        - document purpose
        - document role
        - intended usage
        - Do NOT rely on keyword frequency or technical terms alone.

        Step 2. Summarization

        Step 3. Classification
       

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
                "summary": {
                    "type": "string",
                    "description": f"""
                    [Summary Rule]
                    - Summarize using the document understanding from Step 1.
                    - Focus on the document's main purpose and role.
                    - Prefer semantic meaning over repeated keywords.
                    - Do NOT over-focus on technical terms.

                    [Summary Detail Level]
                    level : {length}

                    - SHORT:
                    Aggressively compress the content.
                    Keep only the core purpose and main topic.

                    - MIDDLE:
                    Include the document purpose, major contents, and important context.

                    - LONG:
                    Avoid excessive compression.
                    Preserve as much meaningful information as possible.
                    Include important details and major activities.
                    """
                },
                "classification_basis" : {
                    "type":"string",
                    "description": """
                         [Classification Basis Rule]
                        - Describe the document ROLE, not the document subject.
                        - Focus on what the document is used for.
                    """
                },
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
                        [Classification Rule]
                        - The category must be consistent with classification_basis.
                        - Select the category based on the document ROLE, not the industry or topic.

                        [Category meanings]
                        - 기술/개발문서:
                        Documents mainly about software, systems, APIs,
                        engineering, implementation, architecture,
                        technical operations, or development processes.

                        - 법률/판례:
                        Documents related to laws, regulations, contracts,
                        lawsuits, legal analysis, court decisions,
                        or official legal interpretation.

                        - 기획안/제안서:
                        Documents proposing a project, service, strategy,
                        business idea, future plan, or execution proposal.

                        - 경영/비즈니스:
                        Documents focused on company operations, business strategy,
                        market analysis, service introduction, management,
                        or corporate information.

                        - 교육/학술:
                        Documents intended for education, research,
                        academic study, lectures, textbooks,
                        or scholarly analysis.

                        - 행정/공공문서:
                        Documents issued by government or public institutions,
                        including reports, notices, policies,
                        administrative procedures, or public services.

                        - 생활/가정:
                        Documents related to daily life, lifestyle,
                        hobbies, travel, home, food,
                        or consumer-oriented information.

                        - 금융/회계:
                        Documents about finance, accounting, tax,
                        investment, insurance, budgeting,
                        or financial reporting.

                        - 의료/건강:
                        Documents related to healthcare, medicine,
                        diagnosis, hospitals, treatment,
                        or health management.

                        - 기타/미분류:
                        Documents that do not clearly fit
                        into the categories above.
                        """
                },
            },
            "required": ["summary", "classification_basis", "category"]
        },
        "options": {

            "num_ctx": 16384,        # 모델이 한 번에 참고할 최대 토큰 길이 (GPU VRAM 사용량에 직접 영향)
            "num_batch": 512,       # GPU에서 병렬 처리할 토큰 배치 크기 (GPU 사용률 상승, 속도 개선)

            "temperature": 0.1,     # 낮을수록 안정적/요약형 출력
            "top_k": 20,            # 상위 K개 후보만 선택(단어의 의미) -> 너무 높으면 헛소리 증가/ 낮으면 문장반복 증가
            "top_p": 0.8,           # 확률 누적 기반 sampling 제한 -> 확률높은 후보부터 확률을 더해 멈추는 목표값 설정

            "repeat_penalty": 1.0,  # 반복 문장 억제 (요약 품질 유지)
            "num_predict": 2048,    # 생성할 최대 토큰 수 (응답 길이 제한, GPU 사용 시간 증가 요소)


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

#     result = subtract_text(file_text, "SHORT")

#     print("\n====================")
#     print("FINAL RESULT")
#     print("====================\n")
#     print(result)

'''
로컬 테스트용 END
'''