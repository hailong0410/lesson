# retriever.py
import os
import json
import sys
from dotenv import load_dotenv
import numpy as np
import faiss
import openai

# 1) Load API key và index
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    raise ValueError("Missing OPENAI_API_KEY")

# 2) Load FAISS index và metadata
index = faiss.read_index("lesson_index.faiss")
with open("chunks_meta.json", "r", encoding="utf-8") as f:
    chunks = json.load(f)

dim = index.d  # chiều embedding

def get_top_k(query, k=5):
    # 3) Embed câu hỏi
    resp = openai.embeddings.create(
        model="text-embedding-3-small",
        input=query
    )
    qvec = np.array(resp.data[0].embedding, dtype="float32").reshape(1, dim)
    # 4) Search top-k
    D, I = index.search(qvec, k)
    return [chunks[i] for i in I[0]]

if __name__ == "__main__":
    # Chạy thử: python retriever.py "Cách mạng tháng Tám" 5
    if len(sys.argv) < 2:
        print("Usage: python retriever.py <query> [<k>]", file=sys.stderr)
        sys.exit(1)
    query = sys.argv[1]
    k = int(sys.argv[2]) if len(sys.argv) >= 3 else 5
    results = get_top_k(query, k)
    # In ra JSON
    print(json.dumps(results, ensure_ascii=False))
