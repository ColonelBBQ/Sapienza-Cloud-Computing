import '@aws-amplify/ui-react/styles.css';
import { useState, useEffect, useRef } from "react";
import StarRating from '../components/StarRating';
import { Schema } from "../../amplify/data/resource";  
import { generateClient } from "aws-amplify/data";
import { useNavigate } from 'react-router-dom';

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

  const [audioData, setAudioData] = useState<Uint8Array | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const navigate = useNavigate();

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

  useEffect(() => {
    if (isRecording) {
      const audioContext = new (window.AudioContext || window.AudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const draw = () => {
            analyser.getByteTimeDomainData(dataArray);
            setAudioData(new Uint8Array(dataArray));
            requestAnimationFrame(draw);
          };
          draw();
        })
        .catch(error => console.error('Error accessing microphone:', error));
    } else {
      analyserRef.current = null;
      setAudioData(null);
    }
  }, [isRecording]);

  useEffect(() => {
    if (!audioData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasContext = canvas.getContext('2d');
    if (!canvasContext) return;

    canvasContext.clearRect(0, 0, canvas.width, canvas.height);

    canvasContext.fillStyle = 'rgb(200, 200, 200)';
    canvasContext.fillRect(0, 0, canvas.width, canvas.height);

    canvasContext.lineWidth = 2;
    canvasContext.strokeStyle = 'rgb(0, 0, 0)';

    canvasContext.beginPath();

    const sliceWidth = canvas.width * 1.0 / audioData.length;
    let x = 0;

    for(let i = 0; i < audioData.length; i++) {
      const v = audioData[i] / 128.0;
      const y = v * canvas.height / 2;

      if(i === 0) {
        canvasContext.moveTo(x, y);
      } else {
        canvasContext.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasContext.lineTo(canvas.width, canvas.height / 2);
    canvasContext.stroke();
  }, [audioData]);

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
      navigate('/')
      
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
            <canvas ref={canvasRef} width={300} height={100}></canvas>
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
