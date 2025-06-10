import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Send, Bot, User, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import nzMapImage from "@assets/NZ.png";

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  planLevel?: string;
  sources?: string[];
  clauseReferences?: Array<{ clause: string; source: string }>;
}

export default function Chat() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get user's plan from session storage (set after purchase)
    const plan = sessionStorage.getItem('selectedPlan');
    if (plan) {
      setUserPlan(plan);
      // Start conversation based on plan
      initializeConversation(plan);
    } else if (!isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const initializeConversation = (plan: string) => {
    // Check for project details from the property form
    const projectDetails = sessionStorage.getItem('projectDetails');
    let welcomeMessage = getWelcomeMessage();

    if (projectDetails) {
      const details = JSON.parse(projectDetails);
      welcomeMessage = `Hi! I see you're interested in developing the property at ${details.propertyAddress}. ${welcomeMessage.replace('Hi! ', '')} 

I understand you're planning: ${details.projectDescription}
Budget range: ${details.budgetRange}
Timeframe: ${details.timeframe}

Let me help you understand the building regulations, consent requirements, and development opportunities for this specific project. What would you like to know first?`;
    }

    setConversation([{
      id: Date.now().toString(),
      type: 'agent',
      content: welcomeMessage,
      timestamp: new Date(),
      planLevel: plan
    }]);
  };

  const getWelcomeMessage = () => {
    return `Welcome! I'm your AI property advisor for New Zealand. I provide comprehensive, free guidance on building consent requirements, zoning compliance, building codes, resource consents, development potential, and regulatory advice. I'm here to help you understand everything about developing your property.`;
  };

  const renderMessageWithUpgradeButtons = (content: string) => {
    // Parse upgrade buttons from the format: [UPGRADE_BUTTON:planId:buttonText]
    const buttonRegex = /\[UPGRADE_BUTTON:([^:]+):([^\]]+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = buttonRegex.exec(content)) !== null) {
      // Add text before the button
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }

      // Add the upgrade button
      const [, planId, buttonText] = match;
      parts.push(
        <div key={match.index} className="mt-3 mb-2">
          <Button
            onClick={() => handleUpgrade(planId)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            {buttonText}
          </Button>
        </div>
      );

      lastIndex = buttonRegex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts.length > 1 ? parts : content;
  };

  const handleUpgrade = async (planId: string) => {
    try {
      // Store the current plan selection
      sessionStorage.setItem('selectedPlan', planId);

      // Redirect to pricing page for the upgrade
      setLocation('/pricing');
    } catch (error) {
      console.error('Upgrade error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    setConversation(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      // First try building code question endpoint for clause-specific queries
      const clauseMatch = message.match(/([A-Z]\d+(?:\s+\d+(?:\.\d+)*)?)/i);

      if (clauseMatch || message.toLowerCase().includes('building code') || message.toLowerCase().includes('clause')) {
        const response = await fetch('/api/building-code-question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: message }),
        });

        if (response.ok) {
          const data = await response.json();

          // Add bot response with sources
          let responseContent = data.answer;
          if (data.sources.length > 0) {
            responseContent += `\n\n**Sources:** ${data.sources.map(source => `[${source}](rag://${source})`).join(', ')}`;
          }

          const agentMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'agent',
            content: responseContent,
            timestamp: new Date(),
            planLevel: userPlan || undefined,
            sources: data.sources,
            clauseReferences: data.clauseReferences
          };

          setConversation(prev => [...prev, agentMessage]);
          setIsLoading(false);
          return;
        }
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          plan: userPlan,
          conversationHistory: conversation
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Chat API response:', data);

      // Handle different response formats
      const responseContent = data.response || data.message || data.content;
      
      if (!responseContent || typeof responseContent !== 'string' || responseContent.trim() === '') {
        throw new Error('Invalid or empty response from server');
      }

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: responseContent,
        timestamp: new Date(),
        planLevel: userPlan || undefined,
        sources: [],
        clauseReferences: []
      };

      setConversation(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'professional': return 'bg-purple-100 text-purple-800';
      case 'premium': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
      {/* Animated NZ Map Background */}
      <div className="absolute inset-0 opacity-5">
        <img 
          src={nzMapImage} 
          alt="New Zealand Map"
          className="w-full h-full object-cover animate-pulse"
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto p-2 md:p-4">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 mb-4 md:mb-6">
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-gray-900">Property Assessment Chat</h1>
                <p className="text-sm md:text-base text-gray-600">Your AI-powered property development advisor</p>
              </div>

              {userPlan && (
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${getPlanBadgeColor(userPlan)}`}>
                  {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)} Plan
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">

          {/* Messages */}
          <div className="h-80 md:h-96 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4">
            {conversation.length === 0 && (
              <div className="text-center py-4 md:py-8">
                <Bot className="w-8 h-8 md:w-12 md:h-12 text-blue-600 mx-auto mb-3 md:mb-4" />
                <div className="text-left max-w-md mx-auto">
                  <p className="text-sm md:text-base text-gray-800 font-medium mb-2 md:mb-3">Hi! I'm your AI property advisor for New Zealand.</p>
                  <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">I provide comprehensive, free guidance on:</p>
                  <ul className="text-xs md:text-sm text-gray-600 space-y-1 mb-4 md:mb-6">
                    <li>• Building consent requirements and processes</li>
                    <li>• Detailed zoning information and compliance</li>
                    <li>• Building code requirements and interpretation</li>
                    <li>• Resource consent guidance</li>
                    <li>• Development potential assessment</li>
                    <li>• Cost estimates and timeline planning</li>
                  </ul>
                  <p className="text-xs md:text-sm text-gray-700">What's your property address and what type of development are you planning?</p>
                </div>
              </div>
            )}

            {conversation.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-full md:max-w-3xl ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center ${
                    msg.type === 'user' ? 'bg-blue-600 ml-2 md:ml-3' : 'bg-green-600 mr-2 md:mr-3'
                  }`}>
                    {msg.type === 'user' ? (
                      <User className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    ) : (
                      <Bot className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    )}
                  </div>

                  <div className={`px-3 md:px-4 py-2 md:py-3 rounded-2xl ${
                    msg.type === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {msg.type === 'agent' ? (
                      <div>
                        <div className="whitespace-pre-wrap text-xs md:text-sm">
                          {renderMessageWithUpgradeButtons(msg.content)}
                        </div>

                         {/* Show clause references if available */}
                         {msg.clauseReferences && msg.clauseReferences.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-300">
                              <div className="text-xs font-semibold text-gray-600 mb-1">Referenced Clauses:</div>
                              {msg.clauseReferences.map((ref, index) => (
                                <div key={index} className="text-xs text-gray-600">
                                  {ref.clause} - {ref.source}
                                </div>
                              ))}
                            </div>
                          )}
                        <div className="text-xs opacity-70 mt-1">
                          {msg.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="whitespace-pre-wrap text-xs md:text-sm">{msg.content}</p>
                        <div className="text-xs opacity-70 mt-1">
                          {msg.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex max-w-3xl">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 mr-3 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-xs text-gray-600">Analyzing your request (typically 9-17 seconds)...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about your property development..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                disabled={!message.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={() => setLocation('/')}
            className="mr-4"
          >
            Back to Assessment
          </Button>

          <Button
            onClick={() => setLocation('/reports')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>
    </div>
  );
}