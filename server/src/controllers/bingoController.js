import prisma from '../utils/db.js';

export const getBingoState = async (req, res, next) => {
  try {
    const tiles = await prisma.bingoTile.findMany();
    res.json(tiles);
  } catch (err) { next(err); }
};

export const resetBingo = async (req, res, next) => {
  try {
    await prisma.bingoTile.deleteMany();
    res.json({ success: true });
  } catch (err) { next(err); }
};
