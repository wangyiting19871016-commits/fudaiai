/**
 * Kling AI特效模板选择Modal
 *
 * 用途：大图展示可灵视频特效模板，支持视频预览
 */

import React, { useState } from 'react';
import '../../../styles/kling-template-modal.css';

// Kling AI特效模板配置（带视频预览）
export interface KlingEffectTemplate {
  id: string;
  name: string;
  description: string;
  effect_scene: string | null;
  // 视频预览URL（实际项目中应该是真实的视频URL或GIF）
  previewVideo?: string;
  // 缩略图（视频第一帧或占位符）
  thumbnail: string;
  // 标签
  tags: string[];
  // 是否需要音频
  needsAudio: boolean;
}

export const KLING_EFFECT_TEMPLATES: KlingEffectTemplate[] = [
  // ========== 春节拜年系列 ==========
  {
    id: 'new_year_greeting',
    name: '拜年讨红包',
    description: '照片中的人物做出拜年动作，充满节日气氛',
    effect_scene: 'new_year_greeting',
    thumbnail: '/assets/showcase/video-effects-demo.gif',
    tags: ['春节', '拜年', '红包'],
    needsAudio: false
  },
  {
    id: 'lion_dance',
    name: '舞狮',
    description: '照片变身舞狮表演，热闹喜庆',
    effect_scene: 'lion_dance',
    thumbnail: '/assets/videos/lion-preview.jpg',
    previewVideo: '/assets/videos/lion-preview.gif',
    tags: ['春节', '舞狮', '表演'],
    needsAudio: false
  },
  {
    id: 'fortune_knocks',
    name: '财神敲门',
    description: '财神来访特效，带来满满财运',
    effect_scene: 'fortune_knocks_cartoon',
    thumbnail: '/assets/videos/fireworks-preview.jpg',
    tags: ['春节', '财神', '卡通'],
    needsAudio: false
  },
  {
    id: 'fortune_god',
    name: '财神驾到',
    description: '照片中的人物变身财神，金光闪闪',
    effect_scene: 'fortune_god_transform',
    thumbnail: '/assets/videos/fireworks-preview.jpg',
    tags: ['春节', '财神', '变身'],
    needsAudio: false
  },
  {
    id: 'spring_couplets',
    name: '专属对联',
    description: '生成专属春联特效，喜气洋洋',
    effect_scene: 'unique_spring_couplets',
    thumbnail: '/assets/videos/couplet-preview.jpg',
    previewVideo: '/assets/showcase/home-video-preview.gif',
    tags: ['春节', '春联', '祝福'],
    needsAudio: false
  },
  {
    id: 'lantern_cuju',
    name: '蹴鞠闹元宵',
    description: '元宵节蹴鞠特效，传统与欢乐并存',
    effect_scene: 'lantern_festival_cuju',
    thumbnail: '/assets/showcase/home-video-preview.gif',
    tags: ['元宵', '蹴鞠', '运动'],
    needsAudio: false
  },
  // ========== 通用庆祝系列 ==========
  {
    id: 'firework',
    name: '专属烟花',
    description: '绚丽烟花在照片周围绽放',
    effect_scene: 'unique_firework',
    thumbnail: '/assets/videos/fireworks-preview.jpg',
    previewVideo: '/assets/videos/fireworks-preview.gif',
    tags: ['庆祝', '烟花', '绚丽'],
    needsAudio: false
  },
  {
    id: 'celebration',
    name: '欢庆时刻',
    description: '庆祝特效，适合各种喜庆场合',
    effect_scene: 'celebration',
    thumbnail: '/assets/videos/fireworks-preview.jpg',
    tags: ['庆祝', '喜庆', '通用'],
    needsAudio: false
  },
  {
    id: 'rocket',
    name: '冲天火箭',
    description: '火箭发射特效，寓意事业冲天',
    effect_scene: 'rocket_rocket',
    thumbnail: '/assets/videos/fireworks-preview.jpg',
    tags: ['庆祝', '火箭', '冲天'],
    needsAudio: false
  },
  {
    id: 'dollar_rain',
    name: '金钱雨',
    description: '金币从天而降，财运滚滚来',
    effect_scene: 'dollar_rain',
    thumbnail: '/assets/videos/fireworks-preview.jpg',
    tags: ['庆祝', '财运', '金钱'],
    needsAudio: false
  },
  {
    id: 'bloom',
    name: '花花世界',
    description: '鲜花绽放特效，浪漫温馨',
    effect_scene: 'bloom_bloom',
    thumbnail: 'https://via.placeholder.com/400x300/E91E63/ffffff?text=%E8%8A%B1%E8%8A%B1%E4%B8%96%E7%95%8C',
    tags: ['庆祝', '鲜花', '浪漫'],
    needsAudio: false
  },
  {
    id: 'expansion',
    name: '万物膨胀',
    description: 'BoomBoom特效，夸张搞笑',
    effect_scene: 'expansion',
    thumbnail: 'https://via.placeholder.com/400x300/FF5722/ffffff?text=%E4%B8%87%E7%89%A9%E8%86%A8%E8%83%80',
    tags: ['庆祝', '搞笑', '夸张'],
    needsAudio: false
  }
];

interface KlingTemplateModalProps {
  visible: boolean;
  selectedId: string | null;
  onSelect: (template: KlingEffectTemplate) => void;
  onClose: () => void;
}

const KlingTemplateModal: React.FC<KlingTemplateModalProps> = ({
  visible,
  selectedId,
  onSelect,
  onClose
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!visible) return null;

  return (
    <div className="kling-template-modal-overlay" onClick={onClose}>
      <div className="kling-template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="kling-template-modal-header">
          <h2>选择视频特效模板</h2>
          <button className="kling-template-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="kling-template-modal-body">
          <div className="kling-template-grid">
            {KLING_EFFECT_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className={`kling-template-card ${selectedId === template.id ? 'selected' : ''} ${hoveredId === template.id ? 'hovered' : ''}`}
                onClick={() => {
                  onSelect(template);
                  onClose();
                }}
                onMouseEnter={() => setHoveredId(template.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* 视频预览区域 */}
                <div className="kling-template-preview">
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="kling-template-thumbnail"
                  />
                  {selectedId === template.id && (
                    <div className="kling-template-selected-badge">✓</div>
                  )}
                  {template.needsAudio && (
                    <div className="kling-template-audio-badge">需要音频</div>
                  )}
                </div>

                {/* 模板信息 */}
                <div className="kling-template-info">
                  <div className="kling-template-name">{template.name}</div>
                  <div className="kling-template-desc">{template.description}</div>
                  <div className="kling-template-tags">
                    {template.tags.map((tag, idx) => (
                      <span key={idx} className="kling-template-tag">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="kling-template-modal-footer">
          <div className="kling-template-tip">
            💡 提示：视频特效模板均自带背景音乐。用户实测至少7个模板可用，建议逐个尝试
          </div>
        </div>
      </div>
    </div>
  );
};

export default KlingTemplateModal;
