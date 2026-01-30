import React, { useState, useRef, useEffect } from 'react';
import { Modal, Input, Button, Progress, message } from 'antd';
import { useVoiceStore, MyVoice } from '../stores/VoiceStore';
import { API_VAULT } from '../config/ApiVault';

interface VoiceCreatorProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (voice: MyVoice) => void;
}

const VoiceCreator: React.FC<VoiceCreatorProps> = ({ visible, onClose, onSuccess }) => {
  const { addVoice } = useVoiceStore();

  // 状态
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [voiceName, setVoiceName] = useState<string>('我的声音');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [step, setStep] = useState<'record' | 'preview' | 'creating' | 'done'>('record');

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 清理
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // 重置状态
  const resetState = () => {
    setAudioFile(null);
    setAudioUrl('');
    setAudioDuration(0);
    setVoiceName('我的声音');
    setIsRecording(false);
    setIsCreating(false);
    setRecordingTime(0);
    setStep('record');
    audioChunksRef.current = [];
  };

  // 开始录音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `recording_${Date.now()}.webm`, { type: 'audio/webm' });
        setAudioFile(file);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setStep('preview');

        // 获取时长
        const audio = new Audio(url);
        audio.onloadedmetadata = () => {
          setAudioDuration(audio.duration);
        };

        // 停止所有音轨
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // 计时器
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 30) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error('录音失败:', err);
      message.error('无法访问麦克风，请检查权限设置');
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // 上传文件
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('audio/')) {
      message.error('请上传音频文件');
      return;
    }

    // 验证文件大小 (最大 10MB)
    if (file.size > 10 * 1024 * 1024) {
      message.error('文件大小不能超过 10MB');
      return;
    }

    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setStep('preview');

    // 获取时长
    const audio = new Audio(url);
    audio.onloadedmetadata = () => {
      setAudioDuration(audio.duration);
    };
  };

  // 重新录制
  const handleReRecord = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioFile(null);
    setAudioUrl('');
    setAudioDuration(0);
    setStep('record');
  };

  // 创建音色
  const handleCreateVoice = async () => {
    if (!audioFile) {
      message.error('请先录制或上传音频');
      return;
    }

    if (!voiceName.trim()) {
      message.error('请输入音色名称');
      return;
    }

    setIsCreating(true);
    setStep('creating');

    try {
      const formData = new FormData();
      formData.append('type', 'tts');
      formData.append('title', voiceName.trim());
      formData.append('train_mode', 'fast');
      formData.append('visibility', 'private');
      formData.append('voices', audioFile);
      // 不传 texts 参数，让 Fish Audio 自动进行语音识别 (ASR)

      const response = await fetch('/api/fish/model', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_VAULT.FISH_AUDIO.API_KEY}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 错误: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('创建音色成功:', result);

      // 保存到本地
      const newVoice: MyVoice = {
        id: result._id,
        title: voiceName.trim(),
        createdAt: Date.now(),
        state: result.state || 'trained'
      };

      addVoice(newVoice);
      setStep('done');
      message.success('音色创建成功！');

      // 回调
      if (onSuccess) {
        onSuccess(newVoice);
      }

      // 延迟关闭
      setTimeout(() => {
        resetState();
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error('创建音色失败:', err);
      message.error(`创建失败: ${err.message}`);
      setIsCreating(false);
      setStep('preview');
    }
  };

  // 关闭弹窗
  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    resetState();
    onClose();
  };

  return (
    <Modal
      title="🎤 创建你的专属声音"
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={480}
      destroyOnClose
      styles={{
        body: { padding: '20px' },
        header: { background: 'var(--p4-bg-surface)', borderBottom: '1px solid var(--p4-border-subtle)' }
      }}
    >
      {/* 步骤 1: 录音/上传 */}
      {step === 'record' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '20px', color: 'var(--p4-text-secondary)', fontSize: '14px' }}>
            录制 10-30 秒清晰语音，说什么都可以
          </div>

          {/* 录音区域 */}
          <div style={{
            width: '120px',
            height: '120px',
            margin: '0 auto 20px',
            borderRadius: '50%',
            background: isRecording ? 'linear-gradient(135deg, #ff6b6b, #ee5a5a)' : 'var(--p4-bg-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            border: '3px solid var(--p4-border-subtle)'
          }}
          onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', color: 'white' }}>⏹</div>
                <div style={{ fontSize: '18px', color: 'white', fontWeight: 'bold' }}>{recordingTime}s</div>
              </div>
            ) : (
              <div style={{ fontSize: '36px' }}>🎙️</div>
            )}
          </div>

          {isRecording && (
            <Progress
              percent={Math.min((recordingTime / 30) * 100, 100)}
              showInfo={false}
              strokeColor="#ff6b6b"
              style={{ marginBottom: '20px' }}
            />
          )}

          <div style={{ marginBottom: '20px', color: 'var(--p4-text-muted)', fontSize: '13px' }}>
            {isRecording ? '点击停止录音' : '点击开始录音'}
          </div>

          <div style={{ borderTop: '1px solid var(--p4-border-subtle)', paddingTop: '20px', marginTop: '20px' }}>
            <div style={{ color: 'var(--p4-text-muted)', fontSize: '13px', marginBottom: '10px' }}>
              或者上传已有的音频文件
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="audio/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              📁 上传音频文件
            </Button>
          </div>
        </div>
      )}

      {/* 步骤 2: 预览和确认 */}
      {step === 'preview' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: 'var(--p4-text-secondary)', fontSize: '13px', marginBottom: '8px' }}>
              音频预览 ({audioDuration.toFixed(1)} 秒)
            </div>
            <audio
              controls
              src={audioUrl}
              style={{ width: '100%', height: '40px' }}
            />
            <Button
              size="small"
              onClick={handleReRecord}
              style={{ marginTop: '8px' }}
            >
              重新录制
            </Button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: 'var(--p4-text-secondary)', fontSize: '13px', marginBottom: '8px' }}>
              音色名称 <span style={{ color: 'var(--p4-danger)' }}>*</span>
            </div>
            <Input
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              placeholder="例如：我的声音"
              maxLength={50}
            />
          </div>

          <div style={{ marginBottom: '20px', padding: '12px', background: 'var(--p4-bg-elevated)', borderRadius: '8px', border: '1px solid var(--p4-border-subtle)' }}>
            <div style={{ color: 'var(--p4-text-muted)', fontSize: '12px' }}>
              💡 系统会自动识别你的语音内容，无需手动输入文字
            </div>
          </div>

          <Button
            type="primary"
            block
            size="large"
            onClick={handleCreateVoice}
            style={{ marginTop: '10px' }}
          >
            ✨ 创建我的声音
          </Button>
        </div>
      )}

      {/* 步骤 3: 创建中 */}
      {step === 'creating' && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎵</div>
          <div style={{ color: 'var(--p4-text-primary)', fontSize: '16px', marginBottom: '10px' }}>
            正在创建你的专属声音...
          </div>
          <div style={{ color: 'var(--p4-text-muted)', fontSize: '13px' }}>
            这可能需要几秒钟，请稍候
          </div>
          <Progress
            percent={99}
            status="active"
            showInfo={false}
            style={{ marginTop: '20px' }}
          />
        </div>
      )}

      {/* 步骤 4: 完成 */}
      {step === 'done' && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
          <div style={{ color: 'var(--p4-text-primary)', fontSize: '16px', marginBottom: '10px' }}>
            音色创建成功！
          </div>
          <div style={{ color: 'var(--p4-text-muted)', fontSize: '13px' }}>
            现在可以使用 "{voiceName}" 生成语音了
          </div>
        </div>
      )}
    </Modal>
  );
};

export default VoiceCreator;
