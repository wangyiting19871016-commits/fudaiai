/**
 * P4 (Mission Foundry) 任务生成协议规范
 * 确保生成的任务具备"可验证性"，让 P3 不再盲目猜测
 */

// 1. 强制 JSON 结构定义
export interface AtomicTask {
  id: string;
  title: string;
  description: string;
  
  // 强制验证类型定义
  verifyType: 'SCREEN' | 'TEXT' | 'NONE';
  
  // 验证参数 - 根据 verifyType 动态定义
  verifyParam: {
    // SCREEN 模式：预设目标元素描述或颜色
    target?: string;
    color_hint?: string;
    element_desc?: string;
    
    // TEXT 模式：关键词或正则表达式
    keywords?: string[];
    regex_pattern?: string;
    
    // NONE 模式：无验证参数
  };
  
  // 任务内容
  content: string;
  
  // 静态触发补丁标记
  hasStaticTrigger?: boolean;
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
}

// 2. 静态触发补丁注入规则
export const STATIC_TRIGGER_PATCH = {
  // 代码头部注入
  codeHeader: `let isPaused = true;
// 静态触发补丁 - 确保代码不会自动运行
console.log('🔒 代码已锁定，等待手动触发');`,
  
  // 启动逻辑包裹
  wrapStartLogic: (code: string) => {
    return `if (!isPaused) {
  ${code}
} else {
  console.log('⏸️ 代码已暂停，调用 window.startSim() 启动');
}`;
  },
  
  // 全局启动接口
  globalInterface: `
// 全局启动接口 - P3 验证通过后调用
window.startSim = () => {
  isPaused = false;
  console.log('🚀 代码已解锁，开始执行');
  // 在此处添加实际的启动逻辑
};
`
};

// 3. P3 验证对齐规则
export const P3_VERIFICATION_RULES = {
  // 截屏粉色蛇任务 - 固定验证参数
  PINK_SNAKE_TASK: {
    verifyType: 'SCREEN' as const,
    verifyParam: {
      target: 'pink_snake',
      color_hint: '#FFC0CB',
      element_desc: '粉色贪吃蛇游戏界面'
    }
  },
  
  // 文本验证任务 - 关键词匹配
  TEXT_VALIDATION_TASK: {
    verifyType: 'TEXT' as const,
    verifyParam: {
      keywords: ['完成', '成功', '正确'],
      regex_pattern: '.*(完成|成功|正确).*'
    }
  },
  
  // 无验证任务
  NO_VALIDATION_TASK: {
    verifyType: 'NONE' as const,
    verifyParam: {}
  }
};

// 4. 任务生成器函数
export const createAtomicTask = (config: {
  title: string;
  description: string;
  content: string;
  verifyType: 'SCREEN' | 'TEXT' | 'NONE';
  verifyParam?: any;
  hasCode?: boolean;
}): AtomicTask => {
  
  // 处理代码内容 - 注入静态触发补丁
  let processedContent = config.content;
  if (config.hasCode) {
    processedContent = STATIC_TRIGGER_PATCH.codeHeader + '\n\n' + processedContent;
    processedContent = processedContent.replace(/function\s+start\([^)]*\)\s*\{/g, 
      'function start() {\n  ' + STATIC_TRIGGER_PATCH.wrapStartLogic('').replace('  ${code}', '')
    );
    processedContent += STATIC_TRIGGER_PATCH.globalInterface;
  }
  
  // 根据验证类型设置默认参数
  const defaultVerifyParam = config.verifyParam || 
    (config.verifyType === 'SCREEN' ? P3_VERIFICATION_RULES.PINK_SNAKE_TASK.verifyParam :
     config.verifyType === 'TEXT' ? P3_VERIFICATION_RULES.TEXT_VALIDATION_TASK.verifyParam :
     P3_VERIFICATION_RULES.NO_VALIDATION_TASK.verifyParam);
  
  const now = new Date().toISOString();
  
  return {
    id: `task_${Date.now()}`,
    title: config.title,
    description: config.description,
    verifyType: config.verifyType,
    verifyParam: defaultVerifyParam,
    content: processedContent,
    hasStaticTrigger: config.hasCode || false,
    createdAt: now,
    updatedAt: now
  };
};

