/**
 * M2写真换脸模板配置
 * ⚠️ 只包含COS上实际存在的模板
 *
 * ✅ 已验证可用：
 * - 男性：4个 (male_01~04)
 * - 女性：3个 (female_01~03)
 */

export interface M2Template {
  id: string;
  name: string;
  imagePath: string;  // ✅ COS完整URL
  category: 'traditional' | 'modern' | 'creative' | 'festive';
  gender: 'male' | 'female' | 'child' | 'unisex';
  tags: string[];
}

export interface M2Category {
  id: string;
  name: string;
  description: string;
}

// 分类定义
export const M2_CATEGORIES: M2Category[] = [
  {
    id: 'traditional',
    name: '传统风',
    description: '财神、唐装、汉服等传统造型'
  }
];

// ✅ 模板库（只包含COS上实际存在的模板）
export const M2_TEMPLATES: M2Template[] = [
  // 男性模板 (4个) - ✅ COS已验证
  {
    id: 'm2_male_01',
    name: '财神造型 01',
    imagePath: 'https://fudaiai-1400086527.cos.ap-shanghai.myqcloud.com/festival-templates/caishen/male/male_01.png',
    category: 'traditional',
    gender: 'male',
    tags: ['财神', '金色']
  },
  {
    id: 'm2_male_02',
    name: '财神造型 02',
    imagePath: 'https://fudaiai-1400086527.cos.ap-shanghai.myqcloud.com/festival-templates/caishen/male/male_02.png',
    category: 'traditional',
    gender: 'male',
    tags: ['财神', '金色']
  },
  {
    id: 'm2_male_03',
    name: '财神造型 03',
    imagePath: 'https://fudaiai-1400086527.cos.ap-shanghai.myqcloud.com/festival-templates/caishen/male/male_03.png',
    category: 'traditional',
    gender: 'male',
    tags: ['财神', '金色']
  },
  {
    id: 'm2_male_04',
    name: '财神造型 04',
    imagePath: 'https://fudaiai-1400086527.cos.ap-shanghai.myqcloud.com/festival-templates/caishen/male/male_04.png',
    category: 'traditional',
    gender: 'male',
    tags: ['财神', '金色']
  },

  // 女性模板 (3个) - ✅ COS已验证
  {
    id: 'm2_female_01',
    name: '财神造型 01',
    imagePath: 'https://fudaiai-1400086527.cos.ap-shanghai.myqcloud.com/festival-templates/caishen/female/female_01.png',
    category: 'traditional',
    gender: 'female',
    tags: ['财神', '华丽']
  },
  {
    id: 'm2_female_02',
    name: '财神造型 02',
    imagePath: 'https://fudaiai-1400086527.cos.ap-shanghai.myqcloud.com/festival-templates/caishen/female/female_02.png',
    category: 'traditional',
    gender: 'female',
    tags: ['财神', '华丽']
  },
  {
    id: 'm2_female_03',
    name: '财神造型 03',
    imagePath: 'https://fudaiai-1400086527.cos.ap-shanghai.myqcloud.com/festival-templates/caishen/female/female_03.png',
    category: 'traditional',
    gender: 'female',
    tags: ['财神', '华丽']
  }
];

// 工具函数：按性别和分类筛选
export function getM2TemplatesByGenderAndCategory(
  gender: 'male' | 'female' | 'child',
  category?: string
): M2Template[] {
  let filtered = M2_TEMPLATES.filter(t => t.gender === gender || t.gender === 'unisex');

  if (category && category !== 'all') {
    filtered = filtered.filter(t => t.category === category);
  }

  return filtered;
}

// 工具函数：获取某分类的模板数量
export function getM2CategoryCount(category: string, gender: 'male' | 'female' | 'child'): number {
  return M2_TEMPLATES.filter(t =>
    t.category === category &&
    (t.gender === gender || t.gender === 'unisex')
  ).length;
}

// 工具函数：随机选择模板（兜底用）
export function getRandomM2Template(gender: 'male' | 'female' | 'child'): M2Template {
  const candidates = M2_TEMPLATES.filter(t => t.gender === gender || t.gender === 'unisex');
  if (candidates.length === 0) {
    throw new Error(`No templates available for gender: ${gender}`);
  }
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}

// 工具函数：获取性别标签（用于UI显示）
export function getGenderLabel(gender: 'male' | 'female' | 'child'): string {
  const labels = {
    male: '男性',
    female: '女性',
    child: '儿童'
  };
  return labels[gender];
}

export default M2_TEMPLATES;
