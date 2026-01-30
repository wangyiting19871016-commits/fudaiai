// 资产类型定义
export interface Asset {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'audio' | 'video';
  size: number;
  createdAt: string;
}

export interface Step {
  id: string;
  title: string;
  desc: string;
  description?: string;
  videoUrl?: string;
  status: 'active' | 'locked' | 'completed';
  isLocked: boolean;
  thumbnail?: string;
  duration?: string;
  reward?: number;
  activeControls?: string[] | any;
  controls?: any;
  promptSnippet?: string;
  mediaAssets: any[];
  privateAccess: string;
  fingerprintWeights: any;
  assets: (string | Asset)[];
}

// 通用输入类型定义
export type InputType = 'text' | 'number' | 'slider' | 'select' | 'boolean' | 'image' | 'audio' | 'video' | 'file';

// 通用输出类型定义
export type OutputType = 'image' | 'video' | 'audio' | 'text' | 'json';

// IO Schema 定义
export interface IOSchema {
  inputType: InputType;
  outputType: OutputType;
}

// 协议参数定义
export interface ProtocolParam {
  id: string;
  name: string;
  type: string;
  defaultValue?: any;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  options?: Array<{ label: string; value: any }>;
}

// 输入参数定义
export interface InputParam {
  id: string;
  name: string;
  type: InputType;
  required: boolean;
  defaultValue?: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: any }[];
  description?: string;
}

// 输出结果定义
export interface OutputResult {
  type: OutputType;
  data: any;
  metadata?: any;
}

// 远程能力定义
export interface RemoteCapability {
  id: string;
  name: string;
  apiEndpoint: string;
  inputParams: InputParam[];
  outputType: OutputType;
  description?: string;
  authType?: 'none' | 'api_key' | 'oauth';
  apiKey?: string;
}

// 能力映射器配置
export interface CapabilityMapperConfig {
  isDeveloperMode: boolean;
  activeCapability?: RemoteCapability;
  capabilities: RemoteCapability[];
}

