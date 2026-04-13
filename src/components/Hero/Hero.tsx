import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Hero.module.css';

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showLogo, setShowLogo] = useState(false);
  const [showTagline, setShowTagline] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setVideoDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      if (video.duration && video.currentTime >= video.duration - 2.5) {
        if (!showLogo) setShowLogo(true);
      }
      if (video.duration && video.currentTime >= video.duration - 1.8) {
        if (!showTagline) setShowTagline(true);
      }
    };

    const handleEnded = () => {
      // On loop restart, keep logo/tagline visible briefly then reset
      setShowLogo(false);
      setShowTagline(false);
      video.play();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [showLogo, showTagline]);

  return (
    <section className={styles.heroSection}>
      <video
        ref={videoRef}
        className={styles.heroVideo}
        autoPlay
        muted
        playsInline
        preload="auto"
        poster="/assets/images/wrap_hero.png"
      >
        <source src="/assets/videos/hero-home.mp4" type="video/mp4" />
      </video>

      <div className={styles.heroOverlay} />

      {/* Logo Reveal */}
      <div className={styles.heroCenter}>
        <AnimatePresence>
          {showLogo && (
            <motion.img
              src="/assets/logos/logo-simbolo-branco.svg"
              alt="NZ"
              className={styles.heroLogo}
              initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.9 }}
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
              exit={{ opacity: 0 }}
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
