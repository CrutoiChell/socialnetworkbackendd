import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Удаляю все данные...');

  // Удаляем в порядке зависимостей (дочерние → родительские)
  await prisma.pollVote.deleteMany();
  await prisma.poll.deleteMany();
  await prisma.postMedia.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.globalMessage.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.xpLog.deleteMany();
  await prisma.user.deleteMany();

  console.log('База очищена.');

  const password = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@stellar.local',
      username: 'admin',
      password,
      role: 'ADMIN',
      isPremium: true,
    },
  });

  console.log('Администратор создан:');
  console.log('  email:    admin@stellar.local');
  console.log('  username: admin');
  console.log('  password: admin123');
  console.log('  id:      ', admin.id);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
