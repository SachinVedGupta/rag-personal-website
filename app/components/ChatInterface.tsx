"use client";

import { useState, useRef, useEffect } from "react";
import Message from "./Message";
import InputBox from "./InputBox";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatInterfaceProps {
  onQuestionChange?: (question: string) => void;
}

export default function ChatInterface({
  onQuestionChange,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const typeMessage = (text: string, messageId: string) => {
    setIsTyping(true);
    setTypingText("");
    setTypingMessageId(messageId);
    let index = 0;

    const typeInterval = setInterval(() => {
      if (index < text.length) {
        setTypingText(text.substring(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        setTypingMessageId(null);
        clearInterval(typeInterval);
      }
    }, 30); // Faster typing speed for chat
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingText]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Update the current question for visualization
    onQuestionChange?.(text.trim());

    try {
      const response = await fetch("http://localhost:5000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: text.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.answer,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        // Start typing animation for AI response
        typeMessage(data.answer, aiMessage.id);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "Sorry, I encountered an error. Please try again.",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I cannot connect to the server. Please make sure the backend is running.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Portfolio Chat
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ask me anything about my{" "}
          <button
            onClick={() =>
              sendMessage(
                "Tell me about your work experience and leadership roles"
              )
            }
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-medium transition-colors"
          >
            experience
          </button>
          ,{" "}
          <button
            onClick={() => sendMessage("What are your technical skills?")}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-medium transition-colors"
          >
            skills
          </button>
          , or{" "}
          <button
            onClick={() => sendMessage("Tell me about your projects")}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-medium transition-colors"
          >
            projects
          </button>
        </p>
      </div>

      {/* Messages Container */}
      <div className="h-96 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <p>Start a conversation by asking a question!</p>
            <p className="text-sm mt-2">
              Try: "What are your skills?" or "Tell me about your experience"
            </p>
          </div>
        )}

        {messages.map((message) => (
          <Message
            key={message.id}
            message={{
              ...message,
              text: typingMessageId === message.id ? typingText : message.text,
            }}
          />
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm">AI is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <InputBox onSendMessage={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
