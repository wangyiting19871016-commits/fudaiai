export interface Video {
  url: string;
  type: 'bilibili' | 'mp4';
}

export interface Code {
  template: string;
  target: string;
}

export interface MissionStatus {
  isVerified: boolean;
  isRecorded: boolean;
}

export interface MissionResults {
  vocal: number;
  bgm: number;
  ambient: number;
  hash: string;
  timestamp: number;
}

export interface Mission {
  missionId: string;
  timestamp: number; // 作为唯一ID
  video: Video;
  code: Code;
  status: MissionStatus;
  instruction?: string;
  title?: string;
  description?: string;
  type?: string;
  assets?: {
    audio: string[];
  };
  results?: MissionResults;
}

export const DEFAULT_MISSION: Mission = {
  missionId: '',
  timestamp: Date.now(),
  video: {
    url: '',
    type: 'mp4'
  },
  code: {
    template: '',
    target: ''
  },
  status: {
    isVerified: false,
    isRecorded: false
  },
  instruction: '',
  title: '',
  description: '',
  type: ''
};

// 任务队列存储结构
export interface MissionQueue {
  missions: Mission[];
  currentMissionId?: string;
}

export const DEFAULT_MISSION_QUEUE: MissionQueue = {
  missions: [],
  currentMissionId: undefined
};

export const MISSION_STORAGE_KEY = 'MISSION_STORAGE_V1';