import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import '../component/cake.css';

export default function Cake() {
  const [calendar, setCalendar] = useState([]);
  const [blowing, setBlowing] = useState(false);
  const [candlesOut, setCandlesOut] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const audioRef = useRef(null);

  // Create calendar for August 2025
  const createCalendar = () => {
    const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    // August 2025 (month 7 in JavaScript as it's 0-indexed)
    const targetMonth = 7; // August
    const targetYear = 2025;

    const calendarData = [];

    // Add header for days of week
    daysOfWeek.forEach(day => {
      calendarData.push({ type: 'header', content: day });
    });

    // Get first day of August 2025
    const firstDay = new Date(targetYear, targetMonth, 1);
    const lastDay = new Date(targetYear, targetMonth + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    // Add empty cells for days before the 1st
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarData.push({ type: 'empty', content: '' });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSpecialDay = day === 13; // Mark day 13 as special
      calendarData.push({
        type: 'date',
        content: day,
        isSpecialDay
      });
    }

    setCalendar(calendarData);
  };

  useEffect(() => {
    createCalendar();
  }, []);

  // Play music when celebration shows
  useEffect(() => {
    if (showCelebration) {
      playBackgroundMusic();
    }
  }, [showCelebration]);

  // Cleanup audio on component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Microphone access and blow detection
  useEffect(() => {
    let isMounted = true;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (!isMounted) return;

        const audioContext = new AudioContext();
        const analyzer = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

        microphone.connect(analyzer);
        analyzer.connect(scriptProcessor);
        scriptProcessor.connect(audioContext.destination);

        const loudnessThreshold = 50;

        scriptProcessor.addEventListener('audioprocess', () => {
          const array = new Uint8Array(analyzer.frequencyBinCount);
          analyzer.getByteFrequencyData(array);
          let sum = 0;
          for (let i = 0; i < array.length; i++) {
            sum += array[i];
          }
          const avg = sum / array.length;

          if (avg > loudnessThreshold && isMounted && !candlesOut) {
            setBlowing(true);
            setTimeout(() => {
              setCandlesOut(true);
              setShowCelebration(true);
            }, 500);
          }
        });
      })
      .catch((err) => {
        console.log(err);
        alert("Bạn cần cho phép truy cập microphone để thổi nến!");
      });

    return () => {
      isMounted = false;
    };
  }, [candlesOut]);

  // Function to play background music (skip first 4 seconds)
  const playBackgroundMusic = () => {
    try {
      // Stop previous audio if it's playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Create new audio instance - simple path for deployment
      const audio = new Audio('/music.mp3');
      audioRef.current = audio;

      // Wait for audio to load before setting currentTime
      audio.addEventListener('canplaythrough', () => {
        audio.currentTime = 4; // Skip first 4 seconds
        audio.volume = 0.5; // Set volume to 50%
        audio.play().catch(error => {
          console.log('Could not play music:', error);
        });
      });

      audio.addEventListener('error', (e) => {
        console.log('Audio loading error:', e);
      });

      audio.load();
    } catch (error) {
      console.log('Error creating audio:', error);
    }
  };

  const resetCake = () => {
    // Stop music when resetting
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    setCandlesOut(false);
    setShowCelebration(false);
    setBlowing(false);
  };

  return (
    <div className="cake-app">
      {/* Blow instruction */}
      {!candlesOut && (
        <div className="blow-instruction">
          <p>🎂 Thổi mạnh vào micro để tắt nến sinh nhật! 💨</p>
        </div>
      )}
      {/* Reset button */}
      {candlesOut && (
        <button className="reset-btn" onClick={resetCake}>
          🔄 Thắp nến lại
        </button>
      )}
      <h1 className='heading'>Linh Mẩu sinh nhật vui vẻ</h1>

      <br></br>



      <div className="scene">
        <motion.div
          className="cake-3d"
          initial={{ rotateY: 0, rotateX: 30 }}
          animate={{ rotateY: [-5, 0, 5, 0, -5], rotateX: [30, 25, 35, 30, 30] }}
          transition={{ duration: 12, ease: "easeInOut", repeat: Infinity }}
        >
          {/* Plate */}
          <div className="plate-3d"></div>

          {/* Cake bottom */}
          <div className="cake-bottom-3d"></div>



          {/* Cake top with calendar */}
          <div className="cake-top-3d">
            <div className="calendar-content">
              {/* Number candles 2 and 5 */}
              <div className="number-candles">
                {/* Number 2 Candle */}
                <div className="number-candle number-2">
                  {!candlesOut && (
                    <motion.div
                      className="candle-flame"
                      animate={blowing ? { scale: [1, 0.8, 0.6, 0] } : {}}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                  <div className="candle-wick"></div>
                  <div className="number-segments">
                    <div className="segment top-horizontal"></div>
                    <div className="segment middle-horizontal"></div>
                    <div className="segment bottom-horizontal"></div>
                    <div className="segment right-vertical-top"></div>
                    <div className="segment left-vertical-bottom"></div>
                  </div>
                </div>

                {/* Number 5 Candle */}
                <div className="number-candle number-5">
                  {!candlesOut && (
                    <motion.div
                      className="candle-flame"
                      animate={blowing ? { scale: [1, 0.8, 0.6, 0] } : {}}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />
                  )}
                  <div className="candle-wick"></div>
                  <div className="number-segments">
                    <div className="segment top-horizontal"></div>
                    <div className="segment middle-horizontal"></div>
                    <div className="segment bottom-horizontal"></div>
                    <div className="segment left-vertical-top"></div>
                    <div className="segment right-vertical-bottom"></div>
                  </div>
                </div>
              </div>
              <div className="calendar-grid">
                {calendar.map((item, index) => (
                  <div
                    key={index}
                    className={`calendar-day ${item.type} ${item.isToday ? 'today' : ''} ${item.isSpecialDay ? 'special-day' : ''}`}
                  >
                    {item.content}
                  </div>
                ))}
              </div>
              <div className="birthday-text">Tháng 8</div>
            </div>
          </div>


        </motion.div>
      </div>

      {/* Celebration Modal */}
      {showCelebration && (
        <motion.div
          className="celebration"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowCelebration(false)}
        >
          <div className="celebration-content">
            <h2>🎉 Chúc Mừng Sinh Nhật! 🎂</h2>
            <p className="confetti">🎊 🎈 🎁 🌟 ✨</p>
            <p>Chúc Linh Mẩu tuổi mới nhiều sức khỏe, hạnh phúc và thành công!</p>
            <p>Mong tất cả những ước mơ của cậu sẽ trở thành hiện thực! 💫</p>
            <p className="click-hint">Nhấn vào đây để đóng</p>
          </div>
        </motion.div>
      )}

    </div>
  );
}
