// src/components/TaskPath.tsx
import React from 'react';

// 定义任务的类型
interface TaskNode {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  status: 'pending' | 'in-progress' | 'completed';
}

interface TaskPathProps {
  nodes: TaskNode[];
  onNodeClick: (nodeId: string) => void;
}

const TaskPath: React.FC<TaskPathProps> = ({ nodes, onNodeClick }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {nodes.map((node, index) => (
        <div
          key={node.id}
          style={{
            marginBottom: '20px',
            padding: '10px',
            background: node.status === 'completed' ? 'green' : node.status === 'in-progress' ? 'yellow' : 'gray',
            borderRadius: '8px',
            cursor: 'pointer',
            textAlign: 'center',
            width: '200px',
          }}
          onClick={() => onNodeClick(node.id)}
        >
          <img src={node.imageUrl} alt={node.title} style={{ width: '100%' }} />
          <h4>{node.title}</h4>
          <p>{node.description}</p>
        </div>
      ))}
    </div>
  );
};

export default TaskPath;
