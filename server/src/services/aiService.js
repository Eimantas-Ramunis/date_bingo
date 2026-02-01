import { GoogleGenAI } from '@google/genai';

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
const ai = new GoogleGenAI(API_KEY ? { apiKey: API_KEY } : {});

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

async function generateContent({ prompt, systemInstruction, responseMimeType, responseJsonSchema }) {
  if (!API_KEY) throw new Error('GEMINI_API_KEY not set');

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType,
        responseJsonSchema
      }
    });

    return response.text || '';
  } catch (error) {
    const status = error?.status || error?.response?.status;
    if (status === 429) {
      console.warn('Gemini quota exceeded. Returning fallback.');
      return '';
    }
    console.error('AI Service Error:', error.message);
    return '';
  }
}

const THEME_HINTS = {
  'cozy-home': 'Jaukus laikas namuose, šilti ritualai, privatumas.',
  'outdoors-daylight': 'Diena lauke, natūralus šviesos pojūtis, grynas oras.',
  'food-drink': 'Maistas ir gėrimai kaip pagrindinis akcentas.',
  'creative-make': 'Kūryba arba kažko pasigaminimas savo rankomis.',
  'playful-games': 'Žaidybiniai elementai, lengvas varžymasis, juokas.',
  'culture-art': 'Menas, kultūra, muzika, parodos ar kinas.',
  'movement-active': 'Judėjimas, aktyvumas, lengvas sportas ar šokis.',
  'nostalgia': 'Prisiminimai, bendros istorijos, sentimentai.',
  'surprise-mystery': 'Netikėtumas, paslaptis, mažas siužetas.',
  'slow-relax': 'Lėtas tempas, poilsis, atsipalaidavimas.'
};

const normalizeSteering = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeThemes = (themes) => (Array.isArray(themes) ? themes : [])
  .map(theme => (typeof theme === 'string' ? theme.trim() : ''))
  .filter(theme => Boolean(THEME_HINTS[theme]));

export const generateIdeaDraft = async ({ steeringText, themes, existingTitles } = {}) => {
  const normalizedSteering = normalizeSteering(steeringText);
  const normalizedThemes = normalizeThemes(themes);
  const themeHints = normalizedThemes.map(theme => `- ${THEME_HINTS[theme]}`).join('\n');
  const titleList = Array.isArray(existingTitles)
    ? existingTitles.filter(Boolean).slice(0, 60)
    : [];

  const systemPrompt = "Tu esi kūrybingas pasimatymų planuotojas. Generuok unikalią pasimatymo idėją su Plan B. Viską rašyk lietuviškai. Naudok metrinius matavimo vienetus (km, m, min, val.). Grąžink TIK galiojantį JSON be markdown.";
  const userPrompt = `Sugeneruok JSON objektą pasimatymo idėjai.
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
        Rašyk lietuviškai. Naudok metrinius vienetus (pvz., "2 km", "45 min"). Aprašymas turi būti konkretus.
        
        Papildomas kontekstas (naudok kaip gaires, bet neperrašyk pažodžiui):
        ${normalizedSteering ? `Admin kryptis: ${normalizedSteering}` : 'Admin kryptis: (nepateikta)'}
        ${themeHints ? `Pageidaujamos temos (naudok bent 1-2):\n${themeHints}` : 'Pageidaujamos temos: (nepasirinkta)'}
        ${titleList.length > 0 ? `Jau turimų idėjų pavadinimai (venk pasikartojimo ar labai panašių idėjų):\n- ${titleList.join('\n- ')}` : 'Jau turimų idėjų pavadinimai: (nėra)'}
        
        Svarbu: kurk originalią idėją, nepernaudok tų pačių pagrindinių veiklų. Venk pasikartojančių tropų (pvz., žvaigždžių stebėjimas), nebent tai aiškiai nurodyta kryptimi ar temomis.`;

  const schema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      shortDescription: { type: 'string' },
      vibes: { type: 'array', items: { type: 'string' } },
      purposeTags: { type: 'array', items: { type: 'string' } },
      energy: { type: 'string' },
      seasonTags: { type: 'array', items: { type: 'string' } },
      radius: { type: 'string' },
      duration: { type: 'string' },
      budget: { type: 'string' },
      prepChecklist: { type: 'array', items: { type: 'string' } },
      planB: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          steps: { type: 'array', items: { type: 'string' } },
          vibes: { type: 'array', items: { type: 'string' } },
          energy: { type: 'string' }
        },
        required: ['title', 'description', 'steps']
      }
    },
    required: ['title', 'shortDescription', 'vibes', 'purposeTags', 'energy', 'seasonTags', 'radius', 'duration', 'budget', 'prepChecklist', 'planB']
  };

  let text = await generateContent({
    prompt: userPrompt,
    systemInstruction: systemPrompt,
    responseMimeType: 'application/json',
    responseJsonSchema: schema
  });
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
  const userPrompt = `Write a 1-2 sentence teaser in Lithuanian for a date.
        Title: "${idea.title}".
        Description: ${idea.shortDescription}.
        Vibes: ${idea.vibes}.
        Area: ${idea.radius}.
        Duration: ${idea.duration}.
        Energy: ${idea.energy}.
        Avoid naming the exact activity or location, hint at the atmosphere instead.
        Make it distinct and specific to this idea.`;
  
  const text = await generateContent({
    prompt: userPrompt,
    systemInstruction: systemPrompt
  });
  const trimmed = text.trim();
  const fallbackTeasers = [
    `Rytoj jūsų laukia šiltas, mažas nuotykis apie "${idea.title}".`,
    `Pasiruošk vakaro staigmenai — kažkas subtilaus ir jaukaus apie "${idea.title}".`,
    `Švelni užuomina: "${idea.title}" bus kupinas jausmo, bet detales paliksiu rytojui.`
  ];
  if (!trimmed || trimmed.includes('AI unavailable') || trimmed.includes('AI generation failed')) {
    return fallbackTeasers[Math.floor(Math.random() * fallbackTeasers.length)];
  }
  return trimmed;
};
