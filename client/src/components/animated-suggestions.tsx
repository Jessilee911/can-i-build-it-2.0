import { useState, useEffect } from "react";

const askingAboutQuestions = [
  "Can I build a minor dwelling in Auckland?",
  "I want to renovate my kitchen, do I need consent?", 
  "What consultants do I need to subdivide my property?",
  "How long does it take to get building consent?"
];

const buildingTips = [
  "Most structural changes require consent",
  "Resource consent is separate from building consent",
  "NZ Building Code sets national standards for construction",
  "Engaging professionals early saves time and money"
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
    <div className="mt-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-2">Try asking about:</h3>
          <div 
            className={`text-gray-600 min-h-[24px] transition-opacity duration-300 ${
              questionVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <span className="text-blue-600">• "{askingAboutQuestions[currentQuestionIndex]}"</span>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-2">Quick Building Tips:</h3>
          <div 
            className={`text-gray-600 min-h-[24px] transition-opacity duration-300 ${
              tipVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <span className="text-green-600">• {buildingTips[currentTipIndex]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}