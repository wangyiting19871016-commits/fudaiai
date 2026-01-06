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
}

export interface MissionStep {
  step_id: number;
  title: string;
  desc?: string;
  action_instruction?: string;
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
  assets: string[];
  status?: 'idle' | 'generating' | 'ready';
  videoPath?: string;
  audioPath?: string;
  template_id: string;
  logic_anchor: string;
  activeControls?: string[] | any;
  promptSnippet?: string;
  controls?: ControlItem[];
  mediaAssets: any[];
  privateAccess: string;
  fingerprintWeights: any;
  fingerprintImpact?: number;
  options: { label: string; assetIndex: number; fragment: string }[];
  stepMode?: 'view' | 'tweak' | 'select' | 'code'; // 用于定义 P3 交互逻辑
}

export interface MissionStepUpdate {
  step_id?: number;
  title?: string;
  desc?: string;
  action_instruction?: string;
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
  audioPath?: string;
  template_id?: string;
  logic_anchor?: string;
  activeControls?: string[] | any;
  promptSnippet?: string;
  controls?: ControlItem[];
  mediaAssets?: any[];
  privateAccess?: string;
  fingerprintWeights?: any;
  fingerprintImpact?: number;
  options?: { label: string; assetIndex: number; fragment: string }[];
  stepMode?: 'view' | 'tweak' | 'select' | 'code';
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
