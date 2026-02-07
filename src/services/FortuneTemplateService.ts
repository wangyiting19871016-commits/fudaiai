/**
 * 运势卡模板服务
 * 使用预制模板图片，随机选择返回
 */

export interface FortuneTemplate {
  id: string;
  name: string;
  imagePath: string;
  fortuneType: string; // 'wealth' | 'love' | 'career' | 'health' | 'luck' | 'yifa'
}

/**
 * 运势卡模板库（20-30张精选模板）
 */
const FORTUNE_TEMPLATES: FortuneTemplate[] = [
  // 财运模板
  { id: 'wealth_01', name: '马年旺财', imagePath: '/assets/fortune-templates/wealth-01.png', fortuneType: 'wealth' },
  { id: 'wealth_02', name: '财源滚滚', imagePath: '/assets/fortune-templates/wealth-02.png', fortuneType: 'wealth' },
  { id: 'wealth_03', name: '金玉满堂', imagePath: '/assets/fortune-templates/wealth-03.png', fortuneType: 'wealth' },
  { id: 'wealth_04', name: '招财进宝', imagePath: '/assets/fortune-bg/bg-wealth.png', fortuneType: 'wealth' },

  // 桃花运模板
  { id: 'love_01', name: '桃花朵朵', imagePath: '/assets/fortune-templates/love-01.png', fortuneType: 'love' },
  { id: 'love_02', name: '良缘天成', imagePath: '/assets/fortune-templates/love-02.png', fortuneType: 'love' },
  { id: 'love_03', name: '佳偶天成', imagePath: '/assets/fortune-templates/love-03.png', fortuneType: 'love' },
  { id: 'love_04', name: '缘定三生', imagePath: '/assets/fortune-bg/bg-love.png', fortuneType: 'love' },

  // 事业运模板
  { id: 'career_01', name: '官运亨通', imagePath: '/assets/fortune-templates/career-01.png', fortuneType: 'career' },
  { id: 'career_02', name: '步步高升', imagePath: '/assets/fortune-templates/career-02.png', fortuneType: 'career' },
  { id: 'career_03', name: '飞黄腾达', imagePath: '/assets/fortune-templates/career-03.png', fortuneType: 'career' },
  { id: 'career_04', name: '鹏程万里', imagePath: '/assets/fortune-bg/bg-career.png', fortuneType: 'career' },

  // 健康运模板
  { id: 'health_01', name: '福寿安康', imagePath: '/assets/fortune-templates/health-01.png', fortuneType: 'health' },
  { id: 'health_02', name: '长命百岁', imagePath: '/assets/fortune-templates/health-02.png', fortuneType: 'health' },
  { id: 'health_03', name: '身体健康', imagePath: '/assets/fortune-templates/health-03.png', fortuneType: 'health' },
  { id: 'health_04', name: '健康平安', imagePath: '/assets/fortune-bg/bg-health.png', fortuneType: 'health' },

  // 欧气模板
  { id: 'luck_01', name: '鸿运当头', imagePath: '/assets/fortune-templates/luck-01.png', fortuneType: 'luck' },
  { id: 'luck_02', name: '时来运转', imagePath: '/assets/fortune-templates/luck-02.png', fortuneType: 'luck' },
  { id: 'luck_03', name: '好运连连', imagePath: '/assets/fortune-templates/luck-03.png', fortuneType: 'luck' },
  { id: 'luck_04', name: '福星高照', imagePath: '/assets/fortune-bg/bg-luck.png', fortuneType: 'luck' },

  // 易发财模板
  { id: 'yifa_01', name: '一发就发', imagePath: '/assets/fortune-templates/yifa-01.png', fortuneType: 'yifa' },
  { id: 'yifa_02', name: '发发发', imagePath: '/assets/fortune-templates/yifa-02.png', fortuneType: 'yifa' },
  { id: 'yifa_03', name: '财运亨通', imagePath: '/assets/fortune-templates/yifa-03.png', fortuneType: 'yifa' },
  { id: 'yifa_04', name: '大吉大利', imagePath: '/assets/fortune-bg/bg-yifa.png', fortuneType: 'yifa' },

  // 🆕 新增通用运势卡（17张）
  { id: 'new_01', name: '新年福卡', imagePath: '/assets/fortune-templates/new-card-1.jpg', fortuneType: 'wealth' },
  { id: 'new_02', name: '新年福卡', imagePath: '/assets/fortune-templates/new-card-2.jpg', fortuneType: 'luck' },
  { id: 'new_03', name: '新年福卡', imagePath: '/assets/fortune-templates/new-card-3.jpg', fortuneType: 'love' },
  { id: 'new_04', name: '新年福卡', imagePath: '/assets/fortune-templates/new-card-4.jpg', fortuneType: 'career' },
  { id: 'new_05', name: '新年福卡', imagePath: '/assets/fortune-templates/new-card-5.jpg', fortuneType: 'health' },
  { id: 'new_06', name: '新年福卡', imagePath: '/assets/fortune-templates/new-card-6.jpg', fortuneType: 'yifa' },
  { id: 'new_07', name: '新年福卡', imagePath: '/assets/fortune-templates/new-card-7.jpg', fortuneType: 'wealth' },
  { id: 'new_08', name: '新年福卡', imagePath: '/assets/fortune-templates/new-card-8.jpg', fortuneType: 'luck' },
  { id: 'new_09', name: '新年福卡', imagePath: '/assets/fortune-templates/new-card-9.jpg', fortuneType: 'love' },
  { id: 'new_10', name: '新年福卡', imagePath: '/assets/fortune-templates/new-card-10.jpg', fortuneType: 'career' },
  { id: 'new_11', name: '新年福卡', imagePath: '/assets/fortune-templates/new-card-11.jpg', fortuneType: 'health' },
  { id: 'new_12', name: '新年福卡', imagePath: '/assets/fortune-templates/new-card-12.jpg', fortuneType: 'yifa' },
  { id: 'new_13', name: '新年福卡', imagePath: '/assets/fortune-templates/new-card-13.jpg', fortuneType: 'wealth' },
  { id: 'new_14', name: '新年福卡', imagePath: '/assets/fortune-templates/new-card-14.jpg', fortuneType: 'luck' },
  { id: 'new_15', name: '新年福卡', imagePath: '/assets/fortune-templates/new-card-15.jpg', fortuneType: 'love' },
  { id: 'new_16', name: '新年福卡', imagePath: '/assets/fortune-templates/new-card-16.jpg', fortuneType: 'career' },
  { id: 'new_17', name: '新年福卡', imagePath: '/assets/fortune-templates/new-card-17.jpg', fortuneType: 'health' },
];

