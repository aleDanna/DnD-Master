import bcrypt from 'bcryptjs';
import { AuthService, registerSchema, updatePasswordSchema } from '@/lib/auth/auth.service';

// Mock Prisma
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/db/prisma';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    const validInput = {
      email: 'test@example.com',
      password: 'Password123',
      displayName: 'Test User',
    };

    it('should register a new user successfully', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: validInput.email,
        displayName: validInput.displayName,
        passwordHash: 'hashed-password',
      });

      const result = await authService.register(validInput);

      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: 'user-123',
        email: validInput.email,
        displayName: validInput.displayName,
      });
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: validInput.email,
          passwordHash: expect.any(String),
          displayName: validInput.displayName,
        },
      });
    });

    it('should fail if user already exists', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-user',
        email: validInput.email,
      });

      const result = await authService.register(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('A user with this email already exists');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should fail with invalid email', async () => {
      const result = await authService.register({
        ...validInput,
        email: 'invalid-email',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email address');
    });

    it('should fail with short password', async () => {
      const result = await authService.register({
        ...validInput,
        password: 'short',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Password must be at least 8 characters');
    });

    it('should fail with password missing uppercase', async () => {
      const result = await authService.register({
        ...validInput,
        password: 'password123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('uppercase');
    });

    it('should fail with password missing lowercase', async () => {
      const result = await authService.register({
        ...validInput,
        password: 'PASSWORD123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('lowercase');
    });

    it('should fail with password missing number', async () => {
      const result = await authService.register({
        ...validInput,
        password: 'PasswordNoNumber',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('number');
    });

    it('should fail with short display name', async () => {
      const result = await authService.register({
        ...validInput,
        displayName: 'A',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Display name must be at least 2 characters');
    });
  });

  describe('updatePassword', () => {
    const userId = 'user-123';
    const currentPasswordHash = bcrypt.hashSync('OldPassword123', 10);

    it('should update password successfully', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        passwordHash: currentPasswordHash,
      });
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        id: userId,
      });

      const result = await authService.updatePassword(userId, {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword456',
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { passwordHash: expect.any(String) },
      });
    });

    it('should fail with incorrect current password', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        passwordHash: currentPasswordHash,
      });

      const result = await authService.updatePassword(userId, {
        currentPassword: 'WrongPassword123',
        newPassword: 'NewPassword456',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Current password is incorrect');
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should fail if user not found', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await authService.updatePassword(userId, {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword456',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should fail with weak new password', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        passwordHash: currentPasswordHash,
      });

      const result = await authService.updatePassword(userId, {
        currentPassword: 'OldPassword123',
        newPassword: 'weak',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Password must be at least 8 characters');
    });
  });

  describe('updateProfile', () => {
    const userId = 'user-123';

    it('should update display name successfully', async () => {
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        displayName: 'New Name',
      });

      const result = await authService.updateProfile(userId, {
        displayName: 'New Name',
      });

      expect(result.success).toBe(true);
      expect(result.user?.displayName).toBe('New Name');
    });

    it('should update avatar URL successfully', async () => {
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        displayName: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
      });

      const result = await authService.updateProfile(userId, {
        avatarUrl: 'https://example.com/avatar.jpg',
      });

      expect(result.success).toBe(true);
    });

    it('should fail with invalid avatar URL', async () => {
      const result = await authService.updateProfile(userId, {
        avatarUrl: 'not-a-url',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid URL');
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        avatarUrl: null,
        createdAt: new Date(),
      };
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.getUserById('user-123');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          createdAt: true,
        },
      });
    });

    it('should return null if user not found', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await authService.getUserById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('deleteAccount', () => {
    it('should delete user account successfully', async () => {
      (mockPrisma.user.delete as jest.Mock).mockResolvedValue({ id: 'user-123' });

      const result = await authService.deleteAccount('user-123');

      expect(result.success).toBe(true);
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should handle deletion errors', async () => {
      (mockPrisma.user.delete as jest.Mock).mockRejectedValue(new Error('DB error'));

      const result = await authService.deleteAccount('user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to delete account');
    });
  });
});

describe('Validation Schemas', () => {
  describe('registerSchema', () => {
    it('should accept valid input', () => {
      const result = registerSchema.safeParse({
        email: 'valid@email.com',
        password: 'ValidPass123',
        displayName: 'Valid Name',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = registerSchema.safeParse({
        email: 'invalid',
        password: 'ValidPass123',
        displayName: 'Valid Name',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updatePasswordSchema', () => {
    it('should accept valid passwords', () => {
      const result = updatePasswordSchema.safeParse({
        currentPassword: 'OldPass123',
        newPassword: 'NewPass456',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty current password', () => {
      const result = updatePasswordSchema.safeParse({
        currentPassword: '',
        newPassword: 'NewPass456',
      });
      expect(result.success).toBe(false);
    });
  });
});
