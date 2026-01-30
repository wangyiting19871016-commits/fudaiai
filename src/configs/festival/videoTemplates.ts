/**
 * 视频模板配置 - 万金油架构
 *
 * 扩展方式：在 VIDEO_TEMPLATES 数组中添加新模板配置即可
 * 所有动效由前端Canvas代码实现，无需外部视频素材
 */

// ===== 类型定义 =====

export interface Position {
  x: number;  // 百分比 0-100
  y: number;  // 百分比 0-100
}

export interface Size {
  width: number;   // 百分比 0-100
  height: number;  // 百分比 0-100
}

export interface AnimationParams {
  amplitude?: number;  // 振幅
  speed?: number;      // 速度
  count?: number;      // 粒子数量
}

export type BackgroundAnimation = 'none' | 'particles' | 'fireworks' | 'snow' | 'petals' | 'stars';
export type ImageAnimation = 'none' | 'float' | 'zoom' | 'bounce' | 'rotate' | 'breathe';
export type TextAnimation = 'none' | 'fadeIn' | 'typewriter' | 'slideUp' | 'glow';

export interface VideoTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  preview?: string;  // 预览图路径（可选）

  // 画布配置
  canvas: {
    width: number;
    height: number;
    fps: number;
  };

  // 背景配置
  background: {
    type: 'color' | 'gradient' | 'image';
    value: string;  // 颜色值/渐变/图片路径
    animation: BackgroundAnimation;
    animationParams?: AnimationParams;
    particleColor?: string;  // 粒子颜色
  };

  // 主图配置
  mainImage: {
    position: Position;
    size: Size;
    borderRadius?: number;  // 圆角百分比
    shadow?: boolean;
    animation: ImageAnimation;
    animationParams?: AnimationParams;
  };

  // 文字配置
  caption: {
    position: Position;
    maxWidth: number;  // 百分比
    style: {
      fontSize: number;
      fontFamily: string;
      color: string;
      strokeColor?: string;
      strokeWidth?: number;
      shadow?: boolean;
      shadowColor?: string;
      lineHeight?: number;
    };
    animation: TextAnimation;
    delay: number;  // 延迟出现时间（秒）
  };

  // 装饰元素
  decorations: Array<{
    type: 'emoji' | 'text';
    value: string;
    position: Position;
    size: number;  // 字体大小
    animation: ImageAnimation;
    animationParams?: AnimationParams;
    delay?: number;
  }>;

  // 水印配置
  watermark?: {
    text: string;
    position: Position;
    style: {
      fontSize: number;
      color: string;
      opacity: number;
    };
  };
}

// ===== 预设模板 =====

