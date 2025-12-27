import React from 'react';
import { AtomTask } from '../../types/index';

interface EvolutionTreeProps {
  tasks: AtomTask[];
  currentTaskId?: string;
}

interface TreeNode {
  task: AtomTask;
  level: number;
  index: number;
  children: TreeNode[];
}

const EvolutionTree: React.FC<EvolutionTreeProps> = ({ tasks, currentTaskId }) => {
  // 构建进化树结构
  const buildTree = (tasks: AtomTask[]): TreeNode[] => {
    const taskMap = new Map<string, AtomTask>();
    const childrenMap = new Map<string, AtomTask[]>();
    
    // 创建任务映射和子任务映射
    tasks.forEach(task => {
      taskMap.set(task.id, task);
      if (task.pre_id) {
        if (!childrenMap.has(task.pre_id)) {
          childrenMap.set(task.pre_id, []);
        }
        childrenMap.get(task.pre_id)!.push(task);
      }
    });
    
    // 找到根节点（没有前置任务的任务）
    const rootTasks = tasks.filter(task => !task.pre_id);
    
    // 递归构建树结构
    const buildNode = (task: AtomTask, level: number = 0): TreeNode => {
      const children = (childrenMap.get(task.id) || []).map(child => 
        buildNode(child, level + 1)
      );
      
      return {
        task,
        level,
        index: 0,
        children
      };
    };
    
    return rootTasks.map((rootTask, index) => ({
      ...buildNode(rootTask),
      index
    }));
  };
  
  // 获取任务节点在当前任务路径中的深度
  const getTaskDepth = (taskId: string, nodes: TreeNode[], depth: number = 0): number => {
    for (const node of nodes) {
      if (node.task.id === taskId) {
        return depth;
      }
      const childDepth = getTaskDepth(taskId, node.children, depth + 1);
      if (childDepth !== -1) {
        return childDepth;
      }
    }
    return -1;
  };
  
  // 渲染树节点
  const renderTreeNode = (node: TreeNode, isLast: boolean = false): React.ReactNode => {
    const isActive = node.task.id === currentTaskId;
    const isInPath = currentTaskId && (node.task.id === currentTaskId || 
      tasks.some(t => t.pre_id === node.task.id));
    
    return (
      <div key={node.task.id} className={`tree-node level-${node.level}`}>
        <div className={`tree-node-content ${isActive ? 'active' : ''} ${isInPath ? 'in-path' : ''}`}>
          <div className="task-badge">
            <div className="task-id">{node.task.id.split('-')[1]}</div>
            <div className="task-category">{node.task.category}</div>
          </div>
          <div className="task-info">
            <div className="task-title">{node.task.content}</div>
            <div className="task-meta">
              <span className="difficulty">难度: {node.task.difficulty}</span>
              <span className="status">{node.task.status}</span>
            </div>
          </div>
        </div>
        
        {node.children.length > 0 && (
          <div className="tree-children">
            {node.children.map((child, index) => (
              <div key={child.task.id} className="tree-branch">
                {renderTreeNode(child, index === node.children.length - 1)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  const treeNodes = buildTree(tasks);
  
  return (
    <div className="evolution-tree-container">
      <div className="tree-structure">
        {treeNodes.map(node => (
          <div key={node.task.id} className="tree-root">
            {renderTreeNode(node)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EvolutionTree;