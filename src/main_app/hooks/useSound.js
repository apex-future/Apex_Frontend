import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useSound — React hook for audio playback with play/pause/stop controls,
 * playback state, and automatic cleanup.
 *
 * Usage:
 *   const [play, { pause, stop, isPlaying }] = useSound('/cleo_voice/start_screen.mp3', {
 *     volume: 1.0,
 *     onend: () => console.log('playback finished')
 *   });
 */
export default function useSound(src, options = {}) {
  const { volume = 1.0, onend, onplay, onerror } = options;
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!src) return;

    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.volume = volume;
    audioRef.current = audio;

    const handlePlay = () => {
      setIsPlaying(true);
      if (onplay) onplay();
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onend) onend();
    };

    const handleError = (e) => {
      setIsPlaying(false);
      if (onerror) onerror(e);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
      setIsPlaying(false);
    };
  }, [src, volume]);

  const play = useCallback(() => {
    if (!audioRef.current) return Promise.resolve();
    if (audioRef.current.ended) {
      audioRef.current.currentTime = 0;
    }
    return audioRef.current.play();
  }, []);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  }, []);

  const stop = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  }, []);

  return [play, { pause, stop, isPlaying, sound: audioRef.current }];
}
