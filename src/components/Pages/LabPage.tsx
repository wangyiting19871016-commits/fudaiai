import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const LabPage: React.FC = () => {
  const navigate = useNavigate();
  const { stepId } = useParams<{ stepId: string }>();

  const handleBackToPath = () => {
    // 严格单向步进逻辑：只能返回到战备区，不能直接返回主页
    if (stepId) {
      // 从stepId中提取taskId (格式: taskId-stepIndex)
      const taskId = stepId.split('-')[0];
      navigate(`/path/${taskId}`);
    } else {
      // 如果没有stepId，回到默认的战备区
      navigate('/path/101');
    }
  };

  return (
    <div className="lab-page-container">
      {/* 返回路径按钮 - 严格单向步进 */}
      <div className="lab-page-header">
        <button 
          className="back-to-path-button"
          onClick={handleBackToPath}
        >
          ← 返回战备区
        </button>
        <h1 className="lab-page-title">实验室（第三屏）</h1>
        {stepId && <p className="lab-task-info">步骤ID: {stepId}</p>}
      </div>

      {/* 左右分屏的占位符 */}
      <div className="lab-page-content">
        {/* 左侧：提示词区 */}
        <div className="lab-left-section">
          <div className="lab-section-header">
            <h2>提示词区</h2>
          </div>
          <div className="lab-section-content">
            <div className="placeholder-content">
              <div className="placeholder-icon">💡</div>
              <p className="placeholder-text">
                这里将显示任务相关的提示词内容<br/>
                包括任务描述、执行步骤、技术要求等<br/>
                <span className="placeholder-note">当前为占位符状态</span>
              </p>
            </div>
          </div>
        </div>

        {/* 右侧：存证区 */}
        <div className="lab-right-section">
          <div className="lab-section-header">
            <h2>存证区</h2>
          </div>
          <div className="lab-section-content">
            <div className="placeholder-content">
              <div className="placeholder-icon">🔐</div>
              <p className="placeholder-text">
                这里将显示代码验证和存证功能<br/>
                包括代码输入、验证结果、存证记录等<br/>
                <span className="placeholder-note">当前为占位符状态</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabPage;