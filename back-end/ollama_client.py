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
            "num_ctx": 16384,   # 모델의 작업 메모리 크기
            "num_predict": 2048 # 답변 최대 길이 제한
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

#     startTime = time.localtime()

#     filename = "(주)더다올디앤씨_회사소개서 (1).pdf"
#     pdf_path = os.path.join("File", filename)
    
#     with open(pdf_path, "rb") as f:
#         pdf_bytes = f.read()

#     result = process_pdf(pdf_bytes)

#     endTime = time.localtime()

#     print("\n====================")
#     print("FINAL RESULT")
#     print("====================\n")
#     # print(result)

#     print(endTime - startTime)

'''
로컬 테스트용 END
'''