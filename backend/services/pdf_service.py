"""
PDF 解析服务
1. 使用 PyMuPDF 提取文本
2. 使用 AI Gateway (Claude) 智能识别元器件参数
"""
import io
import re
import httpx
import fitz  # PyMuPDF
from config import get_settings

settings = get_settings()


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """从 PDF 字节流中提取全文"""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    texts = []
    # 只取前10页，数据手册通常第1-3页包含主要参数
    for page_num in range(min(10, len(doc))):
        page = doc[page_num]
        texts.append(page.get_text("text"))
    doc.close()
    return "\n".join(texts)


async def extract_parameters_with_ai(text: str) -> dict:
    """
    使用 AI Gateway 从数据手册文本中提取关键参数
    返回结构化的物料信息
    """
    if not settings.AI_GATEWAY_KEY:
        # 没有 AI Key 时使用正则规则提取（基础版）
        return _regex_extract(text)

    prompt = f"""你是一名硬件工程师，请从以下元器件数据手册文本中提取关键信息。

请严格按照JSON格式返回，不要有其他文字：
{{
  "suggested_name": "元器件名称（中文，如：STM32F103C8T6 微控制器）",
  "suggested_manufacturer": "制造商名称（如：ST、TDK、Murata）",
  "suggested_manufacturer_pn": "制造商型号（如：STM32F103C8T6）",
  "suggested_category": "类别，从以下选择：resistor/capacitor/inductor/diode/transistor/ic_mcu/ic_power/ic_analog/ic_memory/ic_logic/connector/crystal/transformer/relay/sensor/other",
  "suggested_description": "一句话描述（如：ARM Cortex-M3, 72MHz, 64KB Flash, LQFP-48）",
  "parameters": [
    {{"key": "参数名", "value": "参数值"}}
  ]
}}

参数要提取：工作电压、工作温度、封装、主要规格（频率/容值/阻值/电流等）、接口类型等核心电气参数。

数据手册文本（前3000字）：
{text[:3000]}"""

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                settings.AI_GATEWAY_URL,
                headers={
                    "Authorization": f"Bearer {settings.AI_GATEWAY_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.AI_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 1500,
                    "temperature": 0.1,
                },
            )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                import json
                return json.loads(json_match.group())
    except Exception as e:
        print(f"AI extraction failed: {e}")

    return _regex_extract(text)


def _regex_extract(text: str) -> dict:
    """基于正则的基础参数提取（AI 不可用时的 fallback）"""
    params = []

    # 电压
    voltage_match = re.findall(r'(?:VCC|VDD|Supply Voltage|Working Voltage)[:\s]+([0-9.,~\s]+V)', text[:2000], re.IGNORECASE)
    if voltage_match:
        params.append({"key": "工作电压", "value": voltage_match[0].strip()})

    # 温度范围
    temp_match = re.findall(r'(?:Operating Temperature|Temperature Range)[:\s]+(-?\d+)\s*(?:to|~)\s*\+?(\d+)\s*°?C', text[:2000], re.IGNORECASE)
    if temp_match:
        params.append({"key": "工作温度", "value": f"{temp_match[0][0]}~+{temp_match[0][1]}°C"})

    # 封装
    pkg_match = re.findall(r'(?:Package|封装)[:\s]+([A-Z0-9\-]+(?:\d+)?)', text[:2000], re.IGNORECASE)
    if pkg_match:
        params.append({"key": "封装", "value": pkg_match[0].strip()})

    # 频率
    freq_match = re.findall(r'(\d+(?:\.\d+)?)\s*MHz', text[:1000])
    if freq_match:
        params.append({"key": "主频", "value": f"{freq_match[0]}MHz"})

    # 尝试识别型号
    pn_match = re.findall(r'\b([A-Z]{2,}[\dA-Z\-]{4,20})\b', text[:500])
    manufacturer_pn = pn_match[0] if pn_match else ""

    return {
        "suggested_name": manufacturer_pn or "未知元器件",
        "suggested_manufacturer": "",
        "suggested_manufacturer_pn": manufacturer_pn,
        "suggested_category": "other",
        "suggested_description": "",
        "parameters": params,
    }
