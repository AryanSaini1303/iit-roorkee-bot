import boto3 #type: ignore
from fastapi import FastAPI, Request, File, UploadFile, Request, HTTPException, Header, BackgroundTasks #type: ignore
from datetime import datetime, timedelta, timezone
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
import requests #type: ignore
from app.query import get_answer
import ocrmypdf #type: ignore
from supabase import create_client, Client  # add to imports #type: ignore

load_dotenv()

nltk.download('punkt')

enc = tiktoken.encoding_for_model("text-embedding-3-large")

s3_client = boto3.client("s3", region_name=os.getenv("AWS_REGION", "ap-south-1"))
S3_BUCKET = os.getenv("S3_BUCKET")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
assert SUPABASE_URL, "Missing SUPABASE_URL in .env"
assert SUPABASE_SERVICE_ROLE_KEY, "Missing SUPABASE_SERVICE_ROLE_KEY in .env"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
WHATSAPP_SESSION_WINDOW_HOURS = 24

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

def needs_ocr(doc, min_chars_per_page=20) -> bool:
    """Heuristic: if the average extractable text per page is near-zero,
    treat this as an image/flattened PDF that needs OCR."""
    total_chars = sum(len(doc[i].get_text().strip()) for i in range(len(doc)))
    avg_chars = total_chars / max(len(doc), 1)
    return avg_chars < min_chars_per_page

def ocr_pdf(input_path: str) -> str:
    """Runs OCR and returns path to a new, text-searchable PDF."""
    output_path = input_path.replace(".pdf", "_ocr.pdf").replace("./temp_", "./temp_ocr_")
    ocrmypdf.ocr(
        input_path,
        output_path,
        language="hin+eng",
        force_ocr=True,
        deskew=True,
        progress_bar=False,
    )
    return output_path

def _synthetic_email(phone: str) -> str:
    return f"{phone}@whatsapp.damchat.internal"

def get_or_create_whatsapp_user(phone: str) -> dict:
    existing = (
        supabase.table("whatsapp_users")
        .select("*")
        .eq("phone_number", phone)
        .execute()
    )
    if existing.data:
        row = existing.data[0]
        return {"user_id": row["user_id"], "email": _synthetic_email(phone)}
    email = _synthetic_email(phone)
    auth_res = supabase.auth.admin.create_user(
        {
            "phone": phone,
            "email": email,
            "email_confirm": True,
            "phone_confirm": True,
            "user_metadata": {"source": "whatsapp"},
        }
    )
    user_id = auth_res.user.id
    supabase.table("whatsapp_users").insert(
        {"phone_number": phone, "user_id": user_id}
    ).execute()
    return {"user_id": user_id, "email": email}

def _make_json_safe(obj):
    """Recursively convert sets (and anything else non-JSON-native) into
    JSON-serializable equivalents. Guards against get_answer or its
    internals returning sets, tuples, etc."""
    if isinstance(obj, set):
        return list(obj)
    if isinstance(obj, tuple):
        return [_make_json_safe(item) for item in obj]
    if isinstance(obj, list):
        return [_make_json_safe(item) for item in obj]
    if isinstance(obj, dict):
        return {k: _make_json_safe(v) for k, v in obj.items()}
    return obj

def get_or_create_whatsapp_conversation(phone: str, user_id: str, email: str) -> dict:
    recent = (
        supabase.table("conversations")
        .select("*")
        .eq("phone_number", phone)
        .eq("source", "whatsapp")
        .order("updated_at", desc=True)
        .limit(1)
        .execute()
    )
    if recent.data:
        row = recent.data[0]
        if row["updated_at"]:
            last_updated = datetime.fromisoformat(row["updated_at"])
            if datetime.now(timezone.utc) - last_updated < timedelta(
                hours=WHATSAPP_SESSION_WINDOW_HOURS
            ):
                return row
    now = datetime.now(timezone.utc).isoformat()
    new_row = (
        supabase.table("conversations")
        .insert(
            {
                "user_id": user_id,
                "email": email,
                "phone_number": phone,
                "source": "whatsapp",
                "messages": [],
                "pdfList": [],
                "contextList": [],
                "name": phone,
                "updated_at": now,
            }
        )
        .execute()
    )
    return new_row.data[0]

def append_whatsapp_turn(
    conversation_id: int,
    user_text: str,
    bot_text: str,
    pages: list,
    context_json: list,
):
    row = (
        supabase.table("conversations")
        .select("messages, pdfList, contextList")
        .eq("id", conversation_id)
        .execute()
        .data[0]
    )
    now = datetime.now(timezone.utc).isoformat()
    messages = row["messages"] or []
    messages.append({"role": "user", "content": user_text, "createdAt": now})
    messages.append({"role": "system", "content": bot_text, "createdAt": now})
    pdf_list = row["pdfList"] or []
    pdf_list.append(_make_json_safe(pages))
    context_list = row["contextList"] or []
    context_list.append(_make_json_safe(context_json))
    supabase.table("conversations").update(
        {
            "messages": messages,
            "pdfList": pdf_list,
            "contextList": context_list,
            "updated_at": now,
        }
    ).eq("id", conversation_id).execute()
    
