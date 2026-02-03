/**
 * 🎨 继续创作面板
 *
 * 在结果页展示的可选组合功能
 * 保持现有的玻璃态风格，不改变视觉
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MaterialAtom, CombinationOption } from '../types/material';
import { MaterialService, MaterialCombiner } from '../services/MaterialService';
import { createNavigationState } from '../types/navigationState';
import '../styles/festival-design-system.css';

interface ContinueCreationPanelProps {
  currentMaterial: MaterialAtom;
  onCombine?: (optionId: string, materials: MaterialAtom[]) => void;
}

export const ContinueCreationPanel: React.FC<ContinueCreationPanelProps> = ({
  currentMaterial,
  onCombine,
}) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  // 获取兼容的素材
  const allMaterials = MaterialService.getAllMaterials();
  const compatibleMaterials = MaterialCombiner.getCompatibleMaterials(
    currentMaterial,
    allMaterials
  );

  // 获取可用的组合选项
  const combinationOptions = MaterialCombiner.getCombinationOptions([currentMaterial]);

  // 快捷操作（引导用户生成缺少的素材）
  const getQuickActions = () => {
    const actions: Array<{
      id: string;
      label: string;
      icon: string;
      description: string;
      path: string;
      state?: any;
    }> = [];

    // 如果是图片，快捷生成数字人拜年视频（带字幕）
    if (currentMaterial.type === 'image') {
      actions.push({
        id: 'quick-digital-human',
        label: '快速生成拜年视频',
        icon: '',
        description: '一键生成数字人拜年视频（自动配音+字幕）',
        path: '/festival/digital-human',
        state: createNavigationState({
          image: currentMaterial.data.url,
          text: currentMaterial.metadata.text || currentMaterial.metadata.caption || '',
          quickMode: true,
          sourceFeatureId: 'continue-panel',
          sourcePagePath: '/festival/result'
        })
      });
    }

    // 如果是图片，建议自定义视频
    if (currentMaterial.type === 'image') {
      actions.push({
        id: 'make-video',
        label: '自定义视频',
        icon: '',
        description: '自定义设置生成视频',
        path: '/festival/video',
        state: createNavigationState({
          image: currentMaterial.data.url,
          text: currentMaterial.metadata.text || currentMaterial.metadata.caption || '',
          originalCaption: currentMaterial.metadata.caption,
          textSource: currentMaterial.metadata.caption ? 'caption' : 'user',
          sourceFeatureId: 'continue-panel',
          sourcePagePath: '/festival/result'
        })
      });
    }

    // 如果是图片或海报，建议配音
    if (currentMaterial.connectors.roles.includes('videoImage')) {
      actions.push({
        id: 'add-voice',
        label: '录制祝福语音',
        icon: '',
        description: '为作品配上你的声音',
        path: '/festival/voice',
        state: createNavigationState({
          image: currentMaterial.data.url,
          text: currentMaterial.metadata.text || currentMaterial.metadata.caption || '',
          originalCaption: currentMaterial.metadata.caption,
          textSource: currentMaterial.metadata.caption ? 'caption' : 'user',
          sourceFeatureId: 'continue-panel',
          sourcePagePath: '/festival/result'
        })
      });
    }

    // 添加"从素材库选择"
    if (compatibleMaterials.length > 0) {
      actions.push({
        id: 'from-library',
        label: '从素材库选择',
        icon: '',
        description: `已有${compatibleMaterials.length}个可用素材`,
        path: '/festival/materials',
      });
    }

    return actions;
  };

  const quickActions = getQuickActions();

  // 如果没有任何可选操作，不显示面板
  if (quickActions.length === 0 && compatibleMaterials.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '32px' }}>
      <style>{`
        .continue-creation-divider {
          margin: 32px 0;
          text-align: center;
          position: relative;
        }

        .continue-creation-divider::before {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 1px;
          background: linear-gradient(
            to right,
            transparent,
            rgba(0, 0, 0, 0.1) 20%,
            rgba(0, 0, 0, 0.1) 80%,
            transparent
          );
        }

        .continue-creation-divider-text {
          position: relative;
          display: inline-block;
          padding: 0 16px;
          background: var(--cny-bg-cream);
          font-size: 13px;
          color: var(--cny-gray-500);
        }

        .continue-creation-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(229, 57, 53, 0.1);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 12px;
        }

        .continue-creation-header:hover {
          background: rgba(255, 255, 255, 0.85);
          border-color: rgba(229, 57, 53, 0.2);
        }

        .continue-creation-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          font-weight: 600;
          color: var(--cny-gray-900);
        }

        .continue-creation-subtitle {
          font-size: 12px;
          color: var(--cny-gray-600);
          margin-top: 2px;
        }

        .continue-creation-expand-icon {
          font-size: 18px;
          color: var(--cny-red-500);
          transition: transform 0.3s;
        }

        .continue-creation-expand-icon.expanded {
          transform: rotate(180deg);
        }

        .continue-creation-content {
          display: grid;
          gap: 12px;
          margin-top: 12px;
        }

        .quick-action-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(229, 57, 53, 0.1);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .quick-action-card:hover {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(229, 57, 53, 0.25);
          transform: translateX(4px);
        }

        .quick-action-icon {
          font-size: 28px;
          flex-shrink: 0;
        }

        .quick-action-text {
          flex: 1;
          min-width: 0;
        }

        .quick-action-label {
          font-size: 15px;
          font-weight: 600;
          color: var(--cny-gray-900);
          margin-bottom: 2px;
        }

        .quick-action-desc {
          font-size: 12px;
          color: var(--cny-gray-600);
        }

        .quick-action-arrow {
          font-size: 16px;
          color: var(--cny-red-500);
          flex-shrink: 0;
        }

        .compatible-materials-section {
          margin-top: 16px;
          padding: 16px;
          background: rgba(255, 248, 240, 0.5);
          border: 1px solid rgba(255, 215, 0, 0.2);
          border-radius: 10px;
        }

        .compatible-materials-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--cny-gray-900);
          margin-bottom: 12px;
        }

        .compatible-materials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 8px;
        }

        .compatible-material-card {
          aspect-ratio: 1;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
        }

        .compatible-material-card:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .compatible-material-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      `}</style>

      {/* 分割线 */}
      <div className="continue-creation-divider">
        <span className="continue-creation-divider-text">还可以做点别的</span>
      </div>

      {/* 可展开的面板 */}
      <div
        className="continue-creation-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <div className="continue-creation-title">
            <span>🎨</span>
            <span>继续创作</span>
          </div>
          <div className="continue-creation-subtitle">
            {quickActions.length > 0
              ? `${quickActions.length}种玩法可选`
              : '查看更多创作方式'}
          </div>
        </div>
        <div className={`continue-creation-expand-icon ${expanded ? 'expanded' : ''}`}>
          ▼
        </div>
      </div>

      {/* 展开内容 */}
      {expanded && (
        <div className="continue-creation-content">
          {/* 快捷操作 */}
          {quickActions.map((action) => (
            <div
              key={action.id}
              className="quick-action-card"
              onClick={() => {
                // 跳转（不自动保存，由用户决定）
                navigate(action.path, {
                  state: action.state || { returnMaterialId: currentMaterial.id },
                });
              }}
            >
              <div className="quick-action-icon">{action.icon}</div>
              <div className="quick-action-text">
                <div className="quick-action-label">{action.label}</div>
                <div className="quick-action-desc">{action.description}</div>
              </div>
              <div className="quick-action-arrow">→</div>
            </div>
          ))}

          {/* 兼容素材 */}
          {compatibleMaterials.length > 0 && (
            <div className="compatible-materials-section">
              <div className="compatible-materials-title">
                💼 可组合的素材（{compatibleMaterials.length}个）
              </div>
              <div className="compatible-materials-grid">
                {compatibleMaterials.slice(0, 6).map((material) => (
                  <div
                    key={material.id}
                    className="compatible-material-card"
                    onClick={() => {
                      navigate('/festival/materials', {
                        state: { preselected: [currentMaterial.id, material.id] },
                      });
                    }}
                  >
                    {material.type === 'image' && material.data.url && (
                      <img
                        src={material.metadata.thumbnail || material.data.url}
                        alt=""
                        className="compatible-material-preview"
                      />
                    )}
                    {material.type === 'couplet' && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                          fontSize: '24px',
                        }}
                      >
                        🏮
                      </div>
                    )}
                    {material.type === 'audio' && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                          fontSize: '24px',
                        }}
                      >
                        🎙️
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {compatibleMaterials.length > 6 && (
                <div
                  style={{
                    marginTop: '12px',
                    textAlign: 'center',
                    fontSize: '13px',
                    color: 'var(--cny-gray-600)',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate('/festival/materials')}
                >
                  查看全部 {compatibleMaterials.length} 个 →
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
