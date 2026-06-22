const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('moderator123', 12);
  const mod = await prisma.user.upsert({
    where: { email: 'moderator@stellar.local' },
    update: { role: 'MODERATOR' },
    create: { email: 'moderator@stellar.local', username: 'moderator', password: hash, role: 'MODERATOR' }
  });
  console.log('Moderator created:', mod.id, mod.email);
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
