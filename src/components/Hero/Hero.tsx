import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Hero.module.css';

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showLogo, setShowLogo] = useState(false);
  const [showTagline, setShowTagline] = useState(false);
  const [firstPlayDone, setFirstPlayDone] = useState(false);
  const [crossfading, setCrossfading] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!video.duration) return;

      // Trigger logo/tagline near end of first play
      if (video.currentTime >= video.duration - 2.5 && !showLogo) {
        setShowLogo(true);
      }
      if (video.currentTime >= video.duration - 1.8 && !showTagline) {
        setShowTagline(true);
      }

      // Crossfade: fade video out 1s before end to hide the restart jump
      if (firstPlayDone && video.currentTime >= video.duration - 1) {
        if (!crossfading) {
          setCrossfading(true);
          // After fade out completes, restart and fade back in
          setTimeout(() => {
            video.currentTime = 0;
            video.play();
            setTimeout(() => setCrossfading(false), 100);
          }, 800);
        }
      }
    };

    const handleEnded = () => {
      if (!firstPlayDone) {
        setFirstPlayDone(true);
      }
      // Restart seamlessly
      video.currentTime = 0;
      video.play();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [showLogo, showTagline, firstPlayDone, crossfading]);

  return (
    <section className={styles.heroSection}>
      <video
        ref={videoRef}
        className={`${styles.heroVideo} ${firstPlayDone ? styles.heroVideoLoop : ''} ${crossfading ? styles.heroVideoCrossfade : ''}`}
        autoPlay
        muted
        playsInline
        preload="auto"
      >
        <source src="/assets/videos/hero-home.mp4" type="video/mp4" />
      </video>

      <div className={`${styles.heroOverlay} ${firstPlayDone ? styles.heroOverlayLoop : ''}`} />

      {/* Logo + Tagline — once shown, stay forever */}
      <div className={styles.heroCenter}>
        <AnimatePresence>
          {showLogo && (
            <motion.img
              src="/assets/logos/logo-simbolo-branco.svg"
              alt="NZ"
              className={styles.heroLogo}
              initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showTagline && (
            <motion.p
              className={styles.heroTagline}
              initial={{ opacity: 0, y: 15, filter: 'blur(5px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              Made for those who take quality seriously.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className={styles.scrollIndicator}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1 }}
      >
        <div className={styles.scrollLine} />
      </motion.div>
    </section>
  );
}
