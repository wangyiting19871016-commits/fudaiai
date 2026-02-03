/**
 * 🎤 语音音色预设配置
 *
 * 扩展方式：
 * 1. 新增音色：在对应分类的 voices 数组中添加
 * 2. 新增分类：在 VOICE_CATEGORIES 数组中添加新分类
 * 3. 前端会根据分类自动分组渲染
 *
 * 预览音频文件放置路径：/public/audio/previews/
 */

// ===== 音色定义 =====
export interface VoicePreset {
  id: string;                    // Fish Audio reference_id
  name: string;                  // 显示名称
  gender: 'male' | 'female' | 'child' | 'neutral';
  tag?: string;                  // 风格标签
  avatar?: string;               // 音色头像图片路径（相对于 public 或完整 URL）
  preview?: string;              // 试听音频路径（相对于 public）
  isDefault?: boolean;           // 是否默认选中
  isHot?: boolean;               // 是否热门
  isNew?: boolean;               // 是否新增
  description?: string;          // 音色描述
  speed?: number;                // 语音速度（0.5-2.0，默认1.0）
}

// ===== 音色分类 =====
export interface VoiceCategory {
  id: string;
  name: string;
  icon: string;
  order: number;
  collapsed?: boolean;           // 默认是否折叠
  voices: VoicePreset[];
}

// ===== 音色分类配置 =====
export const VOICE_CATEGORIES: VoiceCategory[] = [
  // ========== 推荐音色（只保留真实可用的）==========
  {
    id: 'recommended',
    name: '推荐',
    icon: '⭐',
    order: 0,
    voices: [
      {
        id: '59cb5986671546eaa6ca8ae6f29f6d22',
        name: '央视配音',
        gender: 'male',
        tag: '权威',
        avatar: '/images/avatars/yangshi.jpg',
        isDefault: true,
        isHot: true,
        description: '标准播音腔，适合正式祝福'
      },
      {
        id: '5c353fdb312f4888836a9a5680099ef0',
        name: '女大学生',
        gender: 'female',
        tag: '甜美',
        avatar: '/images/avatars/nvdaxuesheng.jpg',
        isHot: true,
        description: '年轻甜美，适合朋友祝福'
      },
      {
        id: 'aebaa2305aa2452fbdc8f41eec852a79',
        name: '雷军',
        gender: 'male',
        tag: '亲和',
        avatar: '/images/avatars/leijun.jpg',
        isHot: true,
        description: 'Are you OK?经典声音'
      },
      {
        id: '4f201abba2574feeae11e5ebf737859e',
        name: '王琨',
        gender: 'male',
        tag: '磁性',
        avatar: '/images/avatars/wangkun.jpg',
        isHot: true,
        description: '低沉磁性，适合深情祝福',
        speed: 0.8
      },
      {
        id: '54a5170264694bfc8e9ad98df7bd89c3',
        name: '丁真',
        gender: 'male',
        tag: '温暖',
        avatar: '/images/avatars/dingzhen.jpg',
        isHot: true,
        description: '纯净温暖，适合真挚祝福'
      }
    ]
  },

  // ========== 男声（只保留真实可用的）==========
  {
    id: 'male',
    name: '男声',
    icon: '👨',
    order: 1,
    voices: [
      {
        id: '59cb5986671546eaa6ca8ae6f29f6d22',
        name: '央视配音',
        gender: 'male',
        tag: '权威',
        avatar: '/images/avatars/yangshi.jpg',
        description: '标准播音腔，适合正式祝福'
      },
      {
        id: 'aebaa2305aa2452fbdc8f41eec852a79',
        name: '雷军',
        gender: 'male',
        tag: '亲和',
        avatar: '/images/avatars/leijun.jpg',
        description: 'Are you OK?经典声音'
      }
    ]
  },

  // ========== 女声（只保留真实可用的）==========
  {
    id: 'female',
    name: '女声',
    icon: '👩',
    order: 2,
    voices: [
      {
        id: '5c353fdb312f4888836a9a5680099ef0',
        name: '女大学生',
        gender: 'female',
        tag: '甜美',
        avatar: '/images/avatars/nvdaxuesheng.jpg',
        description: '年轻甜美，适合朋友祝福'
      }
    ]
  },

  // ========== 名人（只保留真实可用的）==========
  {
    id: 'celebrity',
    name: '名人',
    icon: '🌟',
    order: 3,
    voices: [
      {
        id: '4f201abba2574feeae11e5ebf737859e',
        name: '王琨',
        gender: 'male',
        tag: '磁性',
        avatar: '/images/avatars/wangkun.jpg',
        description: '低沉磁性，适合深情祝福',
        speed: 0.8
      },
      {
        id: '54a5170264694bfc8e9ad98df7bd89c3',
        name: '丁真',
        gender: 'male',
        tag: '温暖',
        avatar: '/images/avatars/dingzhen.jpg',
        description: '纯净温暖，适合真挚祝福'
      }
    ]
  }
];

