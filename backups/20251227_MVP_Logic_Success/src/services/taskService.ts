import React from 'react';
import { AtomTask } from '../types/index';
import { mockAtomicTasks } from '../data/mockAtomicTasks';

// 模拟API延迟
const API_DELAY = 800;

// 模拟网络错误的概率
const ERROR_PROBABILITY = 0.05;

// 任务数据服务
export class TaskService {
  private static instance: TaskService;
  private cache: Map<string, AtomTask> = new Map();

  static getInstance(): TaskService {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService();
    }
    return TaskService.instance;
  }

  // 获取所有任务
  async getAllTasks(): Promise<AtomTask[]> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < ERROR_PROBABILITY) {
          reject(new Error('网络错误：无法获取任务列表'));
        } else {
          resolve([...mockAtomicTasks]);
        }
      }, API_DELAY);
    });
  }

  // 根据ID获取单个任务
  async getTaskById(taskId: string): Promise<AtomTask | null> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < ERROR_PROBABILITY) {
          reject(new Error(`网络错误：无法获取任务 ${taskId}`));
        } else {
          // 先检查缓存
          if (this.cache.has(taskId)) {
            resolve(this.cache.get(taskId)!);
            return;
          }

          // 从模拟数据中查找
          const task = mockAtomicTasks.find(task => task.id === taskId);
          if (task) {
            this.cache.set(taskId, task);
            resolve(task);
          } else {
            resolve(null);
          }
        }
      }, API_DELAY / 2); // 单个任务获取更快
    });
  }

  // 获取任务路径（前置和后续任务）
  async getTaskPath(taskId: string): Promise<{
    current: AtomTask | null;
    predecessors: AtomTask[];
    successors: AtomTask[];
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        const currentTask = await this.getTaskById(taskId);
        if (!currentTask) {
          resolve({
            current: null,
            predecessors: [],
            successors: []
          });
          return;
        }

        // 获取所有任务
        const allTasks = await this.getAllTasks();
        
        // 查找前置任务
        const predecessors = currentTask.pre_id ? 
          allTasks.filter(task => task.id === currentTask.pre_id) : [];

        // 查找后续任务
        const successors = allTasks.filter(task => task.pre_id === currentTask.id);

        resolve({
          current: currentTask,
          predecessors,
          successors
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // 验证任务提交
  async submitTask(taskId: string, content: string): Promise<{
    success: boolean;
    validationId: string;
    estimatedTime: number;
  }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const validationId = `val_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const estimatedTime = Math.random() * 2000 + 1000; // 1-3秒
        
        resolve({
          success: true,
          validationId,
          estimatedTime
        });
      }, 500);
    });
  }

  // 获取验证状态
  async getValidationStatus(validationId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    result?: any;
  }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const progress = Math.random() * 100;
        const status = progress >= 100 ? 'completed' : 
                      progress >= 80 ? 'processing' : 
                      'pending';
        
        resolve({
          status,
          progress: Math.min(progress, 100)
        });
      }, 300);
    });
  }

  // 清除缓存
  clearCache(): void {
    this.cache.clear();
  }
}

// 导出单例实例
export const taskService = TaskService.getInstance();

// 钩子函数：获取任务数据
export function useTaskData(taskId: string) {
  const [task, setTask] = React.useState<AtomTask | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchTask = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const taskData = await taskService.getTaskById(taskId);
      setTask(taskData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取任务失败');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  React.useEffect(() => {
    let isCancelled = false;

    if (taskId) {
      fetchTask();
    }

    return () => {
      isCancelled = true;
    };
  }, [taskId, fetchTask]);

  return { task, loading, error, refetch: fetchTask };
}

// 钩子函数：获取任务路径
export function useTaskPath(taskId: string) {
  const [pathData, setPathData] = React.useState<{
    current: AtomTask | null;
    predecessors: AtomTask[];
    successors: AtomTask[];
  }>({
    current: null,
    predecessors: [],
    successors: []
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchPath = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskService.getTaskPath(taskId);
      setPathData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取任务路径失败');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  React.useEffect(() => {
    let isCancelled = false;

    if (taskId) {
      fetchPath();
    }

    return () => {
      isCancelled = true;
    };
  }, [taskId, fetchPath]);

  return { pathData, loading, error, refetch: fetchPath };
}