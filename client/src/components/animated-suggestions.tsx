import { useState, useEffect } from "react";

const askingAboutQuestions = [
  "How long does it take to get building consent?",
  "Can I build a minor dwelling in Auckland?",
  "I want to renovate my kitchen, do I need consent?", 
  "What consultants do I need to subdivide my property?"
];

const buildingTips = [
  "Free: Search official New Zealand building regulations database",
  "Free: Get instant answers about building codes and zoning rules",
  "Free: Understand district plan zoning for any NZ property",
  "Free: Access comprehensive FAQ with expert guidance",
  "Free: Check consent requirements for common building projects",
  "Paid Reports: Get detailed property-specific analysis and sketches",
  "Paid Reports: Receive professional review and email consultation",
  "Paid Reports: Upload plans for expert assessment within 48 hours"
];

export function AnimatedSuggestions() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [questionVisible, setQuestionVisible] = useState(true);
  const [tipVisible, setTipVisible] = useState(true);

  useEffect(() => {
    const questionInterval = setInterval(() => {
      setQuestionVisible(false);
      
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => (prev + 1) % askingAboutQuestions.length);
        setQuestionVisible(true);
      }, 300);
    }, 3000);

    return () => clearInterval(questionInterval);
  }, []);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipVisible(false);
      
      setTimeout(() => {
        setCurrentTipIndex((prev) => (prev + 1) % buildingTips.length);
        setTipVisible(true);
      }, 300);
    }, 3500); // Slightly different timing so they don't change at the same time

    return () => clearInterval(tipInterval);
  }, []);

  return (
    <div className="mt-2 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
        <div 
          className="backdrop-blur-sm p-4 rounded-lg border border-gray-200 shadow-lg drop-shadow-sm"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
        >
          <h3 className="font-medium text-gray-900 mb-2">Try asking about:</h3>
          <div 
            className={`text-gray-700 min-h-[24px] transition-opacity duration-300 ${
              questionVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <span className="text-blue-700">• "{askingAboutQuestions[currentQuestionIndex]}"</span>
          </div>
        </div>
        
        <div 
          className="backdrop-blur-sm p-4 rounded-lg border border-gray-200 shadow-lg drop-shadow-sm text-[14px]"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
        >
          <h3 className="font-medium text-gray-900 mb-2">Site Features:</h3>
          <div 
            className={`text-gray-700 min-h-[24px] transition-opacity duration-300 ${
              tipVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <span className="text-green-700">• {buildingTips[currentTipIndex]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnimatedSuggestions;