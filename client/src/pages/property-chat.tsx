import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Send, MapPin, FileText, Building, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PropertyData {
  address: string;
  coordinates: [number, number];
  zoning: {
    code: number;
    name: string;
    description: string;
    category: string;
  };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  propertyContext?: PropertyData;
}

interface ProjectAnalysis {
  consentRequired: boolean;
  buildingCodeReferences: string[];
  planningConsiderations: string[];
  recommendations: string[];
  warningsAndRestrictions: string[];
}

export default function PropertyChat() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get property data from URL params or localStorage
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [showProjectForm, setShowProjectForm] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load property data and user info on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const propertyDataParam = urlParams.get('property');
    const userNameParam = urlParams.get('user');
    
    if (propertyDataParam) {
      try {
        const property = JSON.parse(decodeURIComponent(propertyDataParam));
        setPropertyData(property);
      } catch (error) {
        console.error('Error parsing property data:', error);
      }
    }
    
    if (userNameParam) {
      setUserName(decodeURIComponent(userNameParam));
    }

    // If no property data, redirect back
    if (!propertyDataParam) {
      navigate('/');
    }
  }, [navigate]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize welcome message when property data is loaded
  useEffect(() => {
    if (propertyData && userName && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Hello ${userName}! I'm your property-specific building advisor for ${propertyData.address}. 

I have access to the official planning information for your property:
- **Zone**: ${propertyData.zoning.name}
- **Category**: ${propertyData.zoning.category}
- **Coordinates**: ${propertyData.coordinates[1].toFixed(6)}, ${propertyData.coordinates[0].toFixed(6)}

To get started, please describe the building work or project you're planning at this property. I'll provide specific guidance based on your property's zoning and the current New Zealand Building Code requirements.`,
        timestamp: new Date(),
        propertyContext: propertyData
      };
      setMessages([welcomeMessage]);
    }
  }, [propertyData, userName, messages.length]);

  // Mutation for analyzing project description
  const analyzeProjectMutation = useMutation({
    mutationFn: async (description: string): Promise<ProjectAnalysis> => {
      const response = await apiRequest('/api/analyze-project', 'POST', {
        propertyData,
        projectDescription: description,
        userName
      });
      return response as ProjectAnalysis;
    },
    onSuccess: (analysis: ProjectAnalysis) => {
      const analysisMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: formatProjectAnalysis(analysis),
        timestamp: new Date(),
        propertyContext: propertyData
      };
      setMessages(prev => [...prev, analysisMessage]);
      setShowProjectForm(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to analyze your project. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation for sending chat messages
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return await apiRequest('/api/property-chat', 'POST', {
        message,
        propertyData,
        chatHistory: messages,
        userName
      });
    },
    onSuccess: (response: any) => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        propertyContext: propertyData
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectDescription.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: `Project Description: ${projectDescription}`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    analyzeProjectMutation.mutate(projectDescription);
    setProjectDescription('');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    sendMessageMutation.mutate(inputMessage);
    setInputMessage('');
  };

  const formatProjectAnalysis = (analysis: ProjectAnalysis): string => {
    let content = "## Project Analysis Results\n\n";
    
    content += `**Consent Required**: ${analysis.consentRequired ? '⚠️ YES' : '✅ NO'}\n\n`;
    
    if (analysis.buildingCodeReferences.length > 0) {
      content += "### Relevant Building Code Requirements:\n";
      analysis.buildingCodeReferences.forEach(ref => {
        content += `• ${ref}\n`;
      });
      content += "\n";
    }
    
    if (analysis.planningConsiderations.length > 0) {
      content += "### Planning Considerations:\n";
      analysis.planningConsiderations.forEach(consideration => {
        content += `• ${consideration}\n`;
      });
      content += "\n";
    }
    
    if (analysis.recommendations.length > 0) {
      content += "### Recommendations:\n";
      analysis.recommendations.forEach(rec => {
        content += `• ${rec}\n`;
      });
      content += "\n";
    }
    
    if (analysis.warningsAndRestrictions.length > 0) {
      content += "### ⚠️ Important Warnings & Restrictions:\n";
      analysis.warningsAndRestrictions.forEach(warning => {
        content += `• ${warning}\n`;
      });
    }
    
    return content;
  };

  if (!propertyData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading property data...</h2>
          <p className="text-gray-600">Please wait while we load your property information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <MapPin className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Property Chat: {propertyData.address}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {propertyData.zoning.name} • {propertyData.zoning.category}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* Property Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Property Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Address</p>
                <p className="text-gray-900 dark:text-gray-100">{propertyData.address}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Planning Zone</p>
                <Badge variant="outline" className="mt-1">
                  {propertyData.zoning.name}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Description Form */}
        {showProjectForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Describe Your Project</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProjectSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    What building work are you planning at this property?
                  </label>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="e.g., Build a 20m² carport, Add a deck to the back of the house, Convert garage to habitable room..."
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={analyzeProjectMutation.isPending}
                  className="w-full"
                >
                  {analyzeProjectMutation.isPending ? 'Analyzing...' : 'Analyze Project Requirements'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Chat Messages */}
        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Chat Input */}
        {!showProjectForm && (
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about building regulations, consent requirements, or your specific project..."
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={sendMessageMutation.isPending}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}