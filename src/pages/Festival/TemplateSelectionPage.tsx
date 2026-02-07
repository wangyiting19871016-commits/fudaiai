import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  getTemplatesByFeature,
  getTemplatesByFeatureAndGender,
  featureNeedsGender,
  TemplateItem
} from '../../configs/festival/templateGallery';
import { getFeatureById } from '../../configs/festival/features';
import { BackButton } from '../../components/BackButton';
import { HomeButton } from '../../components/HomeButton';
import '../../styles/festival-design-system.css';
import '../../styles/festival-m2-template.css';

/**
 * 🎨 M1头像风格选择页 - Notion风格精简设计
 *
 * 功能：
 * 1. 根据功能自动判断是否需要性别选择
 * 2. 性别切换时，模板列表实时过滤
 * 3. 支持单人（M1/M2）和多人（情侣/全家福）场景
 * 4. Notion风格精简排版（紧凑按钮、4列网格）
 * 5. 移动端优先设计
 */

const TemplateSelectionPage: React.FC = () => {
  const { featureId } = useParams<{ featureId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const feature = getFeatureById(featureId || '');
  const needsGender = featureNeedsGender(featureId || '');

  // 🔥 从返回state中获取保留的选择
  const preserveGender = location.state?.preserveGender;
  const preserveTemplateId = location.state?.preserveTemplateId;

  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>(preserveGender || 'male');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [enableHairSwap, setEnableHairSwap] = useState<boolean>(false);  // 🆕 换发型开关

  // 加载模板列表
  useEffect(() => {
    if (!featureId) return;

    const loadedTemplates = needsGender
      ? getTemplatesByFeatureAndGender(featureId, selectedGender)
      : getTemplatesByFeature(featureId);

    setTemplates(loadedTemplates);

    // 🔥 如果有保留的模板ID，自动选中
    if (preserveTemplateId && !selectedTemplate) {
      const preservedTemplate = loadedTemplates.find(t => t.id === preserveTemplateId);
      if (preservedTemplate) {
        setSelectedTemplate(preservedTemplate);
      }
    }

    // 如果之前选中的模板不在新列表中，清空选中
    if (selectedTemplate && !loadedTemplates.find(t => t.id === selectedTemplate.id)) {
      setSelectedTemplate(null);
    }
  }, [featureId, selectedGender, needsGender, preserveTemplateId]);

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

    // 跳转到LabPage，传递模板、性别和换发型选项
    navigate(`/festival/lab/${featureId}`, {
      state: {
        templateId: selectedTemplate.id,
        templateConfig: selectedTemplate.workflowConfig,
        selectedTemplate: selectedTemplate,  // 🆕 传递完整模板对象（用于M1多风格）
        gender: needsGender ? selectedGender : undefined,
        enableHairSwap: enableHairSwap  // 🆕 传递换发型选项
      }
    });
  };

  if (!feature) {
    return (
      <div className="template-selection-error">
        <p>功能不存在</p>
        <HomeButton />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="template-selection-error">
        <p>暂无可用模板</p>
        <HomeButton />
      </div>
    );
  }

  return (
    <div className="m2-template-selection">
      {/* 顶部导航 */}
      <div className="template-top-nav">
        <BackButton />
        <h1 className="template-page-title" style={{ flex: 1, textAlign: 'center', margin: 0 }}>选择风格</h1>
        <HomeButton />
      </div>

      {/* 性别选择 - 紧凑型（如果需要） */}
      {needsGender && (
        <div className="gender-selector-compact">
          <button
            className={`gender-btn-small ${selectedGender === 'male' ? 'active' : ''}`}
            onClick={() => handleGenderChange('male')}
          >
            男生
          </button>
          <button
            className={`gender-btn-small ${selectedGender === 'female' ? 'active' : ''}`}
            onClick={() => handleGenderChange('female')}
          >
            女生
          </button>
        </div>
      )}

      {/* 换发型开关（仅M2显示） */}
      {featureId === 'M2' && (
        <div style={{
          margin: '12px 16px',
          padding: '10px 12px',
          background: 'rgba(240, 240, 240, 0.5)',
          border: '1px solid rgba(200, 200, 200, 0.3)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px'
        }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '2px', color: '#666' }}>
              换发型模式（实验）
            </div>
            <div style={{ fontSize: '11px', color: '#999', lineHeight: '1.4' }}>
              效果不稳定，生成时间约3分钟
            </div>
          </div>
          <label style={{
            position: 'relative',
            display: 'inline-block',
            width: '40px',
            height: '22px',
            cursor: 'pointer',
            flexShrink: 0,
            marginLeft: '8px'
          }}>
            <input
              type="checkbox"
              checked={enableHairSwap}
              onChange={(e) => setEnableHairSwap(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: enableHairSwap ? '#4CAF50' : '#ccc',
              borderRadius: '22px',
              transition: '0.3s',
              cursor: 'pointer'
            }}>
              <span style={{
                position: 'absolute',
                content: '',
                height: '16px',
                width: '16px',
                left: enableHairSwap ? '21px' : '3px',
                bottom: '3px',
                backgroundColor: 'white',
                borderRadius: '50%',
                transition: '0.3s'
              }}></span>
            </span>
          </label>
        </div>
      )}

      {/* 模板网格 - 4列紧凑布局 */}
      <div className="template-grid-compact">
        {templates.length === 0 ? (
          <div className="empty-state">
            <p>暂无可用模板</p>
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className={`template-card-compact ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
              onClick={() => handleTemplateSelect(template)}
            >
              <div
                className="template-image-compact"
                style={{
                  backgroundImage: `url(${template.coverUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />

              {selectedTemplate?.id === template.id && (
                <div className="selected-mark">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="8" fill="#FFD700"/>
                    <path d="M5 8l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 底部按钮 */}
      <div className="bottom-action-compact">
        <button
          className="continue-btn-compact"
          onClick={handleContinue}
          disabled={!selectedTemplate}
        >
          继续上传照片
        </button>
      </div>
    </div>
  );
};

export default TemplateSelectionPage;
