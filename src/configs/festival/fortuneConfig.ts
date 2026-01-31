/**
 * 春节运势抽卡配置
 * 包含6种运势类型及吉祥话文案
 */

export type FortuneRarity = 'legendary' | 'epic' | 'rare' | 'common';

export interface FortuneType {
  id: string;
  name: string;                    // 中文标题
  englishTitle: string;            // 英文标题
  color: {
    primary: string;               // 主色调
    gradient: string[];            // 渐变色
  };
  rarity: FortuneRarity;          // 稀有度
  weight: number;                  // 抽取权重
  blessings: string[];             // 吉祥话文案池
  icon: string;                    // emoji图标
}

/**
 * 运势类型配置
 */
export const FORTUNE_TYPES: FortuneType[] = [
  // 传说级 (5%)
  {
    id: 'yifa',
    name: '一发入魂',
    englishTitle: 'ONE SHOT ONE KILL',
    color: {
      primary: '#FF0066',
      gradient: ['#FF0066', '#FF6B9D', '#FFA8CC']
    },
    rarity: 'legendary',
    weight: 5,
    icon: '🎯',
    blessings: [
      '马年鸿运当头，出手必中！',
      '蛇去马来转乾坤，一击即中好运来！',
      '马蹄疾速夺先机，逢赌必赢财神笑！',
      '马年神准如有神，箭无虚发福满门！'
    ]
  },

  // 史诗级 (10%)
  {
    id: 'luck',
    name: '欧气爆棚',
    englishTitle: 'LUCK OVERFLOWING',
    color: {
      primary: '#9D00FF',
      gradient: ['#9D00FF', '#C266FF', '#E5B3FF']
    },
    rarity: 'epic',
    weight: 10,
    icon: '✨',
    blessings: [
      '马年欧皇附体，万事如意！',
      '紫气东来马蹄急，好运连连不断头！',
      '马踏祥云送吉祥，幸运值爆表到年底！',
      '马年天选之子，抽卡必出金！'
    ]
  },

  // 稀有级 (15%)
  {
    id: 'wealth',
    name: '财源滚滚',
    englishTitle: 'WEALTH ARRIVES UNEXPECTEDLY',
    color: {
      primary: '#FFD700',
      gradient: ['#FFD700', '#FFC107', '#FFEB3B']
    },
    rarity: 'rare',
    weight: 15,
    icon: '💰',
    blessings: [
      '马年财运亨通，金银满屋！',
      '马踏金山万两来，财源广进福满堂！',
      '马蹄声声送财来，日进斗金乐开怀！',
      '马年招财进宝，富贵盈门！'
    ]
  },

  {
    id: 'love',
    name: '桃花朵朵',
    englishTitle: 'LOVE BLOSSOMS EVERYWHERE',
    color: {
      primary: '#FF69B4',
      gradient: ['#FF1493', '#FF69B4', '#FFB6C1']
    },
    rarity: 'rare',
    weight: 15,
    icon: '💖',
    blessings: [
      '马年桃花运旺，良缘将至！',
      '马到春来花满枝，姻缘天定心相知！',
      '马蹄踏春桃花开，心上人儿缘份来！',
      '马年红鸾星动，佳偶天成！'
    ]
  },

  // 普通级 (30% + 30% = 60%)
  {
    id: 'career',
    name: '事业高升',
    englishTitle: 'CAREER ADVANCEMENT',
    color: {
      primary: '#00CED1',
      gradient: ['#00CED1', '#48D1CC', '#AFEEEE']
    },
    rarity: 'common',
    weight: 30,
    icon: '📈',
    blessings: [
      '马年事业腾飞，步步高升！',
      '马到成功平步起，青云直上展宏图！',
      '马蹄声声催奋进，加薪升职在眼前！',
      '马年贵人相助，事业如虹！'
    ]
  },

  {
    id: 'health',
    name: '身体健康',
    englishTitle: 'HEALTH AND VITALITY',
    color: {
      primary: '#32CD32',
      gradient: ['#32CD32', '#90EE90', '#98FB98']
    },
    rarity: 'common',
    weight: 30,
    icon: '💪',
    blessings: [
      '马年精神矍铄，健康长寿！',
      '马到健康体魄强，龙马精神乐安康！',
      '马蹄轻快活力足，百病不侵福寿长！',
      '马年身强体壮，生龙活虎！'
    ]
  }
];

/**
 * 稀有度配置
 */
export const RARITY_CONFIG: Record<FortuneRarity, {
  label: string;
  probability: number;  // 概率百分比
  glowColor: string;   // 发光颜色
  particleCount: number; // 粒子特效数量
}> = {
  legendary: {
    label: '传说',
    probability: 5,
    glowColor: '#FF0066',
    particleCount: 50
  },
  epic: {
    label: '史诗',
    probability: 10,
    glowColor: '#9D00FF',
    particleCount: 30
  },
  rare: {
    label: '稀有',
    probability: 15,
    glowColor: '#FFD700',
    particleCount: 20
  },
  common: {
    label: '普通',
    probability: 70,
    glowColor: '#FFFFFF',
    particleCount: 10
  }
};

/**
 * 获取运势配置
 */
export const getFortuneById = (id: string): FortuneType | undefined => {
  return FORTUNE_TYPES.find(f => f.id === id);
};

/**
 * 获取所有运势权重总和
 */
export const getTotalWeight = (): number => {
  return FORTUNE_TYPES.reduce((sum, f) => sum + f.weight, 0);
};
