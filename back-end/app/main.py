from fastapi import FastAPI, Request, File, UploadFile, Request, HTTPException, Header #type: ignore
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
from typing import List

nltk.download('punkt')

enc = tiktoken.encoding_for_model("text-embedding-3-large")

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
assert OPENAI_API_KEY, "Missing OPENAI_API_KEY in .env"

client = OpenAI(api_key=OPENAI_API_KEY)
chroma_client = chromadb.PersistentClient(path="./CWC_DB")
chroma_client1 = chromadb.PersistentClient(path="./DSA_DB")

DOCS_MAP = {
    "CWC": chroma_client.get_or_create_collection(name="CWC_DOCS"),
    "DSA": chroma_client1.get_or_create_collection(name="DSA_DOCS"),
}

META_MAP = {
    "CWC": chroma_client.get_or_create_collection(name="CWC_METADATA"),
    "DSA": chroma_client1.get_or_create_collection(name="DSA_METADATA"),
}

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["*"],
    allow_origins=["http://localhost:3000","https://iit-roorkee-bot.vercel.app", "https://damchat.in"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

class QueryRequest(BaseModel):
    question: str
    conversation: list
    origin:str

@app.post("/ask")
async def ask_question(req: QueryRequest):
    response, pages, category, context_json = get_answer(req.question, req.conversation, req.origin)
    return {
        "answer": response,
        "pages": pages,
        "category":category,
        "context":context_json
    }

@app.post("/add")
async def add_main_pdfs(files: List[UploadFile] = File(...), x_origin: str = Header(None)):
    try:
        print(f"Origin Header: {x_origin}")
        processed_files = []
        errors = []
        for file in files:
            temp_path = f"./temp_{file.filename}"
            with open(temp_path, "wb") as f:
                f.write(await file.read())
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
                        collection=DOCS_MAP[x_origin]
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
                        errors.append({
                            "file": file.filename,
                            "chunk_id": chunk_id,
                            "error": str(e)
                        })
            os.remove(temp_path)
            print(file.filename)
            processed_files.append(file.filename)
        return {
            "status": "completed",
            "files_processed": processed_files,
            "errors": errors
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
    
@app.post("/add_metadata")
async def add_metadata_pdfs(files: List[UploadFile] = File(...), x_origin: str = Header(None)):
    processed_files = []
    errors = []
    for file in files:
        temp_path = f"./temp_{file.filename}"
        with open(temp_path, "wb") as f:
            f.write(await file.read())
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
                    chunk_id = f"metadata_{pdf_name}_page_{page_num}_chunk_{idx}"
                    collection=META_MAP[x_origin]
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
                    errors.append({
                        "file": file.filename,
                        "chunk_id": chunk_id,
                        "error": str(e)
                    })
        os.remove(temp_path)
        processed_files.append(file.filename)
    return {
        "status": "completed",
        "files_processed": processed_files,
        "errors": errors
    }
    
@app.get("/list-pdfs")
async def list_pdfs(x_origin: str = Header(None)):
    print(f"Origin Header: {x_origin}")
    collection=DOCS_MAP[x_origin]
    all_items=collection.get(include=["metadatas"])
    unique_pdfs=set()
    for meta in all_items["metadatas"]:
        if meta and "pdf_name" in meta:
            unique_pdfs.add(meta["pdf_name"])
    return {"pdfs":list(unique_pdfs)}