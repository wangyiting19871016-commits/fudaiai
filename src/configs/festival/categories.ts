/**
 * 春节功能分类配置
 */
export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  gradient: [string, string];
  previewImage?: string;
  order: number;
}

export const CATEGORIES: Category[] = [
  {
    id: 'avatar',
    name: '新年形象',
    icon: '',
    description: 'AI 生成专属新年头像',
    gradient: ['#D32F2F', '#FF6B6B'],
    previewImage: '/assets/showcase/new-year-avatar-latest.png',
    order: 1
  },
  {
    id: 'family',
    name: '家庭相册',
    icon: '',
    description: '情侣合照 · 老照片修复',
    gradient: ['#FF6B6B', '#FFA07A'],
    previewImage: '/assets/showcase/couple-s350.jpg',
    order: 2
  },
  {
    id: 'video',
    name: '视频制作',
    icon: '',
    description: '特效视频 · 数字人拜年',
    gradient: ['#FF6B6B', '#FFA07A'],
    previewImage: '/assets/showcase/digital-human-preview.gif',
    order: 2.5
  },
  {
    id: 'blessing',
    name: '拜年祝福',
    icon: '',
    description: '文案 · 语音 · 春联',
    gradient: ['#FFD700', '#FFA000'],
    previewImage: '/assets/showcase/baonian-download.png',
    order: 3
  },
  {
    id: 'companion',
    name: '未来伴侣',
    icon: '',
    description: '我的未来伴侣是何模样？',
    gradient: ['#7C4DFF', '#E040FB'],
    previewImage: '/assets/showcase/future-companion-card.png',
    order: 3.5
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

export const getCategoryById = (id: string): Category | undefined => {
  return CATEGORIES.find((c) => c.id === id);
};

export const getSortedCategories = (): Category[] => {
  return [...CATEGORIES].sort((a, b) => a.order - b.order);
};
