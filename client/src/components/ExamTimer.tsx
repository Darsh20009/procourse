import { useState, useEffect, useCallback } from "react";

interface ExamTimerProps {
  duration: number; // in minutes
  onTimeUp: () => void;
  isRunning: boolean;
}

export default function ExamTimer({ duration, onTimeUp, isRunning }: ExamTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration * 60); // Convert to seconds

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    let timerInterval: NodeJS.Timeout | null = null;
    
    if (isRunning) {
      timerInterval = setInterval(() => {
        setTimeRemaining((prevTime) => {
          if (prevTime <= 1) {
            if (timerInterval) clearInterval(timerInterval);
            onTimeUp();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [duration, onTimeUp, isRunning]);

  const progressPercentage = (timeRemaining / (duration * 60)) * 100;

  return (
    <div className="flex items-center space-x-2 text-white">
      <i className="fas fa-clock"></i>
      <div>
        <div className="flex items-center">
          <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
          <span className="ml-2 text-sm">remaining</span>
        </div>
        <div className="w-48 h-2 bg-gray-700 rounded-full mt-1">
          <div 
            className="timer-progress h-2 bg-accent rounded-full" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
