from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain.chains import RetrievalQA
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from pinecone import Pinecone, ServerlessSpec
import time

# === Config ===
PINECONE_API_KEY = "pcsk_2q7gcL_huo4nZZLwmBkcdvfyhBGCJ6WfQ5CpAitHnPDnTpJ9Pw2Z2YKq8VvkQemMsKLRH"
INDEX_NAME = "webrag"
GOOGLE_API_KEY = "AIzaSyDKJl35hbvRXRMD-StMU9SjHmRpG5PcjZ0"

app = Flask(__name__)
CORS(app)

# Initialize components
pc = Pinecone(api_key=PINECONE_API_KEY)
embedding = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=GOOGLE_API_KEY, temperature=0.3)

# Custom prompt
prompt_template = """Answer questions about Sachin Ved Gupta based on the context. Always be helpful and provide the best response possible, even if making reasonable inferences.

Context: {context}
Question: {question}
Answer:"""

PROMPT = PromptTemplate(template=prompt_template, input_variables=["context", "question"])

def get_vectorstore():
    """Get or create vectorstore"""
    if INDEX_NAME not in pc.list_indexes().names():
        pc.create_index(name=INDEX_NAME, dimension=384, metric="cosine", 
                       spec=ServerlessSpec(cloud="aws", region="us-east-1"))
        time.sleep(10)
    
    return PineconeVectorStore(index=pc.Index(INDEX_NAME), embedding=embedding, text_key="text")

def get_qa_chain():
    """Get QA chain"""
    vectorstore = get_vectorstore()
    return RetrievalQA.from_chain_type(
        llm=llm, retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
        return_source_documents=True, chain_type_kwargs={"prompt": PROMPT}
    )

@app.route('/reset_db', methods=['POST'])
def reset_db():
    try:
        # Read data from file
        with open('sachin-info', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split into chunks
        sections = [s.strip() for s in content.split('\n\n') if s.strip() and len(s.strip()) > 50]
        
        # Delete and recreate index
        if INDEX_NAME in pc.list_indexes().names():
            pc.delete_index(INDEX_NAME)
            time.sleep(10)
        
        pc.create_index(name=INDEX_NAME, dimension=384, metric="cosine",
                       spec=ServerlessSpec(cloud="aws", region="us-east-1"))
        time.sleep(15)
        
        # Add data to vectorstore
        vectorstore = get_vectorstore()
        vectorstore.add_texts(sections)
        
        return jsonify({"status": "success", "documents": len(sections)})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/ask', methods=['POST'])
def ask():
    try:
        question = request.json.get('question', '').strip()
        if not question:
            return jsonify({"status": "error", "message": "Question required"}), 400
        
        qa_chain = get_qa_chain()
        result = qa_chain.invoke({"query": question})
        
        return jsonify({
            "status": "success",
            "question": question,
            "answer": result["result"]
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/vector-data', methods=['POST'])
def vector_data():
    try:
        from sklearn.decomposition import PCA
        from sklearn.manifold import TSNE
        import numpy as np
        
        data = request.json
        question = data.get('question', '').strip()
        reduction_method = data.get('reductionMethod', 'PCA')
        
        # Get all vectors from Pinecone
        index = pc.Index(INDEX_NAME)
        query_response = index.query(
            vector=[0] * 384,  # Dummy vector to get all
            top_k=1000,
            include_metadata=True,
            include_values=True
        )
        
        vectors = []
        texts = []
        
        for match in query_response['matches']:
            if 'values' in match:
                vectors.append(match['values'])
                texts.append(match.get('metadata', {}).get('text', 'Unknown'))
        
        if not vectors:
            return jsonify({"status": "error", "message": "No vectors found"}), 400
        
        vectors_array = np.array(vectors)
        
        # Reduce dimensions
        if reduction_method == 'PCA':
            reducer = PCA(n_components=2)
        elif reduction_method == 'TSNE':
            reducer = TSNE(n_components=2, random_state=42, perplexity=min(30, len(vectors)-1))
        else:
            return jsonify({"status": "error", "message": "Invalid reduction method"}), 400
        
        reduced_vectors = reducer.fit_transform(vectors_array)
        
        result = {
            "status": "success",
            "vectors": reduced_vectors.tolist(),
            "texts": texts
        }
        
        # If question provided, add question vector and similar vectors
        if question:
            question_embedding = embedding.embed_query(question)
            question_vector = np.array(question_embedding)
            
            # Reduce question vector using the same reducer
            question_reduced = reducer.transform(question_vector.reshape(1, -1))[0]
            
            # Get similar vectors
            similar_response = index.query(
                vector=question_vector.tolist(),
                top_k=5,
                include_metadata=True,
                include_values=True
            )
            
            similar_vectors = []
            similar_texts = []
            
            for match in similar_response['matches']:
                if 'values' in match:
                    similar_vectors.append(match['values'])
                    similar_texts.append(match.get('metadata', {}).get('text', 'Unknown'))
            
            if similar_vectors:
                similar_vectors_array = np.array(similar_vectors)
                similar_reduced = reducer.transform(similar_vectors_array)
                
                # Calculate similarity scores for the similar vectors
                similarity_scores = []
                for i, similar_vector in enumerate(similar_vectors):
                    # Cosine similarity
                    similarity = np.dot(question_vector, similar_vector) / (np.linalg.norm(question_vector) * np.linalg.norm(similar_vector))
                    similarity_scores.append(float(similarity))
                
                result.update({
                    "question": question,
                    "questionVector": question_reduced.tolist(),
                    "similarVectors": similar_reduced.tolist(),
                    "similarTexts": similar_texts,
                    "similarityScores": similarity_scores
                })
        
        return jsonify(result)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting RAG API on http://localhost:5000")
    app.run(debug=True, port=5000)