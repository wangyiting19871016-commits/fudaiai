import React from 'react';
import UniversalPreview from './UniversalPreview';
import { OutputType } from '../stores/ActiveProtocolStore';

interface P4ResultSandboxProps {
  previewImageUrl: string;
  outputType: OutputType;
  protocol: any;
  isConverting?: boolean;
  stepData?: any;
}

const P4ResultSandbox: React.FC<P4ResultSandboxProps> = ({
  previewImageUrl,
  outputType,
  protocol,
  isConverting = false,
  stepData
}) => {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px' }}>
      <div style={{ height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#252526', borderRadius: '4px 4px 0 0', padding: '0 10px', color: '#a3a3a3', fontWeight: 500 }}>
        📤 Result View (处理结果)
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#1e1e1e', padding: '10px', position: 'relative' }}>
        {/* 转换图片数据提示 */}
        {isConverting && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            padding: '20px 40px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            zIndex: 10,
            textAlign: 'center',
            border: '1px solid #a3a3a3',
            boxShadow: '0 4px 20px rgba(6, 182, 212, 0.3)'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>🔄</div>
            正在转换图片数据并加密传输...
          </div>
        )}
        
        {previewImageUrl ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {/* 多模态支持：根据类型渲染不同的播放器 */}
            {outputType === 'audio' || 
             previewImageUrl.startsWith('blob:') || 
             previewImageUrl.endsWith('.mp3') || 
             previewImageUrl.includes('audio/') ? (
              // 音频类型：渲染HTML5 Audio Player
              <audio 
                src={previewImageUrl} 
                controls 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%',
                  borderRadius: '4px',
                  border: '1px solid #3e3e42'
                }}
              >
                您的浏览器不支持音频播放。
              </audio>
            ) : outputType === 'video' || previewImageUrl.endsWith('.mp4') || previewImageUrl.includes('video/') ? (
              // 视频类型：渲染Video Player
              <video 
                src={previewImageUrl} 
                controls 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%',
                  borderRadius: '4px',
                  border: '1px solid #3e3e42'
                }}
              >
                您的浏览器不支持视频播放。
              </video>
            ) : outputType === 'image' ? (
              // 图像类型：使用UniversalPreview组件，并启用代理预览逻辑
              <UniversalPreview
                asset={{
                  id: `preview_asset_${Date.now()}`,
                  name: '预览结果',
                  url: previewImageUrl,
                  type: 'image',
                  size: 0,
                  createdAt: new Date().toISOString()
                }}
                params={stepData?.currentBenchmark?.aestheticParams || {}}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%', 
                  objectFit: 'contain',
                  display: 'block',
                  borderRadius: '4px', 
                  border: '1px solid #3e3e42'
                }}
              />
            ) : (
              // 其他类型：直接显示URL或文本
              <div style={{ 
                padding: '20px',
                backgroundColor: '#2d2d30',
                borderRadius: '8px',
                border: '1px solid #3e3e42',
                color: '#cccccc',
                wordBreak: 'break-all',
                maxWidth: '100%',
                maxHeight: '100%',
                overflow: 'auto'
              }}>
                {typeof previewImageUrl === 'string' ? (
                  previewImageUrl
                ) : (
                  JSON.stringify(previewImageUrl, null, 2)
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ 
            width: '200px', 
            height: '200px', 
            borderRadius: '8px',
            backgroundColor: '#2d2d30',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '16px',
            border: '1px solid #3e3e42'
          }}>
            💡 点击运行测试生成结果
          </div>
        )}
      </div>
    </div>
  );
};

export default P4ResultSandbox;