// ===== 祝福语模板 =====
export interface TextTemplate {
  id: string;
  label: string;
  text: string;
  icon?: string;
}

export const TEXT_TEMPLATES: TextTemplate[] = [
  {
    id: 'general',
    label: '通用',
    text: '新年快乐，万事如意！',
    icon: '🎉'
  },
  {
    id: 'elder',
    label: '给长辈',
    text: '祝您身体健康，福寿安康，新年快乐！',
    icon: '🧓'
  },
  {
    id: 'friend',
    label: '给朋友',
    text: '新的一年，愿我们友谊长存，一起加油！',
    icon: '👫'
  },
  {
    id: 'client',
    label: '给客户',
    text: '感谢您一直以来的信任与支持，祝您马年大吉，生意兴隆！',
    icon: '🤝'
  },
  {
    id: 'lover',
    label: '给爱人',
    text: '亲爱的，感谢你这一年的陪伴，新的一年我们继续携手同行，爱你！',
    icon: '💕'
  },
  {
    id: 'boss',
    label: '给领导',
    text: '感谢您过去一年的指导与支持，祝您新年事业更上一层楼！',
    icon: '💼'
  }
];

// ===== 辅助函数 =====

/**
 * 获取所有音色（扁平化）
 */
export const getAllVoices = (): VoicePreset[] => {
  const allVoices: VoicePreset[] = [];
  const seenIds = new Set<string>();

  VOICE_CATEGORIES.forEach(cat => {
    cat.voices.forEach(voice => {
      if (!seenIds.has(voice.id)) {
        seenIds.add(voice.id);
        allVoices.push(voice);
      }
    });
  });

  return allVoices;
};

/**
 * 获取默认音色
 */
export const getDefaultVoice = (): VoicePreset => {
  for (const cat of VOICE_CATEGORIES) {
    const defaultVoice = cat.voices.find(v => v.isDefault);
    if (defaultVoice) return defaultVoice;
  }
  return VOICE_CATEGORIES[0]?.voices[0] || {
    id: '',
    name: '未知',
    gender: 'neutral'
  };
};

/**
 * 根据 ID 获取音色
 */
export const getVoiceById = (id: string): VoicePreset | undefined => {
  for (const cat of VOICE_CATEGORIES) {
    const voice = cat.voices.find(v => v.id === id);
    if (voice) return voice;
  }
  return undefined;
};

/**
 * 获取非空分类（有音色的分类）
 */
export const getNonEmptyCategories = (): VoiceCategory[] => {
  return VOICE_CATEGORIES
    .filter(cat => cat.voices.length > 0)
    .sort((a, b) => a.order - b.order);
};

/**
 * 获取热门音色
 */
export const getHotVoices = (): VoicePreset[] => {
  return getAllVoices().filter(v => v.isHot);
};

/**
 * 获取默认文案
 */
export const getDefaultText = (): string => {
  return TEXT_TEMPLATES[0].text;
};

// ===== 兼容旧版导出 =====
export const VOICE_PRESETS: VoicePreset[] = getAllVoices();
