import dotenv from 'dotenv';

dotenv.config();

// Simple mock fallback function in case the API key is not configured or fails
const getMockSuggestion = (title, isProject = false) => {
  const titleLower = title.toLowerCase();
  let priority = 'Medium';
  let description = isProject
    ? `This is a generated description for project "${title}". Please verify and update project details.`
    : `This is a generated description for "${title}". Please verify and update task details.`;

  if (titleLower.includes('urgent') || titleLower.includes('asap') || titleLower.includes('fix') || titleLower.includes('error') || titleLower.includes('broken')) {
    priority = 'High';
    description = isProject
      ? `Critical project to address urgent issues: "${title}". High priority to deliver key solutions promptly.`
      : `Critical task to address immediate requirements: ${title}. High priority to resolve roadblocks quickly.`;
  } else if (titleLower.includes('buy') || titleLower.includes('read') || titleLower.includes('optional') || titleLower.includes('study') || titleLower.includes('learn')) {
    priority = 'Low';
    description = isProject
      ? `Exploratory project: "${title}". Focused on research, learning, and non-blocking tasks.`
      : `Routine review task: "${title}". Can be completed in leisure time or when higher priority items are complete.`;
  } else {
    description = isProject
      ? `Standard project initiative: "${title}". Structured plan to execute deliverables on schedule.`
      : `Standard follow-up: "${title}". Ensure to organize necessary resources and schedule time for completion.`;
  }

  return { description, priority };
};

export const getAiSuggestion = async (req, res) => {
  try {
    const { title, name, type } = req.body;
    const isProject = type === 'project' || !!name;
    const inputName = title || name;

    if (!inputName) {
      return res.status(400).json({ error: `${isProject ? 'Project name' : 'Title'} is required for AI suggestion` });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey || apiKey === '') {
      console.warn('GEMINI_API_KEY is not defined. Falling back to rule-based mock suggestion.');
      const fallback = getMockSuggestion(inputName, isProject);
      return res.status(200).json(fallback);
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const prompt = isProject
      ? `
You are a project management AI assistant. Given a project name, your job is to:
1. Suggest a realistic, concise description/scope for this project (maximum 3-4 sentences).
2. Recommend a priority level ('Low', 'Medium', or 'High') based on the complexity/importance implied by the name.

Input Project Name: "${inputName}"

Return a JSON object matching this structure:
{
  "description": "Suggested description text",
  "priority": "Low" | "Medium" | "High"
}
`
      : `
You are a task management AI assistant. Given a task title, your job is to:
1. Suggest a realistic, concise description for this task (maximum 2-3 sentences).
2. Recommend a priority level ('Low', 'Medium', or 'High') based on the urgency/importance implied by the title.

Input Task Title: "${inputName}"

Return a JSON object matching this structure:
{
  "description": "Suggested description text",
  "priority": "Low" | "Medium" | "High"
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
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
      description: suggestion.description || `Generated details for "${inputName}".`,
      priority: ['Low', 'Medium', 'High'].includes(suggestion.priority) ? suggestion.priority : 'Medium'
    };

    return res.status(200).json(cleanSuggestion);
  } catch (error) {
    console.error('Error generating suggestion via Gemini API:', error.message);
    const fallback = getMockSuggestion(req.body.title || req.body.name || '', req.body.type === 'project' || !!req.body.name);
    return res.status(200).json(fallback);
  }
};


