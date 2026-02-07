/**
 * 🎨 H5移动端高级素材编辑器
 *
 * 功能：
 * - ✅ 一键换背景（真实图片素材）
 * - ✅ 点击加装饰（44个真实素材：印章/烫金/书法）
 * - ✅ 添加文字
 * - ✅ 图层拖拽、删除、导出
 * - ⏸️ 抠图功能（预留接口，暂不启用）
 *
 * 设计：
 * - H5移动端优先（375px宽度）
 * - 原生Canvas API（轻量级）
 * - 底部Tab面板
 * - 黑金国潮风格
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { message } from 'antd';
import {
  BACKGROUND_TEMPLATES,
  DECORATION_ELEMENTS,
  EditorAsset
} from '../configs/festival/editorAssets';
import '../styles/mobile-advanced-editor.css';

interface MobileAdvancedEditorProps {
  originalImage: string; // M2换脸结果图URL
  onClose: () => void;
  onSave: (finalImage: string) => void;
}

// 图层类型
type LayerType = 'background' | 'person' | 'decoration' | 'text';

interface Layer {
  id: string;
  type: LayerType;
  name: string;

  // 通用属性
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  scale?: number;
  opacity?: number;

  // 背景图层
  backgroundUrl?: string;

  // 人物图层
  personImageUrl?: string;

  // 装饰图层
  decorationUrl?: string;
  decorationAsset?: EditorAsset;

  // 文字图层
  content?: string;
  fontSize?: number;
  fontColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

// H5 Canvas尺寸（按375px宽度，2倍分辨率）
const CANVAS_WIDTH = 750;  // 2x 375px
const CANVAS_HEIGHT = 1000; // 2x 500px（4:5比例适合朋友圈）

export const MobileAdvancedEditor: React.FC<MobileAdvancedEditorProps> = ({
  originalImage,
  onClose,
  onSave
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'bg' | 'deco' | 'text' | 'layers'>('bg');
  const [customText, setCustomText] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number } | null>(null);

  // 预加载的图片缓存
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  // 生成唯一ID
  const genId = () => `layer_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // 预加载图片
  const loadImage = useCallback((url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (imageCache.current.has(url)) {
        resolve(imageCache.current.get(url)!);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageCache.current.set(url, img);
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  }, []);

  // 初始化：添加原图作为人物图层
  useEffect(() => {
    loadImage(originalImage)
      .then(() => {
        setLayers([{
          id: genId(),
          type: 'person',
          name: '原图',
          personImageUrl: originalImage,
          x: CANVAS_WIDTH / 2,
          y: CANVAS_HEIGHT / 2,
          scale: 1,
          opacity: 1
        }]);
      })
      .catch((err) => {
        console.error('[Editor] 原图加载失败:', err);
        message.error('原图加载失败');
      });
  }, [originalImage, loadImage]);

  // 渲染Canvas
  const renderCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 绘制棋盘格背景（透明区域显示）
    const gridSize = 32;
    for (let y = 0; y < CANVAS_HEIGHT; y += gridSize) {
      for (let x = 0; x < CANVAS_WIDTH; x += gridSize) {
        ctx.fillStyle = ((x / gridSize + y / gridSize) % 2 === 0) ? '#f5f5f5' : '#e8e8e8';
        ctx.fillRect(x, y, gridSize, gridSize);
      }
    }

    // 按顺序绘制图层
    for (const layer of layers) {
      ctx.save();
      ctx.globalAlpha = layer.opacity ?? 1;

      try {
        // 背景图层
        if (layer.type === 'background' && layer.backgroundUrl) {
          const img = await loadImage(layer.backgroundUrl);
          ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }

        // 人物图层
        if (layer.type === 'person' && layer.personImageUrl) {
          const img = await loadImage(layer.personImageUrl);
          const x = layer.x ?? CANVAS_WIDTH / 2;
          const y = layer.y ?? CANVAS_HEIGHT / 2;
          const scale = layer.scale ?? 1;

          const drawWidth = img.width * scale;
          const drawHeight = img.height * scale;

          ctx.drawImage(
            img,
            x - drawWidth / 2,
            y - drawHeight / 2,
            drawWidth,
            drawHeight
          );
        }

        // 装饰图层
        if (layer.type === 'decoration' && layer.decorationUrl) {
          const img = await loadImage(layer.decorationUrl);
          const x = layer.x ?? 100;
          const y = layer.y ?? 100;
          const scale = layer.scale ?? 0.5;

          const drawWidth = img.width * scale;
          const drawHeight = img.height * scale;

          ctx.drawImage(
            img,
            x - drawWidth / 2,
            y - drawHeight / 2,
            drawWidth,
            drawHeight
          );
        }

        // 文字图层
        if (layer.type === 'text' && layer.content) {
          const x = layer.x ?? CANVAS_WIDTH / 2;
          const y = layer.y ?? CANVAS_HEIGHT - 120;
          const fontSize = layer.fontSize ?? 56;

          ctx.font = `bold ${fontSize}px "SimHei", "Heiti SC", "Microsoft YaHei", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // 描边
          if (layer.strokeColor && layer.strokeWidth) {
            ctx.strokeStyle = layer.strokeColor;
            ctx.lineWidth = layer.strokeWidth;
            ctx.strokeText(layer.content, x, y);
          }

          // 填充
          ctx.fillStyle = layer.fontColor ?? '#FFD700';
          ctx.fillText(layer.content, x, y);
        }
      } catch (err) {
        console.error('[Editor] 图层渲染失败:', layer.id, err);
      }

      ctx.restore();
    }

    // 选中框
    if (selectedLayerId) {
      const sel = layers.find(l => l.id === selectedLayerId);
      if (sel && sel.type !== 'background') {
        ctx.save();
        ctx.strokeStyle = '#4A90D9';
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 6]);

        const x = sel.x ?? CANVAS_WIDTH / 2;
        const y = sel.y ?? CANVAS_HEIGHT / 2;
        const boxSize = 200;

        ctx.strokeRect(x - boxSize / 2, y - boxSize / 2, boxSize, boxSize);

        // 四角标记
        ctx.fillStyle = '#4A90D9';
        const corners = [
          [x - boxSize / 2, y - boxSize / 2],
          [x + boxSize / 2, y - boxSize / 2],
          [x - boxSize / 2, y + boxSize / 2],
          [x + boxSize / 2, y + boxSize / 2]
        ];
        corners.forEach(([cx, cy]) => {
          ctx.fillRect(cx - 8, cy - 8, 16, 16);
        });

        ctx.restore();
      }
    }
  }, [layers, selectedLayerId, loadImage]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // 一键换背景
  const handleChangeBackground = async (bgAsset: EditorAsset) => {
    const hideLoading = message.loading('正在替换背景...', 0);

    try {
      // 预加载图片
      await loadImage(bgAsset.imagePath);

      setLayers(prev => {
        // 移除旧背景
        const withoutBg = prev.filter(l => l.type !== 'background');
        // 添加新背景（放在最底层）
        return [
          {
            id: genId(),
            type: 'background',
            name: bgAsset.name,
            backgroundUrl: bgAsset.imagePath,
            opacity: 1
          },
          ...withoutBg
        ];
      });

      hideLoading();
      message.success('背景已更换！');
    } catch (err) {
      console.error('[Editor] 换背景失败:', err);
      hideLoading();
      message.error('换背景失败，请重试');
    }
  };

  // 添加装饰
  const handleAddDecoration = async (decoAsset: EditorAsset) => {
    const hideLoading = message.loading('正在添加装饰...', 0);

    try {
      await loadImage(decoAsset.imagePath);

      const x = CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 200;
      const y = CANVAS_HEIGHT / 2 + (Math.random() - 0.5) * 200;

      setLayers(prev => [...prev, {
        id: genId(),
        type: 'decoration',
        name: decoAsset.name,
        decorationUrl: decoAsset.imagePath,
        decorationAsset: decoAsset,
        x,
        y,
        scale: 0.5,
        opacity: 1
      }]);

      hideLoading();
      message.success('装饰已添加！可拖拽调整位置');
    } catch (err) {
      console.error('[Editor] 添加装饰失败:', err);
      hideLoading();
      message.error('添加装饰失败');
    }
  };

  // 添加文字
  const handleAddText = () => {
    if (!customText.trim()) {
      message.warning('请先输入文字内容');
      return;
    }

    setLayers(prev => [...prev, {
      id: genId(),
      type: 'text',
      name: customText.slice(0, 10),
      content: customText,
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 120,
      fontSize: 56,
      fontColor: '#FFD700',
      strokeColor: '#8B0000',
      strokeWidth: 4,
      opacity: 1
    }]);

    setCustomText('');
    message.success('文字已添加！可拖拽调整位置');
  };

  // 删除选中图层
  const handleDelete = () => {
    if (!selectedLayerId) {
      message.info('请先选中要删除的元素');
      return;
    }

    const layer = layers.find(l => l.id === selectedLayerId);
    if (layer?.type === 'person') {
      message.warning('不能删除原图图层');
      return;
    }

    setLayers(prev => prev.filter(l => l.id !== selectedLayerId));
    setSelectedLayerId(null);
    message.success('已删除');
  };

  // 导出图片
  const handleExport = () => {
    const hideLoading = message.loading('正在生成图片...', 0);

    // 取消选中（避免导出带选中框）
    const tempSelected = selectedLayerId;
    setSelectedLayerId(null);

    setTimeout(() => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) throw new Error('Canvas not found');

        const dataURL = canvas.toDataURL('image/png', 1.0);
        hideLoading();
        message.success('生成成功！');
        onSave(dataURL);
        setSelectedLayerId(tempSelected);
      } catch (err) {
        console.error('[Editor] 导出失败:', err);
        hideLoading();
        message.error('导出失败，请重试');
        setSelectedLayerId(tempSelected);
      }
    }, 100);
  };

  // Canvas交互：点击选中
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    // 从上到下查找（顶层优先）
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (layer.type === 'background') continue;

      const lx = layer.x ?? CANVAS_WIDTH / 2;
      const ly = layer.y ?? CANVAS_HEIGHT / 2;
      const hitRadius = 100;

      if (Math.abs(mx - lx) < hitRadius && Math.abs(my - ly) < hitRadius) {
        setSelectedLayerId(layer.id);
        return;
      }
    }

    setSelectedLayerId(null);
  };

  // Canvas交互：拖拽开始
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedLayerId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const layer = layers.find(l => l.id === selectedLayerId);
    if (!layer) return;

    const lx = layer.x ?? CANVAS_WIDTH / 2;
    const ly = layer.y ?? CANVAS_HEIGHT / 2;

    setDragOffset({ dx: mx - lx, dy: my - ly });
    setIsDragging(true);
  };

  // Canvas交互：拖拽中
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedLayerId || !dragOffset) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    setLayers(prev => prev.map(l =>
      l.id === selectedLayerId
        ? { ...l, x: mx - dragOffset.dx, y: my - dragOffset.dy }
        : l
    ));
  };

  // Canvas交互：拖拽结束
  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setDragOffset(null);
  };

  return (
    <div className="mobile-advanced-editor">
      {/* 顶部工具栏 */}
      <div className="editor-header">
        <button onClick={onClose} className="header-btn header-btn-back">
          ← 返回
        </button>
        <h3 className="header-title">高级编辑</h3>
        <button onClick={handleExport} className="header-btn header-btn-save">
          保存
        </button>
      </div>

      {/* Canvas画布 */}
      <div className="editor-canvas-container">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="editor-canvas"
          onClick={handleCanvasClick}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        />
      </div>

      {/* 底部操作面板 */}
      <div className="editor-bottom-panel">
        {/* Tab切换 */}
        <div className="editor-tabs">
          <button
            className={`editor-tab ${activeTab === 'bg' ? 'active' : ''}`}
            onClick={() => setActiveTab('bg')}
          >
            🖼️ 背景
          </button>
          <button
            className={`editor-tab ${activeTab === 'deco' ? 'active' : ''}`}
            onClick={() => setActiveTab('deco')}
          >
            ✨ 装饰
          </button>
          <button
            className={`editor-tab ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => setActiveTab('text')}
          >
            ✍️ 文字
          </button>
          <button
            className={`editor-tab ${activeTab === 'layers' ? 'active' : ''}`}
            onClick={() => setActiveTab('layers')}
          >
            📚 图层
          </button>
        </div>

        {/* 素材内容区 */}
        <div className="editor-content">
          {/* 背景选择 */}
          {activeTab === 'bg' && (
            <div className="assets-grid">
              {BACKGROUND_TEMPLATES.length === 0 ? (
                <div className="empty-hint">暂无背景素材</div>
              ) : (
                BACKGROUND_TEMPLATES.map(bg => (
                  <div
                    key={bg.id}
                    className="asset-card"
                    onClick={() => handleChangeBackground(bg)}
                  >
                    <div
                      className="asset-preview"
                      style={{ backgroundImage: `url(${bg.imagePath})` }}
                    />
                    <span className="asset-name">{bg.name}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 装饰选择 */}
          {activeTab === 'deco' && (
            <div className="assets-grid">
              {DECORATION_ELEMENTS.map(deco => (
                <div
                  key={deco.id}
                  className="asset-card"
                  onClick={() => handleAddDecoration(deco)}
                >
                  <div
                    className="asset-preview"
                    style={{ backgroundImage: `url(${deco.imagePath})` }}
                  />
                  <span className="asset-name">{deco.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* 文字工具 */}
          {activeTab === 'text' && (
            <div className="text-tools">
              <div className="text-input-group">
                <input
                  type="text"
                  className="text-input"
                  placeholder="输入祝福语..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
                />
                <button className="text-add-btn" onClick={handleAddText}>
                  添加
                </button>
              </div>

              <div className="text-presets">
                <div className="presets-title">快捷文字</div>
                {['新年快乐', '恭喜发财', '万事如意', '阖家欢乐', '大吉大利', '财源广进'].map(t => (
                  <button
                    key={t}
                    className="preset-btn"
                    onClick={() => {
                      setLayers(prev => [...prev, {
                        id: genId(),
                        type: 'text',
                        name: t,
                        content: t,
                        x: CANVAS_WIDTH / 2,
                        y: CANVAS_HEIGHT - 120,
                        fontSize: 56,
                        fontColor: '#FFD700',
                        strokeColor: '#8B0000',
                        strokeWidth: 4,
                        opacity: 1
                      }]);
                      message.success('文字已添加！');
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 图层管理 */}
          {activeTab === 'layers' && (
            <div className="layers-list">
              {layers.length === 0 ? (
                <div className="empty-hint">还没有图层</div>
              ) : (
                [...layers].reverse().map(layer => (
                  <div
                    key={layer.id}
                    className={`layer-item ${selectedLayerId === layer.id ? 'selected' : ''}`}
                    onClick={() => setSelectedLayerId(layer.id)}
                  >
                    <span className="layer-icon">
                      {layer.type === 'background' && '🖼️'}
                      {layer.type === 'person' && '👤'}
                      {layer.type === 'decoration' && '✨'}
                      {layer.type === 'text' && '✍️'}
                    </span>
                    <span className="layer-name">{layer.name}</span>
                    {layer.type !== 'person' && (
                      <button
                        className="layer-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLayers(prev => prev.filter(l => l.id !== layer.id));
                          if (selectedLayerId === layer.id) setSelectedLayerId(null);
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))
              )}

              {selectedLayerId && (
                <div className="layer-actions">
                  <button className="action-btn" onClick={handleDelete}>
                    🗑️ 删除选中
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
