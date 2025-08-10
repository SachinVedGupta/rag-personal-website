"use client";

import { useState } from "react";
import ChatInterface from "./components/ChatInterface";
import VectorVisualizer from "./components/VectorVisualizer";
import AvatarRenderer from "./components/AvatarRenderer";
import PortfolioSection from "./components/PortfolioSection";

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <div className="lg:col-span-1 h-full">
            <ChatInterface onQuestionChange={setCurrentQuestion} />
          </div>
          <div className="lg:col-span-1 h-full">
            <VectorVisualizer
              question={currentQuestion}
              onQuestionChange={setCurrentQuestion}
            />
          </div>
        </div>

        </div>
      </div>

      {/* Portfolio Section */}
      <PortfolioSection />
    </main>
  );
}
