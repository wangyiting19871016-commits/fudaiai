/**
 * 🔮 赛博算命页面（M8重构）
 *
 * 完全遵循 LabPage 的UI架构和风格
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { analyzeImageWithQwenVL } from '../../services/aliService';
import { fillPrompt } from '../../configs/festival/prompts';
import { generateFortuneCard, FortuneCardData } from '../../utils/fortuneCardCanvas';
import { MaterialService } from '../../services/MaterialService';
import type { MaterialAtom } from '../../types/material';
import ZJFullscreenLoader from './components/ZJFullscreenLoader';
import { BackButton } from '../../components/BackButton';
import { HomeButton } from '../../components/HomeButton';
import { FestivalButton, FestivalButtonGroup } from '../../components/FestivalButton';
import '../../styles/festival-design-system.css';
import '../../styles/festival-lab-glass.css';

type Stage = 'upload' | 'analyzing' | 'result';

const FortuneCardPage: React.FC = () => {
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>('upload');
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [fortuneCard, setFortuneCard] = useState<string>('');
  const [fortuneData, setFortuneData] = useState<FortuneCardData | null>(null);

  // 幽默的无人物回复
  const NO_PERSON_RESPONSES = [
    '阿猫阿狗无法占卜，来个正常人类',
    '师傅只给人算命，不给灵异生物算',
    '检测到一股神秘气息...请换张有人的照片',
    '这是什么物种？建议去宠物医院',
    '您是隐身人吗？麻烦现个身',
    'AI表示：我只认识碳基生物',
    '这张照片太抽象，我参悟不透',
    '照片里啥也没有，您是在考验我吗'
  ];

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      message.error('请上传图片文件');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      message.error('图片大小不能超过10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 实时扫脸
  const handleLiveScan = async () => {
    try {
      // 调用摄像头
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });

      // 创建video元素捕获画面
      const video = document.createElement('video');
      video.srcObject = stream;
      video.style.position = 'fixed';
      video.style.top = '0';
      video.style.left = '0';
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      video.style.zIndex = '10000';
      document.body.appendChild(video);

      await video.play();

      // 等待1.5秒让用户准备
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 捕获照片
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
      }
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.9);

      // 关闭摄像头和移除video元素
      stream.getTracks().forEach(track => track.stop());
      document.body.removeChild(video);

      // 设置照片并开始算命
      setUploadedImage(photoDataUrl);
      message.success('照片捕获成功！');

      // 自动开始算命
      setTimeout(() => {
        handleStartFortuneTelling();
      }, 500);

    } catch (error) {
      console.error('[FortunePage] 扫脸失败:', error);
      message.error('无法访问摄像头，请检查权限设置');
    }
  };

  // 开始算命
  const handleStartFortuneTelling = async () => {
    if (!uploadedImage) {
      message.error('请先上传照片');
      return;
    }

    try {
      setStage('analyzing');
      setProgress(0);

      // Step 1: QWEN-VL 面相分析
      setProgressMessage('正在分析面相特征...');
      setProgress(20);

      const qwenPrompt = fillPrompt('qwen_face_analysis', {});
      const qwenResult = await analyzeImageWithQwenVL({
        images: [uploadedImage],
        prompt: qwenPrompt,
        maxTokens: 800,
        temperature: 0.3
      });

      if (!qwenResult.success || !qwenResult.result) {
        throw new Error('面相分析失败');
      }

      const faceAnalysis = typeof qwenResult.result === 'string'
        ? qwenResult.result
        : qwenResult.result.description || '';

      // ✅ 检测是否有人物
      if (faceAnalysis.includes('NO_PERSON_DETECTED') ||
          faceAnalysis.includes('没有人物') ||
          faceAnalysis.includes('未检测到人') ||
          faceAnalysis.includes('看不清人')) {

        // 随机选一个幽默回复
        const randomResponse = NO_PERSON_RESPONSES[
          Math.floor(Math.random() * NO_PERSON_RESPONSES.length)
        ];

        message.error(randomResponse, 3);
        setStage('upload');
        return;
      }

      setProgress(50);

      // Step 2: DeepSeek 命理生成
      setProgressMessage('算命大师解读中...');

      const deepseekPrompt = fillPrompt('cyber_fortune', {
        face_analysis: faceAnalysis
      });

      const response = await fetch('/api/deepseek/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // Authorization由后端处理
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: deepseekPrompt },
            { role: 'user', content: '请根据以上面相特征生成命理分析' }
          ],
          temperature: 0.85,
          max_tokens: 500,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error('命理生成失败');
      }

      const deepseekResult = await response.json();
      const fortuneDataRaw = deepseekResult.choices?.[0]?.message?.content;

      if (!fortuneDataRaw) {
        throw new Error('命理数据为空');
      }

      const fortuneDataParsed: FortuneCardData = JSON.parse(fortuneDataRaw);
      setFortuneData(fortuneDataParsed);

      setProgress(80);

      // Step 3: 渲染卡片
      setProgressMessage('生成命理卡片...');
      const cardDataUrl = await generateFortuneCard(fortuneDataParsed);
      setFortuneCard(cardDataUrl);

      setProgress(100);
      setStage('result');

      message.success('算命完成！');

    } catch (error) {
      console.error('[FortuneCard] 错误:', error);
      message.error(error instanceof Error ? error.message : '算命失败');
      setStage('upload');
    }
  };

  // 保存到我的作品
  const handleSaveToLibrary = () => {
    if (!fortuneCard || !fortuneData) return;

    const material: MaterialAtom = {
      id: `fortune_card_${Date.now()}`,
      type: 'image',
      data: {
        url: fortuneCard,
        text: fortuneData.keyword
      },
      metadata: {
        featureId: 'M8',
        featureName: '赛博算命',
        createdAt: Date.now(),
        dimensions: { width: 768, height: 1024 },
        thumbnail: fortuneCard
      },
      connectors: {
        roles: ['posterImage', 'fortuneCard'],
        canCombineWith: ['text', 'audio']
      }
    };

    MaterialService.saveMaterial(material);
    message.success('已保存到我的作品！');
  };

  // 下载卡片
  const handleDownload = () => {
    if (!fortuneCard) return;

    const link = document.createElement('a');
    link.download = `赛博算命_${fortuneData?.keyword}_${Date.now()}.png`;
    link.href = fortuneCard;
    link.click();
  };

  return (
    <div className="festival-lab-modern">
      {/* 动态背景 */}
      <div className="lab-background-modern">
        <div className="lab-grid-pattern"></div>
        <div className="lab-glow-effect"></div>
      </div>

      {/* 顶部导航 */}
      <div className="lab-top-nav">
        <BackButton />
        <div style={{ flex: 1 }}></div>
        <HomeButton />
      </div>

      {/* 主内容容器 */}
      <div className="lab-content-container">

        {/* 上传阶段 */}
        {stage === 'upload' && (
          <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
            {/* 标题 */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--cny-red-500)', marginBottom: '8px' }}>
                赛博算命
              </h1>
              <p style={{ fontSize: '16px', color: 'var(--cny-gray-600)' }}>
                上传照片，看面相测运势
              </p>
            </div>

            {/* 上传区域 */}
            {!uploadedImage ? (
              <>
                <label style={{
                  display: 'block',
                  width: '100%',
                  padding: '60px 20px',
                  border: '2px dashed rgba(229, 57, 53, 0.3)',
                  borderRadius: '12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  background: 'var(--glass-light)',
                  backdropFilter: 'blur(10px)',
                  marginBottom: '16px'
                }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}></div>
                  <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#000' }}>
                    点击上传照片
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    支持 JPG、PNG 格式，最大 10MB
                  </div>
                </label>

                {/* 实时扫脸按钮 */}
                <button
                  onClick={handleLiveScan}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: 'linear-gradient(135deg, #9C27B0, #7B1FA2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(156, 39, 176, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span>实时扫脸算命</span>
                </button>
              </>
            ) : (
              <div>
                <img
                  src={uploadedImage}
                  alt="预览"
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    borderRadius: '12px',
                    display: 'block',
                    margin: '0 auto 20px'
                  }}
                />
                <FestivalButtonGroup direction="horizontal" gap={12} style={{ justifyContent: 'center' }}>
                  <FestivalButton
                    onClick={handleStartFortuneTelling}
                    variant="primary"
                    size="large"
                  >
                    开始算命
                  </FestivalButton>
                  <FestivalButton
                    onClick={() => setUploadedImage('')}
                    variant="secondary"
                    size="large"
                  >
                    重新上传
                  </FestivalButton>
                </FestivalButtonGroup>
              </div>
            )}
          </div>
        )}

        {/* 分析中 */}
        {stage === 'analyzing' && (
          <ZJFullscreenLoader
            stage="generating"
            message={progressMessage}
            progress={progress}
          />
        )}

        {/* 结果展示 */}
        {stage === 'result' && fortuneCard && (
          <div style={{
            maxWidth: '100%',
            width: '100%',
            margin: '0 auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: 'calc(100vh - 60px)'
          }}>
            {/* 卡片 - 大幅增大显示 */}
            <img
              src={fortuneCard}
              alt="命理卡片"
              style={{
                width: '95%',
                maxWidth: '750px',
                borderRadius: '20px',
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.4)',
                marginBottom: '24px'
              }}
            />

            {/* 操作按钮组 */}
            <div style={{
              width: '90%',
              maxWidth: '500px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {/* 生成春联海报按钮 - 主要操作 */}
              {fortuneData && (
                <button
                  onClick={() => navigate('/festival/category/blessing', {
                    state: { keyword: fortuneData.keyword }
                  })}
                  style={{
                    padding: '14px',
                    fontSize: '16px',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(255, 215, 0, 0.4)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 215, 0, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 215, 0, 0.4)';
                  }}
                >
                  用「{fortuneData.keyword}」生成春联海报
                </button>
              )}

              {/* 次要操作 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={handleSaveToLibrary}
                  style={{
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: 'var(--glass-light)',
                    color: '#000',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.95)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--glass-light)'}
                >
                  保存作品
                </button>
                <button
                  onClick={handleDownload}
                  style={{
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: 'var(--glass-light)',
                    color: '#000',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.95)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--glass-light)'}
                >
                  保存图片
                </button>
              </div>

              <button
                onClick={() => {
                  setUploadedImage('');
                  setFortuneCard('');
                  setFortuneData(null);
                  setStage('upload');
                }}
                style={{
                  padding: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  background: 'transparent',
                  color: '#666',
                  border: '1px dashed rgba(0,0,0,0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.4)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)'}
              >
                再算一次
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default FortuneCardPage;
