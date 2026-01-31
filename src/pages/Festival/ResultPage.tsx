import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MissionExecutor, MissionResult } from '../../services/MissionExecutor';

/**
 * 🎁 真迹大礼包 (Result Page) - 春节H5结果页
 * 
 * 核心功能：
 * 1. 高清图片展示
 * 2. DeepSeek判词
 * 3. 多维度出口（保存、配音、分享、重新生成）
 * 4. 红包封面模式切换
 * 
 * ⚠️ 注意：这是全新的春节H5页面
 */

const FestivalResultPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<MissionResult | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showComparison, setShowComparison] = useState(true); // 默认展示对比图

  useEffect(() => {
    // 从 LocalStorage 获取任务结果
    if (taskId) {
      const savedResult = MissionExecutor.getResult(taskId);
      if (savedResult) {
        console.log('✅ [Festival Result] LocalStorage读取成功');
        console.log('[Festival Result] 结果包含对比图:', !!savedResult.comparisonImage);
        setResult(savedResult);
        setIsLoading(false);

        // 预加载图片（优先加载对比图）
        const imageToLoad = savedResult.comparisonImage || savedResult.image;
        const img = new Image();
        img.onload = () => {
          console.log('[Festival Result] 图片加载完成');
          setImageLoaded(true);
        };
        img.onerror = () => {
          console.error('[Festival Result] 图片加载失败');
          setImageLoaded(true);  // 即使失败也显示
        };
        img.src = imageToLoad;
      } else {
        console.error('❌ [Festival Result] LocalStorage读取失败，taskId:', taskId);
        console.error('可能原因：1) LocalStorage配额不足 2) 数据未保存 3) taskId错误');

        // 🔍 手机端调试：显示详细信息
        const allKeys = Object.keys(localStorage).filter(k => k.startsWith('festival_task_'));
        alert(`❌ 数据加载失败\ntaskId: ${taskId}\nLocalStorage中的任务: ${allKeys.length}个\n${allKeys.join('\n')}`);

        setIsLoading(false);
      }
    }
  }, [taskId]);

  // 骨架屏状态
  if (isLoading || !result) {
    return (
      <div className="festival-result">
        <div className="festival-result-container">
          <div className="result-skeleton">
            <div className="skeleton-image"></div>
            <div className="skeleton-caption"></div>
            <div className="skeleton-actions">
              <div className="skeleton-button"></div>
              <div className="skeleton-button"></div>
            </div>
            <div className="loading-text">✨ 真迹生成中，请稍候...</div>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    // TODO: 检查会员状态
    const isPaid = false; // 临时：默认非会员

    if (!isPaid) {
      // 弹出付费引导
      alert('🎁 开通会员享受完整功能\n\n✅ 保存无水印高清图\n✅ 下载完整视频\n✅ 无限次生成\n✅ 优先生成速度\n\n💎 ¥19.9 永久买断\n\n（付费功能开发中...）');
      return;
    }

    // 会员用户：直接下载
    console.log('[Festival Result] 下载图片:', result.image);
    const link = document.createElement('a');
    link.href = result.image;
    link.download = `福袋AI_${result.taskId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleVoice = () => {
    // 跳转到语音贺卡页面
    navigate(`/festival/voice/${taskId}`);
  };

  const handleVideo = () => {
    // 跳转到视频生成页面
    navigate(`/festival/video/${taskId}`, {
      state: {
        image: result?.image,
        caption: result?.caption,
        taskId: taskId
      }
    });
  };

  const handleShare = () => {
    // 社交分享（TODO: 集成分享SDK）
    console.log('[Festival Result] 分享');
    alert('分享功能开发中...');
  };

  const handleRegenerate = () => {
    // 返回实操页重新生成
    navigate(`/festival/lab/${result.metadata.missionId}`);
  };

  const handleChangeTask = () => {
    // 返回福境入口
    navigate(-1);
  };

  // 判断是否为老照片修复任务
  const isPhotoRestore = result?.metadata?.missionId === 'M6';
  const hasComparison = isPhotoRestore && result?.comparisonImage;

  // 获取当前显示的图片
  const getCurrentImage = () => {
    if (isPhotoRestore && hasComparison && showComparison) {
      return result.comparisonImage!;
    }
    return result?.image || '';
  };

  return (
    <div className="festival-result">
      <div className="festival-result-container">
        {/* 老照片修复：对比图切换按钮 */}
        {hasComparison && (
          <div className="festival-result-view-toggle">
            <button
              className={`view-toggle-btn ${showComparison ? 'active' : ''}`}
              onClick={() => setShowComparison(true)}
            >
              📊 对比图
            </button>
            <button
              className={`view-toggle-btn ${!showComparison ? 'active' : ''}`}
              onClick={() => setShowComparison(false)}
            >
              🖼️ 修复后
            </button>
          </div>
        )}

        {/* 图片展示 - 带加载状态 */}
        <div className="festival-result-image-wrapper">
          {!imageLoaded && (
            <div className="image-loading-overlay">
              <div className="loading-spinner"></div>
              <div className="loading-message">🎨 正在加载真迹...</div>
            </div>
          )}
          <img
            src={getCurrentImage()}
            alt="Generated"
            className={`festival-result-image ${imageLoaded ? 'loaded' : 'loading'}`}
            style={{ opacity: imageLoaded ? 1 : 0 }}
          />
        </div>

        {/* 判词 */}
        {result.caption && (
          <div className="festival-result-caption">
            <div className="festival-result-caption-icon">💬</div>
            <div className="festival-result-caption-text">
              {result.caption}
            </div>
            <div className="festival-result-caption-powered">
              - Powered by DeepSeek
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="festival-result-actions">
          {/* 主功能按钮 */}
          <div className="festival-result-main-buttons">
            <button
              className="festival-result-btn festival-result-btn-primary"
              onClick={handleSave}
            >
              💾 保存高清图
            </button>
            <button
              className="festival-result-btn festival-result-btn-secondary"
              onClick={handleShare}
            >
              📤 生成海报
            </button>
            <button
              className="festival-result-btn festival-result-btn-secondary"
              onClick={handleVoice}
            >
              🎙️ 配音版本
            </button>
            <button
              className="festival-result-btn festival-result-btn-secondary"
              onClick={handleVideo}
            >
              🎬 生成视频
            </button>
          </div>

          {/* 导航按钮（分离） */}
          <div className="festival-result-nav-buttons">
            <button
              className="festival-result-btn festival-result-btn-ghost"
              onClick={handleRegenerate}
            >
              🔄 重新生成
            </button>
            <button
              className="festival-result-btn festival-result-btn-ghost"
              onClick={handleChangeTask}
            >
              🏠 回到首页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FestivalResultPage;
