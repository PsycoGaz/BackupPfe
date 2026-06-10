import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepository: any;
  let mockJwtService: any;

  beforeEach(async () => {
    mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should throw UnauthorizedException for invalid email', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'invalid@test.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const hashedPassword = await bcrypt.hash('correct-password', 10);
      mockUserRepository.findOne.mockResolvedValue({
        id: '1',
        email: 'user@test.com',
        passwordHash: hashedPassword,
      });

      await expect(
        service.login({ email: 'user@test.com', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return token and user on successful login', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockUserRepository.findOne.mockResolvedValue({
        id: '1',
        email: 'user@test.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'EMPLOYEE',
        passwordHash: hashedPassword,
      });

      const result = await service.login({
        email: 'user@test.com',
        password: 'password123',
      });

      expect(result.accessToken).toBe('mock-token');
      expect(result.user.email).toBe('user@test.com');
    });
  });

  describe('register', () => {
    it('should throw ConflictException if email exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: '1' });

      await expect(
        service.register({
          firstName: 'Test',
          lastName: 'User',
          email: 'existing@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user and return token', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({
        firstName: 'Test',
        lastName: 'User',
        email: 'new@test.com',
        role: 'EMPLOYEE',
      });
      mockUserRepository.save.mockResolvedValue({
        id: '1',
        firstName: 'Test',
        lastName: 'User',
        email: 'new@test.com',
        role: 'EMPLOYEE',
      });

      const result = await service.register({
        firstName: 'Test',
        lastName: 'User',
        email: 'new@test.com',
        password: 'password123',
      });

      expect(result.accessToken).toBe('mock-token');
      expect(result.user.email).toBe('new@test.com');
    });
  });
});
