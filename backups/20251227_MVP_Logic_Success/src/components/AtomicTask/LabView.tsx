import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TaskCard from '../Widgets/TaskCard';
import { AtomTask } from '../../types/index';
import { validateTask, ValidationResult } from '../../utils/taskValidation';
import { useTaskData } from '../../services/taskService';
import UserFeedback, { UserFeedbackData } from './UserFeedback';

// 加载组件
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = '加载中...' }) => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p className="loading-message">{message}</p>
  </div>
);

// 错误组件
const ErrorDisplay: React.FC<{ 
  error: string; 
  onRetry?: () => void; 
  onBack?: () => void;
}> = ({ error, onRetry, onBack }) => (
  <div className="error-container">
    <div className="error-icon">⚠️</div>
    <h3>加载失败</h3>
    <p className="error-message">{error}</p>
    <div className="error-actions">
      {onRetry && (
        <button className="retry-button" onClick={onRetry}>
          重试
        </button>
      )}
      {onBack && (
        <button className="back-button" onClick={onBack}>
          返回
        </button>
      )}
    </div>
  </div>
);

const LabView: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [submittedCode, setSubmittedCode] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  
  // 使用新的服务钩子
  const { task: currentTask, loading: taskLoading, error: taskError, refetch: refetchTask } = useTaskData(taskId || '');

  // 获取下一个任务信息
  const nextTaskInfo = useMemo(() => {
    if (!currentTask) return null;
    
    // 这里应该从任务路径服务获取，暂时使用模拟逻辑
    // 实际项目中应该从 useTaskPath 钩子获取
    return {
      id: `${currentTask.id}_next`,
      title: '下一个任务',
      category: currentTask.category
    };
  }, [currentTask]);

  const handleVerify = (content: string) => {
    if (!currentTask) return;
    
    setVerificationStatus('verifying');
    setSubmittedCode(content);
    setValidationResult(null);
    
    // 模拟验证过程
    setTimeout(() => {
      const result = validateTask(currentTask, content);
      setValidationResult(result);
      setVerificationStatus(result.isValid ? 'success' : 'failed');
      
      // 如果验证成功，导航到下一个任务
      if (result.isValid && nextTaskInfo) {
        setTimeout(() => {
          navigate(`/lab/${nextTaskInfo.id}`);
        }, 2000); // 增加到2秒，让用户有时间查看验证结果
      }
    }, 1500); // 增加到1.5秒，模拟真实的验证过程
  };

  const handleBackToPath = () => {
    if (currentTask && currentTask.pre_id) {
      navigate(`/path/${currentTask.pre_id}`);
    } else {
      navigate('/');
    }
  };

  const handleRetry = () => {
    setVerificationStatus('idle');
    setSubmittedCode('');
  };

  const handleTaskRetry = () => {
    refetchTask();
  };

  const handleFeedbackSubmitted = (feedback: UserFeedbackData) => {

    setShowFeedback(false);
    
    // 这里可以添加逻辑来根据反馈改进验证机制
    // 例如：调整验证规则的权重、添加新的检查项等
  };

  // 加载状态
  if (taskLoading) {
    return (
      <div className="lab-view-container">
        <LoadingSpinner message="正在加载任务数据..." />
      </div>
    );
  }

  // 错误状态
  if (taskError) {
    return (
      <div className="lab-view-container">
        <ErrorDisplay 
          error={taskError}
          onRetry={handleTaskRetry}
          onBack={handleBackToPath}
        />
      </div>
    );
  }

  // 任务不存在
  if (!currentTask) {
    return (
      <div className="lab-view-container">
        <ErrorDisplay 
          error="任务不存在或已被删除"
          onBack={handleBackToPath}
        />
      </div>
    );
  }

  return (
    <div className="lab-view-container">
      <div className="lab-view-header">
        <button className="back-button" onClick={handleBackToPath}>
          返回路径看板
        </button>
        <h2>执行实验室</h2>
      </div>
      
      <div className="lab-view-content">
        <div className="lab-view-layout">
          {/* 左侧：提示词复制区域 */}
          <div className="lab-prompt-section">
            <div className="prompt-header">
              <h3>提示词复制区</h3>
              <button 
                className="copy-prompt-button"
                onClick={() => {
                  const textArea = document.createElement('textarea');
                  textArea.value = currentTask.prompt;
                  document.body.appendChild(textArea);
                  textArea.select();
                  try {
                    document.execCommand('copy');
                  } catch (err) {
                    console.error('复制失败:', err);
                  }
                  document.body.removeChild(textArea);
                }}
              >
                复制提示词
              </button>
            </div>
            
            <div className="prompt-content">
              <h4>任务描述</h4>
              <p>{currentTask.content}</p>
              
              <h4>提示词口令</h4>
              <div className="prompt-code">
                <pre>{currentTask.prompt}</pre>
              </div>
            </div>
          </div>
          
          {/* 右侧：代码回传和存证区域 */}
          <div className="lab-code-section">
            <div className="code-header">
              <h3>代码回传槽</h3>
            </div>
            
            <div className="code-input-container">
              <textarea
                className="code-textarea"
                placeholder="请在此粘贴您的代码实现..."
                value={submittedCode}
                onChange={(e) => setSubmittedCode(e.target.value)}
                onPaste={(e) => handleVerify(e.clipboardData.getData('text'))}
                disabled={verificationStatus === 'verifying'}
              />
            </div>
            
            <div className="certification-section">
              <button 
                className="certify-button"
                onClick={() => handleVerify(submittedCode)}
                disabled={verificationStatus === 'verifying' || submittedCode.trim() === ''}
              >
                {verificationStatus === 'verifying' ? '验证中...' : '存证确认'}
              </button>
              
              {verificationStatus === 'success' && validationResult && (
                <div className="verification-success">
                  <div className="verification-header">
                    <span className="success-icon">✓</span>
                    <h4>验证通过！</h4>
                  </div>
                  <div className="verification-score">
                    <span>总体评分: </span>
                    <span className="score-value">{validationResult.score}/100</span>
                  </div>
                  {validationResult.suggestions.length > 0 && (
                    <div className="verification-suggestions">
                      <h5>改进建议:</h5>
                      <ul>
                        {validationResult.suggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="success-message">正在进入下一个任务...</p>
                </div>
              )}
              
              {verificationStatus === 'failed' && validationResult && (
                <div className="verification-failed">
                  <div className="verification-header">
                    <span className="failed-icon">✗</span>
                    <h4>验证失败</h4>
                  </div>
                  <div className="verification-score">
                    <span>总体评分: </span>
                    <span className="score-value">{validationResult.score}/100</span>
                  </div>
                  {validationResult.errorMessage && (
                    <p className="error-message">{validationResult.errorMessage}</p>
                  )}
                  <div className="verification-checks">
                    <h5>检查详情:</h5>
                    <div className="checks-list">
                      {validationResult.checks.map((check, index) => (
                        <div key={index} className={`check-item ${check.passed ? 'passed' : 'failed'}`}>
                          <span className="check-icon">{check.passed ? '✓' : '✗'}</span>
                          <span className="check-name">{check.name}</span>
                          <span className="check-score">({check.score}/{check.maxScore})</span>
                          <span className="check-message">{check.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="verification-actions">
                    <button onClick={handleRetry} className="retry-button">
                      重新提交
                    </button>
                  </div>
                </div>
              )}

              {/* 用户反馈组件 */}
              {validationResult && (
                <div className="feedback-section">
                  <UserFeedback 
                    validationResult={validationResult}
                    taskId={taskId || ''}
                    onFeedbackSubmitted={handleFeedbackSubmitted}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabView;