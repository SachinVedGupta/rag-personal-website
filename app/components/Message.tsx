interface MessageProps {
  message: {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
  };
}

export default function Message({ message }: MessageProps) {
  const formatMessage = (text: string) => {
    return (
      text
        // Convert markdown bold to HTML
        .replace(
          /\*\*(.*?)\*\*/g,
          '<strong class="font-semibold text-blue-600 dark:text-blue-400">$1</strong>'
        )
        // Convert markdown links to HTML
        .replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 dark:text-blue-300 hover:underline font-medium">$1</a>'
        )
        // Convert bullet points
        .replace(/^[-*]\s+/gm, "• ")
        // Convert line breaks
        .replace(/\n/g, "<br>")
    );
  };

  return (
    <div className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          message.isUser
            ? "bg-blue-500 text-white"
            : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
        }`}
      >
        <div
          className="text-sm whitespace-pre-wrap"
          dangerouslySetInnerHTML={{
            __html: message.isUser ? message.text : formatMessage(message.text),
          }}
        />
        <p
          className={`text-xs mt-1 ${
            message.isUser
              ? "text-blue-100"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
