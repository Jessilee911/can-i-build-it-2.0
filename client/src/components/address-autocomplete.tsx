import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';

interface AddressOption {
  id: string;
  fullAddress: string;
  streetNumber?: string;
  streetName: string;
  suburb: string;
  city: string;
  postcode: string;
  region: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onSelect?: (addressOption: AddressOption) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export function AddressAutocomplete({ 
  value, 
  onChange, 
  onSelect, 
  placeholder = "Enter New Zealand address...",
  className = "",
  required = false 
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value.length >= 3) {
        searchAddresses(value);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  const searchAddresses = async (query: string) => {
    setIsLoading(true);
    try {
      // Use LINZ Data Service API for New Zealand addresses
      const response = await fetch(`/api/search-addresses?q=${encodeURIComponent(query)}`);
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
        setHighlightedIndex(-1);
      } else {
        // Fallback to local fuzzy matching if API is unavailable
        const localSuggestions = performLocalSearch(query);
        setSuggestions(localSuggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Address search error:', error);
      // Fallback to local search
      const localSuggestions = performLocalSearch(query);
      setSuggestions(localSuggestions);
      setShowSuggestions(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Local fallback with common NZ addresses for demonstration
  const performLocalSearch = (query: string): AddressOption[] => {
    const commonNZAddresses = [
      { streetName: 'Queen Street', suburb: 'Auckland Central', city: 'Auckland', postcode: '1010', region: 'Auckland' },
      { streetName: 'Lambton Quay', suburb: 'Wellington Central', city: 'Wellington', postcode: '6011', region: 'Wellington' },
      { streetName: 'Cashel Street', suburb: 'Christchurch Central', city: 'Christchurch', postcode: '8011', region: 'Canterbury' },
      { streetName: 'George Street', suburb: 'Dunedin Central', city: 'Dunedin', postcode: '9016', region: 'Otago' },
      { streetName: 'Victoria Street', suburb: 'Hamilton Central', city: 'Hamilton', postcode: '3204', region: 'Waikato' },
      { streetName: 'Devonport Road', suburb: 'Tauranga', city: 'Tauranga', postcode: '3110', region: 'Bay of Plenty' },
      { streetName: 'Riccarton Road', suburb: 'Riccarton', city: 'Christchurch', postcode: '8041', region: 'Canterbury' },
      { streetName: 'Great South Road', suburb: 'Newmarket', city: 'Auckland', postcode: '1023', region: 'Auckland' },
      { streetName: 'Manukau Road', suburb: 'Epsom', city: 'Auckland', postcode: '1023', region: 'Auckland' },
      { streetName: 'Cuba Street', suburb: 'Wellington Central', city: 'Wellington', postcode: '6011', region: 'Wellington' }
    ];

    const lowerQuery = query.toLowerCase();
    return commonNZAddresses
      .filter(addr => 
        addr.streetName.toLowerCase().includes(lowerQuery) ||
        addr.suburb.toLowerCase().includes(lowerQuery) ||
        addr.city.toLowerCase().includes(lowerQuery) ||
        addr.postcode.includes(lowerQuery)
      )
      .map((addr, index) => ({
        id: `local-${index}`,
        fullAddress: `${addr.streetName}, ${addr.suburb}, ${addr.city} ${addr.postcode}`,
        streetName: addr.streetName,
        suburb: addr.suburb,
        city: addr.city,
        postcode: addr.postcode,
        region: addr.region
      }))
      .slice(0, 6);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setHighlightedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: AddressOption) => {
    onChange(suggestion.fullAddress);
    onSelect?.(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Scroll highlighted suggestion into view
  useEffect(() => {
    if (highlightedIndex >= 0 && suggestionRefs.current[highlightedIndex]) {
      suggestionRefs.current[highlightedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [highlightedIndex]);

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length >= 3 && setShowSuggestions(true)}
          onBlur={() => {
            // Delay hiding suggestions to allow for clicks
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          placeholder={placeholder}
          className={`pl-10 pr-10 ${className}`}
          required={required}
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              ref={el => suggestionRefs.current[index] = el}
              className={`px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                index === highlightedIndex ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.streetName}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {suggestion.suburb}, {suggestion.city} {suggestion.postcode}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSuggestions && suggestions.length === 0 && !isLoading && value.length >= 3 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="text-sm text-gray-500 text-center">
            No addresses found. Please check your spelling or try a different search.
          </div>
        </div>
      )}
    </div>
  );
}