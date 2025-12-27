import React, { useState, useEffect } from 'react';

const mockTasks = [
  { id: 1, name: 'Task 1', status: 'incomplete', failedCount: 2, successRate: 85 },
  { id: 2, name: 'Task 2', status: 'incomplete', failedCount: 0, successRate: 100 },
  { id: 3, name: 'Task 3', status: 'incomplete', failedCount: 5, successRate: 60 },
  { id: 4, name: 'Task 4', status: 'incomplete', failedCount: 1, successRate: 90 },
  { id: 5, name: 'Task 5', status: 'incomplete', failedCount: 3, successRate: 75 }
];

export default function PathView() {
  const getSavedTasks = () => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      return JSON.parse(savedTasks);
    }
    return mockTasks;
  };

  const [tasks, setTasks] = useState(getSavedTasks);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleTaskClick = (id: number) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, status: 'complete' } : task
    ));
  };

  const getSuccessRateColor = (successRate: number) => {
    if (successRate >= 90) {
      return 'green';
    } else if (successRate >= 70) {
      return 'yellowgreen';
    } else {
      return 'red';
    }
  };

  const getPathCompletionStatus = () => {
    const completedTasks = tasks.filter(task => task.status === 'complete');
    return completedTasks.length === tasks.length ? 'completed' : 'incomplete';
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Path View / 路径展示</h1>
      <p>这里展示 TapNow 风格路径（点击任务节点，标记完成）</p>

      <div>
        {tasks.map(task => (
          <div
            key={task.id}
            style={{
              padding: '10px',
              margin: '10px 0',
              backgroundColor: task.status === 'complete' ? 'green' : 'lightgray',
              cursor: 'pointer',
              borderRadius: '8px'
            }}
            onClick={() => handleTaskClick(task.id)}
          >
            <h3>{task.name}</h3>
            <p>失败次数: {task.failedCount}</p>
            <p>
              成功率: <span style={{ color: getSuccessRateColor(task.successRate) }}>
                {task.successRate}% 完成
              </span>
            </p>
            {task.status === 'complete' && <p>任务已完成</p>}
          </div>
        ))}
      </div>

      <button onClick={() => {
        window.location.hash = '#/workbench';
      }}>
        开始执行任务
      </button>

      <br /><br />

      <button onClick={() => {
        window.location.hash = '#/';
      }}>
        返回主页
      </button>

      <br /><br />

      {getPathCompletionStatus() === 'completed' && (
        <div>
          <h2>恭喜你！完成了这条路径！</h2>
          <p>你已经获得了勋章！</p>
        </div>
      )}
    </div>
  );
}
