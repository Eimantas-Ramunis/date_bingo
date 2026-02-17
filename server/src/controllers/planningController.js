import prisma from '../utils/db.js';
import crypto from 'crypto';

const parseJson = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (err) {
    return fallback;
  }
};

const toIdeaDto = (idea) => ({
  ...idea,
  vibes: parseJson(idea.vibes, []),
  purposeTags: parseJson(idea.purposeTags, []),
  seasonTags: parseJson(idea.seasonTags, []),
  prepChecklist: parseJson(idea.prepChecklist, []),
  planB: parseJson(idea.planB, {})
});

const getCooldownMeta = (idea) => {
  if (!idea.lastDoneAt) {
    return {
      isCoolingDown: false,
      cooldownRemainingDays: 0
    };
  }

  const now = Date.now();
  const lastDoneAt = new Date(idea.lastDoneAt).getTime();
  const elapsedDays = (now - lastDoneAt) / (1000 * 60 * 60 * 24);
  const remaining = Math.max(0, Math.ceil(idea.cooldownDays - elapsedDays));
  return {
    isCoolingDown: remaining > 0,
    cooldownRemainingDays: remaining
  };
};

export const listPlanningIdeas = async (req, res, next) => {
  try {
    const ideas = await prisma.dateIdea.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const formatted = ideas.map((idea) => ({
      ...toIdeaDto(idea),
      ...getCooldownMeta(idea)
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
};

// Helper: Suggest 3
export const suggestIdeas = async (req, res, next) => {
  try {
    const ideas = await prisma.dateIdea.findMany();
    
    // Filter by cooldown
    const validIdeas = ideas.filter(idea => {
      const cooldownMeta = getCooldownMeta(idea);
      return !cooldownMeta.isCoolingDown;
    });
    
    // Shuffle and pick 3
    const shuffled = validIdeas.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3).map(i => toIdeaDto(i));
    
    res.json(selected);
  } catch (err) { next(err); }
};

// Helper: Get Current Active Plan
export const getCurrentPlan = async (req, res, next) => {
  try {
    const plan = await prisma.plannedDate.findFirst({
      where: {
        status: { in: ['PLANNED', 'HINT_SENT', 'REVEAL_SENT', 'VETOED'] }
      },
      include: { idea: true }
    });
    
    if (!plan) return res.json(null);
    
    // Parse JSON fields
    const formatted = {
      ...plan,
      planASteps: parseJson(plan.planASteps, []),
      planBSteps: parseJson(plan.planBSteps, []),
      idea: {
        ...plan.idea,
        vibes: parseJson(plan.idea.vibes, []),
        purposeTags: parseJson(plan.idea.purposeTags, []),
        planB: parseJson(plan.idea.planB, {})
      }
    };
    res.json(formatted);
  } catch (err) { next(err); }
};

export const getHistory = async (req, res, next) => {
  try {
    const history = await prisma.plannedDate.findMany({
      where: { status: 'DONE' },
      orderBy: { completedAt: 'desc' },
      include: { idea: true }
    });

    const formatted = history.map(plan => ({
      ...plan,
      planASteps: parseJson(plan.planASteps, []),
      planBSteps: parseJson(plan.planBSteps, []),
      idea: {
        ...plan.idea,
        vibes: parseJson(plan.idea.vibes, []),
        purposeTags: parseJson(plan.idea.purposeTags, []),
        planB: parseJson(plan.idea.planB, {})
      }
    }));

    res.json(formatted);
  } catch (err) { next(err); }
};

// Action: Select Idea (Create Plan)
export const selectIdea = async (req, res, next) => {
  try {
    const { ideaId, hintTeaser, hintStartTime, hintDressCode, hintDuration } = req.body;
    
    // Check if active plan exists
    const existing = await prisma.plannedDate.findFirst({
      where: { status: { in: ['PLANNED', 'HINT_SENT', 'REVEAL_SENT', 'VETOED'] } }
    });
    if (existing) return res.status(400).json({ error: 'Active plan already exists' });

    const idea = await prisma.dateIdea.findUnique({ where: { id: ideaId } });
    const planB = parseJson(idea?.planB, {});

    const plan = await prisma.plannedDate.create({
      data: {
        ideaId,
        hintTeaser,
        hintStartTime,
        hintDressCode,
        hintDuration,
        planASteps: idea.prepChecklist, 
        planBSteps: JSON.stringify(planB.steps || []),
        planBTitle: planB.title || 'Plan B',
        planBDesc: planB.description || planB.shortDescription || 'No description provided.',
        status: 'PLANNED'
      }
    });
    
    res.json(plan);
  } catch (err) { next(err); }
};

// Action: Cancel Plan
export const cancelPlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // We can either delete it or mark it as CANCELLED.
    // Deleting keeps history clean for "never happened" events.
    
    // 1. Delete associated tokens
    await prisma.token.deleteMany({ where: { plannedDateId: id } });
    
    // 2. Delete the plan
    await prisma.plannedDate.delete({ where: { id } });
    
    res.json({ success: true });
  } catch (err) { next(err); }
};

// Action: Generate Token
export const generateToken = async (req, res, next) => {
  try {
    const { plannedDateId, type } = req.body; // type: 'HINT' | 'REVEAL' | 'BINGO'
    const allowedTypes = ['HINT', 'REVEAL', 'BINGO'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid token type' });
    }
    
    // Revoke old tokens of same type
    await prisma.token.updateMany({
      where: { plannedDateId, type },
      data: { revoked: true }
    });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
    
    // TTL
    const hours = type === 'BINGO' ? 168 : 72; // Configurable
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + hours);

    await prisma.token.create({
      data: {
        hash,
        type,
        expiry,
        plannedDateId
      }
    });
    
    // Return RAW token to Admin (one time view)
    res.json({ token: rawToken, type, expiry });
  } catch (err) { next(err); }
};

