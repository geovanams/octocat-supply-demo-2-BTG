/**
 * @swagger
 * components:
 *   schemas:
 *     ProductReview:
 *       type: object
 *       required:
 *         - reviewId
 *         - productId
 *         - rating
 *       properties:
 *         reviewId:
 *           type: integer
 *           description: The unique identifier for the review
 *         productId:
 *           type: integer
 *           description: The ID of the product being reviewed
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Star rating from 1 to 5
 *         reviewerName:
 *           type: string
 *           description: Display name of the reviewer
 *         comment:
 *           type: string
 *           description: Optional review comment
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: ISO 8601 timestamp when the review was created
 */
export interface ProductReview {
  reviewId: number;
  productId: number;
  rating: number;
  reviewerName: string;
  comment?: string;
  createdAt: string;
}
