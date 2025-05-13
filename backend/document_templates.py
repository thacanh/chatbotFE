from typing import List, Dict
import json
from pathlib import Path

# Document template configuration
DOCUMENT_TEMPLATES = [
    {
        "id": "1",
        "link": "../../../public/assets/Mau-1-1-nghi-quyet-ca-biet.docx",
        "description": "Nghị quyết (cá biệt): Đưa ra quyết định cụ thể như bổ nhiệm, miễn nhiệm, khen thưởng đối với cá nhân hoặc tổ chức."
    },
    {
        "id": "2",
        "link": "../../../public/assets/Mau-1-3-Quyet-dinh-ca-biet-quy-dinh-truc-tiep.docx",
        "description": "Quyết định (cá biệt) quy định trực tiếp: Áp dụng trực tiếp đến cá nhân, đơn vị như bổ nhiệm, điều động, kỷ luật."
    },
    {
        "id": "3",
        "link": "../../../public/assets/Mau-1-2-Quyet-dinh-ca-biet-quy-dinh-gian-tiep.docx",
        "description": "Quyết định (quy định gián tiếp): Ban hành các quy định chung như quy chế, nội quy, áp dụng cho nhiều đối tượng."
    },
    {
        "id": "4",
        "link": "../../../public/assets/Mau-1-4– Van-ban-co-ten-loai.docx",
        "description": "Văn bản có tên loại: Chỉ thị, Quy chế, Thông báo, Hướng dẫn, Kế hoạch, v.v., thể hiện định hướng và triển khai công tác hành chính."
    },
    {
        "id": "5",
        "link": "../../../public/assets/Mau-1-5-cong-van.docx",
        "description": "Công văn: Dùng để trao đổi công việc, thông báo, đề nghị hoặc phản hồi giữa các cơ quan."
    },
    {
        "id": "6",
        "link": "../../../public/assets/Mau-1-6-cong-dien.docx",
        "description": "Công điện: Văn bản khẩn cấp truyền đạt mệnh lệnh, chỉ đạo nhanh giữa các cấp."
    },
    {
        "id": "7",
        "link": "../../../public/assets/Mau-1-7-giay-moi.docx",
        "description": "Giấy mời: Mời cá nhân, đơn vị tham dự các cuộc họp, hội nghị, hội thảo, sự kiện."
    },
    {
        "id": "8",
        "link": "../../../public/assets/Mau-1-8-giay-gioi-thieu.docx",
        "description": "Giấy giới thiệu: Giới thiệu cán bộ, nhân viên đến liên hệ, công tác với đơn vị khác."
    },
    {
        "id": "9",
        "link": "../../../public/assets/Mau-1-9-bien-ban.docx",
        "description": "Biên bản: Ghi lại nội dung của cuộc họp, sự việc, thỏa thuận hoặc vi phạm có giá trị làm bằng chứng."
    },
    {
        "id": "10",
        "link": "../../../public/assets/Mau-1-10-giay-nghi-phep.docx",
        "description": "Giấy nghỉ phép: Được dùng để xin phép nghỉ làm chính thức, có xác nhận của tổ chức hoặc cơ quan."
    }
]

def get_template_by_id(template_id: str) -> Dict:
    """Get template by ID"""
    for template in DOCUMENT_TEMPLATES:
        if template["id"] == template_id:
            return template
    return None

def get_all_templates() -> List[Dict]:
    """Get all templates"""
    return DOCUMENT_TEMPLATES 