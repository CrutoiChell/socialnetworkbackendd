import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { XpService } from '../xp/xp.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
  let jwt: { sign: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    jwt = { sign: jest.fn().mockReturnValue('signed.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        {
          provide: XpService,
          useValue: {
            awardDailyLoginXp: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('создаёт пользователя и возвращает токен', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 1,
        email: 'a@b.com',
        username: 'alice',
      });

      const result = await service.register({
        email: 'a@b.com',
        username: 'alice',
        password: 'secret123',
      });

      expect(result.user).toEqual(
        expect.objectContaining({
          id: 1,
          email: 'a@b.com',
          username: 'alice',
        }),
      );
      expect(result.token).toBe('signed.jwt.token');
      const expectedData = expect.objectContaining({
        email: 'a@b.com',
        username: 'alice',
      }) as Record<string, unknown>;
      const expectedSelect = expect.objectContaining({
        id: true,
        email: true,
        username: true,
      }) as Record<string, unknown>;
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expectedData,
        select: expectedSelect,
      });
      // пароль должен быть захеширован
      const [[createArgs]] = prisma.user.create.mock.calls as [
        [{ data: { password: string } }],
      ];
      const hashedPassword = createArgs.data.password;
      expect(hashedPassword).not.toBe('secret123');
      expect(await bcrypt.compare('secret123', hashedPassword)).toBe(true);
    });

    it('бросает ConflictException если email или username уже заняты', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 99 });

      await expect(
        service.register({
          email: 'a@b.com',
          username: 'alice',
          password: 'secret123',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('возвращает токен и пользователя без пароля при валидных данных', async () => {
      const password = await bcrypt.hash('secret123', 10);
      const dbUser = {
        id: 1,
        email: 'a@b.com',
        username: 'alice',
        password,
      };
      // Вход по email идёт через findFirst (case-insensitive), refresh — через findUnique.
      prisma.user.findFirst.mockResolvedValue(dbUser);
      prisma.user.findUnique.mockResolvedValue(dbUser);

      const result = await service.login({
        email: 'a@b.com',
        password: 'secret123',
      });

      expect(result.user).toEqual({
        id: 1,
        email: 'a@b.com',
        username: 'alice',
      });
      expect(result.user as Record<string, unknown>).not.toHaveProperty(
        'password',
      );
      expect(result.token).toBe('signed.jwt.token');
    });

    it('бросает UnauthorizedException если пользователь не найден', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.login({ email: 'a@b.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('бросает UnauthorizedException при неверном пароле', async () => {
      const password = await bcrypt.hash('correct', 10);
      prisma.user.findFirst.mockResolvedValue({
        id: 1,
        email: 'a@b.com',
        username: 'alice',
        password,
      });

      await expect(
        service.login({ email: 'a@b.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
