#!/usr/bin/env python3
"""
Enhanced PDF processing using LangChain for Auckland Council planning documents
"""
import requests
import tempfile
import os
import json
import sys
import re
from typing import List, Dict, Optional

try:
    from langchain_community.document_loaders import PyPDFLoader
    from langchain_openai import OpenAI
    import PyPDF2
    LANGCHAIN_AVAILABLE = True
except ImportError as e:
    print(f"LangChain dependencies not available: {e}")
    LANGCHAIN_AVAILABLE = False

class AucklandCouncilPDFProcessor:
    """
    Process Auckland Council planning documents using LangChain
    """
    
    def __init__(self, openai_api_key: str = None):
        """Initialize the PDF processor with LangChain components"""
        self.available = PyPDFLoader is not None
        
        if not self.available:
            print("LangChain not available, using basic processing")
            return
            
        try:
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                length_function=len,
            )
            self.pdf_content = {}  # Store extracted content
            
            if openai_api_key:
                self.llm = OpenAI(
                    temperature=0,
                    api_key=openai_api_key
                )
            else:
                self.llm = None
                
        except Exception as e:
            print(f"Error initializing LangChain components: {e}")
            self.available = False
    
    def get_zone_pdf_urls(self) -> Dict[str, str]:
        """
        Auckland Council zone PDF URLs
        """
        return {
            "H3": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H3%20Residential%20-%20Single%20House%20Zone.pdf",
            "H4": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H4%20Residential%20-%20Mixed%20Housing%20Suburban%20Zone.pdf",
            "H5": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H5%20Residential%20-%20Mixed%20Housing%20Urban%20Zone.pdf",
            "H6": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H6%20Residential%20-%20Terrace%20Housing%20and%20Apartment%20Buildings%20Zone.pdf",
            "H7": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H7%20Residential%20-%20Apartment%20Buildings%20Zone.pdf",
            "H8": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H8%20Residential%20-%20Large%20Lot%20Zone.pdf",
            "H9": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20H%20Zones/H9%20Residential%20-%20Rural%20and%20Coastal%20Settlement%20Zone.pdf",
            "I1": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20I%20Zones/I1%20Business%20-%20City%20Centre%20Zone.pdf",
            "I2": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20I%20Zones/I2%20Business%20-%20Metropolitan%20Centre%20Zone.pdf",
            "I3": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20I%20Zones/I3%20Business%20-%20Town%20Centre%20Zone.pdf",
            "I4": "https://unitaryplan.aucklandcouncil.govt.nz/images/Auckland%20Unitary%20Plan%20Operative/Chapter%20I%20Zones/I4%20Business%20-%20Local%20Centre%20Zone.pdf",
        }
    
    def load_pdf_from_url(self, pdf_url: str) -> List:
        """
        Load and process PDF from URL using temporary file
        """
        if not self.available:
            return []
            
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
            
            # Split documents into chunks
            chunks = self.text_splitter.split_documents(documents)
            
            return chunks
            
        except Exception as e:
            print(f"Error loading PDF from {pdf_url}: {str(e)}")
            return []
    
    def create_vector_store(self, zone_code: str) -> bool:
        """
        Create and cache vector store for a zone
        """
        if not self.available:
            return False
            
        if zone_code in self.vector_stores:
            return True
        
        zone_urls = self.get_zone_pdf_urls()
        if zone_code not in zone_urls:
            return False
        
        print(f"Creating vector store for zone {zone_code}...")
        
        # Load and process PDF
        documents = self.load_pdf_from_url(zone_urls[zone_code])
        
        if not documents:
            return False
        
        try:
            # Create vector store
            vector_store = FAISS.from_documents(documents, self.embeddings)
            self.vector_stores[zone_code] = vector_store
            print(f"Vector store created for zone {zone_code} with {len(documents)} chunks")
            return True
        except Exception as e:
            print(f"Error creating vector store for zone {zone_code}: {e}")
            return False
    
    def query_zone_planning_rules(self, zone_code: str, query: str) -> Optional[str]:
        """
        Query specific zone planning rules using RAG
        """
        if not self.available or not self.llm:
            return None
            
        if zone_code not in self.vector_stores:
            if not self.create_vector_store(zone_code):
                return None
        
        try:
            # Create retrieval chain
            qa_chain = RetrievalQA.from_chain_type(
                llm=self.llm,
                chain_type="stuff",
                retriever=self.vector_stores[zone_code].as_retriever(search_kwargs={"k": 3}),
                return_source_documents=True
            )
            
            # Execute query
            result = qa_chain({"query": query})
            return result["result"]
            
        except Exception as e:
            print(f"Error querying zone {zone_code}: {e}")
            return None
    
    def get_zone_building_rules(self, zone_code: str) -> Optional[str]:
        """
        Get specific building rules for a zone
        """
        query = f"""
        What are the specific building rules, height restrictions, site coverage limits, 
        and setback requirements for zone {zone_code}? Please provide exact measurements 
        and percentages where available.
        """
        
        return self.query_zone_planning_rules(zone_code, query)
    
    def get_zone_consent_requirements(self, zone_code: str, building_type: str = "garage") -> Optional[str]:
        """
        Get consent requirements for specific building types in a zone
        """
        query = f"""
        What consent requirements apply for building a {building_type} in zone {zone_code}? 
        When is a building consent required versus a resource consent? What are the 
        permitted activity standards?
        """
        
        return self.query_zone_planning_rules(zone_code, query)


def main():
    """
    Command line interface for PDF processing
    """
    if len(sys.argv) < 3:
        print("Usage: python langchain-pdf-rag.py <zone_code> <query>")
        sys.exit(1)
    
    zone_code = sys.argv[1]
    query = " ".join(sys.argv[2:])
    
    # Get OpenAI API key from environment
    openai_api_key = os.environ.get("OPENAI_API_KEY")
    if not openai_api_key:
        print("Error: OPENAI_API_KEY environment variable not set")
        sys.exit(1)
    
    processor = AucklandCouncilPDFProcessor(openai_api_key)
    
    if not processor.available:
        print("Error: LangChain dependencies not available")
        sys.exit(1)
    
    result = processor.query_zone_planning_rules(zone_code, query)
    
    if result:
        response = {
            "success": True,
            "zone_code": zone_code,
            "query": query,
            "result": result
        }
    else:
        response = {
            "success": False,
            "zone_code": zone_code,
            "query": query,
            "error": "Failed to process query"
        }
    
    print(json.dumps(response, indent=2))


if __name__ == "__main__":
    main()