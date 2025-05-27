import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Send, Bot, User, ArrowRight, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import nzMapImage from "@assets/NZ.png";

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  planLevel?: string;
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
    return `Welcome! I'm your Property Assessment & Report Agent for New Zealand. I provide comprehensive, free guidance on building consent requirements, zoning compliance, building codes, resource consents, development potential, and regulatory advice. 

I can also generate detailed property reports including:
• Comprehensive development analysis
• Building consent requirements
• Zoning restrictions and opportunities
• Regulatory compliance guidance
• PDF report downloads

How can I help you assess your property today?`;
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

      const data = await response.json();

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: data.response,
        timestamp: new Date(),
        planLevel: userPlan || undefined
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

      <div className="relative z-10 max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Property Assessment & Reports</h1>
                <p className="text-gray-600">Specialized analysis and comprehensive report generation</p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setLocation('/reports')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <FileTextIcon className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
                
                {userPlan && (
                  <div className={`px-4 py-2 rounded-full text-sm font-medium ${getPlanBadgeColor(userPlan)}`}>
                    {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)} Plan
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
          
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {conversation.length === 0 && (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <div className="text-left max-w-md mx-auto">
                  <p className="text-gray-800 font-medium mb-3">Hi! I'm Agent 2, your specialized property assessment advisor.</p>
                  <p className="text-gray-600 mb-4">I focus specifically on detailed property analysis:</p>
                  <ul className="text-sm text-gray-600 space-y-1 mb-6">
                    <li>• Property-specific building consent analysis</li>
                    <li>• Detailed development potential assessment</li>
                    <li>• Site-specific constraints and opportunities</li>
                    <li>• Zoning compliance for your exact location</li>
                    <li>• Cost estimates and project timelines</li>
                    <li>• Step-by-step development guidance</li>
                  </ul>
                  <p className="text-gray-700">What's your property address and what specific development are you planning?</p>
                </div>
              </div>
            )}

            {conversation.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-3xl ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    msg.type === 'user' ? 'bg-blue-600 ml-3' : 'bg-green-600 mr-3'
                  }`}>
                    {msg.type === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  
                  <div className={`px-4 py-3 rounded-2xl ${
                    msg.type === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {msg.type === 'agent' ? (
                      <div>
                        <div className="whitespace-pre-wrap">
                          {renderMessageWithUpgradeButtons(msg.content)}
                        </div>
                        <div className="text-xs opacity-70 mt-1">
                          {msg.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
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
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
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