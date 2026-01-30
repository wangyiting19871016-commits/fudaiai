/**
 * 🎉 春节 Festival 配置统一导出
 *
 * 使用方式：
 * import { CATEGORIES, FEATURES, VOICE_CATEGORIES, ... } from '../configs/festival';
 */

// 功能分类
export {
  CATEGORIES,
  getCategoryById,
  getSortedCategories,
  type Category
} from './categories';

// 功能定义
export {
  FEATURES,
  getFeatureById,
  getFeaturesByCategory,
  getEnabledFeatures,
  isLegacyFeature,
  type Feature,
  type TextFieldConfig,
  type ImageProcess,
  type TextProcess,
  type AudioProcess
} from './features';

// 提示词
export {
  PROMPTS,
  fillPrompt,
  getPromptKeys
} from './prompts';

// 语音音色
export {
  VOICE_CATEGORIES,
  VOICE_PRESETS,
  TEXT_TEMPLATES,
  getAllVoices,
  getDefaultVoice,
  getVoiceById,
  getNonEmptyCategories,
  getHotVoices,
  getDefaultText,
  type VoicePreset,
  type VoiceCategory,
  type TextTemplate
} from './voicePresets';

// 图片模板
export {
  IMAGE_TEMPLATES,
  getTemplatesByFeature,
  getDefaultTemplate,
  getTemplateById,
  hasMultipleTemplates,
  type ImageTemplate
} from './templates';

// 素材触发器（财神模板等）
export {
  FESTIVAL_ASSET_TRIGGERS,
  type FestivalAssetTrigger,
  type FestivalTemplateAsset,
  type FestivalGender
} from './assetTriggers';

// 视频模板
export {
  VIDEO_TEMPLATES,
  getVideoTemplateById,
  getDefaultVideoTemplate,
  getAllVideoTemplates,
  type VideoTemplate,
  type BackgroundAnimation,
  type ImageAnimation,
  type TextAnimation
} from './videoTemplates';
