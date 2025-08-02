"use client";

import { useState } from "react";
import ChatInterface from "./components/ChatInterface";
import VectorVisualizer from "./components/VectorVisualizer";

export default function Home() {
  const [currentQuestion, setCurrentQuestion] = useState("");

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              🤖 Portfolio AI Assistant
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Chat with AI about Sachin's portfolio with live 2D vector
              visualization
            </p>
          </div>

          {/* Main Content - Chat and Visualization */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chat Interface */}
            <div className="lg:col-span-1">
              <ChatInterface onQuestionChange={setCurrentQuestion} />
            </div>

            {/* 2D Visualization */}
            <div className="lg:col-span-1">
              <VectorVisualizer
                question={currentQuestion}
                onQuestionChange={setCurrentQuestion}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
