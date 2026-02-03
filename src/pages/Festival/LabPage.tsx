import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ZJUploader from './components/ZJUploader';
import ZJMultiUploader from './components/ZJMultiUploader';
import ZJAINarrator from './components/ZJAINarrator';
import ZJGenderSelector from './components/ZJGenderSelector';
import ZJFullscreenLoader from './components/ZJFullscreenLoader';
import { missionExecutor, MissionProgress } from '../../services/MissionExecutor';
import { BackButton } from '../../components/BackButton';
import '../../styles/festival-design-system.css';
import '../../styles/festival-multi-uploader.css';
import '../../styles/festival-lab-glass.css';

/**
 * 🔥 AI炼金矩阵 (Lab Page) - 春节H5实操页
 * 
 * 5步交互流程：
 * 0. 性别选择（M1任务）
 * 1. 祭坛上传区
 * 2. DNA提取（扫描线+气泡）
 * 3. 进度叙事流
 * 4. 结果显示
 * 5. 跳转结果页
 * 
 * ⚠️ 注意：这是全新的春节H5页面，不是 P4LabPage.tsx
 */

type Stage = 'gender' | 'upload' | 'preview' | 'dna' | 'generating' | 'enhancing' | 'complete' | 'error';

const FestivalLabPage: React.FC = () => {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const isM1 = missionId === 'M1';
  const isM2 = missionId === 'M2';
  const isM3 = missionId === 'M3';  // 情侣合照（2人）
  const isM4 = missionId === 'M4';  // 全家福（3人）
  const isMultiPerson = isM3 || isM4;
  const personCount = isM3 ? 2 : isM4 ? 3 : 1;

  // 从 TemplateSelectionPage 传来的 state
  const initialGender = location.state?.gender || 'male';
  const templateConfig = location.state?.templateConfig;

  // 防止重复执行的锁
  const isExecutingRef = React.useRef(false);
  const [stage, setStage] = useState<Stage>('upload');  // 🔥 移除废弃的性别选择，直接进入上传
  const [gender, setGender] = useState<'male' | 'female'>(initialGender);
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [dnaResults, setDnaResults] = useState<string[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [narrativeTexts, setNarrativeTexts] = useState<string[]>([]);
  const [estimatedTime, setEstimatedTime] = useState<number>(0); // 预估剩余时间(秒)
  const taskStartTimeRef = React.useRef<number>(0);

  // 🔥 废弃：性别选择逻辑已移除，gender 现在从 state 或默认值获取

  const handleUploadComplete = async (base64: string) => {
    setUploadedImage(base64);
    setStage('preview');
  };

  const handleMultiUploadComplete = async (images: string[]) => {
    setUploadedImages(images);
    setStage('preview');
  };

  const handleStartGeneration = async () => {
    // 防止重复执行
    if (isExecutingRef.current) {
      console.warn('[Festival Lab] 任务正在执行中，忽略重复调用');
      return;
    }
    isExecutingRef.current = true;

    // 记录开始时间
    taskStartTimeRef.current = Date.now();

    // 设置初始预估时间
    setEstimatedTime(isM2 ? 50 : 35); // M2预估50秒，M1预估35秒

    setStage('dna');

    try {
      const input: any = {
        gender: gender,
        customParams: {
          templateConfig: templateConfig
        }
      };

      // 多人合照使用 images 数组
      if (isMultiPerson) {
        input.images = uploadedImages;
      } else {
        input.image = uploadedImage;
      }

      const result = await missionExecutor.execute(
        missionId || 'M1',
        input,
        handleProgressUpdate
      );

      isExecutingRef.current = false;
      navigate(`/festival/result/${result.taskId}`);
    } catch (error) {
      isExecutingRef.current = false;
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[Festival Lab] ❌ 任务失败:', errorMsg);
      setStage('upload');
      alert(`生成失败: ${errorMsg}`);
    }
  };

  const handleProgressUpdate = (progress: MissionProgress) => {
    setStage(progress.stage as Stage);
    setProgress(progress.progress);

    // 动态计算预估剩余时间
    if (progress.progress > 0 && progress.progress < 100) {
      const elapsed = (Date.now() - taskStartTimeRef.current) / 1000;
      const totalEstimated = elapsed / (progress.progress / 100);
      const remaining = Math.max(0, Math.ceil(totalEstimated - elapsed));
      setEstimatedTime(remaining);
    }

    if (progress.dnaResult && progress.dnaResult.length > dnaResults.length) {
      setDnaResults(progress.dnaResult);
    }

    if (progress.stage === 'generating' || progress.stage === 'enhancing') {
      if (progress.message && !narrativeTexts.includes(progress.message)) {
        setNarrativeTexts(prev => {
          const newTexts = [...prev, progress.message];
          return newTexts.slice(-4);
        });
      }
    }
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
      </div>

      {/* 主内容容器 */}
      <div className="lab-content-container">

        {/* 🔥 废弃：性别选择页面已移除 */}

        {/* Step 1: 上传区 */}
        {stage === 'upload' && (
          <>
            {/* 现代化进度指示器 */}
            <div className="progress-steps-modern">
              {!isMultiPerson && (
                <>
                  <div className="step-modern completed">
                    <div className="step-number-modern">✓</div>
                    <span className="step-text-modern">选择模板</span>
                  </div>
                  <div className="step-divider-modern completed"></div>
                </>
              )}
              <div className="step-modern active">
                <div className="step-number-modern">{isMultiPerson ? '1' : '2'}</div>
                <span className="step-text-modern">上传照片</span>
              </div>
              <div className="step-divider-modern"></div>
              <div className="step-modern">
                <div className="step-number-modern">{isMultiPerson ? '2' : '3'}</div>
                <span className="step-text-modern">
                  {isM2 ? '生成写真' : isM3 ? '生成合照' : isM4 ? '生成全家福' : '生成头像'}
                </span>
              </div>
            </div>

            {isMultiPerson ? (
              <ZJMultiUploader
                personCount={personCount}
                onAllUploaded={handleMultiUploadComplete}
                aspectRatio="3:4"
                maxSizeMB={5}
              />
            ) : (
              <ZJUploader
                onUploadComplete={handleUploadComplete}
                aspectRatio="3:4"
                maxSizeMB={5}
              />
            )}
          </>
        )}

        {/* Step 1.5: 预览确认 */}
        {stage === 'preview' && (
          <>
            {/* 现代化进度指示器 */}
            <div className="progress-steps-modern">
              <div className="step-modern completed">
                <div className="step-number-modern">✓</div>
                <span className="step-text-modern">选择性别</span>
              </div>
              <div className="step-divider-modern completed"></div>
              <div className="step-modern completed">
                <div className="step-number-modern">✓</div>
                <span className="step-text-modern">上传照片</span>
              </div>
              <div className="step-divider-modern"></div>
              <div className="step-modern">
                <div className="step-number-modern">3</div>
                <span className="step-text-modern">{isM2 ? '生成财神' : '生成头像'}</span>
              </div>
            </div>

            {/* 预览区 */}
            <div className="preview-section-modern">
              {isMultiPerson ? (
                <div className="multi-preview-container">
                  {uploadedImages.map((img, index) => (
                    <div key={index} className="preview-image-item">
                      <img src={img} alt={`Person ${index + 1}`} className="preview-image-small" />
                      <div className="preview-label">人物{index + 1}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="preview-image-container">
                  <img src={uploadedImage} alt="Preview" className="preview-image" />
                  {!isMultiPerson && gender && (
                    <div className="preview-badge">
                      {gender === 'male' ? '男' : gender === 'female' ? '女' : '小孩'}
                    </div>
                  )}
                </div>
              )}

              <div className="preview-info">
                <h3 className="preview-title">照片已就绪</h3>
                <p className="preview-desc">
                  AI将为您生成独一无二的<br/>
                  <strong>
                    {isM2 ? '新年写真' :
                     isM3 ? '情侣合照' :
                     isM4 ? '全家福照片' :
                     '新年3D皮克斯风格头像'}
                  </strong>
                </p>
              </div>

              {/* 生成按钮 */}
              <button className="generate-button-modern" onClick={handleStartGeneration}>
                <div className="button-glow"></div>
                <span className="button-icon"></span>
                <span className="button-text">{isM2 ? '开始变身财神' : '开始炼成真迹'}</span>
              </button>

              {/* 重新上传 */}
              <button className="reupload-button-modern" onClick={() => setStage('upload')}>
                重新上传
              </button>
            </div>
          </>
        )}

        {/* Step 2: DNA提取（保留DNA扫描动画） */}
        {stage === 'dna' && (
          <>
            <div className="progress-steps-modern">
              <div className="step-modern completed">
                <div className="step-number-modern">✓</div>
                <span className="step-text-modern">选择性别</span>
              </div>
              <div className="step-divider-modern completed"></div>
              <div className="step-modern completed">
                <div className="step-number-modern">✓</div>
                <span className="step-text-modern">上传照片</span>
              </div>
              <div className="step-divider-modern completed"></div>
              <div className="step-modern active">
                <div className="step-number-modern">3</div>
                <span className="step-text-modern">生成头像</span>
              </div>
            </div>

            <div className="festival-lab-preview">
              <img
                src={uploadedImage}
                alt="Uploaded"
                className="festival-lab-preview-img"
              />
              <div className="festival-scan-line" />
            </div>

            <ZJAINarrator
              stage="dna"
              dnaResults={dnaResults}
              narrativeTexts={narrativeTexts}
              progress={progress}
            />
          </>
        )}

        {/* Step 3: 生成 - 使用全屏加载组件 */}
        {(stage === 'generating' || stage === 'enhancing') && (
          <ZJFullscreenLoader
            stage={stage}
            progress={progress}
            message={narrativeTexts[narrativeTexts.length - 1]}
            uploadedImage={uploadedImage}
          />
        )}
      </div>
    </div>
  );
};

export default FestivalLabPage;
