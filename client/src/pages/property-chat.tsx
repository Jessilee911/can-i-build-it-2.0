import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  SendIcon, 
  MapPinIcon, 
  BuildingIcon, 
  AlertCircleIcon,
  CheckCircleIcon,
  MessageSquareIcon,
  HomeIcon
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/auth/auth-modal";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface PropertyContext {
  propertyAddress: string;
  propertyData?: any;
  zoning?: string;
  coordinates?: [number, number];
  verificationStatus?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: number;
  title: string;
  propertyAddress?: string;
  agentType: string;
}

export function PropertyChatPage() {
  const { user, isAuthenticated } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyContext, setPropertyContext] = useState<PropertyContext | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const validateProperty = async (address: string) => {
    try {
      setIsLoading(true);
      setValidationError("");

      const response = await fetch("/api/agent/validate-property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyAddress: address })
      });

      const data = await response.json();

      if (data.valid) {
        setPropertyContext(data.context);
        return true;
      } else {
        setValidationError(data.message || "Invalid property address");
        return false;
      }
    } catch (error: any) {
      setValidationError(error.message || "Failed to validate property");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const createSession = async (address: string) => {
    try {
      const response = await fetch("/api/agent/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentType: "agent_2",
          propertyAddress: address,
          title: `Property: ${address}`
        })
      });

      const data = await response.json();
      setCurrentSession(data);
      return data;
    } catch (error: any) {
      throw new Error(error.message || "Failed to create property session");
    }
  };

  const sendMessage = async (message: string) => {
    if (!currentSession || !message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSession.id,
          message: message
        })
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I apologize, but I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startPropertySession = async () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    if (!propertyAddress.trim()) {
      setValidationError("Please enter a property address");
      return;
    }

    setIsLoading(true);
    try {
      // Validate property first
      const isValid = await validateProperty(propertyAddress);
      if (!isValid) return;

      // Create session
      await createSession(propertyAddress);

      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: "welcome",
        role: "assistant",
        content: `Hello! I'm Agent 2, your property-specific assistant. I've verified the location for **${propertyAddress}** and retrieved the official property data. I can now provide tailored advice about building regulations, zoning rules, and development opportunities specific to this property. What would you like to know?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);

    } catch (error: any) {
      setValidationError(error.message || "Failed to start property session");
    } finally {
      setIsLoading(false);
    }
  };

  const resetSession = () => {
    setCurrentSession(null);
    setMessages([]);
    setPropertyContext(null);
    setPropertyAddress("");
    setValidationError("");
  };

  // Temporarily allow unauthenticated access for testing
  const showAuthRequired = false; // Set to true when authentication is working
  
  if (!isAuthenticated && showAuthRequired) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <BuildingIcon className="h-12 w-12 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Property Assistant - Agent 2</CardTitle>
              <p className="text-muted-foreground">
                Get property-specific building advice with verified data
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <Alert className="mb-6">
                <AlertCircleIcon className="h-4 w-4" />
                <AlertDescription>
                  Please sign in to access the Property Assistant with verified Auckland Council data.
                </AlertDescription>
              </Alert>
              <Button onClick={() => setAuthModalOpen(true)}>
                Sign In to Continue
              </Button>
            </CardContent>
          </Card>
        </div>

        <AuthModal 
          open={authModalOpen} 
          onOpenChange={setAuthModalOpen}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {!currentSession ? (
          // Property Input Phase
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                  <BuildingIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Property Assistant</CardTitle>
                  <p className="text-muted-foreground">Agent 2 - Property-specific guidance</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2 text-blue-600" />
                  What I provide:
                </h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Property-specific zoning and building advice</li>
                  <li>• Official Auckland Council data verification</li>
                  <li>• Tailored consent requirements for your property</li>
                  <li>• Building restrictions and opportunities specific to your site</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Property Address
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      placeholder="e.g., 123 Queen Street, Auckland"
                      value={propertyAddress}
                      onChange={(e) => setPropertyAddress(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && startPropertySession()}
                    />
                  </div>
                  <Button 
                    onClick={startPropertySession}
                    disabled={isLoading || !propertyAddress.trim()}
                  >
                    {isLoading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <MapPinIcon className="h-4 w-4 mr-2" />
                        Start Session
                      </>
                    )}
                  </Button>
                </div>
                {validationError && (
                  <Alert className="mt-3" variant="destructive">
                    <AlertCircleIcon className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}
              </div>

              {propertyContext && (
                <Alert>
                  <CheckCircleIcon className="h-4 w-4" />
                  <AlertDescription>
                    Property verified! Ready to provide specific guidance for {propertyContext.propertyAddress}.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ) : (
          // Chat Interface Phase
          <div className="space-y-4">
            {/* Session Header */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary">Agent 2</Badge>
                    <div>
                      <h3 className="font-semibold">{currentSession.title}</h3>
                      <p className="text-sm text-muted-foreground">Property-specific assistance</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={resetSession}>
                    <HomeIcon className="h-4 w-4 mr-2" />
                    New Property
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Chat Messages */}
            <Card className="h-[500px] flex flex-col">
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg p-3",
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      )}
                    >
                      <div className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </div>
                      <div className="text-xs mt-1 opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                        <span className="text-sm text-gray-600">Agent 2 is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Ask about building requirements, zoning rules, or development opportunities..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(inputMessage)}
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={() => sendMessage(inputMessage)}
                    disabled={isLoading || !inputMessage.trim()}
                  >
                    <SendIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}