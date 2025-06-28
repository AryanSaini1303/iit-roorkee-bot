from fastapi import FastAPI, Request
from pydantic import BaseModel
from app.query import get_answer  # refactored function
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["*"],  # Or specify domains like ["http://localhost:3000"]
    allow_origins=["http://localhost:3000","https://iit-roorkee-bot.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



class QueryRequest(BaseModel):
    question: str

@app.post("/ask")
async def ask_question(req: QueryRequest):
    response, pages = get_answer(req.question)
    return {
        "answer": response,
        "pages": sorted(pages)
    }
