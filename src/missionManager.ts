// 中央任务管理器 - 基于 MissionController 实现
import MissionController from './MissionController';

class MissionManager {
  // 保存任务数据
  static save(data: any): void {
    try {
      if (data.missionId) {
        // 如果有missionId，更新现有任务
        MissionController.updateMission(data.missionId, data);
      } else {
        // 如果没有missionId，添加新任务
        MissionController.addMission(data);
      }
      console.log('[MissionManager] 任务数据已保存:', data);
    } catch (error) {
      console.error('[MissionManager] 保存任务数据失败:', error);
    }
  }

  // 获取任务数据
  static get(): any {
    try {
      const data = MissionController.getMission();
      return data;
    } catch (error) {
      console.error('[MissionManager] 获取任务数据失败:', error);
      return null;
    }
  }

  // 获取所有任务
  static getAll(): any[] {
    try {
      const missions = MissionController.getAllMissions();
      return missions;
    } catch (error) {
      console.error('[MissionManager] 获取所有任务数据失败:', error);
      return [];
    }
  }

  // 更新任务状态
  static updateStatus(status: Partial<any>): void {
    try {
      MissionController.updateStatus(status);
      console.log('[MissionManager] 任务状态已更新:', status);
    } catch (error) {
      console.error('[MissionManager] 更新任务状态失败:', error);
    }
  }

  // 清除任务数据
  static clear(): void {
    try {
      MissionController.resetMission();
      console.log('[MissionManager] 任务数据已清除');
    } catch (error) {
      console.error('[MissionManager] 清除任务数据失败:', error);
    }
  }

  // 检查任务是否存在
  static exists(): boolean {
    try {
      const data = MissionController.getMission();
      return data.missionId !== '';
    } catch (error) {
      console.error('[MissionManager] 检查任务存在失败:', error);
      return false;
    }
  }
}

export default MissionManager;