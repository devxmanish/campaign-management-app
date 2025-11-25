import { config } from '../config';
import { BadRequestError } from '../utils/errors';

interface GeneratedQuestion {
  questionText: string;
  type: 'TEXT' | 'PARAGRAPH' | 'MULTIPLE_CHOICE' | 'CHECKBOX' | 'RATING' | 'NUMBER';
  options?: { choices?: string[] };
  required: boolean;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

export class AIService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  constructor() {
    this.apiKey = config.geminiApiKey || '';
  }

  /**
   * Generate survey questions using Gemini AI
   */
  async generateQuestions(
    topic: string,
    numberOfQuestions: number = 5,
    questionTypes?: string[]
  ): Promise<GeneratedQuestion[]> {
    if (!this.apiKey) {
      throw new BadRequestError('Gemini API key is not configured');
    }

    const allowedTypes = questionTypes?.length 
      ? questionTypes 
      : ['TEXT', 'MULTIPLE_CHOICE', 'RATING', 'CHECKBOX'];

    const prompt = `Generate ${numberOfQuestions} survey questions about "${topic}".

Return the questions in this exact JSON format (no markdown, just pure JSON array):
[
  {
    "questionText": "The question text here",
    "type": "MULTIPLE_CHOICE",
    "options": { "choices": ["Option 1", "Option 2", "Option 3", "Option 4"] },
    "required": true
  }
]

Rules:
1. Use only these question types: ${allowedTypes.join(', ')}
2. For MULTIPLE_CHOICE and CHECKBOX types, include 3-5 options in the "options.choices" array
3. For TEXT, PARAGRAPH, RATING, and NUMBER types, do not include the "options" field
4. RATING questions should ask users to rate something on a scale
5. Make questions clear, professional, and relevant to the topic
6. Vary the question types for better survey experience
7. Set "required" to true for important questions, false for optional ones
8. Return ONLY the JSON array, no additional text or markdown`;

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Gemini API error:', errorData);
        throw new BadRequestError('Failed to generate questions with AI');
      }

      const data = await response.json() as GeminiResponse;
      
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textContent) {
        throw new BadRequestError('No response from AI');
      }

      // Clean up the response - remove markdown code blocks if present
      let cleanedContent = textContent.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.slice(7);
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.slice(3);
      }
      if (cleanedContent.endsWith('```')) {
        cleanedContent = cleanedContent.slice(0, -3);
      }
      cleanedContent = cleanedContent.trim();

      // Parse the JSON response
      const questions: GeneratedQuestion[] = JSON.parse(cleanedContent);

      // Validate and clean up the questions
      return questions.map((q, index) => ({
        questionText: q.questionText || `Question ${index + 1}`,
        type: this.validateQuestionType(q.type),
        options: q.type === 'MULTIPLE_CHOICE' || q.type === 'CHECKBOX' 
          ? { choices: q.options?.choices || ['Option 1', 'Option 2', 'Option 3'] }
          : undefined,
        required: typeof q.required === 'boolean' ? q.required : true,
      }));
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      console.error('AI generation error:', error);
      throw new BadRequestError('Failed to parse AI-generated questions');
    }
  }

  /**
   * Generate a campaign description using AI
   */
  async generateDescription(title: string): Promise<string> {
    if (!this.apiKey) {
      throw new BadRequestError('Gemini API key is not configured');
    }

    const prompt = `Write a brief, professional description (2-3 sentences) for a survey/campaign titled "${title}". 
The description should explain the purpose of the survey and encourage participation.
Return only the description text, no quotes or additional formatting.`;

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 256,
          },
        }),
      });

      if (!response.ok) {
        throw new BadRequestError('Failed to generate description with AI');
      }

      const data = await response.json() as GeminiResponse;
      const description = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      
      return description || 'Help us gather valuable insights by completing this survey.';
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      console.error('AI description generation error:', error);
      throw new BadRequestError('Failed to generate description');
    }
  }

  private validateQuestionType(type: string): GeneratedQuestion['type'] {
    const validTypes: GeneratedQuestion['type'][] = [
      'TEXT', 'PARAGRAPH', 'MULTIPLE_CHOICE', 'CHECKBOX', 'RATING', 'NUMBER'
    ];
    
    const upperType = type?.toUpperCase() as GeneratedQuestion['type'];
    return validTypes.includes(upperType) ? upperType : 'TEXT';
  }
}

export const aiService = new AIService();
