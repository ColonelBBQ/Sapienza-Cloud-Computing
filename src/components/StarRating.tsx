import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';

interface StarRatingProps {
  totalStars?: number;
  onChange?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({ totalStars = 5, onChange }) => {
  const [rating, setRating] = useState<number | null>(null);

  const handleRating = (value: number) => {
    setRating(value);
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div className='star-container'>
      {[...Array(totalStars)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <label key={index}>
            <input 
              type="radio" 
              name="rating" 
              value={ratingValue}
              onClick={() => handleRating(ratingValue)}
            />
            <FaStar 
              className="star" 
              color={ratingValue <= (rating || 0) ? "#ffc107" : "#e4e5e9"}
              size={40}
            />
          </label>
        );
      })}
    </div>
  );
};

export default StarRating;