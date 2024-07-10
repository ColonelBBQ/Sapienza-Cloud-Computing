import '@aws-amplify/ui-react/styles.css';
import { useState, useEffect } from "react";
import StarRating from '../components/StarRating';
import { Schema } from "../../amplify/data/resource";  
import { generateClient } from "aws-amplify/data";

type GeneratedClient = ReturnType<typeof generateClient<Schema>>;

interface HomeProps {
  client: GeneratedClient;
}

export function NewSession({ client }: HomeProps) {
  const [content, setContent] = useState('');
  const [rating, setRating] = useState('0');
  const [isRecording, setIsRecording] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number | null>(null);
  const [isStart, setIsStart] = useState(true);
  const [isQuit, setIsQuit] = useState(false);


  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && startTime !== null) {
      interval = setInterval(() => {
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;
        setElapsedTime(elapsedTime);
      }, 1000); // Update every second
    } else {
      setElapsedTime(null);
    }

    return () => clearInterval(interval);
  }, [isRecording, startTime]);

  const startRecording = () => {
    setIsRecording(true);
    setStartTime(Date.now());
    setIsStart(false)
  };

  const stopRecording = () => {
    setIsRecording(false);
    setStartTime(null);
    setIsQuit(true)
  };

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

  const formatTime = (milliseconds: number | null) => {
    if (milliseconds === null) return '';
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <main>
      <div className='container-activity'>
        {isStart && (
          <>
          <h1>When You Are Ready to Meditate Press Start!</h1>
          <button onClick={startRecording}>Start</button>
          </>
        )}

        {isRecording && !isQuit && (
          <>
            <p>Recording Time: {formatTime(elapsedTime)}</p>
            <button onClick={stopRecording}>Quit</button>
          </>
        )}

        {!isRecording && isQuit && (
          <>
            <input 
              type="text" 
              placeholder="Enter content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <StarRating totalStars={5} onChange={handleRatingChange} />              
            <button onClick={createSession}>Send</button>
          </>
        )}
      </div>
    </main>
  );
}

export default NewSession;
