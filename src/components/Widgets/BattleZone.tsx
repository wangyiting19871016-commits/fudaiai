import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TaskCard from './TaskCard';
import { AtomTask } from '../../types/index';

interface BattleZoneProps {
  onVerify?: (taskId: string, content: string) => void;
}

const BattleZone: React.FC<BattleZoneProps> = ({ onVerify }) => {
  const navigate = useNavigate();
  
  // 模拟数据 - 战备区三张任务卡片
  const [tasks] = useState<AtomTask[]>([
    {
      id: 'task-1',
      title: '协议复刻验证',
      pre_id: undefined,
      prompt: `请分析以下智能合约代码，确保：
1. 符合 ERC-20 标准
2. 安全性检查通过
3. Gas 优化到位
4. 文档完整

合约功能：代币发行、转账、授权、查询

请提供详细的代码审查报告。`,
      content: '协议复刻验证',
      status: 'inactive',
      difficulty: 2,
      category: 'smart-contract',
      estimatedTime: 30,
      rewards: 40,
      failureRate: 0.2
    },
    {
      id: 'task-2',
      title: '开放存证验证',
      pre_id: 'task-1',
      prompt: `请验证以下数据存证方案：
1. 哈希算法正确性
2. 时间戳有效性
3. 数据完整性保证
4. 防篡改机制

要求输出存证验证报告，包括：
- 哈希值验证结果
- 时间戳可信度分析
- 数据完整性检查`,
      content: '开放存证验证',
      status: 'inactive',
      difficulty: 3,
      category: 'data-certification',
      estimatedTime: 40,
      rewards: 50,
      failureRate: 0.25
    },
    {
      id: 'task-3',
      title: '系统联动验证',
      pre_id: 'task-2',
      prompt: `请验证多系统联动场景：
1. API 接口响应正确
2. 数据流同步一致
3. 错误处理完善
4. 性能指标达标

测试场景：
- 批量数据处理
- 并发请求处理
- 异常情况恢复
- 监控告警触发`,
      content: '系统联动验证',
      status: 'inactive',
      difficulty: 4,
      category: 'system-integration',
      estimatedTime: 50,
      rewards: 60,
      failureRate: 0.3
    }
  ]);

  const handleVerify = (taskId: string, content: any) => {
    if (onVerify) {
      onVerify(taskId, content);
    }
    // 这里可以添加验证逻辑

  };

  // 处理跳转到实验室
  const handleStartReplication = (taskId: string) => {
    navigate(`/lab/${taskId}`);
  };

  return (
    <div 
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '400px',
        padding: '40px 20px',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '20px',
        overflow: 'visible'
      }}
    >
      {/* 战备区标题 */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '40px' 
      }}>
        <h2 style={{
          color: 'white',
          fontSize: '28px',
          fontWeight: 'bold',
          margin: 0,
          textShadow: '0 4px 8px rgba(0, 0, 0, 0.7)',
          background: 'linear-gradient(45deg, #ffffff, #a855f7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          战备区（第二屏）
        </h2>
        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '14px',
          margin: '8px 0 0 0'
        }}>
          验证核心功能的最终防线
        </p>
      </div>

      {/* 任务卡片容器 */}
      <div style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '60px',
        padding: '20px'
      }}>
        {tasks.map((task, index) => (
          <div key={task.id} style={{ position: 'relative' }}>
            <TaskCard
              task={task}
              onPathClick={(taskId) => handleVerify(task.id, `Path clicked for task ${taskId}`)}
              onVerify={(content) => handleVerify(task.id, content)}
              className={`battle-task-${index + 1}`}
            />
            
            {/* 连接线 - 仅在前两个卡片后显示 */}
            {index < tasks.length - 1 && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '100%',
                  width: '60px',
                  height: '2px',
                  background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.6), rgba(168, 85, 247, 0.8))',
                  transform: 'translateY(-50%)',
                  boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)',
                  animation: 'glowLine 2s ease-in-out infinite alternate'
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* 发光效果装饰 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
        borderRadius: '20px'
      }} />

      {/* CSS 动画定义 */}
      <style>{`
        @keyframes glowLine {
          0% {
            opacity: 0.6;
            box-shadow: 0 0 5px rgba(168, 85, 247, 0.3);
          }
          100% {
            opacity: 1;
            box-shadow: 0 0 15px rgba(168, 85, 247, 0.8);
          }
        }
        
        .battle-task-1:hover {
          transform: translateY(-5px);
        }
        .battle-task-2:hover {
          transform: translateY(-5px);
        }
        .battle-task-3:hover {
          transform: translateY(-5px);
        }
      `}</style>
    </div>
  );
};

export default BattleZone;