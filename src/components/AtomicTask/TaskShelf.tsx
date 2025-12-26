// TaskShelf.tsx
import React from 'react';
import TaskCard from '../Widgets/TaskCard';
import { AtomTask } from '../../types/index';

const TaskShelf: React.FC = () => {
  // 模拟任务数据（确保任务数据符合 AtomTask 类型）
  const filteredTasks: AtomTask[] = [
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

  const handleTaskClick = (taskId: string) => {
    console.log('Task clicked:', taskId);
  };

  const handlePathClick = (taskId: string) => {
    console.log('Path clicked:', taskId);
    handleTaskClick(taskId);
  };

  return (
    <div className="task-shelf-grid">
      {filteredTasks.map((task) => (
        <div key={task.id} className="task-card-wrapper">
          <TaskCard
            task={task} 
            onPathClick={handlePathClick} 
            mode="home" 
            className="task-card-home" 
          />
        </div>
      ))}
    </div>
  );
};

export default TaskShelf;
