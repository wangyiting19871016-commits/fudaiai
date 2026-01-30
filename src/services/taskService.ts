import React from 'react';
import { AtomTask } from '../types/index';

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
    // 实际项目中，这里应该调用真实的API
    return [];
  }

  // 根据ID获取单个任务
  async getTaskById(taskId: string): Promise<AtomTask | null> {
    // 实际项目中，这里应该调用真实的API
    return null;
  }

  // 获取任务路径（前置和后续任务）
  async getTaskPath(taskId: string): Promise<{
    current: AtomTask | null;
    predecessors: AtomTask[];
    successors: AtomTask[];
  }> {
    // 实际项目中，这里应该调用真实的API
    return {
      current: null,
      predecessors: [],
      successors: []
    };
  }

  // 验证任务提交
  async submitTask(taskId: string, content: string): Promise<{
    success: boolean;
    validationId: string;
    estimatedTime: number;
  }> {
    // 实际项目中，这里应该调用真实的API
    return {
      success: false,
      validationId: '',
      estimatedTime: 0
    };
  }

  // 获取验证状态
  async getValidationStatus(validationId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    result?: any;
  }> {
    // 实际项目中，这里应该调用真实的API
    return {
      status: 'pending',
      progress: 0
    };
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