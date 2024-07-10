import '@aws-amplify/ui-react/styles.css'
import { useState } from "react";
import StarRating from '../components/StarRating';
import { Schema } from "../../amplify/data/resource";  
import { generateClient } from "aws-amplify/data";

type GeneratedClient = ReturnType<typeof generateClient<Schema>>;

interface HomeProps {
    client: GeneratedClient;
    userName: string;
}

export function HomeNoSession({ client, userName }: HomeProps) {
  const [content, setContent] = useState('');
  const [rating, setRating] = useState('0');

  async function createSession() {
    if (!content || !rating) {
      alert('Please enter both content and rating');
      return;
    }

    const numericRating = parseInt(rating, 10);
    if (numericRating < 1 || numericRating > 5) {
      alert('Rating must be between 1 and 5');
      return;
    }

    try {
      await client.models.Sessions.create({
        content: content,
        score_rating: numericRating,
        score_volume: 0
      });
      
      setContent('');
      setRating('');
      
      alert('Session created successfully!');
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session. Please try again.');
    }
  }

  const handleRatingChange = (newRating: number) => {
    setRating(newRating.toString());
  };

  return (
    <main>
      <h1>Ciao {userName}! Registra la tua prima attivitá!</h1>
      <div className='container-activity'>
        <input 
          type="text" 
          placeholder="Enter content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <StarRating totalStars={5} onChange={handleRatingChange} />              
        <button onClick={createSession}>Send</button>
      </div>
    </main>
  );
}

export default HomeNoSession;