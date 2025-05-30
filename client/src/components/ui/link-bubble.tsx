import { ExternalLink } from "lucide-react";

interface LinkBubbleProps {
  url: string;
  children: React.ReactNode;
}

export function LinkBubble({ url, children }: LinkBubbleProps) {
  return (
    <a
      href={url.startsWith('http') ? url : `https://${url}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-full text-blue-700 hover:text-blue-800 text-sm font-medium transition-colors duration-200 cursor-pointer"
    >
      {children}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}