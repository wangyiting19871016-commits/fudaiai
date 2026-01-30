import { Mission, AtomicSlot, Benchmark } from './schema';

// 默认基准标杆配置
const DEFAULT_BENCHMARK: Benchmark = {
  id: 'default_bench',
  author: 'system',
  videoUrl: '',
  tips: '',
  aestheticParams: {
    exposure: 0, brightness: 1, contrast: 1, saturation: 1, warmth: 0, tint: 0,
    highlights: 0, shadows: 0, blackPoint: 0, brilliance: 0, vibrance: 0,
    sharpness: 0, definition: 0, noise: 0
  }
};

// 示例原子槽位数据
const coffeeExtractionSlots: AtomicSlot[] = [
  {
    id: 'slot-01',
    stepLabel: '01',
    title: '萃取液面控制',
    officialCriteria: '油脂必须完整覆盖液面，厚度不低于2mm',
    officialAnchor: '/assets/anchors/extraction-anchor.png',
    currentBenchmark: null // 初始灰模态
  },
  {
    id: 'slot-02',
    stepLabel: '02',
    title: '压力曲线控制',
    officialCriteria: '萃取压力需稳定在9bar±0.5bar',
    officialAnchor: '/assets/anchors/pressure-anchor.png',
    currentBenchmark: {
      ...DEFAULT_BENCHMARK,
      id: 'bench-pressure',
      author: '咖啡大师',
      videoUrl: 'https://example.com/benchmark/pressure.mp4',
      tips: '预热手柄后再开始萃取'
    }
  }
];

// 示例悬赏任务数据
export const missions: Mission[] = [
  {
    id: 'mission-001',
    title: '咖啡拉花·基础心形',
    description: '学习基础心形拉花技巧，掌握奶泡融合和拉花手法',
    difficulty: 'Easy',
    slots: [
      {
        id: 'latte-art-01',
        stepLabel: '01',
        title: '奶泡融合',
        officialCriteria: '奶泡需细腻绵密，融合时液面无明显波动',
        officialAnchor: '/assets/anchors/milk-foam-anchor.png',
        currentBenchmark: null
      },
      {
        id: 'latte-art-02',
        stepLabel: '02',
        title: '心形拉花',
        officialCriteria: '心形需对称，顶部圆润，底部收尖',
        officialAnchor: '/assets/anchors/heart-anchor.png',
        currentBenchmark: {
          ...DEFAULT_BENCHMARK,
          id: 'bench-heart-latte',
          author: '拉花大师',
          videoUrl: 'https://example.com/benchmark/heart-latte.mp4',
          tips: '控制好拉花高度和速度'
        }
      }
    ]
  },
  {
    id: 'mission-002',
    title: '意式浓缩萃取',
    description: '掌握意式浓缩萃取的核心参数和技巧',
    difficulty: 'Hard',
    slots: coffeeExtractionSlots
  }
];