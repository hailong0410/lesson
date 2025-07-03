import os
import json
from docx import Document
import nltk

# Tự động tải tokenizer nếu chưa có
nltk.download('punkt', quiet=True)

INPUT_DIR   = "documents"
OUTPUT_FILE = "chunks.json"
CHUNK_SIZE  = 500   # số ký tự tối đa mỗi chunk

def extract_text(path):
    """
    Đọc toàn bộ văn bản từ file .docx
    """
    doc = Document(path)
    paras = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    return "\n".join(paras)

def chunk_text(text, size=CHUNK_SIZE):
    """
    Chia text thành các đoạn ≤size ký tự, tách câu bằng NLTK
    """
    sentences = nltk.tokenize.sent_tokenize(text)
    chunks, cur = [], ""
    for s in sentences:
        if len(cur) + len(s) + 1 <= size:
            cur += s + " "
        else:
            chunks.append(cur.strip())
            cur = s + " "
    if cur:
        chunks.append(cur.strip())
    return chunks

def main():
    all_chunks = []
    # Duyệt qua mọi file .docx trong thư mục INPUT_DIR
    for fname in os.listdir(INPUT_DIR):
        if not fname.lower().endswith('.docx'):
            continue
        path = os.path.join(INPUT_DIR, fname)
        print(f"Processing {fname}…")
        text = extract_text(path)
        for idx, chunk in enumerate(chunk_text(text)):
            all_chunks.append({
                "source":   fname,
                "chunk_id": idx,
                "text":     chunk
            })

    # Ghi kết quả vào OUTPUT_FILE
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_chunks, f, ensure_ascii=False, indent=2)

    print(f"✅ Done: {len(all_chunks)} chunks saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
