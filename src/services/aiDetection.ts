import type { DetectionResult, TextCharacteristics } from '../types/detection';
import { processApiResponse } from '../utils/responseProcessor';
import { ApiError, getErrorMessage } from '../utils/errorHandler';
import { OPENROUTER_CONFIG } from '../config/openrouter';
import { analyzeTextCharacteristics } from './textAnalysis';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 5,
  initialDelay: number = 2000
): Promise<T> {
  let attempt = 1;
  let currentDelay = initialDelay;

  while (attempt <= maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      console.log(`Attempt ${attempt} failed, retrying in ${currentDelay}ms...`);
      await delay(currentDelay);
      
      attempt++;
      currentDelay *= 2; // Exponential backoff
    }
  }

  throw new ApiError('Maximum retry attempts reached');
}

async function makeOpenRouterRequest(prompt: string): Promise<string> {
  try {
    const response = await fetch(OPENROUTER_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_CONFIG.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'AI Authorship Verification'
      },
      body: JSON.stringify({
        model: OPENROUTER_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: OPENROUTER_CONFIG.systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new ApiError(
        errorData.error?.message || errorData.message || 'Failed to analyze text',
        errorData.error?.code,
        response.status
      );
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      throw new ApiError('Invalid API response format');
    }

    return data.choices[0].message.content;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error instanceof Error ? error.message : 'Failed to analyze text');
  }
}

export async function analyzeText(text: string): Promise<DetectionResult> {
  if (!text.trim()) {
    throw new ApiError('Please provide text to analyze');
  }

  try {
    const characteristics = analyzeTextCharacteristics(text);

    const prompt = `Text characteristics analysis:
- Historical language: ${characteristics.hasHistoricalLanguage ? 'Yes' : 'No'}
- Complex metaphors: ${characteristics.hasComplexMetaphors ? 'Yes' : 'No'}
- Emotional depth: ${characteristics.hasEmotionalDepth ? 'Yes' : 'No'}
- Irregular structure: ${characteristics.hasIrregularStructure ? 'Yes' : 'No'}
- Unique imagery: ${characteristics.hasUniqueImagery ? 'Yes' : 'No'}
- Modern language: ${characteristics.isModernLanguage ? 'Yes' : 'No'}

Text to analyze:
"""
${text}
"""

Provide your analysis following the exact format specified.`;

    const content = await retryWithBackoff(() => makeOpenRouterRequest(prompt));
    return processApiResponse(content);
  } catch (error) {
    console.error('AI Detection error:', error);
    throw new ApiError(getErrorMessage(error));
  }
}