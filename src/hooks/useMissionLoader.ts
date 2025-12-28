import { useState, useEffect } from 'react';

// 任务数据类型定义
export interface Mission {
  id: string | number;
  title: string;
  type: 'TEXT' | 'VOICE' | 'SCREEN' | string;
  description?: string;
  instruction?: string;
  content?: string;
}

// 静态数据源（保底数据）
const STATIC_MISSIONS: Mission[] = [
  { id: 1, title: "核心名录", type: "TEXT", description: "请输入本阶段 Maker 视频中提到的 3 个核心关键词。", content: "Success" },
  { id: 2, title: "声韵刻录", type: "VOICE", description: "请大声朗读屏幕上的关键句：\"Can I get a Latte?\"", content: "Latte" },
  { id: 3, title: "真迹定格", type: "SCREEN", description: "请调取 Gamma 窗口，定格你的大纲页面。", content: "Gamma" },
  { id: "step_1", title: "核心名录 (Step 1)", type: "TEXT", description: "请输入本阶段 Maker 视频中提到的 3 个核心关键词。", content: "Success" },
  { id: "step_2", title: "声韵刻录 (Step 2)", type: "VOICE", description: "请大声朗读屏幕上的关键句：\"Can I get a Latte?\"", content: "Latte" }
];

// Hook 返回类型
export interface UseMissionLoaderResult {
  mission: Mission | null;
  loading: boolean;
  error: string | null;
}

/**
 * 任务数据加载 Hook
 * @param stepId 任务ID
 * @returns 任务数据、加载状态和错误信息
 */
export const useMissionLoader = (stepId: string | undefined): UseMissionLoaderResult => {
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stepId) {
      setError('任务ID未提供');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. 读取本地存储的自定义任务
      const localMissionsJson = localStorage.getItem('custom_missions');
      const localMissions: Mission[] = localMissionsJson ? JSON.parse(localMissionsJson) : [];

      // 2. 合并静态数据和本地数据
      const allMissions = [...STATIC_MISSIONS, ...localMissions];

      // 3. 查找匹配的任务
      const foundMission = allMissions.find(m => String(m.id) === String(stepId));

      if (foundMission) {
        setMission(foundMission);
      } else {
        setError(`未找到ID为 ${stepId} 的任务`);
      }
    } catch (err) {
      setError('数据加载失败，请检查数据格式');
    } finally {
      setLoading(false);
    }
  }, [stepId]);

  return { mission, loading, error };
};