import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  // Create Admin
  const passwordHash = await argon2.hash('admin123');
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash
    }
  });

  // Create Sample Ideas
  const ideas = [
    {
        title: 'Hidden Jazz Bar & Walk',
        shortDescription: 'Smooth tunes in a basement followed by a city stroll.',
        vibes: JSON.stringify(['romantic', 'chill']),
        purposeTags: JSON.stringify(['passion', 'talk']),
        energy: 'med',
        seasonTags: JSON.stringify(['winter_ok']),
        radius: 'vilnius',
        duration: '2-3h',
        budget: '$$',
        prepChecklist: JSON.stringify(['Check schedule', 'Book table']),
        planB: JSON.stringify({
            title: 'Vinyl & Wine at Home',
            shortDescription: 'We pick 3 albums each and just listen.',
            steps: ['Order takeout', 'Light candles']
        })
    },
    {
        title: 'Pottery Wheel',
        shortDescription: 'Getting messy together.',
        vibes: JSON.stringify(['playful', 'creative']),
        purposeTags: JSON.stringify(['novelty', 'laugh']),
        energy: 'high',
        seasonTags: JSON.stringify(['all_year']),
        radius: 'vilnius',
        duration: '2h',
        budget: '$$$',
        prepChecklist: JSON.stringify(['Book slot']),
        planB: JSON.stringify({
            title: 'Bad Art Challenge',
            shortDescription: 'Paint each other in 20 mins.',
            steps: ['Buy cheap canvas', 'Wine']
        })
    }
  ];

  for (const idea of ideas) {
      await prisma.dateIdea.create({ data: idea });
  }
  
  console.log('Seeding complete');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
