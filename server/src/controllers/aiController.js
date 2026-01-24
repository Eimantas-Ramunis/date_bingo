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
    
    // Parse if string
    const parsedIdea = {
        ...idea,
        vibes: typeof idea.vibes === 'string' ? idea.vibes : JSON.stringify(idea.vibes)
    };

    const teaser = await aiService.rewriteHintTeaser(parsedIdea);
    res.json({ teaser });
  } catch (err) { next(err); }
};
