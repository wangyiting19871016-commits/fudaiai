/**
 * 🎨 海报生成器示例组件
 *
 * 演示如何使用填空式海报系统
 */

import React, { useState } from 'react';
import { usePosterGenerator } from '../hooks/usePosterGenerator';
import {
  CLASSIC_COUPLET_POSTER,
  MINIMAL_FRAME_POSTER,
  FULLSCREEN_PHOTO_POSTER,
  getPosterTemplate,
} from '../configs/festival/posterTemplates';
import type { PosterTemplate } from '../configs/festival/posterTemplates';

const TEMPLATE_OPTIONS = [
  { id: 'classic-couplet', name: '经典春联海报', template: CLASSIC_COUPLET_POSTER },
  { id: 'minimal-frame', name: '简约边框海报', template: MINIMAL_FRAME_POSTER },
  { id: 'fullscreen-photo', name: '全屏照片海报', template: FULLSCREEN_PHOTO_POSTER },
];

export function PosterGeneratorExample() {
  // 表单状态
  const [selectedTemplateId, setSelectedTemplateId] = useState('classic-couplet');
  const [imageUrl, setImageUrl] = useState('https://picsum.photos/500/667');
  const [upperLine, setUpperLine] = useState('春风得意马蹄疾');
  const [lowerLine, setLowerLine] = useState('一日看尽长安花');
  const [horizontalScroll, setHorizontalScroll] = useState('马到成功');
  const [title, setTitle] = useState('福袋AI·马年大吉');
  const [subtitle, setSubtitle] = useState('祝您新春快乐');
  const [showWatermark, setShowWatermark] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // 获取当前选中的模板
  const currentTemplate = getPosterTemplate(selectedTemplateId) || CLASSIC_COUPLET_POSTER;

  // 海报生成Hook
  const { generate, download, isGenerating, posterDataUrl, error } = usePosterGenerator({
    template: currentTemplate,
    onSuccess: () => {
      console.log('海报生成成功！');
    },
    onError: (err) => {
      console.error('海报生成失败：', err);
    },
  });

  // 生成海报
  const handleGenerate = async () => {
    try {
      await generate({
        mainImageUrl: imageUrl,
        couplet: currentTemplate.couplet
          ? {
              upperLine,
              lowerLine,
              horizontalScroll,
            }
          : undefined,
        text: currentTemplate.textRegions
          ? {
              title,
              subtitle,
            }
          : undefined,
        watermarkOverride: {
          enabled: showWatermark,
          qrCodeUrl: qrCodeUrl || undefined,
          text: '福袋AI制作',
        },
      });
    } catch (err) {
      console.error('生成失败：', err);
    }
  };

  // 下载海报
  const handleDownload = () => {
    try {
      download(`福袋AI海报_${Date.now()}.png`);
    } catch (err) {
      console.error('下载失败：', err);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🎨 填空式海报生成器</h1>

      <div style={styles.content}>
        {/* 左侧：配置表单 */}
        <div style={styles.form}>
          <h2 style={styles.sectionTitle}>配置</h2>

          {/* 模板选择 */}
          <div style={styles.formGroup}>
            <label style={styles.label}>模板：</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              style={styles.select}
            >
              {TEMPLATE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* 图片URL */}
          <div style={styles.formGroup}>
            <label style={styles.label}>图片URL：</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              style={styles.input}
            />
          </div>

          {/* 春联配置（仅在经典春联模板时显示） */}
          {currentTemplate.couplet && (
            <>
              <h3 style={styles.subTitle}>春联文字</h3>

              <div style={styles.formGroup}>
                <label style={styles.label}>上联（右侧）：</label>
                <input
                  type="text"
                  value={upperLine}
                  onChange={(e) => setUpperLine(e.target.value)}
                  placeholder="春风得意马蹄疾"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>下联（左侧）：</label>
                <input
                  type="text"
                  value={lowerLine}
                  onChange={(e) => setLowerLine(e.target.value)}
                  placeholder="一日看尽长安花"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>横批：</label>
                <input
                  type="text"
                  value={horizontalScroll}
                  onChange={(e) => setHorizontalScroll(e.target.value)}
                  placeholder="马到成功"
                  style={styles.input}
                />
              </div>
            </>
          )}

          {/* 文字配置 */}
          {currentTemplate.textRegions && (
            <>
              <h3 style={styles.subTitle}>文字内容</h3>

              {currentTemplate.textRegions.title && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>标题：</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="福袋AI·马年大吉"
                    style={styles.input}
                  />
                </div>
              )}

              {currentTemplate.textRegions.subtitle && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>副标题：</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="祝您新春快乐"
                    style={styles.input}
                  />
                </div>
              )}
            </>
          )}

          {/* 水印配置 */}
          <h3 style={styles.subTitle}>水印设置</h3>

          <div style={styles.formGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={showWatermark}
                onChange={(e) => setShowWatermark(e.target.checked)}
                style={styles.checkbox}
              />
              显示水印（Logo + 二维码）
            </label>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>二维码URL（可选）：</label>
            <input
              type="text"
              value={qrCodeUrl}
              onChange={(e) => setQrCodeUrl(e.target.value)}
              placeholder="https://example.com/qr-code.png"
              style={styles.input}
              disabled={!showWatermark}
            />
          </div>

          {/* 操作按钮 */}
          <div style={styles.buttonGroup}>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !imageUrl}
              style={{
                ...styles.button,
                ...styles.primaryButton,
                ...(isGenerating || !imageUrl ? styles.disabledButton : {}),
              }}
            >
              {isGenerating ? '生成中...' : '生成海报'}
            </button>

            {posterDataUrl && (
              <button
                onClick={handleDownload}
                style={{ ...styles.button, ...styles.secondaryButton }}
              >
                下载海报
              </button>
            )}
          </div>

          {/* 错误提示 */}
          {error && <div style={styles.error}>❌ {error.message}</div>}
        </div>

        {/* 右侧：预览 */}
        <div style={styles.preview}>
          <h2 style={styles.sectionTitle}>预览</h2>

          {posterDataUrl ? (
            <div style={styles.previewImageContainer}>
              <img src={posterDataUrl} alt="生成的海报" style={styles.previewImage} />
            </div>
          ) : (
            <div style={styles.placeholder}>
              <p>点击"生成海报"查看预览</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 简单样式（实际项目中应使用CSS模块或styled-components）
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: '"Noto Sans SC", sans-serif',
  },

  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#E53935',
    textAlign: 'center',
    marginBottom: '40px',
  },

  content: {
    display: 'flex',
    gap: '40px',
    alignItems: 'flex-start',
  },

  form: {
    flex: '1',
    backgroundColor: '#FFFFFF',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },

  preview: {
    flex: '1',
    backgroundColor: '#FFFFFF',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },

  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: '24px',
  },

  subTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#666666',
    marginTop: '24px',
    marginBottom: '16px',
  },

  formGroup: {
    marginBottom: '20px',
  },

  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#555555',
    marginBottom: '8px',
  },

  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #DDDDDD',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },

  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #DDDDDD',
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
  },

  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#555555',
    cursor: 'pointer',
  },

  checkbox: {
    marginRight: '8px',
    cursor: 'pointer',
  },

  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '32px',
  },

  button: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  primaryButton: {
    backgroundColor: '#E53935',
    color: '#FFFFFF',
  },

  secondaryButton: {
    backgroundColor: '#FFD700',
    color: '#333333',
  },

  disabledButton: {
    backgroundColor: '#CCCCCC',
    cursor: 'not-allowed',
  },

  error: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#FFEBEE',
    color: '#C62828',
    borderRadius: '8px',
    fontSize: '14px',
  },

  previewImageContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: '12px',
    padding: '20px',
  },

  previewImage: {
    maxWidth: '100%',
    maxHeight: '600px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  },

  placeholder: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '400px',
    backgroundColor: '#F5F5F5',
    borderRadius: '12px',
    color: '#999999',
    fontSize: '16px',
  },
};
