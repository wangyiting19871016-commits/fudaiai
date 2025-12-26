import React from 'react';
import TaskCard from '../Widgets/TaskCard';
import { AtomTask } from '../../types/index';

const mockAtomicTasks: AtomTask[] = [
  { 
    id: '1',
    title: '步骤1: 基础介绍',
    content: '这是第一步的详细说明内容',
    prompt: '开始基础介绍任务',
    status: 'inactive',
    difficulty: 1,
    category: 'introduction',
    estimatedTime: 30,
    rewards: 50,
  },
  { 
    id: '2',
    title: '步骤2: 核心概念',
    content: '这是第二步的详细说明内容',
    prompt: '学习核心概念',
    status: 'inactive',
    difficulty: 2,
    category: 'learning',
    estimatedTime: 45,
    rewards: 75,
  },
];

const MainStageAnchor: React.FC = () => {
  // 任务路径点击回调
  const handlePathClick = (taskId: string) => {
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>任务展示</h1>
      {mockAtomicTasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onPathClick={handlePathClick}  // 将点击事件传递给 TaskCard
          mode="home"
          className="task-card-home"
        />
      ))}
    </div>
  );
};

export default MainStageAnchor;
