import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Bot, User, Send, FileText, Download, MapPin, Calculator, Clock, AlertTriangle, Upload, Mic, MicOff, Star as StarIcon } from "lucide-react";
import { AddressAutocomplete } from "@/components/address-autocomplete";


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
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [propertyAddress, setPropertyAddress] = useState("");
  const [hasEnteredAddress, setHasEnteredAddress] = useState(false);
  const [projectDescription, setProjectDescription] = useState("");
  const [hasEnteredProject, setHasEnteredProject] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  useEffect(() => {
    // Check if user has already entered property address and project
    const savedAddress = sessionStorage.getItem('premiumPropertyAddress');
    const savedProject = sessionStorage.getItem('premiumProjectDescription');
    
    if (savedAddress) {
      setPropertyAddress(savedAddress);
      setHasEnteredAddress(true);
      
      if (savedProject) {
        setProjectDescription(savedProject);
        setHasEnteredProject(true);
        initializePremiumConversation(savedAddress, savedProject);
      }
    }
  }, []);

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (propertyAddress.trim()) {
      sessionStorage.setItem('premiumPropertyAddress', propertyAddress);
      setHasEnteredAddress(true);
    }
  };

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectDescription.trim()) {
      sessionStorage.setItem('premiumProjectDescription', projectDescription);
      setHasEnteredProject(true);
      initializePremiumConversation(propertyAddress, projectDescription);
    }
  };

  const initializePremiumConversation = async (address: string, project: string) => {
    let welcomeMessage = `Welcome to your Premium Property Development Assessment for **${address}**! I'm your expert AI advisor with enhanced capabilities.

🎯 **Your Project:** ${project}

🏆 **Premium Features Unlocked:**
• Advanced building consent analysis with cost breakdowns
• Detailed zoning compliance with visual overlays  
• Professional timeline planning with milestone tracking
• Risk assessment and mitigation strategies
• Document generation and download capabilities
• Priority regulatory guidance with citations

I'll provide comprehensive analysis including specific costs, timelines, and detailed regulatory requirements for your property development project. Let me analyze your specific situation...`;
    
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

    // Automatically generate detailed report using RAG system
    setIsLoading(true);
    try {
      const response = await fetch('/api/premium-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Generate a comprehensive building consent assessment for: ${project} at ${address}. Include specific requirements, costs, timelines, and regulatory compliance for this exact project and location.`,
          conversationHistory: [],
          propertyAddress: address,
          projectDescription: project
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Premium chat response:', data); // Debug log
        
        // Handle different response formats from the server
        const responseContent = data.message || data.response || data.content || "Analysis complete. Please ask me any specific questions about your project.";
        
        if (responseContent.trim()) {
          const reportMessage = {
            id: (Date.now() + 1).toString(),
            type: 'agent' as const,
            content: responseContent,
            timestamp: new Date(),
            features: {
              hasDocuments: true,
              hasCalculations: true,
              hasTimeline: true,
              hasRegulations: true
            }
          };

          setConversation(prev => [...prev, reportMessage]);
        }
      } else {
        console.error('Premium chat API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error generating automatic report:', error);
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'agent' as const,
        content: "I'm preparing your detailed assessment. Please give me a moment to analyze the specific requirements for your project.",
        timestamp: new Date()
      };
      
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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
      const response = await fetch('/api/premium-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          conversationHistory: conversation,
          propertyAddress: propertyAddress,
          projectDescription: projectDescription
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

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      // Add a message about the uploaded files
      const fileMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: `Uploaded ${newFiles.length} file(s): ${newFiles.map(f => f.name).join(', ')}`,
        timestamp: new Date()
      };
      setConversation(prev => [...prev, fileMessage]);
    }
  };

  // Voice recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      
      const response = await fetch('/api/transcribe-audio', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (data.text) {
        setMessage(data.text);
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      alert('Error transcribing audio. Please try typing your message.');
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50">


      <div className="relative z-10 max-w-6xl mx-auto p-4">
        {/* Premium Header */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl md:text-3xl font-bold flex items-center text-gray-900">
                  <Bot className="mr-2 md:mr-3 h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                  Premium Property Assessment
                </h1>
                <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">Expert AI advisor with advanced development analysis</p>
              </div>
              
              <div className="text-right">
                <Badge className="bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold mb-2">
                  🏆 PREMIUM
                </Badge>
                <div className="text-sm text-gray-600">
                  Enhanced features unlocked
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Feature Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
          <Card className="bg-white/80 backdrop-blur-md border border-white/20 shadow-lg">
            <CardContent className="p-2 md:p-4 text-center">
              <Calculator className="h-5 w-5 md:h-8 md:w-8 text-blue-600 mx-auto mb-1 md:mb-2" />
              <div className="text-xs md:text-sm font-medium text-gray-800">Cost Analysis</div>
              <div className="text-xs text-gray-600 hidden md:block">Detailed breakdowns</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-md border border-white/20 shadow-lg">
            <CardContent className="p-2 md:p-4 text-center">
              <Clock className="h-5 w-5 md:h-8 md:w-8 text-green-600 mx-auto mb-1 md:mb-2" />
              <div className="text-xs md:text-sm font-medium text-gray-800">Timeline Planning</div>
              <div className="text-xs text-gray-600 hidden md:block">Milestone tracking</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-md border border-white/20 shadow-lg">
            <CardContent className="p-2 md:p-4 text-center">
              <AlertTriangle className="h-5 w-5 md:h-8 md:w-8 text-blue-700 mx-auto mb-1 md:mb-2" />
              <div className="text-xs md:text-sm font-medium text-gray-800">Risk Assessment</div>
              <div className="text-xs text-gray-600 hidden md:block">Mitigation strategies</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-md border border-white/20 shadow-lg">
            <CardContent className="p-2 md:p-4 text-center">
              <FileText className="h-5 w-5 md:h-8 md:w-8 text-green-700 mx-auto mb-1 md:mb-2" />
              <div className="text-xs md:text-sm font-medium text-gray-800">Documentation</div>
              <div className="text-xs text-gray-600 hidden md:block">Professional reports</div>
            </CardContent>
          </Card>
        </div>

        {/* Property Address Input Form */}
        {!hasEnteredAddress ? (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-4 md:p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <StarIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Premium Property Assessment</h2>
              <p className="text-gray-600">To provide you with accurate, location-specific guidance, please enter your property address.</p>
            </div>
            
            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Property Address *
                </label>
                <AddressAutocomplete
                  value={propertyAddress}
                  onChange={setPropertyAddress}
                  onSelect={(addressOption) => {
                    setPropertyAddress(addressOption.fullAddress);
                  }}
                  placeholder="Start typing a New Zealand address..."
                  className="border-blue-300 focus:border-blue-500"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white py-3"
                disabled={!propertyAddress.trim()}
              >
                <StarIcon className="w-4 h-4 mr-2" />
                Start Premium Assessment
              </Button>
            </form>
            
            <div className="mt-6 p-4 bg-blue-50/50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-800 mb-2">What you'll get:</h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Location-specific building consent requirements</li>
                <li>• Council-specific zoning and planning rules</li>
                <li>• Accurate cost estimates for your area</li>
                <li>• Regional timeline estimates</li>
              </ul>
            </div>
          </div>
        ) : hasEnteredAddress && !hasEnteredProject ? (
          // Project Description Form
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What's Your Project?</h2>
              <p className="text-gray-600">Tell us about your building project to get specific guidance and requirements.</p>
            </div>
            
            <form onSubmit={handleProjectSubmit} className="space-y-6">
              <div>
                <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-3">
                  Project Description *
                </label>
                <textarea
                  id="project"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Describe your building project..."
                  className="w-full h-24 px-4 py-3 border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setProjectDescription("Do I need building consent for a new garage?")}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 text-left transition-colors"
                >
                  <div className="font-medium text-gray-900">Garage Construction</div>
                  <div className="text-sm text-gray-600">Building consent requirements</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setProjectDescription("Can I subdivide my property into two sections?")}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 text-left transition-colors"
                >
                  <div className="font-medium text-gray-900">Property Subdivision</div>
                  <div className="text-sm text-gray-600">Land division requirements</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setProjectDescription("What permits do I need for a kitchen renovation?")}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 text-left transition-colors"
                >
                  <div className="font-medium text-gray-900">Kitchen Renovation</div>
                  <div className="text-sm text-gray-600">Renovation permits needed</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setProjectDescription("Can I build a deck without consent?")}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 text-left transition-colors"
                >
                  <div className="font-medium text-gray-900">Deck Construction</div>
                  <div className="text-sm text-gray-600">Consent requirements</div>
                </button>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white py-3"
                disabled={!projectDescription.trim()}
              >
                <StarIcon className="w-4 h-4 mr-2" />
                Start Premium Assessment
              </Button>
            </form>
          </div>
        ) : (
          // Chat Container
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
            
            {/* Messages */}
            <div className="h-80 md:h-96 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4">
            {conversation.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-full md:max-w-4xl ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 ${msg.type === 'user' ? 'ml-2 md:ml-3' : 'mr-2 md:mr-3'}`}>
                    <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center ${
                      msg.type === 'user' ? 'bg-blue-600' : 'bg-gradient-to-r from-blue-600 to-purple-600'
                    }`}>
                      {msg.type === 'user' ? (
                        <User className="w-3 h-3 md:w-4 md:h-4 text-white" />
                      ) : (
                        <Bot className="w-3 h-3 md:w-4 md:h-4 text-white" />
                      )}
                    </div>
                  </div>
                  <div className={`flex-1 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-3 md:p-4 rounded-2xl max-w-full ${
                      msg.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gradient-to-r from-gray-50 to-blue-50 border border-blue-200'
                    }`}>
                      <div className="whitespace-pre-wrap text-xs md:text-sm leading-relaxed">
                        {msg.content}
                      </div>
                      
                      {/* Premium Features Indicators */}
                      {msg.type === 'agent' && msg.features && (
                        <div className="flex flex-wrap gap-1 md:gap-2 mt-2 md:mt-3 pt-2 md:pt-3 border-t border-blue-200">
                          {msg.features.hasCalculations && (
                            <Badge variant="secondary" className="text-xs">
                              <Calculator className="w-2 h-2 md:w-3 md:h-3 mr-1" />
                              <span className="hidden md:inline">Cost Analysis</span>
                              <span className="md:hidden">Cost</span>
                            </Badge>
                          )}
                          {msg.features.hasTimeline && (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="w-2 h-2 md:w-3 md:h-3 mr-1" />
                              <span className="hidden md:inline">Timeline</span>
                              <span className="md:hidden">Time</span>
                            </Badge>
                          )}
                          {msg.features.hasRegulations && (
                            <Badge variant="secondary" className="text-xs">
                              <MapPin className="w-2 h-2 md:w-3 md:h-3 mr-1" />
                              <span className="hidden md:inline">Regulations</span>
                              <span className="md:hidden">Rules</span>
                            </Badge>
                          )}
                          {msg.features.hasDocuments && (
                            <Badge variant="secondary" className="text-xs">
                              <FileText className="w-2 h-2 md:w-3 md:h-3 mr-1" />
                              <span className="hidden md:inline">Documentation</span>
                              <span className="md:hidden">Docs</span>
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
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-xs text-blue-700 font-medium">Generating comprehensive analysis (typically 9-17 seconds)...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* File Upload Section */}
          {uploadedFiles.length > 0 && (
            <div className="border-t border-blue-200 px-6 py-3 bg-blue-50">
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center bg-white rounded-lg px-3 py-2 text-sm border">
                    <FileText className="w-4 h-4 mr-2 text-blue-600" />
                    <span className="mr-2">{file.name}</span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Premium Input */}
          <div className="border-t border-white/20 p-6 bg-gradient-to-r from-blue-50/50 to-green-50/50 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask for detailed analysis, cost estimates, timelines..."
                  className="flex-1 border-blue-300 focus:border-blue-500"
                  disabled={isLoading}
                />
                
                {/* Voice Recording Button */}
                <Button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`${isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  disabled={isLoading}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                
                {/* File Upload Button */}
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  <Upload className="w-4 h-4" />
                </Button>
                
                {/* Send Button */}
                <Button 
                  type="submit" 
                  disabled={!message.trim() || isLoading}
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Feature indicators */}
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex space-x-4">
                  <span className="flex items-center">
                    <Mic className="w-3 h-3 mr-1" />
                    Voice dictation
                  </span>
                  <span className="flex items-center">
                    <Upload className="w-3 h-3 mr-1" />
                    File upload
                  </span>
                </div>
                {isRecording && (
                  <span className="text-red-500 animate-pulse">
                    Recording... Click mic to stop
                  </span>
                )}
              </div>
            </form>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.dwg"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
        )}

        {/* Premium Actions */}
        {hasEnteredAddress && (
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
            onClick={() => {
              // Clear saved address, project and reset the form
              sessionStorage.removeItem('premiumPropertyAddress');
              sessionStorage.removeItem('premiumProjectDescription');
              sessionStorage.removeItem('projectDetails');
              setPropertyAddress('');
              setProjectDescription('');
              setHasEnteredAddress(false);
              setHasEnteredProject(false);
              setConversation([]);
            }}
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
        )}
      </div>
    </div>
  );
}