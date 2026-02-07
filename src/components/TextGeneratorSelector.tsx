/**
 * 文案生成方式选择器
 * 当前仅包含已完成的功能
 */

import React from 'react';
import { Modal } from 'antd';
import '../styles/generator-selector.css';

interface TextGeneratorOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  recommended?: boolean;
}

const TEXT_OPTIONS: TextGeneratorOption[] = [
  {
    id: 'text-blessing',
    title: '拜年文案',
    description: '生成温馨的新年祝福语',
    icon: '🎊',
    recommended: true
  },
  {
    id: 'M10',
    title: '高情商回复',
    description: '生成得体的回复话术',
    icon: '💬'
  }
];

interface Props {
  visible: boolean;
  onSelect: (featureId: string) => void;
  onCancel: () => void;
}

export const TextGeneratorSelector: React.FC<Props> = ({
  visible,
  onSelect,
  onCancel
}) => {
  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      title="选择文案生成方式"
      width={400}
      centered
      className="generator-selector-modal"
    >
      <div className="generator-list">
        {TEXT_OPTIONS.map(option => (
          <div
            key={option.id}
            className="generator-list-item"
            onClick={() => onSelect(option.id)}
          >
            <span className="item-icon">{option.icon}</span>
            <div className="item-content">
              <div className="item-title">
                {option.title}
                {option.recommended && (
                  <span className="recommended-badge">推荐</span>
                )}
              </div>
              <div className="item-desc">{option.description}</div>
            </div>
            <span className="item-arrow">→</span>
          </div>
        ))}
      </div>
    </Modal>
  );
};
