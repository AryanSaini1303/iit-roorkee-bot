# Below given import is for when the file storage is shifted to AWS S3.
# import boto3 #type: ignore

from fastapi import FastAPI, Request, File, UploadFile, Request, HTTPException, Header, Query #type: ignore
from datetime import datetime, timedelta
from pydantic import BaseModel #type: ignore

# Remove below given import when shifting to AWS S3 for file storage.
from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions #type:ignore

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
import requests #type: ignore
from app.query import get_answer

nltk.download('punkt')

enc = tiktoken.encoding_for_model("text-embedding-3-large")

# Below given definition is for when the file storage is shifted to AWS S3.
# s3_client = boto3.client("s3", region_name=os.getenv("AWS_REGION", "ap-south-1"))
# S3_BUCKET = os.getenv("S3_BUCKET")

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
assert OPENAI_API_KEY, "Missing OPENAI_API_KEY in .env"

# Remove below given definition when shifting to AWS S3 for file storage.
AZURE_STORAGE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")

CONTAINER_NAME = "pdfs"
CONTAINER_NAME_IMAGES='images'

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

VERIFY_TOKEN = os.getenv("VERIFY_TOKEN")
ACCESS_TOKEN = os.getenv("ACCESS_TOKEN")
PHONE_NUMBER_ID = os.getenv("PHONE_NUMBER_ID")

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

def extract_message(data):
    try:
        msg = data["entry"][0]["changes"][0]["value"]["messages"][0]
        phone = msg["from"]
        text = msg["text"]["body"]
        return phone, text
    except:
        return None, None

def send_whatsapp_message(to, message):
    url = f"https://graph.facebook.com/v22.0/{PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": message[:4000]}  # WhatsApp limit
    }
    try:
        response = requests.post(url, headers=headers, json=payload)
        print("WhatsApp API Status:", response.status_code)
        print("WhatsApp API Response:", response.text)
        if response.status_code != 200:
            print("Failed to send WhatsApp message")
    except Exception as e:
        print("Error sending WhatsApp message:", str(e))
        
def extract_message(data):
    try:
        msg = data["entry"][0]["changes"][0]["value"]["messages"][0]
        phone = msg["from"]
        if msg["type"] == "text":
            text = msg["text"]["body"]
            return phone, text, None
        elif msg["type"] == "audio":
            media_id = msg["audio"]["id"]
            return phone, None, media_id
        return phone, None, None
    except:
        return None, None, None
    
def download_whatsapp_audio(media_id):
    url = f"https://graph.facebook.com/v22.0/{media_id}"
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    res = requests.get(url, headers=headers)
    media_url = res.json()["url"]
    audio_res = requests.get(media_url, headers=headers)
    file_path = f"audio_{media_id}.ogg"
    with open(file_path, "wb") as f:
        f.write(audio_res.content)
    return file_path

def speech_to_text(file_path):
    with open(file_path, "rb") as audio_file:
        transcript = client.audio.transcriptions.create(
            model="gpt-4o-mini-transcribe",
            file=audio_file
        )
    return transcript.text

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
        # print(f"Origin Header: {x_origin}")
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
    collection = DOCS_MAP[x_origin]
    all_items = collection.get(include=["metadatas"])
    unique_pdfs = set()
    for meta in all_items["metadatas"]:
        if meta and "pdf_name" in meta:
            unique_pdfs.add(meta["pdf_name"])
    blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
    result = []
    for pdf_name in unique_pdfs:
        sas_token = generate_blob_sas(
            account_name=blob_service_client.account_name,
            container_name=CONTAINER_NAME,
            blob_name=f"{pdf_name}.pdf",
            account_key=blob_service_client.credential.account_key,
            permission=BlobSasPermissions(read=True),
            expiry=datetime.utcnow() + timedelta(hours=1)
        )
        view_url = f"https://{blob_service_client.account_name}.blob.core.windows.net/{CONTAINER_NAME}/{pdf_name}.pdf?{sas_token}"
        result.append({"name": pdf_name, "viewUrl": view_url})
    return {"pdfs": result}

