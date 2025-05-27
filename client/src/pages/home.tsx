import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, User, ArrowRight, FileText, Search } from "lucide-react";
import { useLocation } from "wouter";
import nzMapImage from "@assets/NZ.png";

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export default function Home() {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

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
      const response = await fetch('/api/main-chat', {
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
        timestamp: new Date()
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with floating NZ map */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="absolute inset-0 opacity-5">
          <img
            src={nzMapImage}
            alt=""
            className="w-full h-full object-cover animate-float"
            style={{ transform: 'scale(1.2)' }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
              Can I Build It?
            </h1>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              Get instant answers about New Zealand building consents, resource consents, and development opportunities with our AI-powered property advisor.
            </p>
          </div>

          {/* Agent 1 - Main Search Function */}
          <Card className="mb-8 bg-white/80 backdrop-blur-md border-white/20 shadow-xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Search className="h-12 w-12 text-blue-600" />
              </div>
              <CardTitle className="text-2xl text-gray-800">
                Ask Agent 1 - General Building Questions
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Get answers about building codes, consent processes, and planning requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Chat Interface */}
              {conversation.length > 0 && (
                <div className="mb-6 h-64 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                  {conversation.map((msg) => (
                    <div key={msg.id} className={`flex mb-4 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex max-w-3xl ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`flex-shrink-0 mx-3 ${msg.type === 'user' ? 'order-2' : 'order-1'}`}>
                          {msg.type === 'user' ? (
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <Bot className="w-4 h-4 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className={`px-4 py-3 rounded-2xl ${
                          msg.type === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white text-gray-800 shadow-sm'
                        }`}>
                          <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start mb-4">
                      <div className="flex max-w-3xl">
                        <div className="flex-shrink-0 mx-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <Bot className="w-4 h-4 text-gray-600" />
                          </div>
                        </div>
                        <div className="px-4 py-3 rounded-2xl bg-white shadow-sm">
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
              )}

              {/* Search Input */}
              <form onSubmit={handleSubmit} className="flex space-x-4">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask me anything about NZ building regulations..."
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

              {conversation.length === 0 && (
                <div className="mt-4 text-center text-gray-600 text-sm">
                  <p>Try asking: "Do I need a building consent for a deck?" or "What are resource consent requirements?"</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Assessment CTA */}
          <div className="text-center">
            <Card className="bg-white/80 backdrop-blur-md border-white/20 shadow-xl">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4 text-gray-800">
                  Need Property-Specific Assessment?
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  Get detailed analysis for your specific property with Agent 2
                </p>
                <div className="space-y-4">
                  <Button 
                    size="lg" 
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                    onClick={() => setLocation('/property-chat')}
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    Start Property Assessment
                  </Button>
                  <p className="text-sm text-gray-500">
                    Detailed site-specific guidance • Free comprehensive analysis
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}