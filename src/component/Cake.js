import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import '../component/cake.css';

export default function Cake() {
  const [calendar, setCalendar] = useState([]);
  const [blowing, setBlowing] = useState(false);
  const [candlesOut, setCandlesOut] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [showCard, setShowCard] = useState(true);
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

  // Initialize audio context on first user interaction (iOS fix)
  const initializeAudio = useCallback(() => {
    if (!audioInitialized) {
      // Create a silent audio to unlock audio context on iOS
      const silentAudio = new Audio();
      silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
      silentAudio.play().then(() => {
        setAudioInitialized(true);
      }).catch(() => {
        // Ignore errors for silent audio
      });
    }
  }, [audioInitialized]);

  // Function to play background music (skip first 4 seconds)
  const playBackgroundMusic = useCallback(() => {
    // Initialize audio if not done yet (for iOS)
    if (!audioInitialized) {
      initializeAudio();
    }

    try {
      // Stop previous audio if it's playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Create new audio instance - simple path for deployment
      const audio = new Audio('/music.mp3');
      audioRef.current = audio;

      // Set properties immediately
      audio.volume = 0.5; // Set volume to 50%
      audio.preload = 'auto';

      // For iOS compatibility - try to play immediately
      const playPromise = () => {
        return audio.play().then(() => {
          // If successful, set the start time
          audio.currentTime = 4; // Skip first 4 seconds
        }).catch(error => {
          console.log('Could not play music on first try:', error);

          // For iOS - try again with user gesture simulation
          setTimeout(() => {
            audio.play().then(() => {
              audio.currentTime = 4;
            }).catch(err => {
              console.log('Could not play music on second try:', err);
            });
          }, 100);
        });
      };

      // Wait for audio to load
      audio.addEventListener('canplaythrough', playPromise, { once: true });

      // Fallback - try to play after a short delay even if not fully loaded
      setTimeout(() => {
        if (audio.readyState >= 2) { // HAVE_CURRENT_DATA
          playPromise();
        }
      }, 200);

      audio.addEventListener('error', (e) => {
        console.log('Audio loading error:', e);
      });

      audio.load();
    } catch (error) {
      console.log('Error creating audio:', error);
    }
  }, [audioInitialized, initializeAudio]);

  // Play music when celebration shows
  useEffect(() => {
    if (showCelebration) {
      playBackgroundMusic();
    }
  }, [showCelebration, playBackgroundMusic]);

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
    let audioContext = null;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (!isMounted) return;

        audioContext = new AudioContext();

        // Resume AudioContext if it's suspended (important for iOS)
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }

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
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [candlesOut]);

  const handleCardClick = () => {
    // Initialize audio for iOS compatibility
    initializeAudio();
    // Hide card and show cake
    setShowCard(false);
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
      {showCard ? (
        /* Birthday Card */
        <motion.div
          className="birthday-card"
          initial={{ opacity: 0, scale: 0.8, rotateY: -10 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          onClick={handleCardClick}
        >
          <div className="card-front">
            <div className="card-header">
              <h2>🎉 Thiệp Sinh Nhật 🎉</h2>
            </div>

            <div className="card-content">
              <div className="birthday-message">
                <h3>Chúc Mừng Sinh Nhật</h3>
                <h2 className="birthday-name">Hoàng Linh</h2>

                <div className="birthday-date">
                  <p>📅 13 Tháng 8, 2025</p>
                </div>
              </div>

              <div className="card-decorations">
                <div className="floating-emoji">🎈</div>
                <div className="floating-emoji">🎊</div>
                <div className="floating-emoji">🎂</div>
                <div className="floating-emoji">🌟</div>
                <div className="floating-emoji">✨</div>
              </div>
            </div>

            <div className="card-footer">
              <motion.p
                className="click-instruction"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                👆 Nhấn vào thiệp để mở quà sinh nhật! 🎁
              </motion.p>
            </div>
          </div>
        </motion.div>
      ) : (
        /* Cake Scene */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
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
                <p>Chúc Mẩu tuổi mới nhiều sức khỏe, hạnh phúc và thành công!</p>
                <p>Mong tất cả những ước mơ của cậu sẽ trở thành hiện thực! 💫</p>
                <p className="click-hint">Han đẹp trai</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
