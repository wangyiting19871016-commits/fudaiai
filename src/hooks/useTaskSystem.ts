import { useState } from 'react';
import { useCreditSystem } from './useCreditSystem';

export type TaskStatus = 'pending' | 'failed' | 'success';
export type TaskType = 'video' | 'audio' | 'sensor';

export interface Task {
  id: number;
  title: string;
  type: TaskType;
  status: TaskStatus;
  attempts: number;
  failedAttempts: number;
  issuerSignature: string;
  description: string;
  requirement: string;
  reward: number;
  videoUrl?: string;
}

export const useTaskSystem = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { 
      id: 1, 
      title: '视频录制任务', 
      type: 'video', 
      status: 'pending', 
      attempts: 0,
      failedAttempts: 0,
      issuerSignature: 'SIGNATURE_VIDEO_20251225',
      description: '录制一段高质量的视频内容',
      requirement: '15秒',
      reward: 100,
      videoUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1afc3d42f?q=80&w=1200'
    },
    { 
      id: 2, 
      title: '音频录制任务', 
      type: 'audio', 
      status: 'failed', 
      attempts: 2,
      failedAttempts: 1,
      issuerSignature: 'SIGNATURE_AUDIO_20251225',
      description: '录制一段清晰的音频内容',
      requirement: '30秒',
      reward: 150,
      videoUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1afc3d42f?q=80&w=1200'
    },
    { 
      id: 3, 
      title: '传感器数据采集', 
      type: 'sensor', 
      status: 'success', 
      attempts: 1,
      failedAttempts: 0,
      issuerSignature: 'SIGNATURE_SENSOR_20251225',
      description: '采集环境传感器数据',
      requirement: '5分钟',
      reward: 200,
      videoUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1afc3d42f?q=80&w=1200'
    },
    { 
      id: 4, 
      title: '视频编辑任务', 
      type: 'video', 
      status: 'pending', 
      attempts: 0,
      failedAttempts: 0,
      issuerSignature: 'SIGNATURE_VIDEO_EDIT_20251225',
      description: '编辑和剪辑视频内容',
      requirement: '60秒',
      reward: 250,
      videoUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1afc3d42f?q=80&w=1200'
    },
    { 
      id: 5, 
      title: '音频处理任务', 
      type: 'audio', 
      status: 'pending', 
      attempts: 0,
      failedAttempts: 0,
      issuerSignature: 'SIGNATURE_AUDIO_PROCESS_20251225',
      description: '处理和优化音频文件',
      requirement: '45秒',
      reward: 180,
      videoUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1afc3d42f?q=80&w=1200'
    }
  ]);

  const { addCredit } = useCreditSystem();

  const completeTask = (id: number, result: 'success' | 'failed') => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === id) {
          const newStatus: TaskStatus = result;
          const newAttempts = result === 'failed' ? task.attempts + 1 : task.attempts;
          const newFailedAttempts = result === 'failed' ? task.failedAttempts + 1 : task.failedAttempts;
          
          // 只有第一次成功时才增加信用分
          if (result === 'success' && task.status !== 'success') {
            addCredit(100);
          }
          
          return { ...task, status: newStatus, attempts: newAttempts, failedAttempts: newFailedAttempts };
        }
        return task;
      })
    );
  };

  return { tasks, completeTask };
};
