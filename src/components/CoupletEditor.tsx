/**
 * 🏮 春联编辑器组件
 *
 * 可复用的春联编辑+重新生成组件
 * 用于：M9海报生成器、ResultPage海报功能
 */

import React, { useState } from 'react';
import { message } from 'antd';
import '../styles/festival-design-system.css';

export interface CoupletData {
  upperLine: string;      // 上联
  lowerLine: string;      // 下联
  horizontalScroll: string; // 横批
}

interface CoupletEditorProps {
  initialCouplet: CoupletData;
  onCoupletChange: (couplet: CoupletData) => void;
  onRegenerate?: (field: 'upper' | 'lower' | 'horizontal') => Promise<void>;
  showRegenerateButtons?: boolean;
  editable?: boolean;
}

export const CoupletEditor: React.FC<CoupletEditorProps> = ({
  initialCouplet,
  onCoupletChange,
  onRegenerate,
  showRegenerateButtons = true,
  editable = true,
}) => {
  const [couplet, setCouplet] = useState<CoupletData>(initialCouplet);
  const [regenerating, setRegenerating] = useState<{
    upper: boolean;
    lower: boolean;
    horizontal: boolean;
  }>({
    upper: false,
    lower: false,
    horizontal: false,
  });

  const handleFieldChange = (field: keyof CoupletData, value: string) => {
    const newCouplet = { ...couplet, [field]: value };
    setCouplet(newCouplet);
    onCoupletChange(newCouplet);
  };

  const handleRegenerate = async (field: 'upper' | 'lower' | 'horizontal') => {
    if (!onRegenerate) return;

    setRegenerating((prev) => ({ ...prev, [field]: true }));

    try {
      await onRegenerate(field);
      message.success('重新生成成功！');
    } catch (error) {
      message.error('重新生成失败');
      console.error('[CoupletEditor] 重新生成失败:', error);
    } finally {
      setRegenerating((prev) => ({ ...prev, [field]: false }));
    }
  };

  return (
    <div className="couplet-editor">
      <style>{`
        .couplet-editor {
          background: linear-gradient(135deg, rgba(229, 57, 53, 0.05), rgba(255, 215, 0, 0.05));
          border: 2px solid rgba(229, 57, 53, 0.2);
          border-radius: 16px;
          padding: 20px;
          margin: 16px 0;
        }

        .couplet-editor-title {
          font-size: 16px;
          font-weight: bold;
          color: var(--cny-red-500, #E53935);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .couplet-editor-field {
          margin-bottom: 12px;
        }

        .couplet-editor-field:last-child {
          margin-bottom: 0;
        }

        .couplet-editor-label {
          font-size: 14px;
          font-weight: 500;
          color: #666;
          margin-bottom: 8px;
          display: block;
        }

        .couplet-editor-input-wrapper {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .couplet-editor-input {
          flex: 1;
          padding: 12px 16px;
          font-size: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          outline: none;
          transition: all 0.2s;
          font-family: "Noto Serif SC", "STKaiti", "KaiTi", serif;
        }

        .couplet-editor-input:focus {
          border-color: var(--cny-red-500, #E53935);
          box-shadow: 0 0 0 3px rgba(229, 57, 53, 0.1);
        }

        .couplet-editor-input:disabled {
          background-color: #f5f5f5;
          color: #999;
          cursor: not-allowed;
        }

        .couplet-editor-regenerate-btn {
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 500;
          background: linear-gradient(135deg, var(--cny-red-500, #E53935), #D32F2F);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          min-width: 80px;
        }

        .couplet-editor-regenerate-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(229, 57, 53, 0.3);
        }

        .couplet-editor-regenerate-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
          transform: none;
        }

        .couplet-editor-tip {
          font-size: 12px;
          color: #999;
          margin-top: 12px;
          text-align: center;
        }
      `}</style>

      <div className="couplet-editor-title">
        🏮 春联编辑
      </div>

      {/* 上联 */}
      <div className="couplet-editor-field">
        <label className="couplet-editor-label">上联（右侧）：</label>
        <div className="couplet-editor-input-wrapper">
          <input
            type="text"
            className="couplet-editor-input"
            value={couplet.upperLine}
            onChange={(e) => handleFieldChange('upperLine', e.target.value)}
            placeholder="春风得意马蹄疾"
            disabled={!editable}
            maxLength={20}
          />
          {showRegenerateButtons && onRegenerate && (
            <button
              className="couplet-editor-regenerate-btn"
              onClick={() => handleRegenerate('upper')}
              disabled={regenerating.upper}
            >
              {regenerating.upper ? '生成中...' : '🔄 重新生成'}
            </button>
          )}
        </div>
      </div>

      {/* 下联 */}
      <div className="couplet-editor-field">
        <label className="couplet-editor-label">下联（左侧）：</label>
        <div className="couplet-editor-input-wrapper">
          <input
            type="text"
            className="couplet-editor-input"
            value={couplet.lowerLine}
            onChange={(e) => handleFieldChange('lowerLine', e.target.value)}
            placeholder="一日看尽长安花"
            disabled={!editable}
            maxLength={20}
          />
          {showRegenerateButtons && onRegenerate && (
            <button
              className="couplet-editor-regenerate-btn"
              onClick={() => handleRegenerate('lower')}
              disabled={regenerating.lower}
            >
              {regenerating.lower ? '生成中...' : '🔄 重新生成'}
            </button>
          )}
        </div>
      </div>

      {/* 横批 */}
      <div className="couplet-editor-field">
        <label className="couplet-editor-label">横批（4个字）：</label>
        <div className="couplet-editor-input-wrapper">
          <input
            type="text"
            className="couplet-editor-input"
            value={couplet.horizontalScroll}
            onChange={(e) => handleFieldChange('horizontalScroll', e.target.value)}
            placeholder="马到成功"
            disabled={!editable}
            maxLength={4}
          />
          {showRegenerateButtons && onRegenerate && (
            <button
              className="couplet-editor-regenerate-btn"
              onClick={() => handleRegenerate('horizontal')}
              disabled={regenerating.horizontal}
            >
              {regenerating.horizontal ? '生成中...' : '🔄 重新生成'}
            </button>
          )}
        </div>
      </div>

      {editable && (
        <div className="couplet-editor-tip">
          💡 可以直接编辑修改，或点击"重新生成"按钮
        </div>
      )}
    </div>
  );
};