export const generatePreviewToken = async (req, res, next) => {
  try {
    const { plannedDateId, type } = req.body;
    const allowedTypes = ['HINT', 'REVEAL'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid preview type' });
    }

    const plan = await prisma.plannedDate.findUnique({ where: { id: plannedDateId } });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 2);

    await prisma.token.create({
      data: {
        hash,
        type,
        expiry,
        plannedDateId
      }
    });

    res.json({ token: rawToken, type, expiry });
  } catch (err) { next(err); }
};

// Action: Mark Done
export const markDone = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      touchRitual, phonesAway, laughed, honestSentence, newPlace, 
      notes, rating 
    } = req.body;

    const plan = await prisma.plannedDate.findUnique({ 
      where: { id },
      include: { idea: true }
    });
    
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    // Update Plan
    await prisma.plannedDate.update({
      where: { id },
      data: {
        status: 'DONE',
        completedAt: new Date(),
        notes,
        rating: parseInt(rating),
      }
    });

    // Update Idea LastDoneAt
    await prisma.dateIdea.update({
      where: { id: plan.ideaId },
      data: { lastDoneAt: new Date() }
    });

    // Calculate Bingo
    const idea = plan.idea;
    const purposeTags = JSON.parse(idea.purposeTags || '[]');
    const vibes = JSON.parse(idea.vibes || '[]');
    const earnedTiles = [];

    // Rules
    if (touchRitual || purposeTags.includes('passion')) earnedTiles.push('t1');
    if (vibes.includes('outdoors') || vibes.includes('daylight')) earnedTiles.push('t2'); // Simplified
    if (phonesAway) earnedTiles.push('t3');
    if (laughed || purposeTags.includes('laugh')) earnedTiles.push('t4');
    if (honestSentence || purposeTags.includes('talk')) earnedTiles.push('t5');
    if (newPlace || purposeTags.includes('novelty')) earnedTiles.push('t6');
    if (purposeTags.includes('anti_spiral') || (idea.energy === 'low' && !plan.planBActive)) earnedTiles.push('t7');
    earnedTiles.push('t8'); // You planned it
    if (plan.planBActive) earnedTiles.push('t9');

    // Save Bingo Tiles
    for (const tileId of earnedTiles) {
      await prisma.bingoTile.upsert({
        where: { id: tileId },
        update: { earnedAt: new Date() },
        create: { id: tileId, code: tileId, earnedAt: new Date() }
      });
    }

    res.json({ success: true, earnedTiles });
  } catch (err) { next(err); }
};
