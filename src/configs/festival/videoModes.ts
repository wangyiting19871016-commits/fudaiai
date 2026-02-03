/**
 * 🎬 视频模式配置
 *
 * 3种视频生成模式：
 * 1. 数字人说话 - 配音视频，对口型
 * 2. 动作视频 - 扭秧歌、抱拳拜年等
 * 3. 表情包GIF - 搞笑动效，免费快速
 */

export type VideoModeId = 'talk' | 'action' | 'gif';

export interface VideoMode {
  id: VideoModeId;
  name: string;
  icon: string;
  description: string;
  cost: string;
  costType: 'paid' | 'free';
  recommended: boolean;
  estimatedTime: string; // 预估生成时间
  tips: string; // 用户提示
}

export const VIDEO_MODES: VideoMode[] = [
  {
    id: 'talk',
    name: '数字人说话',
    icon: '🎙️',
    description: '配音视频，对口型',
    cost: '约3元/次',
    costType: 'paid',
    recommended: false,
    estimatedTime: '60-90秒',
    tips: '需要先生成语音，AI会自动匹配口型和表情'
  },
  {
    id: 'action',
    name: '动作视频',
    icon: '🎭',
    description: '扭秧歌、抱拳拜年',
    cost: '约3元/次',
    costType: 'paid',
    recommended: false,
    estimatedTime: '60-90秒',
    tips: '选择动作后，AI会让你的照片做出相应动作'
  },
  {
    id: 'gif',
    name: '表情包GIF',
    icon: '🎨',
    description: '搞笑动效，秒速生成',
    cost: '免费',
    costType: 'free',
    recommended: true,
    estimatedTime: '3-5秒',
    tips: 'GIF图片可以直接长按保存，分享更方便'
  }
];

/**
 * 获取视频模式配置
 */
export function getVideoMode(id: VideoModeId): VideoMode | undefined {
  return VIDEO_MODES.find(mode => mode.id === id);
}

/**
 * 获取推荐模式
 */
export function getRecommendedMode(): VideoMode {
  return VIDEO_MODES.find(mode => mode.recommended) || VIDEO_MODES[2];
}
