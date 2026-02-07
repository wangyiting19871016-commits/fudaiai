import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BackButton } from '../../components/BackButton';
import { HomeButton } from '../../components/HomeButton';
import '../../styles/festival-design-system.css';
import '../../styles/festival-m2-template.css';

/**
 * M2写真模板选择页 - 从COS动态加载
 *
 * 特点：
 * - 紧凑性别选择（小按钮）
 * - 从API动态获取模板列表
 * - 4列网格，框体变小
 * - 无EMOJI，Notion风格
 */

interface M2Template {
  id: string;
  name: string;
  imagePath: string;
  gender: 'male' | 'female' | 'child';
  size: number;
  lastModified: string;
}

const M2TemplateSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 🔥 从返回state中获取保留的选择
  const preserveGender = location.state?.preserveGender;
  const preserveTemplateId = location.state?.preserveTemplateId;

  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | 'child'>(preserveGender || 'male');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [templates, setTemplates] = useState<M2Template[]>([]);
  const [allTemplates, setAllTemplates] = useState<M2Template[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<M2Template | null>(null);
  const [customTemplate, setCustomTemplate] = useState<File | null>(null);
  const [customPreview, setCustomPreview] = useState<string>('');
  const [useCustom, setUseCustom] = useState<boolean>(false);
  const [enableHairSwap, setEnableHairSwap] = useState<boolean>(false);

  // 分类定义
  const categories = {
    female: [
      { id: 'all', name: '全部' },
      { id: 'modern', name: '现代装' },
      { id: 'qipao', name: '旗袍' },
      { id: 'traditional', name: '传统装' }
    ],
    male: [
      { id: 'all', name: '全部' },
      { id: 'modern', name: '现代装' },
      { id: 'traditional', name: '传统装' }
    ],
    child: []
  };

  // 🔥 从API获取模板列表
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      setError('');
      setSelectedCategory('all');
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        const response = await fetch(`${apiBase}/api/m2-templates?gender=${selectedGender}`);
        if (!response.ok) {
          throw new Error('获取模板失败');
        }
        const data = await response.json();

        console.log('[M2 Template] 🔍 API 返回数据:', data);
        console.log('[M2 Template] 🔍 第一个模板:', data.templates?.[0]);

        // 给每个模板添加category字段（从文件名提取）
        const templatesWithCategory = (data.templates || []).map((t: M2Template) => {
          // 从asset-database.json获取category信息
          // 这里简化处理：从suggestedName或其他字段推断
          console.log('[M2 Template] 🔍 模板 imagePath 类型:', typeof t.imagePath, '值:', t.imagePath);
          return t;
        });

        setAllTemplates(templatesWithCategory);
        setTemplates(templatesWithCategory);
        console.log(`[M2 Template] 加载了 ${templatesWithCategory.length} 个${selectedGender}模板`);
      } catch (err: any) {
        console.error('[M2 Template] 加载失败:', err);
        setError(err.message || '加载模板失败');
        setAllTemplates([]);
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [selectedGender]);

  // 🔥 根据分类筛选模板
  useEffect(() => {
    if (selectedCategory === 'all') {
      setTemplates(allTemplates);
      return;
    }

    // 从后端获取分类信息
    const fetchCategoryTemplates = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        const response = await fetch(`${apiBase}/api/m2-templates?gender=${selectedGender}&category=${selectedCategory}`);
        if (!response.ok) {
          throw new Error('获取分类模板失败');
        }
        const data = await response.json();
        setTemplates(data.templates || []);
      } catch (err: any) {
        console.error('[M2 Template] 获取分类失败:', err);
      }
    };

    fetchCategoryTemplates();
  }, [selectedCategory, selectedGender, allTemplates]);

  // 🔥 如果有保留的模板ID，自动选中对应模板
  useEffect(() => {
    if (preserveTemplateId && !selectedTemplate && templates.length > 0) {
      const preservedTemplate = templates.find(t => t.id === preserveTemplateId);
      if (preservedTemplate) {
        setSelectedTemplate(preservedTemplate);
        console.log('[M2 Template] 自动选中保留的模板:', preservedTemplate.id);
      }
    }
  }, [templates, preserveTemplateId, selectedTemplate]);

  const handleTemplateSelect = (template: M2Template) => {
    setSelectedTemplate(template);
    setUseCustom(false);
    setCustomTemplate(null);
    setCustomPreview('');
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        alert('请上传图片文件');
        return;
      }

      // 验证文件大小（最大5MB）
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB');
        return;
      }

      setCustomTemplate(file);
      setUseCustom(true);
      setSelectedTemplate(null);

      // 生成预览
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContinue = () => {
    if (!selectedTemplate && !customTemplate) {
      alert('请选择一个场景模板或上传自定义图片');
      return;
    }

    navigate('/festival/lab/M2', {
      state: {
        gender: selectedGender,
        templateId: useCustom ? 'custom' : selectedTemplate?.id,
        templateImagePath: useCustom ? customPreview : selectedTemplate?.imagePath,
        customTemplateFile: useCustom ? customTemplate : null,
        useCustomTemplate: useCustom,
        enableHairSwap: enableHairSwap,
        // 🔥 关键修复：传递templateConfig，让MissionExecutor能正确读取模板URL
        templateConfig: useCustom ? {
          templateImageUrl: customPreview
        } : {
          templateImageUrl: selectedTemplate?.imagePath  // 传递完整的模板图片路径
        }
      }
    });
  };

  return (
    <div className="m2-template-selection">
      {/* 顶部导航 */}
      <div className="template-top-nav">
        <BackButton />
        <h1 className="template-page-title" style={{ flex: 1, textAlign: 'center', margin: 0 }}>选择写真场景</h1>
        <HomeButton />
      </div>

      {/* 性别选择 - 紧凑型 */}
      <div className="gender-selector-compact">
        <button
          className={`gender-btn-small ${selectedGender === 'male' ? 'active' : ''}`}
          onClick={() => {
            setSelectedGender('male');
            setSelectedTemplate(null);
          }}
        >
          男性
        </button>
        <button
          className={`gender-btn-small ${selectedGender === 'female' ? 'active' : ''}`}
          onClick={() => {
            setSelectedGender('female');
            setSelectedTemplate(null);
          }}
        >
          女性
        </button>
        <button
          className={`gender-btn-small ${selectedGender === 'child' ? 'active' : ''}`}
          onClick={() => {
            setSelectedGender('child');
            setSelectedTemplate(null);
          }}
        >
          儿童
        </button>
      </div>

      {/* 换发型开关 - 紧凑型 */}
      <div style={{
        margin: '0 12px 8px',
        padding: '8px 10px',
        background: 'rgba(255, 243, 224, 0.5)',
        border: '1px solid rgba(255, 193, 7, 0.3)',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: 500, color: '#e65100', marginBottom: '2px' }}>
            换发型模式
          </div>
          <div style={{ fontSize: '10px', color: '#ff6f00', lineHeight: '1.3' }}>
            ⚠️ 时间约3分钟，效果不稳定
          </div>
        </div>
        <label style={{
          position: 'relative',
          display: 'inline-block',
          width: '36px',
          height: '20px',
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
            borderRadius: '20px',
            transition: '0.3s',
            cursor: 'pointer'
          }}>
            <span style={{
              position: 'absolute',
              content: '',
              height: '14px',
              width: '14px',
              left: enableHairSwap ? '19px' : '3px',
              bottom: '3px',
              backgroundColor: 'white',
              borderRadius: '50%',
              transition: '0.3s'
            }}></span>
          </span>
        </label>
      </div>

      {/* 分类Tab（仅女性和男性显示） */}
      {categories[selectedGender].length > 0 && (
        <div className="category-tabs-compact">
          <div className="tabs-scroll-compact">
            {categories[selectedGender].map(cat => (
              <button
                key={cat.id}
                className={`tab-item-compact ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 模板网格 - 4列 */}
      <div className="template-grid-compact">
        {loading ? (
          <div className="empty-state">
            <p>加载中...</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <p style={{ color: '#f44336' }}>{error}</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="empty-state">
            <p>暂无模板</p>
          </div>
        ) : (
          templates.map(template => (
            <div
              key={template.id}
              className={`template-card-compact ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
              onClick={() => handleTemplateSelect(template)}
            >
              {/* 使用 background-image 方式（兼容性更好） */}
              <div
                className="template-image-compact"
                style={{
                  backgroundImage: `url(${template.imagePath})`,
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

export default M2TemplateSelectionPage;
