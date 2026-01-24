import prisma from '../utils/db.js';
import argon2 from 'argon2';

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    
    if (!user) {
      // Dummy verification to prevent timing attacks
      await argon2.verify('$argon2id$v=19$m=4096,t=3,p=1$dummy$dummy', password);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.userId = user.id;
    res.json({ message: 'Logged in' });
  } catch (err) {
    next(err);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password too short' });
    }
    
    // We assume the user is already authenticated via session middleware
    const userId = req.session.userId;
    const passwordHash = await argon2.hash(newPassword);
    
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });
    
    res.json({ success: true });
  } catch (err) { next(err); }
};

export const logout = (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out' });
};

export const me = (req, res) => {
  if (req.session.userId) {
    res.json({ loggedIn: true });
  } else {
    res.json({ loggedIn: false });
  }
};
