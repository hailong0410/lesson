import os
import json
from dotenv import load_dotenv
import numpy as np
import faiss
import openai

# 1) Load API key từ .env
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    raise ValueError("Missing OPENAI_API_KEY in environment")

# 2) Đọc chunks.json
with open("chunks.json", "r", encoding="utf-8") as f:
    all_chunks = json.load(f)
texts = [c["text"] for c in all_chunks]

# 3) Tạo embedding cho từng chunk
print(f"Embedding {len(texts)} chunks…")
embeddings = []
for t in texts:
    resp = openai.embeddings.create(
        model="text-embedding-3-small",
        input=t            # bạn có thể cũng truyền list: input=[t]
    )
    embeddings.append(resp.data[0].embedding)

# 4) Build FAISS index
xb = np.array(embeddings, dtype="float32")
dim = xb.shape[1]
index = faiss.IndexFlatL2(dim)
index.add(xb)
faiss.write_index(index, "lesson_index.faiss")
print("✅ FAISS index saved to lesson_index.faiss")

# 5) Lưu metadata
with open("chunks_meta.json", "w", encoding="utf-8") as f:
    json.dump(all_chunks, f, ensure_ascii=False, indent=2)
print("✅ Metadata saved to chunks_meta.json")
