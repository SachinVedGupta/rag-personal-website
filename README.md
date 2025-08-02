# Portfolio Chat Frontend

A modern, simple chat interface for Sachin Ved Gupta's portfolio built with Next.js and React.

## Features

- 🎨 Modern, clean UI with dark mode support
- 💬 Real-time chat with AI about portfolio and experience
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

4. Start chatting! Ask questions like:
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
