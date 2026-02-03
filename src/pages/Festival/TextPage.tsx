import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import { getFeatureById, Feature, TextFieldConfig } from '../../configs/festival/features';
import { fillPrompt } from '../../configs/festival/prompts';
import { parseCoupletText, drawCouplet, downloadCoupletImage } from '../../utils/coupletCanvas';
import { generatePoster } from '../../utils/posterCanvas';
import { CLASSIC_COUPLET_POSTER } from '../../configs/festival/posterTemplates';
import { MaterialService } from '../../services/MaterialService';
import { CoupletEditor } from '../../components/CoupletEditor';
import { FestivalButton, FestivalButtonGroup } from '../../components/FestivalButton';
import { BackButton } from '../../components/BackButton';
import { HomeButton } from '../../components/HomeButton';
import type { MaterialAtom, CoupletData } from '../../types/material';
import '../../styles/festival-design-system.css';
import '../../styles/festival.css';
import '../../styles/festival-page-glass.css';

/**
 * 📝 文案工坊页面 (TextPage)
 *
 * 万金油文案生成页面，根据 Feature 配置动态渲染表单
 * 支持：拜年文案、春联、运势、年夜饭菜单等
 */

const FestivalTextPage: React.FC = () => {
  const { featureId } = useParams<{ featureId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // 获取功能配置
  const feature = getFeatureById(featureId || '');

  // 表单状态
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [coupletImage, setCoupletImage] = useState<string>(''); // 春联图片

  // 🆕 图片上传和海报生成
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [coupletData, setCoupletData] = useState<CoupletData | null>(null);
  const [posterUrl, setPosterUrl] = useState<string>('');
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);

  if (!feature || feature.process.type !== 'text') {
    return (
      <div className="festival-layout">
        <div className="festival-text-page">
          <div className="text-error">
            <h2>功能未找到</h2>
            <HomeButton />
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

  // 🆕 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      message.error('请上传图片文件');
      return;
    }

    // 检查文件大小（最大10MB）
    if (file.size > 10 * 1024 * 1024) {
      message.error('图片大小不能超过10MB');
      return;
    }

    setUploadedImageFile(file);

    // 预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 🆕 生成海报
  const handleGeneratePoster = async () => {
    if (!coupletData || !uploadedImage) {
      message.error('请先上传图片并生成春联');
      return;
    }

    try {
      setIsGeneratingPoster(true);
      message.loading({ content: '正在生成海报...', key: 'poster', duration: 0 });

      // 使用经典春联模板
      const posterDataUrl = await generatePoster(CLASSIC_COUPLET_POSTER, {
        mainImageUrl: uploadedImage,
        couplet: coupletData,
        text: {
          title: '福袋AI·马年大吉',
        },
      });

      setPosterUrl(posterDataUrl);
      message.destroy('poster');
      message.success('海报生成成功！');

      // 保存海报为素材
      const posterMaterial: MaterialAtom = {
        id: `material_poster_${Date.now()}`,
        type: 'image',
        data: { url: posterDataUrl },
        metadata: {
          createdAt: Date.now(),
          featureId: 'M9',
          featureName: '春联海报',
          dimensions: { width: 750, height: 1334 },
        },
        connectors: {
          roles: ['posterImage', 'videoImage'],
          canCombineWith: ['audio', 'text'],
        },
      };

      MaterialService.saveMaterial(posterMaterial);
      console.log('[M9] 海报已保存到素材库');

    } catch (error) {
      message.destroy('poster');
      message.error('海报生成失败');
      console.error('[M9] 海报生成失败:', error);
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  // 🆕 春联重新生成
  const handleRegenerateCoupletField = async (field: 'upper' | 'lower' | 'horizontal') => {
    if (!coupletData) return;

    try {
      message.loading({ content: '正在重新生成...', key: 'regen', duration: 0 });

      // 根据字段生成新内容
      const prompt = field === 'horizontal'
        ? `请生成一个4个字的春节横批，要求喜庆吉祥，只返回4个字，不要其他内容。`
        : field === 'upper'
        ? `请生成一句春节上联，要求对仗工整，喜庆吉祥，只返回春联内容，不要其他内容。参考下联：${coupletData.lowerLine}`
        : `请生成一句春节下联，要求对仗工整，喜庆吉祥，只返回春联内容，不要其他内容。参考上联：${coupletData.upperLine}`;

      const deepseekKey = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
      const response = await fetch('/api/deepseek/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${deepseekKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 50,
          temperature: 0.9
        })
      });

      if (!response.ok) throw new Error('API请求失败');

      const data = await response.json();
      const newText = data.choices?.[0]?.message?.content?.trim() || '';

      if (!newText) throw new Error('生成结果为空');

      // 更新春联数据
      const updatedCouplet = { ...coupletData };
      if (field === 'upper') {
        updatedCouplet.upperLine = newText;
      } else if (field === 'lower') {
        updatedCouplet.lowerLine = newText;
      } else {
        updatedCouplet.horizontalScroll = newText.slice(0, 4); // 确保4个字
      }

      setCoupletData(updatedCouplet);

      // 重新生成春联图片
      const newCoupletImage = await drawCouplet(updatedCouplet);
      setCoupletImage(newCoupletImage);

      message.destroy('regen');
      message.success('重新生成成功！');

    } catch (error) {
      message.destroy('regen');
      message.error('重新生成失败');
      console.error('[M9] 重新生成失败:', error);
    }
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

      // 🏮 如果是春联功能，自动生成图片
      if (featureId === 'M9') {
        try {
          const parsedCouplet = parseCoupletText(text.trim());
          if (parsedCouplet) {
            setCoupletData(parsedCouplet); // 保存春联数据

            const imageUrl = await drawCouplet(parsedCouplet);
            setCoupletImage(imageUrl);

            // 保存春联为素材
            const coupletMaterial: MaterialAtom = {
              id: `material_couplet_${Date.now()}`,
              type: 'couplet',
              data: { couplet: parsedCouplet },
              metadata: {
                createdAt: Date.now(),
                featureId: 'M9',
                featureName: 'AI春联',
                textLength: parsedCouplet.upperLine.length + parsedCouplet.lowerLine.length,
              },
              connectors: {
                roles: ['posterText', 'coupletDecoration'],
                canCombineWith: ['image'],
                constraints: { requiredWith: ['image'] },
              },
            };

            MaterialService.saveMaterial(coupletMaterial);
            console.log('[M9] 春联已保存到素材库');
          }
        } catch (error) {
          console.error('[TextPage] 春联图片生成失败:', error);
        }
      }

      // ✍️ 如果是拜年文案功能，自动保存为素材（支持联动）
      if (featureId === 'text-blessing') {
        try {
          const blessingMaterial: MaterialAtom = {
            id: `material_blessing_${Date.now()}`,
            type: 'text',
            data: { text: text.trim() },
            metadata: {
              createdAt: Date.now(),
              featureId: 'text-blessing',
              featureName: '拜年文案',
              textLength: text.trim().length,
            },
            connectors: {
              roles: ['posterText'],
              canCombineWith: ['image', 'audio'], // 可以配图、配语音
            },
          };

          MaterialService.saveMaterial(blessingMaterial);
          console.log('[拜年文案] 已保存到素材库，可与图片/语音联动');
        } catch (error) {
          console.error('[TextPage] 拜年文案保存失败:', error);
        }
      }

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
    setCoupletImage('');
  };

  // 转语音
  const handleToVoice = () => {
    // 通过state传递文案，跳转到语音页
    navigate('/festival/voice', {
      state: {
        prefillText: generatedText,
        sourceFeature: featureId
      }
    });
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
          <BackButton onClick={handleBack} />
          <h1 className="text-title">{feature.icon} {feature.name}</h1>
          <HomeButton />
        </div>

        {/* 主内容 */}
        <div className="text-content">
          {!showResult ? (
            // 输入表单
            <>
              <div className="text-subtitle">{feature.subtitle}</div>

              <div className="text-form">
                {textFields.map(field => renderField(field))}

                {/* 🆕 M9春联：添加图片上传 */}
                {featureId === 'M9' && (
                  <div className="text-field">
                    <label className="text-field-label">
                      上传图片（可选）
                    </label>
                    <div className="text-field-desc" style={{ fontSize: '13px', color: 'var(--cny-gray-600)', marginBottom: '8px' }}>
                      上传照片后可以生成春联海报
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                      id="image-upload-input"
                    />
                    <label
                      htmlFor="image-upload-input"
                      style={{
                        display: 'inline-block',
                        padding: '12px 24px',
                        background: 'rgba(255, 255, 255, 0.7)',
                        border: '2px dashed rgba(229, 57, 53, 0.3)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      📸 {uploadedImage ? '更换图片' : '点击上传图片'}
                    </label>

                    {uploadedImage && (
                      <div style={{ marginTop: '12px' }}>
                        <img
                          src={uploadedImage}
                          alt="预览"
                          style={{
                            width: '100%',
                            maxWidth: '200px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="text-action">
                <FestivalButton
                  variant="primary"
                  icon="✨"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  loading={isGenerating}
                  fullWidth
                >
                  {isGenerating ? '生成中...' : '生成文案'}
                </FestivalButton>
              </div>
            </>
          ) : (
            // 结果展示
            <div className="text-result">
              {/* 春联图片预览或海报预览 */}
              {posterUrl ? (
                <div className="couplet-image-preview">
                  <div style={{ marginBottom: '12px', fontSize: '15px', fontWeight: '600', color: 'var(--cny-gray-900)' }}>
                    🎨 春联海报
                  </div>
                  <img
                    src={posterUrl}
                    alt="春联海报"
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      borderRadius: 'var(--radius-xl)',
                      boxShadow: 'var(--shadow-lg)',
                      marginBottom: '20px'
                    }}
                  />
                </div>
              ) : coupletImage && (
                <div className="couplet-image-preview">
                  <img
                    src={coupletImage}
                    alt="春联"
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      borderRadius: 'var(--radius-xl)',
                      boxShadow: 'var(--shadow-lg)',
                      marginBottom: '20px'
                    }}
                  />
                </div>
              )}

              <div className="text-result-card">
                <div className="text-result-content">
                  {generatedText}
                </div>
              </div>

              {/* 🆕 M9春联：春联编辑器 */}
              {featureId === 'M9' && coupletData && (
                <CoupletEditor
                  initialCouplet={coupletData}
                  onCoupletChange={setCoupletData}
                  onRegenerate={handleRegenerateCoupletField}
                  showRegenerateButtons={true}
                  editable={true}
                />
              )}

              <FestivalButtonGroup grid gap={12}>
                <FestivalButton
                  variant="primary"
                  icon="📋"
                  onClick={handleCopy}
                >
                  复制文案
                </FestivalButton>

                {coupletImage && !posterUrl && (
                  <FestivalButton
                    variant="primary"
                    icon="🖼️"
                    onClick={() => downloadCoupletImage(coupletImage, `春联_${Date.now()}.png`)}
                  >
                    下载春联图
                  </FestivalButton>
                )}

                {/* 🆕 M9春联：生成海报按钮 */}
                {featureId === 'M9' && coupletData && uploadedImage && !posterUrl && (
                  <FestivalButton
                    variant="primary"
                    icon="🏮"
                    onClick={handleGeneratePoster}
                    disabled={isGeneratingPoster}
                    loading={isGeneratingPoster}
                  >
                    {isGeneratingPoster ? '生成中...' : '生成春联海报'}
                  </FestivalButton>
                )}

                {/* 🆕 下载海报 */}
                {posterUrl && (
                  <FestivalButton
                    variant="primary"
                    icon="💾"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = posterUrl;
                      link.download = `春联海报_${Date.now()}.png`;
                      link.click();
                    }}
                  >
                    下载海报
                  </FestivalButton>
                )}

                {feature.output.canAddAudio && (
                  <FestivalButton
                    variant="secondary"
                    icon="🎤"
                    onClick={handleToVoice}
                  >
                    转为语音
                  </FestivalButton>
                )}

                <FestivalButton
                  variant="ghost"
                  icon="🔄"
                  onClick={handleRegenerate}
                  fullWidth
                  style={{ gridColumn: '1 / -1' }}
                >
                  换一个
                </FestivalButton>
              </FestivalButtonGroup>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FestivalTextPage;
