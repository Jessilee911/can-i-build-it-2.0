import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SearchIcon, HomeIcon, FileTextIcon, ShieldCheckIcon } from "lucide-react";

export default function FAQPage() {
  const faqCategories = [
    {
      category: "Building Consent",
      icon: <FileTextIcon className="h-6 w-6" />,
      questions: [
        {
          question: "Do I need building consent for my renovation in New Zealand?",
          answer: "Building consent is required for most alterations that change the structure, add floor area, or affect building systems like plumbing and electrical. Minor cosmetic changes like painting or carpet replacement typically don't require consent. Our AI advisor can assess your specific project."
        },
        {
          question: "How much does building consent cost in New Zealand?",
          answer: "Building consent fees vary by council and project complexity, typically ranging from $1,500 to $15,000+. Costs include application fees, inspections, and processing. Get an estimate based on your project scope with our comprehensive assessment."
        },
        {
          question: "How long does building consent take to approve?",
          answer: "Standard building consent applications take 20 working days once all required information is submitted. Complex projects may take longer. Pre-application meetings can help streamline the process."
        },
        {
          question: "Can I start building without consent approval?",
          answer: "No, you cannot legally start building work that requires consent before approval. Doing so can result in stop-work notices, fines, and difficulties selling your property. Always obtain consent before starting."
        },
        {
          question: "What happens if I build without consent in NZ?",
          answer: "Building without required consent can result in prosecution, fines up to $200,000, demolition orders, and problems when selling. You may need to apply for retrospective consent, which is more expensive and complex."
        }
      ]
    },
    {
      category: "Resource Consent",
      icon: <ShieldCheckIcon className="h-6 w-6" />,
      questions: [
        {
          question: "What is the difference between building consent and resource consent?",
          answer: "Building consent ensures your building meets safety standards under the Building Code. Resource consent (from district/regional councils) ensures your development complies with planning rules like setbacks, height limits, and environmental effects."
        },
        {
          question: "Do I need resource consent for a deck addition?",
          answer: "You may need resource consent if your deck exceeds height limits, breaches setback rules, or affects neighbours' privacy. Building consent is typically also required. Check your local district plan rules."
        },
        {
          question: "How much does resource consent cost in New Zealand?",
          answer: "Resource consent fees range from $500 for minor applications to $10,000+ for complex developments. Non-notified applications are cheaper than notified ones that require public consultation."
        },
        {
          question: "Can I subdivide my section without resource consent?",
          answer: "Most subdivision requires resource consent under the Resource Management Act. Some minor boundary adjustments may be exempt. The process includes surveying, engineering plans, and council approval."
        },
        {
          question: "What is a permitted activity under the district plan?",
          answer: "Permitted activities comply with all district plan rules and don't need resource consent. They must still meet conditions like height limits, setbacks, and site coverage rules. Building consent may still be required."
        }
      ]
    },
    {
      category: "Building Code & Standards",
      icon: <HomeIcon className="h-6 w-6" />,
      questions: [
        {
          question: "What is the New Zealand Building Code?",
          answer: "The Building Code sets minimum standards for building work in New Zealand, covering structural safety, fire safety, weathertightness, energy efficiency, and accessibility. All building work must comply with these standards."
        },
        {
          question: "Do I need an architect for building consent?",
          answer: "You don't always need an architect. Simple projects may only require building plans from a draughtsperson. Complex or large projects typically need architectural and engineering input for Building Code compliance."
        },
        {
          question: "What building work doesn't need consent in NZ?",
          answer: "Exempt work includes painting, minor repairs, carpet/flooring replacement, and small detached buildings under 10m². Schedule 1 of the Building Act lists all exempt building work."
        },
        {
          question: "Can I do my own building work in New Zealand?",
          answer: "Owner-builders can do their own work but must still obtain required consents and use licensed practitioners for restricted work like electrical and gas fitting. You're responsible for Building Code compliance."
        },
        {
          question: "What is a Code Compliance Certificate (CCC)?",
          answer: "A CCC confirms that building work complies with the Building Code and consent conditions. You cannot legally occupy or use the building until the council issues the CCC after final inspections."
        }
      ]
    },
    {
      category: "Planning & Zoning",
      icon: <SearchIcon className="h-6 w-6" />,
      questions: [
        {
          question: "How do I check my property's zoning in New Zealand?",
          answer: "Check your council's online district plan or GIS maps. Zoning determines what you can build and how you can use your land. Common zones include residential, commercial, rural, and mixed-use."
        },
        {
          question: "Can I build a granny flat on my property?",
          answer: "This depends on your zoning rules, site coverage limits, parking requirements, and setback rules. Some areas allow minor dwelling units as permitted activities, others require resource consent."
        },
        {
          question: "What are setback rules for building in NZ?",
          answer: "Setbacks are minimum distances from property boundaries. They vary by zone but typically range from 1.5m to 6m. Setback rules prevent overcrowding and protect neighbours' amenity and privacy."
        },
        {
          question: "How high can I build on my property?",
          answer: "Height limits vary by zone and location, typically 8-12m in residential areas. Some areas have additional recession plane rules that limit building height near boundaries to protect neighbours' sunlight access."
        },
        {
          question: "What is site coverage and how much am I allowed?",
          answer: "Site coverage is the percentage of your section covered by buildings and hard surfaces. Limits vary by zone, typically 35-50% in residential areas. This includes houses, garages, driveways, and large decks."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              New Zealand Building Consent & Resource Consent FAQ
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Get instant answers to the most asked questions about building consents, resource consents, and NZ Building Code compliance
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Building Consent Expert
              </Badge>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Resource Consent Guide
              </Badge>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                NZ Building Code
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Everything You Need to Know About Building in New Zealand
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Navigate building consents, resource consents, and planning requirements with confidence. 
              Get expert AI-powered advice for your property development project.
            </p>
          </div>

          {/* FAQ Categories */}
          <div className="grid gap-8">
            {faqCategories.map((category, categoryIndex) => (
              <Card key={categoryIndex} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50">
                  <div className="flex items-center gap-3">
                    {category.icon}
                    <CardTitle className="text-2xl">{category.category}</CardTitle>
                  </div>
                  <CardDescription className="text-lg">
                    Common questions and expert answers about {category.category.toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((faq, index) => (
                      <AccordionItem key={index} value={`${categoryIndex}-${index}`} className="px-6">
                        <AccordionTrigger className="text-left font-medium hover:text-blue-600">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-white text-center">
            <h3 className="text-3xl font-bold mb-4">
              Need Specific Advice for Your Property?
            </h3>
            <p className="text-xl mb-6 opacity-90">
              Get personalized building consent and resource consent guidance with our AI-powered property advisor
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-blue-600">
                Start Free Assessment
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                View Pricing Plans
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}