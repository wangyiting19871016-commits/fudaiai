/**
 * M1多风格配置
 * 每个风格使用不同的LoRA实现完全不同的艺术风格
 *
 * 关键原则：
 * 1. 保持QWEN提取的发型特征（使用高权重）
 * 2. 保持面部特征和配饰
 * 3. 春节元素灵活运用（不局限于传统服饰）
 */

export interface M1StyleConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  lora: {
    uuid: string;
    trigger_word: string;
    weight: number;
    male_weight?: number;
  };
  prompt_templates: {
    male: { positive: string; negative: string };
    female: { positive: string; negative: string };
  };
}

export const M1_STYLES: Record<string, M1StyleConfig> = {
  // 风格1: 3D皮克斯（原有）
  '3d-pixar': {
    id: '3d-pixar',
    name: '3D福喜',
    description: '皮克斯3D卡通风格',
    icon: '🎬',
    lora: {
      uuid: '95ec78a639394f48827c31adabc00828',
      trigger_word: 'pks',
      weight: 0.4,
      male_weight: 0.35
    },
    prompt_templates: {
      male: {
        positive: "pks, (masterpiece), 3d pixar animation style, ({{HAIR_AGE}}:4.0), ({{ACCESSORIES}}:3.2), ({{FACE}}:2.2), adult male proportions, wearing vibrant red traditional Chinese silk jacket with gold dragon patterns, holding a shiny golden ingot (Yuanbao), soft cinematic lighting, bokeh festive background, high-end 3d character design, rendered in Octane, stylized movie look, vibrant colors, clean smooth surfaces",
        negative: "--no (realistic photo:1.5), (photorealistic:1.5), photograph, low quality, distorted, baby face, youthful, teen, child, toddler, boy, kid, childish face, chibi, big head, small body, cute, kawaii, wrong hairstyle, different hair color, different hair length, bald when should have hair"
      },
      female: {
        positive: "pks, (masterpiece), 3d pixar animation style, ({{HAIR_AGE}}:4.2), ({{ACCESSORIES}}:3.5), ({{FACE}}:2.0), refined facial proportions, wearing vibrant red traditional Chinese silk jacket with gold dragon patterns, holding a shiny golden ingot (Yuanbao), character portrait, bokeh festive background, high-end 3d character design, rendered in Octane, stylized movie look, vibrant colors, clean smooth surfaces",
        negative: "--no (realistic photo:1.5), (photorealistic:1.5), photograph, low quality, distorted, baby face, youthful, smooth young skin, teen, child, cute innocent, chibi, big head, small body, wrong hairstyle, different hair color, different hair length, bald when should have hair"
      }
    }
  },

  // 风格2: 水彩春意（新增）
  'watercolor-spring': {
    id: 'watercolor-spring',
    name: '水彩春意',
    description: '柔和水彩画风，温暖春节氛围',
    icon: '🖌️',
    lora: {
      uuid: '99f2b2879651432385b4b68a1e614976',
      trigger_word: 'watercolor',
      weight: 0.7,       // 🔥 降低权重，让发型更突出
      male_weight: 0.65  // 🔥 男性适当降低
    },
    prompt_templates: {
      male: {
        // 🔥 移除衣服动作，优先级：发型5.8 > 配饰3.8 > 脸型2.2
        positive: "watercolor, (masterpiece), ({{HAIR_AGE}}:5.8), ({{ACCESSORIES}}:3.8), ({{FACE}}:2.2), artistic watercolor portrait painting, Asian man, soft brushstrokes, hand-painted illustration, adult male proportions, festive joyful atmosphere, warm vibrant colors",
        negative: "--no (realistic photo:1.5), (photorealistic:1.5), photograph, wrong hairstyle, different hair color, different hair length, bald when should have hair, baby face, youthful, low quality"
      },
      female: {
        positive: "watercolor, (masterpiece), ({{HAIR_AGE}}:6.0), ({{ACCESSORIES}}:4.0), ({{FACE}}:2.0), artistic watercolor portrait painting, Asian woman, soft brushstrokes, hand-painted illustration, refined female proportions, festive joyful atmosphere, warm vibrant colors",
        negative: "--no (realistic photo:1.5), (photorealistic:1.5), photograph, wrong hairstyle, different hair color, different hair length, bald when should have hair, baby face, youthful, low quality"
      }
    }
  },

  // 风格3: 赛博新春（新增）
  'cyber-newyear': {
    id: 'cyber-newyear',
    name: '赛博新春',
    description: 'Q版赛博朋克，科技感春节',
    icon: '🌃',
    lora: {
      uuid: 'd128f7ca3340468ba1d569d6dd111c70',
      trigger_word: 'cyberpunk',
      weight: 0.7,       // 🔥 降低权重，让发型更突出
      male_weight: 0.65  // 🔥 男性适当降低
    },
    prompt_templates: {
      male: {
        // 🔥 移除衣服动作，优先级：发型6.0 > 配饰3.8 > 脸型2.0
        positive: "cyberpunk, (masterpiece), ({{HAIR_AGE}}:6.0), ({{ACCESSORIES}}:3.8), ({{FACE}}:2.0), cute chibi cartoon style, cyberpunk aesthetic, Asian man, adult male chibi proportions, neon glow effects, festive joyful atmosphere, colorful lighting",
        negative: "--no wrong hairstyle, different hair color, different hair length, bald when should have hair, baby face, youthful, low quality, realistic photo"
      },
      female: {
        positive: "cyberpunk, (masterpiece), ({{HAIR_AGE}}:6.5), ({{ACCESSORIES}}:4.0), ({{FACE}}:1.8), cute chibi cartoon style, cyberpunk aesthetic, Asian woman, female chibi proportions, neon glow effects, festive joyful atmosphere, colorful lighting",
        negative: "--no wrong hairstyle, different hair color, different hair length, bald when should have hair, baby face, youthful, low quality, realistic photo"
      }
    }
  },

  // 风格4: 国风厚涂（新增）
  'thick-paint': {
    id: 'thick-paint',
    name: '国风厚涂',
    description: '厚涂插画风格，国风韵味',
    icon: '🎨',
    lora: {
      uuid: '3b80855c10534549a51a66481bfcc86b',
      trigger_word: 'thick paint',
      weight: 0.7,       // 🔥 降低权重，让发型更突出
      male_weight: 0.65  // 🔥 男性适当降低
    },
    prompt_templates: {
      male: {
        // 🔥 移除衣服动作，大幅提升发型权重：发型6.5 > 配饰3.8 > 脸型2.5
        positive: "thick paint, (masterpiece), ({{HAIR_AGE}}:6.5), ({{ACCESSORIES}}:3.8), ({{FACE}}:2.5), thick paint illustration portrait, Asian man, impasto technique, heavy brushstrokes, painted artwork, (young adult proportions:1.2), (masculine features:1.2), rich vibrant colors, textured oil painting style, festive joyful atmosphere",
        negative: "--no (realistic photo:1.5), (photorealistic:1.5), photograph, wrong hairstyle, different hair color, different hair length, bald when should have hair, (earrings:1.5), (bun:1.5), (hair bun:1.5), (top knot:1.5), (ponytail:1.4), (feminine features:1.4), (middle-aged:1.3), (mature man:1.3), baby face, youthful, low quality"
      },
      female: {
        positive: "thick paint, (masterpiece), ({{HAIR_AGE}}:6.5), ({{ACCESSORIES}}:4.0), ({{FACE}}:2.2), thick paint illustration portrait, Asian woman, impasto technique, heavy brushstrokes, painted artwork, young adult proportions, refined female proportions, rich vibrant colors, textured oil painting style, festive joyful atmosphere",
        negative: "--no (realistic photo:1.5), (photorealistic:1.5), photograph, wrong hairstyle, different hair color, different hair length, bald when should have hair, (middle-aged:1.3), (mature woman:1.3), baby face, youthful, low quality"
      }
    }
  },

  // 风格5: 2D动漫风格（男女都有）
  '2d-anime': {
    id: '2d-anime',
    name: '2D动漫',
    description: '二次元动漫画风',
    icon: '🎨',
    lora: {
      uuid: '5e5968fec9174d13ad15ac4453519abd',
      trigger_word: 'htx',     // ✅ 正确的trigger word
      weight: 0.8,             // 🔥 官方推荐0.8
      male_weight: 0.75        // 🔥 男性0.75
    },
    prompt_templates: {
      male: {
        // 🔥 参考3D福喜简洁风格，不加衣服动作
        positive: "htx, (masterpiece), 2d anime illustration style, ({{HAIR_AGE}}:4.8), ({{ACCESSORIES}}:3.8), ({{FACE}}:2.2), adult male proportions, festive atmosphere, vibrant colors, clean linework",
        negative: "--no 3d, realistic photo, photorealistic, photograph, wrong hairstyle, different hair color, different hair length, bald when should have hair, baby face, youthful, low quality"
      },
      female: {
        positive: "htx, (masterpiece), 2d anime illustration style, ({{HAIR_AGE}}:5.0), ({{ACCESSORIES}}:4.0), ({{FACE}}:2.0), refined female proportions, festive atmosphere, vibrant colors, clean linework",
        negative: "--no 3d, realistic photo, photorealistic, photograph, wrong hairstyle, different hair color, different hair length, bald when should have hair, baby face, youthful, low quality"
      }
    }
  },

  // 风格6: Q版娃娃风格（女性专属）
  'chibi-doll': {
    id: 'chibi-doll',
    name: 'Q版娃娃',
    description: 'Q版可爱娃娃风格',
    icon: '🎎',
    lora: {
      uuid: '95cef7238a9c47be8f02f5a68a9997f4',
      trigger_word: 'chibi',
      weight: 0.7,       // 🔥 降低权重，让发型更突出
      male_weight: 0.65  // 🔥 男性适当降低（虽然不对外提供）
    },
    prompt_templates: {
      male: {
        // 虽然不对外提供男性模板，但保留配置
        positive: "chibi, (masterpiece), ({{HAIR_AGE}}:6.0), ({{ACCESSORIES}}:4.0), ({{FACE}}:1.8), cute chibi doll style, Asian boy, adorable proportions, big head small body, festive Chinese New Year atmosphere, colorful",
        negative: "--no realistic photo, photograph, wrong hairstyle, different hair color, different hair length, bald when should have hair, low quality"
      },
      female: {
        // 🔥 女性专属，移除衣服动作，优先级：发型6.0 > 配饰4.0 > 脸型1.8
        positive: "chibi, (masterpiece), ({{HAIR_AGE}}:6.0), ({{ACCESSORIES}}:4.0), ({{FACE}}:1.8), cute chibi doll style, Asian girl, adorable kawaii proportions, big expressive eyes, small body, festive joyful atmosphere, playful cheerful",
        negative: "--no realistic photo, photograph, 3d render, wrong hairstyle, different hair color, different hair length, bald when should have hair, mature, adult features, low quality"
      }
    }
  },

  // 风格7: 宫崎骏风格（不使用LoRA，纯prompt控制）
  'ghibli-style': {
    id: 'ghibli-style',
    name: '宫崎骏风格',
    description: '吉卜力动画风格',
    icon: '🌿',
    lora: {
      uuid: '',  // 不使用LoRA，使用base model
      trigger_word: '',
      weight: 0,
      male_weight: 0
    },
    prompt_templates: {
      male: {
        // 🔥 不用LoRA，完全靠prompt，优先级：发型6.5 > 衣服2.5 > 配饰3.8 > 脸型2.2 > 动作1.8
        positive: "(masterpiece), Studio Ghibli style, Hayao Miyazaki anime aesthetic, ({{HAIR_AGE}}:6.5), ({{CLOTHING}}:2.5), ({{ACCESSORIES}}:3.8), ({{FACE}}:2.2), ({{POSE}}:1.8), hand-drawn animation art, soft painterly brushstrokes, whimsical atmosphere, warm natural lighting, gentle watercolor tones, nostalgic dreamy feeling, Asian man, young adult proportions, festive joyful mood, magical realism",
        negative: "--no realistic photo, photorealistic, 3d render, photograph, wrong hairstyle, different hair color, different hair length, bald when should have hair, low quality, distorted, baby face"
      },
      female: {
        positive: "(masterpiece), Studio Ghibli style, Hayao Miyazaki anime aesthetic, ({{HAIR_AGE}}:6.8), ({{CLOTHING}}:2.5), ({{ACCESSORIES}}:4.0), ({{FACE}}:2.0), ({{POSE}}:1.8), hand-drawn animation art, soft painterly brushstrokes, whimsical atmosphere, warm natural lighting, gentle watercolor tones, nostalgic dreamy feeling, Asian woman, refined female proportions, festive joyful mood, magical realism",
        negative: "--no realistic photo, photorealistic, 3d render, photograph, wrong hairstyle, different hair color, different hair length, bald when should have hair, low quality, distorted, baby face"
      }
    }
  }
};

// 获取风格配置
export function getM1Style(styleId: string): M1StyleConfig {
  const style = M1_STYLES[styleId];
  if (!style) {
    console.warn(`[M1_Styles] 未找到风格 ${styleId}，使用默认3d-pixar`);
    return M1_STYLES['3d-pixar'];
  }
  return style;
}

// 获取所有风格列表
export function getAllM1Styles(): M1StyleConfig[] {
  return Object.values(M1_STYLES);
}

// 获取风格列表（用于前端展示）
export function getM1StylesList() {
  return Object.values(M1_STYLES).map(style => ({
    id: style.id,
    name: style.name,
    description: style.description,
    icon: style.icon
  }));
}
