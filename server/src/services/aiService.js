import { getSetting } from './settingsService.js';

export const AI_SETTING_KEYS = {
  apiKey: 'ai.apiKey',
  textModel: 'ai.textModel',
  imageModel: 'ai.imageModel'
};

export const AI_DEFAULTS = {
  textModel: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
  imageModel: process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image-preview'
};

const GEMINI_API_BASE = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta';

const createBadRequestError = (message) => {
  const error = new Error(message);
  error.status = 400;
  return error;
};

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

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeModel = (value, fallback) => normalizeString(value) || fallback;

const getConfiguredApiKey = async () => {
  const dbKey = normalizeString(await getSetting(AI_SETTING_KEYS.apiKey));
  if (dbKey) return dbKey;
  const envKey = normalizeString(process.env.GEMINI_API_KEY);
  return envKey || null;
};

export const getAiRuntimeConfig = async () => {
  const dbTextModel = await getSetting(AI_SETTING_KEYS.textModel);
  const dbImageModel = await getSetting(AI_SETTING_KEYS.imageModel);
  return {
    apiKey: await getConfiguredApiKey(),
    textModel: normalizeModel(dbTextModel, AI_DEFAULTS.textModel),
    imageModel: normalizeModel(dbImageModel, AI_DEFAULTS.imageModel)
  };
};

const buildPartsFromPrompt = (prompt) => [{ text: prompt }];

const extractTextFromResponse = (responseJson) => {
  const candidates = Array.isArray(responseJson?.candidates) ? responseJson.candidates : [];
  const texts = [];
  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    for (const part of parts) {
      if (typeof part?.text === 'string' && part.text.trim()) {
        texts.push(part.text);
      }
    }
  }
  return texts.join('\n').trim();
};

const extractInlineImage = (responseJson) => {
  const candidates = Array.isArray(responseJson?.candidates) ? responseJson.candidates : [];
  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    for (const part of parts) {
      const inline = part?.inlineData || part?.inline_data;
      if (inline?.data) {
        return {
          data: inline.data,
          mimeType: inline.mimeType || inline.mime_type || 'image/png'
        };
      }
    }
  }
  return null;
};

