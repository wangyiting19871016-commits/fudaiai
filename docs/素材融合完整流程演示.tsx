/**
 * 🎨 素材融合完整流程演示
 *
 * 展示如何将背景、对联、装饰与人物照片融合
 */

import React, { useState } from 'react';
import { ImageComposerEditor } from '../components/ImageComposerEditor';

/**
 * 演示场景：用户在ResultPage点击"编辑装饰"按钮
 */
export const ResultPageWithEditor: React.FC = () => {
  const [showEditor, setShowEditor] = useState(false);
  const [resultImage, setResultImage] = useState('/result/user_faceswap_result.png'); // M2换脸结果

  // 用户点击"编辑装饰"
  const handleOpenEditor = () => {
    setShowEditor(true);
  };

  // 用户保存编辑后的图片
  const handleSaveEdited = (newImageUrl: string) => {
    setResultImage(newImageUrl); // 更新结果图
    setShowEditor(false);
    message.success('编辑已保存！');
  };

  return (
    <div className="festival-result">
      {/* 结果展示区 */}
      <div className="result-image-container">
        <img src={resultImage} alt="换脸结果" />
      </div>

      {/* 操作按钮 */}
      <div className="result-actions">
        <button onClick={() => navigate('/video')}>
          🎬 生成视频
        </button>

        {/* 🎨 编辑装饰按钮 - 核心入口 */}
        <button onClick={handleOpenEditor} className="btn-primary">
          🎨 编辑装饰
        </button>

        <button onClick={handleSave}>
          💾 保存到素材库
        </button>
      </div>

      {/* 图片编辑器（全屏弹窗） */}
      {showEditor && (
        <ImageComposerEditor
          initialImage={resultImage}  // 传入M2换脸结果
          onClose={() => setShowEditor(false)}
          onSave={handleSaveEdited}
        />
      )}
    </div>
  );
};

/**
 * ===========================
 * 图片编辑器内部流程演示
 * ===========================
 */

/**
 * 步骤1：初始化Canvas，加载人物图片（M2换脸结果）
 */
function initializeCanvas(personImageUrl: string) {
  const canvas = new fabric.Canvas('editor-canvas', {
    width: 768,
    height: 1024,
    backgroundColor: '#ffffff'
  });

  // 加载人物底图（M2换脸后的财神造型人物）
  fabric.Image.fromURL(personImageUrl, (personImg) => {
    personImg.set({
      selectable: false,  // 人物图层锁定，不可删除
      evented: false,
      originX: 'left',
      originY: 'top'
    });

    // 缩放适应画布
    const scale = Math.min(
      canvas.width / personImg.width,
      canvas.height / personImg.height
    );
    personImg.scale(scale);

    canvas.add(personImg);
    canvas.sendToBack(personImg); // 人物在第2层
    canvas.renderAll();
  });

  return canvas;
}

/**
 * 步骤2：添加背景（34个背景供选择）
 */
function addBackground(canvas: fabric.Canvas, backgroundUrl: string) {
  fabric.Image.fromURL(backgroundUrl, (bgImg) => {
    bgImg.set({
      selectable: true,  // 可以选中删除/替换
      originX: 'left',
      originY: 'top'
    });

    // 缩放适应画布
    const scale = Math.min(
      canvas.width / bgImg.width,
      canvas.height / bgImg.height
    );
    bgImg.scale(scale);

    // 移除旧背景
    const oldBg = canvas.getObjects().find(obj => obj.data?.type === 'background');
    if (oldBg) canvas.remove(oldBg);

    // 添加新背景
    bgImg.data = { type: 'background' };
    canvas.add(bgImg);
    canvas.sendToBack(bgImg); // 背景在最底层
    canvas.renderAll();
  });
}

/**
 * 步骤3：添加对联（左联+右联+横批）
 */
function addCouplet(canvas: fabric.Canvas, coupletData: {
  upper: string,    // 上联图片URL
  lower: string,    // 下联图片URL
  horizontal: string // 横批图片URL
}) {
  // 添加上联（右侧）
  fabric.Image.fromURL(coupletData.upper, (upperImg) => {
    upperImg.set({
      left: canvas.width - 220,  // 右侧
      top: 200,
      scaleX: 0.4,
      scaleY: 0.4,
      selectable: true
    });
    upperImg.data = { type: 'couplet', part: 'upper' };
    canvas.add(upperImg);
    canvas.renderAll();
  });

  // 添加下联（左侧）
  fabric.Image.fromURL(coupletData.lower, (lowerImg) => {
    lowerImg.set({
      left: 20,  // 左侧
      top: 200,
      scaleX: 0.4,
      scaleY: 0.4,
      selectable: true
    });
    lowerImg.data = { type: 'couplet', part: 'lower' };
    canvas.add(lowerImg);
    canvas.renderAll();
  });

  // 添加横批（顶部居中）
  fabric.Image.fromURL(coupletData.horizontal, (horizImg) => {
    horizImg.set({
      left: canvas.width / 2 - 200,  // 居中
      top: 50,
      scaleX: 0.5,
      scaleY: 0.5,
      selectable: true
    });
    horizImg.data = { type: 'couplet', part: 'horizontal' };
    canvas.add(horizImg);
    canvas.renderAll();
  });
}

/**
 * 步骤4：添加装饰元素（印章、烫金、艺术字）
 */
