/**
 * 内置语音库 (Azure Neural TTS)
 * 包含常用的中文高质量神经语音
 */

import { Voice } from '@types';

export const BUILTIN_VOICES: Voice[] = [
  {
    id: 'zh-CN-XiaoxiaoNeural',
    name: 'zh-CN-XiaoxiaoNeural',
    displayName: '晓晓',
    locale: 'zh-CN',
    gender: 'female',
    description: '活泼、温暖的声音，适合年轻女性角色',
    styles: ['assistant', 'chat', 'customerservice', 'newscast', 'affectionate', 'angry', 'calm', 'cheerful', 'disgruntled', 'fearful', 'gentle', 'lyrical', 'sad', 'serious'],
  },
  {
    id: 'zh-CN-YunxiNeural',
    name: 'zh-CN-YunxiNeural',
    displayName: '云希',
    locale: 'zh-CN',
    gender: 'male',
    description: '活泼、阳光的声音，适合年轻男性角色',
    styles: ['narration-relaxed', 'sports_commentary', 'sports_commentary_excited', 'chat', 'assistant', 'newscast', 'angry', 'cheerful', 'disgruntled', 'fearful', 'gentle', 'sad', 'serious'],
  },
  {
    id: 'zh-CN-YunjianNeural',
    name: 'zh-CN-YunjianNeural',
    displayName: '云健',
    locale: 'zh-CN',
    gender: 'male',
    description: '稳重、磁性的声音，适合成熟男性角色',
    styles: ['narration-relaxed', 'sports_commentary', 'sports_commentary_excited'],
  },
  {
    id: 'zh-CN-XiaoyiNeural',
    name: 'zh-CN-XiaoyiNeural',
    displayName: '晓伊',
    locale: 'zh-CN',
    gender: 'female',
    description: '知性、温柔的声音，适合大姐姐角色',
    styles: ['angry', 'disgruntled', 'affectionate', 'cheerful', 'fearful', 'sad', 'embarrassed', 'serious', 'gentle'],
  },
  {
    id: 'zh-CN-YunyangNeural',
    name: 'zh-CN-YunyangNeural',
    displayName: '云扬',
    locale: 'zh-CN',
    gender: 'male',
    description: '专业、播音腔，适合新闻或正式场合',
    styles: ['customerservice', 'narration-professional', 'newscast-casual'],
  },
  {
    id: 'zh-CN-XiaomengNeural',
    name: 'zh-CN-XiaomengNeural',
    displayName: '晓梦',
    locale: 'zh-CN',
    gender: 'female',
    description: '甜美、可爱的声音，适合少女角色',
    styles: ['chat'],
  },
];

export const DEFAULT_VOICE_ID = 'zh-CN-XiaoxiaoNeural';
