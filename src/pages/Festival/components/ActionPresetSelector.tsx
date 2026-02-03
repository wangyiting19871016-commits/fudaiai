/**
 * 🎭 动作预设选择器
 *
 * 展示动作选项，点击即可选择
 * - 扭秧歌
 * - 抱拳拜年
 * - 挥手
 * - 竖大拇指
 */

import React, { useState } from 'react';
import { ACTION_PRESETS, type ActionPreset } from '../../../configs/festival/actionPresets';
import '../../../styles/festival-common.css';

interface ActionPresetSelectorProps {
  onSelect: (action: ActionPreset) => void;
  onBack?: () => void;
}

const ActionPresetSelector: React.FC<ActionPresetSelectorProps> = ({ onSelect, onBack }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (action: ActionPreset) => {
    setSelectedId(action.id);
    onSelect(action);
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 返回按钮 */}
      {onBack && (
        <button
          className="back-btn-standard"
          onClick={onBack}
          style={{ marginBottom: '24px' }}
        >
          ← 返回选择模式
        </button>
      )}

      {/* 标题 */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#333',
          margin: '0 0 8px 0'
        }}>
          选择动作
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#666',
          margin: 0
        }}>
          AI会让你的照片做出相应动作
        </p>
      </div>

      {/* 动作网格 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '16px',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {ACTION_PRESETS.map(action => (
          <div
            key={action.id}
            className={`glass-card clickable action-preset-card ${selectedId === action.id ? 'selected' : ''}`}
            onClick={() => handleSelect(action)}
          >
            {/* 图标（暂时用emoji，后续可以替换为预览GIF） */}
            <div className="action-icon">{action.icon}</div>

            {/* 名称 */}
            <div className="action-name">{action.name}</div>

            {/* 描述 */}
            <div style={{
              fontSize: '12px',
              color: '#999',
              marginTop: '4px'
            }}>
              {action.description}
            </div>
          </div>
        ))}
      </div>

      {/* 底部说明 */}
      <div style={{
        marginTop: '32px',
        padding: '16px',
        background: 'rgba(255, 215, 0, 0.1)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 215, 0, 0.3)',
        maxWidth: '600px',
        margin: '32px auto 0'
      }}>
        <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
          <strong style={{ color: '#333' }}>💡 生成说明：</strong>
          <br />
          • 选择动作后会立即开始生成
          <br />
          • 生成时间约60-90秒
          <br />
          • AI会保持你的面部特征，只改变动作
        </div>
      </div>
    </div>
  );
};

export default ActionPresetSelector;
