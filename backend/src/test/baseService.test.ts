import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseService } from '../services/baseService';
import { IBaseRepository } from '../repositories/interfaces/IBaseRepository';
import { CustomError, typeErrors } from '../utils/customError';
import { ErrorCode } from '../utils/errorCodes';

describe('BaseService', () => {
  let baseService: BaseService;
  let mockRepository: IBaseRepository;

  beforeEach(() => {
    mockRepository = {
      getMessage: vi.fn(),
      setMessage: vi.fn(),
    };
    baseService = new BaseService(mockRepository);
  });

  describe('getMessage', () => {
    it('should return the default message', async () => {
      const expectedMessage = 'Hello World!';
      vi.mocked(mockRepository.getMessage).mockResolvedValue(expectedMessage);

      const message = await baseService.getMessage();

      expect(message).toBe(expectedMessage);
      expect(mockRepository.getMessage).toHaveBeenCalledTimes(1);
    });

    it('should throw a CustomError when repository throws an error', async () => {
      const error = new Error('Repository error');
      vi.mocked(mockRepository.getMessage).mockRejectedValue(error);

      await expect(baseService.getMessage()).rejects.toThrow(CustomError);
    });

    it('should re-throw CustomError from repository without wrapping', async () => {
      const customError = new CustomError(ErrorCode.DATABASE_ERROR, typeErrors.REPOSITORY_ERROR, 'getMessage', null);
      vi.mocked(mockRepository.getMessage).mockRejectedValue(customError);

      await expect(baseService.getMessage()).rejects.toBe(customError);
    });
  });

  describe('setMessage', () => {
    it('should call repository setMessage with the provided message', async () => {
      const message = 'New message';
      vi.mocked(mockRepository.setMessage).mockResolvedValue();

      await baseService.setMessage(message);

      expect(mockRepository.setMessage).toHaveBeenCalledWith(message);
      expect(mockRepository.setMessage).toHaveBeenCalledTimes(1);
    });

    it('should throw a CustomError when repository throws an error', async () => {
      const error = new Error('Repository error');
      vi.mocked(mockRepository.setMessage).mockRejectedValue(error);

      await expect(baseService.setMessage('Test')).rejects.toThrow(CustomError);
    });

    it('should re-throw CustomError from repository without wrapping', async () => {
      const customError = new CustomError(ErrorCode.DATABASE_ERROR, typeErrors.REPOSITORY_ERROR, 'setMessage', null);
      vi.mocked(mockRepository.setMessage).mockRejectedValue(customError);

      await expect(baseService.setMessage('Test')).rejects.toBe(customError);
    });
  });
});
