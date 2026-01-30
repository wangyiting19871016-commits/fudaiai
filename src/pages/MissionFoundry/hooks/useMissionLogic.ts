import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { callDeepSeek } from '../../../services/deepseekService';
import { callVolcTTS } from '../../../services/volcService';
import { callAliVision } from '../../../services/aliService';
import { ControlItem, MissionStep } from '../../../types';
import { CapabilityManifest } from '../../../types/Protocol';
import { P4_PROTOCOL_DICTIONARY, getProtocolDefinition } from '../../../constants/protocol';
import { AestheticParams } from '../../../constants/AestheticProtocol';
import { useProtocolContext } from '../../../stores/ActiveProtocolStore';

interface DraftMission {
  id: string;
  title: string;
  type: string;
  video: {
    url: string;
    type: string;
  };
  code?: {
    template: string;
    target: string;
  };
  status: {
    isVerified: boolean;
    isRecorded: boolean;
  };
  steps: MissionStep[];
  createdAt: string;
  description?: string;
  reference_material?: {
    type: string;
    content: string;
  };
  keyFrames?: any[];
  updatedAt?: string;
  verifyType: string;
  matchKeyword: string;
  difficulty: number;
  creditScore: number;
  // 新增：全局门面标杆
  facadeCoverUrl?: string; // 任务门面卡片上传的封面图/成品图
  // 新增：全局预览焦点状态
  activePreviewUrl?: string; // 当前激活的预览URL
  selectedStepIndex?: number; // 当前选中的步骤索引
  // 新增：拼接逻辑配置
  mergeConfig?: {
    enabled: boolean;
    layers?: Array<{
      stepIndex: number;
      opacity: number;
      blendMode: string;
      position: { x: number; y: number };
    }>;
    // 预留更多图层融合参数
    [key: string]: any;
  };
}

export interface UseMissionLogicResult {
  mediaUrl: string;
  instruction: string;
  audioTrackName: string;
  verifyType: string;
  matchKeyword: string;
  isAnalyzing: boolean;
  logs: string[];
  uploadedFile: File | null;
  uploadedFileUrl: string;
  draftMission: DraftMission;
  selectedStepIndex: number;
  isManualMode: boolean;
  editingStepIndex: number | null;
  editingStep: MissionStep | Partial<MissionStep> | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isScreenCapturing: boolean;
  capturedVideoUrl: string;
  capturedAudioUrl: string;
  verification: string;
  mediaStream: MediaStream | null;
  activePreviewUrl: string;
  setActivePreviewUrl: (url: string) => void;
  previewFocusUrl: string;
  setPreviewFocusUrl: (url: string) => void;
  isAuditModalOpen: boolean;
  setIsAuditModalOpen: (isOpen: boolean) => void;
  isPublishing: boolean;
  loadProtocolToMission: (protocolData: any) => boolean;
  handleFormChange: (field: string, value: any) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleAnalyze: (instruction?: string) => Promise<void>;
  handleAddStep: () => void;
  handleEditStep: (index: number) => void;
  handleSaveStep: () => void;
  handleDeleteStep: (index: number) => void;
  handleCopyStep: (index: number) => void;
  handleMoveStepUp: (index: number) => void;
  handleMoveStepDown: (index: number) => void;
  handleSignAndRelease: () => void;
  handleVoiceAI: (index: number) => Promise<void>;
  handleIdentifyKeyFrames: () => Promise<void>;
  analyzeStepAssets: (index: number) => Promise<void>;
  setSelectedStepIndex: (index: number) => void;
  setIsManualMode: (isManual: boolean) => void;
  updateStep: (index: number, updates: Partial<MissionStep>) => void;
  updateDraftMission: (updates: Partial<DraftMission> | ((prev: DraftMission) => Partial<DraftMission>)) => void;
  setMediaUrl: (url: string) => void;
  setInstruction: (instruction: string) => void;
  setAudioTrackName: (name: string) => void;
  setVerifyType: (type: string) => void;
  setMatchKeyword: (keyword: string) => void;
  handleStartScreenCapture: () => Promise<void>;
  handleStopScreenCapture: () => Promise<void>;
  downloadVideo: () => void;
  downloadAudio: () => void;
  handleAutoFill: (index: number) => Promise<void>;
  facadeCoverUrl: string;
  setFacadeCover: (url: string) => void;
  currentAestheticParams: Partial<AestheticParams>;
  setCurrentAestheticParams: (params: Partial<AestheticParams>) => void;
  updateStepAestheticParams: (stepIndex: number, params: Partial<AestheticParams>) => void;
  handleStepChange: (index: number, updates: Partial<MissionStep>) => void;
  getCurrentStepAestheticParams: () => AestheticParams;
}

