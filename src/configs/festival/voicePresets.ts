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
  preview?: string;              // 试听音频路径（相对于 public）
  isDefault?: boolean;           // 是否默认选中
  isHot?: boolean;               // 是否热门
  isNew?: boolean;               // 是否新增
  description?: string;          // 音色描述
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
  // ========== 推荐音色 ==========
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
        preview: '/audio/previews/yangshi.mp3',
        isDefault: true,
        isHot: true,
        description: '标准播音腔，适合正式祝福'
      },
      {
        id: '5c353fdb312f4888836a9a5680099ef0',
        name: '女大学生',
        gender: 'female',
        tag: '甜美',
        preview: '/audio/previews/nvdaxuesheng.mp3',
        isHot: true,
        description: '年轻甜美，适合朋友祝福'
      }
    ]
  },

  // ========== 男声 ==========
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
        preview: '/audio/previews/yangshi.mp3',
        description: '标准播音腔，适合正式祝福'
      },
      {
        id: 'aebaa2305aa2452fbdc8f41eec852a79',
        name: '雷军',
        gender: 'male',
        tag: '亲和',
        preview: '/audio/previews/leijun.mp3',
        description: 'Are you OK?'
      },
      {
        id: '4f201abba2574feeae11e5ebf737859e',
        name: '王琨',
        gender: 'male',
        tag: '磁性',
        preview: '/audio/previews/wangkun.mp3',
        description: '低沉磁性，适合深情祝福'
      },
      {
        id: '54a5170264694bfc8e9ad98df7bd89c3',
        name: '丁真',
        gender: 'male',
        tag: '温暖',
        preview: '/audio/previews/dingzhen.mp3',
        description: '纯净温暖，适合真挚祝福'
      }
      // 扩展位置：添加更多男声
      // {
      //   id: 'xxx',
      //   name: '新音色',
      //   gender: 'male',
      //   tag: '标签',
      //   preview: '/audio/previews/xxx.mp3'
      // }
    ]
  },

  // ========== 女声 ==========
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
        preview: '/audio/previews/nvdaxuesheng.mp3',
        description: '年轻甜美，适合朋友祝福'
      }
      // 扩展位置：添加更多女声
      // {
      //   id: 'xxx',
      //   name: '温柔姐姐',
      //   gender: 'female',
      //   tag: '温柔',
      //   preview: '/audio/previews/xxx.mp3'
      // },
      // {
      //   id: 'xxx',
      //   name: '知性女声',
      //   gender: 'female',
      //   tag: '知性',
      //   preview: '/audio/previews/xxx.mp3'
      // }
    ]
  },

  // ========== 童声 ==========
  {
    id: 'child',
    name: '童声',
    icon: '👶',
    order: 3,
    voices: [
      // 扩展位置：添加童声
      // {
      //   id: 'xxx',
      //   name: '萌娃',
      //   gender: 'child',
      //   tag: '可爱',
      //   preview: '/audio/previews/xxx.mp3',
      //   description: '奶声奶气，超级可爱'
      // },
      // {
      //   id: 'xxx',
      //   name: '小学生',
      //   gender: 'child',
      //   tag: '活泼',
      //   preview: '/audio/previews/xxx.mp3'
      // }
    ]
  },

  // ========== 方言 ==========
  {
    id: 'dialect',
    name: '方言',
    icon: '🗣️',
    order: 4,
    collapsed: true,
    voices: [
      // 扩展位置：添加方言音色
      // {
      //   id: 'xxx',
      //   name: '粤语男声',
      //   gender: 'male',
      //   tag: '粤语',
      //   preview: '/audio/previews/xxx.mp3'
      // },
      // {
      //   id: 'xxx',
      //   name: '四川话',
      //   gender: 'male',
      //   tag: '川渝',
      //   preview: '/audio/previews/xxx.mp3'
      // },
      // {
      //   id: 'xxx',
      //   name: '东北话',
      //   gender: 'male',
      //   tag: '东北',
      //   preview: '/audio/previews/xxx.mp3'
      // },
      // {
      //   id: 'xxx',
      //   name: '上海话',
      //   gender: 'female',
      //   tag: '吴语',
      //   preview: '/audio/previews/xxx.mp3'
      // },
      // {
      //   id: 'xxx',
      //   name: '闽南语',
      //   gender: 'male',
      //   tag: '闽南',
      //   preview: '/audio/previews/xxx.mp3'
      // }
    ]
  },

  // ========== 名人模仿 ==========
  {
    id: 'celebrity',
    name: '名人',
    icon: '🌟',
    order: 5,
    collapsed: true,
    voices: [
      {
        id: 'aebaa2305aa2452fbdc8f41eec852a79',
        name: '雷军',
        gender: 'male',
        tag: '科技',
        preview: '/audio/previews/leijun.mp3',
        isHot: true
      }
      // 扩展位置：添加更多名人音色
      // {
      //   id: 'xxx',
      //   name: '马云',
      //   gender: 'male',
      //   tag: '商业',
      //   preview: '/audio/previews/xxx.mp3'
      // }
    ]
  },

  // ========== 特色音色 ==========
  {
    id: 'special',
    name: '特色',
    icon: '✨',
    order: 6,
    collapsed: true,
    voices: [
      // 扩展位置：添加特色音色（如 AI 合成、情感音色等）
      // {
      //   id: 'xxx',
      //   name: '温暖治愈',
      //   gender: 'neutral',
      //   tag: '治愈',
      //   preview: '/audio/previews/xxx.mp3'
      // },
      // {
      //   id: 'xxx',
      //   name: '激情解说',
      //   gender: 'male',
      //   tag: '解说',
      //   preview: '/audio/previews/xxx.mp3'
      // }
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
