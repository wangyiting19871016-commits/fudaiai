// Project Truth V1.5 数据架构
// 官方灰模 (Ghost State) 数据结构

// 基准标杆接口
export interface Benchmark {
  id: string;
  author: string;
  videoUrl: string;
  tips: string;
  textContent?: string; // 新增：存储文本验证结果
  aestheticParams?: {
    exposure: number;
    brightness: number;
    contrast: number;
    saturation: number;
    vibrance: number;
    warmth: number;
    tint: number;
    shadows: number;
    highlights: number;
    blackPoint: number;
    brilliance: number;
    sharpness: number;
    definition: number;
    noise: number;
  };
}

// 原子槽位 (官方挖的坑)
export interface AtomicSlot {
  id: string;
  stepLabel: string;   // e.g., "01"
  title: string;       // e.g., "萃取液面控制"
  
  // --- 官方标准 (The Law) ---
  officialCriteria: string; // e.g., "油脂必须完整覆盖液面"
  officialAnchor: string;   // 视觉锚点图片 URL (线稿/灰模)
  
  // --- 文本校验扩展 ---
  verifyType?: 'VIDEO' | 'TEXT'; // 默认为 VIDEO
  regexConfig?: { pattern: string; hint: string }[]; // 正则校验配置
  
  // --- 审美参数 ---
  aestheticParams?: Record<string, any>; // 存储审美调整参数
  
  // --- 当前状态 ---
  // 如果为 null，显示"灰模态"；如果有值，显示"霸榜态"
  currentBenchmark?: null | Benchmark;
  
  // --- 验证状态 ---
  isVerified?: boolean; // 标记该步骤是否已验证
  
  // --- 验证数据 ---
  verificationData?: {
    endpoint: string;
    model_id: string;
    io_schema: import('../types/index').IOSchema;
    params_schema: import('../types/index').ProtocolParam[];
    verified_params: Record<string, any>;
  };

  // --- 能力挂载 (Capability Mounting) ---
  mountedCapability?: import('../types/Protocol').CapabilityManifest; // 挂载的通用能力包
}

// 悬赏任务 (官方发的令)
export interface Mission {
  id: string;
  title: string;       // e.g., "咖啡拉花·基础心形"
  description: string;
  difficulty: 'Easy' | 'Hard' | 'Hell';
  slots: AtomicSlot[]; // 包含 N 个原子槽位
}