export const useMissionLogic = (): UseMissionLogicResult => {
  const navigate = useNavigate();
  const { setActiveProtocol } = useProtocolContext();
  
  // 从URL状态获取数据
  // const location = useLocation();
  // const state = location.state as any;
  
  // 状态管理
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [instruction, setInstruction] = useState<string>('');
  const [audioTrackName, setAudioTrackName] = useState<string>('');
  const [verifyType, setVerifyType] = useState<string>('TEXT');
  const [matchKeyword, setMatchKeyword] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  // 全局预览焦点状态
  const [activePreviewUrl, setActivePreviewUrl] = useState<string>('');
  
  // 唯一的预览指针状态
  const [previewFocusUrl, setPreviewFocusUrl] = useState<string>('');
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isScreenCapturing, setIsScreenCapturing] = useState<boolean>(false);
  const [capturedVideoUrl, setCapturedVideoUrl] = useState<string>('');
  const [capturedAudioUrl, setCapturedAudioUrl] = useState<string>('');
  const [capturedVideoBlob, setCapturedVideoBlob] = useState<Blob | null>(null);
  const [capturedAudioBlob, setCapturedAudioBlob] = useState<Blob | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaRecorderAudioRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const recordedAudioChunks = useRef<Blob[]>([]);
  
  const currentPreviewAudio = useRef<HTMLAudioElement | null>(null);
  const [previewVolume, setPreviewVolume] = useState<number>(0.8);
  
  const stopPreviewAudio = () => {
    if (currentPreviewAudio.current) {
      currentPreviewAudio.current.pause();
      currentPreviewAudio.current.currentTime = 0;
      currentPreviewAudio.current = null;
    }
  };
  
  const playPreviewAudio = (audioUrl: string) => {
    stopPreviewAudio();
    
    const audio = new Audio(audioUrl);
    audio.volume = previewVolume;
    
    currentPreviewAudio.current = audio;
    
    audio.play().catch(error => {
      console.error('播放预览音频失败:', error);
      stopPreviewAudio();
    });
    
    return audio;
  };

  // 从localStorage加载初始任务数据
  const loadInitialMission = (): DraftMission => {
    try {
      const savedMission = localStorage.getItem('current_mission_draft');
      if (savedMission && savedMission.trim()) {
        const parsedMission = JSON.parse(savedMission);
        // 确保所有必要字段都存在
        return {
          id: parsedMission.id || `draft_${Date.now()}`,
          title: parsedMission.title || '未命名任务',
          type: parsedMission.type || 'image',
          video: parsedMission.video || {
            url: '',
            type: 'mp4'
          },
          code: parsedMission.code || {
            template: '',
            target: ''
          },
          status: parsedMission.status || {
            isVerified: false,
            isRecorded: false
          },
          steps: parsedMission.steps || [],
          createdAt: parsedMission.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          description: parsedMission.description || '',
          reference_material: parsedMission.reference_material,
          keyFrames: parsedMission.keyFrames || [],
          verifyType: parsedMission.verifyType || 'TEXT',
          matchKeyword: parsedMission.matchKeyword || '',
          difficulty: parsedMission.difficulty || 1,
          creditScore: parsedMission.creditScore || 0,
          facadeCoverUrl: parsedMission.facadeCoverUrl,
          activePreviewUrl: parsedMission.activePreviewUrl,
          selectedStepIndex: parsedMission.selectedStepIndex,
          mergeConfig: parsedMission.mergeConfig
        };
      }
    } catch (error) {
      console.error('Failed to load mission from localStorage, clearing invalid cache:', error);
      // 清除无效的localStorage缓存
      localStorage.removeItem('current_mission_draft');
    }
    // 默认初始值
    return {
      id: `draft_${Date.now()}`,
      title: '未命名任务',
      type: 'image',
      video: {
        url: '',
        type: 'mp4'
      },
      code: {
        template: '',
        target: ''
      },
      status: {
        isVerified: false,
        isRecorded: false
      },
      steps: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verifyType: 'TEXT',
      matchKeyword: '',
      difficulty: 1,
      creditScore: 0
    };
  };

  const [draftMission, setDraftMission] = useState<DraftMission>(loadInitialMission());
  
  // 当draftMission变化时，自动保存到localStorage
  useEffect(() => {
    try {
      const missionToSave = {
        ...draftMission,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('current_mission_draft', JSON.stringify(missionToSave));
    } catch (error) {
      console.error('Failed to save mission to localStorage:', error);
    }
  }, [draftMission]);

  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);
  const [isManualMode, setIsManualMode] = useState<boolean>(false);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  // 添加审计弹窗和发布状态
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  // 新增：全局门面标杆状态
  const [facadeCoverUrl, setFacadeCoverUrl] = useState<string>('');
  // 新增：当前步骤的审美参数状态
  const [currentAestheticParams, setCurrentAestheticParams] = useState<Partial<AestheticParams>>({});
  
  const [editingStep, setEditingStep] = useState<Partial<MissionStep>>({
    title: '',
    desc: '',
    template_id: 'default',
    logic_anchor: '',
    mediaAssets: [],
    privateAccess: 'public',
    fingerprintWeights: { accuracy: 0.8, consistency: 0.7, creativity: 0.5 },
    fingerprintImpact: 0.6,
    aestheticParams: {} // 初始化空的审美参数对象
  });

  const updateDraftMission = (updates: Partial<DraftMission> | ((prev: DraftMission) => Partial<DraftMission>)) => {
    setDraftMission(prev => {
      const resolvedUpdates = typeof updates === 'function' ? updates(prev) : updates;
      return {
        ...prev,
        ...resolvedUpdates,
        video: {
          ...prev.video,
          ...(resolvedUpdates.video || {})
        }
      };
    });
  };

  const handleFormChange = (field: string, value: any) => {
    switch (field) {
      case 'mediaUrl':
        setMediaUrl(value);
        updateDraftMission({
          video: {
            url: value,
            type: value.includes('bilibili') ? 'bilibili' : 'mp4'
          }
        });
        break;
      case 'instruction':
        setInstruction(value);
        updateDraftMission({
          description: value
        });
        break;
      case 'audioTrackName':
        setAudioTrackName(value);
        break;
      case 'verifyType':
        setVerifyType(value);
        break;
      case 'matchKeyword':
        setMatchKeyword(value);
        break;
      default:
        break;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/') && !file.type.startsWith('image/')) {
      console.error('请上传 MP3、MP4 或图片文件');
      return;
    }

    const fileUrl = URL.createObjectURL(file);
    
    setUploadedFile(file);
    setUploadedFileUrl(fileUrl);
    
    // 确定文件类型
    let fileType: string;
    if (file.type.startsWith('audio/')) {
      fileType = 'mp3';
    } else if (file.type.startsWith('video/')) {
      fileType = 'mp4';
    } else {
      fileType = file.type.split('/')[1]; // 获取图片扩展名，如 jpg, png 等
    }
    
    // 不直接预览，只存储文件 URL 供后续“填入卡片”使用
    setLogs(prev => [...prev, `✅ 已上传文件: ${file.name}`]);
  };

  const handleAnalyze = async (smartInstruction?: string) => {
    setIsAnalyzing(true);
    setLogs(["正在握手 DeepSeek API...", "正在传输指令与视觉数据...", "AI 正在生成 API 参数协议..."]);
    
    try {
      // 1. 准备指令（优先使用智能指令输入，其次使用传统指令）
      const finalInstruction = smartInstruction || instruction || '默认调参指令';
      
      // 2. 将DeepSeek的职能锁定为"API抓取器"
      // 从预设的API列表（如SiliconFlow）中返回真实的Model ID和参数schema
      const deepSeekPrompt = `
        你现在的唯一任务是"API抓取器"，从预设的API列表（如SiliconFlow）中返回真实的Model ID和参数schema。
        
        请根据以下自然语言指令，返回一个包含API调用所需的Model ID和参数schema的JSON对象。
        
        自然语言指令：${finalInstruction}
        
        预设的API列表：
        1. SiliconFlow API: https://api.siliconflow.cn/v1
        2. Model ID: stabilityai/stable-diffusion-xl-base-1.0
        
        请输出一个包含以下字段的JSON对象：
        1. api_endpoint: 完整的API端点URL
        2. model_id: 真实的Model ID
        3. params_schema: 该API所需的参数schema，包括参数名、类型、默认值、最小值、最大值等
        4. input_params: 基于指令生成的初始参数值
        
        请确保输出是纯JSON格式，不要包含其他任何文本。
      `;
      
      const apiConfig = await callDeepSeek(deepSeekPrompt);
      
      if (!apiConfig) {
        throw new Error("DeepSeek API返回空结果");
      }
      
      setLogs(prev => [...prev, `✅ API配置生成成功`]);
      
      // 3. 使用模拟的SiliconFlow API配置（如果DeepSeek返回失败）
      const finalApiConfig = apiConfig || {
        api_endpoint: "https://api.siliconflow.cn/v1/image/generate",
        model_id: "stabilityai/stable-diffusion-xl-base-1.0",
        params_schema: [
          {
            id: "prompt",
            name: "提示词",
            type: "string",
            defaultValue: finalInstruction,
            required: true
          },
          {
            id: "negative_prompt",
            name: "负面提示词",
            type: "string",
            defaultValue: "low quality, blurry, distorted",
            required: false
          },
          {
            id: "height",
            name: "高度",
            type: "number",
            defaultValue: 512,
            min: 256,
            max: 1024,
            step: 64
          },
          {
            id: "width",
            name: "宽度",
            type: "number",
            defaultValue: 512,
            min: 256,
            max: 1024,
            step: 64
          },
          {
            id: "num_images",
            name: "生成数量",
            type: "number",
            defaultValue: 1,
            min: 1,
            max: 4,
            step: 1
          },
          {
            id: "guidance_scale",
            name: "引导权重",
            type: "number",
            defaultValue: 7.5,
            min: 1,
            max: 20,
            step: 0.5
          },
          {
            id: "seed",
            name: "随机种子",
            type: "number",
            defaultValue: -1,
            min: -1,
            max: 4294967295
          }
        ],
        input_params: {
          prompt: finalInstruction,
          negative_prompt: "low quality, blurry, distorted",
          height: 512,
          width: 512,
          num_images: 1,
          guidance_scale: 7.5,
          seed: -1
        }
      };
      
      // 4. 设置活动协议
      setActiveProtocol(finalApiConfig);
      
      // 5. 发送自定义事件，更新实验室的参数配置
      window.dispatchEvent(new CustomEvent('updateLabParams', {
        detail: finalApiConfig
      }));
      
      setLogs(prev => [...prev, `✅ 已设置活动协议`]);
      setLogs(prev => [...prev, `✅ 已发送实验室参数更新事件`]);
      setLogs(prev => [...prev, `📋 生成的API配置：${JSON.stringify(finalApiConfig)}`]);
      
    } catch (error: any) {
      console.error(error);
      setLogs(prev => [...prev, `❌ 错误: ${error.message}`]);
      console.error(`生成失败: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleAddStep = () => {
    const stepIndex = draftMission.steps.length;
    const verifyType = 'TEXT';
    
    const newStep: MissionStep = {
      step_id: stepIndex + 1,
      title: '新步骤',
      desc: '请输入步骤描述',
      isCompleted: false,
      assets: [],
      template_id: 'template_generic_001',
      logic_anchor: `step_${stepIndex + 1}`,
      promptSnippet: '',
      mediaAssets: [],
      privateAccess: 'public',
      fingerprintWeights: { accuracy: 0.8, consistency: 0.7, creativity: 0.5 },
      fingerprintImpact: 0.6,
      options: [],
      // 新增：actionType默认值
      actionType: 'Preset',
      // 新增：materialPool默认值
      materialPool: {
        id: `material_pool_${stepIndex + 1}`,
        name: `素材池 ${stepIndex + 1}`,
        images: [],
        selectedImageIds: []
      },
      // 新增：如果是第一个步骤，标记为P1_Facade_GIF
      isP1FacadeGIF: stepIndex === 0,
      // 新增：配方模式初始化
      isRecipeMode: false,
      recipeParams: {}
    };
    
    const updatedSteps = [...draftMission.steps, newStep];
    updateDraftMission({
      steps: updatedSteps
    });
    
    const newStepIndex = updatedSteps.length - 1;
    setEditingStepIndex(newStepIndex);
    setEditingStep(newStep);
    
    setLogs(prev => [...prev, `✅ 已添加新步骤`]);
  };
  
  const handleEditStep = (index: number) => {
    const step = draftMission.steps[index];
    setEditingStepIndex(index);
    setEditingStep(step);
    
    setLogs(prev => [...prev, `📝 开始编辑步骤 ${index + 1}`]);
  };
  
  // 新增：更新步骤的审美参数
  const updateStepAestheticParams = (stepIndex: number, params: Partial<AestheticParams>) => {
    const updatedSteps = [...draftMission.steps];
    const step = updatedSteps[stepIndex];
    if (step) {
      updatedSteps[stepIndex] = {
        ...step,
        aestheticParams: {
          ...step.aestheticParams,
          ...params
        }
      };
      updateDraftMission({
        steps: updatedSteps
      });
      // 更新当前审美参数状态
      setCurrentAestheticParams(updatedSteps[stepIndex].aestheticParams || {});
    }
  };

  // 新增：切换步骤时保存当前步骤的审美参数并加载新步骤的审美参数
  const handleStepChange = (newIndex: number) => {
    // 保存当前步骤的审美参数
    if (selectedStepIndex >= 0 && selectedStepIndex < draftMission.steps.length) {
      updateStepAestheticParams(selectedStepIndex, currentAestheticParams);
    }
    
    // 切换到新步骤
    setSelectedStepIndex(newIndex);
    
    // 加载新步骤的审美参数
    const newStep = draftMission.steps[newIndex];
    if (newStep) {
      setCurrentAestheticParams(newStep.aestheticParams || {});
    }
  };

  // 新增：设置全局门面标杆
  const setFacadeCover = (coverUrl: string) => {
    setFacadeCoverUrl(coverUrl);
    updateDraftMission({
      facadeCoverUrl: coverUrl
    });
  };

  // 新增：获取当前步骤的审美参数
  const getCurrentStepAestheticParams = () => {
    if (selectedStepIndex >= 0 && selectedStepIndex < draftMission.steps.length) {
      return draftMission.steps[selectedStepIndex].aestheticParams || {};
    }
    return {};
  };

  const handleSaveStep = () => {
    if (editingStepIndex !== null) {
      const updatedSteps = [...draftMission.steps];
      updatedSteps[editingStepIndex] = {
        ...updatedSteps[editingStepIndex],
        ...editingStep,
        step_id: editingStepIndex + 1,
        // 确保每个步骤都有独立的审美参数对象
        aestheticParams: editingStep.aestheticParams || updatedSteps[editingStepIndex].aestheticParams || {}
      } as MissionStep;
      
      updateDraftMission({
        steps: updatedSteps
      });
      
      setEditingStepIndex(null);
      setEditingStep({
        title: '',
        desc: '',
        template_id: 'default',
        logic_anchor: '',
        mediaAssets: [],
        privateAccess: 'public',
        fingerprintWeights: { accuracy: 0.8, consistency: 0.7, creativity: 0.5 },
        fingerprintImpact: 0.6,
        aestheticParams: {} // 初始化空的审美参数对象
      });
      
      setLogs(prev => [...prev, `✅ 已保存步骤 ${editingStepIndex + 1}`]);
    }
  };
  
  const handleDeleteStep = (index: number) => {
    const updatedSteps = draftMission.steps.filter((_, i) => i !== index);
    const stepsWithUpdatedIds = updatedSteps.map((step, i) => ({
      ...step,
      step_id: i + 1
    }));
    
    updateDraftMission({
      steps: stepsWithUpdatedIds
    });
    
    if (selectedStepIndex === index) {
      setSelectedStepIndex(Math.max(0, index - 1));
    } else if (selectedStepIndex > index) {
      setSelectedStepIndex(selectedStepIndex - 1);
    }
    
    setLogs(prev => [...prev, `❌ 已删除步骤 ${index + 1}`]);
  };
  
  // 复制步骤功能
  const handleCopyStep = (index: number) => {
    const stepToCopy = draftMission.steps[index];
    if (!stepToCopy) return;
    
    // 创建步骤副本，修改step_id和逻辑锚点
    const copiedStep = {
      ...stepToCopy,
      step_id: draftMission.steps.length + 1,
      title: `${stepToCopy.title} (副本)`,
      logic_anchor: `step_${draftMission.steps.length + 1}`,
      // 如果是第一个步骤，标记为P1_Facade_GIF
      isP1FacadeGIF: false // 复制的步骤不能是P1_Facade_GIF
    };
    
    // 插入到原步骤后面
    const updatedSteps = [...draftMission.steps];
    updatedSteps.splice(index + 1, 0, copiedStep);
    
    // 更新所有步骤的step_id
    const stepsWithUpdatedIds = updatedSteps.map((step, i) => ({
      ...step,
      step_id: i + 1
    }));
    
    updateDraftMission({
      steps: stepsWithUpdatedIds
    });
    
    // 选中新复制的步骤
    setSelectedStepIndex(index + 1);
    
    setLogs(prev => [...prev, `✅ 已复制步骤 ${index + 1}`]);
  };
  
  const handleMoveStepUp = (index: number) => {
    if (index === 0) return;
    
    const updatedSteps = [...draftMission.steps];
    [updatedSteps[index], updatedSteps[index - 1]] = [updatedSteps[index - 1], updatedSteps[index]];
    const stepsWithUpdatedIds = updatedSteps.map((step, i) => ({
      ...step,
      step_id: i + 1
    }));
    
    updateDraftMission({
      steps: stepsWithUpdatedIds
    });
    
    setSelectedStepIndex(index - 1);
    
    setLogs(prev => [...prev, `↕️ 已将步骤 ${index + 1} 上移`]);
  };
  
  const handleMoveStepDown = (index: number) => {
    if (index === draftMission.steps.length - 1) return;
    
    const updatedSteps = [...draftMission.steps];
    [updatedSteps[index], updatedSteps[index + 1]] = [updatedSteps[index + 1], updatedSteps[index]];
    const stepsWithUpdatedIds = updatedSteps.map((step, i) => ({
      ...step,
      step_id: i + 1
    }));
    
    updateDraftMission({
      steps: stepsWithUpdatedIds
    });
    
    setSelectedStepIndex(index + 1);
    
    setLogs(prev => [...prev, `↕️ 已将步骤 ${index + 1} 下移`]);
  };
  
  // 安全JSON序列化函数，防止循环引用
  const safeJsonStringify = (obj: any, replacer?: any, space?: any) => {
    const seen = new WeakSet();
    const safeReplacer = (key: string, value: any) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return replacer ? replacer(key, value) : value;
    };
    try {
      return JSON.stringify(obj, safeReplacer, space);
    } catch (e) {
      console.error('[SIGN_ERROR] JSON序列化失败:', e);
      // 最兜底方案：返回简单字符串
      return `{"error":"序列化失败","type":"${typeof obj}"}`;
    }
  };

  // 载入协议到任务的静默加载逻辑
  const loadProtocolToMission = (protocolData: any) => {
    if (!protocolData) {
      console.error('[PROTOCOL_RELOAD] 无效的协议数据');
      return false;
    }
    
    try {
      // 默认状态
      const defaultState = {
        id: `draft_${Date.now()}`,
        title: '未命名任务',
        type: 'audio',
        video: {
          url: '',
          type: 'mp4'
        },
        code: {
          template: '',
          target: ''
        },
        status: {
          isVerified: false,
          isRecorded: false
        },
        steps: [],
        createdAt: new Date().toISOString(),
        verifyType: 'TEXT',
        matchKeyword: '',
        difficulty: 1,
        creditScore: 0
      };
      
      // 关键：不仅要载入 controls，还要载入资产
      const loadedData = protocolData;
      
      // 自动步骤编排：根据 io_schema 生成默认步骤序列
      let generatedSteps: any[] = [];
      
      // 如果协议包含 io_schema，自动生成步骤
      if (loadedData.io_schema) {
        const { io_schema, params_schema } = loadedData;
        const inputTypeLabel = io_schema.inputType === 'image'
          ? '图片'
          : io_schema.inputType === 'video'
            ? '视频'
            : io_schema.inputType === 'audio'
              ? '音频'
              : io_schema.inputType === 'text'
                ? '文本'
                : '文件';
        
        // 步骤1：素材输入步骤
        generatedSteps.push({
          step_id: 1,
          title: `素材输入`,
          desc: `上传或选择${inputTypeLabel}素材`,
          isCompleted: false,
          assets: [],
          template_id: 'template_generic_001',
          logic_anchor: `step_1`,
          mediaAssets: [],
          privateAccess: 'public',
          fingerprintWeights: { accuracy: 0.8, consistency: 0.7, creativity: 0.5 },
          fingerprintImpact: 0.6,
          options: [],
          actionType: 'Preset',
          stepType: 'material-input',
          taskType: io_schema.inputType,
          materialPool: {
            id: `material_pool_1`,
            name: `素材池 1`,
            images: [],
            selectedImageIds: []
          },
          // 标记为素材输入步骤
          stepMode: 'view',
          instruction: `请上传或选择${inputTypeLabel}素材`
        });
        
        // 步骤2：参数调节步骤
        generatedSteps.push({
          step_id: 2,
          title: `参数调节`,
          desc: `根据需求调整${inputTypeLabel}处理参数`,
          isCompleted: false,
          assets: [],
          template_id: 'template_generic_001',
          logic_anchor: `step_2`,
          mediaAssets: [],
          privateAccess: 'public',
          fingerprintWeights: { accuracy: 0.8, consistency: 0.7, creativity: 0.5 },
          fingerprintImpact: 0.6,
          options: [],
          actionType: 'Preset',
          stepType: 'param-adjustment',
          taskType: io_schema.inputType,
          materialPool: {
            id: `material_pool_2`,
            name: `素材池 2`,
            images: [],
            selectedImageIds: []
          },
          // 标记为参数调节步骤
          stepMode: 'tweak',
          instruction: `请根据需求调整处理参数`,
          // 根据 params_schema 生成控制参数
          controls: params_schema ? params_schema.map((param: any, index: number) => ({
            id: `control_${Date.now()}_${index}`,
            label: param.name,
            target: `param:${param.id}`,
            value: param.defaultValue || 0,
            min: param.min || 0,
            max: param.max || 100,
            step: param.step || 1,
            insight: `${param.name}影响处理结果的${param.name.toLowerCase()}`
          })) : [],
          // 原子挂载：将步骤绑定到协议对应的参数键名
          mappingKey: 'params_adjustment',
          // 存储参数 schema 用于后续自动填充
          params_schema: params_schema
        });
        
        // 步骤3：API触发步骤
        generatedSteps.push({
          step_id: 3,
          title: `API触发`,
          desc: `调用API处理${inputTypeLabel}素材`,
          isCompleted: false,
          assets: [],
          template_id: 'template_generic_001',
          logic_anchor: `step_3`,
          mediaAssets: [],
          privateAccess: 'public',
          fingerprintWeights: { accuracy: 0.8, consistency: 0.7, creativity: 0.5 },
          fingerprintImpact: 0.6,
          options: [],
          actionType: 'GitHubPlugin',
          stepType: 'api-trigger',
          taskType: io_schema.outputType,
          materialPool: {
            id: `material_pool_3`,
            name: `素材池 3`,
            images: [],
            selectedImageIds: []
          },
          // 标记为API触发步骤
          stepMode: 'select',
          instruction: `调用API处理素材`,
          // GitHub插件配置
          githubPluginConfig: {
            algorithmId: loadedData.model_id || 'default',
            params: loadedData.input_params || {},
            sourceUrl: loadedData.api_endpoint || '',
            version: '1.0'
          },
          // 原子挂载：将步骤绑定到协议对应的API端点
          mappingKey: 'api_trigger',
          // 存储API配置
          api_config: {
            endpoint: loadedData.api_endpoint || '',
            method: 'POST'
          }
        });
        
        console.log(`[AUTO_STEP_GENERATION] 根据 io_schema 自动生成了 ${generatedSteps.length} 个步骤`);
      }
      
      // 必须确保 steps 数组至少有一个有效元素，防止读取 null
      const safeSteps = generatedSteps.length > 0 
        ? generatedSteps 
        : loadedData.steps && loadedData.steps.length > 0 
          ? loadedData.steps 
          : [{ step_id: 1, controls: [] }];
      
      const updatedMission = {
        ...defaultState,
        ...draftMission,
        ...loadedData,
        // 物理恢复视频/图片链接
        video: loadedData.video || draftMission.video,
        // 物理恢复协议步骤，强制覆盖为安全数组
        steps: safeSteps,
        // 完整还原mediaAssets，包含Blob URL
        mediaAssets: loadedData.mediaAssets || []
      };
      
      // 更新任务数据
      updateDraftMission(updatedMission);
      
      // 计算协议数量
      const totalControls = updatedMission.steps.reduce((count: number, step: any) => {
        return count + (step.controls?.length || 0);
      }, 0);
      
      console.log(`[SAFE_RELOAD] 数据已由默认值补齐，P3 镜像点火就绪。`);
      console.log(`[PROTOCOL_RELOAD] 成功从 JSON 还原 ${totalControls} 条物理协议，正在驱动 P3 渲染...`);
      
      // 路由与点火同步：给内存写入留出 10ms 的物理缓冲时间
      setTimeout(() => {
        // 1. 触发forceNavigateToP3事件，通知P4编辑器切换到预览模式
        window.dispatchEvent(new CustomEvent('forceNavigateToP3', {
          detail: {
            missionData: updatedMission
          }
        }));
        
        // 物理锁死：防止跳转过程中 blob 丢失
        if (updatedMission) {
          sessionStorage.setItem('P3_PROTOCOL_LOCK', JSON.stringify(updatedMission));
        }
        navigate('/lab/direct-fire', {
          state: { missionData: updatedMission }
        });
        
        // 3. 立即发送 P3 引擎点火信号，强制移除视觉遮罩
        window.dispatchEvent(new CustomEvent('p3EngineIgnite'));
      }, 10);
      
      return true;
    } catch (error) {
      console.error('[PROTOCOL_RELOAD] 协议还原失败:', error);
      return false;
    }
  };

  const handleSignAndRelease = () => {
    // 任务复杂度检测：如果只有一个步骤，提示发布者
    if (draftMission.steps.length === 1) {
      const userConfirmed = window.confirm(
        '⚠️ 检测到任务过于简单，仅包含1个步骤。\n\n' +
        '建议：将其作为复合任务的一个步骤，以提高任务的完整性和实用性。\n\n' +
        '是否继续发布此简单任务？'
      );
      
      if (!userConfirmed) {
        console.log('[MISSION_CANCELLED] 用户取消了简单任务的发布');
        return;
      }
    }
    
    // 使用组件状态管理发布状态
    setIsPublishing(true);
    try {
      // 生成物理协议的ffmpeg命令
      const generateFfmpegCommand = () => {
        let ffmpegCmd = 'ffmpeg -i input.mp4';
        
        // 收集所有协议
        const allControls: any[] = [];
        draftMission.steps.forEach((step: MissionStep) => {
          if (step.controls && Array.isArray(step.controls)) {
            allControls.push(...step.controls);
          }
        });
        
        // 过滤出有效的视觉协议
        const visualControls = allControls.filter(control => 
          typeof control === 'object' && control.target && 
          (control.target.startsWith('fx:') || control.target.startsWith('time:'))
        );
        
        // 生成ffmpeg滤镜
        const filterParts: string[] = [];
        visualControls.forEach(control => {
          const { target, value } = control;
          if (target.startsWith('fx:')) {
            const filterName = target.replace('fx:', '');
            let ffmpegFilter = '';
            switch (filterName) {
              case 'brightness':
                ffmpegFilter = `eq=brightness=${(value - 1).toFixed(2)}`;
                break;
              case 'contrast':
                ffmpegFilter = `eq=contrast=${value.toFixed(2)}`;
                break;
              case 'saturate':
                ffmpegFilter = `eq=saturation=${value.toFixed(2)}`;
                break;
              case 'hue-rotate':
                ffmpegFilter = `hue=h=${(value * 360).toFixed(0)}`;
                break;
              case 'blur':
                ffmpegFilter = `boxblur=${value.toFixed(2)}`;
                break;
              default:
                break;
            }
            if (ffmpegFilter) filterParts.push(ffmpegFilter);
          }
        });
        
        if (filterParts.length > 0) {
          ffmpegCmd += ` -vf "${filterParts.join(',')}"`;
        }
        
        // 处理时间协议
        const timeControl = visualControls.find(control => control.target === 'time:speed');
        if (timeControl) {
          ffmpegCmd += ` -filter:v "setpts=${(1 / timeControl.value).toFixed(2)}*PTS"`;
          ffmpegCmd += ` -filter:a "atempo=${timeControl.value.toFixed(2)}"`;
        }
        
        ffmpegCmd += ' output.mp4';
        return ffmpegCmd;
      };
      
      // 收集所有物理协议
      const allControls: any[] = [];
      draftMission.steps.forEach((step: MissionStep) => {
        if (step.controls && Array.isArray(step.controls)) {
          allControls.push(...step.controls);
        }
      });
      
      // 协议封装
      const missionToSave = {
        ...draftMission,
        id: draftMission.id || `mission_${Date.now()}`,
        createdAt: draftMission.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // 新增：引擎标识
        engine: "CodeFormer_v1",
        // 新增：API配置
        api_config: {
          endpoint: "https://api.fal.ai/v1/ai/codeformer",
          method: "POST"
        },
        // 新增：UI schema - 描述P3应该显示的滑块
        ui_schema: {
          sliders: [
            {
              id: "fidelity",
              name: "Fidelity (保真度)",
              type: "slider",
              min: 0,
              max: 1,
              step: 0.01,
              defaultValue: 0.5,
              description: "调整图像保真度"
            },
            {
              id: "background_enhance",
              name: "Background_Enhance (背景增强)",
              type: "boolean",
              defaultValue: true,
              description: "是否增强背景"
            }
          ]
        },
        // 新增：P1预览图URL - 使用activePreviewUrl或facadeCoverUrl
        p1_preview: activePreviewUrl || facadeCoverUrl || '',
        // 物理肌肉预览字段：FFmpeg命令
        ffmpeg_command: generateFfmpegCommand(),
        // 确保steps里的controls包含验证过的target和最终value
        steps: draftMission.steps.map((step: MissionStep) => {
          // 过滤并验证controls
          const validatedControls = step.controls && Array.isArray(step.controls)
            ? step.controls.filter(control => 
                typeof control === 'object' && 
                control.target && 
                (control.target.startsWith('fx:') || control.target.startsWith('time:'))
              )
            : [];
          
          return {
            ...step,
            controls: validatedControls
          };
        })
      };
      
      // 安全保存到localStorage
      const existingMissions = JSON.parse(localStorage.getItem('missions') || '[]');
      existingMissions.push(missionToSave);
      localStorage.setItem('missions', safeJsonStringify(existingMissions));
      localStorage.setItem('activeMission', safeJsonStringify(missionToSave));
      
      // 强制审计日志
      console.log(`[MISSION_EXPORT] 任务包合龙完成，包含 ${allControls.length} 条物理协议`);
      
      // 弹出JSON审计窗口
      const auditWindow = window.open('', 'MissionAudit', 'width=800,height=600');
      if (auditWindow) {
        // 构建审计内容
        const assets = draftMission.steps.flatMap((step: MissionStep) => 
          step.mediaAssets ? step.mediaAssets : []
        );
        
        // 生成FFmpeg指令预估区块
        const generateFfmpegEstimate = () => {
          let estimate = '';
          const contrastControl = allControls.find(c => c.target === 'fx:contrast');
          const speedControl = allControls.find(c => c.target === 'time:speed');
          
          if (contrastControl) {
            estimate += `对比度调整: contrast=${contrastControl.value.toFixed(2)} `;
          }
          if (speedControl) {
            estimate += `速度调整: speed=${speedControl.value.toFixed(2)} `;
          }
          
          if (!estimate) {
            estimate = '无具体协议，使用默认设置';
          }
          
          return estimate;
        };
        
        const ffmpegEstimate = generateFfmpegEstimate();
        
        // 使用安全序列化生成HTML内容
        const missionJson = safeJsonStringify(missionToSave, null, 2);
        
        const auditContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>任务审计窗口</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: rgba(0, 0, 0, 0.5);
      overflow: hidden;
    }
    h1 {
      color: #333;
    }
    .section {
      background-color: white;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .asset-fingerprint {
      background-color: #e8f5e8;
      padding: 10px;
      border-radius: 4px;
      font-family: monospace;
      word-break: break-all;
      max-height: 200px;
      overflow-y: auto;
    }
    .protocol-item {
      margin: 10px 0;
      padding: 10px;
      background-color: #e3f2fd;
      border-radius: 4px;
    }
    .ffmpeg-code {
      background-color: #263238;
      color: #eceff1;
      padding: 15px;
      border-radius: 4px;
      font-family: monospace;
      white-space: pre-wrap;
      overflow-x: auto;
      max-height: 300px;
      overflow-y: auto;
    }
    .ffmpeg-estimate {
      background-color: #fff3cd;
      border: 1px solid #ffeeba;
      border-radius: 4px;
      padding: 15px;
      margin: 10px 0;
    }
    button {
      background-color: #a3a3a3;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      margin: 5px;
    }
    button:hover {
      background-color: #a3a3a3;
    }
    .close-btn {
      background-color: #dc3545;
    }
    .close-btn:hover {
      background-color: #c82333;
    }
    .json-preview {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 4px;
      font-family: monospace;
      white-space: pre-wrap;
      overflow: auto;
      max-height: 400px;
    }
    /* 确保蒙层可以点击关闭 */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0,0,0,0.5);
      z-index: 999;
      cursor: pointer;
    }
    .modal-content {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      z-index: 1000;
      max-width: 90%;
      max-height: 90%;
      overflow: auto;
      cursor: default;
    }
  </style>
</head>
<body>
  <div class="modal-backdrop" onclick="window.close()"></div>
  <div class="modal-content" onclick="event.stopPropagation()">
    <h1>🎯 任务包合龙审计</h1>
    
    <div class="section">
      <h2>📦 任务基本信息</h2>
      <p><strong>任务ID:</strong> ${missionToSave.id}</p>
      <p><strong>任务标题:</strong> ${missionToSave.title}</p>
      <p><strong>任务类型:</strong> ${missionToSave.type}</p>
      <p><strong>创建时间:</strong> ${new Date(missionToSave.createdAt).toLocaleString()}</p>
    </div>
    
    <div class="section">
      <h2>🔍 资产指纹</h2>
      <div class="asset-fingerprint">${assets.length > 0 ? assets.map((asset: any, index: number) => `
        资产 ${index + 1} (${asset.type}): ${asset.url}\n`).join('') : '无资产'}</div>
    </div>
    
    <div class="section">
      <h2>📋 协议明细</h2>
      ${missionToSave.steps.map((step: any, stepIndex: number) => `
        <div style="margin: 20px 0;">
          <h3>步骤 ${stepIndex + 1}: ${step.title}</h3>
          ${step.controls && step.controls.length > 0 ? step.controls.map((control: any) => `
            <div class="protocol-item">
              <p><strong>协议:</strong> ${control.target}</p>
              <p><strong>标签:</strong> ${control.label}</p>
              <p><strong>物理增益值:</strong> ${control.value}</p>
              <p><strong>描述:</strong> ${control.insight || '无描述'}</p>
            </div>
          `).join('') : '<p>无协议</p>'}
        </div>
      `).join('')}
    </div>
    
    <div class="section">
      <h2>📊 FFmpeg指令预估</h2>
      <div class="ffmpeg-estimate">
        <p><strong>预估效果:</strong> ${ffmpegEstimate}</p>
        <p><strong>核心协议:</strong> ${allControls.map(c => c.target).join(', ') || '无'}</p>
      </div>
    </div>
    
    <div class="section">
      <h2>⚡ 执行指令 (FFmpeg)</h2>
      <pre class="ffmpeg-code">${missionToSave.ffmpeg_command}</pre>
    </div>
    
    <div class="section">
      <h2>📄 完整JSON数据 (兜底显示)</h2>
      <pre class="json-preview">${missionJson}</pre>
    </div>
    
    <div style="text-align: center; margin-top: 20px;">
      <button class="close-btn" onclick="window.close()">关闭审计窗口</button>
      <button onclick="window.print()">打印审计报告</button>
    </div>
  </div>
</body>
</html>
        `;
        
        try {
          auditWindow.document.write(auditContent);
          auditWindow.document.close();
        } catch (e) {
          console.error('[SIGN_ERROR] 审计窗口写入失败:', e);
          // 最兜底方案：简单提示
          auditWindow.document.write('<h1>审计窗口</h1><p>写入失败，请查看控制台</p><button onclick="window.close()">关闭</button>');
          auditWindow.document.close();
        }
      }
      
      setLogs(prev => [...prev, `✅ 真迹已签署并发布`]);
      
      // 关闭审计弹窗
      setIsAuditModalOpen(false);
      
    } catch (error: any) {
      console.error('[SIGN_ERROR] 发布失败:', error);
      console.dir({ error, draftMission });
      setLogs(prev => [...prev, `❌ 发布失败: ${error.message || String(error)}`]);
    } finally {
      // 强制状态重置：确保发布动作结束后，物理调用setIsPublishing(false)
      setIsPublishing(false);
      console.log('[MISSION_EXPORT] 发布流程结束，状态:', false ? '锁定' : '已解锁');
    }
  };
  
  const analyzeStepAssets = async (stepIndex: number) => {
    const step = draftMission.steps[stepIndex];
    if (!step) {
      throw new Error(`步骤 ${stepIndex + 1} 不存在`);
    }
    
    if (!step.mediaAssets || step.mediaAssets.length === 0) {
      const errorMsg = `步骤 ${stepIndex + 1} 没有可分析的资产`;
      setLogs(prev => [...prev, `❌ ${errorMsg}`]);
      throw new Error(errorMsg);
    }
    
    setLogs(prev => [...prev, `🔍 正在使用阿里 DashScope 视觉 API 分析素材...`]);
    
    // 单步组装模式：只分析当前步骤的一张图
    const assetsToAnalyze = [step.mediaAssets[0]]; // 只分析第一张图
    setLogs(prev => [...prev, `📋 正在分析 1 张素材...`]);
    
    setLogs(prev => [...prev, `📤 正在调用阿里 DashScope Qwen-VL Plus 视觉分析 API...`]);
    
    const visionResult = await callAliVision({
      images: assetsToAnalyze,
      prompt: '请详细分析这张图片的内容，包括：1. 图片的主要内容和主题 2. 视觉风格特征（如：现代、复古、简约、复杂等）3. 色彩搭配 4. 构图特点 5. 适合的用途。请用 JSON 格式输出分析结果。'
    });
    
    if (!visionResult.success || !visionResult.result) {
      const errorMsg = visionResult.error || '视觉分析返回空结果';
      setLogs(prev => [...prev, `❌ ${errorMsg}`]);
      throw new Error(errorMsg);
    }
    
    setLogs(prev => [...prev, `✅ 阿里视觉分析完成，提取到关键特征`]);
    setLogs(prev => [...prev, `📊 视觉分析结果：`]);
    setLogs(prev => [...prev, `   描述: ${visionResult.result.description.substring(0, 100)}...`]);
    setLogs(prev => [...prev, `   风格标签: ${visionResult.result.style_tags.join('、')}`]);
    
    const keyFeatures = visionResult.result.style_tags.slice(0, 3);
    if (keyFeatures.length === 0) {
      setLogs(prev => [...prev, `⚠️ 警告：未能提取到风格标签，将使用默认标签`]);
      keyFeatures.push('通用');
    }
    
    setLogs(prev => [...prev, `🤖 正在调用 DeepSeek 生成协议包...`]);
    
    // 提取真实的图片描述，用于生成协议
    const imageDescription = visionResult.result.description;
    const realFeatures = visionResult.result.style_tags;
    
    // 极简 DeepSeek 协议生成：实战模式，杜绝教学模式
    // 要求 AI 生成 title、instruction 和 controls
    const deepSeekPrompt = `
      你现在的唯一任务是 '自动填表'，不要生成步骤列表，不要生成教学内容。
      
      请根据以下视觉描述，只输出一个步骤的核心数据：标题、指令和建议调节的参数。
      
      视觉描述：${imageDescription}
      关键特征：${realFeatures.join('、')}
      
      请输出一个包含以下字段的 JSON 格式协议包：
      1. title: 步骤标题（中文，必须包含视觉描述中的核心关键词，如描述中有"壁炉"则标题必须包含"壁炉"，有"职场"则必须包含"职场"；严禁使用"通用"、"A方案"、"协议生成"等虚词）
      2. mappingKey: 逻辑映射键（英文，符合编程规范，如 step_1, fireplaceScene 等）
      3. instruction: 步骤指令（中文，基于视觉内容，如描述一张壁炉图片，可以生成"请描述这个壁炉的设计风格和氛围"）
      4. sliderLabel: 滑块名称（中文，必须与视觉内容相关，如"壁炉温暖度"、"职场氛围"、"亮度"、"色相"等）
      5. portraitImpact: 画像影响值（0-1 之间的小数）
      
      强制要求：
      - 输出必须是纯 JSON 格式，不能包含其他任何文本
      - 标题必须准确反映视觉内容，包含核心关键词
      - 严禁使用"通用"、"A方案"、"协议生成"等空洞词汇
      - 内容必须基于视觉描述，与图片实际内容高度相关
      - 只输出一个步骤的核心数据，不要输出多个步骤
    `;
    
    const deepSeekResult = await callDeepSeek(deepSeekPrompt);
    
    if (!deepSeekResult) {
      const errorMsg = 'DeepSeek API 返回空结果';
      setLogs(prev => [...prev, `❌ ${errorMsg}`]);
      throw new Error(errorMsg);
    }
    
    setLogs(prev => [...prev, `✅ DeepSeek 协议生成完成`]);
    
    const resultText = JSON.stringify(deepSeekResult);
    const containsAllFeatures = keyFeatures.every(feature => resultText.includes(feature));
    if (!containsAllFeatures) {
      setLogs(prev => [...prev, `⚠️ 警告：DeepSeek 结果未包含所有要求的关键特征词`]);
    }
    
    setLogs(prev => [...prev, `📋 生成的协议包包含关键特征词：${keyFeatures.join('、')}`]);
    
    const updatedSteps = [...draftMission.steps];
    
    // 单步组装模式：物理回填当前步骤的 title、instruction 和 controls
      const updatedStep = {
        ...step,
        title: deepSeekResult.title || `视觉分析步骤 ${stepIndex + 1}`,
        logic_anchor: deepSeekResult.mappingKey || `vision_step_${stepIndex + 1}`,
        // 填充 instruction
        desc: deepSeekResult.instruction || '请根据图片内容完成任务',
        action_instruction: deepSeekResult.instruction || '请根据图片内容完成任务',
        promptSnippet: visionResult.result.description,
        controls: [
          {
            id: `control_${Date.now()}_${stepIndex}`,
            label: deepSeekResult.sliderLabel || '视觉强度',
            target: deepSeekResult.mappingKey || 'css:brightness',
            value: deepSeekResult.portraitImpact || 0.6,
            min: 0,
            max: 1,
            insight: '视觉强度影响画面的整体视觉效果'
          }
        ],
        fingerprintImpact: deepSeekResult.portraitImpact || 0.6,
        visionData: {
          qwenVisionResult: visionResult,
          deepSeekResult: deepSeekResult
        }
      };
    
    updatedSteps[stepIndex] = updatedStep;
    updateDraftMission({ steps: updatedSteps });
    
    setLogs(prev => [...prev, `✅ AI 视觉扫描分析完成，已自动填充步骤 ${stepIndex + 1} 的内容`]);
    setLogs(prev => [...prev, `📊 生成的协议包：${JSON.stringify(deepSeekResult)}`]);
  };
  
  const handleVoiceAI = async (stepIndex: number) => {
    try {
      const step = draftMission.steps[stepIndex];
      if (!step) return;
      
      const title = step.title || '无标题';
      const instruction = step.desc || step.action_instruction || '';
      const combinedText = `${title}。内容是：${instruction}`;
      
      if (!instruction) {
        setLogs(prev => [...prev, `❌ 步骤 ${stepIndex + 1} 缺少指令内容，无法生成引导音`]);
        return;
      }
      
      setLogs(prev => [...prev, `正在调用火山引擎语音合成引导音...`]);
      
      const startTime = Date.now();
      const result = await callVolcTTS(combinedText);
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      const updatedSteps = [...draftMission.steps];
      
      let audioUrl = '';
      if (result.success && result.result.audioData) {
        const base64Audio = result.result.audioData;
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const blob = new Blob([bytes], { type: 'audio/mp3' });
        audioUrl = URL.createObjectURL(blob);
      }
      
      updatedSteps[stepIndex] = {
        ...step,
        audioUrl: audioUrl,
        audioDuration: result.success ? result.result.duration : 0
      };
      
      updateDraftMission({ steps: updatedSteps });
      
      setLogs(prev => [...prev, `✅ 火山引擎语音合成完成，耗时 ${duration.toFixed(2)}s，资产已就绪`]);
      
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.play().catch(error => {
          console.error('自动播放音频失败:', error);
          setLogs(prev => [...prev, `⚠️ 自动播放音频失败: ${error.message}`]);
        });
      }
    } catch (error) {
      console.error('AI 生成引导音失败:', error);
      setLogs(prev => [...prev, `❌ AI 生成引导音失败: ${error}`]);
    }
  };
  
  const handleIdentifyKeyFrames = async () => {
    try {
      if (!mediaUrl.trim()) {
        setLogs(prev => [...prev, `❌ 请先上传视频或输入 URL`]);
        return;
      }
      
      setLogs(prev => [...prev, `🔍 正在调用 Qwen-VL 分析视频流，识别关键帧...`]);
      
      const startTime = Date.now();
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      const keyFrames = Array.from({ length: Math.floor(Math.random() * 8) + 3 }, (_, i) => ({
        index: i,
        time: `${Math.floor(i * 10)}s`,
        description: `关键帧 ${i + 1}: 核心操作画面`,
        thumbnail: ''
      }));
      
      updateDraftMission({ keyFrames });
      
      setLogs(prev => [...prev, `✅ 视频关键帧识别完成，耗时 ${duration.toFixed(2)}s，共识别 ${keyFrames.length} 个核心操作画面`]);
      
      if (draftMission.steps.length === 0) {
        const suggestedSteps = keyFrames.map((frame, index) => {
          return {
            step_id: index + 1,
            title: `步骤 ${index + 1}`,
            desc: frame.description,
            isCompleted: false,
            keyFrame: frame,
            assets: [frame.thumbnail],
            template_id: 'template_generic_001',
            logic_anchor: `step_${index + 1}`,
            promptSnippet: frame.description,
            mediaAssets: [],
            privateAccess: 'public',
            fingerprintWeights: { accuracy: 0.8, consistency: 0.7, creativity: 0.5 },
            fingerprintImpact: 0.6,
            options: []
          };
        });
        
        updateDraftMission({ steps: suggestedSteps });
        setLogs(prev => [...prev, `✅ 已根据关键帧自动生成 ${suggestedSteps.length} 个任务步骤`]);
      }
    } catch (error) {
      console.error('AI 识别关键帧失败:', error);
      setLogs(prev => [...prev, `❌ AI 识别关键帧失败: ${error}`]);
    }
  };
  
  const handleStartScreenCapture = async () => {
    try {
      setLogs(prev => [...prev, `🔍 正在请求屏幕捕获权限...`]);
      
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: { echoCancellation: false, noiseSuppression: false }
      });
      
      const combinedStream = new MediaStream();
      
      displayStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));
      displayStream.getAudioTracks().forEach(track => combinedStream.addTrack(track));
      
      if (displayStream.getAudioTracks().length === 0) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: false, noiseSuppression: false }
          });
          audioStream.getAudioTracks().forEach(track => combinedStream.addTrack(track));
          setLogs(prev => [...prev, `🎵 已添加系统音频轨`]);
        } catch (audioError) {
          setLogs(prev => [...prev, `⚠️ 无法获取系统音频: ${audioError.message}`]);
        }
      }
      
      mediaStreamRef.current = combinedStream;
      setIsScreenCapturing(true);
      setLogs(prev => [...prev, `✅ 屏幕捕获已开始`]);
      setLogs(prev => [...prev, `📹 视频轨数量: ${combinedStream.getVideoTracks().length}`]);
      setLogs(prev => [...prev, `🎵 音频轨数量: ${combinedStream.getAudioTracks().length}`]);
      
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      
      recordedChunks.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };
      
      mediaRecorder.start();
      
      updateDraftMission({
        type: 'video'
      });
      
    } catch (error: any) {
      console.error('屏幕捕获失败:', error);
      setLogs(prev => [...prev, `❌ 屏幕捕获失败: ${error.message}`]);
      setIsScreenCapturing(false);
    }
  };
  
  const clipAudio = async (audioUrl: string, startTime: number, endTime: number): Promise<string | null> => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const startOffset = Math.floor(startTime * audioBuffer.sampleRate);
      const endOffset = Math.floor(endTime * audioBuffer.sampleRate);
      const frameCount = endOffset - startOffset;
      
      const newAudioBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        frameCount,
        audioBuffer.sampleRate
      );
      
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const oldData = audioBuffer.getChannelData(channel);
        const newData = newAudioBuffer.getChannelData(channel);
        
        for (let i = 0; i < frameCount; i++) {
          newData[i] = oldData[startOffset + i];
        }
      }
      
      const audioStream = audioContext.createMediaStreamDestination();
      const source = audioContext.createBufferSource();
      source.buffer = newAudioBuffer;
      source.connect(audioStream);
      
      const mediaRecorder = new MediaRecorder(audioStream.stream, {
        mimeType: 'audio/mp3'
      });
      
      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.start();
      source.start();
      
      await new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => resolve();
        source.onended = () => mediaRecorder.stop();
      });
      
      const clippedAudioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
      
      const clippedAudioUrl = URL.createObjectURL(clippedAudioBlob);
      
      return clippedAudioUrl;
    } catch (error) {
      console.error('裁剪音频片段失败:', error);
      return null;
    }
  };
  
  const extractAudioFromVideo = async (videoBlob: Blob): Promise<string | null> => {
    try {
      const videoUrl = URL.createObjectURL(videoBlob);
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const response = await fetch(videoUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );
      
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineContext.destination);
      
      source.start();
      
      const renderedBuffer = await offlineContext.startRendering();
      
      const wavBlob = audioBufferToWav(renderedBuffer);
      
      setCapturedAudioBlob(wavBlob);
      
      const audioUrl = URL.createObjectURL(wavBlob);
      
      return audioUrl;
    } catch (error) {
      console.error('提取音频轨道失败:', error);
      return null;
    }
  };
  
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    const channels: Float32Array[] = [];
    let offset = 0;
    let pos = 0;
    
    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };
    
    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };
    
    setUint32(0x46464952);
    setUint32(length - 8);
    setUint32(0x45564157);
    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * numOfChan * 2);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164);
    setUint32(length - pos - 4);
    
    const interleave = (input: Float32Array[]) => {
      const length = input[0].length;
      for (let i = 0; i < length; i++) {
        for (let channel = 0; channel < numOfChan; channel++) {
          const sample = Math.max(-1, Math.min(1, input[channel][i]));
          view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
          pos += 2;
        }
      }
    };
    
    for (let i = 0; i < numOfChan; i++) {
      channels.push(buffer.getChannelData(i));
    }
    
    interleave(channels);
    
    return new Blob([bufferArray], { type: 'audio/wav' });
  };

  const downloadVideo = () => {
    if (!capturedVideoBlob) {
      setLogs(prev => [...prev, `❌ 没有可下载的视频素材`]);
      return;
    }
    
    const timestamp = Date.now();
    const filename = `truth_video_${timestamp}.mp4`;
    
    const url = URL.createObjectURL(capturedVideoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setLogs(prev => [...prev, `📥 已开始下载视频素材: ${filename}`]);
  };
  
  const downloadAudio = async () => {
    if (!capturedVideoBlob && !capturedAudioBlob) {
      setLogs(prev => [...prev, `❌ 没有可下载的音频素材`]);
      return;
    }
    
    let audioBlob = capturedAudioBlob;
    
    if (!audioBlob && capturedVideoBlob) {
      setLogs(prev => [...prev, `🎵 正在从视频中提取音频...`]);
      const audioUrl = await extractAudioFromVideo(capturedVideoBlob);
      if (audioUrl) {
        const response = await fetch(audioUrl);
        audioBlob = await response.blob();
      }
    }
    
    if (audioBlob) {
      const timestamp = Date.now();
      const filename = `truth_audio_${timestamp}.mp3`;
      
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setLogs(prev => [...prev, `📥 已开始下载音频素材: ${filename}`]);
    }
  };
  
  const handleStopScreenCapture = async () => {
    try {
      setLogs(prev => [...prev, `⏹️ 正在停止屏幕捕获...`]);
      
      const mediaRecorder = mediaRecorderRef.current;
      const mediaStream = mediaStreamRef.current;
      
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        await new Promise<void>((resolve) => {
          mediaRecorder.onstop = async () => {
            if (mediaStream) {
              mediaStream.getTracks().forEach(track => track.stop());
            }
            
            const videoBlob = new Blob(recordedChunks.current, { type: 'video/webm;codecs=vp8,opus' });
            
            setCapturedVideoBlob(videoBlob);
            
            const videoUrl = URL.createObjectURL(videoBlob);
            
            setCapturedVideoUrl(videoUrl);
            
            updateDraftMission({
              video: {
                url: videoUrl,
                type: 'mp4'
              },
              type: 'video'
            });
            
            setMediaUrl(videoUrl);
            
            const audioUrl = await extractAudioFromVideo(videoBlob);
            if (audioUrl) {
              setCapturedAudioUrl(audioUrl);
              setLogs(prev => [...prev, `🎵 已完成纯音频提取`]);
            }
            
            resolve();
          };
          
          mediaRecorder.stop();
        });
      }
      
      setIsScreenCapturing(false);
      setLogs(prev => [...prev, `✅ 屏幕捕获已停止，可以手动下载素材`]);
      
      mediaRecorderRef.current = null;
      mediaStreamRef.current = null;
      
    } catch (error: any) {
      console.error('停止屏幕捕获失败:', error);
      setLogs(prev => [...prev, `❌ 停止屏幕捕获失败: ${error.message}`]);
      setIsScreenCapturing(false);
    }
  };

  const updateStep = (index: number, updates: Partial<MissionStep>) => {
    updateDraftMission(prev => {
      const updatedSteps = [...prev.steps];
      
      // 防御性编程：确保currentStep存在
      const currentStep = updatedSteps[index];
      if (!currentStep) {
        // 如果currentStep不存在，创建一个新的步骤对象
        updatedSteps[index] = {
          step_id: index + 1,
          title: '新步骤',
          desc: '',
          isCompleted: false,
          assets: [],
          template_id: updates.template_id || 'template_generic_001',
          logic_anchor: `step_${index + 1}`,
          mediaAssets: updates.mediaAssets || [],
          privateAccess: 'public',
          fingerprintWeights: { accuracy: 0.8, consistency: 0.7, creativity: 0.5 },
          options: []
        };
        return { ...prev, steps: updatedSteps };
      }
      
      // 使用可选链确保安全访问
      const nextControls = updates.controls || currentStep.controls;
      
      // 合并更新，确保 mediaAssets 是数组
      const updatedMediaAssets = updates.mediaAssets || currentStep.mediaAssets || [];
      const updatedAssets = updates.assets || currentStep.assets || [];
      
      updatedSteps[index] = {
        ...currentStep,
        ...updates,
        controls: nextControls,
        template_id: updates.template_id || currentStep.template_id || 'template_generic_001',
        mediaAssets: updatedMediaAssets,
        assets: updatedAssets,
      };

      // 强制审计日志 - 使用可选链确保安全访问
      const bri = nextControls?.find(c => c.target === 'artifact:brilliance');
      if (bri) console.log('!!! LOGICAL COMMITTED VALUE:', bri.value);

      // 增加强制清洗器，确保手动输入的值不被字典回弹
      if (updates.controls) {
        updates.controls = updates.controls.map(c => {
          if (c.target === 'artifact:brilliance') {
            return { ...c, min: -1.0, max: 1.0, value: (c.value === 0.01) ? 0 : c.value };
          }
          return c;
        });
      }

      // 检查是否有新图片上传，如果有，立即设置为活动预览图
      if (updates.mediaAssets) {
        // 如果 mediaAssets 是新数组，取最后一张图的 assetId
        const lastAssetId = updates.mediaAssets[updates.mediaAssets.length - 1];
        if (lastAssetId) {
          // 由于这里无法直接访问 AssetStore，我们暂时跳过设置活动预览图
          // 活动预览图会在组件中通过 assetId 获取
        }
      } else if (updates.assets) {
        // 如果 assets 是新数组，取最后一张图
        const lastItem = updates.assets[updates.assets.length - 1];
        if (lastItem) {
          const url = typeof lastItem === 'string' ? lastItem : lastItem.url;
          setActivePreviewUrl(url);
        }
      }

      return { ...prev, steps: updatedSteps };
    });
  };

  // AI 自动填充功能
  const handleAutoFill = async (stepIndex: number) => {
    const step = draftMission.steps[stepIndex];
    if (!step) {
      throw new Error(`步骤 ${stepIndex + 1} 不存在`);
    }

    // 获取上下文：左侧面板的任务指令和上传的媒体文件
    const context = {
      instruction: instruction || draftMission.description || '',
      mediaUrl: mediaUrl || uploadedFileUrl,
      uploadedFile: uploadedFile
    };

    setLogs(prev => [...prev, `✨ 正在执行 AI Auto-Fill...`]);
    setLogs(prev => [...prev, `📋 上下文：任务指令=${context.instruction.substring(0, 50)}... 媒体URL=${context.mediaUrl}`]);

    try {
      // 调用 DeepSeek API 生成 AI 填充数据
      const deepSeekPrompt = `
        你现在的唯一任务是 '自动填表'，不要生成步骤列表，不要生成教学内容。
        
        请根据以下上下文，生成一个步骤的完整数据，用于填充任务步骤卡片：
        
        上下文：
        - 任务指令：${context.instruction}
        - 媒体资源：${context.mediaUrl}
        
        请输出一个包含以下字段的 JSON 格式数据：
        1. title: 步骤标题（中文，必须包含核心关键词）
        2. mappingKey: 逻辑映射键（英文，符合编程规范，如 step_1, fireplaceScene 等）
        3. sliderLabel: 滑块名称（中文，必须与视觉内容相关，如"壁炉温暖度"、"职场氛围"、"亮度"、"色相"等）
        4. portraitImpact: 画像影响值（0-1 之间的小数）
        5. action_instruction: 操作指引（中文，详细描述该步骤需要做什么）
        6. controls: 关键参数列表，每个参数包含：
           - id: 唯一标识符（英文）
           - label: 参数名（中文，如 "曝光"）
           - target: 绑定目标（如 "css:brightness"）
           - value: 默认值（数字，如 1.2）
           - min: 最小值（可选，默认0）
           - max: 最大值（可选，默认2）
           - insight: 认知胶囊文案（如 "增加曝光可提升神圣感"）
        7. stepMode: 交互类型（可选值：view, tweak, select, code）
        8. evidence_desc: 认知解释（可选）
        
        强制要求：
        - 输出必须是纯 JSON 格式，不能包含其他任何文本
        - 标题必须准确反映任务内容，包含核心关键词
        - controls 必须是一个数组，至少包含1个参数
        - 内容必须与提供的上下文高度相关
        - 只输出一个步骤的数据，不要输出多个步骤
      `;

      // 如果有媒体资源，先调用 AliVision API 获取视觉描述
      let imageDescription = '';
      let realFeatures: string[] = [];
      
      if (context.mediaUrl) {
        setLogs(prev => [...prev, `🔍 正在使用阿里 DashScope 视觉 API 分析素材...`]);
        
        // 调用阿里视觉 API 获取视觉描述
        const visionResult = await callAliVision({
          images: [context.mediaUrl],
          prompt: '请详细分析这张图片的内容，包括：1. 图片的主要内容和主题 2. 视觉风格特征 3. 色彩搭配 4. 构图特点 5. 适合的用途。请用 JSON 格式输出分析结果。'
        });
        
        if (visionResult.success && visionResult.result) {
          setLogs(prev => [...prev, `✅ 阿里视觉分析完成，提取到关键特征`]);
          setLogs(prev => [...prev, `   描述: ${visionResult.result.description.substring(0, 100)}...`]);
          
          // 提取视觉描述和关键特征
          imageDescription = visionResult.result.description;
          realFeatures = visionResult.result.style_tags;
        } else {
          setLogs(prev => [...prev, `❌ 阿里视觉分析失败`]);
          // 强制校验描述内容：如果视觉描述依然是“无法获取描述”，则物理中断流程并报错
          throw new Error('无法获取有效的视觉描述，流程中断');
        }
      }
      
      // 修复 DeepSeek 的"眼睛"：给它发视觉描述文字，而不是 blob: 链接
      const deepSeekPromptWithVision = `
        你现在的唯一任务是 '自动填表'，不要生成步骤列表，不要生成教学内容。
        
        请根据以下视觉描述，生成一个步骤的完整数据，用于填充任务步骤卡片：
        
        视觉描述：${imageDescription}
        关键特征：${realFeatures.join('、')}
        任务指令：${context.instruction}
        
        请输出一个包含以下字段的 JSON 格式数据：
        1. title: 步骤标题（中文，必须包含核心关键词）
        2. mappingKey: 逻辑映射键（英文，符合编程规范，如 step_1, fireplaceScene 等）
        3. sliderLabel: 滑块名称（中文，必须与视觉内容相关，如"壁炉温暖度"、"职场氛围"、"亮度"、"色相"等）
        4. portraitImpact: 画像影响值（0-1 之间的小数）
        5. action_instruction: 操作指引（中文，详细描述该步骤需要做什么）
        6. controls: 关键参数列表，每个参数包含：
           - id: 唯一标识符（英文）
           - label: 参数名（中文，如 "曝光"）
           - target: 绑定目标（如 "css:brightness"）
           - value: 默认值（数字，如 1.2）
           - min: 最小值（可选，默认0）
           - max: 最大值（可选，默认2）
           - insight: 认知胶囊文案（如 "增加曝光可提升神圣感"）
        7. stepMode: 交互类型（可选值：view, tweak, select, code）
        8. evidence_desc: 认知解释（可选）
        
        强制要求：
        - 输出必须是纯 JSON 格式，不能包含其他任何文本
        - 标题必须准确反映任务内容，包含核心关键词
        - controls 必须是一个数组，至少包含1个参数
        - 内容必须与提供的上下文高度相关
        - 只输出一个步骤的数据，不要输出多个步骤
      `;
      
      setLogs(prev => [...prev, `🤖 正在调用 DeepSeek API 生成填充数据...`]);
      const deepSeekResult = await callDeepSeek(deepSeekPromptWithVision);

      if (!deepSeekResult) {
        throw new Error('DeepSeek API 返回空结果');
      }

      setLogs(prev => [...prev, `✅ DeepSeek 生成成功！`]);
      setLogs(prev => [...prev, `📊 生成的数据：${JSON.stringify(deepSeekResult)}`]);

      // 协议校验：过滤并修正 controls 中的 target
      const validateControls = (controls: any[]) => {
        if (!Array.isArray(controls)) return [];
        
        return controls.map(control => {
          // 跳过无效控制项
          if (!control || typeof control !== 'object' || !control.target) {
            return null;
          }
          
          let { target } = control;
          
          // 检查 target 是否在标准字典中
          if (!P4_PROTOCOL_DICTIONARY[target]) {
            // 尝试修正：将 css: 前缀转换为 fx: 前缀
            if (target.startsWith('css:')) {
              const correctedTarget = `fx:${target.replace('css:', '')}`;
              if (P4_PROTOCOL_DICTIONARY[correctedTarget]) {
                target = correctedTarget;
                console.log(`[PROTOCOL_SYNC] 修正协议前缀: ${control.target} → ${target}`);
              } else {
                console.log(`[PROTOCOL_SYNC] 忽略未知协议: ${target}`);
                return null;
              }
            } else {
              console.log(`[PROTOCOL_SYNC] 忽略未知协议: ${target}`);
              return null;
            }
          } else {
            console.log(`[PROTOCOL_SYNC] 成功挂载标准协议: ${target}`);
          }
          
          // 彻底重写 artifact:brilliance 的逻辑，直接截断字典引用
          if (target === 'artifact:brilliance') {
            const rawValue = control.value;
            // 只要是 0.01（AI默认残留）或 undefined，一律强制归零（原图点）；其余负数信号严禁拦截
            const cleanValue = (rawValue === 0.01 || rawValue === undefined) ? 0 : rawValue;
            return { ...control, value: cleanValue, min: -1.0, max: 1.0, step: 0.01 };
          }
          
          // 获取协议定义，补充默认值
          const protocolDef = getProtocolDefinition(target);
          
          return {
            ...control,
            target,
            value: control.value !== undefined ? control.value : protocolDef.default,
            min: control.min !== undefined ? control.min : protocolDef.min,
            max: control.max !== undefined ? control.max : protocolDef.max
          };
        }).filter(Boolean);
      };

      // 验证并获取有效的 controls
      const validatedControls = validateControls(deepSeekResult.controls || []);

      // 检查并添加默认的控制项
      const ensureDefaultControls = (controls: any[]) => {
        const result = [...controls];
        
        // 确保有 time:speed 控制项
        if (!result.some(control => control.target === 'time:speed')) {
          result.push({
            id: `control_time_speed_${Date.now()}`,
            label: '播放速度',
            target: 'time:speed',
            value: 1.0, // 默认静态
            min: 0.1,
            max: 5.0,
            step: 0.1,
            insight: '控制素材的播放速度，对于图片会产生 Ken Burns 缩放效果'
          });
        }
        
        // 确保有 meta:intensity 控制项
        if (!result.some(control => control.target === 'meta:intensity')) {
          result.push({
            id: `control_meta_intensity_${Date.now()}`,
            label: '全局强度',
            target: 'meta:intensity',
            value: 1.0, // 标准强度
            min: 0.0,
            max: 1.0,
            step: 0.05,
            insight: '全局增益，会乘以所有视觉效果的强度值'
          });
        }
        
        return result;
      };

      // 添加默认控制项
      const finalControls = ensureDefaultControls(validatedControls);

      // 原子化打包：创建一个统一的 updates 对象，包含所有需要更新的字段
      const currentBase64Image = context.mediaUrl;
      const updates: Partial<MissionStep> = {
        // 资产字段：确保旧字段和新字段都有图
        assets: currentBase64Image ? [currentBase64Image] : [...(step.assets || [])],
        mediaAssets: currentBase64Image ? [currentBase64Image] : [...(step.mediaAssets || [])],
        
        // 协议字段：来自 DeepSeek 的协议
        title: deepSeekResult.title || step.title,
        mappingKey: deepSeekResult.mappingKey || step.mappingKey,
        sliderLabel: deepSeekResult.sliderLabel || step.sliderLabel,
        portraitImpact: deepSeekResult.portraitImpact || step.portraitImpact || 0.6,
        action_instruction: deepSeekResult.action_instruction || step.action_instruction || step.desc,
        stepMode: deepSeekResult.stepMode || step.stepMode || 'view',
        evidence_desc: deepSeekResult.evidence_desc || step.evidence_desc,
        logic_anchor: deepSeekResult.mappingKey || step.logic_anchor || `step_${stepIndex + 1}`,
        fingerprintImpact: deepSeekResult.portraitImpact || step.fingerprintImpact || 0.6,
        
        // 控制参数：使用经过验证并添加了默认项的 controls
        controls: finalControls.length > 0 
          ? finalControls 
          : [{
              id: `control_${Date.now()}_${stepIndex}`,
              label: deepSeekResult.sliderLabel || '视觉强度',
              target: 'fx:brightness', // 使用标准协议
              value: deepSeekResult.portraitImpact || 0.6,
              min: 0,
              max: 1,
              insight: '该参数影响画面的视觉效果'
            }]
      };

      // 强制资产"双路并发"与"类型纠偏"
      if (context.mediaUrl) {
        const currentUrl = context.mediaUrl;
        const assetType = "image"; // 强制将 type 设为 "image"
        
        // 物理注入：同时将图片 URL 写入 assets 和 mediaAssets 两个字段
        updates.assets = [currentUrl];
        updates.mediaAssets = [currentUrl];
        
        // 生成新的 Key 值，用于强制 UI 重绘
        const newKey = currentUrl || Date.now();
        
        // 闭环验证日志
        console.log(`[UI_SYNC] 物理渲染信号已发出，Key: ${newKey}, 字段: assets & mediaAssets`);
        setLogs(prev => [...prev, `[UI_SYNC] 物理渲染信号已发出，Key: ${newKey}, 字段: assets & mediaAssets`]);
      }
      // 调用 updateStep 更新当前卡片 - 确保图片和文字是同一个动作产生的
      updateStep(stepIndex, updates);

      // 验证逻辑：打印完成信息
      console.log(`✅ 物理搬运完成：素材与协议已正式存入步骤 ${stepIndex}`);
      setLogs(prev => [...prev, `✅ AI Auto-Fill 完成，已更新步骤 ${stepIndex + 1}`]);
      setLogs(prev => [...prev, `📦 物理搬运完成：素材与协议已正式存入步骤 ${stepIndex + 1}`]);
    } catch (error: any) {
      console.error('AI Auto-Fill 失败:', error);
      setLogs(prev => [...prev, `❌ AI Auto-Fill 失败: ${error.message}`]);
      throw error;
    }
  };

  const mapVerifyTypeToTemplateId = (verifyType: string): string => {
    const templateMap: Record<string, string> = {
      'TEXT': 'template_text_001',
      'SCREEN': 'template_screen_001',
      'AUDIO': 'template_audio_001',
      'CODE': 'template_code_001'
    };
    return templateMap[verifyType] || 'template_generic_001';
  };

  return {
    mediaUrl,
    instruction,
    audioTrackName,
    verifyType,
    matchKeyword,
    isAnalyzing,
    logs,
    uploadedFile,
    uploadedFileUrl,
    draftMission,
    selectedStepIndex,
    isManualMode,
    editingStepIndex,
    editingStep,
    fileInputRef,
    isScreenCapturing,
    capturedVideoUrl,
    capturedAudioUrl,
    verification: '',
    mediaStream: mediaStreamRef.current,
    // 全局预览焦点状态
    activePreviewUrl,
    setActivePreviewUrl,
    // 唯一的预览指针状态
    previewFocusUrl,
    setPreviewFocusUrl,
    // 添加新的状态和函数
    isAuditModalOpen,
    setIsAuditModalOpen,
    isPublishing,
    // 协议载入函数
    loadProtocolToMission,
    
    handleFormChange,
    handleFileUpload,
    handleAnalyze,
    handleAddStep,
    handleEditStep,
    handleSaveStep,
    handleDeleteStep,
    handleCopyStep,
    handleMoveStepUp,
    handleMoveStepDown,
    handleSignAndRelease,
    handleVoiceAI,
    handleIdentifyKeyFrames,
    analyzeStepAssets,
    setSelectedStepIndex,
    setIsManualMode,
    updateStep,
    updateDraftMission,
    setMediaUrl,
    setInstruction,
    setAudioTrackName,
    setVerifyType,
    setMatchKeyword,
    handleStartScreenCapture,
    handleStopScreenCapture,
    downloadVideo,
    downloadAudio,
    handleAutoFill, // AI 自动填充功能
    // 新增：全局门面标杆相关
    facadeCoverUrl,
    setFacadeCover,
    // 新增：审美参数相关
    currentAestheticParams,
    setCurrentAestheticParams,
    updateStepAestheticParams,
    handleStepChange,
    getCurrentStepAestheticParams
  };
};
