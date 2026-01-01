import React, { useState, useRef } from 'react';
import { ChevronUp, ChevronDown, Pin, Trash2, Plus, Upload, Video } from 'lucide-react';

interface AtomicTask {
  id: string;
  title: string;
  description: string;
  verificationType: 'SCREEN' | 'TEXT' | 'VOICE' | 'NONE';
  verifyParam?: string | object; // 验证参数：颜色代码或关键词或对象
  isPinned: boolean;
  forcePause?: boolean; // 强制代码初始暂停
}

interface TaskEditorContainerProps {
  missionData: any;
  onMissionDataChange: (data: any) => void;
  selectedScheme?: string | null;
}

const TaskEditorContainer: React.FC<TaskEditorContainerProps> = ({ 
  missionData, 
  onMissionDataChange,
  selectedScheme 
}) => {
  // DEEPSEEK 逻辑挂起：在 activeMission 数据流未通之前，打印调试信息
  React.useEffect(() => {
    console.log('🔍 DEEPSEEK 调试 - TaskEditorContainer 初始化:', {
      missionData: missionData,
      hasSteps: missionData?.steps?.length || 0,
      missionId: missionData?.id,
      missionTitle: missionData?.title,
      timestamp: new Date().toISOString()
    });
    
    // 检查 localStorage 中的 activeMission 状态
    const activeMission = localStorage.getItem('activeMission');
    console.log('🔍 DEEPSEEK 调试 - localStorage activeMission:', {
      exists: !!activeMission,
      content: activeMission ? JSON.parse(activeMission) : null
    });
  }, [missionData]);

  // 发布状态管理
  const [isReleased, setIsReleased] = useState(false);
  
  // 本地文件上传状态
  const [localVideoFile, setLocalVideoFile] = useState<File | null>(null);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 预览状态管理
  const [isPreviewWorking, setIsPreviewWorking] = useState(true);
  // 存储键名（硬编码为MISSION_STORAGE_V1）
  const storageKey = 'MISSION_STORAGE_V1';
  
  const [tasks, setTasks] = useState<AtomicTask[]>(() => {
    // P4 即开即用逻辑：页面初始化时自动创建默认任务
    console.log('🔍 P4 即开即用 - 任务状态初始化:', {
      missionDataSteps: missionData?.steps?.length || 0,
      missionData: missionData,
      selectedScheme: selectedScheme
    });
    
    // 检查是否有持久化存储的任务数据
    try {
      const stableStorage = localStorage.getItem('MISSION_STABLE_STORAGE');
      if (stableStorage) {
        const storedData = JSON.parse(stableStorage);
        if (storedData.tasks && storedData.tasks.length > 0) {
          console.log('🔍 P4 持久化 - 从稳定存储加载任务');
          setIsReleased(storedData.isReleased || false);
          return storedData.tasks;
        }
      }
    } catch (error) {
      console.warn('P4 持久化 - 稳定存储读取失败:', error);
    }
    
    // 根据选择的方案类型处理AI生成的任务
    if (missionData?.steps && selectedScheme) {
      console.log('🔍 P4 方案拆解 - 开始处理方案:', selectedScheme);
      
      // 根据方案类型调整任务结构
      const schemeAdjustedTasks = missionData.steps.map((step: any, index: number) => {
        let adjustedStep = { ...step };
        
        // 根据方案类型调整验证参数
        switch (selectedScheme) {
          case 'A': // 原味方案 - 侧重文本描述
            adjustedStep.verificationType = 'TEXT';
            adjustedStep.verifyParam = {
              keywords: ['完成', '成功', '正确'],
              description: '基于文本描述的验证'
            };
            break;
            
          case 'B': // 平行方案 - 侧重坐标物理比对
            adjustedStep.verificationType = 'SCREEN';
            adjustedStep.verifyParam = {
              target: `element_${index + 1}`,
              color_hint: '#333',
              element_desc: '基于坐标比对的视觉验证'
            };
            break;
            
          case 'C': // 综合方案 - 视觉语义 + 逻辑门限
            adjustedStep.verificationType = index % 2 === 0 ? 'SCREEN' : 'TEXT';
            adjustedStep.verifyParam = {
              target: `composite_${index + 1}`,
              keywords: ['完成', '验证'],
              element_desc: '综合视觉与文本验证'
            };
            break;
        }
        
        return {
          id: `task_${index}`,
          title: step.title || `任务 ${index + 1}`,
          description: step.description || step.interaction?.prompt || '',
          verificationType: adjustedStep.verificationType || 
                          step.type === 'SCREEN_SHOT' ? 'SCREEN' : 
                          step.type === 'TEXT' ? 'TEXT' : 
                          step.type === 'VOICE' ? 'VOICE' : 'NONE',
          verifyParam: adjustedStep.verifyParam || {},
          isPinned: false,
          forcePause: false
        };
      });
      
      console.log('🔍 P4 方案拆解 - 调整后的任务:', schemeAdjustedTasks);
      return schemeAdjustedTasks;
    }
    
    // 将AI生成的任务转换为原子任务卡片（无方案选择时）
    if (missionData?.steps) {
      const convertedTasks = missionData.steps.map((step: any, index: number) => ({
        id: `task_${index}`,
        title: step.title || `任务 ${index + 1}`,
        description: step.description || step.interaction?.prompt || '',
        verificationType: step.type === 'SCREEN_SHOT' ? 'SCREEN' : 
                        step.type === 'TEXT' ? 'TEXT' : 
                        step.type === 'VOICE' ? 'VOICE' : 'NONE',
        verifyParam: {},
        isPinned: false,
        forcePause: false
      }));
      
      console.log('🔍 P4 即开即用 - 转换后的任务:', convertedTasks);
      return convertedTasks;
    }
    
    // P4 核心特性：即开即用，页面初始化时自动创建默认任务
    console.log('🔍 P4 即开即用 - 自动创建默认任务');
    return [{
      id: `task_${Date.now()}`,
      title: '欢迎使用 P4 任务铸造厂',
      description: '这是一个示例任务，您可以编辑标题和描述，选择验证类型，然后点击"一键同步协议"将任务同步到 P3。',
      verificationType: 'NONE',
      verifyParam: {},
      isPinned: false,
      forcePause: false
    }];
  });

  // 添加新任务 - 确保包含所有必要字段
  const addNewTask = () => {
    const newTask: AtomicTask = {
      id: `task_${Date.now()}`,
      title: '新任务',
      description: '请输入任务描述...',
      verificationType: 'NONE',
      verifyParam: {}, // 确保包含 verifyParam 字段，必须是空对象
      isPinned: false,
      forcePause: false // 确保包含 forcePause 字段
    };
    
    // 立即执行状态更新，确保 UI 响应
    setTasks(prev => {
      const updatedTasks = [...prev, newTask];
      console.log('✅ 手动创建任务成功:', {
        taskId: newTask.id,
        title: newTask.title,
        totalTasks: updatedTasks.length
      });
      return updatedTasks;
    });
  };

  // 更新任务 - 强制 UI 绑定确保实时状态更新
  const updateTask = (taskId: string, updates: Partial<AtomicTask>) => {
    setTasks(prev => {
      const updatedTasks = prev.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      );
      
      // 调试日志：记录状态更新
      console.log('🔧 任务状态更新:', {
        taskId,
        updates,
        totalTasks: updatedTasks.length,
        timestamp: new Date().toISOString()
      });
      
      return updatedTasks;
    });
  };

  // 删除任务
  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  // 移动任务
  const moveTask = (taskId: string, direction: 'up' | 'down') => {
    setTasks(prev => {
      const index = prev.findIndex(task => task.id === taskId);
      if (index === -1) return prev;
      
      const newTasks = [...prev];
      if (direction === 'up' && index > 0) {
        [newTasks[index - 1], newTasks[index]] = [newTasks[index], newTasks[index - 1]];
      } else if (direction === 'down' && index < newTasks.length - 1) {
        [newTasks[index], newTasks[index + 1]] = [newTasks[index + 1], newTasks[index]];
      }
      return newTasks;
    });
  };

  // 置顶任务
  const pinTask = (taskId: string) => {
    setTasks(prev => {
      const taskIndex = prev.findIndex(task => task.id === taskId);
      if (taskIndex === -1) return prev;
      
      const task = prev[taskIndex];
      const newTasks = prev.filter((_, i) => i !== taskIndex);
      
      if (task.isPinned) {
        // 取消置顶，放回原位置
        newTasks.splice(taskIndex, 0, { ...task, isPinned: false });
      } else {
        // 置顶，放到最前面
        newTasks.unshift({ ...task, isPinned: true });
      }
      
      return newTasks;
    });
  };

  // 本地文件上传处理
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // 检查文件类型
    if (!file.type.startsWith('video/')) {
      alert('请上传视频文件（MP4格式）');
      return;
    }
    
    // 检查文件大小（限制为100MB）
    if (file.size > 100 * 1024 * 1024) {
      alert('文件大小不能超过100MB');
      return;
    }
    
    setLocalVideoFile(file);
    
    // 生成本地Blob URL
    const videoUrl = URL.createObjectURL(file);
    setLocalVideoUrl(videoUrl);
    
    console.log('📹 本地视频文件已上传:', {
      name: file.name,
      size: file.size,
      type: file.type,
      url: videoUrl
    });
    
    alert('✅ 视频文件上传成功！已生成本地Blob URL供P3预览。');
  };

  // 清除上传的文件
  const clearUploadedFile = () => {
    if (localVideoUrl) {
      URL.revokeObjectURL(localVideoUrl);
    }
    setLocalVideoFile(null);
    setLocalVideoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 同步到协议 - 强制物理覆盖全局状态
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  
  // 同步到协议 - 简化发布逻辑
  const handleSyncToProtocol = (e: React.MouseEvent) => {
    if(e) e.preventDefault(); // 1. 阻止任何表单提交
    
    // 硬核发货：直接获取页面上正在播放的视频源
    const finalUrl = document.querySelector('video')?.src || localVideoUrl || "https://vjs.zencdn.net/v/oceans.mp4";
    
    // 构建同步数据，包含本地视频文件信息
    const syncData = {
      tasks: tasks,
      localVideoUrl: finalUrl, // 直接使用获取到的视频URL
      syncTimestamp: new Date().toISOString(),
      missionId: missionData?.id || `mission_${Date.now()}`
    };
    localStorage.setItem(storageKey, JSON.stringify(syncData)); // 2. 纯净写入数据
    alert('数据已锁死在 LocalStorage'); // 3. 阻塞式确认
  };
  
  // 强制发布 - 硬核发货逻辑
  const handleForceRelease = (e: React.MouseEvent) => {
    if(e) e.preventDefault(); // 1. 阻止任何表单提交
    
    // 硬核发货：直接获取页面上正在播放的视频源
    const finalUrl = document.querySelector('video')?.src || "https://vjs.zencdn.net/v/oceans.mp4";
    
    // 构建强制测试任务数据
    const dataToStore = {
      mediaUrl: finalUrl,
      material: "console.log('真迹协议点火成功');",
      title: "强制测试任务"
    };
    
    // 直接塞进仓库，跳过所有校验
    localStorage.setItem(storageKey, JSON.stringify(dataToStore));
    alert('✅ 硬核发货成功！数据已直接写入 LocalStorage');
  };
  
  // 重新进入编辑模式
  const handleReenterEditMode = () => {
    setIsReleased(false);
    
    // 更新稳定存储状态
    try {
      const stableStorage = localStorage.getItem('MISSION_STABLE_STORAGE');
      if (stableStorage) {
        const storedData = JSON.parse(stableStorage);
        storedData.isReleased = false;
        localStorage.setItem('MISSION_STABLE_STORAGE', JSON.stringify(storedData));
      }
    } catch (error) {
      console.warn('P4 持久化 - 状态更新失败:', error);
    }
    
    alert("🔓 已重新进入编辑模式，可以修改任务内容。");
  };

  // 获取当前物理存储位置（从 localStorage 或其他方式）
  const getCurrentStoragePath = (): string => {
    // 从 localStorage 获取 projectRootPath
    const storedPath = localStorage.getItem('projectRootPath');
    // 默认为 F:/Truth
    return storedPath || 'F:/Truth';
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: '#000'
    }}>
      {/* P4 常驻操作区 - 页面顶部固定 */}
      <div style={{
        padding: '16px 0',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        marginBottom: '16px',
        background: '#111',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#06b6d4',
              margin: 0
            }}>
              🛠️ P4 任务铸造厂
            </h3>
            {/* 可视化路径反馈 */}
            <div style={{
              fontSize: '12px',
              color: '#10b981',
              fontWeight: 'bold'
            }}>
              📁 当前物理存储位置：{getCurrentStoragePath()}
            </div>
          </div>
          
          {/* 常驻操作按钮组 */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={handleSyncToProtocol}
              disabled={syncStatus === 'syncing' || isReleased}
              style={{
                padding: '8px 12px',
                height: '36px',
                background: syncStatus === 'success' ? '#10b981' : 
                         syncStatus === 'syncing' ? '#f59e0b' : 
                         syncStatus === 'error' ? '#ef4444' : '#10b981',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '11px',
                cursor: syncStatus === 'syncing' || isReleased ? 'not-allowed' : 'pointer',
                opacity: syncStatus === 'syncing' || isReleased ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => syncStatus !== 'syncing' && !isReleased && (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => syncStatus !== 'syncing' && !isReleased && (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {syncStatus === 'syncing' ? '🔄 同步中' :
               syncStatus === 'success' ? '✅ 已下发' :
               syncStatus === 'error' ? '❌ 失败' : '🚀 同步协议'}
            </button>
            
            <button 
              onClick={addNewTask}
              disabled={isReleased}
              style={{
                padding: '8px 12px',
                height: '36px',
                background: isReleased ? '#666' : '#06b6d4',
                color: isReleased ? '#999' : '#000',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '11px',
                cursor: isReleased ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => !isReleased && (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => !isReleased && (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <Plus size={12} />
              + 新建
            </button>
            
            {/* 载入吴恩达-分隔符策略案例按钮 */}
            <button 
              onClick={() => {
                // 向任务列表中添加吴恩达-分隔符策略案例的微步数据
                const ngCaseTasks = [
                  {
                    id: `task_${Date.now()}_1`,
                    title: '分隔符策略',
                    description: '使用分隔符（如###）来明确区分输入的不同部分，帮助模型理解任务边界。',
                    verificationType: 'SCREEN' as const,
                    verifyParam: '#06b6d4',
                    isPinned: false,
                    forcePause: false
                  },
                  {
                    id: `task_${Date.now()}_2`,
                    title: '结构化输出',
                    description: '要求模型输出结构化数据（如JSON、XML），便于后续处理。',
                    verificationType: 'TEXT' as const,
                    verifyParam: 'JSON,结构化,格式',
                    isPinned: false,
                    forcePause: false
                  },
                  {
                    id: `task_${Date.now()}_3`,
                    title: '迭代思维',
                    description: '通过多次迭代优化prompt，逐步提高输出质量。',
                    verificationType: 'VOICE' as const,
                    verifyParam: '',
                    isPinned: false,
                    forcePause: false
                  }
                ];
                
                setTasks(prev => [...prev, ...ngCaseTasks]);
                alert('✅ 已载入吴恩达-分隔符策略案例！');
              }}
              disabled={isReleased}
              style={{
                padding: '8px 12px',
                height: '36px',
                background: isReleased ? '#666' : '#8b5cf6',
                color: isReleased ? '#999' : '#fff',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '11px',
                cursor: isReleased ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => !isReleased && (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => !isReleased && (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <Upload size={12} />
              吴恩达案例
            </button>
            
            {/* 红色按钮 - 稳定发布 */}
            <button 
              onClick={isReleased ? handleReenterEditMode : handleForceRelease}
              style={{
                padding: '8px 12px',
                height: '36px',
                background: isReleased ? '#10b981' : '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: isReleased ? '0 1px 4px rgba(16, 185, 129, 0.3)' : '0 1px 4px rgba(239, 68, 68, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = isReleased ? '0 2px 8px rgba(16, 185, 129, 0.5)' : '0 2px 8px rgba(239, 68, 68, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = isReleased ? '0 1px 4px rgba(16, 185, 129, 0.3)' : '0 1px 4px rgba(239, 68, 68, 0.3)';
              }}
            >
              {isReleased ? '🔓 编辑模式' : '🔴 稳定发布'}
            </button>
          </div>
        </div>
        
        {/* 状态提示 */}
        <div style={{
          fontSize: '11px',
          color: '#666',
          marginTop: '8px',
          textAlign: 'center'
        }}>
          {tasks.length === 0 ? '💡 点击"+ 新建任务"开始创建原子任务' : 
           `📋 当前任务数: ${tasks.length} | 即开即用，无需AI | 已自动创建默认任务`}
        </div>
      </div>

      {/* 任务卡片容器 - 紧凑矩阵布局 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: tasks.length === 0 ? 'flex' : 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '16px',
        alignContent: 'flex-start',
        justifyContent: tasks.length === 0 ? 'center' : 'flex-start',
        alignItems: tasks.length === 0 ? 'center' : 'flex-start'
      }}>
        {tasks.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#666',
            fontSize: '14px',
            textAlign: 'center',
            padding: '40px'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px',
              opacity: 0.5
            }}>📝</div>
            <p style={{
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>任务编辑器已就绪</p>
            <p style={{
              fontSize: '12px',
              lineHeight: '1.5',
              maxWidth: '300px'
            }}>暂无任务，请通过 AI 提取或点击"+ 新建任务"手动创建</p>
          </div>
        ) : (
          tasks.map((task, index) => (
            <div
              key={task.id}
              style={{
                background: task.isPinned ? 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)' : '#111',
                border: task.isPinned ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '16px',
                position: 'relative',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                height: 'fit-content'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* 置顶标识 */}
              {task.isPinned && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: '#f59e0b',
                  color: '#000',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  置顶
                </div>
              )}

              {/* 标题区 */}
              <input
                value={task.title}
                onChange={(e) => !isReleased && updateTask(task.id, { title: e.target.value })}
                disabled={isReleased}
                style={{
                  width: '100%',
                  background: isReleased ? 'rgba(255,255,255,0.05)' : 'transparent',
                  border: 'none',
                  color: isReleased ? '#888' : '#fff',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  outline: 'none',
                  padding: '0',
                  cursor: isReleased ? 'not-allowed' : 'text'
                }}
                placeholder="任务标题"
              />

              {/* 内容区 */}
              <textarea
                value={task.description}
                onChange={(e) => !isReleased && updateTask(task.id, { description: e.target.value })}
                disabled={isReleased}
                style={{
                  width: '100%',
                  height: '60px',
                  background: isReleased ? 'rgba(255,255,255,0.02)' : '#1a1a1a',
                  border: isReleased ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  padding: '8px',
                  color: isReleased ? '#666' : '#fff',
                  fontSize: '12px',
                  resize: isReleased ? 'none' : 'vertical',
                  outline: 'none',
                  marginBottom: '12px',
                  lineHeight: '1.4',
                  cursor: isReleased ? 'not-allowed' : 'text'
                }}
                placeholder="任务描述..."
                rows={3}
              />

              {/* 协议区 - 胶囊标签切换器 */}
              <div style={{
                display: 'flex',
                gap: '4px',
                marginBottom: '12px',
                background: isReleased ? 'rgba(255,255,255,0.02)' : '#1a1a1a',
                borderRadius: '6px',
                padding: '2px',
                border: isReleased ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(255,255,255,0.05)'
              }}>
                {(['NONE', 'TEXT', 'VOICE', 'SCREEN'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => !isReleased && updateTask(task.id, { verificationType: type })}
                    disabled={isReleased}
                    style={{
                      flex: 1,
                      padding: '4px 8px',
                      background: task.verificationType === type ? 
                                 (isReleased ? '#666' : '#06b6d4') : 
                                 (isReleased ? 'transparent' : 'transparent'),
                      color: task.verificationType === type ? 
                             (isReleased ? '#fff' : '#000') : 
                             (isReleased ? '#666' : '#888'),
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      cursor: isReleased ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      textTransform: 'uppercase',
                      opacity: isReleased ? 0.7 : 1
                    }}
                  >
                    {type === 'NONE' ? '无' : 
                     type === 'TEXT' ? '文本' : 
                     type === 'VOICE' ? '语音' : '屏幕'}
                  </button>
                ))}
              </div>

              {/* 验证参数输入区 */}
              {task.verificationType === 'SCREEN' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <span style={{
                    fontSize: '10px',
                    color: isReleased ? '#666' : '#888',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}>
                    锚点颜色:
                  </span>
                  
                  <input
                    type="color"
                    value={typeof task.verifyParam === 'string' ? task.verifyParam : '#ffc0cb'}
                    onChange={(e) => !isReleased && updateTask(task.id, { verifyParam: e.target.value })}
                    disabled={isReleased}
                    style={{
                      width: '30px',
                      height: '20px',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: isReleased ? 'not-allowed' : 'pointer',
                      opacity: isReleased ? 0.5 : 1
                    }}
                  />
                  
                  <input
                    type="text"
                    value={typeof task.verifyParam === 'string' ? task.verifyParam : '#ffc0cb'}
                    onChange={(e) => !isReleased && updateTask(task.id, { verifyParam: e.target.value })}
                    disabled={isReleased}
                    placeholder="#ffc0cb"
                    style={{
                      flex: 1,
                      background: isReleased ? 'rgba(255,255,255,0.02)' : '#1a1a1a',
                      border: isReleased ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '3px',
                      padding: '4px 8px',
                      color: isReleased ? '#666' : '#fff',
                      fontSize: '10px',
                      outline: 'none',
                      cursor: isReleased ? 'not-allowed' : 'text'
                    }}
                  />
                </div>
              )}
              
              {task.verificationType === 'TEXT' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <span style={{
                    fontSize: '10px',
                    color: isReleased ? '#666' : '#888',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}>
                    验证关键词:
                  </span>
                  
                  <input
                    type="text"
                    value={typeof task.verifyParam === 'string' ? task.verifyParam : ''}
                    onChange={(e) => !isReleased && updateTask(task.id, { verifyParam: e.target.value })}
                    disabled={isReleased}
                    placeholder="输入验证关键词"
                    style={{
                      flex: 1,
                      background: isReleased ? 'rgba(255,255,255,0.02)' : '#1a1a1a',
                      border: isReleased ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '3px',
                      padding: '4px 8px',
                      color: isReleased ? '#666' : '#fff',
                      fontSize: '10px',
                      outline: 'none',
                      cursor: isReleased ? 'not-allowed' : 'text'
                    }}
                  />
                </div>
              )}

              {/* 静态触发开关 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                padding: '6px',
                background: '#1a1a1a',
                borderRadius: '4px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <label style={{
                  fontSize: '10px',
                  color: '#888',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <input
                    type="checkbox"
                    checked={task.forcePause || false}
                    onChange={(e) => updateTask(task.id, { forcePause: e.target.checked })}
                    style={{
                      width: '14px',
                      height: '14px',
                      cursor: 'pointer'
                    }}
                  />
                  强制代码初始暂停
                </label>
                
                <span style={{
                  fontSize: '9px',
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  {task.forcePause ? '代码将等待用户触发' : '代码立即执行'}
                </span>
              </div>

              {/* 操作区 - 极简工具栏 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                opacity: 0.7,
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.7';
              }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => pinTask(task.id)}
                    title={task.isPinned ? '取消置顶' : '置顶'}
                    style={{
                      padding: '4px',
                      background: task.isPinned ? '#f59e0b' : 'transparent',
                      color: task.isPinned ? '#000' : '#888',
                      border: 'none',
                      borderRadius: '3px',
                      fontSize: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px'
                    }}
                  >
                    <Pin size={12} />
                  </button>
                  
                  <button
                    onClick={() => moveTask(task.id, 'up')}
                    disabled={index === 0}
                    title="上移"
                    style={{
                      padding: '4px',
                      background: index === 0 ? 'transparent' : 'transparent',
                      color: index === 0 ? '#444' : '#888',
                      border: 'none',
                      borderRadius: '3px',
                      fontSize: '10px',
                      cursor: index === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px'
                    }}
                  >
                    <ChevronUp size={12} />
                  </button>
                  
                  <button
                    onClick={() => moveTask(task.id, 'down')}
                    disabled={index === tasks.length - 1}
                    title="下移"
                    style={{
                      padding: '4px',
                      background: index === tasks.length - 1 ? 'transparent' : 'transparent',
                      color: index === tasks.length - 1 ? '#444' : '#888',
                      border: 'none',
                      borderRadius: '3px',
                      fontSize: '10px',
                      cursor: index === tasks.length - 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px'
                    }}
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>
                
                <button
                  onClick={() => deleteTask(task.id)}
                  title="删除任务"
                  style={{
                    padding: '4px',
                    background: 'transparent',
                    color: '#ef4444',
                    border: 'none',
                    borderRadius: '3px',
                    fontSize: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px'
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskEditorContainer;