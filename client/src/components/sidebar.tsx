import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  MenuIcon, 
  XIcon, 
  HomeIcon, 
  MessageSquareIcon, 
  HelpCircleIcon, 
  CreditCardIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FileTextIcon,
  StarIcon,
  ShieldCheckIcon,
  SearchIcon,
  BuildingIcon,
  LogInIcon,
  LogOutIcon,
  UserIcon,
  InfoIcon,
  TrashIcon,
  PlusIcon,
  HistoryIcon
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import logoImage from "@assets/Logo PNG Trans.png";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/auth/auth-modal";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const [faqOpen, setFaqOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  // Chat history queries and mutations
  const { data: chatSessions, isLoading: chatLoading } = useQuery({
    queryKey: ["/api/chat-sessions"],
    enabled: isAuthenticated,
  });

  const createSessionMutation = useMutation({
    mutationFn: (title: string) => apiRequest("/api/chat-sessions", "POST", { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat-sessions"] });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/chat-sessions/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat-sessions"] });
    },
  });

  const handleCreateNewChat = () => {
    createSessionMutation.mutate("New Chat");
  };

  const handleDeleteSession = (id: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    deleteSessionMutation.mutate(id);
  };

  const navigationItems = [
    {
      title: "Home",
      href: "/",
      icon: <HomeIcon className="h-4 w-4" />
    }
    // {
    //   title: "Generate Report",
    //   href: "/reports",
    //   icon: <FileTextIcon className="h-4 w-4" />
    // },
    // {
    //   title: "Premium Assessment",
    //   href: "/premium-chat",
    //   icon: <StarIcon className="h-4 w-4" />
    // },
    // {
    //   title: "Chat Assistant",
    //   href: "/chat",
    //   icon: <MessageSquareIcon className="h-4 w-4" />
    // }
  ];

  const faqSections = [
    {
      title: "Building Consent",
      icon: <FileTextIcon className="h-4 w-4" />,
      items: [
        {
          question: "Do I need building consent?",
          answer: "Building consent is required for most alterations that change the structure, add floor area, or affect building systems like plumbing and electrical. Minor cosmetic changes like painting or carpet replacement typically don't require consent."
        },
        {
          question: "How much does building consent cost?",
          answer: "Building consent fees vary by council and project complexity, typically ranging from $1,500 to $15,000+. Costs include application fees, inspections, and processing."
        },
        {
          question: "How long does building consent take?",
          answer: "Standard building consent applications take 20 working days once all required information is submitted. Complex projects may take longer."
        },
        {
          question: "Can I start building without consent?",
          answer: "No, you cannot legally start building work that requires consent before approval. Doing so can result in stop-work notices, fines, and difficulties selling your property."
        }
      ]
    },
    {
      title: "Resource Consent", 
      icon: <ShieldCheckIcon className="h-4 w-4" />,
      items: [
        {
          question: "Building vs Resource consent?",
          answer: "Building consent ensures your building meets safety standards under the Building Code. Resource consent ensures your development complies with planning rules like setbacks, height limits, and environmental effects."
        },
        {
          question: "Do I need resource consent for a deck?",
          answer: "You may need resource consent if your deck exceeds height limits, breaches setback rules, or affects neighbours' privacy. Building consent is typically also required."
        },
        {
          question: "How much does resource consent cost?",
          answer: "Resource consent fees range from $500 for minor applications to $10,000+ for complex developments. Non-notified applications are cheaper than notified ones."
        },
        {
          question: "Can I subdivide my section?",
          answer: "Most subdivision requires resource consent under the Resource Management Act. Some minor boundary adjustments may be exempt."
        }
      ]
    },
    {
      title: "Building Code",
      icon: <BuildingIcon className="h-4 w-4" />,
      items: [
        {
          question: "What is the NZ Building Code?",
          answer: "The Building Code sets minimum standards for building work in New Zealand, covering structural safety, fire safety, weathertightness, energy efficiency, and accessibility."
        },
        {
          question: "Do I need an architect?",
          answer: "You don't always need an architect. Simple projects may only require building plans from a draughtsperson. Complex or large projects typically need architectural and engineering input."
        },
        {
          question: "What building work doesn't need consent?",
          answer: "Exempt work includes painting, minor repairs, carpet/flooring replacement, and small detached buildings under 10m². Schedule 1 of the Building Act lists all exempt building work."
        },
        {
          question: "Can I do my own building work?",
          answer: "Owner-builders can do their own work but must still obtain required consents and use licensed practitioners for restricted work like electrical and gas fitting."
        }
      ]
    },
    {
      title: "Planning & Zoning",
      icon: <SearchIcon className="h-4 w-4" />,
      items: [
        {
          question: "How do I check my property's zoning?",
          answer: "Check your council's online district plan or GIS maps. Zoning determines what you can build and how you can use your land."
        },
        {
          question: "Can I build a granny flat?",
          answer: "This depends on your zoning rules, site coverage limits, parking requirements, and setback rules. Some areas allow minor dwelling units as permitted activities."
        },
        {
          question: "What are setback rules?",
          answer: "Setbacks are minimum distances from property boundaries. They vary by zone but typically range from 1.5m to 6m to prevent overcrowding and protect neighbours' amenity."
        },
        {
          question: "How high can I build?",
          answer: "Height limits vary by zone and location, typically 8-12m in residential areas. Some areas have additional recession plane rules to protect neighbours' sunlight access."
        }
      ]
    }
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img 
              src={logoImage} 
              alt="Can I Build It Logo" 
              className="w-8 h-8"
            />
            <h2 className="font-semibold text-lg">Can I Build It?</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="md:hidden"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Main Navigation */}
        <div className="space-y-1">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={location === item.href ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setIsOpen(false)}
              >
                {item.icon}
                <span className="ml-2">{item.title}</span>
              </Button>
            </Link>
          ))}
        </div>

        {/* Chat History Section - Only for authenticated users */}
        {isAuthenticated && (
          <div className="mt-6">
            <Collapsible open={chatHistoryOpen} onOpenChange={setChatHistoryOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <div className="flex items-center">
                    <HistoryIcon className="h-4 w-4" />
                    <span className="ml-2">Chat History</span>
                  </div>
                  {chatHistoryOpen ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-sm"
                  onClick={handleCreateNewChat}
                  disabled={createSessionMutation.isPending}
                >
                  <PlusIcon className="h-3 w-3 mr-2" />
                  New Chat
                </Button>
                
                {chatLoading ? (
                  <div className="text-sm text-muted-foreground px-2 py-1">
                    Loading chats...
                  </div>
                ) : chatSessions && chatSessions.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {chatSessions.map((session: any) => (
                      <div key={session.id} className="flex items-center group">
                        <Button
                          variant="ghost"
                          className="flex-1 justify-start text-sm truncate"
                          onClick={() => {
                            // Navigate to chat with this session
                            setIsOpen(false);
                          }}
                        >
                          <MessageSquareIcon className="h-3 w-3 mr-2 flex-shrink-0" />
                          <span className="truncate">{session.title}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 p-1 h-6 w-6"
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          disabled={deleteSessionMutation.isPending}
                        >
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground px-2 py-1">
                    No chat history yet
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* About the Creator Section */}
        <div className="mt-6">
          <Collapsible open={aboutOpen} onOpenChange={setAboutOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <div className="flex items-center">
                  <InfoIcon className="h-4 w-4" />
                  <span className="ml-2">About the Creator</span>
                </div>
                {aboutOpen ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2 px-2">
              <div className="text-sm text-muted-foreground bg-muted/50 rounded p-3 leading-relaxed">
                <p className="mb-2">
                  <strong>Can I Build It?</strong> was created to simplify New Zealand's complex building and planning regulations.
                </p>
                <p className="mb-2">Built by a licensed building practitioner who's passionate about making property development accessible to everyone, from first-time renovators to experienced developers.</p>
                <p className="mb-2">
                  Our AI-powered platform combines official building codes, council requirements, and industry expertise to provide instant, reliable guidance.
                </p>
                <p>
                  Have feedback or suggestions? We'd love to hear from you as we continue improving this platform for the New Zealand building community.
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* FAQ Section */}
        <div className="mt-4">
          <Collapsible open={faqOpen} onOpenChange={setFaqOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <div className="flex items-center">
                  <HelpCircleIcon className="h-4 w-4" />
                  <span className="ml-2">Building FAQ's</span>
                </div>
                {faqOpen ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-2">
              {/* FAQ Categories with Expandable Answers */}
              {faqSections.map((section, sectionIndex) => (
                <Collapsible key={sectionIndex}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between ml-4">
                      <div className="flex items-center">
                        {section.icon}
                        <span className="ml-2 text-sm">{section.title}</span>
                      </div>
                      <ChevronRightIcon className="h-3 w-3" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 ml-8">
                    {section.items.map((item, itemIndex) => (
                      <Collapsible key={itemIndex}>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs text-muted-foreground hover:text-foreground p-2"
                          >
                            <span className="text-left">{item.question}</span>
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-2 py-1">
                          <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 leading-relaxed">
                            {item.answer}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* User Authentication Section */}
      <div className="p-4 border-t">
        {isLoading ? (
          <div className="flex items-center justify-center py-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : isAuthenticated && user ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded-lg">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.firstName || user.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.location.href = '/api/logout'}
            >
              <LogOutIcon className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-sm font-medium mb-2">Join Can I Build It?</p>
              <p className="text-xs text-muted-foreground">Save chat history and get personalized advice</p>
            </div>
            
            {/* Email/Password Sign Up */}
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={() => setAuthModalOpen(true)}
            >
              <UserIcon className="h-4 w-4 mr-2" />
              Create Account
            </Button>

            {/* Sign In Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setAuthModalOpen(true)}
            >
              <LogInIcon className="h-4 w-4 mr-2" />
              Sign In
            </Button>

            {/* Alternative Login Options */}
            <div className="space-y-2">
              <p className="text-xs text-center text-muted-foreground">Or continue with Replit</p>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => window.location.href = '/api/login'}
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                Continue with Replit
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                By creating an account, you agree to our terms and privacy policy
              </p>
            </div>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground text-center mt-3">
          AI-powered building advice for New Zealand
        </p>
      </div>

      {/* Authentication Modal */}
      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
        defaultTab="register"
      />
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden"
      >
        <MenuIcon className="h-4 w-4" />
      </Button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-80 bg-background border-r transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:z-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <SidebarContent />
      </div>
    </>
  );
}