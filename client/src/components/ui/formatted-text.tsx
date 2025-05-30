import { LinkBubble } from "./link-bubble";

interface FormattedTextProps {
  children: string;
}

export function FormattedText({ children }: FormattedTextProps) {
  // Convert URLs to clickable link bubbles
  const formatText = (text: string) => {
    // Regex to match URLs (including those without http/https)
    const urlRegex = /(https?:\/\/[^\s]+|(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;
    
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        // Extract domain name for display
        const displayText = part.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        return (
          <LinkBubble key={index} url={part}>
            {displayText}
          </LinkBubble>
        );
      }
      return part;
    });
  };

  return (
    <div className="whitespace-pre-line">
      {formatText(children)}
    </div>
  );
}