function addDecoration(canvas: fabric.Canvas, decorationUrl: string) {
  fabric.Image.fromURL(decorationUrl, (decoImg) => {
    decoImg.set({
      left: 100,
      top: 100,
      scaleX: 0.3,
      scaleY: 0.3,
      selectable: true,
      hasControls: true,  // 显示缩放/旋转控件
      hasBorders: true
    });
    decoImg.data = { type: 'decoration' };
    canvas.add(decoImg);
    canvas.renderAll();
  });
}

/**
 * 步骤5：添加文字（祝福语、姓名等）
 */
function addText(canvas: fabric.Canvas, text: string) {
  const textObj = new fabric.Text(text, {
    left: 100,
    top: 100,
    fontSize: 48,
    fontFamily: 'SimSun',
    fill: '#FF0000',
    stroke: '#FFD700',
    strokeWidth: 2,
    selectable: true,
    editable: true
  });
  textObj.data = { type: 'text' };
  canvas.add(textObj);
  canvas.renderAll();
}

/**
 * 步骤6：导出最终图片
 */
function exportImage(canvas: fabric.Canvas): string {
  // 导出为PNG，2倍分辨率（高清）
  const dataURL = canvas.toDataURL({
    format: 'png',
    quality: 1.0,
    multiplier: 2  // 2倍分辨率 (1536x2048)
  });

  return dataURL;
}

/**
 * ===========================
 * 完整使用流程示例
 * ===========================
 */

/**
 * 用户完整操作流程：
 *
 * 1. 用户上传自拍照 → M2换脸生成财神造型
 * 2. ResultPage显示换脸结果（PNG透明背景人物）
 * 3. 用户点击"编辑装饰"按钮
 * 4. 打开ImageComposerEditor全屏编辑器
 *
 * 5. 编辑器操作：
 *    a) 选择背景（34个背景）
 *       - 点击"背景"标签
 *       - 点击喜欢的背景
 *       - 背景自动替换
 *
 *    b) 添加对联
 *       - 点击"对联"标签
 *       - 选择"招财进宝"对联
 *       - 对联自动添加到左右两侧+顶部横批
 *       - 拖拽调整位置
 *       - 缩放调整大小
 *
 *    c) 添加装饰
 *       - 点击"装饰"标签
 *       - 选择印章/烫金/艺术字
 *       - 点击添加到画布
 *       - 拖拽、缩放、旋转
 *
 *    d) 添加文字
 *       - 点击"文字"标签
 *       - 输入"恭喜发财"
 *       - 调整字体、颜色、大小
 *
 * 6. 点击"保存"按钮
 * 7. Canvas导出PNG图片
 * 8. 保存到素材库
 * 9. 返回ResultPage，显示编辑后的图片
 *
 * 10. 用户可以：
 *     - 下载图片
 *     - 生成视频（配音、数字人）
 *     - 分享到社交媒体
 */

/**
 * ===========================
 * 技术实现关键点
 * ===========================
 */

/**
 * Q1: 对联如何完美融合？
 * A1: 对联是PNG透明背景图片，通过Canvas叠加实现
 *
 * Canvas图层结构：
 *
 * [Layer 5] 文字层（用户输入"恭喜发财"）
 *    ↓
 * [Layer 4] 装饰层（印章、烫金）
 *    ↓
 * [Layer 3] 对联层（PNG透明图片）
 *    ↓  ← 关键：对联PNG有透明区域，不遮挡人物
 * [Layer 2] 人物层（M2换脸后的财神造型）
 *    ↓
 * [Layer 1] 背景层（红色喜庆背景）
 *
 * 最终效果：所有图层合成为一张完整图片
 */

/**
 * Q2: 人物必须是透明背景吗？
 * A2: 是的！否则无法替换背景
 *
 * 错误示例：
 * 人物有白色背景 → 替换背景后，人物周围有白边
 *
 * 正确示例：
 * 人物PNG透明背景 → 替换背景后，完美融合✅
 */

/**
 * Q3: 对联PNG如何制作？
 * A3: 三种方法：
 *
 * 方法1：运行脚本自动生成
 * node scripts/generateCoupletPNG.js
 *
 * 方法2：PS手工制作
 * - 新建画布（200x1000px）
 * - 背景透明
 * - 输入文字（竖排）
 * - 添加描边效果
 * - 导出PNG
 *
 * 方法3：AI生成
 * - MidJourney生成书法字体图片
 * - Remove.bg去除背景
 * - 保存为PNG
 */

/**
 * Q4: 如何确保高清输出？
 * A4: 使用multiplier参数
 *
 * canvas.toDataURL({
 *   format: 'png',
 *   multiplier: 2  // 2倍分辨率
 * });
 *
 * 原始画布：768x1024
 * 导出图片：1536x2048（高清）✅
 */

/**
 * ===========================
 * 总结：素材融合原理
 * ===========================
 *
 * 核心技术：Canvas图层合成
 *
 * 输入素材：
 * - 人物PNG（透明背景）← M2换脸生成
 * - 背景图（34个）
 * - 对联PNG（透明）
 * - 装饰PNG（透明）
 * - 文字（Canvas渲染）
 *
 * 合成过程：
 * 1. Canvas画布（768x1024）
 * 2. 添加背景图层
 * 3. 添加人物图层（透明背景，完美融合）
 * 4. 添加对联图层（透明，不遮挡）
 * 5. 添加装饰图层（透明）
 * 6. 添加文字图层
 * 7. 导出PNG（2倍分辨率）
 *
 * 输出结果：
 * - 高清PNG图片（1536x2048）
 * - 所有元素完美融合
 * - 可直接打印/分享/生成视频
 *
 * ✅ 技术成熟，完全可行！
 */

export default ResultPageWithEditor;