@app.get("/getUploadSas")
def get_upload_sas(filename: str):
    blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
    sas_token = generate_blob_sas(
        account_name=blob_service_client.account_name,
        container_name=CONTAINER_NAME,
        blob_name=filename,
        account_key=blob_service_client.credential.account_key,
        permission=BlobSasPermissions(write=True, create=True),
        expiry=datetime.utcnow() + timedelta(minutes=5)  # short-lived
    )
    blob_url = f"https://{blob_service_client.account_name}.blob.core.windows.net/{CONTAINER_NAME}/{filename}?{sas_token}"
    return {"uploadUrl": blob_url}

@app.get("/generate-upload-url")
def generate_upload_url(filename: str):
    blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
    sas_token = generate_blob_sas(
        account_name=blob_service_client.account_name,
        container_name=CONTAINER_NAME_IMAGES,
        blob_name=filename,
        account_key=blob_service_client.credential.account_key,
        permission=BlobSasPermissions(write=True, create=True),
        expiry=datetime.utcnow() + timedelta(minutes=10)
    )
    blob_url = f"https://{blob_service_client.account_name}.blob.core.windows.net/{CONTAINER_NAME_IMAGES}/{filename}?{sas_token}"
    return {"uploadUrl": blob_url}

@app.get("/getViewUrl")
def get_view_url(filename: str):
    blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
    sas_token = generate_blob_sas(
        account_name=blob_service_client.account_name,
        container_name=CONTAINER_NAME,
        blob_name=filename,
        account_key=blob_service_client.credential.account_key,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.utcnow() + timedelta(hours=1)
    )
    blob_url = f"https://{blob_service_client.account_name}.blob.core.windows.net/{CONTAINER_NAME}/{filename}?{sas_token}"
    return {"viewUrl": blob_url}

@app.delete("/delete-pdf")
def delete_pdf(pdf_name: str, x_origin: str = Header(None)):
    if x_origin not in DOCS_MAP:
        raise HTTPException(status_code=400, detail="Invalid origin")
    blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
    blob_client = blob_service_client.get_blob_client(container=CONTAINER_NAME, blob=f"{pdf_name}.pdf")
    try:
        blob_client.delete_blob()
    except Exception as e:
        print(f"Azure delete warning: {e}")  # don't block vector cleanup on this
    for collection in (DOCS_MAP[x_origin], META_MAP[x_origin]):
        items = collection.get(include=["metadatas"])
        ids_to_delete = [
            id_ for id_, meta in zip(items["ids"], items["metadatas"])
            if meta and meta.get("pdf_name") == pdf_name
        ]
        if ids_to_delete:
            collection.delete(ids=ids_to_delete)
    return {"status": "deleted", "pdf_name": pdf_name}

# Below given route is for when the filesystem is shifted to AWS S3.
# @app.get("/getUploadSas")
# def get_upload_sas(filename: str):
#     key = f"pdfs/{filename}"
#     upload_url = s3_client.generate_presigned_url(
#         "put_object",
#         Params={"Bucket": S3_BUCKET, "Key": key},
#         ExpiresIn=300  # 5 minutes, matches your original
#     )
#     return {"uploadUrl": upload_url}

# Below given route is for when the filesystem is shifted to AWS S3.
# @app.get("/generate-upload-url")
# def generate_upload_url(filename: str):
#     key = f"images/{filename}"
#     upload_url = s3_client.generate_presigned_url(
#         "put_object",
#         Params={"Bucket": S3_BUCKET, "Key": key},
#         ExpiresIn=600  # 10 minutes, matches your original
#     )
#     return {"uploadUrl": upload_url}

@app.get("/whatsapp/webhook")
async def verify_webhook(request: Request):
    params = request.query_params
    if params.get("hub.verify_token") == VERIFY_TOKEN:
        return int(params.get("hub.challenge"))
    return "Verification failed"

import os

@app.post("/whatsapp/webhook")
async def whatsapp_webhook(request: Request):
    data = await request.json()
    phone, text_message, media_id = extract_message(data)
    if not phone:
        return {"status": "no message"}
    if media_id:
        print("Audio message received")
        file_path = download_whatsapp_audio(media_id)
        text_message = speech_to_text(file_path)
        print("Transcribed text:", text_message)
        try:
            os.remove(file_path)
            print("Audio file deleted")
        except Exception as e:
            print("Error deleting audio file:", e)
    conversation = []
    response, pages, category, context_json = get_answer(
        text_message,
        conversation,
        "DSA"
    )
    ai_reply = response
    send_whatsapp_message(phone, ai_reply)
    return {"status": "ok"}