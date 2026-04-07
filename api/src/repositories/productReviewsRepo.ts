/**
 * Repository for product reviews data access
 */

import { getDatabase, DatabaseConnection } from '../db/sqlite';
import { ProductReview } from '../models/productReview';
import { handleDatabaseError, NotFoundError, ValidationError } from '../utils/errors';
import { buildInsertSQL, objectToCamelCase, mapDatabaseRows, DatabaseRow } from '../utils/sql';

export class ProductReviewsRepository {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  /**
   * Get all reviews for a specific product
   */
  async findByProductId(productId: number): Promise<ProductReview[]> {
    try {
      const rows = await this.db.all<DatabaseRow>(
        'SELECT * FROM product_reviews WHERE product_id = ? ORDER BY created_at DESC',
        [productId],
      );
      return mapDatabaseRows<ProductReview>(rows);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get the average rating for a product (returns null when no reviews exist)
   */
  async getAverageRating(productId: number): Promise<number | null> {
    try {
      const result = await this.db.get<{ avg_rating: number | null }>(
        'SELECT AVG(rating) as avg_rating FROM product_reviews WHERE product_id = ?',
        [productId],
      );
      return result?.avg_rating ?? null;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get average ratings for all products as a map of productId -> avgRating
   */
  async getAllAverageRatings(): Promise<Record<number, number>> {
    try {
      const rows = await this.db.all<{ product_id: number; avg_rating: number }>(
        'SELECT product_id, AVG(rating) as avg_rating FROM product_reviews GROUP BY product_id',
      );
      const result: Record<number, number> = {};
      for (const row of rows) {
        result[row.product_id] = row.avg_rating;
      }
      return result;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get review summaries (average rating + count) for all products
   */
  async getReviewSummaries(): Promise<Record<number, { avgRating: number; count: number }>> {
    try {
      const rows = await this.db.all<{
        product_id: number;
        avg_rating: number;
        review_count: number;
      }>(
        'SELECT product_id, AVG(rating) as avg_rating, COUNT(*) as review_count FROM product_reviews GROUP BY product_id',
      );
      const result: Record<number, { avgRating: number; count: number }> = {};
      for (const row of rows) {
        result[row.product_id] = { avgRating: row.avg_rating, count: row.review_count };
      }
      return result;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Create a new review
   */
  async create(review: Omit<ProductReview, 'reviewId' | 'createdAt'>): Promise<ProductReview> {
    if (review.rating < 1 || review.rating > 5) {
      throw new ValidationError('Rating must be between 1 and 5');
    }
    try {
      const { sql, values } = buildInsertSQL('product_reviews', review);
      const result = await this.db.run(sql, values);
      const created = await this.findById(result.lastID || 0);
      if (!created) {
        throw new Error('Failed to retrieve created review');
      }
      return created;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get review by ID
   */
  async findById(id: number): Promise<ProductReview | null> {
    try {
      const row = await this.db.get<DatabaseRow>(
        'SELECT * FROM product_reviews WHERE review_id = ?',
        [id],
      );
      return row ? objectToCamelCase<ProductReview>(row) : null;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Delete a review by ID
   */
  async delete(id: number): Promise<void> {
    try {
      const result = await this.db.run('DELETE FROM product_reviews WHERE review_id = ?', [id]);
      if (result.changes === 0) {
        throw new NotFoundError('ProductReview', id);
      }
    } catch (error) {
      handleDatabaseError(error, 'ProductReview', id);
    }
  }
}

export async function createProductReviewsRepository(
  isTest: boolean = false,
): Promise<ProductReviewsRepository> {
  const db = await getDatabase(isTest);
  return new ProductReviewsRepository(db);
}

let productReviewsRepo: ProductReviewsRepository | null = null;

export async function getProductReviewsRepository(
  isTest: boolean = false,
): Promise<ProductReviewsRepository> {
  if (!productReviewsRepo) {
    productReviewsRepo = await createProductReviewsRepository(isTest);
  }
  return productReviewsRepo;
}
