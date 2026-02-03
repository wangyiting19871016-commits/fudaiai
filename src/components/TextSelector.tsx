/**
 * 🎯 统一文本选择组件
 *
 * 提供场景切换、模板随机、手动输入、实时字数统计等功能
 * 用于VoicePageNew、DigitalHumanPage、VideoPage等页面
 */

import React, { useState, useEffect } from 'react';
import {
  SCENE_CATEGORIES,
  getRandomTemplate,
  getTemplatesByScene,
  type TextTemplate,
  type SceneCategory,
} from '../configs/textTemplates';
import {
  validateTextLength,
  getLengthHint,
  getLengthProgress,
  getProgressColor,
  TEXT_LENGTH_RULES,
  type ValidationResult,
} from '../configs/textLengthRules';
import './text-selector.css';

export interface TextSelectorProps {
  // 当前文本值
  value: string;
  onChange: (text: string, source: 'template' | 'user') => void;

  // 长度验证规则
  ruleKey: 'digitalHuman' | 'tts' | 'videoCaption' | 'caption' | 'blessing';

  // 默认场景
  defaultScene?: string;

  // 初始模式
  defaultMode?: 'template' | 'custom';

  // 标题
  title?: string;

  // 占位符
  placeholder?: string;

  // 是否显示场景切换
  showSceneSwitch?: boolean;

  // 是否显示模式切换
  showModeSwitch?: boolean;

  // 是否自动聚焦
  autoFocus?: boolean;

  // 禁用状态
  disabled?: boolean;

  // 自定义类名
  className?: string;
}

export const TextSelector: React.FC<TextSelectorProps> = ({
  value,
  onChange,
  ruleKey,
  defaultScene = 'general',
  defaultMode = 'template',
  title = '选择或输入文案',
  placeholder = '点击换一换随机生成，或手动输入文案',
  showSceneSwitch = true,
  showModeSwitch = true,
  autoFocus = false,
  disabled = false,
  className = '',
}) => {
  const [mode, setMode] = useState<'template' | 'custom'>(defaultMode);
  const [selectedScene, setSelectedScene] = useState<string>(defaultScene);
  const [validation, setValidation] = useState<ValidationResult>({
    valid: true,
    level: 'success',
  });

  // 初始化时如果是template模式且没有值，自动生成一个
  useEffect(() => {
    if (mode === 'template' && !value) {
      handleShuffle();
    }
  }, []);

  // 验证文本长度
  useEffect(() => {
    if (value) {
      const result = validateTextLength(value, ruleKey);
      setValidation(result);
    } else {
      setValidation({ valid: true, level: 'success' });
    }
  }, [value, ruleKey]);

  // 随机生成模板
  const handleShuffle = () => {
    const rule = TEXT_LENGTH_RULES[ruleKey];
    const maxLength = rule?.max || 100;

    const template = getRandomTemplate(selectedScene, maxLength, undefined);
    if (template) {
      onChange(template.text, 'template');
    }
  };

  // 切换场景
  const handleSceneChange = (sceneId: string) => {
    setSelectedScene(sceneId);

    // 如果是template模式，自动换一个该场景的模板
    if (mode === 'template') {
      const rule = TEXT_LENGTH_RULES[ruleKey];
      const maxLength = rule?.max || 100;
      const template = getRandomTemplate(sceneId, maxLength, undefined);
      if (template) {
        onChange(template.text, 'template');
      }
    }
  };

  // 切换模式
  const handleModeChange = (newMode: 'template' | 'custom') => {
    setMode(newMode);

    // 切换到template模式时，如果没有值就生成一个
    if (newMode === 'template' && !value) {
      handleShuffle();
    }
  };

  // 手动输入
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value, 'user');
  };

  // 获取验证提示样式
  const getValidationClass = () => {
    if (!value) return '';
    switch (validation.level) {
      case 'error':
        return 'text-selector-validation-error';
      case 'warning':
        return 'text-selector-validation-warning';
      case 'success':
        return 'text-selector-validation-success';
      default:
        return '';
    }
  };

  const lengthHint = value ? getLengthHint(value.length, ruleKey) : '0字';
  const lengthProgress = value ? getLengthProgress(value.length, ruleKey) : 0;
  const progressColor = value ? getProgressColor(value.length, ruleKey) : '#d9d9d9';

  return (
    <div className={`text-selector ${className}`}>
      {/* 标题 */}
      {title && <div className="text-selector-title">{title}</div>}

      {/* 模式切换 */}
      {showModeSwitch && (
        <div className="text-selector-mode-switch">
          <button
            className={`mode-btn ${mode === 'template' ? 'active' : ''}`}
            onClick={() => handleModeChange('template')}
            disabled={disabled}
          >
            使用模板
          </button>
          <button
            className={`mode-btn ${mode === 'custom' ? 'active' : ''}`}
            onClick={() => handleModeChange('custom')}
            disabled={disabled}
          >
            自定义
          </button>
        </div>
      )}

      {/* 场景切换（仅template模式显示） */}
      {showSceneSwitch && mode === 'template' && (
        <div className="text-selector-scenes">
          {SCENE_CATEGORIES.map((scene: SceneCategory) => (
            <button
              key={scene.id}
              className={`scene-btn ${selectedScene === scene.id ? 'active' : ''}`}
              onClick={() => handleSceneChange(scene.id)}
              disabled={disabled}
            >
              <span className="scene-icon">{scene.icon}</span>
              <span className="scene-name">{scene.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* 文本输入区 */}
      <div className={`text-selector-input-wrapper ${getValidationClass()}`}>
        <textarea
          className="text-selector-textarea"
          value={value}
          onChange={handleTextChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled || mode === 'template'}
          rows={3}
        />

        {/* 换一换按钮（仅template模式显示） */}
        {mode === 'template' && (
          <button
            className="shuffle-btn"
            onClick={handleShuffle}
            disabled={disabled}
            title="换一换"
          >
            换一换
          </button>
        )}
      </div>

      {/* 字数统计和进度条 */}
      <div className="text-selector-footer">
        <div className="length-info">
          <span className="length-hint">{lengthHint}</span>
          {validation.message && (
            <span className={`validation-message ${validation.level}`}>
              {validation.message}
            </span>
          )}
        </div>

        <div className="length-progress-bar">
          <div
            className="length-progress-fill"
            style={{
              width: `${lengthProgress}%`,
              backgroundColor: progressColor,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TextSelector;
