export type FestivalGender = 'male' | 'female';

export interface FestivalTemplateAsset {
  id: string;
  localPath: string;
  label?: string;
}

export interface FestivalAssetTrigger {
  male: FestivalTemplateAsset[];
  female: FestivalTemplateAsset[];
}

export const FESTIVAL_ASSET_TRIGGERS: Record<string, FestivalAssetTrigger> = {
  caishen: {
    male: [
      // 🧪 测试模板 - 古装剑客（低风险）
      { id: 'test_male_01', localPath: 'https://fudaiai-1400086527.cos.ap-shanghai.myqcloud.com/festival/test-templates/1769705136360_e596fde7afa7d810121ddac7834e4bf7052936f7e05597aa1456b100b3d992c4.png', label: '古装剑客' },
      // 财神模板（已被拦截，仅作备用）
      { id: 'caishen_male_01', localPath: '/assets/festival-templates/caishen/male/male_01.png' },
      { id: 'caishen_male_02', localPath: '/assets/festival-templates/caishen/male/male_02.png' },
      { id: 'caishen_male_03', localPath: '/assets/festival-templates/caishen/male/male_03.png' },
      { id: 'caishen_male_04', localPath: '/assets/festival-templates/caishen/male/male_04.png' }
    ],
    female: [
      // 🧪 测试模板 - 旗袍女性（低风险）
      { id: 'test_female_01', localPath: 'https://fudaiai-1400086527.cos.ap-shanghai.myqcloud.com/festival/test-templates/1769705109625_690872624-71ee668d691c87aafbefd14813a00f651caeab6a1961f0f66fb1d5bb0d9eb339.png', label: '旗袍女性' },
      // 🧪 测试模板 - 红毛衣女性（最安全）
      { id: 'test_female_02', localPath: 'https://fudaiai-1400086527.cos.ap-shanghai.myqcloud.com/festival/test-templates/1769705116978_ab5d31452bf410d5454266b4e93850085b874830c0129a671b045cf3830a3199.png', label: '红毛衣女性' },
      // 🧪 测试模板 - 小女孩财神装（中风险）
      { id: 'test_female_03', localPath: 'https://fudaiai-1400086527.cos.ap-shanghai.myqcloud.com/festival/test-templates/1769705141416_0e651d3ac759739b9d556be65160fcb165d6b5a9a80df6e204ac08d9997744f1.png', label: '小女孩财神装' },
      // 🧪 测试模板 - 小女孩金龙纹（中风险）
      { id: 'test_female_04', localPath: 'https://fudaiai-1400086527.cos.ap-shanghai.myqcloud.com/festival/test-templates/1769705156263_fe5ab0bdacd924ba46e31c4e7259a83a611c84babde511ce280fa62764b79fa4.png', label: '小女孩金龙纹' },
      // 财神模板（已被拦截，仅作备用）
      { id: 'caishen_female_01', localPath: '/assets/festival-templates/caishen/female/female_01.png' },
      { id: 'caishen_female_02', localPath: '/assets/festival-templates/caishen/female/female_02.png' },
      { id: 'caishen_female_03', localPath: '/assets/festival-templates/caishen/female/female_03.png' }
    ]
  }
};
