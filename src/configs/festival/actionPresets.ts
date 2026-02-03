/**
 * 🎭 动作预设库
 *
 * 春节特色动作参考视频库
 */

export interface ActionPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  referenceVideoUrl: string; // 参考视频URL
  previewGifUrl?: string; // 预览GIF（可选）
  category: 'greeting' | 'dance' | 'gesture' | 'celebration';
}

export const ACTION_PRESETS: ActionPreset[] = [
  // 拜年手势
  {
    id: 'baonian',
    name: '抱拳拜年',
    icon: '🙏',
    description: '传统抱拳拜年手势',
    // TODO: 替换为实际视频URL
    referenceVideoUrl: 'https://example.com/test-video.mp4',  // 临时测试URL
    previewGifUrl: '/assets/videos/actions/baonian_preview.gif',
    category: 'greeting'
  },
  {
    id: 'wave',
    name: '挥手拜年',
    icon: '👋',
    description: '热情挥手问好',
    referenceVideoUrl: 'https://example.com/test-video.mp4',  // 临时测试URL
    previewGifUrl: '/assets/videos/actions/wave_preview.gif',
    category: 'greeting'
  },

  // 舞蹈动作
  {
    id: 'yangge',
    name: '扭秧歌',
    icon: '🏮',
    description: '欢乐扭秧歌舞蹈',
    referenceVideoUrl: 'https://example.com/test-video.mp4',  // 临时测试URL
    previewGifUrl: '/assets/videos/actions/yangge_preview.gif',
    category: 'dance'
  },

  // 祝福手势
  {
    id: 'thumbup',
    name: '竖大拇指',
    icon: '👍',
    description: '点赞祝福',
    referenceVideoUrl: 'https://example.com/test-video.mp4',  // 临时测试URL
    previewGifUrl: '/assets/videos/actions/thumbup_preview.gif',
    category: 'gesture'
  },
  {
    id: 'ok',
    name: 'OK手势',
    icon: '👌',
    description: '一切OK',
    referenceVideoUrl: 'https://example.com/test-video.mp4',  // 临时测试URL
    previewGifUrl: '/assets/videos/actions/ok_preview.gif',
    category: 'gesture'
  },

  // 庆祝动作
  {
    id: 'cheer',
    name: '欢呼庆祝',
    icon: '🎉',
    description: '双手欢呼',
    referenceVideoUrl: 'https://example.com/test-video.mp4',  // 临时测试URL
    previewGifUrl: '/assets/videos/actions/cheer_preview.gif',
    category: 'celebration'
  }
];

/**
 * 按分类获取动作预设
 */
export function getActionsByCategory(category: ActionPreset['category']): ActionPreset[] {
  return ACTION_PRESETS.filter(action => action.category === category);
}

/**
 * 获取单个动作预设
 */
export function getActionPreset(id: string): ActionPreset | undefined {
  return ACTION_PRESETS.find(action => action.id === id);
}

/**
 * 获取推荐动作（前3个）
 */
export function getRecommendedActions(): ActionPreset[] {
  return ACTION_PRESETS.slice(0, 3);
}
