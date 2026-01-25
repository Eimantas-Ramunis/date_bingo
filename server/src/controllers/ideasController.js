import prisma from '../utils/db.js';

const parseJson = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (err) {
      return fallback;
    }
  }
  return value;
};

export const listIdeas = async (req, res, next) => {
  try {
    const ideas = await prisma.dateIdea.findMany({
      orderBy: { createdAt: 'desc' }
    });
    // Parse JSON strings back to objects
    const parsed = ideas.map(i => ({
      ...i,
      vibes: JSON.parse(i.vibes || '[]'),
      purposeTags: JSON.parse(i.purposeTags || '[]'),
      seasonTags: JSON.parse(i.seasonTags || '[]'),
      prepChecklist: JSON.parse(i.prepChecklist || '[]'),
      planB: JSON.parse(i.planB || '{}')
    }));
    res.json(parsed);
  } catch (err) { next(err); }
};

export const createIdea = async (req, res, next) => {
  try {
    const data = req.body;
    const image = req.file ? req.file.filename : null;

    const idea = await prisma.dateIdea.create({
      data: {
        title: data.title,
        shortDescription: data.shortDescription,
        image: image || undefined,
        energy: data.energy,
        radius: data.radius,
        duration: data.duration,
        budget: data.budget,
        cooldownDays: parseInt(data.cooldownDays || 45),
        
        // JSON fields - explicit stringify to be safe
        vibes: JSON.stringify(parseJson(data.vibes, [])),
        purposeTags: JSON.stringify(parseJson(data.purposeTags, [])),
        seasonTags: JSON.stringify(parseJson(data.seasonTags, [])),
        prepChecklist: JSON.stringify(parseJson(data.prepChecklist, [])),
        planB: JSON.stringify(parseJson(data.planB, {}))
      }
    });
    res.json(idea);
  } catch (err) { next(err); }
};

export const updateIdea = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const image = req.file ? req.file.filename : undefined;

    const updateData = {
        title: data.title,
        shortDescription: data.shortDescription,
        energy: data.energy,
        radius: data.radius,
        duration: data.duration,
        budget: data.budget,
        cooldownDays: parseInt(data.cooldownDays || 45),
        
        vibes: JSON.stringify(parseJson(data.vibes, [])),
        purposeTags: JSON.stringify(parseJson(data.purposeTags, [])),
        seasonTags: JSON.stringify(parseJson(data.seasonTags, [])),
        prepChecklist: JSON.stringify(parseJson(data.prepChecklist, [])),
        planB: JSON.stringify(parseJson(data.planB, {}))
    };

    if (image) updateData.image = image;

    const idea = await prisma.dateIdea.update({
      where: { id },
      data: updateData
    });
    res.json(idea);
  } catch (err) { next(err); }
};

export const deleteIdea = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Delete related data first (transactional)
    await prisma.$transaction(async (tx) => {
      // 1. Find related plans
      const plans = await tx.plannedDate.findMany({ where: { ideaId: id } });
      const planIds = plans.map(p => p.id);

      // 2. Delete tokens for those plans
      if (planIds.length > 0) {
        await tx.token.deleteMany({ where: { plannedDateId: { in: planIds } } });
      }

      // 3. Delete the plans themselves
      await tx.plannedDate.deleteMany({ where: { ideaId: id } });

      // 4. Delete the idea
      await tx.dateIdea.delete({ where: { id } });
    });

    res.json({ success: true });
  } catch (err) { next(err); }
};
