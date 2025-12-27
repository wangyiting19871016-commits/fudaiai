import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TaskCard from '../Widgets/TaskCard';
import EvolutionTree from './EvolutionTree';
import FailureHeatmap from './FailureHeatmap';
import { AtomTask } from '../../types/index';

interface PathViewProps {
  tasks: AtomTask[];
}

const PathView: React.FC<PathViewProps> = ({ tasks }) => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  // 根据传入的taskId和pre_id关系构建任务路径
  const taskPath = useMemo(() => {
    if (!taskId) return { currentTask: null, sequence: [] };
    
    // 找到当前任务
    const currentTask = tasks.find(task => task.id === taskId);
    if (!currentTask) return { currentTask: null, sequence: [] };
    
    // 递归构建前序任务链
    const buildPredecessors = (task: AtomTask): AtomTask[] => {
      if (!task.pre_id) return [task];
      
      const predecessor = tasks.find(t => t.id === task.pre_id);
      if (!predecessor) return [task];
      
      return [...buildPredecessors(predecessor), task];
    };
    
    // 递归构建后续任务链
    const buildSuccessors = (task: AtomTask): AtomTask[] => {
      const successors = tasks.filter(t => t.pre_id === task.id);
      if (successors.length === 0) return [task];
      
      // 使用 reduce 替代 flatMap 方法
      const flattenedSuccessors = successors.reduce<AtomTask[]>((acc, successor) => {
        return [...acc, ...buildSuccessors(successor)];
      }, []);
      
      return [task, ...flattenedSuccessors];
    };
    
    // 构建完整路径
    const predecessors = buildPredecessors(currentTask);
    const successors = buildSuccessors(currentTask).slice(1); // 排除当前任务（已包含在predecessors中）
    
    return { currentTask, sequence: [...predecessors, ...successors] };
  }, [tasks, taskId]);

  const handleStartReplication = (taskId: string) => {
    navigate(`/lab/${taskId}`);
  };

  const handleBackToShelf = () => {
    navigate('/');
  };

  if (!taskPath.currentTask) {
    return (
      <div className="path-view-container">
        <div className="path-view-error">
          <p>任务不存在或加载中...</p>
          <button onClick={handleBackToShelf}>返回任务货架</button>
        </div>
      </div>
    );
  }

  return (
    <div className="path-view-container">
      <div className="path-view-header">
        <h2>路径看板 - {taskPath.currentTask.title}</h2>
        <button className="back-button" onClick={handleBackToShelf}>
          返回任务货架
        </button>
      </div>
      
      <div className="path-view-content">
        {/* 任务卡片容器 - 支持水平滚动 */}
        <div className="path-cards-container">
          {taskPath.sequence.map((task, index) => {
            const isCurrent = task.id === taskId;
            const isCompleted = index < taskPath.sequence.findIndex(t => t.id === taskId);
            
            return (
              <div 
                key={task.id} 
                className={`path-card ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}
              >
                <div className="path-card-header">
                  <h3 className="path-card-title">{task.title}</h3>
                  <span className="path-card-category">
                    {task.category === 'smart-contract' ? '智能合约' :
                     task.category === 'data-certification' ? '数据认证' : '系统集成'}
                  </span>
                </div>
                <p className="path-card-content">{task.content}</p>
                <button 
                  className="start-replicate-button"
                  onClick={() => handleStartReplication(task.id)}
                  disabled={!isCurrent && !isCompleted}
                >
                  {isCurrent ? '开始复刻' : isCompleted ? '已完成' : '等待前置'}
                </button>
              </div>
            );
          })}
        </div>
        
        {/* 可视化元素 */}
        <div className="path-visualization">
          <div className="evolution-tree">
            <h3>🧬 进化树（虚影）</h3>
            <div className="evolution-tree-visualization">
              <EvolutionTree tasks={tasks} currentTaskId={taskId} />
            </div>
          </div>
          
          <div className="failure-heatmap">
            <h3>🔥 失败热力图</h3>
            <div className="heatmap-container">
              <FailureHeatmap tasks={tasks} currentTaskId={taskId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PathView;