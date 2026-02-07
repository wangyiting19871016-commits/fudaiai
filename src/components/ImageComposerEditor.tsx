/**
 * 🎨 图片合成编辑器
 *
 * 功能：
 * - 基于Fabric.js实现Canvas编辑
 * - 背景替换、添加对联、装饰元素、文字
 * - 图层管理、撤销重做
 * - 导出保存到素材库
 *
 * 集成位置：ResultPage的"编辑装饰"按钮
 */

import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { message } from 'antd';
import { MaterialService } from '../services/MaterialService';
import type { MaterialAtom } from '../types/material';
import {
  BACKGROUND_TEMPLATES,
  COUPLET_TEMPLATES,
  DECORATION_ELEMENTS,
  type EditorAsset
} from '../configs/festival/editorAssets';
import { useCredits } from '../stores/creditStore';
import '../styles/image-composer-editor.css';

interface ImageComposerEditorProps {
  initialImage: string;  // 原始AI生成的图片
  onClose: () => void;
  onSave: (newImageUrl: string) => void;
}

export const ImageComposerEditor: React.FC<ImageComposerEditorProps> = ({
  initialImage,
  onClose,
  onSave
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [activeTab, setActiveTab] = useState<'background' | 'couplet' | 'decoration' | 'text'>('background');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const currentCredits = useCredits();
  const [loading, setLoading] = useState(false);

  // 初始化Canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 768,
      height: 1024,
      backgroundColor: '#ffffff'
    });

    setCanvas(fabricCanvas);

    // 加载原始图片作为底图
    (async () => {
      const img = await fabric.Image.fromURL(initialImage, { crossOrigin: 'anonymous' });
      img.set({
        selectable: false,
        evented: false,
        originX: 'left',
        originY: 'top'
      });

      const scale = Math.min(
        fabricCanvas.width! / (img.width || 1),
        fabricCanvas.height! / (img.height || 1)
      );
      img.scale(scale);

      fabricCanvas.add(img);
      fabricCanvas.sendObjectToBack(img);
      fabricCanvas.renderAll();

      saveHistory(fabricCanvas);
    })();

    return () => {
      fabricCanvas.dispose();
    };
  }, [initialImage]);

  // 保存历史记录（用于撤销/重做）
  const saveHistory = (canvas: fabric.Canvas) => {
    const json = JSON.stringify(canvas.toJSON());
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(json);
      return newHistory.slice(-20);  // 最多保存20步
    });
    setHistoryIndex(prev => Math.min(prev + 1, 19));
  };

  // 撤销
  const handleUndo = () => {
    if (!canvas || historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    canvas.loadFromJSON(history[newIndex], () => {
      canvas.renderAll();
      setHistoryIndex(newIndex);
    });
  };

  // 重做
  const handleRedo = () => {
    if (!canvas || historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    canvas.loadFromJSON(history[newIndex], () => {
      canvas.renderAll();
      setHistoryIndex(newIndex);
    });
  };

  // 添加背景
  const handleAddBackground = async (asset: EditorAsset) => {
    if (!canvas) return;

    // 检查积分
    if (asset.isPremium && asset.creditCost) {
      if (currentCredits < asset.creditCost) {
        message.error(`积分不足，需要${asset.creditCost}积分`);
        return;
      }
    }

    setLoading(true);

    try {
      // 删除旧背景（除了底图）
      const objects = canvas.getObjects();
      objects.forEach(obj => {
        if ((obj as any).data?.type === 'background') {
          canvas.remove(obj);
        }
      });

      // 添加新背景
      const img = await fabric.Image.fromURL(asset.imagePath, { crossOrigin: 'anonymous' });
      (img as any).data = { type: 'background', assetId: asset.id };
      img.set({
        selectable: true,
        originX: 'left',
        originY: 'top'
      });

      // 缩放到画布大小
      img.scaleToWidth(canvas.width!);
      img.scaleToHeight(canvas.height!);

      canvas.add(img);
      canvas.sendObjectToBack(img);
      canvas.renderAll();

      saveHistory(canvas);
      message.success(`已添加背景：${asset.name}`);
      setLoading(false);

      if (asset.isPremium && asset.creditCost) {
        return;
      }
    } catch (error) {
      message.error('添加背景失败');
      setLoading(false);
    }
  };

  // 添加对联
  const handleAddCouplet = async (asset: EditorAsset) => {
    if (!canvas) return;

    const img = await fabric.Image.fromURL(asset.imagePath, { crossOrigin: 'anonymous' });
    (img as any).data = { type: 'couplet', assetId: asset.id };
    img.set({
      left: 50,
      top: 100,
      scaleX: 0.5,
      scaleY: 0.5
    });

    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.renderAll();

    saveHistory(canvas);
    message.success(`已添加对联：${asset.name}`);
  };

  // 添加装饰元素
  const handleAddDecoration = async (asset: EditorAsset) => {
    if (!canvas) return;

    // 检查积分
    if (asset.isPremium && asset.creditCost) {
      if (currentCredits < asset.creditCost) {
        message.error(`积分不足，需要${asset.creditCost}积分`);
        return;
      }
    }

    const img = await fabric.Image.fromURL(asset.imagePath, { crossOrigin: 'anonymous' });
    (img as any).data = { type: 'decoration', assetId: asset.id };
    img.set({
      left: 200,
      top: 200,
      scaleX: 0.3,
      scaleY: 0.3
    });

    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.renderAll();

    saveHistory(canvas);
    message.success(`已添加装饰：${asset.name}`);

    if (asset.isPremium && asset.creditCost) {
      return;
    }
  };

  // 添加文字
  const handleAddText = (text: string) => {
    if (!canvas) return;

    const textObj = new fabric.Text(text, {
      left: 100,
      top: 100,
      fontSize: 40,
      fill: '#ff0000',
      fontFamily: 'Microsoft YaHei, 华文行楷'
    });

    canvas.add(textObj);
    canvas.setActiveObject(textObj);
    canvas.renderAll();

    saveHistory(canvas);
    message.success('已添加文字');
  };

  // 删除选中对象
  const handleDelete = () => {
    if (!canvas) return;

    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      // 不允许删除底图
      if (activeObj.selectable === false) {
        message.warning('底图不可删除');
        return;
      }

      canvas.remove(activeObj);
      canvas.renderAll();
      saveHistory(canvas);
      message.success('已删除');
    } else {
      message.warning('请先选择要删除的元素');
    }
  };

  // 导出图片
  const handleExport = () => {
    if (!canvas) return;

    setLoading(true);

    try {
      // 导出为高清PNG（2倍分辨率）
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2
      });

      // 创建素材原子
      const material: MaterialAtom = {
        id: `material_composed_${Date.now()}`,
        type: 'image',
        data: {
          url: dataURL
        },
        metadata: {
          dimensions: { width: 768 * 2, height: 1024 * 2 },
          createdAt: Date.now(),
          featureId: 'image-composer',
          featureName: '图片编辑器',
          thumbnail: dataURL
        },
        connectors: {
          roles: ['posterImage', 'videoImage'],
          canCombineWith: ['couplet', 'text', 'audio']
        }
      };

      // 保存到素材库
      MaterialService.saveMaterial(material);

      message.success('合成完成！已保存到素材库');
      onSave(dataURL);
      setLoading(false);
    } catch (error) {
      message.error('导出失败');
      console.error('[ImageComposerEditor] 导出失败:', error);
      setLoading(false);
    }
  };

  return (
    <div className="image-composer-editor">
      {/* 顶部工具栏 */}
      <div className="editor-header">
        <button className="editor-btn" onClick={onClose}>
          ← 返回
        </button>
        <h2>图片编辑器</h2>
        <div className="editor-actions">
          <button
            className="editor-btn"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
          >
            撤销
          </button>
          <button
            className="editor-btn"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
          >
            重做
          </button>
          <button className="editor-btn" onClick={handleDelete}>
            删除
          </button>
          <button
            className="editor-btn primary"
            onClick={handleExport}
            disabled={loading}
          >
            {loading ? '处理中...' : '导出保存'}
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="editor-content">
        {/* 左侧工具栏 */}
        <div className="editor-sidebar">
          <div className="sidebar-tabs">
            <button
              className={`tab-btn ${activeTab === 'background' ? 'active' : ''}`}
              onClick={() => setActiveTab('background')}
            >
              背景
            </button>
            <button
              className={`tab-btn ${activeTab === 'couplet' ? 'active' : ''}`}
              onClick={() => setActiveTab('couplet')}
            >
              对联
            </button>
            <button
              className={`tab-btn ${activeTab === 'decoration' ? 'active' : ''}`}
              onClick={() => setActiveTab('decoration')}
            >
              装饰
            </button>
            <button
              className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
              onClick={() => setActiveTab('text')}
            >
              文字
            </button>
          </div>

          <div className="sidebar-content">
            {/* 背景库 */}
            {activeTab === 'background' && (
              <div className="asset-grid">
                {BACKGROUND_TEMPLATES.map(bg => (
                  <div
                    key={bg.id}
                    className="asset-item"
                    onClick={() => handleAddBackground(bg)}
                  >
                    <img src={bg.imagePath} alt={bg.name} />
                    <div className="asset-name">{bg.name}</div>
                    {bg.isPremium && (
                      <div className="asset-premium">💎 {bg.creditCost}积分</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 对联库 */}
            {activeTab === 'couplet' && (
              <div className="asset-grid">
                {COUPLET_TEMPLATES.map(cp => (
                  <div
                    key={cp.id}
                    className="asset-item"
                    onClick={() => handleAddCouplet(cp)}
                  >
                    <img src={cp.imagePath} alt={cp.name} />
                    <div className="asset-name">{cp.name}</div>
                  </div>
                ))}
              </div>
            )}

            {/* 装饰库 */}
            {activeTab === 'decoration' && (
              <div className="asset-grid">
                {DECORATION_ELEMENTS.map(deco => (
                  <div
                    key={deco.id}
                    className="asset-item"
                    onClick={() => handleAddDecoration(deco)}
                  >
                    <img src={deco.imagePath} alt={deco.name} />
                    <div className="asset-name">{deco.name}</div>
                    {deco.isPremium && (
                      <div className="asset-premium">💎 {deco.creditCost}积分</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 文字工具 */}
            {activeTab === 'text' && (
              <div className="text-tool">
                <input
                  type="text"
                  placeholder="输入文字内容..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddText((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                  className="text-input"
                />
                <p className="text-hint">按回车添加到画布</p>

                <div className="text-presets">
                  <h4>常用祝福语</h4>
                  <button onClick={() => handleAddText('新年快乐')}>新年快乐</button>
                  <button onClick={() => handleAddText('恭喜发财')}>恭喜发财</button>
                  <button onClick={() => handleAddText('阖家欢乐')}>阖家欢乐</button>
                  <button onClick={() => handleAddText('万事如意')}>万事如意</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 中间画布区 */}
        <div className="editor-canvas-container">
          <canvas ref={canvasRef} />
          <div className="canvas-hint">
            💡 提示：点击元素可以拖拽移动、缩放旋转
          </div>
        </div>
      </div>
    </div>
  );
};
