/**
 * 创意视频模板配置
 *
 * 三个分类Tab：
 * - scene-greeting：场景祝福（人物动作+说台词+电影级场景，手机拍不出）
 * - style-transform：风格大片（视觉风格转化，纯冲击力）
 * - bring-alive：万物动起来（新春元素/吉祥物/节日场景活起来）
 *
 * prompt 设计原则：
 * - 不描述图片内容（模型能看到图）
 * - 只描述运动、镜头、氛围、特效
 * - 每个模板必须做到"手机绝对拍不出"的效果
 * - 英文为主（WAN2.6对英文prompt效果更稳定）
 */

export interface CreativeTemplate {
  id: string;
  name: string;
  prompt: string;
  previewUrl?: string;
  description?: string;
  shotType?: 'single' | 'multi';
  audio?: boolean;
  /** Tab分类 */
  category: 'scene-greeting' | 'style-transform' | 'bring-alive';
  /** 祝福语模式：recommended=推荐填(角色说+动作) | optional=可选 | none=不需要 */
  blessingMode: 'recommended' | 'optional' | 'none';
  /** 台词输入框placeholder */
  blessingPlaceholder?: string;
  /** 用户不填时的默认祝福语 */
  defaultBlessing?: string;
  /** 是否默认开启字幕烧录 */
  subtitleDefault?: boolean;
}

export const CATEGORY_LABELS: Record<string, string> = {
  'scene-greeting': '场景祝福',
  'style-transform': '风格大片',
  'bring-alive': '万物动起来'
};

