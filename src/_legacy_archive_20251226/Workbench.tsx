// src/pages/Workbench.tsx

import React, { useState } from 'react';

const Workbench: React.FC = () => {
  const [taskStatus, setTaskStatus] = useState<'incomplete' | 'inProgress' | 'completed'>('incomplete');
  const [userFeedback, setUserFeedback] = useState<string>('');

  // 模拟任务内容
  const mockTask = {
    title: 'Task 1: 学习 Python 基础',
    description: '学习 Python 编程语言的基础，包括语法、数据类型等。',
    successRate: 85,
    failedCount: 3,
  };

  const handleTaskSubmit = () => {
    setTaskStatus('completed');
    alert('任务已提交！');
  };

  const handleFeedbackChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserFeedback(event.target.value);
  };

  return (
    <div style={{ padding: '40px' }}>
      <h1>{mockTask.title}</h1>
      <p>{mockTask.description}</p>
      <p>成功率：{mockTask.successRate}%</p>
      <p>失败次数：{mockTask.failedCount}</p>
      
      <div>
        <h3>任务状态：{taskStatus === 'incomplete' && '待开始'}{taskStatus === 'inProgress' && '进行中'}{taskStatus === 'completed' && '已完成'}</h3>
        
        {taskStatus === 'incomplete' && (
          <div>
            <button onClick={() => setTaskStatus('inProgress')}>开始任务</button>
          </div>
        )}

        {taskStatus === 'inProgress' && (
          <div>
            <textarea
              value={userFeedback}
              onChange={handleFeedbackChange}
              placeholder="请输入你的任务成果或反馈..."
              rows={4}
              style={{ width: '100%' }}
            />
            <button onClick={handleTaskSubmit}>提交任务成果</button>
          </div>
        )}
        
        {taskStatus === 'completed' && (
          <div>
            <p>任务已完成！你的反馈：{userFeedback}</p>
            <button onClick={() => window.location.hash = '#/'}>返回主页</button> {/* 返回主页按钮 */}
            <button onClick={() => setTaskStatus('incomplete')}>重新开始</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Workbench;
