/**
 * 🎬 视频模式选择器
 *
 * 3个大按钮，8岁小孩都能看懂
 * - 数字人说话
 * - 动作视频
 * - 表情包GIF（推荐）
 */

import React from 'react';
import { VIDEO_MODES, type VideoModeId } from '../../../configs/festival/videoModes';
import { QuotaService } from '../../../services/QuotaService';
import '../../../styles/festival-common.css';

interface ModeSelectorProps {
  onSelect: (modeId: VideoModeId) => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelect }) => {
  const handleSelect = (modeId: VideoModeId) => {
    // 检查配额
    const hasQuota = QuotaService.checkQuota(modeId);

    if (!hasQuota) {
      const message = QuotaService.getQuotaExceededMessage(modeId);
      alert(message);
      return;
    }

    onSelect(modeId);
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 标题 */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#333',
          margin: '0 0 8px 0'
        }}>
          选择视频类型
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#666',
          margin: 0
        }}>
          点击卡片即可开始制作
        </p>
      </div>

      {/* 模式网格 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        {VIDEO_MODES.map(mode => {
          const remaining = QuotaService.getRemainingQuota(mode.id);
          const hasQuota = remaining > 0;

          return (
            <div
              key={mode.id}
              className={`glass-card clickable mode-card ${mode.recommended ? 'recommended' : ''}`}
              onClick={() => handleSelect(mode.id)}
              style={{
                opacity: hasQuota ? 1 : 0.6,
                cursor: hasQuota ? 'pointer' : 'not-allowed'
              }}
            >
              {/* 图标 */}
              <div className="mode-icon">{mode.icon}</div>

              {/* 标题 */}
              <h3>{mode.name}</h3>

              {/* 描述 */}
              <p>{mode.description}</p>

              {/* 成本 + 配额 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <span className={`mode-cost ${mode.costType === 'free' ? 'free' : ''}`}>
                  {mode.cost}
                </span>

                {/* 配额显示 */}
                {mode.id !== 'gif' && (
                  <span style={{
                    fontSize: '12px',
                    color: remaining > 0 ? '#4CAF50' : '#F44336',
                    fontWeight: '500'
                  }}>
                    {remaining === Infinity
                      ? '无限次'
                      : `今日剩余 ${remaining} 次`
                    }
                  </span>
                )}
              </div>

              {/* 提示 */}
              <div style={{
                marginTop: '12px',
                padding: '8px',
                background: 'rgba(0,0,0,0.03)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#666',
                lineHeight: '1.4'
              }}>
                {mode.tips}
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部提示 */}
      <div style={{
        marginTop: '24px',
        textAlign: 'center',
        fontSize: '12px',
        color: '#999'
      }}>
        💡 推荐先试试免费的GIF表情包，效果好还能直接保存
      </div>
    </div>
  );
};

export default ModeSelector;
