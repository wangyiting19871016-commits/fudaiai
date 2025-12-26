import { AtomTask } from '../types/index';

// 原子任务的模拟数据
export const mockAtomicTasks: AtomTask[] = [
  {
    id: 'task-001',
    title: 'HTML基础结构创建',
    pre_id: undefined,
    prompt: '创建一个简单的HTML页面，包含基本结构。使用<!DOCTYPE html>、<html>、<head>、<body>等基本标签。',
    content: 'HTML基础结构创建',
    status: 'inactive',
    difficulty: 1,
    category: 'Web基础',
    estimatedTime: 10,
    rewards: 10,
    failureRate: 0.15
  },
  {
    id: 'task-002',
    title: 'CSS基础样式应用',
    pre_id: 'task-001',
    prompt: '为HTML页面添加CSS样式。使用内联样式或<style>标签，设置页面背景色、文字颜色、字体大小等基本样式。',
    content: 'CSS基础样式应用',
    status: 'inactive',
    difficulty: 1,
    category: 'Web基础',
    estimatedTime: 15,
    rewards: 15,
    failureRate: 0.2
  },
  {
    id: 'task-003',
    title: '响应式导航栏设计',
    pre_id: 'task-002',
    prompt: '创建一个响应式导航栏。使用HTML <nav> 元素和CSS，创建水平导航菜单，并确保在不同屏幕尺寸下正确显示。',
    content: '响应式导航栏设计',
    status: 'inactive',
    difficulty: 2,
    category: 'UI设计',
    estimatedTime: 25,
    rewards: 25,
    failureRate: 0.25
  },
  {
    id: 'task-004',
    title: 'JavaScript交互功能开发',
    pre_id: 'task-003',
    prompt: '添加JavaScript交互功能。为导航栏添加点击事件，实现页面平滑滚动或内容切换效果。使用document.querySelector等DOM操作方法。',
    content: 'JavaScript交互功能开发',
    status: 'inactive',
    difficulty: 2,
    category: '前端交互',
    estimatedTime: 30,
    rewards: 30,
    failureRate: 0.3
  },
  {
    id: 'task-005',
    title: '性能优化实施',
    pre_id: 'task-004',
    prompt: '优化页面性能。使用CSS优化技术（如CSS3的transform、opacity）和JavaScript性能优化技术（如防抖、节流）。确保页面流畅运行。',
    content: '性能优化实施',
    status: 'inactive',
    difficulty: 3,
    category: '性能优化',
    estimatedTime: 35,
    rewards: 40,
    failureRate: 0.35
  },
  {
    id: 'task-006',
    title: '代码模块化重构',
    pre_id: 'task-005',
    prompt: '实现模块化代码结构。将HTML、CSS、JavaScript代码分离到不同文件中，并使用模块化的方式组织代码（如IIFE或ES6模块）。',
    content: '代码模块化重构',
    status: 'inactive',
    difficulty: 3,
    category: '代码架构',
    estimatedTime: 40,
    rewards: 45,
    failureRate: 0.4
  }
];

// 计算任务序列的函数
export const buildTaskSequence = (tasks: AtomTask[]): { [taskId: string]: AtomTask[] } => {
  const sequenceMap: { [taskId: string]: AtomTask[] } = {};
  
  tasks.forEach(task => {
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
    const predecessors = buildPredecessors(task);
    const successors = buildSuccessors(task).slice(1); // 排除当前任务（已包含在predecessors中）
    
    sequenceMap[task.id] = [...predecessors, ...successors];
  });
  
  return sequenceMap;
};