import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Bot, User, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function PremiumChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Welcome to Premium Chat! I'm your expert New Zealand property development advisor. I can help you with building consents, zoning regulations, development feasibility, and compliance requirements. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + "_assistant",
        role: "assistant",
        content: data.response || "I apologize, but I couldn't process your request at the moment.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: () => {
      toast({
        title: "Message Failed",
        description: "Unable to send your message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString() + "_user",
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    sendMessage.mutate(inputMessage);
    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-NZ", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Premium Expert Chat
            </h1>
            <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-pink-500">
              <Zap className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Get expert guidance on New Zealand property development and building regulations
          </p>
        </div>

        {/* Chat Interface */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Chat with Property Experts
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${
                      message.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] ${
                        message.role === "user" ? "text-right" : ""
                      }`}
                    >
                      <div
                        className={`rounded-lg p-3 ${
                          message.role === "user"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                {sendMessage.isPending && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about building consents, zoning, or development regulations..."
                  className="flex-1"
                  disabled={sendMessage.isPending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || sendMessage.isPending}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Premium Features */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CardContent className="p-4 text-center">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                Expert Knowledge
              </h3>
              <p className="text-sm text-green-700 dark:text-green-200">
                Direct access to New Zealand building and planning experts
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <CardContent className="p-4 text-center">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Real-time Guidance
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-200">
                Get immediate answers to complex development questions
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950">
            <CardContent className="p-4 text-center">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                Priority Support
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-200">
                Premium users receive priority response and detailed analysis
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}