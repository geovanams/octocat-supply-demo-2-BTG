import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductReviewsRepository } from './productReviewsRepo';
import { NotFoundError, ValidationError } from '../utils/errors';

vi.mock('../db/sqlite', () => ({
  getDatabase: vi.fn(),
}));

import { getDatabase } from '../db/sqlite';

describe('ProductReviewsRepository', () => {
  let repository: ProductReviewsRepository;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      db: {} as any,
      run: vi.fn(),
      get: vi.fn(),
      all: vi.fn(),
      close: vi.fn(),
    };

    (getDatabase as any).mockResolvedValue(mockDb);
    repository = new ProductReviewsRepository(mockDb);
    vi.clearAllMocks();
  });

  describe('findByProductId', () => {
    it('should return all reviews for a product', async () => {
      const mockRows = [
        {
          review_id: 1,
          product_id: 1,
          rating: 5,
          reviewer_name: 'Alice',
          comment: 'Great!',
          created_at: '2024-02-01T09:00:00Z',
        },
        {
          review_id: 2,
          product_id: 1,
          rating: 4,
          reviewer_name: 'Bob',
          comment: 'Good.',
          created_at: '2024-02-02T10:00:00Z',
        },
      ];
      mockDb.all.mockResolvedValue(mockRows);

      const result = await repository.findByProductId(1);

      expect(mockDb.all).toHaveBeenCalledWith(
        'SELECT * FROM product_reviews WHERE product_id = ? ORDER BY created_at DESC',
        [1],
      );
      expect(result).toHaveLength(2);
      expect(result[0].reviewId).toBe(1);
      expect(result[0].rating).toBe(5);
    });

    it('should return empty array when no reviews exist', async () => {
      mockDb.all.mockResolvedValue([]);

      const result = await repository.findByProductId(999);

      expect(result).toEqual([]);
    });
  });

  describe('getAverageRating', () => {
    it('should return the average rating for a product', async () => {
      mockDb.get.mockResolvedValue({ avg_rating: 4.5 });

      const result = await repository.getAverageRating(1);

      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT AVG(rating) as avg_rating FROM product_reviews WHERE product_id = ?',
        [1],
      );
      expect(result).toBe(4.5);
    });

    it('should return null when product has no reviews', async () => {
      mockDb.get.mockResolvedValue({ avg_rating: null });

      const result = await repository.getAverageRating(999);

      expect(result).toBeNull();
    });
  });

  describe('getReviewSummaries', () => {
    it('should return a map of productId to avgRating and count', async () => {
      mockDb.all.mockResolvedValue([
        { product_id: 1, avg_rating: 4.5, review_count: 2 },
        { product_id: 2, avg_rating: 3.0, review_count: 1 },
      ]);

      const result = await repository.getReviewSummaries();

      expect(result).toEqual({
        1: { avgRating: 4.5, count: 2 },
        2: { avgRating: 3.0, count: 1 },
      });
    });

    it('should return empty object when no reviews exist', async () => {
      mockDb.all.mockResolvedValue([]);

      const result = await repository.getReviewSummaries();

      expect(result).toEqual({});
    });
  });

  describe('getAllAverageRatings', () => {
    it('should return a map of productId to average rating', async () => {
      mockDb.all.mockResolvedValue([
        { product_id: 1, avg_rating: 4.5 },
        { product_id: 2, avg_rating: 3.0 },
      ]);

      const result = await repository.getAllAverageRatings();

      expect(result).toEqual({ 1: 4.5, 2: 3.0 });
    });

    it('should return empty object when no reviews exist', async () => {
      mockDb.all.mockResolvedValue([]);

      const result = await repository.getAllAverageRatings();

      expect(result).toEqual({});
    });
  });

  describe('create', () => {
    it('should create a review and return it', async () => {
      const newReview = { productId: 1, rating: 5, reviewerName: 'Alice', comment: 'Excellent!' };

      mockDb.run.mockResolvedValue({ lastID: 1, changes: 1 });
      mockDb.get.mockResolvedValue({
        review_id: 1,
        product_id: 1,
        rating: 5,
        reviewer_name: 'Alice',
        comment: 'Excellent!',
        created_at: '2024-02-01T09:00:00Z',
      });

      const result = await repository.create(newReview);

      expect(result.reviewId).toBe(1);
      expect(result.rating).toBe(5);
      expect(result.reviewerName).toBe('Alice');
    });

    it('should throw ValidationError when rating is out of range', async () => {
      await expect(
        repository.create({ productId: 1, rating: 6, reviewerName: 'Alice' }),
      ).rejects.toThrow(ValidationError);

      await expect(
        repository.create({ productId: 1, rating: 0, reviewerName: 'Alice' }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('findById', () => {
    it('should return review when found', async () => {
      mockDb.get.mockResolvedValue({
        review_id: 1,
        product_id: 1,
        rating: 5,
        reviewer_name: 'Alice',
        comment: 'Great!',
        created_at: '2024-02-01T09:00:00Z',
      });

      const result = await repository.findById(1);

      expect(result?.reviewId).toBe(1);
      expect(result?.rating).toBe(5);
    });

    it('should return null when review not found', async () => {
      mockDb.get.mockResolvedValue(undefined);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete an existing review', async () => {
      mockDb.run.mockResolvedValue({ changes: 1 });

      await repository.delete(1);

      expect(mockDb.run).toHaveBeenCalledWith(
        'DELETE FROM product_reviews WHERE review_id = ?',
        [1],
      );
    });

    it('should throw NotFoundError when review does not exist', async () => {
      mockDb.run.mockResolvedValue({ changes: 0 });

      await expect(repository.delete(999)).rejects.toThrow(NotFoundError);
    });
  });
});
