import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const volumeKey = 'background-audio-volume';
const BackgroundAudioContext = createContext<{
  playing: boolean;
  volume: number;
  toggle: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
} | null>(null);

export function BackgroundAudioProvider({ children }: { children: ReactNode }) {
  const player = useAudioPlayer(require('../../assets/audio/rain.mp3'));
  const { playing } = useAudioPlayerStatus(player);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(volumeKey).then((saved) => {
      const value = Number(saved);
      if (active && saved !== null && saved.trim() !== '' && Number.isFinite(value) && value >= 0 && value <= 1) setVolume(value);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    // expo-audio exposes playback settings as mutable player properties.
    // eslint-disable-next-line react-hooks/immutability
    player.loop = true;
    player.volume = volume;
  }, [player, volume]);

  return (
    <BackgroundAudioContext.Provider value={{
      playing,
      volume,
      toggle: (enabled) => enabled ? player.play() : player.pause(),
      setVolume: (value) => {
        setVolume(value);
        AsyncStorage.setItem(volumeKey, String(value)).catch(() => {});
      },
    }}>
      {children}
    </BackgroundAudioContext.Provider>
  );
}

export function useBackgroundAudio() {
  const context = useContext(BackgroundAudioContext);
  if (!context) throw new Error('BackgroundAudioProvider is missing');
  return context;
}
