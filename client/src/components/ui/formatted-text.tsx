interface FormattedTextProps {
  content: string;
}

export function FormattedText({ content }: FormattedTextProps) {
  // Split content by markdown patterns including links
  const parts = content.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/);

  return (
    <div className="whitespace-pre-wrap">
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          // Bold text
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        } else if (part.startsWith('*') && part.endsWith('*')) {
          // Italic text
          return <em key={index}>{part.slice(1, -1)}</em>;
        } else if (part.startsWith('`') && part.endsWith('`')) {
          // Code text
          return <code key={index} className="bg-gray-200 px-1 rounded">{part.slice(1, -1)}</code>;
        } else if (part.includes('](') && part.startsWith('[')) {
          // Links - handle RAG source links specially
          const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
          if (linkMatch) {
            const [, text, url] = linkMatch;
            if (url.startsWith('rag://')) {
              // RAG source link - show as badge
              return (
                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 mx-1">
                  📄 {text}
                </span>
              );
            } else {
              // Regular link
              return (
                <a key={index} href={url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  {text}
                </a>
              );
            }
          }
          return <span key={index}>{part}</span>;
        } else {
          // Regular text
          return <span key={index}>{part}</span>;
        }
      })}
    </div>
  );
}