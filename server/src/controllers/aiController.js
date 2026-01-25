import * as aiService from '../services/aiService.js';
import prisma from '../utils/db.js';

export const generateDraft = async (req, res, next) => {
  try {
    const draft = await aiService.generateIdeaDraft();
    res.json(draft);
  } catch (err) { next(err); }
};

export const rewriteTeaser = async (req, res, next) => {
  try {
    const { ideaId } = req.body;
    const idea = await prisma.dateIdea.findUnique({ where: { id: ideaId } });
    if (!idea) return res.status(404).json({ error: 'Idea not found' });
    
    const parsedIdea = {
      ...idea,
      vibes: typeof idea.vibes === 'string' ? idea.vibes : JSON.stringify(idea.vibes),
      purposeTags: typeof idea.purposeTags === 'string' ? idea.purposeTags : JSON.stringify(idea.purposeTags),
      seasonTags: typeof idea.seasonTags === 'string' ? idea.seasonTags : JSON.stringify(idea.seasonTags)
    };

    const teaser = await aiService.rewriteHintTeaser(parsedIdea);
    res.json({ teaser });
  } catch (err) { next(err); }
};
