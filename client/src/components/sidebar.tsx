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
  ShieldCheckIcon,
  SearchIcon,
  BuildingIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const [faqOpen, setFaqOpen] = useState(false);

  const navigationItems = [
    {
      title: "Home",
      href: "/",
      icon: <HomeIcon className="h-4 w-4" />
    },
    {
      title: "Chat Assistant",
      href: "/chat",
      icon: <MessageSquareIcon className="h-4 w-4" />
    },
    {
      title: "Pricing",
      href: "/pricing",
      icon: <CreditCardIcon className="h-4 w-4" />
    }
  ];

  const faqSections = [
    {
      title: "Building Consent",
      icon: <FileTextIcon className="h-4 w-4" />,
      items: [
        "Do I need building consent?",
        "Building consent costs",
        "Application timeline",
        "Without consent penalties"
      ]
    },
    {
      title: "Resource Consent", 
      icon: <ShieldCheckIcon className="h-4 w-4" />,
      items: [
        "Building vs Resource consent",
        "Deck additions",
        "Subdivision process",
        "Permitted activities"
      ]
    },
    {
      title: "Building Code",
      icon: <BuildingIcon className="h-4 w-4" />,
      items: [
        "NZ Building Code",
        "Architect requirements",
        "Exempt building work",
        "Owner-builder rules"
      ]
    },
    {
      title: "Planning & Zoning",
      icon: <SearchIcon className="h-4 w-4" />,
      items: [
        "Property zoning check",
        "Granny flat rules",
        "Setback requirements",
        "Height restrictions"
      ]
    }
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Can I Build It?</h2>
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

        {/* FAQ Section */}
        <div className="mt-6">
          <Collapsible open={faqOpen} onOpenChange={setFaqOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <div className="flex items-center">
                  <HelpCircleIcon className="h-4 w-4" />
                  <span className="ml-2">Building FAQ</span>
                </div>
                {faqOpen ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-2">
              {/* All FAQ Link */}
              <Link href="/faq">
                <Button
                  variant={location === "/faq" ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start ml-6"
                  onClick={() => setIsOpen(false)}
                >
                  <span>View All FAQ</span>
                </Button>
              </Link>
              
              {/* FAQ Categories */}
              {faqSections.map((section, index) => (
                <div key={index} className="ml-4">
                  <div className="flex items-center py-1 px-2 text-sm font-medium text-muted-foreground">
                    {section.icon}
                    <span className="ml-2">{section.title}</span>
                  </div>
                  {section.items.map((item, itemIndex) => (
                    <Link key={itemIndex} href="/faq">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start ml-4 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setIsOpen(false)}
                      >
                        {item}
                      </Button>
                    </Link>
                  ))}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          AI-powered building advice for New Zealand
        </p>
      </div>
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