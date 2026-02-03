import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTemplatesByFeature,
  getTemplatesByFeatureAndGender,
  featureNeedsGender,
  TemplateItem
} from '../../configs/festival/templateGallery';
import { getFeatureById } from '../../configs/festival/features';
import { BackButton } from '../../components/BackButton';
import '../../styles/festival-design-system.css';
import '../../styles/festival-template-selection.css';
import '../../styles/festival-template-glass.css';

/**
 * 🎨 智能模板选择页
 *
 * 功能：
 * 1. 根据功能自动判断是否需要性别选择
 * 2. 性别切换时，模板列表实时过滤
 * 3. 支持单人（M1/M2）和多人（情侣/全家福）场景
 * 4. 移动端优先设计
 */

const TemplateSelectionPage: React.FC = () => {
  const { featureId } = useParams<{ featureId: string }>();
  const navigate = useNavigate();

  const feature = getFeatureById(featureId || '');
  const needsGender = featureNeedsGender(featureId || '');

  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);

  // 加载模板列表
  useEffect(() => {
    if (!featureId) return;

    const loadedTemplates = needsGender
      ? getTemplatesByFeatureAndGender(featureId, selectedGender)
      : getTemplatesByFeature(featureId);

    setTemplates(loadedTemplates);

    // 如果之前选中的模板不在新列表中，清空选中
    if (selectedTemplate && !loadedTemplates.find(t => t.id === selectedTemplate.id)) {
      setSelectedTemplate(null);
    }
  }, [featureId, selectedGender, needsGender]);

  // 性别切换
  const handleGenderChange = (gender: 'male' | 'female') => {
    setSelectedGender(gender);
  };

  // 模板选择
  const handleTemplateSelect = (template: TemplateItem) => {
    setSelectedTemplate(template);
  };

  // 继续到上传页
  const handleContinue = () => {
    if (!selectedTemplate) {
      alert('请先选择一个模板');
      return;
    }

    // 跳转到LabPage，传递模板和性别信息
    navigate(`/festival/lab/${featureId}`, {
      state: {
        templateId: selectedTemplate.id,
        templateConfig: selectedTemplate.workflowConfig,
        gender: needsGender ? selectedGender : undefined
      }
    });
  };

  if (!feature) {
    return (
      <div className="template-selection-error">
        <p>功能不存在</p>
        <button onClick={() => navigate('/festival/home')}>返回首页</button>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="template-selection-error">
        <p>暂无可用模板</p>
        <button onClick={() => navigate('/festival/home')}>返回首页</button>
      </div>
    );
  }

  return (
    <div className="template-selection-page">
      {/* 背景装饰 */}
      <div className="template-bg"></div>

      {/* 顶部导航 */}
      <div className="template-top-nav">
        <BackButton />
      </div>

      {/* 主内容 */}
      <div className="template-content">
        {/* 标题区 */}
        <div className="template-header">
          <h1 className="template-title">
            {feature.icon} {feature.name}
          </h1>
          <p className="template-subtitle">{feature.subtitle}</p>
        </div>

        {/* 性别选择（如果需要） */}
        {needsGender && (
          <div className="gender-tabs">
            <button
              className={`gender-tab ${selectedGender === 'male' ? 'active' : ''}`}
              onClick={() => handleGenderChange('male')}
            >
              <span className="gender-label">男</span>
            </button>
            <button
              className={`gender-tab ${selectedGender === 'female' ? 'active' : ''}`}
              onClick={() => handleGenderChange('female')}
            >
              <span className="gender-label">女</span>
            </button>
          </div>
        )}

        {/* 模板网格 */}
        <div className="template-section">
          <h2 className="template-section-title">选择你的风格</h2>
          <div className="template-grid">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                onClick={() => handleTemplateSelect(template)}
              >
                {/* 预览图 */}
                <div className="template-preview">
                  <img
                    src={template.coverUrl}
                    alt={template.name}
                    onError={(e) => {
                      // 图片加载失败时显示占位符
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="250"%3E%3Crect fill="%23ddd" width="200" height="250"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3E%E6%A8%A1%E6%9D%BF%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  {selectedTemplate?.id === template.id && (
                    <div className="template-selected-badge">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="#FFD700"/>
                        <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* 模板信息 */}
                <div className="template-info">
                  <h3 className="template-name">{template.name}</h3>
                  {template.subtitle && (
                    <p className="template-desc">{template.subtitle}</p>
                  )}
                </div>
              </div>
            ))}

            {/* 更多敬请期待占位卡片 */}
            <div className="template-card template-card-placeholder">
              <div className="template-preview template-preview-placeholder">
                <div className="placeholder-icon">🔒</div>
              </div>
              <div className="template-info">
                <h3 className="template-name">更多场景</h3>
                <p className="template-desc">敬请期待</p>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="template-footer">
          <button
            className={`template-continue-btn ${selectedTemplate ? 'selected' : ''}`}
            onClick={handleContinue}
            disabled={!selectedTemplate}
          >
            继续 →
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelectionPage;
