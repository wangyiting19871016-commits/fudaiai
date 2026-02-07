import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ZJFullscreenLoader from './components/ZJFullscreenLoader';
import { missionExecutor, MissionProgress } from '../../services/MissionExecutor';
import { BackButton } from '../../components/BackButton';
import { HomeButton } from '../../components/HomeButton';
import '../../styles/festival-design-system.css';
import '../../styles/festival-fortune-glass.css';

/**
 * 🎴 运势抽卡专用页面
 * 无需上传照片，直接点击抽卡
 */

type Stage = 'ready' | 'drawing' | 'generating' | 'complete' | 'error';

const FortunePage: React.FC = () => {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>('ready');
  const [progress, setProgress] = useState<number>(0);
  const [narrativeTexts, setNarrativeTexts] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleDrawFortune = async () => {
    setStage('drawing');
    
    // 抽卡动画（1秒）
    setTimeout(async () => {
      setStage('generating');
      
      try {
        const result = await missionExecutor.execute(
          missionId || 'M7',
          {},
          (progressData: MissionProgress) => {
            setProgress(progressData.progress);
            if (progressData.message) {
              setNarrativeTexts(prev => [...prev, progressData.message]);
            }
          }
        );

        console.log('[FortunePage] 生成完成:', result);
        setStage('complete');

        // 跳转结果页
        setTimeout(() => {
          navigate(`/festival/result/${result.taskId}`);
        }, 1000);

      } catch (error: any) {
        console.error('[FortunePage] 生成失败:', error);
        setErrorMessage(error.message || '生成失败，请重试');
        setStage('error');
      }
    }, 1000);
  };

  return (
    <div className="festival-layout">
      <div className="fortune-page">
        {/* 顶部导航 */}
        <div className="fortune-header">
          <BackButton />
          <h1 className="fortune-title">运势抽卡</h1>
          <HomeButton />
        </div>

        {/* 主内容区 */}
        <div className="fortune-content">
          {stage === 'ready' && (
            <div className="fortune-ready">
              <div className="fortune-card-stack">
                <div className="card-back card-1"></div>
                <div className="card-back card-2"></div>
                <div className="card-back card-3"></div>
              </div>
              
              <h2 className="fortune-prompt">抽一张马年运势卡</h2>
              <p className="fortune-desc">测测你的2026运势</p>
              
              <button className="fortune-draw-btn" onClick={handleDrawFortune}>
                <span className="btn-text">抽取运势</span>
              </button>

              <div className="fortune-tips">
                <p>每日免费3次</p>
              </div>
            </div>
          )}

          {stage === 'drawing' && (
            <div className="fortune-drawing">
              <div className="card-flip-animation"></div>
              <p className="drawing-text">正在抽取运势...</p>
            </div>
          )}

          {(stage === 'generating' || stage === 'complete') && (
            <ZJFullscreenLoader
              progress={progress}
              stage="generating"
            />
          )}

          {stage === 'error' && (
            <div className="fortune-error">
              <div className="error-icon">×</div>
              <h3>生成失败</h3>
              <p>{errorMessage}</p>
              <button className="retry-btn" onClick={() => setStage('ready')}>
                重新抽取
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FortunePage;
