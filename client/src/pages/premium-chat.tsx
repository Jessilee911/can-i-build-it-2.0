import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Bot, User, Send, FileText, Download, MapPin, Calculator, Clock, AlertTriangle } from "lucide-react";
import nzMapImage from "@assets/NZ.png";

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  features?: {
    hasDocuments?: boolean;
    hasCalculations?: boolean;
    hasTimeline?: boolean;
    hasRegulations?: boolean;
  };
}

export default function PremiumChat() {
  const [, setLocation] = useLocation();
  const [conversation, setConversation] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  useEffect(() => {
    // Initialize with premium welcome message
    initializePremiumConversation();
  }, []);

  const initializePremiumConversation = () => {
    const projectDetails = sessionStorage.getItem('projectDetails');
    
    let welcomeMessage = `Welcome to your Premium Property Development Assessment! I'm your expert AI advisor with enhanced capabilities.

🏆 **Premium Features Unlocked:**
• Advanced building consent analysis with cost breakdowns
• Detailed zoning compliance with visual overlays  
• Professional timeline planning with milestone tracking
• Risk assessment and mitigation strategies
• Document generation and download capabilities
• Priority regulatory guidance with citations

I can provide comprehensive analysis including specific costs, timelines, and detailed regulatory requirements.`;

    if (projectDetails) {
      const details = JSON.parse(projectDetails);
      welcomeMessage = `Welcome to your Premium Property Development Assessment for **${details.propertyAddress}**!

🎯 **Project Overview:**
• **Development Type:** ${details.projectDescription}
• **Budget Range:** ${details.budgetRange}
• **Timeline:** ${details.timeframe}

🏆 **Premium Analysis Includes:**
• Detailed consent cost breakdowns and processing times
• Zoning compliance with specific rule interpretations
• Professional timeline with regulatory milestones
• Risk assessment and mitigation recommendations
• Downloadable reports and documentation

Let's dive deep into your development potential. What specific aspect would you like to explore first?`;
    }
    
    setConversation([{
      id: Date.now().toString(),
      type: 'agent',
      content: welcomeMessage,
      timestamp: new Date(),
      features: {
        hasDocuments: true,
        hasCalculations: true,
        hasTimeline: true,
        hasRegulations: true
      }
    }]);
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
      const response = await fetch('/api/premium-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          conversationHistory: conversation
        }),
      });

      const data = await response.json();

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: data.response,
        timestamp: new Date(),
        features: data.features || {
          hasDocuments: true,
          hasCalculations: true,
          hasTimeline: true,
          hasRegulations: true
        }
      };

      setConversation(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error('Premium chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: "I'm experiencing technical difficulties. Please try again in a moment.",
        timestamp: new Date()
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = () => {
    // Trigger comprehensive report download
    window.open('/api/premium-report/download', '_blank');
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Premium Background */}
      <div className="absolute inset-0 opacity-10">
        <img 
          src={nzMapImage} 
          alt="New Zealand Map"
          className="w-full h-full object-cover animate-pulse"
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-4">
        {/* Premium Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-2xl shadow-xl mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center">
                  <Bot className="mr-3 h-8 w-8" />
                  Premium Property Assessment
                </h1>
                <p className="text-blue-100 mt-2">Expert AI advisor with advanced development analysis</p>
              </div>
              
              <div className="text-right">
                <Badge className="bg-yellow-500 text-black font-semibold mb-2">
                  🏆 PREMIUM
                </Badge>
                <div className="text-sm text-blue-200">
                  Enhanced features unlocked
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Feature Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/90 backdrop-blur-sm border-green-200">
            <CardContent className="p-4 text-center">
              <Calculator className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-sm font-medium">Cost Analysis</div>
              <div className="text-xs text-gray-600">Detailed breakdowns</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/90 backdrop-blur-sm border-blue-200">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-sm font-medium">Timeline Planning</div>
              <div className="text-xs text-gray-600">Milestone tracking</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/90 backdrop-blur-sm border-purple-200">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-sm font-medium">Risk Assessment</div>
              <div className="text-xs text-gray-600">Mitigation strategies</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/90 backdrop-blur-sm border-orange-200">
            <CardContent className="p-4 text-center">
              <FileText className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-sm font-medium">Documentation</div>
              <div className="text-xs text-gray-600">Professional reports</div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Container */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30">
          
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {conversation.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-4xl ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 ${msg.type === 'user' ? 'ml-3' : 'mr-3'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      msg.type === 'user' ? 'bg-blue-600' : 'bg-gradient-to-r from-blue-600 to-purple-600'
                    }`}>
                      {msg.type === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                  <div className={`flex-1 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-4 rounded-2xl max-w-full ${
                      msg.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gradient-to-r from-gray-50 to-blue-50 border border-blue-200'
                    }`}>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {msg.content}
                      </div>
                      
                      {/* Premium Features Indicators */}
                      {msg.type === 'agent' && msg.features && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-blue-200">
                          {msg.features.hasCalculations && (
                            <Badge variant="secondary" className="text-xs">
                              <Calculator className="w-3 h-3 mr-1" />
                              Cost Analysis
                            </Badge>
                          )}
                          {msg.features.hasTimeline && (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              Timeline
                            </Badge>
                          )}
                          {msg.features.hasRegulations && (
                            <Badge variant="secondary" className="text-xs">
                              <MapPin className="w-3 h-3 mr-1" />
                              Regulations
                            </Badge>
                          )}
                          {msg.features.hasDocuments && (
                            <Badge variant="secondary" className="text-xs">
                              <FileText className="w-3 h-3 mr-1" />
                              Documentation
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex mr-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-blue-200 rounded-2xl p-4">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Premium Input */}
          <div className="border-t border-blue-200 p-6 bg-gradient-to-r from-blue-50 to-purple-50">
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask for detailed analysis, cost estimates, timelines..."
                className="flex-1 border-blue-300 focus:border-blue-500"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                disabled={!message.trim() || isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Premium Actions */}
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Button
            onClick={handleDownloadReport}
            className="bg-green-600 hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Comprehensive Report
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setLocation('/reports')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate New Assessment
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setLocation('/')}
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}