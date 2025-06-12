import React from 'react';
import { LinkBubble } from './link-bubble';

interface FormattedTextProps {
  content: string;
}

export function FormattedText({ content }: FormattedTextProps) {
  // Split content by double newlines to create paragraphs
  const paragraphs = content.split('\n\n');

  const formatTextWithBubbles = (text: string) => {
    // Handle bold text (**text** or __text__)
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // Handle italic text (*text* or _text_)
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/_(.*?)_/g, '<em>$1</em>');

    // Handle inline code (`code`)
    text = text.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>');

    return text;
  };

  const parseTextWithLinks = (text: string) => {
    const parts = [];
    let lastIndex = 0;

    // Pattern to match various link formats:
    // 1. Quoted links: "MBIE Building Consent Exemptions Guide"
    // 2. URL links: https://example.com
    // 3. Markdown links: [text](url)
    const linkPattern = /"([^"]+(?:Guide|Code|Act|Regulation|Standard|Manual|Document|PDF|Report|Website|Portal|Service|API)(?:[^"]*)?)"|(\bhttps?:\/\/[^\s]+)|(\[([^\]]+)\]\(([^)]+)\))/gi;

    let match;
    while ((match = linkPattern.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        parts.push(
          <span key={`text-${lastIndex}`} dangerouslySetInnerHTML={{ __html: formatTextWithBubbles(beforeText) }} />
        );
      }

      if (match[1]) {
        // Quoted link (like "MBIE Building Consent Exemptions Guide")
        const linkText = match[1];
        const searchQuery = encodeURIComponent(linkText);
        const searchUrl = `https://www.google.com/search?q=${searchQuery}+site:building.govt.nz`;
        parts.push(
          <LinkBubble key={`link-${match.index}`} url={searchUrl}>
            {linkText}
          </LinkBubble>
        );
      } else if (match[2]) {
        // Direct URL
        const url = match[2];
        parts.push(
          <LinkBubble key={`link-${match.index}`} url={url}>
            {url}
          </LinkBubble>
        );
      } else if (match[3]) {
        // Markdown link [text](url)
        const linkText = match[4];
        const url = match[5];
        parts.push(
          <LinkBubble key={`link-${match.index}`} url={url}>
            {linkText}
          </LinkBubble>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      parts.push(
        <span key={`text-${lastIndex}`} dangerouslySetInnerHTML={{ __html: formatTextWithBubbles(remainingText) }} />
      );
    }

    return parts.length > 0 ? parts : [<span key="full-text" dangerouslySetInnerHTML={{ __html: formatTextWithBubbles(text) }} />];
  };

  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, index) => {
        if (!paragraph.trim()) return null;

        // Check if paragraph starts with a bullet point or number
        const lines = paragraph.split('\n');
        const isList = lines.some(line => 
          line.trim().match(/^[•\-\*]\s/) || 
          line.trim().match(/^\d+\.\s/)
        );

        if (isList) {
          return (
            <ul key={index} className="space-y-1 ml-4">
              {lines.map((lineIndex, idx) => {
                const trimmedLine = lines[idx].trim();
                if (!trimmedLine) return null;

                // Remove bullet point or number from the beginning
                const cleanLine = trimmedLine.replace(/^[•\-\*]\s/, '').replace(/^\d+\.\s/, '');

                return (
                  <li key={idx} className="flex items-start">
                    <span className="text-blue-500 mr-2 flex-shrink-0">•</span>
                    <div className="flex flex-wrap items-center gap-1">
                      {parseTextWithLinks(cleanLine)}
                    </div>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Handle headings
        if (paragraph.startsWith('# ')) {
          const headingText = paragraph.substring(2);
          return (
            <h1 key={index} className="text-xl font-bold text-gray-900 mt-4 mb-2">
              {headingText}
            </h1>
          );
        }

        if (paragraph.startsWith('## ')) {
          const headingText = paragraph.substring(3);
          return (
            <h2 key={index} className="text-lg font-semibold text-gray-800 mt-3 mb-2">
              {headingText}
            </h2>
          );
        }

        if (paragraph.startsWith('### ')) {
          const headingText = paragraph.substring(4);
          return (
            <h3 key={index} className="text-base font-medium text-gray-700 mt-2 mb-1">
              {headingText}
            </h3>
          );
        }

        // Regular paragraph
        return (
          <div key={index} className="leading-relaxed flex flex-wrap items-center gap-1">
            {parseTextWithLinks(paragraph)}
          </div>
        );
      })}
    </div>
  );
}