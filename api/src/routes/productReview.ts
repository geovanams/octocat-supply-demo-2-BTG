/**
 * @swagger
 * tags:
 *   name: ProductReviews
 *   description: API endpoints for managing product star reviews
 */

/**
 * @swagger
 * /api/product-reviews/product/{productId}:
 *   get:
 *     summary: Get all reviews for a product
 *     tags: [ProductReviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: List of reviews for the product
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductReview'
 *
 * /api/product-reviews/product/{productId}/average:
 *   get:
 *     summary: Get average star rating for a product
 *     tags: [ProductReviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Average rating
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 productId:
 *                   type: integer
 *                 averageRating:
 *                   type: number
 *                   nullable: true
 *                 reviewCount:
 *                   type: integer
 *
 * /api/product-reviews/summaries:
 *   get:
 *     summary: Get review summaries (average rating and count) for all products
 *     tags: [ProductReviews]
 *     responses:
 *       200:
 *         description: Map of productId to summary (avgRating, count)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: object
 *                 properties:
 *                   avgRating:
 *                     type: number
 *                   count:
 *                     type: integer
 *
 * /api/product-reviews/averages:
 *   get:
 *     summary: Get average star ratings for all products
 *     tags: [ProductReviews]
 *     responses:
 *       200:
 *         description: Map of productId to average rating
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: number
 *
 * /api/product-reviews:
 *   post:
 *     summary: Submit a new star review for a product
 *     tags: [ProductReviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - rating
 *             properties:
 *               productId:
 *                 type: integer
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               reviewerName:
 *                 type: string
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductReview'
 *       400:
 *         description: Validation error (e.g. rating out of range)
 *
 * /api/product-reviews/{id}:
 *   delete:
 *     summary: Delete a review by ID
 *     tags: [ProductReviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Review ID
 *     responses:
 *       204:
 *         description: Review deleted successfully
 *       404:
 *         description: Review not found
 */

import express from 'express';
import { ProductReview } from '../models/productReview';
import { getProductReviewsRepository } from '../repositories/productReviewsRepo';
import { NotFoundError, ValidationError } from '../utils/errors';

const router = express.Router();

// Get all reviews for a specific product
router.get('/product/:productId', async (req, res, next) => {
  try {
    const repo = await getProductReviewsRepository();
    const reviews = await repo.findByProductId(parseInt(req.params.productId));
    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

// Get average rating for a specific product
router.get('/product/:productId/average', async (req, res, next) => {
  try {
    const productId = parseInt(req.params.productId);
    const repo = await getProductReviewsRepository();
    const reviews = await repo.findByProductId(productId);
    const averageRating = await repo.getAverageRating(productId);
    res.json({ productId, averageRating, reviewCount: reviews.length });
  } catch (error) {
    next(error);
  }
});

// Get review summaries (avgRating + count) for all products
router.get('/summaries', async (req, res, next) => {
  try {
    const repo = await getProductReviewsRepository();
    const summaries = await repo.getReviewSummaries();
    res.json(summaries);
  } catch (error) {
    next(error);
  }
});

// Get average ratings for all products
router.get('/averages', async (req, res, next) => {
  try {
    const repo = await getProductReviewsRepository();
    const averages = await repo.getAllAverageRatings();
    res.json(averages);
  } catch (error) {
    next(error);
  }
});

// Submit a new review
router.post('/', async (req, res, next) => {
  try {
    const { productId, rating, reviewerName, comment } = req.body;

    if (!productId || typeof productId !== 'number') {
      res.status(400).json({ error: 'productId is required and must be a number' });
      return;
    }
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
      return;
    }

    const repo = await getProductReviewsRepository();
    const review = await repo.create({
      productId,
      rating,
      reviewerName: reviewerName || 'Anonymous',
      comment,
    } as Omit<ProductReview, 'reviewId' | 'createdAt'>);
    res.status(201).json(review);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else {
      next(error);
    }
  }
});

// Delete a review by ID
router.delete('/:id', async (req, res, next) => {
  try {
    const repo = await getProductReviewsRepository();
    await repo.delete(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).send('Review not found');
    } else {
      next(error);
    }
  }
});

export default router;
