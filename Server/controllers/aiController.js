import dotenv from 'dotenv';

dotenv.config();

// Simple mock fallback function in case the API key is not configured or fails
const getMockSuggestion = (title) => {
  const titleLower = title.toLowerCase();
  let priority = 'Medium';
  let description = `This is a generated description for "${title}". Please verify and update task details.`;

  if (titleLower.includes('urgent') || titleLower.includes('asap') || titleLower.includes('fix') || titleLower.includes('error') || titleLower.includes('broken')) {
    priority = 'High';
    description = `Critical task to address immediate requirements: ${title}. High priority to resolve roadblocks quickly.`;
  } else if (titleLower.includes('buy') || titleLower.includes('read') || titleLower.includes('optional') || titleLower.includes('study') || titleLower.includes('learn')) {
    priority = 'Low';
    description = `Routine review task: "${title}". Can be completed in leisure time or when higher priority items are complete.`;
  } else {
    description = `Standard follow-up: "${title}". Ensure to organize necessary resources and schedule time for completion.`;
  }

  return { description, priority };
};

export const getAiSuggestion = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required for AI suggestion' });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey || apiKey === '') {
      console.warn('GEMINI_API_KEY is not defined. Falling back to rule-based mock suggestion.');
      const fallback = getMockSuggestion(title);
      return res.status(200).json(fallback);
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are a task management AI assistant. Given a task title, your job is to:
1. Suggest a realistic, concise description for this task (maximum 2-3 sentences).
2. Recommend a priority level ('Low', 'Medium', or 'High') based on the urgency/importance implied by the title.

Input Task Title: "${title}"

Return a JSON object matching this structure:
{
  "description": "Suggested description text",
  "priority": "Low" | "Medium" | "High"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const textResponse = response.text;
    
    // Parse response
    const suggestion = JSON.parse(textResponse);
    
    // Validate properties
    const cleanSuggestion = {
      description: suggestion.description || `Generated details for "${title}".`,
      priority: ['Low', 'Medium', 'High'].includes(suggestion.priority) ? suggestion.priority : 'Medium'
    };

    return res.status(200).json(cleanSuggestion);
  } catch (error) {
    console.error('Error generating suggestion via Gemini API:', error.message);
    const fallback = getMockSuggestion(req.body.title || '');
    return res.status(200).json(fallback);
  }
};
