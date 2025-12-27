import { useState, useEffect } from 'react';
import { useCreditSystem } from './useCreditSystem';

interface TaskStatus {
  [key: string]: boolean;
}

const useTaskManager = () => {
  const [taskStatus, setTaskStatus] = useState<TaskStatus>(() => {
    // 从 localStorage 加载任务完成状态
    const initialStatus: TaskStatus = {};
    for (let i = 1; i <= 15; i++) {
      const key = `completed_step_${i}`;
      initialStatus[key] = localStorage.getItem(key) === 'true';
    }
    return initialStatus;
  });

  // 整合信用系统
  const { credit, level, addCredit, recentCreditChange } = useCreditSystem();

  // 监听 localStorage 变化
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('completed_step_')) {
        setTaskStatus(prev => ({
          ...prev,
          [e.key]: e.newValue === 'true'
        }));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 保存任务状态到 localStorage
  useEffect(() => {
    Object.entries(taskStatus).forEach(([key, value]) => {
      localStorage.setItem(key, value ? 'true' : 'false');
    });
  }, [taskStatus]);

  // 检查任务是否完成
  const isStepFinished = (id: string) => {
    return taskStatus[id] || false;
  };

  // 完成任务并增加分数
  const completeTask = (id: string) => {
    if (!taskStatus[id]) {
      setTaskStatus(prev => ({
        ...prev,
        [id]: true
      }));
      addCredit(10);
    }
  };

  // 重置所有任务状态
  const resetAllTasks = () => {
    const resetStatus: TaskStatus = {};
    for (let i = 1; i <= 15; i++) {
      resetStatus[`completed_step_${i}`] = false;
    }
    setTaskStatus(resetStatus);
    // 重置分数需要通过 useCreditSystem，这里暂时不实现
  };

  return {
    taskStatus,
    credit,
    level,
    recentCreditChange,
    isStepFinished,
    completeTask,
    resetAllTasks
  };
};

export default useTaskManager;