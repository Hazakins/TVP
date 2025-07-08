

import React, { useState, useEffect } from 'react';
import { EventInfo } from '../types.ts';

interface EventStartNotificationProps {
  eventInfo: EventInfo;
}

const EventStartNotification: React.FC<EventStartNotificationProps> = ({ eventInfo }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!eventInfo.startTime) {
      setTimeLeft('');
      return;
    };

    const calculateTimeLeft = () => {
        const startTimeMs = new Date(eventInfo.startTime!).getTime();
        const nowMs = new Date().getTime();
        const difference = startTimeMs - nowMs;

        if (difference <= 0) {
            return 'Matches have begun!';
        }

        const minutes = Math.floor((difference / 1000 / 60));
        const seconds = Math.floor((difference / 1000) % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      if (newTimeLeft === 'Matches have begun!' && timeLeft !== newTimeLeft) {
        setTimeLeft(newTimeLeft);
        clearInterval(interval);
      } else {
        setTimeLeft(newTimeLeft);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [eventInfo.startTime]);

  if (!eventInfo.startTime || timeLeft === '') {
    return null;
  }
  
  const startTime = new Date(eventInfo.startTime);
  const formattedStartTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-lime-500 text-slate-900 text-center p-2 font-bold shadow-lg z-20">
      {timeLeft === 'Matches have begun!' 
        ? 'Event has started! Good luck to all players!'
        : `Event begins in ${timeLeft}. First matches start at ${formattedStartTime}. (Warm-up: ${eventInfo.warmupMinutes} min)`
      }
    </div>
  );
};

export default EventStartNotification;
