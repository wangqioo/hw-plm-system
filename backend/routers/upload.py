from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from models import User
from auth import get_current_user
from services.pdf_service import extract_text_from_pdf, extract_parameters_with_ai
from services.minio_service import upload_file
from schemas import PDFExtractResult

router = APIRouter(prefix="/upload", tags=["upload"])

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


@router.post("/pdf", response_model=PDFExtractResult)
async def upload_and_extract_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    上传数据手册 PDF：
    1. 存储到 MinIO
    2. 提取文本
    3. AI 识别参数
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名不能为空")

    content_type = file.content_type or "application/octet-stream"
    allowed_types = ["application/pdf", "application/octet-stream", "text/plain"]
    if not any(t in content_type for t in ["pdf", "text", "octet"]):
        raise HTTPException(status_code=400, detail="仅支持 PDF 和文本文件")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="文件大小超过50MB限制")

    # Upload to MinIO
    try:
        file_url = upload_file(file_bytes, file.filename, content_type)
    except Exception as e:
        print(f"MinIO upload failed: {e}")
        file_url = ""  # Continue even if storage fails

    # Extract text
    try:
        if "pdf" in content_type or file.filename.lower().endswith(".pdf"):
            extracted_text = extract_text_from_pdf(file_bytes)
        else:
            extracted_text = file_bytes.decode("utf-8", errors="ignore")
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"文件解析失败: {str(e)}")

    # AI parameter extraction
    try:
        ai_result = await extract_parameters_with_ai(extracted_text)
    except Exception as e:
        print(f"AI extraction error: {e}")
        ai_result = {
            "suggested_name": "",
            "suggested_manufacturer": "",
            "suggested_manufacturer_pn": "",
            "suggested_category": "other",
            "suggested_description": "",
            "parameters": [],
        }

    return PDFExtractResult(
        file_url=file_url,
        file_name=file.filename,
        extracted_text=extracted_text[:5000],  # Return first 5000 chars
        suggested_name=ai_result.get("suggested_name", ""),
        suggested_manufacturer=ai_result.get("suggested_manufacturer", ""),
        suggested_manufacturer_pn=ai_result.get("suggested_manufacturer_pn", ""),
        suggested_category=ai_result.get("suggested_category", "other"),
        suggested_description=ai_result.get("suggested_description", ""),
        parameters=[
            {"key": p["key"], "value": p["value"]}
            for p in ai_result.get("parameters", [])
            if p.get("key") and p.get("value")
        ],
    )
