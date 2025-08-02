# 🔍 RAG Vector Space Visualization

A comprehensive visualization system for your RAG (Retrieval-Augmented Generation) database that shows vector embeddings, similarity search, and the knowledge space in an interactive 2D visualization.

## 🎯 Features

### **Interactive Vector Space Visualization**

- **2D Scatter Plot**: All vectors from your portfolio database
- **Question Vector**: Red star showing where your question lands in the space
- **Similar Vectors**: Orange circles showing the most similar content
- **Connection Lines**: Dashed lines showing similarity relationships
- **Hover Information**: Detailed text previews on hover

### **Dimensionality Reduction**

- **PCA (Principal Component Analysis)**: Fast, linear reduction
- **TSNE (t-Distributed Stochastic Neighbor Embedding)**: Better preservation of local structure
- **Real-time Switching**: Change reduction method on the fly

### **Comprehensive Analysis**

- **Vector Distribution**: Histogram showing vector density
- **Similarity Scores**: Bar chart of top similar texts
- **Statistics**: Total vectors, dimensions, reduction info
- **Sample Texts**: Preview of actual content in database

## 🚀 Quick Start

### **1. Install Dependencies**

For the Streamlit version:

```bash
cd ai
pip install -r requirements_visualizer.txt
```

For the Next.js version:

```bash
npm install react-plotly.js plotly.js
```

### **2. Start Your Backend**

```bash
cd ai
python rag.py
```

### **3. Run Visualization**

**Option A: Streamlit (Standalone)**

```bash
cd ai
streamlit run vector_visualizer.py
```

**Option B: Next.js (Integrated)**

```bash
npm run dev
# Then visit http://localhost:3000/visualize
```

## 📊 What You'll See

### **Vector Space Overview**

- **Blue dots**: All vectors from your portfolio database
- **Vector clustering**: Similar content appears closer together
- **Density patterns**: Shows knowledge distribution

### **Question Similarity Search**

- **Red star**: Your input question vector
- **Orange circles**: Top 5 most similar vectors
- **Dashed lines**: Visual connections showing relationships
- **Distance-based**: Closer = more similar content

### **Interactive Features**

- **Zoom & Pan**: Explore different regions
- **Hover Details**: See actual text content
- **Method Switching**: PCA vs TSNE comparison
- **Real-time Updates**: Instant visualization changes

## 🧠 How It Works

### **1. Embedding Process**

```
Text → HuggingFace Embeddings → 384D Vectors → Pinecone Storage
```

### **2. Dimensionality Reduction**

```
384D Vectors → PCA/TSNE → 2D Visualization
```

### **3. Similarity Search**

```
Question → Embedding → Vector Search → Top-K Results
```

### **4. Visualization**

```
2D Coordinates → Plotly Scatter Plot → Interactive Display
```

## 🛠️ Technical Implementation

### **Backend API Endpoints**

**`POST /vector-data`**

```json
{
  "question": "What are your skills?",
  "reductionMethod": "PCA"
}
```

**Response:**

```json
{
  "status": "success",
  "vectors": [[x1, y1], [x2, y2], ...],
  "texts": ["text1", "text2", ...],
  "question": "What are your skills?",
  "questionVector": [x, y],
  "similarVectors": [[x1, y1], [x2, y2], ...],
  "similarTexts": ["similar1", "similar2", ...]
}
```

### **Frontend Components**

**VectorVisualizer.tsx**

- Interactive Plotly charts
- Real-time data fetching
- Responsive design
- Dark mode support

**API Route**

- Next.js API route for data fetching
- Error handling
- CORS support

## 📈 Use Cases

### **Portfolio Analysis**

- **Content Distribution**: See how your skills are distributed
- **Gap Analysis**: Identify missing areas in your portfolio
- **Similarity Patterns**: Understand content relationships

### **RAG Debugging**

- **Search Quality**: Visualize how well similarity search works
- **Vector Quality**: Check if embeddings capture meaning
- **Database Coverage**: Ensure comprehensive knowledge coverage

### **Educational Tool**

- **Vector Concepts**: Demonstrate embedding space
- **Similarity Metrics**: Show cosine similarity in action
- **Dimensionality Reduction**: Compare PCA vs TSNE

## 🎨 Customization

### **Styling**

```typescript
// Colors for different vector types
const colors = {
  allVectors: "lightblue",
  questionVector: "red",
  similarVectors: "orange",
  connectionLines: "gray",
};
```

### **Reduction Methods**

```python
# PCA (Faster, linear)
reducer = PCA(n_components=2)

# TSNE (Better structure, slower)
reducer = TSNE(n_components=2, perplexity=30)
```

### **Similarity Metrics**

```python
# Cosine similarity
similarity = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# Euclidean distance
distance = np.linalg.norm(a - b)
```

## 🔧 Troubleshooting

### **Common Issues**

**1. No vectors found**

```bash
# Reset your database
curl -X POST http://localhost:5000/reset_db
```

**2. Visualization not loading**

```bash
# Check backend is running
curl http://localhost:5000/ask -X POST -H "Content-Type: application/json" -d '{"question":"test"}'
```

**3. Plotly not rendering**

```bash
# Install dependencies
npm install react-plotly.js plotly.js
```

### **Performance Tips**

**For Large Datasets:**

- Use PCA instead of TSNE for speed
- Limit vector count in queries
- Implement pagination for large visualizations

**For Better Quality:**

- Use TSNE for better structure preservation
- Increase perplexity for larger datasets
- Add more context to embeddings

## 🚀 Deployment

### **Streamlit Cloud**

```bash
# Deploy to Streamlit Cloud
streamlit deploy vector_visualizer.py
```

### **Vercel (Next.js)**

```bash
# Deploy to Vercel
vercel --prod
```

### **Docker**

```dockerfile
# Dockerfile for visualization
FROM python:3.9
WORKDIR /app
COPY requirements_visualizer.txt .
RUN pip install -r requirements_visualizer.txt
COPY ai/ .
EXPOSE 8501
CMD ["streamlit", "run", "vector_visualizer.py"]
```

## 📚 Learning Resources

- **Vector Embeddings**: [HuggingFace Documentation](https://huggingface.co/docs)
- **Dimensionality Reduction**: [Scikit-learn Guide](https://scikit-learn.org/stable/modules/decomposition.html)
- **Interactive Visualizations**: [Plotly Documentation](https://plotly.com/python/)
- **RAG Systems**: [LangChain Documentation](https://python.langchain.com/)

## 🤝 Contributing

Feel free to enhance the visualization system:

1. **Add new reduction methods** (UMAP, etc.)
2. **Improve interactivity** (3D plots, animations)
3. **Add more metrics** (clustering, outlier detection)
4. **Enhance UI** (better controls, themes)

## 📄 License

This visualization system is part of your portfolio project. Feel free to use and modify as needed for your projects!
