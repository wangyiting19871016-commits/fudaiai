import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BackButton } from '../../components/BackButton';
import { HomeButton } from '../../components/HomeButton';
import '../../styles/festival-design-system.css';
import '../../styles/festival-m2-template.css';

/**
 * M3情侣模板选择页 - 从COS动态加载
 *
 * 特点：
 * - 无性别选择（情侣模板统一管理）
 * - 从API动态获取模板列表
 * - 4列网格，框体变小
 * - 文件夹删除后自动更新
 */

interface M3Template {
  id: string;
  name: string;
  imagePath: string;
  originalImagePath?: string;
  size: number;
  lastModified: string;
}

const M3TemplateSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 🔥 从返回state中获取保留的选择
  const preserveTemplateId = location.state?.preserveTemplateId;

  const [templates, setTemplates] = useState<M3Template[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<M3Template | null>(null);
  const [customTemplate, setCustomTemplate] = useState<File | null>(null);
  const [customPreview, setCustomPreview] = useState<string>('');
  const [useCustom, setUseCustom] = useState<boolean>(false);

  // 🔥 从API获取模板列表
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      setError('');
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        const response = await fetch(`${apiBase}/api/m3-templates`);
        if (!response.ok) {
          throw new Error('获取模板失败');
        }
        const data = await response.json();

        console.log('[M3 Template] 🔍 API 返回数据:', data);
        console.log('[M3 Template] 🔍 第一个模板:', data.templates?.[0]);

        // 🔥 测试每个图片URL是否可访问
        const templatesWithStatus = data.templates || [];
        templatesWithStatus.forEach((t: M3Template, index: number) => {
          const img = new Image();
          img.onload = () => console.log(`✅ [${index}] ${t.name} 加载成功`);
          img.onerror = () => console.error(`❌ [${index}] ${t.name} 加载失败\nURL: ${t.imagePath}`);
          img.src = t.imagePath;
        });

        setTemplates(templatesWithStatus);
        console.log(`[M3 Template] 加载了 ${templatesWithStatus.length} 个情侣模板`);
      } catch (err: any) {
        console.error('[M3 Template] 加载失败:', err);
        setError(err.message || '加载模板失败');
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // 🔥 如果有保留的模板ID，自动选中对应模板
  useEffect(() => {
    if (preserveTemplateId && !selectedTemplate && templates.length > 0) {
      const preservedTemplate = templates.find(t => t.id === preserveTemplateId);
      if (preservedTemplate) {
        setSelectedTemplate(preservedTemplate);
        console.log('[M3 Template] 自动选中保留的模板:', preservedTemplate.id);
      }
    }
  }, [templates, preserveTemplateId, selectedTemplate]);

  const handleTemplateSelect = (template: M3Template) => {
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
      alert('请选择一个情侣模板或上传自定义图片');
      return;
    }

    navigate('/festival/lab/M3', {
      state: {
        templateId: useCustom ? 'custom' : selectedTemplate?.id,
        templateImagePath: useCustom ? customPreview : selectedTemplate?.imagePath,
        customTemplateFile: useCustom ? customTemplate : null,
        useCustomTemplate: useCustom,
        // 🔥 关键修复：传递完整的templateConfig（包含workflowUuid和nodeMapping）
        templateConfig: useCustom ? {
          workflowUuid: '4df2efa0f18d46dc9758803e478eb51c',  // 默认双人换脸工作流
          templateImageUrl: customPreview,
          nodeMapping: {
            userPhoto: ['59', '64'],      // 第1张→59→左边，第2张→64→右边（与UI提示一致）
            templateImage: ['49']          // 背景节点
          }
        } : {
          workflowUuid: '4df2efa0f18d46dc9758803e478eb51c',  // 默认双人换脸工作流
          templateImageUrl: selectedTemplate?.originalImagePath || selectedTemplate?.imagePath,
          nodeMapping: {
            userPhoto: ['59', '64'],      // 第1张→59→左边，第2张→64→右边（与UI提示一致）
            templateImage: ['49']          // 背景节点
          }
        }
      }
    });
  };

  return (
    <div className="m2-template-selection">
      {/* 顶部导航 */}
      <div className="template-top-nav">
        <BackButton />
        <h1 className="template-page-title" style={{ flex: 1, textAlign: 'center', margin: 0 }}>选择情侣模板</h1>
        <HomeButton />
      </div>

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
          templates.map((template, index) => (
            <div
              key={index}
              className={`template-card-compact ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
              onClick={() => handleTemplateSelect(template)}
            >
              {/* 使用 background-image 方式（兼容性更好） */}
              <div
                className="template-image-compact"
                style={{
                  backgroundImage: `url("${template.imagePath}")`,
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

export default M3TemplateSelectionPage;