const callGeminiModel = async ({
  apiKey,
  model,
  prompt,
  systemInstruction,
  responseMimeType,
  responseJsonSchema,
  responseModalities
}) => {
  const endpoint = `${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    contents: [{ role: 'user', parts: buildPartsFromPrompt(prompt) }]
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const generationConfig = {};
  if (responseMimeType) generationConfig.responseMimeType = responseMimeType;
  if (responseJsonSchema) generationConfig.responseSchema = responseJsonSchema;
  if (Array.isArray(responseModalities) && responseModalities.length > 0) {
    generationConfig.responseModalities = responseModalities;
  }
  if (Object.keys(generationConfig).length > 0) {
    body.generationConfig = generationConfig;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  let json;
  try {
    json = await response.json();
  } catch (err) {
    json = {};
  }

  if (!response.ok) {
    const status = response.status;
    const message = json?.error?.message || `Gemini request failed with status ${status}`;
    const error = new Error(message);
    error.status = status;
    throw error;
  }

  return json;
};

const generateContent = async ({
  prompt,
  systemInstruction,
  responseMimeType,
  responseJsonSchema,
  model
}) => {
  const { apiKey, textModel } = await getAiRuntimeConfig();
  if (!apiKey) throw createBadRequestError('AI API key is not configured');

  try {
    const responseJson = await callGeminiModel({
      apiKey,
      model: model || textModel,
      prompt,
      systemInstruction,
      responseMimeType,
      responseJsonSchema
    });
    return extractTextFromResponse(responseJson);
  } catch (error) {
    const status = error?.status;
    if (status === 429) {
      console.warn('Gemini quota exceeded. Returning empty output.');
      return '';
    }
    console.error('AI service text generation failed:', error?.message || 'Unknown error');
    return '';
  }
};

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }
  return [];
};

const toObject = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (err) {
      return {};
    }
  }
  return {};
};

const joinList = (items) => {
  if (!Array.isArray(items) || items.length === 0) return 'Not specified';
  return items.filter(Boolean).join(', ');
};

export const buildIdeaImagePrompt = (idea) => {
  const planB = toObject(idea?.planB);
  const planASteps = toArray(idea?.prepChecklist);
  const planBSteps = toArray(planB?.steps);
  const parts = [
    'Create a realistic, cinematic photo-style image for this date concept.',
    'Focus on warm emotional atmosphere, candid human presence, and believable details.',
    'Do not include text overlays, logos, watermarks, or UI elements.',
    '',
    `Date title: ${normalizeString(idea?.title) || 'Untitled'}`,
    `Description: ${normalizeString(idea?.shortDescription) || 'No description provided.'}`,
    `Vibes: ${joinList(toArray(idea?.vibes))}`,
    `Purpose tags: ${joinList(toArray(idea?.purposeTags))}`,
    `Season tags: ${joinList(toArray(idea?.seasonTags))}`,
    `Energy: ${normalizeString(idea?.energy) || 'Not specified'}`,
    `Area: ${normalizeString(idea?.radius) || 'Not specified'}`,
    `Duration: ${normalizeString(idea?.duration) || 'Not specified'}`,
    `Budget: ${normalizeString(idea?.budget) || 'Not specified'}`,
    `Plan A steps: ${joinList(planASteps)}`,
    `Plan B title: ${normalizeString(planB?.title) || 'Plan B'}`,
    `Plan B description: ${normalizeString(planB?.description) || normalizeString(planB?.shortDescription) || 'Not specified'}`,
    `Plan B steps: ${joinList(planBSteps)}`,
    '',
    'Style constraints: natural skin tones, practical clothing, intimate but tasteful framing, balanced color grading.',
    'Shot composition: medium-wide framing, environmental storytelling, depth of field, realistic lighting.'
  ];

  return parts.join('\n').trim();
};

export const generateIdeaImage = async ({ prompt, model } = {}) => {
  const { apiKey, imageModel } = await getAiRuntimeConfig();
  if (!apiKey) throw createBadRequestError('AI API key is not configured');

  const normalizedPrompt = normalizeString(prompt);
  if (!normalizedPrompt) {
    throw createBadRequestError('Prompt is required');
  }

  const selectedModel = normalizeModel(model, imageModel);
  try {
    const responseJson = await callGeminiModel({
      apiKey,
      model: selectedModel,
      prompt: normalizedPrompt,
      responseModalities: ['TEXT', 'IMAGE']
    });
    const image = extractInlineImage(responseJson);
    if (!image?.data) {
      throw new Error('Model did not return image data');
    }
    return {
      model: selectedModel,
      mimeType: image.mimeType,
      base64Data: image.data
    };
  } catch (error) {
    const message = error?.message || 'Image generation failed';
    console.error('AI service image generation failed:', message);
    throw new Error(`Image generation failed: ${message}`);
  }
};

export const testAiConnection = async () => {
  const { apiKey, textModel } = await getAiRuntimeConfig();
  if (!apiKey) throw createBadRequestError('AI API key is not configured');

  await callGeminiModel({
    apiKey,
    model: textModel,
    prompt: 'Reply with: OK'
  });
};

const THEME_HINTS = {
  'cozy-home': 'Jaukus laikas namuose, šilti ritualai, privatumas.',
  'outdoors-daylight': 'Diena lauke, natūralus šviesos pojūtis, grynas oras.',
  'food-drink': 'Maistas ir gėrimai kaip pagrindinis akcentas.',
  'creative-make': 'Kūryba arba kažko pasigaminimas savo rankomis.',
  'playful-games': 'Žaidybiniai elementai, lengvas varžymasis, juokas.',
  'culture-art': 'Menas, kultūra, muzika, parodos ar kinas.',
  'movement-active': 'Judėjimas, aktyvumas, lengvas sportas ar šokis.',
  nostalgia: 'Prisiminimai, bendros istorijos, sentimentai.',
  'surprise-mystery': 'Netikėtumas, paslaptis, mažas siužetas.',
  'slow-relax': 'Lėtas tempas, poilsis, atsipalaidavimas.',
  'micro-adventure': 'Trumpas mini nuotykis su nedideliu atradimo elementu.',
  'sunrise-sunset': 'Svarbus dienos metas: saulėtekis ar saulėlydis.',
  'rainy-day': 'Lietingos dienos jaukumas ir planas, atsparus orui.',
  'budget-friendly': 'Kūrybiškas, nebrangus planas su maža trintimi.',
  'luxury-treat': 'Šventiškas, šiek tiek prabangesnis pasimatymas.',
  'memory-lane': 'Pasimatymas susietas su bendrais prisiminimais ar vietomis.',
  'nature-escape': 'Daugiau gamtos, mažiau miesto šurmulio.',
  'social-light': 'Lengvas socialinis kontekstas be didelės minios.'
};

const normalizeSteering = (value) => normalizeString(value);
const normalizeThemes = (themes) => (Array.isArray(themes) ? themes : [])
  .map(theme => normalizeString(theme))
  .filter(theme => Boolean(THEME_HINTS[theme]));
const normalizeCustomTheme = (value) => normalizeString(value);

export const generateIdeaDraft = async ({ steeringText, themes, customTheme, existingTitles } = {}) => {
  const normalizedSteering = normalizeSteering(steeringText);
  const normalizedThemes = normalizeThemes(themes);
  const normalizedCustomTheme = normalizeCustomTheme(customTheme);
  const themeHints = normalizedThemes.map(theme => `- ${THEME_HINTS[theme]}`).join('\n');
  const titleList = Array.isArray(existingTitles)
    ? existingTitles.filter(Boolean).slice(0, 60)
    : [];

  const systemPrompt = 'Tu esi kūrybingas pasimatymų planuotojas. Generuok unikalią pasimatymo idėją su Plan B. Viską rašyk lietuviškai. Naudok metrinius matavimo vienetus (km, m, min, val.). Grąžink TIK galiojantį JSON be markdown.';
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
        ${normalizedCustomTheme ? `Individuali admin tema (naudok jei tinka): ${normalizedCustomTheme}` : 'Individuali admin tema: (nepateikta)'}
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
    console.error('Failed to parse AI JSON response.');
    return pickFallbackIdea();
  }
};

export const rewriteHintTeaser = async (idea) => {
  const systemPrompt = 'You are a romantic mystery writer. Write a short, exciting teaser for a date in Lithuanian (LT).';
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
    `Pasiruošk vakaro staigmenai - kažkas subtilaus ir jaukaus apie "${idea.title}".`,
    `Švelni užuomina: "${idea.title}" bus kupinas jausmo, bet detales paliksiu rytojui.`
  ];
  if (!trimmed || trimmed.includes('AI unavailable') || trimmed.includes('AI generation failed')) {
    return fallbackTeasers[Math.floor(Math.random() * fallbackTeasers.length)];
  }
  return trimmed;
};
