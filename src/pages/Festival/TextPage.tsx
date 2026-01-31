import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { getFeatureById, Feature, TextFieldConfig } from '../../configs/festival/features';
import { fillPrompt } from '../../configs/festival/prompts';
import '../../styles/festival.css';

/**
 * 📝 文案工坊页面 (TextPage)
 *
 * 万金油文案生成页面，根据 Feature 配置动态渲染表单
 * 支持：拜年文案、春联、运势、年夜饭菜单等
 */

const FestivalTextPage: React.FC = () => {
  const { featureId } = useParams<{ featureId: string }>();
  const navigate = useNavigate();

  // 获取功能配置
  const feature = getFeatureById(featureId || '');

  // 表单状态
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState<string>('');
  const [showResult, setShowResult] = useState(false);

  if (!feature || feature.process.type !== 'text') {
    return (
      <div className="festival-layout">
        <div className="festival-text-page">
          <div className="text-error">
            <h2>功能未找到</h2>
            <button onClick={() => navigate(-1)}>返回首页</button>
          </div>
        </div>
      </div>
    );
  }

  const textFields = feature.input.textFields || [];

  // 处理表单变化
  const handleFieldChange = (key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  // 生成文案
  const handleGenerate = async () => {
    // 验证必填字段
    for (const field of textFields) {
      if (field.required && !formValues[field.key]?.trim()) {
        message.warning(`请填写${field.label}`);
        return;
      }
    }

    setIsGenerating(true);
    setGeneratedText('');

    try {
      const processConfig = feature.process as { type: 'text'; model: string; promptKey: string; maxTokens?: number; temperature?: number };

      // 填充提示词
      const prompt = fillPrompt(processConfig.promptKey, formValues);

      if (!prompt) {
        throw new Error('提示词模板未找到');
      }

      // 调用 DeepSeek API
      const deepseekKey = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
      if (!deepseekKey) {
        throw new Error('缺少 VITE_DEEPSEEK_API_KEY 配置');
      }

      const response = await fetch('/api/deepseek/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${deepseekKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: processConfig.model || 'deepseek-chat',
          messages: [
            { role: 'user', content: prompt }
          ],
          max_tokens: processConfig.maxTokens || 200,
          temperature: processConfig.temperature || 0.8
        })
      });

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';

      if (!text) {
        throw new Error('生成结果为空');
      }

      setGeneratedText(text.trim());
      setShowResult(true);
      message.success('生成成功！');

    } catch (error: any) {
      console.error('[TextPage] 生成失败:', error);
      message.error(`生成失败: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 复制文案
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败');
    }
  };

  // 重新生成
  const handleRegenerate = () => {
    setShowResult(false);
    setGeneratedText('');
  };

  // 转语音
  const handleToVoice = () => {
    // 保存文案到 sessionStorage，跳转到语音页
    sessionStorage.setItem('text_to_voice', generatedText);
    navigate('/festival/voice');
  };

  // 返回
  const handleBack = () => {
    if (showResult) {
      setShowResult(false);
    } else {
      navigate(-1);
    }
  };

  // 渲染表单字段
  const renderField = (field: TextFieldConfig) => {
    const value = formValues[field.key] || '';

    switch (field.type) {
      case 'select':
        return (
          <div key={field.key} className="text-field">
            <label className="text-field-label">
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <div className="text-field-options">
              {field.options?.map(option => (
                <button
                  key={option}
                  className={`text-option-btn ${value === option ? 'active' : ''}`}
                  onClick={() => handleFieldChange(field.key, option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      case 'textarea':
        return (
          <div key={field.key} className="text-field">
            <label className="text-field-label">
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <textarea
              className="text-field-textarea"
              value={value}
              onChange={e => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              maxLength={field.maxLength || 200}
            />
            {field.maxLength && (
              <div className="text-field-counter">
                {value.length}/{field.maxLength}
              </div>
            )}
          </div>
        );

      case 'input':
      default:
        return (
          <div key={field.key} className="text-field">
            <label className="text-field-label">
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <input
              className="text-field-input"
              type="text"
              value={value}
              onChange={e => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              maxLength={field.maxLength || 100}
            />
          </div>
        );
    }
  };

  return (
    <div className="festival-layout">
      <div className="festival-text-page">
        {/* 顶部导航 */}
        <div className="text-header">
          <button className="text-back-btn" onClick={handleBack}>←</button>
          <h1 className="text-title">{feature.icon} {feature.name}</h1>
          <div className="text-header-placeholder"></div>
        </div>

        {/* 主内容 */}
        <div className="text-content">
          {!showResult ? (
            // 输入表单
            <>
              <div className="text-subtitle">{feature.subtitle}</div>

              <div className="text-form">
                {textFields.map(field => renderField(field))}
              </div>

              <div className="text-action">
                <button
                  className="text-generate-btn"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? '✨ 生成中...' : '✨ 生成文案'}
                </button>
              </div>
            </>
          ) : (
            // 结果展示
            <div className="text-result">
              <div className="text-result-card">
                <div className="text-result-content">
                  {generatedText}
                </div>
              </div>

              <div className="text-result-actions">
                <button className="text-action-btn primary" onClick={handleCopy}>
                  📋 复制文案
                </button>

                {feature.output.canAddAudio && (
                  <button className="text-action-btn secondary" onClick={handleToVoice}>
                    🎤 转为语音
                  </button>
                )}

                <button className="text-action-btn ghost" onClick={handleRegenerate}>
                  🔄 换一个
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FestivalTextPage;
