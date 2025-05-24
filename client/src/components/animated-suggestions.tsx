import { useState, useEffect } from "react";

const suggestions = [
  "Can I build a minor dwelling in Auckland?",
  "I want to renovate my kitchen, do I need consent?", 
  "What consultants do I need to subdivide my property?",
  "How long does it take to get building consent?",
  "Most structural changes require consent",
  "Resource consent is separate from building consent",
  "NZ Building Code sets national standards for construction",
  "Engaging professionals early saves time and money"
];

export function AnimatedSuggestions() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % suggestions.length);
        setIsVisible(true);
      }, 300); // Half second for fade out
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-4 mb-6">
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
        <h3 className="font-medium text-gray-900 mb-3">Try asking about building regulations or property development:</h3>
        <div 
          className={`text-gray-600 min-h-[24px] transition-opacity duration-300 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="text-blue-600 font-medium">"{suggestions[currentIndex]}"</span>
        </div>
      </div>
    </div>
  );
}