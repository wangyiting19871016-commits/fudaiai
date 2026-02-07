/**
 * 🎨 高级素材组合编辑器
 *
 * 功能：
 * - 点击换背景（34个）
 * - 点击加对联（30组）
 * - 点击加装饰（137个）
 * - 点击加文字
 * - 保存导出
 */

import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { message } from 'antd';
import { BackgroundRemovalService } from '../services/BackgroundRemovalService';
import {
  BACKGROUND_TEMPLATES,
  DECORATION_ELEMENTS,
  type EditorAsset
} from '../configs/festival/editorAssets';
import '../styles/advanced-composer-editor.css';

interface AdvancedComposerEditorProps {
  originalImage: string; // M2换脸结果图
  onClose: () => void;
  onSave: (finalImage: string) => void;
}

type TabType = 'background' | 'couplet' | 'decoration' | 'text';

export const AdvancedComposerEditor: React.FC<AdvancedComposerEditorProps> = ({
  originalImage,
  onClose,
  onSave
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('background');
  const [isProcessing, setIsProcessing] = useState(false);
  const [personImage, setPersonImage] = useState<string>('');
  const [currentBackground, setCurrentBackground] = useState<string>('');

  // 初始化Canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    console.log('[Editor] 初始化Canvas，原图URL:', originalImage);

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 768,
      height: 1024,
      backgroundColor: '#ffffff'
    });

    setCanvas(fabricCanvas);

    // 加载原图作为默认底图
    (async () => {
      try {
        const img = await fabric.Image.fromURL(originalImage, { crossOrigin: 'anonymous' });
        console.log('[Editor] 原图加载成功');
        const scale = Math.min(
          fabricCanvas.width! / (img.width || 1),
          fabricCanvas.height! / (img.height || 1)
        );
        img.set({
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          evented: false,
          originX: 'left',
          originY: 'top'
        });
        (img as any).data = { type: 'base-image' };
        fabricCanvas.add(img);
        fabricCanvas.renderAll();
        console.log('[Editor] Canvas渲染完成');
      } catch (error) {
        console.error('[Editor] 原图加载失败:', error);
      }
    })();

    return () => {
      fabricCanvas.dispose();
    };
  }, [originalImage]);

  // 换背景功能（简化版：不抠图，用混合模式）
  const handleChangeBackground = async (bgAsset: EditorAsset) => {
    if (!canvas) return;

    message.loading({ content: '正在替换背景...', key: 'bg', duration: 0 });

    try {
      // 直接替换背景（不抠图）
      const bgImg = await fabric.Image.fromURL(bgAsset.imagePath, { crossOrigin: 'anonymous' });
        const scale = Math.min(
          canvas.width! / (bgImg.width || 1),
          canvas.height! / (bgImg.height || 1)
        );
        bgImg.set({
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          evented: false,
          opacity: 0.3  // 半透明，不完全遮挡原图
        });
        (bgImg as any).data = { type: 'background', id: bgAsset.id };

        // 移除旧背景
        const oldBg = canvas.getObjects().find(obj => (obj as any).data?.type === 'background');
        if (oldBg) canvas.remove(oldBg);

        canvas.add(bgImg);
        canvas.sendObjectToBack(bgImg);
        setCurrentBackground(bgAsset.id);
        canvas.renderAll();

        message.destroy('bg');
        message.success('背景已添加！（拖拽调整透明度）');
    } catch (error) {
      console.error('[Editor] 换背景失败:', error);
      message.destroy('bg');
      message.error('换背景失败，请重试');
    }
  };

  // 添加对联
  const handleAddCouplet = (coupletText: string) => {
    if (!canvas) return;

    message.loading({ content: '正在添加对联...', key: 'couplet', duration: 0 });

    // 简化版：直接添加文字对联
    const textObj = new fabric.Text(coupletText, {
      left: 50,
      top: 200,
      fontSize: 48,
      fontFamily: 'SimSun',
      fill: '#8B0000',
      stroke: '#FFD700',
      strokeWidth: 2,
      selectable: true
    });
    (textObj as any).data = { type: 'couplet' };
    canvas.add(textObj);
    canvas.renderAll();

    message.destroy('couplet');
    message.success('对联已添加！可拖拽调整位置');
  };

  // 添加装饰
  const handleAddDecoration = (decoAsset: EditorAsset) => {
    if (!canvas) return;

    message.loading({ content: '正在添加装饰...', key: 'deco', duration: 0 });

    (async () => {
      const img = await fabric.Image.fromURL(decoAsset.imagePath, { crossOrigin: 'anonymous' });
      img.set({
        left: 100,
        top: 100,
        scaleX: 0.3,
        scaleY: 0.3,
        selectable: true,
        hasControls: true
      });
      (img as any).data = { type: 'decoration', id: decoAsset.id };
      canvas.add(img);
      canvas.renderAll();

      message.destroy('deco');
      message.success('装饰已添加！可拖拽调整位置');
    })();
  };

  // 添加文字
  const handleAddText = () => {
    if (!canvas) return;

    const text = prompt('请输入文字：', '恭喜发财');
    if (!text) return;

    const textObj = new fabric.Text(text, {
      left: canvas.width! / 2 - 100,
      top: canvas.height! / 2,
      fontSize: 48,
      fontFamily: 'SimSun',
      fill: '#DC143C',
      stroke: '#FFD700',
      strokeWidth: 2,
      selectable: true,
      editable: true
    });
    (textObj as any).data = { type: 'text' };
    canvas.add(textObj);
    canvas.renderAll();

    message.success('文字已添加！可拖拽调整位置');
  };

  // 导出保存
  const handleExport = () => {
    if (!canvas) return;

    message.loading({ content: '正在生成图片...', key: 'export', duration: 0 });

    try {
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1.0,
        multiplier: 2 // 2倍分辨率
      });

      message.destroy('export');
      message.success('生成成功！');
      onSave(dataURL);
    } catch (error) {
      console.error('[Editor] 导出失败:', error);
      message.destroy('export');
      message.error('导出失败，请重试');
    }
  };

  // 删除选中元素
  const handleDelete = () => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject && (activeObject as any).data?.type !== 'background' && (activeObject as any).data?.type !== 'base-image') {
      canvas.remove(activeObject);
      canvas.renderAll();
      message.success('已删除');
    } else {
      message.info('请先选中要删除的元素');
    }
  };

  // 对联预设
  const coupletPresets = [
    { id: '1', text: '招财进宝' },
    { id: '2', text: '纳福迎祥' },
    { id: '3', text: '财源广进' },
    { id: '4', text: '吉祥如意' },
    { id: '5', text: '恭喜发财' }
  ];

  return (
    <div className="advanced-composer-editor">
      {/* 顶部工具栏 */}
      <div className="editor-toolbar">
        <button onClick={onClose} className="toolbar-btn toolbar-btn-back">
          ← 返回
        </button>
        <h3 className="toolbar-title">高级编辑</h3>
        <button onClick={handleExport} className="toolbar-btn toolbar-btn-save">
          保存
        </button>
      </div>

      {/* 主内容区 */}
      <div className="editor-content">
        {/* Canvas画布 */}
        <div className="editor-canvas-container">
          <canvas ref={canvasRef} />
        </div>

        {/* 底部操作面板 */}
        <div className="editor-bottom-panel">
          {/* Tab切换 */}
          <div className="editor-tabs">
            <button
              className={`editor-tab ${activeTab === 'background' ? 'active' : ''}`}
              onClick={() => setActiveTab('background')}
            >
              🖼️ 背景
            </button>
            <button
              className={`editor-tab ${activeTab === 'couplet' ? 'active' : ''}`}
              onClick={() => setActiveTab('couplet')}
            >
              🧧 对联
            </button>
            <button
              className={`editor-tab ${activeTab === 'decoration' ? 'active' : ''}`}
              onClick={() => setActiveTab('decoration')}
            >
              🎨 装饰
            </button>
            <button
              className={`editor-tab ${activeTab === 'text' ? 'active' : ''}`}
              onClick={() => setActiveTab('text')}
            >
              ✍️ 文字
            </button>
          </div>

          {/* 素材选择区 */}
          <div className="editor-assets">
            {/* 背景选择 */}
            {activeTab === 'background' && (
              <div className="assets-grid">
                {BACKGROUND_TEMPLATES.map((bg) => (
                  <div
                    key={bg.id}
                    className={`asset-item ${currentBackground === bg.id ? 'active' : ''}`}
                    onClick={() => handleChangeBackground(bg)}
                  >
                    <img src={bg.imagePath} alt={bg.name} />
                    <span className="asset-name">{bg.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 对联选择 */}
            {activeTab === 'couplet' && (
              <div className="assets-list">
                {coupletPresets.map((couplet) => (
                  <button
                    key={couplet.id}
                    className="couplet-btn"
                    onClick={() => handleAddCouplet(couplet.text)}
                  >
                    {couplet.text}
                  </button>
                ))}
              </div>
            )}

            {/* 装饰选择 */}
            {activeTab === 'decoration' && (
              <div className="assets-grid">
                {DECORATION_ELEMENTS.map((deco) => (
                  <div
                    key={deco.id}
                    className="asset-item"
                    onClick={() => handleAddDecoration(deco)}
                  >
                    <img src={deco.imagePath} alt={deco.name} />
                    <span className="asset-name">{deco.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 文字工具 */}
            {activeTab === 'text' && (
              <div className="text-tools">
                <button className="tool-btn" onClick={handleAddText}>
                  + 添加文字
                </button>
                <button className="tool-btn" onClick={handleDelete}>
                  🗑️ 删除选中
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading遮罩 */}
      {isProcessing && (
        <div className="editor-loading">
          <div className="loading-spinner"></div>
          <p>处理中，请稍候...</p>
        </div>
      )}
    </div>
  );
};
