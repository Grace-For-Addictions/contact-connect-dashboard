import React, { useState, useCallback } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { db } from '@/api/client';
import { AlertCircle, Sparkles, Check } from 'lucide-react';
import { debounce } from 'lodash';

const STIGMA_MAP = {
  'addict': 'person in recovery',
  'junkie': 'person in recovery',
  'alcoholic': 'person with alcohol use disorder',
  'drug abuser': 'person who uses substances',
  'substance abuser': 'person who uses substances',
  'relapse': 'recurrence',
  'slip-up': 'setback',
  'clean': 'substance-free',
  'dirty': 'resumption of use',
  'dirty urine': 'positive test result',
  'clean time': 'time in recovery',
  'enabling': 'supporting',
  'codependent': 'supportive relationship',
  'detox': 'withdrawal management',
  'opioid replacement': 'medication for opioid use disorder',
  'MAT': 'MOUD',
  'methadone clinic': 'medication-assisted treatment program',
  'halfway house': 'recovery residence',
  'drug seeker': 'person seeking pain management',
  'non-compliant': 'not following treatment plan',
  'committed': 'admitted to treatment',
  'institutionalized': 'receiving residential care'
};

export default function GracefulTextarea({ 
  value, 
  onChange, 
  placeholder,
  rows = 4,
  className = '',
  label,
  enableAI = true,
  ...props 
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzedValue, setLastAnalyzedValue] = useState('');

  const analyzeText = useCallback(
    debounce(async (text) => {
      if (!enableAI || !text || text === lastAnalyzedValue || text.length < 10) {
        setSuggestions([]);
        return;
      }

      setIsAnalyzing(true);
      try {
        // First, do local pattern matching
        const localSuggestions = [];
        const lowerText = text.toLowerCase();
        
        Object.entries(STIGMA_MAP).forEach(([stigma, alternative]) => {
          const regex = new RegExp(`\\b${stigma}\\b`, 'gi');
          if (regex.test(lowerText)) {
            localSuggestions.push({
              original: stigma,
              suggestion: alternative,
              reason: 'person-first language',
              type: 'local'
            });
          }
        });

        // Then, use AI for more nuanced analysis
        if (localSuggestions.length === 0 && text.split(' ').length > 10) {
          const prompt = `Analyze this text for stigmatizing or deficit-based language related to addiction recovery. Identify any phrases that could be reframed using person-first, grace-based language.

Text: "${text}"

Common patterns to watch for:
- Identity-first language (e.g., "addict" → "person in recovery")
- Negative framing (e.g., "relapse" → "recurrence" or "setback")
- Clinical jargon that lacks dignity (e.g., "clean/dirty" → "substance-free/resumption of use")
- Judgment-laden terms (e.g., "enabling" → "supporting recovery")

Return JSON array of suggestions with: original_phrase, suggested_alternative, reason. Only include actual issues found, return empty array if text is appropriate.`;

          const response = await db.integrations.Core.InvokeLLM({
            prompt: prompt,
            response_json_schema: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      original_phrase: { type: "string" },
                      suggested_alternative: { type: "string" },
                      reason: { type: "string" }
                    }
                  }
                }
              }
            }
          });

          if (response.suggestions && response.suggestions.length > 0) {
            response.suggestions.forEach(s => {
              localSuggestions.push({
                original: s.original_phrase,
                suggestion: s.suggested_alternative,
                reason: s.reason,
                type: 'ai'
              });
            });
          }
        }

        setSuggestions(localSuggestions);
        setLastAnalyzedValue(text);
      } catch (error) {
        console.error('Language analysis failed:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 1500),
    [enableAI, lastAnalyzedValue]
  );

  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(e);
    analyzeText(newValue);
  };

  const applySuggestion = (suggestion) => {
    const newValue = value.replace(
      new RegExp(`\\b${suggestion.original}\\b`, 'gi'),
      suggestion.suggestion
    );
    onChange({ target: { value: newValue } });
    setSuggestions(suggestions.filter(s => s.original !== suggestion.original));
  };

  const dismissSuggestion = (suggestion) => {
    setSuggestions(suggestions.filter(s => s.original !== suggestion.original));
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">{label}</label>
          {enableAI && (
            <Badge variant="outline" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Grace-based AI
            </Badge>
          )}
        </div>
      )}
      
      <Textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        className={className}
        {...props}
      />

      {isAnalyzing && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          Analyzing language...
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((suggestion, idx) => (
            <Card key={idx} className="p-3 border-amber-200 bg-amber-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">
                    Consider using <strong className="text-[#24A6A0]">"{suggestion.suggestion}"</strong> instead of{' '}
                    <span className="line-through text-slate-500">"{suggestion.original}"</span>
                  </p>
                  <p className="text-xs text-slate-600 mt-1">{suggestion.reason}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => applySuggestion(suggestion)}
                    className="h-7 px-2 text-xs hover:bg-green-100"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => dismissSuggestion(suggestion)}
                    className="h-7 px-2 text-xs"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}