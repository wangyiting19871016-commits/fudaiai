// TaskCard.tsx
import React, { useState } from 'react';
import { AtomTask } from '../../types/index';

interface TaskProps {
  task: AtomTask;
  onPathClick: (taskId: string) => void;
  onVerify?: (content: any) => void;
  mode?: string;
  className?: string;
}

const TaskCard: React.FC<TaskProps> = ({ task, onPathClick, mode, className }) => {
  const [status, setStatus] = useState(task.status || 'inactive');

  // 点击按钮时更新任务状态
  const handleStatusChange = () => {
    setStatus(status === 'inactive' ? 'certified' : 'inactive');
  };

  return (
    <div className={className}>
      <h3>{task.title}</h3>
      <p>{task.content}</p>
      
      {/* 显示任务属性 */}
      <div style={{ fontSize: '0.9em', color: '#666', margin: '10px 0' }}>
        <span>难度: {'★'.repeat(task.difficulty)}</span>
        <span style={{ marginLeft: '10px' }}>分类: {task.category}</span>
        <span style={{ marginLeft: '10px' }}>奖励: {task.rewards}</span>
      </div>

      <img 
        width="320" 
        height="240" 
        src="https://picsum.photos/1200/675" 
        alt="Task preview"
        style={{ objectFit: 'cover' }}
      />

      <button onClick={() => onPathClick(task.id)}>Go to Path</button>

      {/* 显示任务状态并提供更改按钮 */}
      <p>状态: {status === 'certified' ? '已存证' : '未激活'}</p>
      <button onClick={handleStatusChange}>
        {status === 'certified' ? '标记为未激活' : '标记为已存证'}
      </button>
    </div>
  );
};

export default TaskCard;
