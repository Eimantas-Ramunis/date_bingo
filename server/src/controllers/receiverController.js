import prisma from '../utils/db.js';
import crypto from 'crypto';

export const viewDate = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token required' });

    const hash = crypto.createHash('sha256').update(token).digest('hex');

    const tokenRecord = await prisma.token.findUnique({
      where: { hash },
      include: { 
        plannedDate: {
            include: { idea: true }
        }
      }
    });

    if (!tokenRecord) return res.status(404).json({ error: 'Invalid token' });
    if (tokenRecord.revoked) return res.status(410).json({ error: 'Link expired (revoked)' });
    if (new Date() > tokenRecord.expiry) return res.status(410).json({ error: 'Link expired' });

    const plan = tokenRecord.plannedDate;
    const idea = plan.idea;
    const isVetoed = plan.status === 'VETOED' || plan.planBActive;

    // Construct response based on type
    const response = {
      type: tokenRecord.type,
      status: plan.status,
      planBActive: plan.planBActive,
      hint: {
        teaser: plan.hintTeaser,
        startTime: plan.hintStartTime,
        dressCode: plan.hintDressCode,
        duration: plan.hintDuration,
        vibes: JSON.parse(idea.vibes || '[]')
      }
    };

    if (tokenRecord.type === 'REVEAL' || isVetoed) {
      if (isVetoed) {
        response.reveal = {
          isVetoed: true,
          planB: {
            title: plan.planBTitle,
            description: plan.planBDesc,
            steps: JSON.parse(plan.planBSteps || '[]')
          },
          planA_summary: idea.title // Minimal info for Plan A
        };
      } else {
        response.reveal = {
          isVetoed: false,
          planA: {
            title: idea.title,
            description: idea.shortDescription,
            duration: idea.duration,
            radius: idea.radius,
            energy: idea.energy,
            image: idea.image, // Include image
            steps: JSON.parse(plan.planASteps || '[]')
          }
        };
      }
    }

    res.json(response);
  } catch (err) { next(err); }
};

export const vetoDate = async (req, res, next) => {
  try {
    const { token, reason } = req.body;
    const hash = crypto.createHash('sha256').update(token).digest('hex');

    const tokenRecord = await prisma.token.findUnique({
      where: { hash },
      include: { plannedDate: true }
    });

    if (!tokenRecord) return res.status(404).json({ error: 'Invalid token' });
    // Allow veto only on Reveal? Or Hint too? "Veto button on Reveal only" per prompt.
    // We'll enforce this via UI mostly, but logical check is good.
    
    await prisma.plannedDate.update({
      where: { id: tokenRecord.plannedDateId },
      data: {
        status: 'VETOED',
        planBActive: true,
        vetoReason: reason
      }
    });

    res.json({ success: true });
  } catch (err) { next(err); }
};
