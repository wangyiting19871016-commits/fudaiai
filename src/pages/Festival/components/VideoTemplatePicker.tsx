import React, { useState } from 'react';
import { VIDEO_TEMPLATES, VideoTemplate } from '../../../configs/festival/videoTemplates';

interface VideoTemplatePickerProps {
  selectedId: string;
  onSelect: (template: VideoTemplate) => void;
}

/**
 * 视频模板选择器组件
 */
const VideoTemplatePicker: React.FC<VideoTemplatePickerProps> = ({
  selectedId,
  onSelect
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="video-template-picker">
      <h3 className="picker-title">选择视频风格</h3>
      <div className="template-grid">
        {VIDEO_TEMPLATES.map((template) => (
          <div
            key={template.id}
            className={`template-card ${selectedId === template.id ? 'selected' : ''} ${hoveredId === template.id ? 'hovered' : ''}`}
            onClick={() => onSelect(template)}
            onMouseEnter={() => setHoveredId(template.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* 预览区域 */}
            <div
              className="template-preview"
              style={{
                background: template.background.type === 'gradient'
                  ? template.background.value.replace('linear-gradient', 'linear-gradient')
                  : template.background.value
              }}
            >
              <span className="template-icon">{template.icon}</span>
              {selectedId === template.id && (
                <div className="selected-badge">✓</div>
              )}
            </div>

            {/* 模板信息 */}
            <div className="template-info">
              <div className="template-name">{template.name}</div>
              <div className="template-desc">{template.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoTemplatePicker;
