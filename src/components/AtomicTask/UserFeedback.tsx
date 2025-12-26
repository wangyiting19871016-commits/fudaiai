import React, { useState } from 'react';
import { ValidationResult } from '../../utils/taskValidation';

interface UserFeedbackProps {
  validationResult: ValidationResult;
  taskId: string;
  onFeedbackSubmitted?: (feedback: UserFeedbackData) => void;
}

export interface UserFeedbackData {
  taskId: string;
  validationScore: number;
  accuracyRating: number; // 1-5 评分
  difficultyRating: number; // 1-5 评分
  feedbackText?: string;
  suggestions?: string[];
  timestamp: Date;
  validationId: string;
}

interface FeedbackFormData {
  accuracyRating: number;
  difficultyRating: number;
  feedbackText: string;
  suggestions: string[];
}

const UserFeedback: React.FC<UserFeedbackProps> = ({ 
  validationResult, 
  taskId, 
  onFeedbackSubmitted 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState<FeedbackFormData>({
    accuracyRating: 3,
    difficultyRating: 3,
    feedbackText: '',
    suggestions: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleRatingChange = (field: 'accuracyRating' | 'difficultyRating', value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSuggestionToggle = (suggestion: string) => {
    setFormData(prev => ({
      ...prev,
      suggestions: prev.suggestions.includes(suggestion)
        ? prev.suggestions.filter(s => s !== suggestion)
        : [...prev.suggestions, suggestion]
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const feedbackData: UserFeedbackData = {
        taskId,
        validationScore: validationResult.score,
        accuracyRating: formData.accuracyRating,
        difficultyRating: formData.difficultyRating,
        feedbackText: formData.feedbackText,
        suggestions: formData.suggestions,
        timestamp: new Date(),
        validationId: validationResult.id
      };

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 保存到本地存储（实际项目中应该发送到后端）
      const existingFeedback = JSON.parse(localStorage.getItem('userFeedback') || '[]');
      existingFeedback.push(feedbackData);
      localStorage.setItem('userFeedback', JSON.stringify(existingFeedback));
      
      setSubmitted(true);
      onFeedbackSubmitted?.(feedbackData);
    } catch (error) {
      console.error('提交反馈失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const predefinedSuggestions = [
    '验证规则太严格',
    '验证规则不够全面',
    '缺少某些检查项',
    '错误提示不够清晰',
    '验证速度太慢',
    '界面交互需要改进',
    '功能建议',
    '其他'
  ];

  if (submitted) {
    return (
      <div className="feedback-success">
        <div className="feedback-success-icon">✅</div>
        <h3>感谢您的反馈！</h3>
        <p>您的意见将帮助我们改进验证系统</p>
        <button 
          className="close-feedback-button"
          onClick={() => setIsExpanded(false)}
        >
          关闭
        </button>
      </div>
    );
  }

  return (
    <div className="user-feedback-container">
      {!isExpanded ? (
        <button 
          className="feedback-toggle-button"
          onClick={() => setIsExpanded(true)}
        >
          💭 反馈与建议
        </button>
      ) : (
        <div className="feedback-form">
          <div className="feedback-header">
            <h3>📝 验证结果反馈</h3>
            <button 
              className="close-button"
              onClick={() => setIsExpanded(false)}
            >
              ✕
            </button>
          </div>

          <div className="feedback-content">
            {/* 验证准确性评分 */}
            <div className="feedback-section">
              <label className="feedback-label">
                验证结果准确性评分 (1-5分)
              </label>
              <div className="rating-group">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    className={`rating-button ${formData.accuracyRating >= rating ? 'active' : ''}`}
                    onClick={() => handleRatingChange('accuracyRating', rating)}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            {/* 任务难度评分 */}
            <div className="feedback-section">
              <label className="feedback-label">
                任务难度评分 (1-5分)
              </label>
              <div className="rating-group">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    className={`rating-button ${formData.difficultyRating >= rating ? 'active' : ''}`}
                    onClick={() => handleRatingChange('difficultyRating', rating)}
                  >
                    🔥
                  </button>
                ))}
              </div>
            </div>

            {/* 预设建议选项 */}
            <div className="feedback-section">
              <label className="feedback-label">
                您希望改进的方面（可多选）
              </label>
              <div className="suggestions-grid">
                {predefinedSuggestions.map(suggestion => (
                  <button
                    key={suggestion}
                    className={`suggestion-button ${formData.suggestions.includes(suggestion) ? 'active' : ''}`}
                    onClick={() => handleSuggestionToggle(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* 详细反馈文本 */}
            <div className="feedback-section">
              <label className="feedback-label">
                详细意见或建议
              </label>
              <textarea
                className="feedback-textarea"
                placeholder="请分享您的具体意见和改进建议..."
                value={formData.feedbackText}
                onChange={(e) => setFormData(prev => ({ ...prev, feedbackText: e.target.value }))}
                rows={4}
              />
            </div>

            {/* 验证结果摘要 */}
            <div className="validation-summary">
              <h4>本次验证结果摘要</h4>
              <div className="summary-stats">
                <div className="stat-item">
                  <span className="stat-label">总体评分:</span>
                  <span className="stat-value">{validationResult.score}/100</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">检查项目:</span>
                  <span className="stat-value">{validationResult.checks.length}项</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">通过率:</span>
                  <span className="stat-value">
                    {Math.round((validationResult.checks.filter(c => c.passed).length / validationResult.checks.length) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="feedback-actions">
              <button 
                className="submit-feedback-button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? '提交中...' : '提交反馈'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserFeedback;