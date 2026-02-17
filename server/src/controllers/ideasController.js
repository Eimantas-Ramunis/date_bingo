import fs from 'fs';
import path from 'path';

import { buildIdeaImagePrompt, generateIdeaImage } from '../services/aiService.js';
import prisma from '../utils/db.js';
import { getUploadDir } from '../utils/uploads.js';

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

const parseIdea = (idea) => ({
  ...idea,
  vibes: parseJson(idea.vibes, []),
  purposeTags: parseJson(idea.purposeTags, []),
  seasonTags: parseJson(idea.seasonTags, []),
  prepChecklist: parseJson(idea.prepChecklist, []),
  planB: parseJson(idea.planB, {})
});

const getExtensionForMimeType = (mimeType) => {
  if (!mimeType) return '.png';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return '.jpg';
  if (mimeType.includes('webp')) return '.webp';
  return '.png';
};

const ensureUploadDir = () => {
  const uploadDir = getUploadDir();
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

const createMediaRecord = async ({ ideaId, filename, source, promptUsed, promptAuto, model }) => {
  return prisma.ideaMedia.create({
    data: {
      ideaId,
      filename,
      source,
      promptUsed: promptUsed || null,
      promptAuto: promptAuto || null,
      model: model || null
    }
  });
};

export const listIdeas = async (req, res, next) => {
  try {
    const ideas = await prisma.dateIdea.findMany({
      orderBy: { createdAt: 'desc' }
    });
    const parsed = ideas.map(parseIdea);
    res.json(parsed);
  } catch (err) {
    next(err);
  }
};

export const createIdea = async (req, res, next) => {
  try {
    const data = req.body;
    const image = req.file ? req.file.filename : null;

    const idea = await prisma.$transaction(async (tx) => {
      const createdIdea = await tx.dateIdea.create({
        data: {
          title: data.title,
          shortDescription: data.shortDescription,
          image: image || undefined,
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
        }
      });

      if (image) {
        await tx.ideaMedia.create({
          data: {
            ideaId: createdIdea.id,
            filename: image,
            source: 'UPLOAD'
          }
        });
      }

      return createdIdea;
    });

    res.json(idea);
  } catch (err) {
    next(err);
  }
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

    const idea = await prisma.$transaction(async (tx) => {
      const updatedIdea = await tx.dateIdea.update({
        where: { id },
        data: updateData
      });

      if (image) {
        await tx.ideaMedia.create({
          data: {
            ideaId: id,
            filename: image,
            source: 'UPLOAD'
          }
        });
      }

      return updatedIdea;
    });

    res.json(idea);
  } catch (err) {
    next(err);
  }
};

export const listIdeaMedia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idea = await prisma.dateIdea.findUnique({
      where: { id },
      include: {
        mediaItems: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    res.json({
      currentImage: idea.image || null,
      items: idea.mediaItems.map((item) => ({
        ...item,
        isSelected: item.filename === idea.image
      }))
    });
  } catch (err) {
    next(err);
  }
};

export const getIdeaAutoPrompt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idea = await prisma.dateIdea.findUnique({ where: { id } });
    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    const prompt = buildIdeaImagePrompt(parseIdea(idea));
    res.json({ prompt });
  } catch (err) {
    next(err);
  }
};

export const generateIdeaMedia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { prompt, promptAuto, model } = req.body || {};

    const idea = await prisma.dateIdea.findUnique({ where: { id } });
    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    const parsedIdea = parseIdea(idea);
    const autoPrompt = typeof promptAuto === 'string' && promptAuto.trim()
      ? promptAuto.trim()
      : buildIdeaImagePrompt(parsedIdea);
    const finalPrompt = typeof prompt === 'string' && prompt.trim()
      ? prompt.trim()
      : autoPrompt;

    if (!finalPrompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const generated = await generateIdeaImage({ prompt: finalPrompt, model });
    const imageBuffer = Buffer.from(generated.base64Data, 'base64');
    if (!imageBuffer.length) {
      return res.status(500).json({ error: 'Image generation returned empty data' });
    }

    const extension = getExtensionForMimeType(generated.mimeType);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    const uploadDir = ensureUploadDir();
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, imageBuffer);

    const media = await createMediaRecord({
      ideaId: id,
      filename,
      source: 'AI',
      promptUsed: finalPrompt,
      promptAuto: autoPrompt,
      model: generated.model
    });

    res.json({
      media,
      imageUrl: `/uploads/${filename}`
    });
  } catch (err) {
    next(err);
  }
};

export const selectIdeaMedia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { mediaId } = req.body || {};
    if (!mediaId) {
      return res.status(400).json({ error: 'mediaId is required' });
    }

    const media = await prisma.ideaMedia.findUnique({
      where: { id: mediaId }
    });

    if (!media || media.ideaId !== id) {
      return res.status(404).json({ error: 'Media not found for this idea' });
    }

    await prisma.dateIdea.update({
      where: { id },
      data: { image: media.filename }
    });

    res.json({
      success: true,
      image: media.filename
    });
  } catch (err) {
    next(err);
  }
};

export const deleteIdea = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      const plans = await tx.plannedDate.findMany({ where: { ideaId: id } });
      const planIds = plans.map(p => p.id);

      if (planIds.length > 0) {
        await tx.token.deleteMany({ where: { plannedDateId: { in: planIds } } });
      }

      await tx.plannedDate.deleteMany({ where: { ideaId: id } });
      await tx.dateIdea.delete({ where: { id } });
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
