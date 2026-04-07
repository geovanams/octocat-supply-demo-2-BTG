-- Seed data for product_reviews
-- Provides sample star ratings for products

INSERT INTO product_reviews (review_id, product_id, rating, reviewer_name, comment, created_at) VALUES
  (1, 1, 5, 'Alice T.', 'My cat absolutely loves this feeder! The AI schedule detection is surprisingly accurate.', '2024-02-01T09:00:00Z'),
  (2, 1, 4, 'Bob M.', 'Great product, setup was straightforward. Knocked off one star because the app can be a bit slow.', '2024-02-05T14:30:00Z'),
  (3, 1, 5, 'Carol S.', 'Best feeder we have ever owned. No more 3 AM wake-up calls!', '2024-02-10T08:15:00Z'),
  (4, 2, 4, 'Dave L.', 'Cleans itself reliably. The health reports are a nice bonus.', '2024-02-03T11:00:00Z'),
  (5, 2, 3, 'Eve R.', 'Works as advertised but the motor is a bit loud at night.', '2024-02-07T20:00:00Z'),
  (6, 3, 5, 'Frank W.', 'My cats are glued to the screen. The laser show feature is hilarious.', '2024-02-12T17:45:00Z'),
  (7, 4, 4, 'Grace K.', 'Tracks activity well. The mood detection is more of a fun gimmick but my cats enjoy it.', '2024-02-14T10:30:00Z'),
  (8, 5, 5, 'Henry O.', 'Night vision is crystal clear. Caught my cat stealing treats at 2 AM.', '2024-02-15T09:00:00Z'),
  (9, 6, 5, 'Iris P.', 'Worth every penny. Our senior cat sleeps so much better now.', '2024-02-16T12:00:00Z'),
  (10, 7, 4, 'Jack N.', 'Sturdy and well designed. Takes a bit of space but cats love every level.', '2024-02-18T15:20:00Z');
