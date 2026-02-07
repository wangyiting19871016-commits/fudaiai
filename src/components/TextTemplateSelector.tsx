/**
 * 文案模板选择器
 * 用于快速选择预设的祝福文案
 */

import React from 'react';
import { Modal } from 'antd';
import { TEXT_TEMPLATES, type TextTemplate } from '../configs/festival/voicePresets';
import '../styles/text-template-selector.css';

interface TextTemplateSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (text: string) => void;
}

const TextTemplateSelector: React.FC<TextTemplateSelectorProps> = ({
  visible,
  onClose,
  onSelect
}) => {
  const handleSelect = (template: TextTemplate) => {
    onSelect(template.text);
    onClose();
  };

  return (
    <Modal
      title="快速文案模板"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      className="text-template-selector-modal"
    >
      <div className="text-template-selector">
        <div className="template-grid">
          {TEXT_TEMPLATES.map(template => (
            <div
              key={template.id}
              className="template-card"
              onClick={() => handleSelect(template)}
            >
              <div className="template-label">{template.label}</div>
              <div className="template-text">{template.text}</div>
              <div className="template-length">{template.text.length}字</div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default TextTemplateSelector;