export const VIDEO_TEMPLATES: VideoTemplate[] = [
  // ========== 经典红金 ==========
  {
    id: 'classic-red',
    name: '经典红金',
    icon: '🧧',
    description: '喜庆红色配金色粒子，经典春节氛围',
    canvas: { width: 720, height: 1280, fps: 30 },
    background: {
      type: 'gradient',
      value: 'linear-gradient(180deg, #8B0000 0%, #DC143C 50%, #B22222 100%)',
      animation: 'particles',
      animationParams: { count: 30, speed: 1.5 },
      particleColor: '#FFD700'
    },
    mainImage: {
      position: { x: 50, y: 38 },
      size: { width: 65, height: 50 },
      borderRadius: 8,
      shadow: true,
      animation: 'float',
      animationParams: { amplitude: 8, speed: 2 }
    },
    caption: {
      position: { x: 50, y: 78 },
      maxWidth: 85,
      style: {
        fontSize: 42,
        fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
        color: '#FFD700',
        shadow: true,
        shadowColor: 'rgba(0,0,0,0.5)',
        lineHeight: 1.4
      },
      animation: 'fadeIn',
      delay: 0.5
    },
    decorations: [
      { type: 'emoji', value: '🧧', position: { x: 12, y: 8 }, size: 48, animation: 'float', animationParams: { amplitude: 5, speed: 1.5 } },
      { type: 'emoji', value: '🧧', position: { x: 88, y: 8 }, size: 48, animation: 'float', animationParams: { amplitude: 5, speed: 1.8 } },
      { type: 'emoji', value: '🏮', position: { x: 8, y: 92 }, size: 36, animation: 'float', animationParams: { amplitude: 3, speed: 1.2 } },
      { type: 'emoji', value: '🏮', position: { x: 92, y: 92 }, size: 36, animation: 'float', animationParams: { amplitude: 3, speed: 1.4 } }
    ],
    watermark: {
      text: '福袋AI',
      position: { x: 50, y: 96 },
      style: { fontSize: 14, color: '#FFD700', opacity: 0.6 }
    }
  },

  // ========== 烟花夜空 ==========
  {
    id: 'fireworks-night',
    name: '烟花夜空',
    icon: '🎆',
    description: '深蓝夜空配绚丽烟花，绽放新年祝福',
    canvas: { width: 720, height: 1280, fps: 30 },
    background: {
      type: 'gradient',
      value: 'linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 40%, #2d1b4e 100%)',
      animation: 'fireworks',
      animationParams: { count: 3, speed: 1 }
    },
    mainImage: {
      position: { x: 50, y: 40 },
      size: { width: 60, height: 45 },
      borderRadius: 12,
      shadow: true,
      animation: 'breathe',
      animationParams: { amplitude: 3, speed: 2.5 }
    },
    caption: {
      position: { x: 50, y: 78 },
      maxWidth: 85,
      style: {
        fontSize: 40,
        fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
        color: '#FFFFFF',
        strokeColor: '#FF6B6B',
        strokeWidth: 1,
        shadow: true,
        shadowColor: 'rgba(255,107,107,0.8)',
        lineHeight: 1.4
      },
      animation: 'glow',
      delay: 0.3
    },
    decorations: [
      { type: 'emoji', value: '✨', position: { x: 15, y: 15 }, size: 32, animation: 'float', animationParams: { amplitude: 8, speed: 2 } },
      { type: 'emoji', value: '✨', position: { x: 85, y: 12 }, size: 28, animation: 'float', animationParams: { amplitude: 6, speed: 2.5 } },
      { type: 'emoji', value: '🎆', position: { x: 10, y: 88 }, size: 40, animation: 'bounce', animationParams: { amplitude: 5, speed: 1.5 } },
      { type: 'emoji', value: '🎇', position: { x: 90, y: 90 }, size: 36, animation: 'bounce', animationParams: { amplitude: 4, speed: 1.8 } }
    ],
    watermark: {
      text: '福袋AI',
      position: { x: 50, y: 96 },
      style: { fontSize: 14, color: '#FFFFFF', opacity: 0.5 }
    }
  },

  // ========== 春暖花开 ==========
  {
    id: 'spring-blossom',
    name: '春暖花开',
    icon: '🌸',
    description: '粉色花瓣飘落，温馨浪漫的春日祝福',
    canvas: { width: 720, height: 1280, fps: 30 },
    background: {
      type: 'gradient',
      value: 'linear-gradient(180deg, #FFE4E6 0%, #FECDD3 40%, #FDA4AF 100%)',
      animation: 'petals',
      animationParams: { count: 20, speed: 1.2 },
      particleColor: '#FF69B4'
    },
    mainImage: {
      position: { x: 50, y: 38 },
      size: { width: 62, height: 48 },
      borderRadius: 50,  // 圆形
      shadow: true,
      animation: 'rotate',
      animationParams: { amplitude: 3, speed: 8 }
    },
    caption: {
      position: { x: 50, y: 78 },
      maxWidth: 85,
      style: {
        fontSize: 38,
        fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
        color: '#BE185D',
        shadow: true,
        shadowColor: 'rgba(255,255,255,0.8)',
        lineHeight: 1.5
      },
      animation: 'typewriter',
      delay: 0.3
    },
    decorations: [
      { type: 'emoji', value: '🌸', position: { x: 10, y: 10 }, size: 40, animation: 'float', animationParams: { amplitude: 10, speed: 1.5 } },
      { type: 'emoji', value: '🌸', position: { x: 90, y: 8 }, size: 36, animation: 'float', animationParams: { amplitude: 8, speed: 2 } },
      { type: 'emoji', value: '💮', position: { x: 8, y: 90 }, size: 32, animation: 'rotate', animationParams: { amplitude: 5, speed: 3 } },
      { type: 'emoji', value: '🌷', position: { x: 92, y: 88 }, size: 34, animation: 'float', animationParams: { amplitude: 6, speed: 1.8 } }
    ],
    watermark: {
      text: '福袋AI',
      position: { x: 50, y: 96 },
      style: { fontSize: 14, color: '#BE185D', opacity: 0.5 }
    }
  }
];

// ===== 辅助函数 =====

export const getVideoTemplateById = (id: string): VideoTemplate | undefined => {
  return VIDEO_TEMPLATES.find(t => t.id === id);
};

export const getDefaultVideoTemplate = (): VideoTemplate => {
  return VIDEO_TEMPLATES[0];
};

export const getAllVideoTemplates = (): VideoTemplate[] => {
  return VIDEO_TEMPLATES;
};
