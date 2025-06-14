import { useState, useEffect } from "react";

const askingAboutQuestions = [
  "Can I build a minor dwelling in Auckland?",
  "I want to renovate my kitchen, do I need consent?", 
  "What consultants do I need to subdivide my property?",
  "How long does it take to get building consent?"
];

const buildingTips = [
  "Free: Get instant answers about building codes and zoning rules",
  "Free: Access comprehensive FAQ with expert guidance",
  "Free: Search official New Zealand building regulations database", 
  "Free: Check consent requirements for common building projects",
  "Paid Reports: Upload plans for expert assessment within 48 hours",
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

  return null;
}

export default AnimatedSuggestions;