import os
from openai import OpenAI  # type:ignore
import chromadb  # type:ignore
from dotenv import load_dotenv  # type:ignore

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

chroma_client = chromadb.PersistentClient(path="./db")
collection = chroma_client.get_or_create_collection(name="iit_docs")

def get_answer(question: str, conversation: list, top_k: int = 3):
    # print(conversation)
    query_embedding = client.embeddings.create(
        model="text-embedding-3-small",
        input=question
    ).data[0].embedding

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas"]
    )

    docs = results["documents"][0]
    metas = results["metadatas"][0]

    if not docs:
        return "No relevant info found.", set()

    context = ""
    pages = set()
    for doc, meta in zip(docs, metas):
        page = meta["page"]
        source = meta["pdf_name"]
        pages.add(f"{source} | Page {page}")
        context += f"[{source} | Page {page}]\n{doc.strip()}\n\n"

    # if conversation is None:
    #     conversation = []

    messages = [
        {
            "role": "system",
            "content": (
                "You are an academic assistant. Use only the provided context to answer the user's question, don't leave important detail behind and don't change the exact words or meaning of the context. "
                "Cite the PDF name and page numbers in your answer where you found the information. "
                "Extract all relevant information. Cite each point in format: (PDF: <pdf_name>, Page: <page_number>)."
                "Try building an answer if the context is not enough, but do not make up information."
                "If the answer is not found, say 'Not found in the provided context.'"
            )
        },
        # *conversation,
        {
            "role": "user",
            "content": f"Context:\n{context}\n\nQuestion: {question}"
        }
    ]

    completion = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=messages
    )

    return completion.choices[0].message.content.strip(), pages