export interface MissionStep {
  step_id: number;
  title: string;
  desc?: string;
  action_instruction?: string;
  instruction?: string;
  isCompleted: boolean;
  visionData?: any;
  evidence_desc?: string;
  audioUrl?: string;
  originalAudioUrl?: string;
  audioDuration?: number;
  keyFrame?: any;
  startTime?: number;
  start_time?: number;
  end_time?: number;
  assets: (string | Asset)[];
  status?: 'idle' | 'generating' | 'ready';
  videoPath?: string;
  audioPath?: string;
  template_id: string;
  logic_anchor: string;
  activeControls?: string[] | any;
  promptSnippet?: string;
  controls?: ControlItem[];
  mediaAssets: string[]; // 修改为存储assetId数组
  privateAccess: string;
  fingerprintWeights: any;
  fingerprintImpact?: number;
  options: { label: string; assetIndex: number; fragment: string }[];
  stepMode?: 'view' | 'tweak' | 'select' | 'code'; // 用于定义 P3 交互逻辑
  sourceImage?: string;
  inputAssetId?: string; // 新增：输入资产ID
  aestheticParams?: any; // 新增：审美参数对象
  // 新增：任务类型选择器 - 扩展为全功能类型
  actionType?: 'Preset' | 'GitHubPlugin' | 'Manual' | 'Prompt' | 'RemoteAPI'; // 新增RemoteAPI类型
  // 新增：工具类型选择器
  toolType?: string;
  // 新增：逻辑继承配置
  logicInheritance?: {
    inheritFromPrevious: boolean;
    previousStepId: number;
    inputMappings: Record<string, string>;
  };
  // 新增：提示词模板
  promptTemplate?: string;
  // 新增：步骤挂载的插件ID列表
  pluginIds?: string[];
  // 新增：外部参数包信息
  externalParams?: ExternalParamPackage;
  // 新增：素材池 - 支持多图上传
  materialPool?: {
    id: string;
    name: string;
    images: {
      id: string;
      url: string;
      name: string;
      type: string;
      size: number;
      isSelected?: boolean;
    }[];
    selectedImageIds?: string[];
  };
  // 新增：GitHub插件配置
  githubPluginConfig?: {
    algorithmId: string;
    params: any;
    sourceUrl: string;
    version: string;
  };
  // 新增：P1_Facade_GIF 标识
  isP1FacadeGIF?: boolean; // 标记是否为 P1_Facade_GIF
  // 新增：通用输入/输出协议
  inputParams?: InputParam[];
  outputResult?: OutputResult;
  // 新增：远程能力配置
  remoteCapabilityConfig?: {
    capabilityId?: string;
    inputValues: Record<string, any>;
    apiEndpoint?: string;
  };
  // 新增：逻辑任务类型
  taskType?: 'image' | 'text' | 'audio' | 'video' | 'logic' | 'progress';
  // 新增：逻辑任务内容
  logicContent?: any;
  // 新增：步骤类型 - 用于挂载验证能力
  stepType?: 'material-input' | 'param-adjustment' | 'api-trigger';
  // 新增：步骤挂载的参数
  params?: Record<string, any>;
  // 新增：步骤挂载的参数schema
  params_schema?: any;
  // 新增：步骤是否已挂载能力
  isMounted?: boolean;
  // 新增：验证数据
  verificationData?: {
    endpoint: string;
    model_id: string;
    io_schema: IOSchema;
    params_schema: ProtocolParam[];
    verified_params: Record<string, any>;
  };
  // 新增：Recipe ID (P4 Phase 4)
  recipeId?: string;
  // 新增：Recipe Name (P4 Phase 4)
  recipeName?: string;
  // 新增：配方参数
  recipeParams?: Record<string, any>;
  // 新增：配方模式标志
  isRecipeMode?: boolean;
  // 新增：差异协议字段
  deltaParams?: any;
  // 新增：逻辑映射键
  mappingKey?: string;
  // 新增：滑块名称
  sliderLabel?: string;
  // 新增：画像影响值
  portraitImpact?: number;
  // 新增：挂载的能力包 (P4 Phase 3)
  mountedCapability?: import('./Protocol').CapabilityManifest;
}

export interface MissionStepUpdate {
  step_id?: number;
  title?: string;
  desc?: string;
  action_instruction?: string;
  instruction?: string;
  isCompleted?: boolean;
  visionData?: any;
  evidence_desc?: string;
  audioUrl?: string;
  originalAudioUrl?: string;
  audioDuration?: number;
  keyFrame?: any;
  startTime?: number;
  start_time?: number;
  end_time?: number;
  assets?: string[];
  status?: 'idle' | 'generating' | 'ready';
  videoPath?: string;
  sourceImage?: string;
  inputAssetId?: string; // 新增：输入资产ID
  audioPath?: string;
  template_id?: string;
  logic_anchor?: string;
  activeControls?: string[] | any;
  promptSnippet?: string;
  controls?: ControlItem[];
  mediaAssets?: string[]; // 修改为存储assetId数组
  privateAccess?: string;
  fingerprintWeights?: any;
  fingerprintImpact?: number;
  options?: { label: string; assetIndex: number; fragment: string }[];
  stepMode?: 'view' | 'tweak' | 'select' | 'code';
  // 新增：步骤挂载的插件ID列表
  pluginIds?: string[];
  // 新增：外部参数包信息
  externalParams?: ExternalParamPackage;
  // 新增：任务类型选择器
  actionType?: 'Preset' | 'GitHubPlugin' | 'Manual' | 'Prompt' | 'RemoteAPI';
  // 新增：工具类型选择器
  toolType?: string;
  // 新增：逻辑继承配置
  logicInheritance?: {
    inheritFromPrevious: boolean;
    previousStepId: number;
    inputMappings: Record<string, string>;
  };
  // 新增：素材池
  materialPool?: {
    id: string;
    name: string;
    images: {
      id: string;
      url: string;
      name: string;
      type: string;
      size: number;
      isSelected?: boolean;
    }[];
    selectedImageIds?: string[];
  };
  // 新增：GitHub插件配置
  githubPluginConfig?: {
    algorithmId: string;
    params: any;
    sourceUrl: string;
    version: string;
  };
  // 新增：P1_Facade_GIF 标识
  isP1FacadeGIF?: boolean;
  // 新增：通用输入/输出协议
  inputParams?: InputParam[];
  outputResult?: OutputResult;
  // 新增：远程能力配置
  remoteCapabilityConfig?: {
    capabilityId?: string;
    inputValues: Record<string, any>;
    apiEndpoint?: string;
  };
  // 新增：逻辑任务类型
  taskType?: 'image' | 'text' | 'audio' | 'video' | 'logic' | 'progress';
  // 新增：逻辑任务内容
  logicContent?: any;
  // 新增：Recipe ID (P4 Phase 4)
  recipeId?: string;
  // 新增：Recipe Name (P4 Phase 4)
  recipeName?: string;
  // 新增：配方参数
  recipeParams?: Record<string, any>;
  // 新增：配方模式标志
  isRecipeMode?: boolean;
  // 新增：模型ID (P4 Phase 4)
  modelId?: string;
  // 新增：插槽ID (P4 Phase 4)
  slotId?: string;
  // 新增：通用参数 (P4 Phase 4)
  parameters?: Record<string, any>;
}

