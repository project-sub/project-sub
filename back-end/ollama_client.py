import requests
# from hwpText import get_hwp_text
# from Pdf_nativeText_OCR import process_pdf

def subtract_text(input):
    base_prompt = (
        """
        [ROLE]
        너는 문서 자동 분류 및 요약 전용 AI이다.
        반드시 아래 규칙만 따른다.

        [RULES]
        - summary는 반드시 INPUT 내용만 기반으로 작성한다.
        - INPUT에 없는 추측, 외부지식, 상상, 보완 설명을 추가하지 않는다.
        - category는 가장 적절한 category를 하나만 선택한다.
        - 적절한 category가 없을 경우 "기타/미분류"를 선택한다.
        - 출력은 반드시 JSON 객체 하나만 생성한다.

        [OUTPUT FORMAT EXAMPLE]
        {
        "category": "CATEGORY_LIST 내부 값",
        "summary": "문서 요약"
        }

        [INPUT]
        """
    )

    categories = [
        "기술/개발문서",
        "법률/판례",
        "기획안/제안서",
        "경영/비즈니스",
        "교육/학술",
        "행정/공공문서",
        "생활/가정",
        "금융/회계",
        "의료/건강",
        "기타/미분류",
    ]

    category_text = "\n".join([f"- {c}" for c in categories])

    prom = f"""
    너는 문서 분류 및 요약 엔진이다.

    반드시 아래 규칙을 지켜라.

    [작업]
    INPUT 문서를 읽고 category와 summary를 생성한다.

    [category 선택 규칙]
    category는 반드시 CATEGORY_LIST 중 정확히 하나를 그대로 복사한다.
    CATEGORY_LIST에 없는 값은 절대 출력하지 않는다.
    category를 번역하거나, 줄이거나, 띄어쓰기를 바꾸거나, 새로 만들지 않는다.
    판단이 애매하면 "기타/미분류"를 선택한다.

    [CATEGORY_LIST]
    {category_text}

    [summary 작성 규칙]
    summary는 INPUT에 있는 내용만 근거로 작성한다.
    INPUT에 없는 정보, 추측, 외부 지식은 절대 추가하지 않는다.
    summary는 한국어로 작성한다.
    summary는 2문장 이상 5문장 이하로 작성한다.
    문서의 핵심 주제, 목적, 주요 내용을 포함한다.
    원문 의미를 과장하거나 바꾸지 않는다.

    [출력 규칙]
    반드시 JSON 객체만 출력한다.
    JSON 밖에 설명, 문장, 코드블록, 마크다운을 출력하지 않는다.
    키는 반드시 category와 summary만 사용한다.

    [출력 예시]
    {{
    "category": "교육/학술",
    "summary": "문서 요약 내용"
    }}

    [INPUT]
    """

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
                }
            },
            "required": ["category", "summary"]
        },
        "options": {
            "temperature": 0.1,
            "top_p": 0.2,
            "num_predict" : 256
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


# import os


# filename = "생성형 AI 보안.pdf"

# pdf_path = os.path.join("File", filename)
    
# with open(pdf_path, "rb") as f:
#     pdf_bytes = f.read()
    
# # 텍스트 추출 함수 호출
# text_result = process_pdf(pdf_bytes)

# # ollama 요약 함수 호출
# substract_result = subtract_text(text_result)

# print(substract_result)