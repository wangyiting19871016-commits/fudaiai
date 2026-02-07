/**
 * 图片生成方式选择器
 * 当前仅支持 M1快速模板 和 M2高级模板
 */

import React from 'react';
import { Modal } from 'antd';
import '../styles/generator-selector.css';

interface ImageGeneratorOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  badge?: string;
  path: string;
}

const IMAGE_OPTIONS: ImageGeneratorOption[] = [
  {
    id: 'template-m1',
    title: '新年头像',
    description: '多种风格，快速生成',
    icon: '🎭',
    badge: '推荐',
    path: '/festival/template-select/M1'
  },
  {
    id: 'template-m2',
    title: 'AI写真',
    description: '可调整发型、风格细节',
    icon: '✨',
    path: '/festival/m2-template-select'
  }
];

interface Props {
  visible: boolean;
  onSelect: (option: ImageGeneratorOption) => void;
  onCancel: () => void;
}

export const ImageGeneratorSelector: React.FC<Props> = ({
  visible,
  onSelect,
  onCancel
}) => {
  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      title="选择图片生成方式"
      width={500}
      centered
      className="generator-selector-modal"
    >
      <div className="generator-grid">
        {IMAGE_OPTIONS.map(option => (
          <div
            key={option.id}
            className="generator-card"
            onClick={() => onSelect(option)}
          >
            {option.badge && (
              <span className="generator-badge">{option.badge}</span>
            )}
            <div className="generator-icon">{option.icon}</div>
            <div className="generator-title">{option.title}</div>
            <div className="generator-desc">{option.description}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
