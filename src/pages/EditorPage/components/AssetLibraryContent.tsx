import React, { useRef } from 'react';
import { Upload, Image, Video, Music } from 'lucide-react';
import { useAssetStore } from '../../../stores/AssetStore';
import UniversalPreview from '../../../components/UniversalPreview';

interface AssetLibraryContentProps {
  onSelectAsset: (asset: any) => void;
}

export const AssetLibraryContent: React.FC<AssetLibraryContentProps> = ({ onSelectAsset }) => {
  const { assets, addAsset, removeAsset } = useAssetStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 创建文件URL
    const fileUrl = URL.createObjectURL(file);
    
    // 确定文件类型
    let assetType: 'image' | 'audio' | 'video';
    if (file.type.startsWith('image/')) {
      assetType = 'image';
    } else if (file.type.startsWith('audio/')) {
      assetType = 'audio';
    } else if (file.type.startsWith('video/')) {
      assetType = 'video';
    } else {
      return; // 不支持的文件类型
    }
    
    // 添加到素材库
    addAsset({
      name: file.name,
      url: fileUrl,
      type: assetType,
      size: file.size
    });
    
    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* 素材上传区域 */}
      <div style={{
        padding: '20px',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        border: '2px dashed #333',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
      }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,audio/*,video/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <Upload size={48} style={{ color: '#a3a3a3' }} />
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#fff'
          }}>
            点击上传素材
          </div>
          <div style={{
            fontSize: '12px',
            color: '#666'
          }}>
            支持图片、音频、视频格式
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: '#222',
              borderRadius: '20px',
              fontSize: '12px',
              color: '#a3a3a3'
            }}>
              <Image size={14} />
              <span>图片</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: '#222',
              borderRadius: '20px',
              fontSize: '12px',
              color: '#a3a3a3'
            }}>
              <Video size={14} />
              <span>视频</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: '#222',
              borderRadius: '20px',
              fontSize: '12px',
              color: '#a3a3a3'
            }}>
              <Music size={14} />
              <span>音频</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 素材统计 */}
      <div style={{
        padding: '10px 16px',
        backgroundColor: '#222',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#a3a3a3',
        fontWeight: 'bold'
      }}>
        总素材数量: {assets.length}
      </div>
      
      {/* 素材列表 */}
      {assets.length === 0 ? (
        <div style={{
          display: 'flex',
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          color: '#666',
          fontSize: '16px'
        }}>
          暂无素材，请先上传素材
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '16px'
        }}>
          {assets.map((asset) => (
            <div key={asset.id} style={{
              backgroundColor: '#222',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid #333',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}>
              {/* 素材预览 */}
              <div style={{
                width: '100%',
                height: '120px',
                backgroundColor: '#000',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden'
              }}>
                {asset.type === 'image' ? (
                  <UniversalPreview
                    asset={asset}
                    params={{}}
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : asset.type === 'audio' ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#a3a3a3',
                    gap: '8px'
                  }}>
                    <Music size={36} />
                    <span style={{ fontSize: '12px', color: '#fff' }}>音频</span>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#a3a3a3',
                    gap: '8px'
                  }}>
                    <Video size={36} />
                    <span style={{ fontSize: '12px', color: '#fff' }}>视频</span>
                  </div>
                )}
              </div>
              
              {/* 素材信息 */}
              <div style={{
                padding: '10px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#fff',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {asset.name}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: '#666',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{asset.type}</span>
                  <span>{(asset.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
              
              {/* 操作按钮 */}
              <div style={{
                display: 'flex',
                borderTop: '1px solid #333'
              }}>
                <button
                  onClick={() => onSelectAsset(asset)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: '#a3a3a3',
                    color: '#000',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  选择
                </button>
                <button
                  onClick={() => removeAsset(asset.id)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
