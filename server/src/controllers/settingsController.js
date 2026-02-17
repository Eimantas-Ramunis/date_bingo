import { AI_DEFAULTS, AI_SETTING_KEYS, getAiRuntimeConfig, testAiConnection } from '../services/aiService.js';
import { deleteSetting, setSetting } from '../services/settingsService.js';

const normalizeInput = (value, fallback) => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
};

const maskKey = (value) => {
  if (!value) return '';
  if (value.length <= 8) return '********';
  return `****${value.slice(-4)}`;
};

const buildResponse = async () => {
  const config = await getAiRuntimeConfig();
  return {
    hasApiKey: Boolean(config.apiKey),
    apiKeyPreview: config.apiKey ? maskKey(config.apiKey) : '',
    textModel: config.textModel || AI_DEFAULTS.textModel,
    imageModel: config.imageModel || AI_DEFAULTS.imageModel
  };
};

export const getAiSettings = async (req, res, next) => {
  try {
    res.json(await buildResponse());
  } catch (err) {
    next(err);
  }
};

export const updateAiSettings = async (req, res, next) => {
  try {
    const { apiKey, clearApiKey, textModel, imageModel } = req.body || {};

    if (clearApiKey) {
      await deleteSetting(AI_SETTING_KEYS.apiKey);
    } else if (typeof apiKey === 'string' && apiKey.trim()) {
      await setSetting(AI_SETTING_KEYS.apiKey, apiKey.trim());
    }

    if (typeof textModel === 'string') {
      await setSetting(AI_SETTING_KEYS.textModel, normalizeInput(textModel, AI_DEFAULTS.textModel));
    }

    if (typeof imageModel === 'string') {
      await setSetting(AI_SETTING_KEYS.imageModel, normalizeInput(imageModel, AI_DEFAULTS.imageModel));
    }

    res.json(await buildResponse());
  } catch (err) {
    next(err);
  }
};

export const testAiSettings = async (req, res, next) => {
  try {
    await testAiConnection();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
