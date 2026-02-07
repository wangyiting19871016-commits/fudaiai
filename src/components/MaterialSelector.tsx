/**
 * 素材库选择器
 * 用于从已保存的素材中选择
 */

import React, { useState, useEffect } from 'react';
import { Modal, Empty, message } from 'antd';
import { MaterialService } from '../services/MaterialService';
import type { MaterialAtom } from '../types/material';
import '../styles/material-selector.css';

interface Props {
  type: 'image' | 'audio' | 'text';
  visible: boolean;
  onSelect: (material: MaterialAtom) => void;
  onCancel: () => void;
}

export const MaterialSelector: React.FC<Props> = ({
  type,
  visible,
  onSelect,
  onCancel
}) => {
  const [materials, setMaterials] = useState<MaterialAtom[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadMaterials();
    }
  }, [visible, type]);

  const loadMaterials = () => {
    try {
      setLoading(true);
      const allMaterials = MaterialService.getAllMaterials();
      const filtered = allMaterials.filter(m => m.type === type);
      setMaterials(filtered);
    } catch (err) {
      console.error('[MaterialSelector] 加载失败:', err);
      message.error('加载素材失败');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'image': return '选择图片素材';
      case 'audio': return '选择音频素材';
      case 'text': return '选择文案素材';
    }
  };

  const handleSelect = (material: MaterialAtom) => {
    onSelect(material);
    message.success('素材已选择');
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      title={getTitle()}
      width={600}
      centered
      className="material-selector-modal"
    >
      <div className="material-selector-content">
        {loading ? (
          <div className="material-loading">加载中...</div>
        ) : materials.length === 0 ? (
          <Empty
            description="暂无素材，去生成一些吧"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div className="material-grid">
            {materials.map(material => (
              <MaterialCard
                key={material.id}
                material={material}
                onClick={() => handleSelect(material)}
              />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

// 素材卡片
const MaterialCard: React.FC<{
  material: MaterialAtom;
  onClick: () => void;
}> = ({ material, onClick }) => {
  const renderPreview = () => {
    switch (material.type) {
      case 'image':
        return (
          <div className="material-preview material-preview-image">
            <img src={material.data.url} alt="预览" />
          </div>
        );
      case 'audio':
        return (
          <div className="material-preview material-preview-audio">
            <span className="audio-icon">🎵</span>
            <audio
              src={material.data.url}
              controls
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            />
          </div>
        );
      case 'text':
        return (
          <div className="material-preview material-preview-text">
            <p>{material.data.text || ''}</p>
          </div>
        );
    }
  };

  const getMetaInfo = () => {
    if (material.metadata?.featureName) {
      return material.metadata.featureName;
    }
    const date = material.metadata?.createdAt
      ? new Date(material.metadata.createdAt).toLocaleDateString()
      : '';
    return date;
  };

  return (
    <div className="material-card" onClick={onClick}>
      {renderPreview()}
      <div className="material-meta">
        <span className="material-info">{getMetaInfo()}</span>
      </div>
    </div>
  );
};
