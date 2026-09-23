# Portfolio Chat Frontend

A modern portfolio by Sachin, featuring a 3D Avatar, AI Persona/Chatbot, and Portfolio Overview

## About

Backend/AI
- RAG Chatbot: Hugging Face model for embeddings of provided information/text, vector store in a Pinecone DB instance
- Using Langchain with the Google Gemini LLM to create/orchestrate the AI RAG system and natural AI persona conversation
- Multi-modal support for text, bold titles, links, images, files, etc...
- Deployed as a Flask app using Koyeb

Frontend
- NextJS with React (TSX version)
- Deployed with Vercel at sachinvedgupta.com
- ThreeJS for an avatar of me
- Using Plotly to visualize the embeddings in a lower dimension (reduced to 2D via PCA)
- Clean and simple UI
- AI chatbot module
- Portfolio viewing section with experience, leadership, projects, etc


## Highlights

- **Features**: AI RAG chatbot, 3D avatar, modern responsive design  
- **Technologies**: Next.js (TypeScript), React, Flask, Hugging Face Transformers, LangChain, Google Gemini LLM, Pinecone, Retrieval-Augmented Generation (RAG), Three.js, Plotly, PCA (Principal Component Analysis), Vercel, Koyeb, HTML, CSS, Tailwind CSS, JavaScript, REST APIs, cloud deployment, UI/UX design  
- Designed and developed a modern personal portfolio website integrating a 3D avatar and interactive AI persona for dynamic user engagement  
- Built a Retrieval-Augmented Generation (RAG) chatbot using Hugging Face embeddings, Pinecone vector database, and LangChain orchestration with Google Gemini LLM  
- Added multi-modal compatibility, allowing the chatbot to dynamically output text, bold titles, links, images, and files directly in the interface  
- Implemented vector visualization using Plotly with PCA dimensionality reduction to display embeddings in 2D  
- Developed the frontend in Next.js (TypeScript) with a clean, responsive UI, deploying seamlessly to Vercel  
- Created a custom Three.js 3D avatar for interactive presentation of personal brand  
- Engineered and deployed the Flask backend to Koyeb for scalable AI inference and data retrieval  




## Features

- 🎨 Modern, clean UI with dark mode support
- 💬 Real-time chat with AI about portfolio and experience
- 🔍 **Live vector space visualization** showing embeddings and similarity search
- 🌐 **Interactive 3D visualization** with Three.js for immersive exploration
- 📱 Responsive design that works on all devices
- ⚡ Fast and lightweight
- 🔄 Auto-scroll to latest messages
- ⌨️ Enter key to send messages

## Portfolio assistant

The adaptive portfolio assistant is part of the full site at
`/rag-v2-comprehensive`; `/rag-v2` provides a standalone view. It can search
across projects and experience, share public links, and show the matching
details on an interactive map. The map layers can be toggled independently.
The assistant uses the separate `PINECONE_V2_INDEX_NAME`; the original RAG
backend, routes, UI, and Pinecone index remain available.

See [`ai/v2/README.md`](ai/v2/README.md) for the data flow and local commands.

## Prerequisites

Make sure you have the following installed:

- Node.js (version 18 or higher)
- Your Flask backend running on `http://localhost:5000`

## Setup Instructions

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start your Flask backend first:**

   ```bash
   cd ai
   python rag.py
   ```

3. **Start the frontend development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

5. **Test everything is working:**

   ```bash
   python test_frontend.py
   ```

## Backend Requirements

Make sure your Flask backend is running with the following endpoints:

- `POST /ask` - Accepts `{"question": "your question"}` and returns `{"status": "success", "answer": "response"}`
- `POST /reset_db` - Resets the database (optional)

## Project Structure

```
├── app/
│   ├── components/
│   │   ├── ChatInterface.tsx    # Main chat component
│   │   ├── Message.tsx          # Individual message display
│   │   └── InputBox.tsx         # Message input component
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main page
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Usage

1. Start your Flask backend first:

   ```bash
   cd ai
   python rag.py
   ```

2. Start the frontend:

   ```bash
   npm run dev
   ```

3. Open `http://localhost:3000` in your browser

4. **Chat and Visualize**:

   - Type questions in the chat interface
   - Watch the vector space visualization update in real-time
   - See your question vector (red star) and similar vectors (orange circles)
   - Observe the search area circle around your question
   - **Interactive 3D visualization** with mouse controls (rotate, zoom, pan)
   - Compare 2D and 3D representations side by side

5. Try questions like:
   - "What are your skills?"
   - "Tell me about your experience"
   - "What projects have you worked on?"

## Customization

- **Colors**: Modify the Tailwind classes in the components
- **Styling**: Edit `app/globals.css` for custom styles
- **API Endpoint**: Change the fetch URL in `ChatInterface.tsx` if your backend runs on a different port

## Technologies Used

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Hooks** - State management

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