export class FortuneTemplateService {
  /**
   * 随机选择一张运势卡模板
   */
  static getRandomTemplate(fortuneType?: string): FortuneTemplate {
    let candidates = FORTUNE_TEMPLATES;

    // 如果指定了运势类型，优先选择对应类型的模板
    if (fortuneType) {
      const typeTemplates = FORTUNE_TEMPLATES.filter(t => t.fortuneType === fortuneType);
      if (typeTemplates.length > 0) {
        candidates = typeTemplates;
      }
    }

    // 随机选择
    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
  }

  /**
   * 根据运势类型获取所有模板
   */
  static getTemplatesByType(fortuneType: string): FortuneTemplate[] {
    return FORTUNE_TEMPLATES.filter(t => t.fortuneType === fortuneType);
  }

  /**
   * 获取模板总数
   */
  static getTotalCount(): number {
    return FORTUNE_TEMPLATES.length;
  }

  /**
   * 预加载所有模板图片（可选优化）
   */
  static async preloadAllTemplates(): Promise<void> {
    const promises = FORTUNE_TEMPLATES.map(template => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // 失败也继续
        img.src = template.imagePath;
      });
    });

    await Promise.all(promises);
    console.log(`[FortuneTemplateService] 预加载完成，共${FORTUNE_TEMPLATES.length}张模板`);
  }
}

export default FortuneTemplateService;
