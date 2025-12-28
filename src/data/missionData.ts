export interface AtomicStep {
  id: string;
  title: string;
  description: string;
  content: string;
  type: 'VOICE_MATCH' | 'VOICE_KEYWORD' | 'VOICE_VAR' | 'SHADOW_PRACTICE' | 'NOISE_CHALLENGE' | 'INTEGRATED_DICTATION' | 'BLIND_PROMPT' | 'EXCEPTION_HANDLE' | 'FULL_SIMULATION' | 'AI_FINAL' | 'TEXT';
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

// 日志锚点 [LOGIC_TRACE]
console.log("[LOGIC_TRACE] 数据清洗完成，Step 1 验证词为: Latte");

export const missionData: Mission[] = [
  {
    id: 'coffee_master_001',
    title: '咖啡厅声韵刻录实战',
    phases: [
      {
        name: '第一阶段：声韵刻录',
        steps: [
          { id: 'step_1', title: '核心名词', description: '请录制 3 遍关键词: "Latte"', content: 'Latte', type: 'VOICE_MATCH' },
          { id: 'step_2', title: '关键动词', description: '请录制 3 遍关键词: "Can I get a"', content: 'Can I get a', type: 'VOICE_KEYWORD' },
          { id: 'step_3', title: '变量词 (物料)', description: '请录制 3 遍关键词: "Oat milk"', content: 'Oat milk', type: 'VOICE_VAR' },
          { id: 'step_4', title: '变量词 (规格)', description: '请录制 3 遍关键词: "Large size"', content: 'Large size', type: 'VOICE_VAR' },
          { id: 'step_5', title: '礼貌闭团', description: '请录制 3 遍关键词: "That\'s all, thanks."', content: 'That\'s all, thanks.', type: 'VOICE_KEYWORD' }
        ]
      },
      {
        name: '第二阶段：解码监听',
        steps: [
          { id: 'step_6', title: '影子练习 1', description: '复述："For here or to go?"', content: 'For here or to go?', type: 'SHADOW_PRACTICE' },
          { id: 'step_7', title: '影子练习 2', description: '复述："Any room for cream?"', content: 'Any room for cream?', type: 'SHADOW_PRACTICE' },
          { id: 'step_8', title: '影子练习 3', description: '复述："Name for the order?"', content: 'Name for the order?', type: 'SHADOW_PRACTICE' },
          { id: 'step_9', title: '噪音挑战', description: '在嘈杂音中听懂并复述关键信息', content: 'NoiseChallenge', type: 'NOISE_CHALLENGE' },
          { id: 'step_10', title: '整合听写', description: '听完整点单指令并录制', content: 'IntegratedDictation', type: 'INTEGRATED_DICTATION' }
        ]
      },
      {
        name: '第三阶段：模拟合练',
        steps: [
          { id: 'step_11', title: '无脚本挑战', description: '根据店员提问接话', content: 'BlindPrompt', type: 'BLIND_PROMPT' },
          { id: 'step_12', title: '盲操演练', description: '应对不同语速店员询问', content: 'BlindDrill', type: 'BLIND_PROMPT' },
          { id: 'step_13', title: '突发异常练', description: '“卖完了”变通回应', content: 'ExceptionHandle', type: 'EXCEPTION_HANDLE' },
          { id: 'step_14', title: '完整模拟录', description: '15秒连贯音频真迹录制', content: 'FullSimulation', type: 'FULL_SIMULATION' },
          { id: 'step_15', title: 'AI 副本终审', description: 'AI 随机即兴对谈', content: 'AIFinal', type: 'AI_FINAL' }
        ]
      }
    ]
  }
];