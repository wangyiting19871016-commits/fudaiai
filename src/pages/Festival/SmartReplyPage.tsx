/**
 * 💬 高情商回复页面（M10重构）
 *
 * 完全遵循 LabPage 的UI架构和风格
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { generateSmartReplyPrompt } from '../../configs/festival/smartReplyLibrary';
import { generateSmartReplyCard } from '../../utils/smartReplyCanvas';
import { MaterialService } from '../../services/MaterialService';
import type { MaterialAtom } from '../../types/material';
import '../../styles/festival-design-system.css';
import '../../styles/festival-lab-glass.css';

type Stage = 'input' | 'selecting' | 'fullscreen';

interface ReplyVersions {
  duiren: string;
  yougen: string;
  qingshang: string;
}

const SmartReplyPage: React.FC = () => {
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>('input');
  const [question, setQuestion] = useState<string>('');
  const [relation, setRelation] = useState<string>('远房亲戚');
  const [scene, setScene] = useState<string>('饭桌上');
  const [isGenerating, setIsGenerating] = useState(false);
  const [replies, setReplies] = useState<ReplyVersions | null>(null);
  const [selectedReply, setSelectedReply] = useState<string>('');
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [replyCard, setReplyCard] = useState<string>('');
  const [showMoreActions, setShowMoreActions] = useState(false);

  // 生成回复
  const handleGenerate = async () => {
    if (!question.trim()) {
      message.error('请输入对方说了什么');
      return;
    }

    try {
      setIsGenerating(true);

      // Step 1: DeepSeek 意图分类
      const classifyPrompt = `判断这属于哪个类别，只输出类别名称：
对方问：${question}

类别：催婚、催生、问工资、问对象、比孩子、其他

只输出类别名称，不要解释。`;

      const classifyResponse = await fetch('/api/deepseek/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: classifyPrompt }],
          temperature: 0.3,
          max_tokens: 20
        })
      });

      if (!classifyResponse.ok) {
        throw new Error('分类失败');
      }

      const classifyResult = await classifyResponse.json();
      const category = classifyResult.choices?.[0]?.message?.content?.trim() || '催婚';

      console.log('[SmartReply] 分类结果:', category);

      // Step 2: 使用金句库作为few-shot examples生成回复
      const prompt = generateSmartReplyPrompt(category, question, relation, scene);

      const response = await fetch('/api/deepseek/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.9,
          max_tokens: 200,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error('生成失败');
      }

      const result = await response.json();
      const repliesData = JSON.parse(result.choices?.[0]?.message?.content || '{}');

      setReplies(repliesData);
      setIsGenerating(false);
      setStage('selecting');

    } catch (error) {
      console.error('[SmartReply] 错误:', error);
      message.error(error instanceof Error ? error.message : '生成失败');
      setIsGenerating(false);
    }
  };

  // 选择版本并生成卡片
  const handleSelectVersion = async (replyText: string, versionName: string) => {
    try {
      setSelectedReply(replyText);
      setSelectedVersion(versionName);

      // 根据版本名称确定style
      let style: 'duiren' | 'yougen' | 'qingshang' = 'qingshang';
      if (versionName === '怼人版') style = 'duiren';
      else if (versionName === '有梗版') style = 'yougen';
      else if (versionName === '情商版') style = 'qingshang';

      // 渲染大字报
      const cardDataUrl = await generateSmartReplyCard({ text: replyText, style });
      setReplyCard(cardDataUrl);
      setStage('fullscreen');

    } catch (error) {
      console.error('[SmartReply] 生成卡片失败:', error);
      message.error('生成卡片失败');
    }
  };

  // 保存到我的作品
  const handleSaveToLibrary = () => {
    if (!replyCard || !selectedReply) return;

    const material: MaterialAtom = {
      id: `smart_reply_${Date.now()}`,
      type: 'image',
      data: {
        url: replyCard,
        text: selectedReply
      },
      metadata: {
        featureId: 'M10',
        featureName: '高情商回复',
        createdAt: Date.now(),
        dimensions: { width: 1080, height: 1920 },
        thumbnail: replyCard
      },
      connectors: {
        roles: ['posterImage'],
        canCombineWith: []
      }
    };

    MaterialService.saveMaterial(material);
    message.success('已保存到我的作品！');
  };

  // 复制文字
  const handleCopyText = async () => {
    if (!selectedReply) return;

    try {
      await navigator.clipboard.writeText(selectedReply);
      message.success('✅ 文字已复制到剪贴板');
    } catch (error) {
      // 降级方案：使用传统方法
      const textarea = document.createElement('textarea');
      textarea.value = selectedReply;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      message.success('✅ 文字已复制');
    }
  };

  // 配语音
  const handleAddVoice = () => {
    navigate('/festival/voice', {
      state: {
        prefillText: selectedReply,
        sourceFeature: 'M10',
        sourceImage: replyCard
      }
    });
  };

  // 下载卡片（显示长按保存提示）
  const handleDownload = () => {
    // 不做任何操作，图片已经显示，用户可以直接长按保存
    message.info({
      content: '💡 长按上方图片，选择「保存图片」即可保存到相册',
      duration: 3
    });
  };

  // 重新生成
  const handleRegenerate = () => {
    setReplies(null);
    setReplyCard('');
    setShowMoreActions(false);
    setStage('input');
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
        <button className="lab-back-button" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>返回</span>
        </button>
      </div>

      {/* 主内容容器 */}
      <div className="lab-content-container">

        {/* 输入阶段 */}
        {stage === 'input' && (
          <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            {/* 标题 */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--cny-red-500)', marginBottom: '8px' }}>
                💬 高情商回复
              </h1>
              <p style={{ fontSize: '16px', color: 'var(--cny-gray-600)' }}>
                接住尬问不憋屈
              </p>
            </div>

            {/* 输入表单 */}
            <div style={{ marginTop: '30px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--cny-gray-800)'
              }}>
                对方说了什么
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="例如：怎么还不找对象啊？工资多少呀？什么时候要孩子？"
                rows={3}
                maxLength={100}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  background: 'var(--glass-light)',
                  backdropFilter: 'blur(10px)',
                  marginBottom: '16px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />

              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--cny-gray-800)'
              }}>
                对方是谁
              </label>
              <select
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  background: 'var(--glass-light)',
                  backdropFilter: 'blur(10px)',
                  marginBottom: '16px',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                <option value="远房亲戚">远房亲戚</option>
                <option value="七大姑八大姨">七大姑八大姨</option>
                <option value="父母">父母</option>
                <option value="邻居">邻居</option>
                <option value="朋友">朋友</option>
                <option value="同事">同事</option>
              </select>

              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--cny-gray-800)'
              }}>
                当前场景
              </label>
              <select
                value={scene}
                onChange={(e) => setScene(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  background: 'var(--glass-light)',
                  backdropFilter: 'blur(10px)',
                  marginBottom: '24px',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                <option value="饭桌上">饭桌上</option>
                <option value="客厅聊天">客厅聊天</option>
                <option value="路上偶遇">路上偶遇</option>
                <option value="微信里">微信里</option>
                <option value="电话里">电话里</option>
              </select>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                style={{
                  width: '100%',
                  padding: '14px 32px',
                  fontSize: '18px',
                  fontWeight: '600',
                  background: isGenerating
                    ? 'var(--cny-gray-300)'
                    : 'linear-gradient(135deg, var(--cny-red-500), #D32F2F)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {isGenerating ? '生成中...' : '🎲 生成高情商回复'}
              </button>
            </div>
          </div>
        )}

        {/* 选择版本阶段 */}
        {stage === 'selecting' && replies && (
          <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <h3 style={{
              textAlign: 'center',
              marginBottom: '24px',
              fontSize: '24px',
              fontWeight: '700',
              color: 'var(--cny-gray-900)'
            }}>
              选择你喜欢的风格
            </h3>

            <div style={{ display: 'grid', gap: '16px' }}>
              {/* 怼人版 */}
              <button
                onClick={() => handleSelectVersion(replies.duiren, '怼人版')}
                style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, #E53935, #C62828)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  boxShadow: '0 4px 12px rgba(229, 57, 53, 0.3)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>🔥 怼人版</div>
                <div style={{ fontSize: '18px', fontWeight: '600', lineHeight: '1.5' }}>{replies.duiren}</div>
              </button>

              {/* 有梗版 */}
              <button
                onClick={() => handleSelectVersion(replies.yougen, '有梗版')}
                style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, #FFA726, #FF6F00)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  boxShadow: '0 4px 12px rgba(255, 167, 38, 0.3)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>😂 有梗版</div>
                <div style={{ fontSize: '18px', fontWeight: '600', lineHeight: '1.5' }}>{replies.yougen}</div>
              </button>

              {/* 情商版 */}
              <button
                onClick={() => handleSelectVersion(replies.qingshang, '情商版')}
                style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, #66BB6A, #388E3C)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  boxShadow: '0 4px 12px rgba(102, 187, 106, 0.3)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>😊 情商版</div>
                <div style={{ fontSize: '18px', fontWeight: '600', lineHeight: '1.5' }}>{replies.qingshang}</div>
              </button>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              style={{
                marginTop: '20px',
                width: '100%',
                padding: '14px',
                background: isGenerating ? 'var(--cny-gray-300)' : 'var(--glass-light)',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                color: isGenerating ? '#999' : 'var(--cny-gray-800)',
                transition: 'all 0.2s',
                opacity: isGenerating ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isGenerating) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
              }}
              onMouseLeave={(e) => {
                if (!isGenerating) e.currentTarget.style.background = 'var(--glass-light)';
              }}
            >
              {isGenerating ? '🔄 生成中...' : '🔄 不满意？换一批'}
            </button>
          </div>
        )}

        {/* 全屏展示大字报 - 玻璃态风格 */}
        {stage === 'fullscreen' && replyCard && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--cny-bg-cream)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out',
            overflow: 'auto'
          }}>
            {/* 背景装饰 */}
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 20% 50%, rgba(229, 57, 53, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 215, 0, 0.08) 0%, transparent 50%)',
              pointerEvents: 'none',
              zIndex: 0
            }} />

            {/* 卡片图片 - 可长按保存 */}
            <img
              src={replyCard}
              alt="高情商回复"
              style={{
                maxWidth: '90%',
                maxHeight: '60vh',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                marginBottom: '20px',
                zIndex: 1,
                userSelect: 'auto',
                WebkitUserSelect: 'auto',
                WebkitTouchCallout: 'default'
              }}
            />

            {/* 主操作按钮 - 4个按钮 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              width: '100%',
              maxWidth: '400px',
              padding: '0 20px',
              marginBottom: '16px',
              zIndex: 1
            }}>
              <button
                onClick={handleCopyText}
                style={{
                  padding: '14px 20px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(229, 57, 53, 0.15)',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: 'var(--cny-gray-900)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                }}
              >
                📋 复制文字
              </button>

              <button
                onClick={handleAddVoice}
                style={{
                  padding: '14px 20px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(229, 57, 53, 0.15)',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: 'var(--cny-gray-900)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                }}
              >
                🎙️ 配语音
              </button>

              <button
                onClick={handleRegenerate}
                style={{
                  padding: '14px 20px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(229, 57, 53, 0.15)',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: 'var(--cny-gray-900)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                }}
              >
                🔄 换一个
              </button>

              <button
                onClick={() => setShowMoreActions(!showMoreActions)}
                style={{
                  padding: '14px 20px',
                  background: showMoreActions
                    ? 'linear-gradient(135deg, var(--cny-red-500), #D32F2F)'
                    : 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: showMoreActions ? 'none' : '1px solid rgba(229, 57, 53, 0.15)',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: showMoreActions ? 'white' : 'var(--cny-gray-900)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                }}
              >
                🎨 更多玩法
              </button>
            </div>

            {/* 更多玩法面板 */}
            {showMoreActions && (
              <div style={{
                width: '100%',
                maxWidth: '400px',
                padding: '16px 20px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(229, 57, 53, 0.15)',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                zIndex: 1,
                animation: 'slideUp 0.2s ease-out'
              }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--cny-gray-600)',
                  marginBottom: '12px'
                }}>
                  更多操作
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <button
                    onClick={handleDownload}
                    style={{
                      padding: '12px 16px',
                      background: 'white',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: '600',
                      color: 'var(--cny-gray-800)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                  >
                    下载图片到本地
                  </button>
                  <button
                    onClick={handleSaveToLibrary}
                    style={{
                      padding: '12px 16px',
                      background: 'white',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: '600',
                      color: 'var(--cny-gray-800)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                  >
                    💼 保存到我的作品
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* CSS动画 */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default SmartReplyPage;
