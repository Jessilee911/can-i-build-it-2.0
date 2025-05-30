#!/usr/bin/env python3
"""
Simple PDF processor for Auckland Council planning documents
"""
import requests
import tempfile
import os
import json
import sys
import re
from typing import Dict, Optional

try:
    from langchain_community.document_loaders import PyPDFLoader
    from langchain_openai import OpenAI
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False

class SimplePDFProcessor:
    """
    Extract planning information from Auckland Council PDF documents
    """
    
    def __init__(self, openai_api_key: str = None):
        """Initialize the processor"""
        self.available = LANGCHAIN_AVAILABLE
        self.llm = None
        
        if self.available and openai_api_key:
            try:
                self.llm = OpenAI(api_key=openai_api_key, temperature=0)
            except Exception as e:
                print(f"Error initializing OpenAI: {e}")
                self.llm = None
    
    def get_zone_pdf_urls(self) -> Dict[str, str]:
        """Auckland Council zone PDF URLs"""
        return {
            # H - ZONES (Residential, Business, Rural)
            "H1": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H1%20Residential%20-%20Large%20Lot%20Zone.pdf",
            "H2": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H2%20Residential%20-%20Rural%20and%20Coastal%20Settlement%20Zone.pdf",
            "H3": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H3%20Residential%20-%20Single%20House%20Zone.pdf",
            "H4": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H4%20Residential%20-%20Mixed%20Housing%20Suburban%20Zone.pdf",
            "H5": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H5%20Residential%20-%20Mixed%20Housing%20Urban%20Zone.pdf",
            "H6": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H6%20Residential%20-%20Terrace%20Housing%20and%20Apartment%20Buildings%20Zone.pdf",
            "H7": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H7%20Open%20Space%20zones.pdf",
            "H8": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H8%20Business%20-%20City%20Centre%20Zone.pdf",
            "H9": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H9%20Business%20-%20Metropolitan%20Centre%20Zone.pdf",
            "H10": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H10%20Business%20-%20Town%20Centre%20Zone.pdf",
            "H11": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H11%20Business%20-%20Local%20Centre%20Zone.pdf",
            "H12": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H12%20Business%20-%20Neighbourhood%20Centre%20Zone.pdf",
            "H13": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H13%20Business%20-%20Mixed%20Use%20Zone.pdf",
            "H14": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H14%20Business%20-%20General%20Business%20Zone.pdf",
            "H15": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H15%20Business%20-%20Business%20Park%20Zone.pdf",
            "H16": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H16%20Business%20-%20Heavy%20Industry%20Zone.pdf",
            "H17": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H17%20Business%20-%20Light%20Industry%20Zone.pdf",
            "H18": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H18%20Future%20Urban%20Zone.pdf",
            "H19": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H19%20Rural%20zones.pdf",
            
            # D - OVERLAYS (Historic Heritage and Special Character)
            "D17": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20D%20Overlays/3.%20Built%20Heritage%20and%20Character/D17%20Historic%20Heritage%20Overlay.pdf",
            "D18": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20D%20Overlays/3.%20Built%20Heritage%20and%20Character/D18%20Special%20Character%20Areas%20Overlay%20-%20Residential%20and%20Business.pdf",
            "D19": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20D%20Overlays/3.%20Built%20Heritage%20and%20Character/D19%20Auckland%20War%20Memorial%20Museum%20Viewshaft%20Overlay.pdf",
            "D20A": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20D%20Overlays/3.%20Built%20Heritage%20and%20Character/D20A%20Stockade%20Hill%20Viewshaft%20Overlay.pdf",
        }
    
    def extract_pdf_text(self, pdf_url: str) -> Optional[str]:
        """Extract text from PDF using LangChain"""
        if not self.available:
            return None
            
        try:
            # Download PDF to temporary file
            response = requests.get(pdf_url, timeout=30)
            response.raise_for_status()
            
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                tmp_file.write(response.content)
                tmp_file_path = tmp_file.name
            
            # Load PDF using LangChain
            loader = PyPDFLoader(tmp_file_path)
            documents = loader.load()
            
            # Clean up temporary file
            os.unlink(tmp_file_path)
            
            # Combine all document text
            full_text = "\n".join([doc.page_content for doc in documents])
            return full_text
            
        except Exception as e:
            print(f"Error extracting PDF text: {e}")
            return None
    
    def query_zone_with_ai(self, zone_code: str, query: str) -> Optional[str]:
        """Query zone using AI with extracted PDF content"""
        if not self.llm:
            return None
            
        zone_urls = self.get_zone_pdf_urls()
        if zone_code not in zone_urls:
            return None
        
        # Extract PDF content
        pdf_text = self.extract_pdf_text(zone_urls[zone_code])
        if not pdf_text:
            return None
        
        # Limit text to avoid token limits (keep first 8000 characters)
        pdf_text = pdf_text[:8000]
        
        try:
            prompt = f"""
Based on the following Auckland Council planning document for zone {zone_code}, please answer this question: {query}

Planning Document Content:
{pdf_text}

Please provide specific information from the document, including exact measurements, percentages, and requirements where available. Focus on building rules, height restrictions, site coverage, setbacks, and consent requirements.
"""
            
            response = self.llm.invoke(prompt)
            return response
            
        except Exception as e:
            print(f"Error querying AI: {e}")
            return None
    
    def get_zone_building_rules(self, zone_code: str) -> Optional[str]:
        """Get building rules for a zone"""
        query = "What are the specific building rules, height restrictions, site coverage limits, and setback requirements? Provide exact measurements and percentages."
        return self.query_zone_with_ai(zone_code, query)
    
    def get_zone_consent_requirements(self, zone_code: str, building_type: str = "garage") -> Optional[str]:
        """Get consent requirements for building types"""
        query = f"What consent requirements apply for building a {building_type}? When is building consent required vs resource consent? What are the permitted activity standards?"
        return self.query_zone_with_ai(zone_code, query)


def main():
    """Command line interface"""
    if len(sys.argv) < 3:
        print("Usage: python simple-pdf-processor.py <zone_code> <query>")
        sys.exit(1)
    
    zone_code = sys.argv[1]
    query = " ".join(sys.argv[2:])
    
    openai_api_key = os.environ.get("OPENAI_API_KEY")
    if not openai_api_key:
        print(json.dumps({
            "success": False,
            "error": "OPENAI_API_KEY environment variable not set"
        }))
        sys.exit(1)
    
    processor = SimplePDFProcessor(openai_api_key)
    
    if not processor.available:
        print(json.dumps({
            "success": False,
            "error": "LangChain dependencies not available"
        }))
        sys.exit(1)
    
    result = processor.query_zone_with_ai(zone_code, query)
    
    response = {
        "success": result is not None,
        "zone_code": zone_code,
        "query": query,
        "result": result,
        "error": "Failed to process query" if result is None else None
    }
    
    print(json.dumps(response, indent=2))


if __name__ == "__main__":
    main()