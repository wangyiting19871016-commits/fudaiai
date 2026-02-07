/**
 * M1自定义提示词 - 快速参考方案
 * 为用户提供常用的prompt模板
 */

export interface PromptSuggestion {
  id: string;
  label: string;
  prompt: string;
  category: 'costume' | 'scene' | 'pose' | 'atmosphere';
  tags: string[];
}

export const PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  // 服饰类
  {
    id: 'trad_red',
    label: '新年传统装',
    prompt: 'wearing vibrant red Chinese traditional costume with gold patterns, holding golden ingot, festive background with lanterns',
    category: 'costume',
    tags: ['传统', '红色', '金元宝']
  },
  {
    id: 'tang_dynasty',
    label: '唐装复古',
    prompt: 'wearing Tang dynasty traditional hanfu clothing, ancient Chinese architecture background, elegant pose',
    category: 'costume',
    tags: ['唐装', '汉服', '复古']
  },
  {
    id: 'modern_street',
    label: '现代街头风',
    prompt: 'wearing modern casual streetwear with Chinese New Year elements, urban decorations background, cool pose',
    category: 'costume',
    tags: ['现代', '街头', '潮流']
  },
  {
    id: 'festive_hoodie',
    label: '卫衣潮流',
    prompt: 'wearing festive hoodie with lucky symbols and Chinese characters, colorful lanterns background, relaxed pose',
    category: 'costume',
    tags: ['卫衣', '潮牌', '轻松']
  },

  // 场景类
  {
    id: 'temple_fair',
    label: '庙会场景',
    prompt: 'at traditional Chinese temple fair, red lanterns everywhere, festive crowd background, joyful atmosphere',
    category: 'scene',
    tags: ['庙会', '热闹', '传统']
  },
  {
    id: 'modern_city',
    label: '现代都市',
    prompt: 'in modern Chinese city with New Year decorations, neon lights, skyscrapers with festive elements',
    category: 'scene',
    tags: ['都市', '霓虹', '现代']
  },
  {
    id: 'home_reunion',
    label: '温馨家庭',
    prompt: 'at warm cozy home with red decorations, family reunion atmosphere, spring couplets on walls',
    category: 'scene',
    tags: ['家庭', '温馨', '团圆']
  },

  // 动作类
  {
    id: 'holding_red_envelope',
    label: '拿红包',
    prompt: 'holding red envelope with both hands, happy excited expression, giving or receiving pose',
    category: 'pose',
    tags: ['红包', '开心', '互动']
  },
  {
    id: 'making_dumplings',
    label: '包饺子',
    prompt: 'making Chinese dumplings, hands working with dough, warm kitchen scene, cooking together',
    category: 'pose',
    tags: ['饺子', '厨房', '团圆']
  },
  {
    id: 'setting_fireworks',
    label: '放烟花',
    prompt: 'holding sparklers or fireworks, night sky with colorful fireworks, celebrating pose',
    category: 'pose',
    tags: ['烟花', '夜晚', '庆祝']
  }
];

// 分类获取
export function getSuggestionsByCategory(category: string): PromptSuggestion[] {
  return PROMPT_SUGGESTIONS.filter(s => s.category === category);
}

// 获取所有服饰类建议
export function getCostumeSuggestions(): PromptSuggestion[] {
  return getSuggestionsByCategory('costume');
}

// 获取所有场景类建议
export function getSceneSuggestions(): PromptSuggestion[] {
  return getSuggestionsByCategory('scene');
}

// 获取所有动作类建议
export function getPoseSuggestions(): PromptSuggestion[] {
  return getSuggestionsByCategory('pose');
}
