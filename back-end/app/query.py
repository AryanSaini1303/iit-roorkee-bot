import os
from openai import OpenAI  # type:ignore
import chromadb  # type:ignore
from dotenv import load_dotenv  # type:ignore
import json
from datetime import date
# import requests

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

chroma_client = chromadb.PersistentClient(path="./pilotDB")
collection = chroma_client.get_or_create_collection(name="iit_docs")

def get_answer(question: str, conversation: list, top_k: int = 20):
    if conversation is None:
        conversation = []

    initialCompletion = client.chat.completions.create(
        model="gpt-4o-mini",  # cheaper + faster than gpt-4.1, perfect for rewriting
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a query reformulator and classifier for an academic assistant. "
                    "Your job is twofold:\n"
                    "1. Rewrite the user's latest question into a precise, standalone academic query (if applicable).\n"
                    "2. Classify the user's query into one of 5 categories.\n\n"

                    f"If the user’s question includes words like 'latest', 'current', 'recent', or 'upcoming', include the current date ({date.today()}) in the reformulated query.\n\n"

                    "### Rules for Reformulation:\n"
                    "- Always include all necessary context from history in the rewritten query.\n"
                    "- The query must be **a complete, grammatically correct academic question** "
                    "(starting with what, why, how, when, where, etc.).\n"
                    "- Keep the query concise but detailed enough for accurate search.\n"
                    "- Remove filler words, greetings, or irrelevant chatter.\n"
                    "- Never output vague phrases, keywords, or incomplete fragments.\n\n"

                    "### Categories:\n"
                    "- **Casual**: Greetings or small talk (hi, hello, how are you, thanks, etc.).\n"
                    "- **Document-Specific**: The question targets content that clearly belongs to a single PDF only. Example: \"What does the Dam Safety Act 2021 say about penalties?\").\n"
                    "- **Cross-Document**: The question requires looking at multiple PDFs, or aggregating/comparing info across them. Example: \"List all notifications from 2024\", \"Compare the March and May Gazette notifications.\"\n"
                    "- **Contextual**: Questions that rely on conversation history or follow-ups (e.g., 'Explain that in more detail', 'What about the penalties?').\n"
                    "- **Meta**: Questions about the knowledge base itself (e.g., 'Which PDFs do you have?', 'How many pages are there?').\n\n"

                    "### Output format:\n"
                    "- If the user is making casual conversation, return:\n"
                    "{\n  \"query_type\": \"small talk\",\n  \"query\": \"<user's casual message>\",\n  \"category\": \"Casual\"\n}\n\n"

                    "- If the user is asking something that requires documents, return:\n"
                    "{\n  \"query_type\": \"question\",\n  \"query\": \"<fully constructed standalone question>\",\n  \"category\": \"<one of: Casual, Document-Specific, Cross-Document, Contextual, Meta>\"\n}\n\n"

                    "Respond only with a valid JSON object — no explanation, no extra text."
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
        ],
        temperature=0.2
    )

    query_json_str = initialCompletion.choices[0].message.content.strip()
    query = json.loads(query_json_str)
    print(query)
    # print(f"new query constructed")
    
    # Storing the pdfs that are used in the database to a set
    unique_docs = set()
    all_items = collection.get(include=["metadatas"])
    for meta in all_items['metadatas']:
        fname = meta.get("pdf_name")
        if fname:
            unique_docs.add(fname)
            
    if(query['query_type']=="question"):
        # print(conversation)
        query_embedding = client.embeddings.create(
            model="text-embedding-3-large", # to improve the accuracy, the database is now embedded with "text-embedding-3-large" model so using same for the search (works so well :)
            input=query['query']
        ).data[0].embedding
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )
        docs = results["documents"][0]
        metas = results["metadatas"][0]
        distances = results["distances"][0]
        scored_results = [
            {
                "document": doc.strip(),
                "metadata": meta,
                "distance": dist,
                "score": 1 - dist  # closer distance → higher score
            }
            for doc, meta, dist in zip(docs, metas, distances)
        ]
        filtered = sorted(scored_results, key=lambda x: x["score"], reverse=True)

        if not filtered:
            return "No relevant info found.", set(), []

        # Build context string + structured JSON
        context = ""
        context_json = []
        pages = []
        seen = set()

        for item in filtered:
            source = item["metadata"]["pdf_name"]
            page = item["metadata"]["page"]
            page_key = f"{source} | Page {page}"

            if page_key not in seen:
                seen.add(page_key)
                pages.append(page_key)

            context += f"[{page_key}] (score={item['score']:.2f})\n{item['document']}\n\n"
            context_json.append({
                "pdf_name": source,
                "page_num": page,
                "content": item["document"],
                "score": item["score"]
            })

        # print("context formed from documents")
    elif(query['query_type']=="small talk"):
        context = "This is a casual conversation, no documents needed."
        pages = set()
        context_json=[]

    # print(context)
    # print(query)
    # print(unique_docs)
    messages = [
        {
            "role": "system",
            "content": (
                "You are an academic assistant Varuna. Answer the user's question using only the provided context whenever possible. "
                f"You have your knowledge base from the following PDFs: \n\n {unique_docs}\n\n"
                "Do not omit important details and do not alter the wording or meaning of the context. "
                "Answer casual greetings and general conversation, but any questions outside of academic or dam-related context should be ignored. "
                "Explicitly avoid non-academic, abusive, or sexual topics.\n\n"
                "Cite the PDF name and page number for every fact you include using this format: (PDF: <pdf_name>, Page: <page_number>).\n"
                "Extract and include all relevant information from the context. "
                "If the context is insufficient, respond with: 'Couldn’t find that in the provided materials.' "
                "Never fabricate or make up facts. Make it clear when you're using general knowledge vs the provided materials.\n\n"
                "Additionally, you may answer questions about your knowledge base itself (e.g., listing the PDFs you have, the number of pages, etc.) "
                "even if this information is not in the user-provided context. For other meta-questions, only respond using known facts.\n\n"
                "If the user's message is casual or conversational (e.g., greetings, opinions, non-academic chat), reply informally and helpfully."
                "Avoid making tables in your responses."
            )
        },
        {"role": "user", "content": f"Here is the academic context from your knowledge base:\n\n{context}"},
        {
            "role": "user",
            "content": f"Question: {query['query']}"
        }
    ]
    completion = client.chat.completions.create(
        model="gpt-4.1",
        messages=messages,
        temperature=0.2
    )
    # print("answer generated")
    return completion.choices[0].message.content.strip(), pages, query['category'], context_json
    
    # system_message = (
    #     "You are an academic assistant Varuna. Answer the user's question using only the provided context whenever possible. "                "Do not omit important details and do not alter the wording or meaning of the context. "
    #     "Cite the PDF name and page number for every fact you include using this format: (PDF: <pdf_name>, Page: <page_number>).\n\n"
    #     "Extract and include all relevant information from the context. If the context is insufficient, try to infer a helpful answer based on it. "
    #     "If inference is not possible, respond with: 'Couldn’t find that in the provided materials, but here’s what I can tell you…' and provide your best answer using general knowledge. "
    #     "Never fabricate or make up facts. Make it clear when you're using general knowledge vs the provided materials.\n\n"
    #     "If the user's message appears to be casual or conversational (e.g., greetings, opinions, non-academic chat), feel free to reply informally and helpfully, as a friendly assistant."
    # )
    # user_message = f"Context:\n{context}\n\nQuestion: {query}"
    # prompt = f"System: {system_message}\n\nUser: {user_message}\n\nAssistant:"
    # # print(prompt)
    # res = requests.post(
    #     "http://localhost:11434/api/generate",
    #     json={
    #         "model": "llama3.1:8b",
    #         "prompt": prompt,
    #         "stream": False
    #     },
    #     timeout=500
    # )
    # print(res.json()["response"])
    # return res.json()["response"], pages