/**
 * 🎨 填空式海报模板配置
 *
 * 万金油方案 - 模板驱动，支持未来设计变更
 * Template-driven poster system for flexible design variations
 */

/**
 * 海报布局区域定义
 */
export interface PosterRegion {
  x: number;           // X坐标（px）
  y: number;           // Y坐标（px）
  width: number;       // 宽度（px）
  height: number;      // 高度（px）
}

/**
 * 春联配置
 */
export interface CoupletConfig {
  // 上联（右侧）
  upper: {
    region: PosterRegion;
    fontSize: number;
    fontFamily: string;
    color: string;
    backgroundColor: string;
    verticalText: boolean;  // 是否竖排
    letterSpacing?: number;
  };

  // 下联（左侧）
  lower: {
    region: PosterRegion;
    fontSize: number;
    fontFamily: string;
    color: string;
    backgroundColor: string;
    verticalText: boolean;
    letterSpacing?: number;
  };

  // 横批（可选）
  horizontal?: {
    region: PosterRegion;
    fontSize: number;
    fontFamily: string;
    color: string;
    backgroundColor?: string;
    horizontalText: boolean;
  };
}

/**
 * 装饰元素配置
 */
export interface DecorationConfig {
  type: 'border' | 'corner' | 'pattern' | 'gradient' | 'image';
  region: PosterRegion;
  style: {
    color?: string;
    lineWidth?: number;
    borderRadius?: number;
    gradient?: {
      type: 'linear' | 'radial';
      colors: string[];
      stops?: number[];
    };
    imageSrc?: string;
    opacity?: number;
  };
}

/**
 * 文字区域配置
 */
export interface TextConfig {
  region: PosterRegion;
  fontSize: number;
  fontFamily: string;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  lineHeight?: number;
  maxLines?: number;
  maxChars?: number;  // 最大字符数（用于拜年文案等）
}

/**
 * 海报模板配置
 */
export interface PosterTemplate {
  id: string;
  name: string;
  description: string;

  // 画布尺寸
  canvas: {
    width: number;
    height: number;
    backgroundColor: string;
  };

  // 主图片区域（用户上传的图片）
  mainImage: {
    region: PosterRegion;
    fit: 'cover' | 'contain' | 'fill';
    borderRadius?: number;
  };

  // 春联配置（可选）
  couplet?: CoupletConfig;

  // 装饰元素（可选）
  decorations?: DecorationConfig[];

  // 文字区域（可选）
  textRegions?: {
    title?: TextConfig;
    subtitle?: TextConfig;
    description?: TextConfig;
  };

  // 水印配置（使用addWatermark.ts）
  watermark: {
    enabled: boolean;
    size: number;      // 水印大小比例（默认0.12）
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    qrCodeUrl?: string;
    text?: string;
  };

  // 品牌色覆盖（可选，默认使用CSS变量）
  brandColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
}

/**
 * 预设模板：经典春联海报
 *
 * 布局说明：
 * - 总宽度：750px
 * - 左春联：50px（距离左边缘50px，15px安全间距）
 * - 主图片：500px（居中）
 * - 右春联：50px（距离右边缘50px，15px安全间距）
 * - 总高度：1334px
 */
export const CLASSIC_COUPLET_POSTER: PosterTemplate = {
  id: 'classic-couplet',
  name: '经典春联海报',
  description: '红底金字春联装饰，适合新年祝福',

  canvas: {
    width: 750,
    height: 1334,
    backgroundColor: '#FFF8F0',  // --cny-bg-warm
  },

  // 主图片区域：居中，500px宽
  mainImage: {
    region: {
      x: 125,      // (750 - 500) / 2
      y: 200,
      width: 500,
      height: 667,
    },
    fit: 'cover',
    borderRadius: 16,
  },

  // 春联配置
  couplet: {
    // 上联（右侧）
    upper: {
      region: {
        x: 650,    // 750 - 50 - 50
        y: 200,
        width: 50,
        height: 667,
      },
      fontSize: 28,
      fontFamily: '"Noto Serif SC", "STKaiti", "KaiTi", serif',
      color: '#FFD700',           // --cny-gold-500
      backgroundColor: '#E53935', // --cny-red-500
      verticalText: true,
      letterSpacing: 12,
    },

    // 下联（左侧）
    lower: {
      region: {
        x: 50,
        y: 200,
        width: 50,
        height: 667,
      },
      fontSize: 28,
      fontFamily: '"Noto Serif SC", "STKaiti", "KaiTi", serif',
      color: '#FFD700',
      backgroundColor: '#E53935',
      verticalText: true,
      letterSpacing: 12,
    },

    // 横批（顶部）
    horizontal: {
      region: {
        x: 225,    // 居中
        y: 120,
        width: 300,
        height: 60,
      },
      fontSize: 32,
      fontFamily: '"Noto Serif SC", "STKaiti", "KaiTi", serif',
      color: '#FFD700',
      backgroundColor: '#E53935',
      horizontalText: true,
    },
  },

  // 装饰元素
  decorations: [
    // 顶部装饰边框
    {
      type: 'border',
      region: {
        x: 40,
        y: 40,
        width: 670,
        height: 80,
      },
      style: {
        color: '#E53935',
        lineWidth: 3,
        borderRadius: 12,
      },
    },

    // 底部渐变装饰
    {
      type: 'gradient',
      region: {
        x: 0,
        y: 900,
        width: 750,
        height: 300,
      },
      style: {
        gradient: {
          type: 'linear',
          colors: ['rgba(255, 248, 240, 0)', 'rgba(229, 57, 53, 0.1)'],
        },
        opacity: 0.6,
      },
    },
  ],

  // 文字区域
  textRegions: {
    title: {
      region: {
        x: 75,
        y: 950,
        width: 600,
        height: 80,
      },
      fontSize: 48,
      fontFamily: '"Noto Serif SC", "STKaiti", "KaiTi", serif',
      color: '#E53935',
      textAlign: 'center',
      lineHeight: 1.5,
    },

    subtitle: {
      region: {
        x: 75,
        y: 1050,
        width: 600,
        height: 60,
      },
      fontSize: 28,
      fontFamily: '"Noto Sans SC", sans-serif',
      color: '#B71C1C',  // --cny-red-700
      textAlign: 'center',
      lineHeight: 1.5,
    },
  },

  // 水印配置
  watermark: {
    enabled: true,
    size: 0.12,
    position: 'bottom-right',
    qrCodeUrl: undefined,  // 运行时提供
    text: '福袋AI制作',
  },
};

