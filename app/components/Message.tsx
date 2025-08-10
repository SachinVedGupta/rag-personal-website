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
        // **Bold**
        .replace(
          /\*\*(.*?)\*\*/g,
          '<strong class="font-semibold text-blue-600 dark:text-blue-400">$1</strong>'
        )
  
        // Images first (handles [/path/image.png] or /path/image.png)
        .replace(
          /\[?((?:https?:\/\/|\/)[^\s)\]]+\.(?:jpg|jpeg|png|gif|webp|svg))(?:\?[^\s)\]]*)?\]?/gi,
          '<img src="$1" alt="Project image" class="max-w-full h-auto rounded-lg shadow-md my-2 border border-gray-200 dark:border-gray-600" style="max-height: 200px;" />'
        )
  
        // PDFs second (handles [/path/file.pdf] or /path/file.pdf)
        .replace(
          /\[?((?:https?:\/\/|\/)[^\s)\]]+\.pdf)(?:\?[^\s)\]]*)?\]?/gi,
          `<div class="my-2">
            <a href="$1" target="_blank" rel="noopener noreferrer" class="block font-medium hover:underline">
              📄 Open PDF
            </a>
            <div style="max-height:300px; overflow:hidden; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.08); margin-top:8px;">
              <object data="$1" type="application/pdf" width="100%" height="300">
                <a href="$1" target="_blank" rel="noopener noreferrer">Open the PDF</a>
              </object>
            </div>
          </div>`
        )
  
        // Then markdown links (this will now only hit *non-image* links)
        .replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 dark:text-blue-300 hover:underline font-medium">$1</a>'
        )
  
        // Bullet points
        .replace(/^[-*]\s+/gm, "• ")
  
        // Line breaks
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
