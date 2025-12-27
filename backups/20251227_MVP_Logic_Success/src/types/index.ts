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

// 原子任务接口
export interface AtomTask {
  id: string;
  title: string; // 任务标题
  pre_id?: string; // 前置任务ID
  prompt: string; // 提示词口令
  content: string; // 任务目标
  status: 'inactive' | 'certified'; // 未激活/已存证
  difficulty: number; // 难度等级 1-5
  category: string; // 任务分类
  estimatedTime: number; // 预估时间(分钟)
  rewards: number; // 信用分奖励
  dependencies?: string[]; // 依赖的任务ID数组
  nextTasks?: string[]; // 后续任务ID数组
  failureRate?: number; // 失败率(0-1)
  lastAttempt?: Date; // 最后尝试时间
  previewUrl?: string; // 预览视频URL
}

// 任务路径数据结构
export interface TaskPath {
  taskId: string;
  sequence: AtomTask[]; // 任务序列
  currentIndex: number; // 当前进度
  totalProgress: number; // 总体进度 0-1
}
