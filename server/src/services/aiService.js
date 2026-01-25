const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const fallbackIdeas = [
  {
    title: 'Vakaro pasivaikščiojimas ir arbata',
    shortDescription: 'Ramus pasivaikščiojimas mėgstamame rajone, po to jaukus arbatos vakaras namuose.',
    vibes: ['calm', 'warm'],
    purposeTags: ['talk', 'anti_spiral'],
    energy: 'low',
    seasonTags: ['any'],
    radius: 'Neighborhood',
    duration: '2h',
    budget: 'low',
    prepChecklist: ['Pasiimti šiltą arbatą termosui', 'Pasirinkti maršrutą'],
    planB: {
      title: 'Namų kino vakaras',
      description: 'Filmų vakaras su užkandžiais ir žvakių šviesa.',
      steps: ['Išsirinkti filmą', 'Paruošti užkandžius', 'Uždegti žvakes'],
      vibes: ['cozy'],
      energy: 'low'
    }
  },
  {
    title: 'Mini degustacija namuose',
    shortDescription: 'Sukurkite mažą degustaciją namuose su dviem gėrimais ir mažais užkandžiais.',
    vibes: ['playful', 'intimate'],
    purposeTags: ['laugh'],
    energy: 'med',
    seasonTags: ['any'],
    radius: 'Home',
    duration: '1.5h',
    budget: 'med',
    prepChecklist: ['Pasirinkti 2 gėrimus', 'Paruošti užkandžių lėkštę'],
    planB: {
      title: 'Kepinių popietė',
      description: 'Lengvai pagaminami sausainiai ir rami muzika.',
      steps: ['Pasiruošti ingredientus', 'Kepimo procesas', 'Skanauti kartu'],
      vibes: ['warm'],
      energy: 'low'
    }
  }
];

const pickFallbackIdea = () => fallbackIdeas[Math.floor(Math.random() * fallbackIdeas.length)];

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
            "description": "String", 
            "steps": ["String"], 
            "vibes": ["String"], 
            "energy": "low" 
          }
        }
        Make it creative, romantic, or fun. Ensure specific activity details.`;

  let text = await callGemini(userPrompt, systemPrompt, true);
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    const parsed = JSON.parse(text);
    if (!parsed || !parsed.title) {
      return pickFallbackIdea();
    }
    return parsed;
  } catch (e) {
    console.error('Failed to parse AI JSON:', text);
    return pickFallbackIdea();
  }
};

export const rewriteHintTeaser = async (idea) => {
  const systemPrompt = "You are a romantic mystery writer. Write a short, exciting teaser for a date in Lithuanian (LT).";
  const userPrompt = `Write a 1-sentence teaser in Lithuanian for a date titled "${idea.title}". 
        Description: ${idea.shortDescription}. 
        Vibes: ${idea.vibes}.
        Do not reveal the exact location or activity name, just hint at the feeling/atmosphere. Make it alluring.`;
  
  const text = await callGemini(userPrompt, systemPrompt);
  const trimmed = text.trim();
  if (!trimmed || trimmed.includes('AI unavailable') || trimmed.includes('AI generation failed')) {
    return 'Rytoj laukia maža staigmena — pasiruošk nuotykiui.';
  }
  return trimmed;
};
