import { useState } from 'react';
import axios from 'axios';
import { useMutation, useQueryClient } from 'react-query';
import { api } from '../../../api/config';
import { useTheme } from '../../../context/ThemeContext';

interface StarRatingProps {
  productId: number;
  averageRating: number | null;
  reviewCount: number;
  onReviewSubmitted?: () => void;
}

const submitReview = async ({
  productId,
  rating,
}: {
  productId: number;
  rating: number;
}): Promise<void> => {
  await axios.post(`${api.baseURL}${api.endpoints.productReviews}`, {
    productId,
    rating,
    reviewerName: 'Anonymous',
  });
};

export default function StarRating({
  productId,
  averageRating,
  reviewCount,
  onReviewSubmitted,
}: StarRatingProps) {
  const { darkMode } = useTheme();
  const [hovered, setHovered] = useState<number>(0);
  const [selected, setSelected] = useState<number>(0);
  const queryClient = useQueryClient();

  const { mutate, isLoading, isSuccess, isError } = useMutation(submitReview, {
    onSuccess: () => {
      queryClient.invalidateQueries('reviewSummaries');
      onReviewSubmitted?.();
    },
  });

  const handleStarClick = (star: number) => {
    if (isSuccess) return;
    setSelected(star);
    mutate({ productId, rating: star });
  };

  const displayRating = averageRating != null ? averageRating : 0;
  const filled = isSuccess ? selected : displayRating;

  return (
    <div className="flex flex-col gap-1">
      <div
        className="flex items-center gap-1"
        role="group"
        aria-label={`Rate this product, current average ${averageRating != null ? averageRating.toFixed(1) : 'no'} stars`}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = (hovered || filled) >= star;
          return (
            <button
              key={star}
              type="button"
              disabled={isSuccess || isLoading}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => !isSuccess && setHovered(star)}
              onMouseLeave={() => !isSuccess && setHovered(0)}
              aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
              className={[
                'text-3xl leading-none transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded',
                isSuccess || isLoading ? 'cursor-default' : 'cursor-pointer hover:scale-125',
                isActive ? 'text-yellow-400' : darkMode ? 'text-gray-600' : 'text-gray-300',
              ].join(' ')}
            >
              ★
            </button>
          );
        })}
      </div>
      <p
        className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}
      >
        {isSuccess ? (
          <span className="text-primary font-medium">Thanks for rating!</span>
        ) : isError ? (
          <span className="text-red-500">Submission failed – please try again.</span>
        ) : isLoading ? (
          <span>Submitting…</span>
        ) : averageRating != null ? (
          `${averageRating.toFixed(1)} / 5 (${reviewCount} review${reviewCount !== 1 ? 's' : ''})`
        ) : (
          'No reviews yet – be the first!'
        )}
      </p>
    </div>
  );
}
