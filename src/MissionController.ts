import { Mission, DEFAULT_MISSION, MissionQueue, DEFAULT_MISSION_QUEUE, MISSION_STORAGE_KEY } from './missionSchema';

// 真迹协议 v1.0 标准格式定义
export interface TrueTrackProtocolV1 {
  id: string; // 任务唯一标识
  title: string; // 任务标题
  type: 'A' | 'B' | 'C'; // 任务类型
  demoVideo: {
    url: string;
    type: 'bilibili' | 'mp4';
  };
  steps: Array<{
    id: string;
    title: string;
    description: string;
    content: string;
    guidance: string; // 引导词
    assets: {
      audio?: string[];
      video?: string;
    };
    type: string;
  }>;
  results?: {
    vocal: number;
    bgm: number;
    ambient: number;
    hash: string;
    timestamp: number;
  };
  status: {
    isVerified: boolean;
    isRecorded: boolean;
  };
}

class MissionController {
  private static instance: MissionController;
  private missionQueue: MissionQueue;
  private subscribers: Set<(missionQueue: MissionQueue) => void>;
  private isInitialized: boolean;

  private constructor() {
    this.missionQueue = DEFAULT_MISSION_QUEUE;
    this.subscribers = new Set();
    this.isInitialized = false;
    this.initialize();
  }

  public static getInstance(): MissionController {
    if (!MissionController.instance) {
      MissionController.instance = new MissionController();
    }
    return MissionController.instance;
  }

  private initialize(): void {
    if (this.isInitialized) return;

    try {
      const storedData = localStorage.getItem(MISSION_STORAGE_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        // 强力防御性初始化：检查数据结构
        if (parsed.missionId && !parsed.missions) {
          // 转换为新的队列格式
          this.missionQueue = {
            missions: [parsed],
            currentMissionId: parsed.missionId
          };
        } else {
          // 确保missions是数组
          this.missionQueue = {
            ...DEFAULT_MISSION_QUEUE,
            ...parsed,
            missions: Array.isArray(parsed.missions) ? parsed.missions : []
          };
        }
      }
    } catch (error) {
      console.error('数据损坏，已自动清空重置:', error);
      this.missionQueue = DEFAULT_MISSION_QUEUE;
    }

    this.isInitialized = true;
  }

  private save(): void {
    try {
      localStorage.setItem(MISSION_STORAGE_KEY, JSON.stringify(this.missionQueue));
      this.notifySubscribers();
    } catch (error) {
      console.error('Failed to save mission data:', error);
    }
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback({ ...this.missionQueue });
      } catch (error) {
        console.error('Failed to notify subscriber:', error);
      }
    });
  }

  public subscribe(callback: (missionQueue: MissionQueue) => void): () => void {
    this.subscribers.add(callback);
    callback({ ...this.missionQueue });

    return () => {
      this.subscribers.delete(callback);
    };
  }

  // 获取任务队列
  public getMissionQueue(): MissionQueue {
    return { ...this.missionQueue };
  }

  // 获取所有任务
  public getAllMissions(): Mission[] {
    return [...this.missionQueue.missions];
  }

  // 根据ID获取任务
  public getMissionById(id: string): Mission | null {
    const mission = this.missionQueue.missions.find(
      mission => mission.missionId === id
    );
    return mission ? { ...mission } : null;
  }

  // 获取当前任务
  public getMission(): Mission {
    if (this.missionQueue.currentMissionId) {
      const currentMission = this.missionQueue.missions.find(
        mission => mission.missionId === this.missionQueue.currentMissionId
      );
      if (currentMission) {
        return { ...currentMission };
      }
    }
    // 如果没有当前任务或找不到当前任务，返回第一个任务或默认任务
    return this.missionQueue.missions[0] || { ...DEFAULT_MISSION };
  }

  // 添加新任务到队列前端
  public addMission(mission: Partial<Mission>): void {
    const newMission: Mission = {
      ...DEFAULT_MISSION,
      ...mission,
      timestamp: Date.now(), // 确保每个任务有唯一的 timestamp
      missionId: mission.missionId || `mission_${Date.now()}`
    };
    
    // 将新任务推到最前面
    this.missionQueue.missions.unshift(newMission);
    // 设置新任务为当前任务
    this.missionQueue.currentMissionId = newMission.missionId;
    
    this.save();
  }

  // 更新指定任务
  public updateMission(missionId: string, updates: Partial<Mission>): void {
    const missionIndex = this.missionQueue.missions.findIndex(
      mission => mission.missionId === missionId
    );
    
    if (missionIndex !== -1) {
      this.missionQueue.missions[missionIndex] = {
        ...this.missionQueue.missions[missionIndex],
        ...updates
      };
      this.save();
    }
  }

  // 更新当前任务
  public updateCurrentMission(updates: Partial<Mission>): void {
    const currentMission = this.getMission();
    this.updateMission(currentMission.missionId, updates);
  }

  // 设置指令
  public setInstruction(instruction: string): void {
    this.updateCurrentMission({ instruction });
  }

  // 更新视频信息
  public updateVideo(video: Partial<Mission['video']>): void {
    const currentMission = this.getMission();
    this.updateMission(currentMission.missionId, {
      video: { ...currentMission.video, ...video }
    });
  }

  // 更新代码信息
  public updateCode(code: Partial<Mission['code']>): void {
    const currentMission = this.getMission();
    this.updateMission(currentMission.missionId, {
      code: { ...currentMission.code, ...code }
    });
  }

  // 更新状态
  public updateStatus(status: Partial<Mission['status']>): void {
    const currentMission = this.getMission();
    this.updateMission(currentMission.missionId, {
      status: { ...currentMission.status, ...status }
    });
  }

  // 重置所有任务
  public resetMission(): void {
    this.missionQueue = DEFAULT_MISSION_QUEUE;
    this.save();
  }

  // 设置当前任务ID
  public setCurrentMissionId(missionId: string): void {
    this.missionQueue.currentMissionId = missionId;
    this.save();
  }

  // 设置视频URL
  public setVideoUrl(url: string): void {
    const type = url.includes('bilibili') ? 'bilibili' : 'mp4';
    this.updateCurrentMission({ video: { url, type } });
  }

  // 设置代码模板
  public setCodeTemplate(template: string): void {
    this.updateCurrentMission({ code: { ...this.getMission().code, template } });
  }

  // 设置代码目标
  public setCodeTarget(target: string): void {
    this.updateCurrentMission({ code: { ...this.getMission().code, target } });
  }

  // 设置是否已验证
  public setIsVerified(isVerified: boolean): void {
    this.updateCurrentMission({ status: { ...this.getMission().status, isVerified } });
  }

  // 设置是否已录制
  public setIsRecorded(isRecorded: boolean): void {
    this.updateCurrentMission({ status: { ...this.getMission().status, isRecorded } });
  }
}

export default MissionController.getInstance();