/**
 * 📏 文案长度规范
 *
 * 定义不同场景的文案长度限制
 * 提供验证函数和用户友好的提示
 */

export interface TextLengthRule {
  min: number;
  max: number;
  recommended: number;
  errorMessage: string;
  warningMessage: string;
  description: string;
}

export const TEXT_LENGTH_RULES: Record<string, TextLengthRule> = {
  // 数字人视频（最严格）
  digitalHuman: {
    min: 5,
    max: 50, // WAN API限制：音频15秒 ≈ 50字
    recommended: 30,
    errorMessage: '文案不能超过50字（WAN API限制15秒音频）',
    warningMessage: '建议30字以内，当前文案较长可能导致生成失败',
    description: '数字人视频要求简短有力的祝福语'
  },

  // TTS语音
  tts: {
    min: 5,
    max: 100,
    recommended: 50,
    errorMessage: '文案不能超过100字',
    warningMessage: '建议50字以内（约15秒语音），当前文案较长',
    description: 'TTS语音建议使用简短文案，朗读效果更好'
  },

  // 视频字幕
  videoCaption: {
    min: 5,
    max: 50,
    recommended: 30,
    errorMessage: '字幕不能超过50字',
    warningMessage: '建议30字以内，当前字幕过长可能显示不全',
    description: '视频字幕需要简短清晰'
  },

  // 新年祝福（通用）
  blessing: {
    min: 5,
    max: 50,
    recommended: 30,
    errorMessage: '祝福语不能超过50字',
    warningMessage: '建议30字以内，当前祝福语较长',
    description: '简短祝福更容易打动人心'
  },

  // 判词
  caption: {
    min: 5,
    max: 15,
    recommended: 10,
    errorMessage: '判词不能超过15字',
    warningMessage: '建议10字以内，保持简洁有力',
    description: '判词应短小精悍，朗朗上口'
  },

  // AI生成文案（TextPage）
  aiGenerated: {
    min: 50,
    max: 120,
    recommended: 80,
    errorMessage: '文案不能超过120字',
    warningMessage: '建议80字左右，当前文案可能过长',
    description: 'AI生成文案适合用于海报和分享'
  }
};

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  level: 'success' | 'warning' | 'error';
  message?: string;
}

/**
 * 验证文案长度
 */
export function validateTextLength(
  text: string,
  ruleKey: keyof typeof TEXT_LENGTH_RULES
): ValidationResult {
  const rule = TEXT_LENGTH_RULES[ruleKey];
  if (!rule) {
    return { valid: true, level: 'success' };
  }

  const length = text.trim().length;

  // 长度为0
  if (length === 0) {
    return {
      valid: false,
      level: 'error',
      message: '请输入文案'
    };
  }

  // 小于最小长度
  if (length < rule.min) {
    return {
      valid: false,
      level: 'error',
      message: `文案至少需要${rule.min}字，当前${length}字`
    };
  }

  // 超过最大长度
  if (length > rule.max) {
    return {
      valid: false,
      level: 'error',
      message: rule.errorMessage.replace('{{length}}', length.toString())
    };
  }

  // 超过推荐长度（警告）
  if (length > rule.recommended) {
    return {
      valid: true,
      level: 'warning',
      message: rule.warningMessage.replace('{{length}}', length.toString())
    };
  }

  // 完美长度
  return {
    valid: true,
    level: 'success',
    message: `${length}字，长度合适 ✅`
  };
}

/**
 * 获取长度提示文本
 */
export function getLengthHint(
  length: number,
  ruleKey: keyof typeof TEXT_LENGTH_RULES
): string {
  const rule = TEXT_LENGTH_RULES[ruleKey];
  if (!rule) return `${length}字`;

  if (length === 0) return '未输入';
  if (length < rule.min) return `${length}字（至少${rule.min}字）`;
  if (length > rule.max) return `${length}字（超出限制）⚠️`;
  if (length > rule.recommended) return `${length}字（建议${rule.recommended}字以内）⚠️`;

  return `${length}字 ✅`;
}

/**
 * 获取进度百分比（用于进度条）
 */
export function getLengthProgress(
  length: number,
  ruleKey: keyof typeof TEXT_LENGTH_RULES
): number {
  const rule = TEXT_LENGTH_RULES[ruleKey];
  if (!rule) return 0;

  const percentage = (length / rule.max) * 100;
  return Math.min(percentage, 100);
}

/**
 * 获取进度条颜色
 */
export function getProgressColor(
  length: number,
  ruleKey: keyof typeof TEXT_LENGTH_RULES
): string {
  const rule = TEXT_LENGTH_RULES[ruleKey];
  if (!rule) return '#52c41a';

  if (length === 0) return '#d9d9d9';
  if (length < rule.min) return '#faad14';
  if (length > rule.max) return '#ff4d4f';
  if (length > rule.recommended) return '#faad14';

  return '#52c41a';
}
