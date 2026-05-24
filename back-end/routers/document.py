import os
import uuid
import json
from typing import List, Optional
from fastapi import APIRouter, WebSocketDisconnect, WebSocket, UploadFile, File, Form, Response, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime
import urllib.parse
from db import get_db, engine, styleEnum, DocLength, Base, Session, DocumentRecord, ItemSearch
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import simpleSplit
import asyncio
from websocket import process_document, manager
import unicodedata 


# 파일 임시 저장소 
temp_files: dict ={}


Base.metadata.create_all(bind=engine)

router= APIRouter()

# 인증 로직
def get_current_user(request:Request):
    user_id = request.session.get("user_id")

    if not user_id:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")
    
    return uuid.UUID(user_id)


# 파일 업로드 및 분석 결과 저장 API
@router.post("/upload")
async def upload_document(
    id : str = Form(...),
    file: UploadFile = File(...),
    summary_length: str = Form(...,alias="length"), # SHORT, MIDDLE, LONG
    style: str = Form(styleEnum.STYLE1),
    db: Session = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user) # 인증 로직 가정
    ):

    # summary_length 타입 확인하기
    allowed_lengths = [DocLength.SHORT, DocLength.MIDDLE, DocLength.LONG]
    
    if summary_length not in allowed_lengths:
        raise HTTPException(
            status_code=422, 
            detail=f"올바르지 않은 값입니다. {allowed_lengths} 중 하나를 선택해주세요."
        )

    ALLOWED_EXTENSIONS = (
    '.pdf', '.docx', '.doc', '.hwp', '.ppt', '.pptx', 
    '.jpg', '.jpeg', '.png', '.gif', '.webp', 
    '.xlsx', '.xlsm', '.xlsb', '.xls', 
    '.txt'
    ) 

    #허용할 확장자 목록 
    if not file.filename.endswith(ALLOWED_EXTENSIONS):
        raise HTTPException(status_code=422, detail=f"허용된 파일 형식:{ALLOWED_EXTENSIONS}")

    # 용량 체크
    MAX_SIZE = 10*1024*1024

    file_id = uuid.uuid4()
    file_bytes :bytes= await file.read()

    group_record_id = id

    if group_record_id == "new":
        group_record_id = str(uuid.uuid4()) # 새로운 UUID 문자열 생성
    else:
        existing_record = db.query(DocumentRecord).filter(DocumentRecord.id == group_record_id).first()
        if not existing_record:
            raise HTTPException(
                status_code=404,
                detail="수정하려는 기존 게시글(ID)을 찾을 수 없습니다."
            )

     # 파일 바이트를 메모리에 임시저장
    temp_files[str(file_id)] = {
        "bytes" : file_bytes,
        "summary_length" : summary_length
    }


    # 파일 검증
    if len(file_bytes)> MAX_SIZE:
        raise HTTPException(status_code=422, detail="파일 용량이 10MB를 초과했습니다.")
    
    await file.seek(0)
    ALLOWED_MIME_TYPES = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.hwp': 'application/x-hwp',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xlsm': 'application/vnd.ms-excel.sheet.macroEnabled.12',
    '.xlsb': 'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
    '.xls': 'application/vnd.ms-excel',
    '.txt': 'text/plain'
    }
    if file.content_type not in ALLOWED_MIME_TYPES.values():
        raise HTTPException(status_code=422, detail='파일 내영이 확장자와 일치하지 않습니다.')
    

    try:
        # 2. DOCUMENT_RECORDS 테이블에 저장
        new_record = DocumentRecord(
            id=str(group_record_id),
            user_id=current_user_id,
            file_id=file_id,
            file_name=file.filename,
            category=None,
            summary=None,
            upload_at=datetime.now(),
            process_at=None,
            task_status="PENDING"
        )
        db.add(new_record)
        db.commit()      

        # 3. 규격에 맞춘 JSON 응답
        return {
            "id" :group_record_id,
            "fileId": str(file_id),
            "fileName": file.filename,
            "fileSize": len(file_bytes),
            "status": "PENDING",
            "create_at": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"Error Detail: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    
# websocket 엔드 포인트
@router.websocket("/ws/{file_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    file_id:str
):
    await manager.connect(file_id, websocket)
    with Session() as db:
        try:
            temp_files_data = temp_files.get(str(file_id), None) # 임시 저장된 파일 바이트 꺼내오기
            if temp_files_data is not None:
                file_bytes = temp_files_data["bytes"]
                check_length = temp_files_data["summary_length"]
            else: 
                file_bytes = None
                check_length = None

            if not file_bytes:
                await manager.send(file_id, {"state":"FAILURE", "error": "파일을 찾을 수 없습니당!"})
                await websocket.close()
                return
            #process_document로 바로 전달
            asyncio.create_task(process_document(file_id, file_bytes, check_length, db))
            
            
            while True:
                    await websocket.receive_text() # 클라가 메시지 보낼때까지 대기 하겠다.
        except WebSocketDisconnect: # 루프를 빠져나오고 맨 밑에 있는 file_id 연결목록에서 해당 유저를 지우고 종료
            pass
        finally:
            manager.disconnect(file_id)
            db.close() 


# 사용자의 업로드 이력 조회 API
# @router.get("/history")
# async def get_user_history(
#     request:Request,
#     db: Session = Depends(get_db)
# ):
#     user_id =request.session.get("user_id")

#     if not user_id:
#         raise HTTPException(status_code=401, detail="로그인이 필요합니다.")
    
#     record = db.query(DocumentRecord).filter(DocumentRecord.user_id)
    
#     # 서브쿼리 : 각 id별로 가장 처음(최소 날짜)을 가상 테이블을 구한다.
#     sidebar_subquery = (
#         db.query(
#             DocumentRecord.id,
#             func.min(DocumentRecord.upload_at).label("first_upload")
#         )
#         .filter(DocumentRecord.user_id == user_id)
#         .group_by(DocumentRecord.id)
#         .subquery()
#     )

#     # 본 쿼리(서브쿼리와 조인) : 각 id별 첫번째 게시글의 모든 정보를 가져오는 쿼리
#     sidebar_origin = (
#         db.query(DocumentRecord).join(sidebar_subquery, DocumentRecord.id== sidebar_subquery.c.id, DocumentRecord.upload_at == sidebar_subquery.c.first_upload).order_by(DocumentRecord.upload_at.desc()).all()
#     )

#     if not sidebar_origin:
#         return []

#     return sidebar_origin

# # history 이력를 눌렀을시의 데이터 API
# @router.get("/history/{id}")
# async def get_history_detail(
#     id: str,
#     request:Request,
#     db: Session = Depends(get_db)
# ):
#     user_id =request.session.get("user_id")

#     if not user_id:
#         raise HTTPException(status_code=401, detail="로그인이 필요합니다.")
#     group_id = db.query(DocumentRecord).filter(DocumentRecord.user_id==user_id, DocumentRecord.id== id).all()
#     return group_id


# ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ

# @router.get("/history")
# async def get_user_history(
#     request: Request,
#     db: Session = Depends(get_db)
# ):
#     user_id = request.session.get("user_id")
#     if not user_id:
#         raise HTTPException(status_code=401, detail="로그인이 필요합니다.")


#     # record를 체이닝해서 서브쿼리 구성
#     sidebar_subquery = (
#         db.query(
#             DocumentRecord.id,
#             func.min(DocumentRecord.upload_at).label("first_upload")
#         )
#         .filter(DocumentRecord.user_id == user_id)
#         .group_by(DocumentRecord.id)
#         .subquery()
#     )

#     sidebar_origin = (
#         db.query(DocumentRecord)
#         .join(
#             sidebar_subquery,
#             and_(
#                 DocumentRecord.id == sidebar_subquery.c.id,
#                 DocumentRecord.upload_at == sidebar_subquery.c.first_upload
#             )
#         )
#         .filter(DocumentRecord.user_id == user_id)  
#         .order_by(DocumentRecord.upload_at.desc())
#         .all()
#     )

#     if not sidebar_origin:
#         return []
#     return sidebar_origin 


# @router.get("/history/{id}")
# async def get_history_detail(
#     id: str,
#     request: Request,
#     db: Session = Depends(get_db)
# ):
#     user_id = request.session.get("user_id")
#     if not user_id:
#         raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

#     # ✅ user_id 먼저, 그 다음 id 필터 (순서 중요)
#     group_id = (
#         db.query(DocumentRecord)
#         .filter(DocumentRecord.user_id == user_id)
#         .filter(DocumentRecord.id == id)
#         .order_by(DocumentRecord.upload_at)
#         .all()
#     )
#     return group_id

# ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ

@router.get("/history")
async def get_user_history(
    request: Request,
    db: Session = Depends(get_db),
    id: str = None  # 쿼리 파라미터 (?id=xxx)
):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

    # id가 있으면 상세 조회
    if id:
        return (
            db.query(DocumentRecord)
            .filter(DocumentRecord.user_id == user_id)
            .filter(DocumentRecord.id == id)
            .order_by(DocumentRecord.upload_at)
            .all()
        )

    # id가 없으면 목록 조회
    sidebar_subquery = (
        db.query(
            DocumentRecord.id,
            func.min(DocumentRecord.upload_at).label("first_upload")
        )
        .filter(DocumentRecord.user_id == user_id)
        .group_by(DocumentRecord.id)
        .subquery()
    )

    sidebar_origin = (
        db.query(DocumentRecord)
        .join(
            sidebar_subquery,
            and_(
                DocumentRecord.id == sidebar_subquery.c.id,
                DocumentRecord.upload_at == sidebar_subquery.c.first_upload
            )
        )
        .filter(DocumentRecord.user_id == user_id)
        .order_by(DocumentRecord.upload_at.desc())
        .all()
    )

    return sidebar_origin or []

#ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ


# history로 불러온 것 삭제 기능
@router.delete("/delete/{id}", status_code=204)
async def delete_item(request:Request,id:str, db:Session=Depends(get_db)):
    user_id =request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")
    db_file = db.query(DocumentRecord).filter(DocumentRecord.user_id==user_id, DocumentRecord.id == id).first()
    if not db_file:
        raise HTTPException(
            status_code = 404,
            detail = "삭제할 파일을 찾을 수 없습니다."
        )
    
    db.delete(db_file)
    db.commit()

    return None




# 결과 파일 다운로드 API (PDF/TXT 선택)
@router.get("/download/{id}")
async def download_file(id:str, format:str, db: Session = Depends(get_db)):
    record = db.query(DocumentRecord).filter(DocumentRecord.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="기록을 찾을 수 없습니다.")
    
    content = record.summary

    if format == 'txt':
        file_content=content.encode("utf-8")
        media_type= "text/plain"
        file_name =f"{urllib.parse.quote(record.file_name)}.txt"
    elif format == 'pdf':
        buffer = BytesIO()
        p = canvas.Canvas(buffer)
        text_object = p.beginText(40,750)
        # 한글 폰트 설정 필수
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        FONT_PATH = os.path.join(BASE_DIR, "fonts","NanumGothic.ttf")
        pdfmetrics.registerFont(TTFont("NanumGothic", FONT_PATH))
        text_object.setFont("NanumGothic",10)


        usable_width = 594 - 80 # A4 너비 - 양옆 너비


        for line in content.split('\n'):
            # 자동 줄바꿈
            text_line = simpleSplit(line, "NanumGothic",10, usable_width)
            for text in text_line:
                text_object.textLine(text) 
        
        p.drawText(text_object) 
        p.showPage() 
        p.save() 

        file_content = buffer.getvalue()
        buffer.close()
        media_type = "application/pdf"
        file_name = f"{urllib.parse.quote(record.file_name)}.pdf"

    return Response(
        content = file_content,
        media_type = media_type,
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{file_name}",
            "Access-Control-Expose-Headers" : "Content-Disposition"
        }
    )

# 검색 기능 API
@router.get('/search', response_model = List[ItemSearch])
async def search_file(
    request : Request,
    keyword: Optional[str] = Query(None, min_length=2), # 아무것도 없어도 되며, 최소 2글자는 적어야 한다.
    db:Session = Depends(get_db)
):
    
    if not hasattr(request, "session") or request.session is None:
        print("에러: 세션 미들웨어가 설정되지 않았거나 세션이 없습니다.")
        raise HTTPException(status_code=401, detail="세션 정보가 없습니다. 다시 로그인 해주세요.")

    user_id = request.session.get("user_id")

    if not user_id:
        raise HTTPException(status_code=401, detail="로그인이 필요한 서비스입니다.")
    
    clean_text = unicodedata.normalize('NFC', keyword)
    results = []
    all_records = db.query(DocumentRecord).filter(DocumentRecord.user_id == uuid.UUID(user_id)).all()
    if not keyword:
        return all_records
    for doc in all_records:
        normalized_file_name = unicodedata.normalize('NFC', doc.file_name)
        if clean_text in normalized_file_name:
            results.append(doc)
    return results