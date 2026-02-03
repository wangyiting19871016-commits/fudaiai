/**
 * 🧱 素材原子系统 - 类型定义
 *
 * 积木式架构：每个功能生成的都是独立完整的素材，可以单独使用，也可以组合
 */

export type MaterialType = 'image' | 'text' | 'audio' | 'video' | 'couplet';

export type MaterialRole =
  | 'posterImage'         // 作为海报主图
  | 'posterText'          // 作为海报文案
  | 'coupletDecoration'   // 作为春联装饰
  | 'videoImage'          // 作为视频画面
  | 'videoAudio'          // 作为视频音频
  | 'fortuneCard';        // 作为命理卡片（M8）

/**
 * 春联数据
 */
export interface CoupletData {
  upperLine: string;         // 上联
  lowerLine: string;         // 下联
  horizontalScroll: string;  // 横批（4个字）
}

/**
 * 素材原子 - 统一接口
 */
export interface MaterialAtom {
  id: string;
  type: MaterialType;

  // 实际数据
  data: {
    url?: string;           // 图片/音频/视频URL
    text?: string;          // 文本内容
    couplet?: CoupletData;  // 春联数据
  };

  // 元数据（让其他素材知道如何使用我）
  metadata: {
    dimensions?: { width: number; height: number };  // 图片尺寸
    duration?: number;      // 音频/视频时长
    textLength?: number;    // 文本字数
    format?: string;        // 格式
    createdAt: number;      // 创建时间
    featureId: string;      // 来源功能（M1, M9, M5...）
    featureName: string;    // 功能名称（显示用）
    thumbnail?: string;     // 缩略图
  };

  // 连接器接口（核心！）
  connectors: {
    // 我可以作为什么角色
    roles: MaterialRole[];

    // 我可以和什么类型组合
    canCombineWith: MaterialType[];

    // 组合时的约束条件（可选）
    constraints?: {
      maxCombineCount?: number;    // 最多和几个素材组合
      requiredWith?: MaterialType[]; // 必须和什么一起组合
    };
  };
}

/**
 * 组合选项
 */
export interface CombinationOption {
  id: string;
  name: string;              // 显示名称："生成春联海报"
  description: string;        // 描述："将图片和春联组合成海报"
  icon: string;              // emoji图标
  requiredRoles: MaterialRole[];  // 需要的角色
  output: MaterialType;      // 输出类型
}

/**
 * 素材存储键
 */
export const MATERIAL_STORAGE_KEY = 'festival_materials';

/**
 * 素材存储限制
 */
export const MATERIAL_STORAGE_LIMIT = 50;  // 最多保存50个素材
