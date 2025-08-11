from fastapi import FastAPI, Request, File, UploadFile #type: ignore
from pydantic import BaseModel #type: ignore
from app.query import get_answer
from fastapi.middleware.cors import CORSMiddleware #type: ignore
import os
import fitz #type: ignore
import re
import chromadb #type: ignore
from openai import OpenAI #type: ignore
from dotenv import load_dotenv #type: ignore
import tiktoken #type: ignore
import nltk #type: ignore

# Load NLTK punkt tokenizer
nltk.download('punkt')

# Init token encoder
enc = tiktoken.encoding_for_model("text-embedding-3-large")

# Load API key
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
assert OPENAI_API_KEY, "Missing OPENAI_API_KEY in .env"

client = OpenAI(api_key=OPENAI_API_KEY)
chroma_client = chromadb.PersistentClient(path="./db1") # change this to "./db" in production
collection = chroma_client.get_or_create_collection(name="iit_docs")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify domains like ["http://localhost:3000"]
    # allow_origins=["http://localhost:3000","https://iit-roorkee-bot.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    question: str
    conversation: list

def num_tokens(text):
    return len(enc.encode(text))

def split_into_chunks(text, max_tokens=800, overlap=100):
    words = text.split()
    chunks = []
    current_chunk = []
    for word in words:
        test_chunk = current_chunk + [word]
        test_text = ' '.join(test_chunk)
        if num_tokens(test_text) <= max_tokens:
            current_chunk = test_chunk
        else:
            if current_chunk:
                chunks.append(' '.join(current_chunk))
            current_chunk = current_chunk[-overlap:] if overlap > 0 else []
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    return chunks

@app.post("/ask")
async def ask_question(req: QueryRequest):
    response, pages = get_answer(req.question, req.conversation)
    return {
        "answer": response,
        "pages": sorted(pages)
    }

@app.post("/add")
async def add_pdf(file: UploadFile = File(...)):
    # Save temp file
    temp_path = f"./temp_{file.filename}"
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    # Process PDF
    pdf_name = os.path.splitext(file.filename)[0]
    doc = fitz.open(temp_path)
    for i in range(len(doc)):
        page_num = i + 1
        raw_text = doc[i].get_text().strip()
        if not raw_text:
            continue
        clean_text = re.sub(r'\s+', ' ', raw_text)
        chunks = split_into_chunks(clean_text)

        for idx, chunk in enumerate(chunks):
            try:
                embedding = client.embeddings.create(
                    model="text-embedding-3-large",
                    input=chunk
                ).data[0].embedding

                chunk_id = f"{pdf_name}_page_{page_num}_chunk_{idx}"
                collection.add(
                    documents=[chunk],
                    embeddings=[embedding],
                    ids=[chunk_id],
                    metadatas=[{
                        "page": page_num,
                        "pdf_name": pdf_name,
                        "chunk_index": idx
                    }]
                )
            except Exception as e:
                return {"error": f"Failed embedding on {chunk_id}: {e}"}

    os.remove(temp_path)  # cleanup temp file
    return {"status": "success", "pages_processed": len(doc)}
