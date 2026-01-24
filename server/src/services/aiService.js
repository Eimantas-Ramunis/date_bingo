const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

async function callGemini(prompt, systemInstruction, isJson = false) {
  if (!API_KEY) throw new Error("GEMINI_API_KEY not set");

  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] }
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("Gemini Quota Exceeded. Returning fallback.");
        return isJson ? "{}" : "AI unavailable (Quota).";
      }
      const err = await response.text();
      throw new Error(`Gemini API Error: ${err}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (error) {
    console.error("AI Service Error:", error.message);
    return isJson ? "{}" : "AI generation failed.";
  }
}

export const generateIdeaDraft = async () => {
  const systemPrompt = "You are a creative date planner. Generate a unique, structured date idea including a 'Plan B' (low energy fallback). Return ONLY raw, valid JSON with no markdown formatting.";
  const userPrompt = `Generate a JSON object for a date idea.
        Structure:
        { 
          "title": "String", 
          "shortDescription": "String", 
          "vibes": ["String"], 
          "purposeTags": ["String"], 
          "energy": "low"|"med"|"high", 
          "seasonTags": ["String"], 
          "radius": "String", 
          "duration": "String", 
          "budget": "String", 
          "prepChecklist": ["String"], 
          "planB": { 
            "title": "String", 
            "shortDescription": "String", 
            "steps": ["String"], 
            "vibes": ["String"], 
            "energy": "low" 
          }
        }
        Make it creative, romantic, or fun. Ensure specific activity details.`;
        
  let text = await callGemini(userPrompt, systemPrompt, true);
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse AI JSON:", text);
    return {};
  }
};

export const rewriteHintTeaser = async (idea) => {
  const systemPrompt = "You are a romantic mystery writer. Write a short, exciting teaser for a date in Lithuanian (LT).";
  const userPrompt = `Write a 1-sentence teaser in Lithuanian for a date titled "${idea.title}". 
        Description: ${idea.shortDescription}. 
        Vibes: ${idea.vibes}.
        Do not reveal the exact location or activity name, just hint at the feeling/atmosphere. Make it alluring.`;
  
  const text = await callGemini(userPrompt, systemPrompt);
  return text.trim();
};
