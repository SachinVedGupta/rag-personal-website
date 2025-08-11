# Portfolio Chat Frontend

A modern portfolio by Sachin, featuring a 3D Avatar, AI Persona/Chatbot, and Portfolio Overview

## About

Backend/AI
- RAG Chatbot: Hugging Face model for embeddings of provided information/text, vector store in a Pinecone DB instance
- Using Langchain with the Google Gemini LLM to create/orchestrate the AI RAG system and natural AI persona conversation
- Deployed as a Flask app using Koyeb

Frontend
- NextJS with React (TSX version)
- Deployed with Vercel at sachinvedgupta.com
- ThreeJS for an avatar of me
- Using Plotly to visualize the embeddings in a lower dimension (reduced to 2D via PCA)
- Clean and simple UI
- AI chatbot module
- Portfolio viewing section with experience, leadership, projects, etc



## Features

- 🎨 Modern, clean UI with dark mode support
- 💬 Real-time chat with AI about portfolio and experience
- 🔍 **Live vector space visualization** showing embeddings and similarity search
- 🌐 **Interactive 3D visualization** with Three.js for immersive exploration
- 📱 Responsive design that works on all devices
- ⚡ Fast and lightweight
- 🔄 Auto-scroll to latest messages
- ⌨️ Enter key to send messages

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
