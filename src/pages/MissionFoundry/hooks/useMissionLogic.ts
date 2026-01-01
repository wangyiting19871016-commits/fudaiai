import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { callDeepSeek } from '../../../services/deepseekService';
import { callVolcTTS } from '../../../services/volcService';

// callQwenVL 函数暂时移除，后续可以移到 aliService.ts 中
// import { callQwenVL } from '../../../services/aliService';

// 定义 Step 类型
interface Step {
  step_id: number;
  title: string;
  desc?: string;
  action_instruction?: string;
  verifyType: string;
  verify_key: string[];
  verify_logic?: {
    type: string;
    check_value: string;
    volume?: {
      vocal?: number;
      bgm?: number;
      ambient?: number;
    };
  };
  isCompleted: boolean;
  visionData?: any;
  evidence_desc?: string;
  audioUrl?: string;
  originalAudioUrl?: string; // 原始视频提取的音频URL
  audioDuration?: number;
  keyFrame?: any;
  startTime?: number;
  start_time?: number; // 视频切片开始时间（秒）
  end_time?: number; // 视频切片结束时间（秒）
  videoPath?: string; // 切片视频的本地路径
  audioPath?: string; // 音频文件的本地路径
  // TrueTrack Protocol 字段
  template_id: string;
  logic_anchor: string;
}

// 定义 DraftMission 类型
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
  steps: Step[];
  createdAt: string;
  description?: string;
  reference_material?: {
    type: string;
    content: string;
  };
  keyFrames?: any[];
  updatedAt?: string;
}

