export interface AtomicStep {
  id: string;
  title: string;
  content: string;
  type: string;
}

export interface Phase {
  name: string;
  steps: AtomicStep[];
}

export interface Mission {
  id: string;
  title: string;
  phases: Phase[];
}

export const missionData: Mission[] = [
  {
    id: 'coffee_master_001',
    title: '咖啡厅声韵刻录实战',
    phases: [
      {
        name: '第一阶段：声韵刻录',
        steps: [
          { id: 'step_1', title: '核心名词', content: '录制 3 遍："Latte"', type: 'VOICE_MATCH' },
          { id: 'step_2', title: '关键动词', content: '录制 3 遍："Can I get a..."', type: 'VOICE_KEYWORD' },
          { id: 'step_3', title: '变量词 (物料)', content: '录制 3 遍："Oat milk"', type: 'VOICE_VAR' },
          { id: 'step_4', title: '变量词 (规格)', content: '录制 3 遍："Large size"', type: 'VOICE_VAR' },
          { id: 'step_5', title: '礼貌闭团', content: '录制 3 遍："That\'s all, thanks."', type: 'VOICE_KEYWORD' }
        ]
      },
      {
        name: '第二阶段：解码监听',
        steps: [
          { id: 'step_6', title: '影子练习 1', content: '复述："For here or to go?"', type: 'SHADOW_PRACTICE' },
          { id: 'step_7', title: '影子练习 2', content: '复述："Any room for cream?"', type: 'SHADOW_PRACTICE' },
          { id: 'step_8', title: '影子练习 3', content: '复述："Name for the order?"', type: 'SHADOW_PRACTICE' },
          { id: 'step_9', title: '噪音挑战', content: '嘈杂音中听懂复述', type: 'NOISE_CHALLENGE' },
          { id: 'step_10', title: '整合听写', content: '听完整点单指令并录制', type: 'INTEGRATED_DICTATION' }
        ]
      },
      {
        name: '第三阶段：模拟合练',
        steps: [
          { id: 'step_11', title: '无脚本挑战', content: '根据店员提问接话', type: 'BLIND_PROMPT' },
          { id: 'step_12', title: '盲操演练', content: '不同语速店员询问', type: 'BLIND_PROMPT' },
          { id: 'step_13', title: '突发异常练', content: '“卖完了”变通回应', type: 'EXCEPTION_HANDLE' },
          { id: 'step_14', title: '完整模拟录', content: '15秒连贯音频真迹', type: 'FULL_SIMULATION' },
          { id: 'step_15', title: 'AI 副本终审', content: 'AI 随机即兴对谈', type: 'AI_FINAL' }
        ]
      }
    ]
  }
];