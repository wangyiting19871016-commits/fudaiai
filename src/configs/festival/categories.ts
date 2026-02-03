/**
 * 功能分类配置
 *
 * 扩展方式：直接在 CATEGORIES 数组中添加新分类
 */

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  gradient: [string, string];
  previewImage?: string;  // 预览图路径
  order: number;  // 排序权重
}

export const CATEGORIES: Category[] = [
  {
    id: 'avatar',
    name: '新年形象',
    icon: '',
    description: 'AI生成专属新年头像',
    gradient: ['#D32F2F', '#FF6B6B'],
    previewImage: '/assets/showcase/avatar-animated.png',
    order: 1
  },
  {
    id: 'family',
    name: '家庭相册',
    icon: '',
    description: '情侣合照 · 老照片修复',
    gradient: ['#FF6B6B', '#FFA07A'],
    previewImage: '/assets/showcase/couple-photo.png',
    order: 2
  },
  {
    id: 'blessing',
    name: '拜年祝福',
    icon: '',
    description: '文案 · 语音 · 春联',
    gradient: ['#FFD700', '#FFA000'],
    previewImage: '/assets/showcase/blessing-example.jpg',
    order: 3
  },
  {
    id: 'fun',
    name: '运势玩法',
    icon: '',
    description: '马年运势 · 趣味占卜',
    gradient: ['#9C27B0', '#E1BEE7'],
    previewImage: '/assets/showcase/fortune-wealth.png',
    order: 4
  }
];

// 辅助函数
export const getCategoryById = (id: string): Category | undefined => {
  return CATEGORIES.find(c => c.id === id);
};

export const getSortedCategories = (): Category[] => {
  return [...CATEGORIES].sort((a, b) => a.order - b.order);
};