export const CREATIVE_TEMPLATES: CreativeTemplate[] = [
  // ==========================================
  // 场景祝福：人物动作 + 说台词 + 电影级场景特效
  // 核心卖点：手机绝对拍不出的祝福视频
  // ==========================================
  {
    id: 'new-year-blessing',
    name: '拜年送福',
    description: '作揖拜年+烟花漫天+金色粒子环绕',
    prompt: 'A real Chinese New Year celebration scene outdoors at night. The person performs a traditional respectful bow (作揖) toward the camera while speaking warm blessings: "{blessing}". Behind them, real fireworks burst across the dark night sky with natural smoke trails and organic ember patterns. Real red lanterns hang and sway gently on strings overhead. The warm glow of real fireworks naturally illuminates the scene, casting authentic light and shadow on the person. Shot in a real outdoor setting with natural ground and surroundings visible. Camera begins wide then smoothly pushes in to a medium close-up. Natural color temperature in warm red and gold tones. Genuine festive celebration atmosphere, documentary realism with cinematic framing. Consistent identity, stable features.',
    previewUrl: '/assets/creative-previews/new-year-blessing.gif',
    shotType: 'single',
    audio: true,
    category: 'scene-greeting',
    blessingMode: 'recommended',
    blessingPlaceholder: '输入祝福语，如：张总，新年快乐，万事如意！',
    defaultBlessing: '新年快乐，万事如意，阖家幸福！',
    subtitleDefault: true
  },
  {
    id: 'birthday-surprise',
    name: '生日惊喜',
    description: '吹蜡烛+梦幻光效+纸屑漫天+暗到亮转场',
    prompt: 'A magical birthday moment unfolds. The scene begins in warm darkness, lit only by flickering birthday candle glow dancing on the person\'s face. The person smiles warmly, leans forward to blow the candles, then looks up at the camera and says: "{blessing}". As they speak, the entire scene erupts in celebration - rainbow confetti bursts from everywhere, iridescent bubbles and sparkling particles fill the air, golden bokeh lights bloom across the background. Camera smoothly transitions from intimate candle-lit close-up to a wider reveal of the magical celebration. Dreamy warm color grading shifting from amber candlelight to joyful rainbow hues. Enchanting and heartwarming atmosphere. Consistent identity throughout.',
    previewUrl: '/assets/creative-previews/birthday-surprise.gif',
    shotType: 'single',
    audio: true,
    category: 'scene-greeting',
    blessingMode: 'recommended',
    blessingPlaceholder: '输入祝福语，如：亲爱的小明，祝你生日快乐！',
    defaultBlessing: '生日快乐，愿你所有的梦想都能实现！',
    subtitleDefault: true
  },
  {
    id: 'fortune-god-dj',
    name: '财神打碟',
    description: '金色墨镜+打碟律动+金元宝雨+霓虹闪烁',
    prompt: 'The person is dressed in a luxurious red and gold embroidered traditional Chinese robe with golden trim, wearing a golden traditional crown hat and flashy oversized golden sunglasses. Keep the person\'s original clean face exactly as is, do not add any beard or facial hair. They begin rhythmically bobbing their head to an imaginary beat, head swaying confidently left and right with swagger, body gently rocking side to side following the music groove. Expression is bold and supremely confident behind the gleaming gold shades. Arms unfold from crossed position and thrust upward energetically, both hands flashing double victory peace signs. Background neon lights pulse and flash rhythmically, cycling through vivid purple, brilliant gold, and deep red. Massive golden coins and ornate gold ingots cascade from above, splashing and bouncing around the figure. Camera sways left and right matching the beat. Explosive party energy, vibrant saturated colors, ultra-dynamic festive atmosphere. {blessing} Consistent facial identity, stable features.',
    previewUrl: '/assets/creative-previews/fortune-god-dj.gif',
    shotType: 'single',
    audio: true,
    category: 'scene-greeting',
    blessingMode: 'optional',
    blessingPlaceholder: '可选：配一句祝福语，如：恭喜发财，红包拿来！',
    subtitleDefault: false
  },
  {
    id: 'lion-dance-spring',
    name: '舞狮贺春',
    description: '舞狮翻腾+鞭炮齐鸣+红绸飞舞+喜庆爆棚',
    prompt: 'A magnificent Chinese New Year lion dance celebration erupts around the person. They step forward with joyful confidence, arms raised in celebration, speaking festive words: "{blessing}". Behind them, a spectacular traditional lion dance performance unfolds with a vibrant red and gold lion leaping and twisting with acrobatic grace, flowing mane shimmering brilliantly. Firecrackers burst and pop in rhythmic strings, red smoke and golden sparks filling the air. Traditional red streamers and silk ribbons flutter dramatically in the wind. The ground is carpeted with red confetti and firecracker paper. Camera sweeps dynamically to capture both the person and the lion dance spectacle. Rich festive reds, brilliant golds, deeply celebratory atmosphere. Consistent identity, stable features.',
    previewUrl: '/assets/creative-previews/lion-dance-spring.gif',
    shotType: 'single',
    audio: true,
    category: 'scene-greeting',
    blessingMode: 'recommended',
    blessingPlaceholder: '输入祝福语，如：瑞狮献瑞，新春大吉！',
    defaultBlessing: '瑞狮献瑞，恭贺新禧，万事如意！',
    subtitleDefault: true
  },
  {
    id: 'red-envelope-rain',
    name: '红包大派送',
    description: '红包漫天飞舞+金光四射+喜庆接福',
    prompt: 'An incredible scene of prosperity and generosity. The person reaches upward with both hands, joyfully catching red envelopes falling from the sky while speaking blessings: "{blessing}". Hundreds of glossy red envelopes with gold decorative patterns cascade from above like a magnificent rain, tumbling and spinning as they fall. Golden light beams shine down through the red envelope shower. Some envelopes burst open releasing golden sparkles and shimmering confetti. The person spins with arms outstretched, surrounded by this magical red and gold storm. Camera orbits in a dramatic arc, capturing the epic scale of the red envelope rain. Vibrant Chinese red, gold, and warm amber color palette. Joyful, generous, abundant atmosphere. Consistent identity, stable features.',
    previewUrl: '/assets/creative-previews/red-envelope-rain.gif',
    shotType: 'single',
    audio: true,
    category: 'scene-greeting',
    blessingMode: 'recommended',
    blessingPlaceholder: '输入祝福语，如：恭喜发财，红包拿来！',
    defaultBlessing: '恭喜发财，大吉大利，财源广进！',
    subtitleDefault: true
  },
  {
    id: 'couple-blessing',
    name: '甜蜜拜年',
    description: '情侣互动+爱心烟花+粉金光效+甜蜜氛围',
    prompt: 'A heartwarming romantic Chinese New Year moment between two people outdoors at night. They turn to face each other with warm loving smiles, then together turn toward the camera speaking sweet blessings: "{blessing}". One person gently leans their head on the other\'s shoulder. Behind them, real fireworks burst across the night sky in warm pink and golden tones with natural smoke and ember trails. Soft rose petals drift gently in the night breeze. Real warm ambient light from nearby lanterns and fireworks naturally illuminates both faces with a soft romantic glow. Camera begins on an intimate close-up of their faces then slowly pulls back to reveal the night scene with fireworks overhead. Natural warm color temperature in pink and gold tones. Genuine romantic and festive atmosphere, real-world setting. Consistent identity for both people, stable features throughout.',
    previewUrl: '/assets/creative-previews/couple-blessing.gif',
    shotType: 'single',
    audio: true,
    category: 'scene-greeting',
    blessingMode: 'recommended',
    blessingPlaceholder: '输入祝福语，如：亲爱的，新年快乐，永远爱你！',
    defaultBlessing: '新年快乐，愿我们的爱情甜甜蜜蜜，白头偕老！',
    subtitleDefault: true
  },

  // ==========================================
  // 风格大片：视觉风格转化，纯冲击力
  // 核心卖点：一张普通照片变成不可思议的视觉效果
  // ==========================================
  {
    id: 'old-photo-revival',
    name: '老照片复活',
    description: '黑白渐变上色，照片里的人微微动起来',
    prompt: 'The aged photograph awakens with breathtaking subtlety. First, the faded sepia tones begin to bloom with gentle natural color - skin warms to life, eyes gain depth and sparkle. The person blinks softly, then the corner of their lips rises into a tender nostalgic smile. A barely perceptible breeze stirs their hair. The camera executes an impossibly slow push-in, as if time itself is gently approaching this frozen moment. Authentic vintage film grain dances across the frame. Dust particles float in golden light beams. A moment lost in time now breathing again. Warm sepia transitioning to soft natural tones. Minimal motion, maximum emotion. Consistent identity throughout, stable facial features.',
    previewUrl: '/assets/creative-previews/old-photo-revival.gif',
    shotType: 'single',
    audio: true,
    category: 'style-transform',
    blessingMode: 'none'
  },
  {
    id: 'ink-painting',
    name: '国潮水墨',
    description: '变成流动的中国水墨画，花瓣墨迹晕染',
    prompt: 'A masterpiece of living Chinese ink wash painting. The entire image dissolves and reforms as flowing ink, with visible brush strokes painting themselves across the frame in mesmerizing real-time fluidity. The subject emerges from swirling black ink like a figure stepping out of an ancient Chinese scroll painting. Delicate plum blossoms materialize petal by petal, drifting through the composition with weightless grace. Misty mountains appear in the background through atmospheric layers of ink wash. A gentle camera drift reveals new dimensions of depth as ink bleeds and blooms organically in water. The color palette is exquisitely restrained - deep black ink, subtle warm sepia, and delicate pink blossom accents against pure white. Profoundly serene and meditative atmosphere. Traditional Chinese ink painting elevated to cinematic art. No text, no speech, pure visual poetry. Consistent identity, stable features. {blessing}',
    previewUrl: '/assets/creative-previews/ink-painting.gif',
    shotType: 'multi',
    audio: true,
    category: 'style-transform',
    blessingMode: 'optional',
    blessingPlaceholder: '可选：配一句诗意文案，如：墨韵千秋，岁月如画'
  },
  {
    id: 'fireworks-gala',
    name: '烟花盛典',
    description: '满天烟花+万彩绽放+夜空璀璨+光影交错',
    prompt: 'Real-world professional fireworks photography at night. The person stands outdoors gazing upward, face naturally lit by the glow of real fireworks overhead. The dark night sky fills with authentic large-scale fireworks shot on location - real golden chrysanthemum bursts with visible smoke trails, real crackling silver sparkle effects, real red and green peony shells blooming naturally with organic spread patterns and fading ember tails. Multiple fireworks detonate simultaneously at different heights creating layered depth. Real smoke drifts through the scene adding atmospheric haze. The warm colored light from each real explosion naturally illuminates the person\'s face and surroundings, casting authentic shifting shadows. Tiny real sparks and ash particles drift down gently. Shot in a real outdoor nighttime setting with natural ground, real ambient light from distant buildings. Camera begins on the person looking up in genuine wonder, then slowly pulls back to reveal the vast real sky filled with overlapping firework bursts. Natural color temperature, no CGI, no cartoon effects, no animated elements. Documentary-grade realism with cinematic composition. Consistent identity, stable features.',
    previewUrl: '/assets/creative-previews/fireworks-gala.gif',
    shotType: 'single',
    audio: true,
    category: 'style-transform',
    blessingMode: 'none'
  },

  // ==========================================
  // 万物动起来：新春主题元素活起来
  // 核心卖点：一张静态照片变成专业级动态视频
  // ==========================================
  {
    id: 'spring-couplet-alive',
    name: '春联福到',
    description: '春联飘飞+福字旋转+剪纸活化+金光绽放',
    prompt: 'A magical transformation unfolds as traditional Chinese New Year elements come alive around the scene. Red spring couplets with golden calligraphy peel off from doorways and float gracefully through the air, the golden characters glowing with warm inner light. A massive red Fu character materializes and rotates majestically in the center, radiating golden particles outward. Paper-cut art of zodiac animals and flowers detach from surfaces and dance through the frame in elegant choreographed movement. Red lanterns sway and bob as if animated by an invisible festive wind. Everything moves with graceful traditional Chinese artistic beauty. Warm red and gold dominant palette, deeply festive and auspicious atmosphere. {blessing}',
    previewUrl: undefined,
    shotType: 'multi',
    audio: true,
    category: 'bring-alive',
    blessingMode: 'optional',
    blessingPlaceholder: '可选：配一句新春文案，如：福到万家，春满人间'
  },
  {
    id: 'golden-glow-portrait',
    name: '金光大片',
    description: '人物金色逆光+慢动作风吹+电影级浅景深',
    prompt: 'The person in the photo comes alive with stunning cinematic quality. Gorgeous golden hour backlight creates a warm glowing rim around the person\'s hair and shoulders. A gentle breeze slowly moves their hair and clothing in elegant slow motion. The background melts into beautiful creamy bokeh with warm golden and amber tones. The camera executes a very slow push-in toward the person\'s face, maintaining razor-thin depth of field. Natural warm sunlight shifts subtly across their features, highlighting facial contours. The person\'s expression softens into a natural confident smile. Subtle lens flare from the backlight adds cinematic warmth. Every detail is captured in sharp focus while the background remains dreamily soft. Professional portrait cinematography, natural golden color grading. Consistent identity, stable features. {blessing}',
    previewUrl: undefined,
    shotType: 'single',
    audio: true,
    category: 'bring-alive',
    blessingMode: 'optional',
    blessingPlaceholder: '可选：配一句文案，如：你的美，值得被看见'
  }
];

