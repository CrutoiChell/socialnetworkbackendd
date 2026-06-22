import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { PostsModule } from './posts/posts.module';
import { UsersModule } from './users/users.module';
import { PresenceModule } from './presence/presence.module';
import { StatsModule } from './stats/stats.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { NotificationsModule } from './notifications/notifications.module';
import { XpModule } from './xp/xp.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    StorageModule,
    XpModule,
    PresenceModule,
    AuthModule,
    ChatModule,
    PostsModule,
    UsersModule,
    BookmarksModule,
    NotificationsModule,
    StatsModule,
    PaymentsModule,
  ],
})
export class AppModule {}
