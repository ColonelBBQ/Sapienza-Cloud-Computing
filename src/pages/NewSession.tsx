import '@aws-amplify/ui-react/styles.css';
import { useState, useEffect, useRef } from "react";
import StarRating from '../components/StarRating';
import { Schema } from "../../amplify/data/resource";  
import { generateClient } from "aws-amplify/data";
import { useNavigate } from 'react-router-dom';
import { fetchUserAttributes } from '@aws-amplify/auth';

type GeneratedClient = ReturnType<typeof generateClient<Schema>>;

interface HomeProps {
  client: GeneratedClient;
}

export function NewSession({ client }: HomeProps) {
  const [content, setContent] = useState('');
  const [rating, setRating] = useState('0');
  const [isRecording, setIsRecording] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number | null>(null);
  const [isStart, setIsStart] = useState(true);
  const [isQuit, setIsQuit] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [audioData, setAudioData] = useState<Uint8Array | null>(null);
  const [averageVolume, setAverageVolume] = useState<number>(0);
  const [maxVolume, setMaxVolume] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [userId, setUserId] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserAttributes().then(attributes => {
      setUserId(attributes.sub || 'Unknown');
    }).catch(console.error);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && startTime !== null) {
      interval = setInterval(() => {
        const currentTime = new Date();
        const elapsedTime = currentTime.getTime() - startTime.getTime();
        setElapsedTime(elapsedTime);
      }, 1000);
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
      audioContextRef.current = audioContext;

      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          mediaStreamRef.current = stream;
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const draw = () => {
            analyser.getByteTimeDomainData(dataArray);
            setAudioData(new Uint8Array(dataArray)); // Clone the dataArray to trigger re-render

            // Calculate average and max volume
            const sum = dataArray.reduce((acc, val) => acc + Math.abs(val - 128), 0);
            const avgVolume = sum / dataArray.length;
            const maxVolume = Math.max(...dataArray.map(val => Math.abs(val - 128)));
            setAverageVolume(avgVolume);
            setMaxVolume(maxVolume);

            requestAnimationFrame(draw);
          };
          draw();
        })
        .catch(error => console.error('Error accessing microphone:', error));
    } else {
      analyserRef.current = null;
      setAudioData(null);
      setAverageVolume(0);
      setMaxVolume(0);
    }

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
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
    setStartTime(new Date());
    setIsStart(false);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsQuit(true);
    const endTime = new Date();
    setEndTime(endTime);
    if (startTime) {
      const durationMs = endTime.getTime() - startTime.getTime();
      setDuration(Math.max(durationMs, 1));
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
  };

  const mapVolumeToScore = (volume: number, maxVolume: number) => {
    // Assuming volume ranges from 0 to 128 (max amplitude value for Uint8Array)
    const maxVolumeValue = 128;
    const normalizedAverageVolume = Math.min(volume*10, maxVolumeValue) / maxVolumeValue; // Normalize volume to range 0-1
    const normalizedMaxVolume = Math.min(maxVolume*0.1, maxVolumeValue);

    // Map to score 1-5, penalize for high max volume
    const scoreWithPenalty = 5 - normalizedAverageVolume*5 - normalizedMaxVolume; 
    return Math.max(1, Math.round(scoreWithPenalty));
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
  
    const scoreVolume = mapVolumeToScore(averageVolume, maxVolume);
  
    if (!startTime || !endTime || !duration) {
      alert('Session timing information is missing');
      return;
    }
  
    try {
      await client.models.Sessions.create({
        userId: userId,
        content: content,
        score_rating: numericRating,
        score_volume: scoreVolume,
        total_score: (numericRating + scoreVolume) / 2,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration: Math.round((duration/1000)/60),
      });
      
      setContent('');
      setRating('0');
      
      alert('Session created successfully!');
      navigate('/');
      
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
      <nav className='nav-bar'>
        <a className="navbar-brand" href="/">
          <img className='logo-img' src="src/assets/logo.png" alt="" />
          meditdiary
        </a>
        <div className='nav-container'>
          <button className="button-sign-out">Sign out</button>
        </div>
      </nav>
      <div className='container-activity'>
        {isStart && (
          <>
          <h1 className='newsession-start-title'>When You Are Ready to Meditate Press Start!</h1>
          <button className='newsession-start-button' onClick={startRecording}>Start</button>
          </>
        )}

        {isRecording && !isQuit && (
          <>
            <h2 className='recording-time'>Recording Time: {formatTime(elapsedTime)}</h2>
            <canvas className='recording-table' ref={canvasRef} width={300} height={100}></canvas>
            <button className='recording-button' onClick={stopRecording}>Quit</button>
          </>
        )}

        {!isRecording && isQuit && (
          <>
            <input
              className='input-content' 
              type="text" 
              placeholder="Enter content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <StarRating totalStars={5} onChange={handleRatingChange} />              
            <button className='input-button' onClick={createSession}>Submit</button>
          </>
        )}
      </div>
    </main>
  );
}

export default NewSession;