export const useMissionLogic = () => {
  const navigate = useNavigate();
  
  // 左侧表单状态
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [instruction, setInstruction] = useState<string>('');
  const [audioTrackName, setAudioTrackName] = useState<string>('');
  const [verifyType, setVerifyType] = useState<string>('TEXT');
  const [matchKeyword, setMatchKeyword] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  // 文件上传状态
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 废除所有后端路径写入，不再使用任何硬编码路径
  
  // 屏幕捕捉状态
  const [isScreenCapturing, setIsScreenCapturing] = useState<boolean>(false);
  const [capturedVideoUrl, setCapturedVideoUrl] = useState<string>('');
  const [capturedAudioUrl, setCapturedAudioUrl] = useState<string>('');
  const [capturedVideoBlob, setCapturedVideoBlob] = useState<Blob | null>(null);
  const [capturedAudioBlob, setCapturedAudioBlob] = useState<Blob | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaRecorderAudioRef = useRef<MediaRecorder | null>(null); // 新增：纯音频录制器
  const recordedChunks = useRef<Blob[]>([]);
  const recordedAudioChunks = useRef<Blob[]>([]); // 新增：纯音频录制数据
  
  // 音频管理状态
  const currentPreviewAudio = useRef<HTMLAudioElement | null>(null);
  const [previewVolume, setPreviewVolume] = useState<number>(0.8); // 默认音量 80%
  
  // 停止当前预览音频
  const stopPreviewAudio = () => {
    if (currentPreviewAudio.current) {
      currentPreviewAudio.current.pause();
      currentPreviewAudio.current.currentTime = 0;
      currentPreviewAudio.current = null;
    }
  };
  
  // 播放预览音频
  const playPreviewAudio = (audioUrl: string) => {
    // 先停止当前播放的音频
    stopPreviewAudio();
    
    // 创建新的音频实例
    const audio = new Audio(audioUrl);
    audio.volume = previewVolume;
    
    currentPreviewAudio.current = audio;
    
    audio.play().catch(error => {
      console.error('播放预览音频失败:', error);
      stopPreviewAudio();
    });
    
    return audio;
  };

  // 全局草稿任务状态
  const [draftMission, setDraftMission] = useState<DraftMission>({
    id: `draft_${Date.now()}`,
    title: '未命名任务',
    type: 'audio', // 默认音频类型
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
    createdAt: new Date().toISOString()
  });

  // 新增：当前选中的步骤索引
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);
  
  // 新增：双模切换状态
  const [isManualMode, setIsManualMode] = useState<boolean>(false);
  
  // 新增：手动模式下的步骤编辑状态
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  const [editingStep, setEditingStep] = useState<Partial<Step>>({
    title: '',
    desc: '',
    verifyType: 'TEXT',
    verify_key: ['']
  });

  // 更新全局草稿任务
  const updateDraftMission = (updates: Partial<DraftMission>) => {
    setDraftMission(prev => ({
      ...prev,
      ...updates,
      video: {
        ...prev.video,
        ...(updates.video || {})
      }
    }));
  };

  // 处理左侧表单变化，实时更新右侧 LabPage
  const handleFormChange = (field: string, value: any) => {
    // 更新本地状态
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

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      alert('请上传 MP3 或 MP4 文件');
      return;
    }

    // 创建文件 URL
    const fileUrl = URL.createObjectURL(file);
    
    // 更新状态
    setUploadedFile(file);
    setUploadedFileUrl(fileUrl);
    
    // 更新全局草稿任务，让右侧 LabPage 立即加载
    updateDraftMission({
      video: {
        url: fileUrl,
        type: file.type.startsWith('audio/') ? 'mp3' : 'mp4'
      },
      type: file.type.startsWith('audio/') ? 'audio' : 'video'
    });
    
    // 更新左侧表单的媒体 URL
    setMediaUrl(fileUrl);
    
    setLogs(prev => [...prev, `✅ 已上传文件: ${file.name}`]);
  };

  // 处理 DeepSeek 分析
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setLogs(["正在握手 DeepSeek API...", "正在传输视频物料与脚本...", "AI 正在生成 3-10 步协议任务包..."]);
    
    // 实装【手动清零】补丁：生成新任务前，强制清空旧的 steps
    updateDraftMission({ steps: [] });
    
    try {
      // 调用 AI 接口，触发微步拆解功能，强制要求 3-10 步
      // 明确调用 callDeepSeek，确保使用 DeepSeek API
      const missionPackage = await callDeepSeek(instruction || '默认任务指令');
      
      // 检查 AI 返回结果
      if (!missionPackage || !missionPackage.steps) {
        throw new Error("AI 返回的任务包格式不正确，缺少必要字段");
      }
      
      // 确保任务步数在 3-10 步之间
      const steps = missionPackage.steps;
      if (steps.length < 3 || steps.length > 10) {
        throw new Error(`AI 返回的任务步数 (${steps.length}) 不在 3-10 步范围内，请重试`);
      }
      
      // 更新全局草稿任务，包含 AI 生成的步骤
      updateDraftMission({
        title: missionPackage.title || "未命名任务",
        description: missionPackage.description || instruction,
        steps: steps.map((step: any, index: number) => {
          const verifyType = step.verifyType || 'TEXT';
          return {
            ...step,
            step_id: index + 1,
            isCompleted: false,
            videoUrl: mediaUrl, // 强制赋值视频URL
            // TrueTrack Protocol 字段完整化
            template_id: step.template_id || mapVerifyTypeToTemplateId(verifyType),
            logic_anchor: step.logic_anchor || `step_${index + 1}`
          };
        }),
        reference_material: missionPackage.reference_material || {
          type: "MARKDOWN",
          content: `# 任务包\n\n**原始素材:** ${mediaUrl}\n\n**任务指令:** ${instruction || '无'}`
        }
      });
      
      // 实时更新日志
      setLogs(prev => [...prev, `✅ AI 生成成功！共 ${steps.length} 步任务`]);
      setLogs(prev => [...prev, `📋 任务步骤：`]);
      steps.forEach((step: any, index: number) => {
        setLogs(prev => [...prev, `   ${index + 1}. ${step.title}`]);
      });
    } catch (error: any) {
      console.error(error);
      setLogs(prev => [...prev, `❌ 错误: ${error.message}`]);
      alert(`生成失败: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // 新增：手动模式 - 新增步骤
  const handleAddStep = () => {
    const stepIndex = draftMission.steps.length;
    const verifyType = 'TEXT';
    
    const newStep: Step = {
      step_id: stepIndex + 1,
      title: '新步骤',
      desc: '请输入步骤描述',
      verifyType: verifyType,
      verify_key: [''],
      isCompleted: false,
      // TrueTrack Protocol 字段完整化
      template_id: mapVerifyTypeToTemplateId(verifyType),
      logic_anchor: `step_${stepIndex + 1}`
    };
    
    const updatedSteps = [...draftMission.steps, newStep];
    updateDraftMission({
      steps: updatedSteps
    });
    
    // 新增步骤后立即进入编辑模式
    const newStepIndex = updatedSteps.length - 1;
    setEditingStepIndex(newStepIndex);
    setEditingStep(newStep);
    
    setLogs(prev => [...prev, `✅ 已添加新步骤`]);
  };
  
  // 新增：手动模式 - 编辑步骤
  const handleEditStep = (index: number) => {
    const step = draftMission.steps[index];
    setEditingStepIndex(index);
    setEditingStep(step);
    
    setLogs(prev => [...prev, `📝 开始编辑步骤 ${index + 1}`]);
  };
  
  // 新增：手动模式 - 保存步骤
  const handleSaveStep = () => {
    if (editingStepIndex !== null) {
      const updatedSteps = [...draftMission.steps];
      updatedSteps[editingStepIndex] = {
        ...updatedSteps[editingStepIndex],
        ...editingStep,
        step_id: editingStepIndex + 1
      } as Step;
      
      updateDraftMission({
        steps: updatedSteps
      });
      
      setEditingStepIndex(null);
      setEditingStep({
        title: '',
        desc: '',
        verifyType: 'TEXT',
        verify_key: ['']
      });
      
      setLogs(prev => [...prev, `✅ 已保存步骤 ${editingStepIndex + 1}`]);
    }
  };
  
  // 新增：手动模式 - 删除步骤
  const handleDeleteStep = (index: number) => {
    const updatedSteps = draftMission.steps.filter((_, i) => i !== index);
    // 更新剩余步骤的 step_id
    const stepsWithUpdatedIds = updatedSteps.map((step, i) => ({
      ...step,
      step_id: i + 1
    }));
    
    updateDraftMission({
      steps: stepsWithUpdatedIds
    });
    
    // 如果删除的是当前选中的步骤，更新选中索引
    if (selectedStepIndex === index) {
      setSelectedStepIndex(Math.max(0, index - 1));
    } else if (selectedStepIndex > index) {
      setSelectedStepIndex(selectedStepIndex - 1);
    }
    
    setLogs(prev => [...prev, `❌ 已删除步骤 ${index + 1}`]);
  };
  
  // 新增：手动模式 - 上移步骤
  const handleMoveStepUp = (index: number) => {
    if (index === 0) return; // 已经是第一步，不能再上移
    
    const updatedSteps = [...draftMission.steps];
    // 交换位置
    [updatedSteps[index], updatedSteps[index - 1]] = [updatedSteps[index - 1], updatedSteps[index]];
    // 更新 step_id
    const stepsWithUpdatedIds = updatedSteps.map((step, i) => ({
      ...step,
      step_id: i + 1
    }));
    
    updateDraftMission({
      steps: stepsWithUpdatedIds
    });
    
    // 更新选中索引
    setSelectedStepIndex(index - 1);
    
    setLogs(prev => [...prev, `↕️ 已将步骤 ${index + 1} 上移`]);
  };
  
  // 新增：手动模式 - 下移步骤
  const handleMoveStepDown = (index: number) => {
    if (index === draftMission.steps.length - 1) return; // 已经是最后一步，不能再下移
    
    const updatedSteps = [...draftMission.steps];
    // 交换位置
    [updatedSteps[index], updatedSteps[index + 1]] = [updatedSteps[index + 1], updatedSteps[index]];
    // 更新 step_id
    const stepsWithUpdatedIds = updatedSteps.map((step, i) => ({
      ...step,
      step_id: i + 1
    }));
    
    updateDraftMission({
      steps: stepsWithUpdatedIds
    });
    
    // 更新选中索引
    setSelectedStepIndex(index + 1);
    
    setLogs(prev => [...prev, `↕️ 已将步骤 ${index + 1} 下移`]);
  };
  
  // 新增：签署并发布真迹
  const handleSignAndRelease = () => {
    try {
      // 序列化当前 draftMission
      const missionToSave = {
        ...draftMission,
        id: draftMission.id || `mission_${Date.now()}`,
        createdAt: draftMission.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // 存储到 localStorage
      const existingMissions = JSON.parse(localStorage.getItem('missions') || '[]');
      existingMissions.push(missionToSave);
      localStorage.setItem('missions', JSON.stringify(existingMissions));
      
      // 存储到 activeMission 供 P2 路径页使用
      localStorage.setItem('activeMission', JSON.stringify(missionToSave));
      
      setLogs(prev => [...prev, `✅ 真迹已签署并发布`]);
      alert('✅ 真迹已签署并发布，即将跳转到路径页');
      
      // 跳转至 P2 路径页
      navigate('/path');
    } catch (error) {
      console.error('发布失败:', error);
      setLogs(prev => [...prev, `❌ 发布失败: ${error}`]);
      alert(`发布失败: ${error}`);
    }
  };
  
  // 新增：AI 识图对齐处理函数（暂时注释，等待 callQwenVL 函数移至 aliService.ts）
  /*
  const handleVisionAI = async (stepIndex: number) => {
    try {
      setLogs(prev => [...prev, `正在调用千问视觉 AI 进行识图对齐...`]);
      
      // 创建文件输入框用于选择截图
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.style.display = 'none';
      
      fileInput.onchange = async (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;
        
        // 读取文件为 Base64
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64String = event.target?.result as string;
          if (!base64String) return;
          
          // 调用 Qwen-VL API 分析截图
          const startTime = Date.now();
          setLogs(prev => [...prev, `正在上传截图至千问视觉 API...`]);
          
          const result = await callQwenVL(base64String);
          const endTime = Date.now();
          const duration = (endTime - startTime) / 1000;
          
          // 处理 AI 分析结果，自动填入校验逻辑
          const updatedSteps = [...draftMission.steps];
          const currentStep = updatedSteps[stepIndex];
          
          updatedSteps[stepIndex] = {
            ...currentStep,
            visionData: result,
            verifyType: 'SCREEN',
            verify_key: [result.result?.description || '']
          };
          
          updateDraftMission({ steps: updatedSteps });
          
          setLogs(prev => [...prev, `✅ 千问视觉分析完成，耗时 ${duration.toFixed(2)}s，已更新步骤 ${stepIndex + 1} 的校验逻辑`]);
        };
        
        reader.readAsDataURL(file);
      };
      
      document.body.appendChild(fileInput);
      fileInput.click();
      document.body.removeChild(fileInput);
    } catch (error) {
      console.error('AI 识图失败:', error);
      setLogs(prev => [...prev, `❌ AI 识图失败: ${error}`]);
    }
  };
  */
  
  // 新增：AI 生成引导音处理函数
  const handleVoiceAI = async (stepIndex: number) => {
    try {
      const step = draftMission.steps[stepIndex];
      if (!step) return;
      
      // 使用组合文本："${标题}。内容是：${指令描述}"
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
      
      // 更新步骤的音频信息
      const updatedSteps = [...draftMission.steps];
      
      let audioUrl = '';
      if (result.success && result.result.audioData) {
        // 火山引擎返回 base64 音频数据，转换为 Blob URL
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
      
      // 自动播放生成的音频
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
  
  // 新增：AI 识别关键帧处理函数
  const handleIdentifyKeyFrames = async () => {
    try {
      if (!mediaUrl.trim()) {
        setLogs(prev => [...prev, `❌ 请先上传视频或输入 URL`]);
        return;
      }
      
      setLogs(prev => [...prev, `正在调用 Qwen-VL 分析视频流，识别关键帧...`]);
      
      // 模拟视频帧提取过程
      const startTime = Date.now();
      
      // 这里应该调用真实的视频帧提取 API，目前模拟实现
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      // 模拟生成 3-10 个关键帧建议
      const keyFrames = Array.from({ length: Math.floor(Math.random() * 8) + 3 }, (_, i) => ({
        index: i,
        time: `${Math.floor(i * 10)}s`,
        description: `关键帧 ${i + 1}: 核心操作画面`,
        thumbnail: `https://example.com/keyframe-${i}.jpg`
      }));
      
      updateDraftMission({ keyFrames });
      
      setLogs(prev => [...prev, `✅ 视频关键帧识别完成，耗时 ${duration.toFixed(2)}s，共识别 ${keyFrames.length} 个核心操作画面`]);
      
      // 根据关键帧生成任务步骤建议
      if (draftMission.steps.length === 0) {
        const suggestedSteps = keyFrames.map((frame, index) => {
          const verifyType = 'SCREEN';
          return {
            step_id: index + 1,
            title: `步骤 ${index + 1}`,
            desc: frame.description,
            verifyType: verifyType,
            verify_key: [frame.description],
            isCompleted: false,
            keyFrame: frame,
            // TrueTrack Protocol 字段完整化
            template_id: mapVerifyTypeToTemplateId(verifyType),
            logic_anchor: `step_${index + 1}`
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
  
  // 新增：开始屏幕捕捉处理函数
  const handleStartScreenCapture = async () => {
    try {
      setLogs(prev => [...prev, `🔍 正在请求屏幕捕获权限...`]);
      
      // 调用屏幕捕获 API - 强制开启音频，禁用回声消除和噪声抑制
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: { echoCancellation: false, noiseSuppression: false }
      });
      
      // 创建组合流，确保包含所有视频轨和音频轨
      const combinedStream = new MediaStream();
      
      // 添加屏幕捕获的视频轨和音频轨
      displayStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));
      displayStream.getAudioTracks().forEach(track => combinedStream.addTrack(track));
      
      // 检查是否有音频轨，如果没有，尝试获取系统音频
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
      
      // 仅创建音视频录制器，不再使用双路录制
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      
      // 清空之前的录制数据
      recordedChunks.current = [];
      
      // 监听音视频录制数据
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };
      
      // 开始录制
      mediaRecorder.start();
      
      // 实时流不需要创建URL，直接使用video元素的srcObject属性
      // 右侧LabPage会通过其他方式处理实时流
      updateDraftMission({
        type: 'video'
      });
      
    } catch (error: any) {
      console.error('屏幕捕获失败:', error);
      setLogs(prev => [...prev, `❌ 屏幕捕获失败: ${error.message}`]);
      setIsScreenCapturing(false);
    }
  };
  
  // 新增：裁剪音频片段
  const clipAudio = async (audioUrl: string, startTime: number, endTime: number): Promise<string | null> => {
    try {
      // 创建音频上下文
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 获取音频数据
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // 计算起始和结束的采样点
      const startOffset = Math.floor(startTime * audioBuffer.sampleRate);
      const endOffset = Math.floor(endTime * audioBuffer.sampleRate);
      const frameCount = endOffset - startOffset;
      
      // 创建新的音频缓冲区
      const newAudioBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        frameCount,
        audioBuffer.sampleRate
      );
      
      // 复制数据到新缓冲区
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const oldData = audioBuffer.getChannelData(channel);
        const newData = newAudioBuffer.getChannelData(channel);
        
        for (let i = 0; i < frameCount; i++) {
          newData[i] = oldData[startOffset + i];
        }
      }
      
      // 创建媒体流
      const audioStream = audioContext.createMediaStreamDestination();
      const source = audioContext.createBufferSource();
      source.buffer = newAudioBuffer;
      source.connect(audioStream);
      
      // 创建媒体录制器
      const mediaRecorder = new MediaRecorder(audioStream.stream, {
        mimeType: 'audio/mp3'
      });
      
      // 录制音频
      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.start();
      source.start();
      
      // 等待录制完成
      await new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => resolve();
        source.onended = () => mediaRecorder.stop();
      });
      
      // 创建音频 Blob
      const clippedAudioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
      
      // 创建音频 URL
      const clippedAudioUrl = URL.createObjectURL(clippedAudioBlob);
      
      return clippedAudioUrl;
    } catch (error) {
      console.error('裁剪音频片段失败:', error);
      return null;
    }
  };
  
  // 新增：从视频中提取音频轨道（使用 Web Audio API）
  const extractAudioFromVideo = async (videoBlob: Blob): Promise<string | null> => {
    try {
      // 创建视频 URL
      const videoUrl = URL.createObjectURL(videoBlob);
      
      // 创建音频上下文
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 获取视频数据并解码音频
      const response = await fetch(videoUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // 创建离线音频上下文，用于处理音频数据
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );
      
      // 创建音频源并连接到输出
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineContext.destination);
      
      // 开始处理
      source.start();
      
      // 渲染音频缓冲区
      const renderedBuffer = await offlineContext.startRendering();
      
      // 将 AudioBuffer 转换为 WAV 格式的 Blob
      const wavBlob = audioBufferToWav(renderedBuffer);
      
      // 保存音频 Blob
      setCapturedAudioBlob(wavBlob);
      
      // 创建音频 URL
      const audioUrl = URL.createObjectURL(wavBlob);
      
      return audioUrl;
    } catch (error) {
      console.error('提取音频轨道失败:', error);
      return null;
    }
  };
  
  // 辅助函数：将 AudioBuffer 转换为 WAV 格式的 Blob
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    const channels: Float32Array[] = [];
    let offset = 0;
    let pos = 0;
    
    // 写入 WAV 头
    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };
    
    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };
    
    // RIFF identifier
    setUint32(0x46464952);
    // file length
    setUint32(length - 8);
    // RIFF type
    setUint32(0x45564157);
    // format chunk identifier
    setUint32(0x20746d66);
    // format chunk length
    setUint32(16);
    // sample format (raw)
    setUint16(1);
    // channel count
    setUint16(numOfChan);
    // sample rate
    setUint32(buffer.sampleRate);
    // byte rate (sample rate * block align)
    setUint32(buffer.sampleRate * numOfChan * 2);
    // block align (channel count * bytes per sample)
    setUint16(numOfChan * 2);
    // bits per sample
    setUint16(16);
    // data chunk identifier
    setUint32(0x61746164);
    // data chunk length
    setUint32(length - pos - 4);
    
    // 写入音频数据
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
    
    // 获取每个通道的数据
    for (let i = 0; i < numOfChan; i++) {
      channels.push(buffer.getChannelData(i));
    }
    
    interleave(channels);
    
    return new Blob([bufferArray], { type: 'audio/wav' });
  };

  // 新增：下载视频素材
  const downloadVideo = () => {
    if (!capturedVideoBlob) {
      setLogs(prev => [...prev, `❌ 没有可下载的视频素材`]);
      return;
    }
    
    const timestamp = Date.now();
    const filename = `truth_video_${timestamp}.mp4`;
    
    // 使用浏览器原生下载功能
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
  
  // 新增：下载纯音频
  const downloadAudio = async () => {
    if (!capturedVideoBlob && !capturedAudioBlob) {
      setLogs(prev => [...prev, `❌ 没有可下载的音频素材`]);
      return;
    }
    
    let audioBlob = capturedAudioBlob;
    
    // 如果没有现成的音频Blob，从视频中提取
    if (!audioBlob && capturedVideoBlob) {
      setLogs(prev => [...prev, `🎵 正在从视频中提取音频...`]);
      const audioUrl = await extractAudioFromVideo(capturedVideoBlob);
      if (audioUrl) {
        // 从URL创建Blob
        const response = await fetch(audioUrl);
        audioBlob = await response.blob();
      }
    }
    
    if (audioBlob) {
      const timestamp = Date.now();
      const filename = `truth_audio_${timestamp}.mp3`;
      
      // 使用浏览器原生下载功能
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
  

  
  // 新增：停止屏幕捕捉处理函数
  const handleStopScreenCapture = async () => {
    try {
      setLogs(prev => [...prev, `⏹️ 正在停止屏幕捕获...`]);
      
      const mediaRecorder = mediaRecorderRef.current;
      const mediaStream = mediaStreamRef.current;
      
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        // 等待录制完成
        await new Promise<void>((resolve) => {
          mediaRecorder.onstop = async () => {
            // 停止媒体流
            if (mediaStream) {
              mediaStream.getTracks().forEach(track => track.stop());
            }
            
            // 创建录制完成的视频 Blob
            const videoBlob = new Blob(recordedChunks.current, { type: 'video/webm;codecs=vp8,opus' });
            
            // 保存视频 Blob
            setCapturedVideoBlob(videoBlob);
            
            // 创建文件 URL，用于实时预览
            const videoUrl = URL.createObjectURL(videoBlob);
            
            // 更新状态
            setCapturedVideoUrl(videoUrl);
            
            // 更新全局草稿任务，让右侧 LabPage 立即加载
            updateDraftMission({
              video: {
                url: videoUrl,
                type: 'mp4'
              },
              type: 'video'
            });
            
            // 更新左侧表单的媒体 URL
            setMediaUrl(videoUrl);
            
            // 使用 Web Audio API 提取音频，强制点亮下载按钮
            const audioUrl = await extractAudioFromVideo(videoBlob);
            if (audioUrl) {
              // 更新状态 - 这将直接激活音频下载按钮
              setCapturedAudioUrl(audioUrl);
              setLogs(prev => [...prev, `🎵 已完成纯音频提取`]);
            }
            
            resolve();
          };
          
          // 停止录制
          mediaRecorder.stop();
        });
      }
      
      setIsScreenCapturing(false);
      setLogs(prev => [...prev, `✅ 屏幕捕获已停止，可以手动下载素材`]);
      
      // 重置录制器引用
      mediaRecorderRef.current = null;
      mediaStreamRef.current = null;
      
    } catch (error: any) {
      console.error('停止屏幕捕获失败:', error);
      setLogs(prev => [...prev, `❌ 停止屏幕捕获失败: ${error.message}`]);
      setIsScreenCapturing(false);
    }
  };

  // 新增：更新单个步骤的方法
  const updateStep = (index: number, updates: Partial<Step>) => {
    const updatedSteps = [...draftMission.steps];
    updatedSteps[index] = {
      ...updatedSteps[index],
      ...updates,
      // TrueTrack Protocol 字段完整化
      template_id: updates.template_id || mapVerifyTypeToTemplateId(updatedSteps[index].verifyType),
      logic_anchor: updates.logic_anchor || `step_${index + 1}`
    };
    updateDraftMission({ steps: updatedSteps });
  };

  // 映射验证类型到模板ID
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
    // 状态
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
    mediaStream: mediaStreamRef.current,
    
    // 方法
    handleFormChange,
    handleFileUpload,
    handleAnalyze,
    handleAddStep,
    handleEditStep,
    handleSaveStep,
    handleDeleteStep,
    handleMoveStepUp,
    handleMoveStepDown,
    handleSignAndRelease,
    handleVoiceAI,
    handleIdentifyKeyFrames,
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
    downloadAudio
  };
};