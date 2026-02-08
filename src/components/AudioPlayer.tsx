/**
 * 音频播放器组件
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '@constants';
import AudioRecorderService from '@services/AudioRecorderService';
import { formatDuration } from '@utils/helpers';

interface AudioPlayerProps {
  audioUrl: string;
  duration?: number;
  autoPlay?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  duration,
  autoPlay = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);

  useEffect(() => {
    if (autoPlay) {
      handlePlay();
    }

    return () => {
      AudioRecorderService.stopPlaying();
    };
  }, []);

  const handlePlay = async () => {
    if (isPlaying) {
      await AudioRecorderService.pausePlaying();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      await AudioRecorderService.playAudio(audioUrl, (data) => {
        setCurrentPosition(data.currentPosition);
        setTotalDuration(data.duration);

        // 播放完成
        if (data.currentPosition >= data.duration) {
          setIsPlaying(false);
          setCurrentPosition(0);
        }
      });
    }
  };

  const progress = totalDuration > 0 ? (currentPosition / totalDuration) * 100 : 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
        <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <Text style={styles.time}>
          {formatDuration(Math.floor(currentPosition / 1000))}
          {totalDuration > 0 && ` / ${formatDuration(Math.floor(totalDuration / 1000))}`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },

  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },

  playIcon: {
    fontSize: 16,
  },

  progressContainer: {
    flex: 1,
  },

  progressBar: {
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },

  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
  },

  time: {
    fontSize: FontSizes.xs,
    color: Colors.light.textSecondary,
  },
});
