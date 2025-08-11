import os
from openai import OpenAI  # type:ignore
import chromadb  # type:ignore
from dotenv import load_dotenv  # type:ignore
import json

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

chroma_client = chromadb.PersistentClient(path="./db1")
collection = chroma_client.get_or_create_collection(name="iit_docs")

def get_answer(question: str, conversation: list, top_k: int = 20):
    if conversation is None:
        conversation = []
        
    initialCompletion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a query builder that takes the user's current question and the conversation history, "
                    "and returns a complete, standalone search query that includes all necessary context, even if it was mentioned earlier.\n\n"
                    "The constructed query must be in the form of a full question — such as starting with what, why, how, when, where, etc. "
                    "It should never be a phrase, keyword, or document heading. Avoid vague or incomplete queries.\n\n"
                    "If the user's intent is casual conversation (e.g., hi, hello, how are you), return:\n"
                    '{\n  "query_type": "small talk",\n  "query": "<user\'s casual message>"\n}\n\n'
                    "If the user is asking a question requiring document lookup, return:\n"
                    '{\n  "query_type": "question",\n  "query": "<fully constructed, grammatically correct question>"\n}\n\n'
                    "Respond only with the JSON object. Do not include any greeting, explanation, or markdown formatting."
                )
            },
            {
                "role": "user",
                "content": f"Conversation history:\n{conversation}"
            },
            {
                "role": "user",
                "content": f"User's question:\n{question}"
            }
        ]
    )
    query_json_str = initialCompletion.choices[0].message.content.strip()
    query = json.loads(query_json_str)
    # print(query)
    # print(f"new query constructed")
    
    if(query['query_type']=="question"):
        # print(conversation)
        query_embedding = client.embeddings.create(
            model="text-embedding-3-large", # to improve the accuracy, the database is not embedded with "text-embedding-3-large" model so using same for the search (works so well :)
            input=query['query']
        ).data[0].embedding
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=["documents", "metadatas"]
        )
        docs = results["documents"][0]
        # Here all the pages are retained but can be net picked based on individual score to reduce the context size
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
        # print("context formed from documents")
    elif(query['query_type']=="small talk"):
        context = "This is a casual conversation, no documents needed."
        pages = set()
        query=question

    # print(context)
    # print(query)
    messages = [
        {
            "role": "system",
            "content": (
                "You are an academic assistant Varuna. Answer the user's question using only the provided context whenever possible. "
                "Do not omit important details and do not alter the wording or meaning of the context. "
                "Cite the PDF name and page number for every fact you include using this format: (PDF: <pdf_name>, Page: <page_number>).\n\n"
                "Extract and include all relevant information from the context. If the context is insufficient, try to infer a helpful answer based on it. "
                "If inference is not possible, respond with: 'Couldn’t find that in the provided materials, but here’s what I can tell you…' and provide your best answer using general knowledge. "
                "Never fabricate or make up facts. Make it clear when you're using general knowledge vs the provided materials.\n\n"
                "If the user's message appears to be casual or conversational (e.g., greetings, opinions, non-academic chat), feel free to reply informally and helpfully, as a friendly assistant."
            )
        },
        # ... === *
        {
            "role": "user",
            "content": f"Context:\n{context}\n\nQuestion: {query}"
        }
    ]
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages
    )
    # print("answer generated")
    return completion.choices[0].message.content.strip(), pages