export interface ControlItem {
  id: string;
  label: string;      // 参数名 (如 "曝光")
  target: string;     // 绑定目标 (如 "css:brightness")
  value: number;      // 默认值 (如 1.2)
  min?: number;
  max?: number;
  insight?: string;   // 认知胶囊文案 (如 "增加曝光可提升神圣感")
}

export interface Course {
  id: number;
  title: string;
  difficulty: string;
  duration: string;
  videoUrl: string;
}

export interface Task {
  id: number;
  title: string;
  type: 'video' | 'audio' | 'sensor';
  status: 'pending' | 'failed' | 'success';
  attempts: number;
  failedAttempts: number;
  issuerSignature: string;
  description: string;
  requirement: string;
  reward: number;
  videoUrl?: string;
}

// 工具插件接口
export interface ToolPlugin {
  id: string;
  name: string;
  icon: string;
  category?: string;
  subCategory?: string;
  description: string;
  component: React.ComponentType<any>;
  isEnabled: boolean;
  defaultEnabled?: boolean;
}

// 工具包接口 - ToolKit 协议
export interface ToolKit {
  id: string;
  name: string;
  description: string;
  icon: string;
  plugins: string[]; // 包含的插件ID列表
  version: string;
  author: string;
  source?: 'local' | 'github' | 'external'; // 来源
  sourceUrl?: string; // 外部来源URL
  createdAt: string;
  updatedAt: string;
}

// 插件存储接口 - PluginStore
export interface PluginStore {
  plugins: ToolPlugin[];
  toolkits: ToolKit[];
  activeToolkit?: string; // 当前激活的工具包ID
  stepPlugins: Record<number, string[]>; // 每个步骤挂载的插件ID列表
}

// 方案预设接口
export interface SolutionPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  aestheticParams: any;
  actionType?: 'simulate' | 'inject' | 'merge';
}

// 外部参数包接口
export interface ExternalParamPackage {
  name: string;
  description: string;
  params: any;
  type: 'filter' | 'effect' | 'preset';
  source: string;
  version: string;
}

export type ViewMode = 'EVIDENCE' | 'CREATION_LAB' | 'FEED' | 'BATTLE_ZONE';

export interface EvidenceTask {
  id: number;
  title: string;
  status: string;
  details: { time: string; trust: string };
}

export interface AtomTask {
  id: string;
  title: string;
  pre_id?: string;
  prompt: string;
  content: string;
  status: 'inactive' | 'certified';
  difficulty: number;
  category: string;
  estimatedTime: number;
  rewards: number;
  dependencies?: string[];
  nextTasks?: string[];
  failureRate?: number;
  lastAttempt?: Date;
  previewUrl?: string;
}

export interface TaskPath {
  taskId: string;
  sequence: AtomTask[];
  currentIndex: number;
  totalProgress: number;
}
