import React from 'react';

/**
 * 🚻 ZJ-Gender-Selector - 现代化性别选择组件
 * 
 * 功能：
 * - M1任务专用
 * - 现代化AI应用风格
 * - SVG图标 + 毛玻璃效果 + 动画反馈
 */

interface ZJGenderSelectorProps {
  onSelect: (gender: 'male' | 'female') => void;
  selected?: 'male' | 'female';
}

const ZJGenderSelector: React.FC<ZJGenderSelectorProps> = ({ onSelect, selected }) => {
  return (
    <div className="zj-gender-selector-modern">
      {/* 精简标题区 */}
      <div className="title-section-modern">
        <h2 className="page-title-modern">选择性别</h2>
      </div>
      
      {/* 性别选择卡片 */}
      <div className="gender-selection-modern">
        {/* 男生卡片 */}
        <div
          className={`gender-card-modern ${selected === 'male' ? 'selected' : ''}`}
          onClick={() => onSelect('male')}
        >
          <div className="checkmark-modern"></div>
          <div className="gender-icon-modern male">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="10" cy="8" r="4"/>
              <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <line x1="17" y1="3" x2="22" y2="8"/>
              <polyline points="22 3 22 8 17 8"/>
            </svg>
          </div>
          <div className="gender-label-modern">男生</div>
        </div>
        
        {/* 女生卡片 */}
        <div
          className={`gender-card-modern ${selected === 'female' ? 'selected' : ''}`}
          onClick={() => onSelect('female')}
        >
          <div className="checkmark-modern"></div>
          <div className="gender-icon-modern female">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4"/>
              <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
              <circle cx="12" cy="18" r="1.5" fill="currentColor"/>
            </svg>
          </div>
          <div className="gender-label-modern">女生</div>
        </div>
      </div>

      {/* 底部提示语 */}
      <div className="page-subtitle-modern">
        AI将生成更符合你气质的新年头像
      </div>
    </div>
  );
};

export default ZJGenderSelector;
