/**
 * 💼 素材库页面
 *
 * 管理用户的所有素材，支持多选组合
 * 复用现有的玻璃态风格
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import { MaterialService, MaterialCombiner } from '../../services/MaterialService';
import type { MaterialAtom, MaterialType } from '../../types/material';
import { FestivalButton, FestivalButtonGroup } from '../../components/FestivalButton';
import { BackButton } from '../../components/BackButton';
import '../../styles/festival-design-system.css';
import '../../styles/festival-home-glass.css';
import '../../styles/festival-material-library.css';

const MaterialLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [materials, setMaterials] = useState<MaterialAtom[]>([]);
  const [selectedType, setSelectedType] = useState<MaterialType | 'all'>('all');
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialAtom[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [downloadMaterial, setDownloadMaterial] = useState<MaterialAtom | null>(null);

  useEffect(() => {
    loadMaterials();

    // 如果从其他页面传递了预选素材ID
    const preselected = location.state?.preselected as string[] | undefined;
    if (preselected && preselected.length > 0) {
      const allMaterials = MaterialService.getAllMaterials();
      const preselectedMaterials = allMaterials.filter((m) =>
        preselected.includes(m.id)
      );
      setSelectedMaterials(preselectedMaterials);
    }
  }, [location.state]);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = () => {
      if (activeMenuId) {
        setActiveMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeMenuId]);

  const loadMaterials = () => {
    const allMaterials = MaterialService.getAllMaterials();
    setMaterials(allMaterials);
  };

  const filteredMaterials =
    selectedType === 'all'
      ? materials
      : materials.filter((m) => m.type === selectedType);

  const toggleSelect = (material: MaterialAtom) => {
    if (selectedMaterials.find((m) => m.id === material.id)) {
      setSelectedMaterials(selectedMaterials.filter((m) => m.id !== material.id));
    } else {
      setSelectedMaterials([...selectedMaterials, material]);
    }
  };

  const clearSelection = () => {
    setSelectedMaterials([]);
  };

  const handleCombine = async (optionId: string) => {
    try {
      message.loading({ content: '正在准备组合...', key: 'combine', duration: 0 });

      console.log('[MaterialLibrary] 组合素材:', optionId, selectedMaterials);

      // 根据组合类型跳转到相应的生成页面
      switch (optionId) {
        case 'couplet-poster': {
          // 春联+图片 → 海报生成页
          const couplet = selectedMaterials.find(m => m.type === 'couplet');
          const image = selectedMaterials.find(m => m.type === 'image');

          message.destroy('combine');
          navigate('/festival/poster', {
            state: {
              image: image?.data.url,
              couplet: couplet?.data.couplet,
              fromLibrary: true
            }
          });
          break;
        }

        case 'blessing-poster': {
          // 祝福文案+图片 → 海报生成页
          const text = selectedMaterials.find(m => m.type === 'text');
          const image = selectedMaterials.find(m => m.type === 'image');

          message.destroy('combine');
          navigate('/festival/poster', {
            state: {
              image: image?.data.url,
              blessing: text?.data.text,
              fromLibrary: true
            }
          });
          break;
        }

        case 'voiced-video':
        case 'complete-video': {
          // 图片+语音(+文案) → 视频生成页
          const image = selectedMaterials.find(m => m.type === 'image');
          const audio = selectedMaterials.find(m => m.type === 'audio');
          const text = selectedMaterials.find(m => m.type === 'text');

          message.destroy('combine');
          navigate('/festival/video', {
            state: {
              image: image?.data.url,
              audioUrl: audio?.data.url,
              caption: text?.data.text || '',
              fromLibrary: true
            }
          });
          break;
        }

        default:
          message.destroy('combine');
          message.warning('暂不支持该组合类型');
          console.warn('[MaterialLibrary] 未知的组合类型:', optionId);
      }
    } catch (error) {
      message.destroy('combine');
      message.error('组合失败');
      console.error('[MaterialLibrary] 组合失败:', error);
    }
  };

  const handleDownloadMaterial = (material: MaterialAtom) => {
    if (material.type === 'text' && material.data.text) {
      // 文字类型：复制到剪贴板
      navigator.clipboard.writeText(material.data.text).then(() => {
        message.success('文字已复制到剪贴板');
      }).catch(() => {
        message.error('复制失败');
      });
    } else if ((material.type === 'image' || material.type === 'video') && material.data.url) {
      // 图片/视频：显示长按保存引导
      setDownloadMaterial(material);
    } else {
      message.info('此素材类型暂不支持下载');
    }
    setActiveMenuId(null);
  };

  const handleDelete = (materialId: string) => {
    if (confirm('确定要删除这个素材吗？')) {
      MaterialService.deleteMaterial(materialId);
      loadMaterials();
      setActiveMenuId(null);
      message.success('已删除');
    }
  };

  const handleClearAll = () => {
    if (confirm('确定要清空所有素材吗？此操作不可恢复！')) {
      MaterialService.clearAllMaterials();
      loadMaterials();
      setSelectedMaterials([]);
      message.success('已清空所有素材');
    }
  };

  const stats = MaterialService.getStatistics();
  const combinationOptions = MaterialCombiner.getCombinationOptions(selectedMaterials);

  return (
    <div className="festival-home-glass">
      {/* 动态背景层 */}
      <div className="bg-aura" />

      {/* 内容区 */}
      <div className="content-wrapper" style={{ paddingTop: '20px' }}>
        {/* 返回按钮 */}
        <BackButton />

        {/* 头部 */}
        <div className="material-library-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className="material-library-title">我的作品</h1>
              <p className="material-library-subtitle">
                共 {materials.length} 个素材
                {selectedMaterials.length > 0 && ` · 已选 ${selectedMaterials.length} 个`}
              </p>
            </div>
            {materials.length > 0 && (
              <button
                onClick={handleClearAll}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(229, 57, 53, 0.2)',
                  borderRadius: '8px',
                  color: 'var(--cny-red-500)',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                🗑️ 清空全部
              </button>
            )}
          </div>
        </div>

        {/* 类型标签 */}
        <div className="material-type-tabs">
          <button
            className={`material-type-tab ${selectedType === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedType('all')}
          >
            全部 ({materials.length})
          </button>
          <button
            className={`material-type-tab ${selectedType === 'image' ? 'active' : ''}`}
            onClick={() => setSelectedType('image')}
          >
            📸 图片 ({stats.image})
          </button>
          <button
            className={`material-type-tab ${selectedType === 'couplet' ? 'active' : ''}`}
            onClick={() => setSelectedType('couplet')}
          >
            🏮 春联 ({stats.couplet})
          </button>
          <button
            className={`material-type-tab ${selectedType === 'text' ? 'active' : ''}`}
            onClick={() => setSelectedType('text')}
          >
            📝 文案 ({stats.text})
          </button>
          <button
            className={`material-type-tab ${selectedType === 'audio' ? 'active' : ''}`}
            onClick={() => setSelectedType('audio')}
          >
            🎙️ 语音 ({stats.audio})
          </button>
          <button
            className={`material-type-tab ${selectedType === 'video' ? 'active' : ''}`}
            onClick={() => setSelectedType('video')}
          >
            🎬 视频 ({stats.video})
          </button>
        </div>

        {/* 素材网格 */}
        {filteredMaterials.length === 0 ? (
          <div className="material-empty">
            <div className="material-empty-icon">📦</div>
            <div>还没有素材</div>
            <div style={{ fontSize: '13px', marginTop: '8px' }}>
              去创作功能生成作品后会自动保存到这里
            </div>
          </div>
        ) : (
          <div className="material-grid">
            {filteredMaterials.map((material) => {
              const isSelected = selectedMaterials.find((m) => m.id === material.id);

              return (
                <div
                  key={material.id}
                  className={`material-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleSelect(material)}
                >
                  {/* 三个点菜单按钮 */}
                  <button
                    className="material-menu-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === material.id ? null : material.id);
                    }}
                  >
                    ⋮
                  </button>

                  {/* 下拉菜单 */}
                  {activeMenuId === material.id && (
                    <div className="material-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="material-menu-item"
                        onClick={() => handleDownloadMaterial(material)}
                      >
                        下载
                      </button>
                      <button
                        className="material-menu-item danger"
                        onClick={() => handleDelete(material.id)}
                      >
                        删除
                      </button>
                    </div>
                  )}

                  {/* 选中标记 */}
                  {isSelected && <div className="material-selected-badge">✓</div>}

                  {/* 预览 - 允许长按保存 */}
                  <div
                    className="material-preview"
                    onClick={(e) => {
                      // 如果点击的是图片/视频，阻止冒泡，允许长按保存
                      if (material.type === 'image' || material.type === 'video') {
                        e.stopPropagation();
                      }
                    }}
                  >
                    {material.type === 'image' && material.data.url && (
                      <img
                        src={material.metadata.thumbnail || material.data.url}
                        alt=""
                        style={{
                          userSelect: 'auto',
                          WebkitUserSelect: 'auto',
                          WebkitTouchCallout: 'default'
                        }}
                      />
                    )}
                    {material.type === 'couplet' && (
                      <div className="material-preview-icon">🏮</div>
                    )}
                    {material.type === 'text' && material.data.text && (
                      <div style={{
                        padding: '12px',
                        fontSize: '13px',
                        lineHeight: '1.5',
                        color: 'var(--cny-gray-700)',
                        textAlign: 'left',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {material.data.text}
                      </div>
                    )}
                    {material.type === 'audio' && (
                      <div className="material-preview-icon">🎙️</div>
                    )}
                    {material.type === 'video' && material.data.url && (
                      <video
                        src={material.data.url}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          WebkitTouchCallout: 'default'
                        }}
                        muted
                      />
                    )}
                  </div>

                  {/* 信息 */}
                  <div className="material-info">
                    <div className="material-name">{material.metadata.featureName}</div>
                    <div className="material-meta">
                      {new Date(material.metadata.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 选中栏 */}
        {selectedMaterials.length > 0 && (
          <div className="selection-bar">
            <div className="selection-info">
              已选择 {selectedMaterials.length} 个素材
            </div>

            {/* 组合选项 */}
            {combinationOptions.length > 0 ? (
              <FestivalButtonGroup direction="horizontal" gap={8}>
                {combinationOptions.map((option) => (
                  <FestivalButton
                    key={option.id}
                    variant="primary"
                    size="small"
                    icon={option.icon}
                    onClick={() => handleCombine(option.id)}
                  >
                    {option.name}
                  </FestivalButton>
                ))}
              </FestivalButtonGroup>
            ) : (
              <div className="tip-no-combination">
                💡 这些素材不能组合，试试选择其他的吧
              </div>
            )}

            <FestivalButton
              variant="ghost"
              size="small"
              onClick={clearSelection}
              style={{ marginTop: '8px' }}
            >
              取消选择
            </FestivalButton>
          </div>
        )}

        {/* 下载引导弹窗 */}
        {downloadMaterial && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => setDownloadMaterial(null)}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '16px',
                maxWidth: '400px',
                width: '100%',
                padding: '20px',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setDownloadMaterial(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--cny-gray-600)'
                }}
              >
                ×
              </button>

              <h3 style={{
                margin: '0 0 16px 0',
                fontSize: '18px',
                fontWeight: '600',
                color: 'var(--cny-gray-900)'
              }}>
                💾 保存到相册
              </h3>

              <div style={{
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '16px'
              }}>
                {downloadMaterial.type === 'image' && (
                  <img
                    src={downloadMaterial.data.url}
                    alt="素材"
                    style={{
                      width: '100%',
                      display: 'block',
                      userSelect: 'auto',
                      WebkitUserSelect: 'auto',
                      WebkitTouchCallout: 'default'
                    }}
                  />
                )}
                {downloadMaterial.type === 'video' && (
                  <video
                    src={downloadMaterial.data.url}
                    controls
                    style={{
                      width: '100%',
                      display: 'block',
                      WebkitTouchCallout: 'default'
                    }}
                  />
                )}
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                padding: '16px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>👆</div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#000',
                  marginBottom: '8px'
                }}>
                  长按上方{downloadMaterial.type === 'video' ? '视频' : '图片'}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#333',
                  lineHeight: '1.5'
                }}>
                  在弹出菜单中选择「保存{downloadMaterial.type === 'video' ? '视频' : '图片'}」
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialLibraryPage;