export const getTemplatesByCategory = (category: string): CreativeTemplate[] => {
  return CREATIVE_TEMPLATES.filter(t => t.category === category);
};

export const getTemplateById = (id: string): CreativeTemplate | undefined => {
  return CREATIVE_TEMPLATES.find(t => t.id === id);
};

/**
 * 将用户台词注入模板 prompt
 *
 * - none: 直接返回原prompt
 * - recommended: 有台词则注入（角色说+动作），无台词用defaultBlessing
 * - optional: 有台词则注入，无台词则清除占位符
 */
// 全局后缀：强制中文输出 + 禁止英文
const CHINESE_SUFFIX = ' IMPORTANT: Any visible text, captions, watermarks, or spoken words in the video must be in Chinese characters only. Never generate English text or letters anywhere in the frame. Photorealistic quality, no cartoon or animation style.';

export const buildPromptWithBlessing = (template: CreativeTemplate, blessing?: string): string => {
  let prompt = template.prompt;

  if (template.blessingMode === 'none') {
    return prompt + CHINESE_SUFFIX;
  }

  const userText = blessing?.trim() || '';

  // recommended模式：没填则用默认祝福语
  if (template.blessingMode === 'recommended') {
    const finalText = userText || template.defaultBlessing || '';
    prompt = prompt.replace('{blessing}', finalText);
    return prompt + CHINESE_SUFFIX;
  }

  // optional模式：有则注入，无则清除占位符
  if (userText) {
    prompt = prompt.replace('{blessing}', userText);
  } else {
    prompt = prompt.replace('{blessing}', '').replace(/\s{2,}/g, ' ').trim();
  }
  return prompt + CHINESE_SUFFIX;
};