async def process_whatsapp_message(phone: str, text_message: str):
    user = get_or_create_whatsapp_user(phone)
    conversation = get_or_create_whatsapp_conversation(
        phone, user["user_id"], user["email"]
    )
    history = conversation["messages"] or []

    response, pages, category, context_json = get_answer(text_message, history, "DSA")

    append_whatsapp_turn(conversation["id"], text_message, response, pages, context_json)
    send_whatsapp_message(phone, response)
    
def get_whatsapp_message_id(data: dict) -> str | None:
    try:
        return data["entry"][0]["changes"][0]["value"]["messages"][0]["id"]
    except (KeyError, IndexError, TypeError):
        return None

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
        processed_files = []
        errors = []
        for file in files:
            temp_path = f"./temp_{file.filename}"
            with open(temp_path, "wb") as f:
                f.write(await file.read())
            pdf_name = os.path.splitext(file.filename)[0]
            doc = fitz.open(temp_path)
            ocr_temp_path = None
            if needs_ocr(doc):
                # print(f"{file.filename}: no usable text layer, running OCR...")
                doc.close()
                try:
                    ocr_temp_path = ocr_pdf(temp_path)
                    doc = fitz.open(ocr_temp_path)
                except Exception as e:
                    errors.append({"file": file.filename, "error": f"OCR failed: {e}"})
                    os.remove(temp_path)
                    continue
            for i in range(len(doc)):
                page_num = i + 1
                raw_text = doc[i].get_text().strip()
                # print(f"Processing {file.filename}, page {page_num}: {len(raw_text)} characters")
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
                        collection = DOCS_MAP[x_origin]
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
            doc.close()
            os.remove(temp_path)
            if ocr_temp_path and os.path.exists(ocr_temp_path):
                os.remove(ocr_temp_path)
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
    result = []
    for pdf_name in unique_pdfs:
        key = f"pdfs/{pdf_name}.pdf"
        view_url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": S3_BUCKET, "Key": key},
            ExpiresIn=3600  # 1 hour, matches your original
        )
        result.append({"name": pdf_name, "viewUrl": view_url})
    return {"pdfs": result}


@app.get("/getViewUrl")
def get_view_url(filename: str):
    key = f"pdfs/{filename}"
    view_url = s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": S3_BUCKET, "Key": key},
        ExpiresIn=3600
    )
    return {"viewUrl": view_url}

@app.delete("/delete-pdf")
def delete_pdf(pdf_name: str, x_origin: str = Header(None)):
    if x_origin not in DOCS_MAP:
        raise HTTPException(status_code=400, detail="Invalid origin")
    key = f"pdfs/{pdf_name}.pdf"
    try:
        s3_client.delete_object(Bucket=S3_BUCKET, Key=key)
    except Exception as e:
        print(f"S3 delete warning: {e}")  # don't block vector cleanup on this
    for collection in (DOCS_MAP[x_origin], META_MAP[x_origin]):
        items = collection.get(include=["metadatas"])
        ids_to_delete = [
            id_ for id_, meta in zip(items["ids"], items["metadatas"])
            if meta and meta.get("pdf_name") == pdf_name
        ]
        if ids_to_delete:
            collection.delete(ids=ids_to_delete)
    return {"status": "deleted", "pdf_name": pdf_name}

@app.get("/getUploadSas")
def get_upload_sas(filename: str):
    key = f"pdfs/{filename}"
    upload_url = s3_client.generate_presigned_url(
        "put_object",
        Params={"Bucket": S3_BUCKET, "Key": key},
        ExpiresIn=300  # 5 minutes, matches your original
    )
    return {"uploadUrl": upload_url}

@app.get("/generate-upload-url")
def generate_upload_url(filename: str):
    key = f"images/{filename}"
    upload_url = s3_client.generate_presigned_url(
        "put_object",
        Params={"Bucket": S3_BUCKET, "Key": key},
        ExpiresIn=600  # 10 minutes, matches your original
    )
    return {"uploadUrl": upload_url}

@app.get("/getImageViewUrl")
def get_image_view_url(filename: str):
    key = f"images/{filename}"
    view_url = s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": S3_BUCKET, "Key": key},
        ExpiresIn=3600
    )
    return {"viewUrl": view_url}

@app.get("/whatsapp/webhook")
async def verify_webhook(request: Request):
    params = request.query_params
    if params.get("hub.verify_token") == VERIFY_TOKEN:
        return int(params.get("hub.challenge"))
    return "Verification failed"

@app.post("/whatsapp/webhook")
async def whatsapp_webhook(request: Request, background_tasks: BackgroundTasks):
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

    background_tasks.add_task(process_whatsapp_message, phone, text_message)
    return {"status": "ok"}