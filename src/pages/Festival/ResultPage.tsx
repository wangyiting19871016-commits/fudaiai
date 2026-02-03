import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { MissionExecutor, MissionResult } from '../../services/MissionExecutor';
import { addWatermark } from '../../utils/addWatermark';
import { MaterialService } from '../../services/MaterialService';
import { ContinueCreationPanel } from '../../components/ContinueCreationPanel';
import type { MaterialAtom } from '../../types/material';
import { createNavigationState, type NavigationState } from '../../types/navigationState';
import '../../styles/festival-design-system.css';
import '../../styles/festival-result-glass.css';

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
  const [shareCardUrl, setShareCardUrl] = useState<string>(''); // 分享海报URL
  const [showShareModal, setShowShareModal] = useState(false); // 是否显示分享弹窗
  const [currentMaterial, setCurrentMaterial] = useState<MaterialAtom | null>(null); // 当前素材
  const [isSaved, setIsSaved] = useState(false); // 是否已保存到素材库
  const [showDownloadModal, setShowDownloadModal] = useState(false); // 显示下载引导

  useEffect(() => {
    // 自动清理过期任务（7天前的）
    try {
      MissionExecutor.cleanupExpiredTasks(7);
    } catch (error) {
      console.error('[Festival Result] 清理过期任务失败:', error);
    }

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

  // 创建素材原子（但不自动保存）
  useEffect(() => {
    if (!result || !imageLoaded) return;

    // 创建素材原子
    const material: MaterialAtom = {
      id: `material_${result.taskId}_${Date.now()}`,
      type: 'image',
      data: {
        url: result.comparisonImage || result.image,
      },
      metadata: {
        dimensions: { width: 1024, height: 1024 }, // 默认尺寸，实际可以从图片获取
        createdAt: Date.now(),
        featureId: result.metadata?.missionId || 'unknown',
        featureName: getFeatureName(result.metadata?.missionId),
        thumbnail: result.image,
      },
      connectors: {
        roles: ['posterImage', 'videoImage'],
        canCombineWith: ['couplet', 'text', 'audio'],
      },
    };

    setCurrentMaterial(material);
    console.log('[ResultPage] 素材原子已创建，等待用户保存:', material.id);
  }, [result, imageLoaded]);

  // 获取功能名称（显示用）
  const getFeatureName = (featureId?: string): string => {
    const nameMap: Record<string, string> = {
      M1: '动画头像',
      M2: '财神变身',
      M3: '情侣合照',
      M6: '老照片修复',
      M7: '运势抽卡',
      M11: '隐形文字',
    };
    return nameMap[featureId || ''] || '创作作品';
  };

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
            <div className="loading-text">真迹生成中，请稍候...</div>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    if (!currentMaterial) {
      message.error('素材未准备好，请稍候');
      return;
    }

    if (isSaved) {
      message.info('作品已保存到素材库');
      return;
    }

    try {
      // 保存到素材库
      MaterialService.saveMaterial(currentMaterial);
      setIsSaved(true);
      console.log('[ResultPage] 素材已保存到素材库:', currentMaterial.id);

      message.success({
        content: '✅ 已保存到【我的作品】',
        duration: 2,
      });
    } catch (error) {
      console.error('[ResultPage] 保存素材失败:', error);
      message.error('保存失败，请重试');
    }
  };

  const handleVoice = () => {
    // 跳转到语音贺卡页面，传递NavigationState
    const navState = createNavigationState({
      image: result?.image || '',
      text: result?.caption || '',
      originalCaption: result?.caption || '',
      textSource: 'caption',
      sourceFeatureId: 'result-page',
      sourcePagePath: '/festival/result',
    });

    navigate('/festival/voice', { state: navState });
  };

  const handleVideo = () => {
    // 跳转到视频生成页面，传递NavigationState
    const navState = createNavigationState({
      image: result?.image,
      text: result?.caption,
      originalCaption: result?.caption,
      textSource: 'caption',
      sourceFeatureId: 'result-page',
      sourcePagePath: '/festival/result',
    });

    navigate(`/festival/video/${taskId}`, { state: navState });
  };

  const handleShare = async () => {
    if (!result) return;

    try {
      // TODO: 检查用户是否VIP
      const isVIP = false;

      message.loading({ content: '正在生成分享图片...', key: 'share', duration: 0 });

      let imageToShare = result.comparisonImage || result.image;

      // 免费用户：添加水印
      if (!isVIP) {
        console.log('[Share] 免费用户，添加水印');
        imageToShare = await addWatermark(imageToShare, {
          text: '福袋AI制作'
          // qrCodeUrl: 部署后添加真实二维码URL
        });
      } else {
        console.log('[Share] VIP用户，无水印');
      }

      // 将DataURL转为Blob URL（更容易被浏览器识别，长按成功率更高）
      const response = await fetch(imageToShare);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      message.destroy('share');

      // 显示弹窗让用户长按保存
      setShareCardUrl(blobUrl);
      setShowShareModal(true);

    } catch (error: any) {
      message.destroy('share');
      console.error('[Festival Result] 分享图片生成失败:', error);
      message.error('生成失败，请重试');
    }
  };

  const handleSystemShare = async () => {
    console.log('[Share] 按钮被点击');

    if (!shareCardUrl) {
      console.error('[Share] shareCardUrl为空');
      return;
    }

    // 检查是否支持Web Share API
    if (!navigator.share || !navigator.canShare) {
      console.log('[Share] 不支持Web Share API');
      message.info({
        content: '💡 请长按上方图片，选择"保存图片"',
        duration: 3,
      });
      return;
    }

    try {
      console.log('[Share] 开始调用系统分享');

      // 将Blob URL转换为File对象
      const response = await fetch(shareCardUrl);
      const blob = await response.blob();
      const fileName = `福袋AI_新年海报_${result?.taskId || Date.now()}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // 检查是否可以分享文件
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: '福袋AI - 新年专属形象',
          text: '快来看看我的新年专属形象！',
          files: [file]
        });

        // 分享成功
        console.log('[Share] 分享成功');
        message.success({
          content: '✅ 操作成功！图片已保存到相册',
          duration: 3,
        });
        setTimeout(() => setShowShareModal(false), 1500);
      } else {
        console.log('[Share] 浏览器不支持分享文件');
        message.info({
          content: '💡 请长按上方图片，选择"保存图片"',
          duration: 3,
        });
      }
    } catch (error: any) {
      // 用户取消
      if (error.name === 'AbortError') {
        console.log('[Share] 用户取消分享');
        return;
      } else {
        console.error('[Share] 系统分享失败:', error);
        message.warning({
          content: '💡 请长按上方图片，选择"保存图片"',
          duration: 3,
        });
      }
    }
  };

  const handleDownloadPoster = () => {
    if (!shareCardUrl) return;

    const fileName = `福袋AI_新年海报_${result?.taskId || Date.now()}.png`;

    // 显示下载中提示
    message.loading({ content: '正在下载...', key: 'download', duration: 0 });

    // 下载图片
    const link = document.createElement('a');
    link.href = shareCardUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 延迟显示成功提示（确保下载已开始）
    setTimeout(() => {
      message.destroy('download');

      // 显示详细的成功提示
      message.success({
        content: (
          <div style={{ textAlign: 'left', lineHeight: '1.6' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>✅ 保存成功！</div>
            <div style={{ fontSize: '13px', color: '#666' }}>
              📁 保存位置：手机 → 文件管理器 → 下载文件夹
            </div>
            <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
              📝 文件名：{fileName}
            </div>
            <div style={{ fontSize: '13px', color: '#E53935', marginTop: '8px', fontWeight: 'bold' }}>
              💡 打开文件管理器 → 下载文件夹 → 分享到微信
            </div>
          </div>
        ),
        duration: 8,
      });

      // 延迟关闭弹窗
      setTimeout(() => {
        setShowShareModal(false);
      }, 1500);
    }, 500);
  };

  // 检测是否为微信浏览器
  const isWeChat = /MicroMessenger/i.test(navigator.userAgent);

  // 检测是否支持系统分享
  const canSystemShare = navigator.share && navigator.canShare;

  const handleRegenerate = () => {
    const missionId = result?.metadata?.missionId;

    // M7运势抽卡：返回运势页
    if (missionId === 'M7') {
      navigate(`/festival/fortune/${missionId}`);
      return;
    }

    // 有模板的任务（M2, M3, M4）：返回模板选择页
    const tasksWithTemplate = ['M2', 'M3', 'M4'];
    if (tasksWithTemplate.includes(missionId || '')) {
      navigate(`/festival/template-select/${missionId}`);
      return;
    }

    // 其他任务：返回实操页（M1直接上传，M6老照片修复）
    navigate(`/festival/lab/${missionId}`);
  };

  const handleChangeTask = () => {
    // 返回福境入口（主页）
    navigate('/festival/home');
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
              <div className="loading-message">正在加载真迹...</div>
            </div>
          )}
          <img
            src={getCurrentImage()}
            alt="Generated"
            className={`festival-result-image ${imageLoaded ? 'loaded' : 'loading'}`}
            style={{
              opacity: imageLoaded ? 1 : 0,
              userSelect: 'auto',
              WebkitUserSelect: 'auto',
              WebkitTouchCallout: 'default'
            }}
          />
        </div>

        {/* 判词 */}
        {result.caption && (
          <div className="festival-result-caption">
            <div className="festival-result-caption-icon">💬</div>
            <div className="festival-result-caption-text">
              {result.caption}
            </div>
          </div>
        )}

        {/* 操作按钮 - 4个主按钮 */}
        <div className="festival-result-actions">
          {/* 主功能按钮 - 2x2网格 */}
          <div className="festival-result-main-buttons" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <button
              className="festival-result-btn festival-result-btn-primary"
              onClick={() => setShowDownloadModal(true)}
            >
              下载
            </button>
            <button
              className={`festival-result-btn ${isSaved ? 'festival-result-btn-secondary' : 'festival-result-btn-primary'}`}
              onClick={handleSave}
              style={{
                opacity: isSaved ? 0.7 : 1,
                cursor: isSaved ? 'default' : 'pointer'
              }}
            >
              {isSaved ? '✅ 已保存' : '💾 保存'}
            </button>
            <button
              className="festival-result-btn festival-result-btn-secondary"
              onClick={handleShare}
            >
              📤 分享
            </button>
            <button
              className="festival-result-btn festival-result-btn-secondary"
              onClick={handleRegenerate}
            >
              🔄 重生成
            </button>
          </div>

          {/* 保存提示 */}
          {isSaved && (
            <div style={{
              padding: '16px',
              background: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              borderRadius: '12px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', color: '#4CAF50', marginBottom: '8px' }}>
                ✅ 已保存到【我的作品】
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                可在【我的作品】中合成视频、配音等更多玩法
              </div>
              <button
                onClick={() => navigate('/festival/materials')}
                style={{
                  marginTop: '12px',
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                去我的作品 →
              </button>
            </div>
          )}

          {/* 导航按钮 */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '12px'
          }}>
            <button
              onClick={handleChangeTask}
              style={{
                padding: '10px 24px',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--cny-gray-700)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              🏠 回到首页
            </button>
          </div>
        </div>

        {/* 继续创作面板（保持玻璃态风格） */}
        {currentMaterial && (
          <ContinueCreationPanel currentMaterial={currentMaterial} />
        )}
      </div>

      {/* 下载引导弹窗 (H5移动端) */}
      {showDownloadModal && result && (
        <div className="festival-share-modal" onClick={() => setShowDownloadModal(false)}>
          <div className="festival-share-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="festival-share-modal-header">
              <h3>💾 保存图片到相册</h3>
              <button className="festival-share-close-btn" onClick={() => setShowDownloadModal(false)}>
                ✕
              </button>
            </div>

            <div className="festival-share-poster-container">
              <img
                src={result.comparisonImage || result.image}
                alt="生成的图片"
                className="festival-share-poster-image"
                style={{
                  borderRadius: '12px',
                  userSelect: 'auto',
                  WebkitUserSelect: 'auto',
                  WebkitTouchCallout: 'default'
                }}
              />
            </div>

            {/* 保存提示 - 醒目 */}
            <div className="festival-share-tip" style={{
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              padding: '16px',
              borderRadius: '12px',
              marginTop: '16px'
            }}>
              <div className="festival-share-tip-icon" style={{ fontSize: '32px' }}>👆</div>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#000',
                marginBottom: '8px'
              }}>
                长按上方图片
              </div>
              <div style={{
                fontSize: '14px',
                color: '#333',
                lineHeight: '1.5'
              }}>
                在弹出菜单中选择「保存图片」或「添加到相册」
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 分享海报弹窗 */}
      {showShareModal && shareCardUrl && (
        <div className="festival-share-modal" onClick={() => setShowShareModal(false)}>
          <div className="festival-share-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="festival-share-modal-header">
              <h3>📤 分享到微信</h3>
              <button className="festival-share-close-btn" onClick={() => setShowShareModal(false)}>
                ✕
              </button>
            </div>

            <div className="festival-share-poster-container">
              <img src={shareCardUrl} alt="分享海报" className="festival-share-poster-image" />
            </div>

            {/* 保存提示 - 明显 */}
            <div className="festival-share-tip">
              <div className="festival-share-tip-icon">👆</div>
              <div className="festival-share-tip-text">长按图片保存到相册</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FestivalResultPage;
