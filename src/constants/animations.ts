/**
 * 情绪动画映射配置
 */

import { Emotion } from '@types';

/**
 * 情绪到动画的映射
 */
export const EMOTION_ANIMATIONS: Record<Emotion, {
  animation: string;
  blendShapes?: Record<string, number>;
  duration?: number;
  loop?: boolean;
}> = {
  neutral: {
    animation: 'Idle',
    loop: true,
  },

  happy: {
    animation: 'Happy',
    blendShapes: {
      'smile_L': 0.8,
      'smile_R': 0.8,
      'eyeSquint_L': 0.3,
      'eyeSquint_R': 0.3,
    },
    duration: 2000,
  },

  sad: {
    animation: 'Sad',
    blendShapes: {
      'frown_L': 0.7,
      'frown_R': 0.7,
      'eyeSquint_L': 0.5,
      'eyeSquint_R': 0.5,
      'mouthFrown_L': 0.6,
      'mouthFrown_R': 0.6,
    },
    duration: 2000,
  },

  angry: {
    animation: 'Angry',
    blendShapes: {
      'browInnerUp': 0.6,
      'eyeSquint_L': 0.8,
      'eyeSquint_R': 0.8,
      'mouthFrown_L': 0.8,
      'mouthFrown_R': 0.8,
    },
    duration: 1500,
  },

  surprised: {
    animation: 'Surprised',
    blendShapes: {
      'browOuterUp_L': 0.9,
      'browOuterUp_R': 0.9,
      'eyeWide_L': 0.9,
      'eyeWide_R': 0.9,
      'mouthOpen': 0.6,
    },
    duration: 1500,
  },

  thinking: {
    animation: 'Thinking',
    blendShapes: {
      'eyeLookUp_L': 0.5,
      'eyeLookUp_R': 0.3,
      'mouthPucker': 0.3,
    },
    duration: 3000,
    loop: true,
  },

  excited: {
    animation: 'Excited',
    blendShapes: {
      'smile_L': 1.0,
      'smile_R': 1.0,
      'eyeWide_L': 0.6,
      'eyeWide_R': 0.6,
      'mouthSmile_L': 0.8,
      'mouthSmile_R': 0.8,
    },
    duration: 2000,
  },
};

/**
 * 标准Viseme集合（基于ARKit标准）
 */
export const VISEMES = {
  sil: 0,     // 静音
  PP: 1,      // p, b, m
  FF: 2,      // f, v
  TH: 3,      // th
  DD: 4,      // t, d
  kk: 5,      // k, g
  CH: 6,      // ch, j, sh
  SS: 7,      // s, z
  nn: 8,      // n, l
  RR: 9,      // r
  aa: 10,     // a (父)
  E: 11,      // e (这)
  I: 12,      // i (你)
  O: 13,      // o (我)
  U: 14,      // u (书)
};

/**
 * 中文拼音到Viseme的映射（简化版）
 */
export const PINYIN_TO_VISEME: Record<string, number> = {
  // 声母
  'b': VISEMES.PP,
  'p': VISEMES.PP,
  'm': VISEMES.PP,
  'f': VISEMES.FF,
  'd': VISEMES.DD,
  't': VISEMES.DD,
  'n': VISEMES.nn,
  'l': VISEMES.nn,
  'g': VISEMES.kk,
  'k': VISEMES.kk,
  'h': VISEMES.kk,
  'j': VISEMES.CH,
  'q': VISEMES.CH,
  'x': VISEMES.CH,
  'zh': VISEMES.CH,
  'ch': VISEMES.CH,
  'sh': VISEMES.CH,
  'r': VISEMES.RR,
  'z': VISEMES.SS,
  'c': VISEMES.SS,
  's': VISEMES.SS,

  // 韵母
  'a': VISEMES.aa,
  'o': VISEMES.O,
  'e': VISEMES.E,
  'i': VISEMES.I,
  'u': VISEMES.U,
  'ü': VISEMES.U,
};

/**
 * 手势动画配置
 */
export const GESTURE_ANIMATIONS = {
  wave: {
    name: 'Wave',
    duration: 2000,
    description: '挥手打招呼',
  },
  nod: {
    name: 'Nod',
    duration: 1000,
    description: '点头',
  },
  shake: {
    name: 'Shake',
    duration: 1500,
    description: '摇头',
  },
  shrug: {
    name: 'Shrug',
    duration: 1500,
    description: '耸肩',
  },
  heart: {
    name: 'Heart',
    duration: 2000,
    description: '比心',
  },
  thumbsUp: {
    name: 'ThumbsUp',
    duration: 1500,
    description: '点赞',
  },
  thinking: {
    name: 'Thinking',
    duration: 3000,
    description: '思考',
    loop: true,
  },
};

/**
 * 摄像机视角配置
 */
export const CAMERA_VIEWS = {
  full: {
    distance: 5,
    height: 1.0,
    angle: 0,
    description: '全身',
  },
  upper: {
    distance: 2.5,
    height: 1.2,
    angle: 0,
    description: '半身',
  },
  face: {
    distance: 1.0,
    height: 1.5,
    angle: 5,
    description: '特写',
  },
};

/**
 * 背景场景配置
 */
export const BACKGROUND_SCENES = [
  {
    id: 'scene_cafe',
    name: '咖啡厅',
    thumbnail: 'backgrounds/cafe_thumb.jpg',
    prefab: 'Scenes/Cafe',
  },
  {
    id: 'scene_park',
    name: '公园',
    thumbnail: 'backgrounds/park_thumb.jpg',
    prefab: 'Scenes/Park',
  },
  {
    id: 'scene_bedroom',
    name: '卧室',
    thumbnail: 'backgrounds/bedroom_thumb.jpg',
    prefab: 'Scenes/Bedroom',
  },
  {
    id: 'scene_office',
    name: '办公室',
    thumbnail: 'backgrounds/office_thumb.jpg',
    prefab: 'Scenes/Office',
  },
  {
    id: 'scene_studio',
    name: '摄影棚',
    thumbnail: 'backgrounds/studio_thumb.jpg',
    prefab: 'Scenes/Studio',
  },
];