// 5. 示例任务生成
export const EXAMPLE_TASKS = {
  // 贪吃蛇游戏任务 - 截屏验证
  SNAKE_GAME: createAtomicTask({
    title: '粉色贪吃蛇游戏开发',
    description: '创建一个粉色贪吃蛇游戏，包含基本的移动和碰撞检测',
    content: `// 贪吃蛇游戏代码
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 蛇的初始位置和颜色
let snake = [{x: 10, y: 10}];
let food = {x: 5, y: 5};
let direction = 'right';

function drawSnake() {
  ctx.fillStyle = '#FFC0CB'; // 粉色
  snake.forEach(segment => {
    ctx.fillRect(segment.x * 20, segment.y * 20, 20, 20);
  });
}

function drawFood() {
  ctx.fillStyle = '#FF6B6B'; // 红色食物
  ctx.fillRect(food.x * 20, food.y * 20, 20, 20);
}

function gameLoop() {
  // 游戏主循环
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawSnake();
  drawFood();
  
  // 移动蛇
  let head = {...snake[0]};
  switch(direction) {
    case 'up': head.y--; break;
    case 'down': head.y++; break;
    case 'left': head.x--; break;
    case 'right': head.x++; break;
  }
  
  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    // 吃到食物，生成新食物
    food = {
      x: Math.floor(Math.random() * 20),
      y: Math.floor(Math.random() * 20)
    };
  } else {
    snake.pop();
  }
}

// 键盘控制
document.addEventListener('keydown', (e) => {
  switch(e.key) {
    case 'ArrowUp': direction = 'up'; break;
    case 'ArrowDown': direction = 'down'; break;
    case 'ArrowLeft': direction = 'left'; break;
    case 'ArrowRight': direction = 'right'; break;
  }
});

// 游戏循环
setInterval(gameLoop, 100);`,
    verifyType: 'SCREEN',
    hasCode: true
  }),
  
  // 文本验证任务
  TEXT_TASK: createAtomicTask({
    title: '编程概念理解',
    description: '回答关于编程基础概念的问题',
    content: '请解释什么是变量和函数，并举例说明。',
    verifyType: 'TEXT',
    verifyParam: {
      keywords: ['变量', '函数', '声明', '调用'],
      regex_pattern: '.*(变量|函数).*'
    }
  }),
  
  // 无验证任务
  SIMPLE_TASK: createAtomicTask({
    title: '阅读文档',
    description: '阅读相关技术文档',
    content: '请阅读提供的技术文档，了解基本概念。',
    verifyType: 'NONE'
  })
};

// 6. 验证函数 - 确保任务符合协议
export const validateTaskProtocol = (task: AtomicTask): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // 检查必需字段
  if (!task.verifyType) errors.push('verifyType 是必需字段');
  if (!task.verifyParam) errors.push('verifyParam 是必需字段');
  
  // 检查验证类型与参数的匹配
  if (task.verifyType === 'SCREEN' && !task.verifyParam.target) {
    errors.push('SCREEN 模式必须包含 target 参数');
  }
  
  if (task.verifyType === 'TEXT' && !task.verifyParam.keywords && !task.verifyParam.regex_pattern) {
    errors.push('TEXT 模式必须包含 keywords 或 regex_pattern 参数');
  }
  
  if (task.verifyType === 'NONE' && Object.keys(task.verifyParam).length > 0) {
    errors.push('NONE 模式不应包含验证参数');
  }
  
  // 检查静态触发补丁
  if (task.hasStaticTrigger && !task.content.includes('isPaused')) {
    errors.push('包含代码的任务必须注入静态触发补丁');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// 默认导出
export default {
  createAtomicTask,
  validateTaskProtocol,
  EXAMPLE_TASKS,
  STATIC_TRIGGER_PATCH,
  P3_VERIFICATION_RULES
};