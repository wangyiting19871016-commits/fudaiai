// 协议定义接口
export interface ProtocolDefinition {
  // 协议分类
  category: 'VISUAL' | 'TEMPORAL' | 'AUDIO' | 'LOGIC';
  // 默认值
  default: number;
  // 最小值
  min: number;
  // 最大值
  max: number;
  // 步长
  step: number;
  // 后端指令映射
  backendCommand: string;
  // 描述
  description: string;
  // 图片行为描述
  imageBehavior: string;
  // 视频行为描述
  videoBehavior: string;
}

// 标准映射库 (SML) 协议字典
export const P4_PROTOCOL_DICTIONARY: Record<string, ProtocolDefinition> = {
  // 视觉协议
  'fx:brightness': {
    category: 'VISUAL',
    default: 1.0,
    min: 0.0,
    max: 2.0,
    step: 0.1,
    backendCommand: 'VISUAL_BRIGHTNESS',
    description: '亮度调节',
    imageBehavior: 'Direct CSS filter application',
    videoBehavior: 'Direct CSS filter application'
  },
  'fx:contrast': {
    category: 'VISUAL',
    default: 1.0,
    min: 0.0,
    max: 2.0,
    step: 0.1,
    backendCommand: 'VISUAL_CONTRAST',
    description: '对比度调节',
    imageBehavior: 'Direct CSS filter application',
    videoBehavior: 'Direct CSS filter application'
  },
  'fx:hue': {
    category: 'VISUAL',
    default: 0.0,
    min: 0.0,
    max: 360.0,
    step: 1.0,
    backendCommand: 'VISUAL_HUE',
    description: '色相调节',
    imageBehavior: 'Direct CSS filter application',
    videoBehavior: 'Direct CSS filter application'
  },
  'fx:saturation': {
    category: 'VISUAL',
    default: 1.0,
    min: 0.0,
    max: 2.0,
    step: 0.1,
    backendCommand: 'VISUAL_SATURATION',
    description: '饱和度调节',
    imageBehavior: 'Direct CSS filter application',
    videoBehavior: 'Direct CSS filter application'
  },
  
  // 时间协议
  'time:speed': {
    category: 'TEMPORAL',
    default: 1.0,
    min: 0.1,
    max: 5.0,
    step: 0.1,
    backendCommand: 'TEMPORAL_SPEED',
    description: '播放速度调节',
    imageBehavior: 'animate:zoom_rate - Ken Burns effect when > 1.0',
    videoBehavior: 'Adjust playback speed'
  },
  'time:duration': {
    category: 'TEMPORAL',
    default: 10.0,
    min: 1.0,
    max: 60.0,
    step: 0.5,
    backendCommand: 'TEMPORAL_DURATION',
    description: '持续时间调节',
    imageBehavior: 'No direct effect on images',
    videoBehavior: 'Adjust clip duration'
  },
  'time:fps': {
    category: 'TEMPORAL',
    default: 30.0,
    min: 15.0,
    max: 60.0,
    step: 5.0,
    backendCommand: 'TEMPORAL_FPS',
    description: '帧率调节',
    imageBehavior: 'No direct effect on images',
    videoBehavior: 'Adjust playback frame rate'
  },
  
  // 音频协议
  'snd:volume': {
    category: 'AUDIO',
    default: 0.8,
    min: 0.0,
    max: 1.0,
    step: 0.05,
    backendCommand: 'AUDIO_VOLUME',
    description: '音量调节',
    imageBehavior: 'No effect on images',
    videoBehavior: 'Adjust audio volume'
  },
  'snd:pitch': {
    category: 'AUDIO',
    default: 1.0,
    min: 0.5,
    max: 2.0,
    step: 0.1,
    backendCommand: 'AUDIO_PITCH',
    description: '音调调节',
    imageBehavior: 'No effect on images',
    videoBehavior: 'Adjust audio pitch'
  },
  
  // 逻辑协议
  'meta:intensity': {
    category: 'LOGIC',
    default: 1.0,
    min: 0.0,
    max: 1.0,
    step: 0.05,
    backendCommand: 'LOGIC_INTENSITY',
    description: '通用强度调节 - Global_Multiplier',
    imageBehavior: 'Multiplies all fx: protocol values',
    videoBehavior: 'Multiplies all fx: protocol values'
  },
  'meta:threshold': {
    category: 'LOGIC',
    default: 0.5,
    min: 0.0,
    max: 1.0,
    step: 0.05,
    backendCommand: 'LOGIC_THRESHOLD',
    description: '判定阈值调节',
    imageBehavior: 'No direct visual effect',
    videoBehavior: 'No direct visual effect'
  }
};

// 协议查询函数
export const getProtocolDefinition = (target: string): ProtocolDefinition => {
  // 物理查询协议定义，如果不存在则返回默认值
  return P4_PROTOCOL_DICTIONARY[target] || {
    category: 'LOGIC',
    default: 0.5,
    min: 0.0,
    max: 1.0,
    step: 0.05,
    backendCommand: 'UNKNOWN',
    description: '未知协议',
    imageBehavior: 'No effect',
    videoBehavior: 'No effect'
  };
};
