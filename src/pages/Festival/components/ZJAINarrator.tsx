import React, { useEffect, useState } from 'react';

/**
 * 🧬 ZJ-AI-Narrator - 加载叙事组件
 * 
 * 功能：
 * - 显示Qwen-VL的DNA提取标签（带气泡动画）
 * - 显示FLUX生成的叙事文案
 * - 进度条模拟
 * 
 * 总设计师要求的"动态反馈链条"：
 * - DNA阶段：每个标签以气泡形式弹出
 * - 生成阶段：叙事文案逐行显示
 */

interface ZJAINarratorProps {
  stage: 'dna' | 'generation' | 'complete';
  dnaResults?: string[];         // ["检测到：高丸子头", "检测到：圆脸型"]
  narrativeTexts?: string[];     // ["正在寻找皮克斯光影..."]
  progress: number;              // 0-100
}

const ZJAINarrator: React.FC<ZJAINarratorProps> = ({
  stage,
  dnaResults = [],
  narrativeTexts = [],
  progress
}) => {
  const [visibleDNA, setVisibleDNA] = useState<string[]>([]);
  const [visibleNarratives, setVisibleNarratives] = useState<string[]>([]);

  // DNA标签逐个显示
  useEffect(() => {
    if (stage === 'dna' && dnaResults.length > visibleDNA.length) {
      const timer = setTimeout(() => {
        setVisibleDNA(dnaResults.slice(0, visibleDNA.length + 1));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [stage, dnaResults, visibleDNA.length]);

  // 叙事文案逐个显示
  useEffect(() => {
    if (stage === 'generation' && narrativeTexts.length > visibleNarratives.length) {
      const timer = setTimeout(() => {
        setVisibleNarratives(narrativeTexts.slice(0, visibleNarratives.length + 1));
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [stage, narrativeTexts, visibleNarratives.length]);

  return (
    <div className="zj-narrator">
      <div className="zj-narrator-container">
        {/* DNA提取阶段 */}
        {stage === 'dna' && (
          <div className="zj-narrator-section">
            <div className="zj-narrator-title">
              🧬 DNA 提取中...
            </div>
            <div className="zj-narrator-divider" />
            
            <div className="zj-narrator-dna-list">
              {visibleDNA.map((dna, index) => (
                <div
                  key={index}
                  className="zj-narrator-dna-bubble"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  ✓ {dna}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 生成阶段 */}
        {stage === 'generation' && (
          <div className="zj-narrator-section">
            <div className="zj-narrator-title">
              ✨ 真迹生成中...
            </div>
            <div className="zj-narrator-divider" />
            
            <div className="zj-narrator-narrative-list">
              {visibleNarratives.map((text, index) => (
                <div
                  key={index}
                  className="zj-narrator-narrative-item"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 进度条 */}
        <div className="zj-narrator-progress-wrapper">
          <div className="zj-narrator-progress-bar">
            <div
              className="zj-narrator-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="zj-narrator-progress-text">
            {progress}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZJAINarrator;