/**
 * 预设模板：简约边框海报
 */
export const MINIMAL_FRAME_POSTER: PosterTemplate = {
  id: 'minimal-frame',
  name: '简约边框海报',
  description: '简洁装饰边框，适合现代风格',

  canvas: {
    width: 750,
    height: 1334,
    backgroundColor: '#FFFFFF',
  },

  mainImage: {
    region: {
      x: 75,
      y: 150,
      width: 600,
      height: 800,
    },
    fit: 'cover',
    borderRadius: 24,
  },

  decorations: [
    // 外边框
    {
      type: 'border',
      region: {
        x: 60,
        y: 135,
        width: 630,
        height: 830,
      },
      style: {
        color: '#FFD700',
        lineWidth: 4,
        borderRadius: 28,
      },
    },

    // 内边框
    {
      type: 'border',
      region: {
        x: 70,
        y: 145,
        width: 610,
        height: 810,
      },
      style: {
        color: '#E53935',
        lineWidth: 2,
        borderRadius: 26,
      },
    },
  ],

  textRegions: {
    title: {
      region: {
        x: 75,
        y: 1000,
        width: 600,
        height: 100,
      },
      fontSize: 42,
      fontFamily: '"Noto Serif SC", serif',
      color: '#333333',
      textAlign: 'center',
      lineHeight: 1.5,
      maxLines: 2,
    },
  },

  watermark: {
    enabled: true,
    size: 0.12,
    position: 'bottom-right',
    text: '福袋AI制作',
  },
};

/**
 * 预设模板：全屏照片海报（无边框）
 */
export const FULLSCREEN_PHOTO_POSTER: PosterTemplate = {
  id: 'fullscreen-photo',
  name: '全屏照片海报',
  description: '全屏照片，仅添加水印',

  canvas: {
    width: 750,
    height: 1334,
    backgroundColor: '#000000',
  },

  mainImage: {
    region: {
      x: 0,
      y: 0,
      width: 750,
      height: 1334,
    },
    fit: 'cover',
    borderRadius: 0,
  },

  watermark: {
    enabled: true,
    size: 0.10,
    position: 'bottom-right',
    text: '福袋AI制作',
  },
};

/**
 * 🎁 拜年文案海报模板
 *
 * 专为80-120字的拜年文案设计
 * 布局：上方图片 + 下方文案区域
 */
export const BLESSING_TEXT_POSTER: PosterTemplate = {
  id: 'blessing-text',
  name: '拜年文案海报',
  description: '图片配文案，适合发朋友圈',

  canvas: {
    width: 750,
    height: 1200,
    backgroundColor: '#FFF8F0',
  },

  mainImage: {
    region: {
      x: 50,
      y: 50,
      width: 650,
      height: 650,
    },
    fit: 'cover',
    borderRadius: 12,
  },

  textRegions: {
    description: {
      region: {
        x: 60,
        y: 730,
        width: 630,
        height: 380,
      },
      fontSize: 24,
      fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
      color: '#37474F',
      textAlign: 'left',
      lineHeight: 1.8,
      maxLines: 8,
      maxChars: 120,
    },
  },

  decorations: [
    {
      type: 'border',
      region: {
        x: 50,
        y: 720,
        width: 650,
        height: 400,
      },
      style: {
        color: 'rgba(255, 255, 255, 0.9)',
        lineWidth: 2,
        borderRadius: 12,
        opacity: 0.95,
      },
    },
    {
      type: 'gradient',
      region: {
        x: 60,
        y: 730,
        width: 630,
        height: 4,
      },
      style: {
        gradient: {
          type: 'linear',
          colors: ['#E53935', '#FFC107'],
        },
      },
    },
  ],

  watermark: {
    enabled: true,
    size: 0.10,
    position: 'bottom-right',
    text: '福袋AI',
  },
};

/**
 * 所有预设模板
 */
export const POSTER_TEMPLATES: Record<string, PosterTemplate> = {
  'classic-couplet': CLASSIC_COUPLET_POSTER,
  'minimal-frame': MINIMAL_FRAME_POSTER,
  'fullscreen-photo': FULLSCREEN_PHOTO_POSTER,
  'blessing-text': BLESSING_TEXT_POSTER,
};

/**
 * 获取模板
 */
export function getPosterTemplate(templateId: string): PosterTemplate | null {
  return POSTER_TEMPLATES[templateId] || null;
}

/**
 * 获取所有模板列表
 */
export function getAllPosterTemplates(): PosterTemplate[] {
  return Object.values(POSTER_TEMPLATES);
}
