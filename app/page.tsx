"use client";

import { useState } from "react";
import ChatInterface from "./components/ChatInterface";
import VectorVisualizer from "./components/VectorVisualizer";
import AvatarRenderer from "./components/AvatarRenderer";

export default function Home() {
  const [currentQuestion, setCurrentQuestion] = useState("");

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Avatar Section */}
          <div className="mb-8">
            <AvatarRenderer />
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
