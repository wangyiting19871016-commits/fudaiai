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
  // ========== 推荐音色 ==========
  {
    id: 'recommended',
    name: '推荐',
    icon: '⭐',
    order: 0,
    voices: [
      {
        id: 'dd43b30d04d9446a94ebe41f301229b5',
        name: '宣传片',
        gender: 'male',
        tag: '专业',
        isDefault: true,
        isHot: true,
        description: '标准宣传片配音，适合正式场合'
      },
      {
        id: 'faccba1a8ac54016bcfc02761285e67f',
        name: '温柔女',
        gender: 'female',
        tag: '温柔',
        isHot: true,
        description: '温柔甜美，适合温馨祝福'
      },
      {
        id: '7c66db6e457c4d53b1fe428a8c547953',
        name: '郭德纲',
        gender: 'male',
        tag: '幽默',
        isHot: true,
        description: '相声大师声音，幽默风趣'
      },
      {
        id: '1512d05841734931bf905d0520c272b1',
        name: '周杰伦',
        gender: 'male',
        tag: '明星',
        isHot: true,
        description: '天王巨星声音，年轻活力'
      },
      {
        id: 'e752df7d20cd4576af9a207520349a33',
        name: '甜美女主播',
        gender: 'female',
        tag: '甜美',
        isHot: true,
        description: '主播级音质，甜美动听'
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
        id: 'dd43b30d04d9446a94ebe41f301229b5',
        name: '宣传片',
        gender: 'male',
        tag: '专业',
        description: '标准宣传片配音'
      },
      {
        id: '959b9a533d984b9a92af0c101a92118f',
        name: '男游戏解说',
        gender: 'male',
        tag: '热血',
        description: '激情解说风格，适合活力祝福'
      },
      {
        id: 'c44c45fce45443aaa40b7721c01c7c86',
        name: '电影解说男',
        gender: 'male',
        tag: '专业',
        description: '电影级解说音质'
      },
      {
        id: 'ec48458814e3409196c795a3a6b32201',
        name: '祁同伟',
        gender: 'male',
        tag: '沉稳',
        description: '沉稳大气，适合正式场合'
      },
      {
        id: '2e576989a8f94e888bf218de90f8c19a',
        name: '李云龙',
        gender: 'male',
        tag: '豪迈',
        description: '豪迈爽朗，适合兄弟祝福'
      },
      {
        id: '665e031efe27435780ebfa56cc7e0e0d',
        name: '胖猫',
        gender: 'male',
        tag: '可爱',
        description: '可爱憨厚，轻松有趣'
      }
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
        id: 'faccba1a8ac54016bcfc02761285e67f',
        name: '温柔女',
        gender: 'female',
        tag: '温柔',
        description: '温柔甜美，适合温馨祝福'
      },
      {
        id: 'e752df7d20cd4576af9a207520349a33',
        name: '甜美女主播',
        gender: 'female',
        tag: '甜美',
        description: '主播级音质，甜美动听'
      },
      {
        id: '57eab548c7ed4ddc974c4c153cb015b2',
        name: '女主播',
        gender: 'female',
        tag: '专业',
        description: '专业主播音质'
      },
      {
        id: '6ce7ea8ada884bf3889fa7c7fb206691',
        name: '御女茉莉',
        gender: 'female',
        tag: '御姐',
        description: '御姐音，成熟魅力'
      },
      {
        id: 'f44181a3d6d444beae284ad585a1af37',
        name: '御姐',
        gender: 'female',
        tag: '成熟',
        description: '成熟御姐范，气场强大'
      },
      {
        id: 'e488ebeadd83496b97a3cd472dcd04ab',
        name: '爱丽丝女',
        gender: 'female',
        tag: '温柔',
        description: '温柔可爱，如邻家女孩'
      },
      {
        id: 'c5c17c9709384ba9a4b294662a2af0b1',
        name: '千早爱音',
        gender: 'female',
        tag: '动漫',
        description: '动漫少女音'
      },
      {
        id: '49d191dbcd7c43b8a8f6f2d2968a7356',
        name: '营销号女',
        gender: 'female',
        tag: '专业',
        description: '专业营销播报风格'
      },
      {
        id: 'fbe02f8306fc4d3d915e9871722a39d5',
        name: '嘉岚',
        gender: 'female',
        tag: '知性',
        description: '知性优雅女声'
      },
      {
        id: '4dd791d362db4cd68ed301584dd20468',
        name: '满穗',
        gender: 'female',
        tag: '清新',
        description: '清新自然女声'
      },
      {
        id: 'dc1ddcdf57fb4826a9d45f4152906c38',
        name: '超玩姐',
        gender: 'female',
        tag: '活力',
        description: '活力满满游戏主播'
      },
      {
        id: '6df19d07461d432a9a3d85174ef86496',
        name: '一条小团团',
        gender: 'female',
        tag: '可爱',
        description: '超可爱主播声音'
      }
    ]
  },

  // ========== 明星名人 ==========
  {
    id: 'celebrity',
    name: '明星',
    icon: '🌟',
    order: 3,
    voices: [
      {
        id: '1512d05841734931bf905d0520c272b1',
        name: '周杰伦',
        gender: 'male',
        tag: '天王',
        description: '流行天王声音，年轻活力'
      },
      {
        id: '3b55b3d84d2f453a98d8ca9bb24182d6',
        name: '邓紫棋',
        gender: 'female',
        tag: '歌手',
        description: '实力女歌手，音色独特'
      },
      {
        id: '7c66db6e457c4d53b1fe428a8c547953',
        name: '郭德纲',
        gender: 'male',
        tag: '相声',
        description: '相声大师，幽默风趣'
      },
      {
        id: 'f3d6f223726c4a3dbeae0b1bd67d129d',
        name: '周星驰',
        gender: 'male',
        tag: '喜剧',
        description: '喜剧之王，搞笑经典'
      },
      {
        id: '0cda0bac50054273aad850bd72cd2130',
        name: '马云',
        gender: 'male',
        tag: '企业家',
        description: '阿里巴巴创始人，商业智慧'
      },
      {
        id: 'e4642e5edccd4d9ab61a69e82d4f8a14',
        name: '蔡徐坤',
        gender: 'male',
        tag: '偶像',
        description: '流量明星，年轻时尚'
      },
      {
        id: 'f3c1247c3bc542548bd7e3e97f2ae3ce',
        name: '黎明粤语',
        gender: 'male',
        tag: '天王',
        description: '四大天王粤语声音'
      }
    ]
  },

  // ========== 历史名人 ==========
  {
    id: 'historical',
    name: '名人',
    icon: '📜',
    order: 4,
    voices: [
      {
        id: '918a8277663d476b95e2c4867da0f6a6',
        name: '蒋介石',
        gender: 'male',
        tag: '历史',
        description: '历史人物声音重现'
      },
      {
        id: 'f6f293aabfe24e46aff0fc309c233d31',
        name: '曹操',
        gender: 'male',
        tag: '枭雄',
        description: '三国枭雄，气势磅礴'
      },
      {
        id: '405736979e244634914add64e37290b0',
        name: '麦克阿瑟',
        gender: 'male',
        tag: '将军',
        description: '五星上将，军人气质'
      },
      {
        id: '5849b84966954a27a0e91718efd734af',
        name: '孙悟空',
        gender: 'male',
        tag: '英雄',
        description: '齐天大圣，热血英雄'
      },
      {
        id: '0fb04af381e845e49450762bc941508c',
        name: '唐僧',
        gender: 'male',
        tag: '温和',
        description: '西游记唐僧，慈悲温和'
      }
    ]
  },

  // ========== 动漫游戏 ==========
  {
    id: 'anime',
    name: '二次元',
    icon: '🎮',
    order: 5,
    voices: [
      {
        id: 'eacc56f8ab48443fa84421c547d3b60e',
        name: '派蒙',
        gender: 'child',
        tag: '可爱',
        description: '原神应急食品，超萌童声'
      },
      {
        id: '0eb38bc974e1459facca38b359e13511',
        name: '赛马娘',
        gender: 'female',
        tag: '搞笑',
        description: '赛马娘搞笑风格'
      },
      {
        id: 'c5c17c9709384ba9a4b294662a2af0b1',
        name: '千早爱音',
        gender: 'female',
        tag: '少女',
        description: '动漫少女标准音'
      },
      {
        id: 'a9c99024a22147529a9b6b870c9524cb',
        name: '太乙真人',
        gender: 'male',
        tag: '仙人',
        description: '神仙角色，飘逸仙气'
      },
      {
        id: '131c6b3a889543139680d8b3aa26b98d',
        name: '懒洋洋',
        gender: 'male',
        tag: '可爱',
        description: '懒洋洋角色，憨厚可爱'
      }
    ]
  },

  // ========== 方言特色 ==========
  {
    id: 'dialect',
    name: '方言',
    icon: '🗣️',
    order: 6,
    voices: [
      {
        id: 'da7c442d2589493c8e37547223728122',
        name: '四川方言',
        gender: 'male',
        tag: '方言',
        description: '地道四川话，亲切有趣'
      },
      {
        id: 'd1d2cdfe14a64026987a264fc678b42d',
        name: '粤语女',
        gender: 'female',
        tag: '粤语',
        description: '标准粤语女声'
      },
      {
        id: 'f3c1247c3bc542548bd7e3e97f2ae3ce',
        name: '黎明粤语',
        gender: 'male',
        tag: '粤语',
        description: '港式粤语男声'
      },
      {
        id: 'e855dc04a51f48549b484e41c4d4d4cc',
        name: '台湾女',
        gender: 'female',
        tag: '台湾腔',
        description: '台湾腔女声，清新甜美'
      },
      {
        id: '8ff60fcbaa8748429da6ae4708d40e61',
        name: '东北女',
        gender: 'female',
        tag: '东北话',
        description: '东北话女声，豪爽直率'
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
  // 经典祝福（原有6条）
  {
    id: 'general',
    label: '通用祝福',
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
  },

  // 喜庆祝福（新增3条）
  {
    id: 'festive_1',
    label: '马年大吉',
    text: '马年大吉，恭喜发财！愿您事业腾飞，家庭美满！'
  },
  {
    id: 'festive_2',
    label: '万事如意',
    text: '新年到，福气到！祝您马年行大运，心想事成！'
  },
  {
    id: 'festive_3',
    label: '财运亨通',
    text: '马到成功，财源滚滚！祝您新年生意兴隆，财运亨通！'
  },

  // 温馨祝福（新增3条）
  {
    id: 'warm_1',
    label: '家人团聚',
    text: '千里归家，团圆时刻。愿您阖家欢乐，幸福安康！'
  },
  {
    id: 'warm_2',
    label: '健康平安',
    text: '新的一年，愿您身体健康，平安喜乐，每天都开心！'
  },
  {
    id: 'warm_3',
    label: '感恩陪伴',
    text: '感谢有你，温暖相伴。新年快乐，让我们一起迎接美好！'
  },

  // 趣味祝福（新增3条）
  {
    id: 'fun_1',
    label: '马上有钱',
    text: '马上有钱，马上有对象，马上有一切！祝你马年暴富！'
  },
  {
    id: 'fun_2',
    label: '年轻活力',
    text: '新年新气象，越活越年轻！愿你永远十八岁，快乐每一天！'
  },
  {
    id: 'fun_3',
    label: '吉祥话',
    text: '年年有余，岁岁平安！马年大吉，恭喜恭喜，发财发财！'
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
