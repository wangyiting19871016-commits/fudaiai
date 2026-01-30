import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import ArtifactCanvas from './MissionFoundry/components/ArtifactCanvas';
import { mapAestheticWordToParams } from '../constants/AestheticProtocol';
import '../styles/p4Theme.css';
import { Input, Button, Form, message, Card, Select } from 'antd';

// 简化的 LabPage 组件 - 仅保留资产定义区和审美导向区
const LabPage = (props: any) => {
  // 从 props 中提取必要数据
  const { missionData, currentStepIndex = 0 } = props;
  
  // 所有Hook都放在组件最顶层
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();

  // 定义基础 State
  // 媒体就绪状态 - 控制遮罩层显示
  const [isMediaReady, setIsMediaReady] = useState<boolean>(false);
  // 状态机：当前步骤索引 - 默认为 0
  const [localStepIndex, setLocalStepIndex] = useState<number>(currentStepIndex || 0);
  // 用户资产数组
  const [userAssets, setUserAssets] = useState<string[]>([]);
  // 文件输入ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- P3 Logic Migration ---
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [form] = Form.useForm();
  
  // Load Tasks
  useEffect(() => {
    fetch('/api/tasks')
      .then(res => res.json())
      .then(data => {
          setTasks(data);
          if (data.length > 0) setSelectedTaskId(data[0].id);
      })
      .catch(err => {
          console.error('Failed to load tasks', err);
          // Silent fail or minimal notify in Lab context
      });
  }, []);

  // Load Task Config
  useEffect(() => {
    if (selectedTaskId) {
        const task = tasks.find(t => t.id === selectedTaskId);
        setCurrentTask(task);
        form.resetFields();
        setResult(null);
    }
  }, [selectedTaskId, tasks]);

  const handleExecute = async (values: any) => {
      setIsRunning(true);
      setResult(null);
      try {
          const res = await fetch('/api/execute-task', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  task_id: selectedTaskId,
                  user_inputs: values
              })
          });
          
          if (!res.ok) throw new Error('Execution failed');
          
          const data = await res.json();
          console.log('[P3] Execution Result:', data);
          setResult(data);
          message.success('Task executed successfully');
      } catch (err: any) {
          message.error(err.message);
      } finally {
          setIsRunning(false);
      }
  };

  const renderResult = () => {
      if (!result) return null;
      
      const { type, data } = result;
      
      return (
          <Card title="Execution Result" style={{ marginTop: '20px', background: '#222', borderColor: '#444', color: '#fff' }}>
              {type === 'image' && (
                  <img src={data} style={{ maxWidth: '100%', borderRadius: '8px' }} alt="Result" />
              )}
              {type === 'audio' && (
                  <audio controls src={data} style={{ width: '100%' }} />
              )}
              {type === 'html' && (
                  <iframe 
                      srcDoc={data} 
                      style={{ width: '100%', height: '400px', border: 'none', background: '#fff' }} 
                      title="Result"
                  />
              )}
              {type === 'text' && (
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{data}</pre>
              )}
              {!['image', 'audio', 'html', 'text'].includes(type) && (
                   <pre>{JSON.stringify(result, null, 2)}</pre>
              )}
          </Card>
      );
  };
  // -------------------------

  // 使用 useMemo 锁定 activeData，当 props 变动时强制重新计算
  const activeData = useMemo(() => {
    return missionData || // 1. 优先认领 P4 预览数据
           location.state?.missionData || // 2. 跳转状态
           JSON.parse(sessionStorage.getItem('P3_PROTOCOL_LOCK') || 'null'); // 3. 缓存
  }, [missionData, location.state]);
  
  // 强制解除加载状态
  useEffect(() => {
    if (missionData?.id) {
      setIsMediaReady(true); // 物理强制宣布就绪
    }
  }, [missionData?.id]);
  
  // 极简布局：左边看标杆，右边调素材，中间下指令
  const layoutStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    position: 'relative',
    background: 'var(--p4-bg-canvas)',
    color: 'var(--p4-text-primary)',
    fontFamily: 'monospace'
  };
  
  return (
    <div id="lab-main-container" style={layoutStyle} className="p4-theme">
      <div id="center-workshop" style={{ width: '100%', height: '100%', display: 'flex' }}>
        
        {/* Left: Original Lab Visuals (Hidden or Minimized if P3 Task Active?) 
            User wants P3 Logic MERGED into LabPage.
            Let's put P3 Task Panel on the Right side overlay or integrated.
        */}

        {/* 中轴：核心工作区 - 空间布局校准 */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          height: '100%',
          background: 'var(--p4-bg-surface)',
          overflow: 'auto'
        }}>
          {/* 上半部：工作视图 - 双屏监控区 */}
          <div style={{ 
            flex: 4, 
            height: '50vh', 
            padding: '20px', 
            background: 'var(--p4-bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}>
             {/* P3 Task Selection Header */}
             <div style={{ marginBottom: '20px', width: '100%', maxWidth: '600px', zIndex: 100 }}>
                  <div style={{ marginBottom: '8px', color: '#888' }}>Select P3 Task:</div>
                  <Select 
                      style={{ width: '100%' }}
                      value={selectedTaskId}
                      onChange={setSelectedTaskId}
                      options={tasks.map(t => ({ label: t.title, value: t.id }))}
                      styles={{
                        popup: {
                          root: {
                            background: '#ffffff',
                            border: '1px solid #d9d9d9'
                          }
                        }
                      }}
                  />
             </div>

            {/* P3 Result Area replaces visual comparison if task is run */}
            {result ? (
               <div style={{ width: '100%', maxWidth: '800px' }}>
                   {renderResult()}
                   <Button onClick={() => setResult(null)} style={{ marginTop: '10px' }}>Clear Result</Button>
               </div>
            ) : (
                <div style={{ 
                  display: 'flex', 
                  gap: '20px', 
                  height: '90%',
                  width: '100%',
                  maxWidth: '1200px'
                }}>
                  {/* 左屏：任务门面封面（Target） */}
                  <div style={{ 
                    flex: 1, 
                    border: '1px solid var(--p4-border-subtle)', 
                    background: 'var(--p4-bg-input)', 
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      position: 'absolute', 
                      top: 10, 
                      left: 10, 
                      color: 'var(--p4-warn)', 
                      fontSize: '12px',
                      zIndex: 10
                    }}>资产定义区 - 上传门面</div>
                    {/* 显示任务门面封面，优先使用facadeCoverUrl，其次使用video.url */}
                    {activeData?.facadeCoverUrl && (
                      <img
                        key={activeData.facadeCoverUrl}
                        src={activeData.facadeCoverUrl}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'contain'
                        }}
                      />
                    )}
                  </div>
                  {/* 右屏：当前步骤素材图（Source） */}
                  <div style={{ 
                    flex: 1, 
                    border: '1px solid var(--p4-border-subtle)', 
                    background: 'var(--p4-bg-input)', 
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      position: 'absolute', 
                      top: 10, 
                      left: 10, 
                      color: 'var(--p4-warn)', 
                      fontSize: '12px',
                      zIndex: 10
                    }}>视觉效果对照</div>
                    {/* 显示当前步骤的素材图 */}
                    {activeData?.steps?.[localStepIndex]?.mediaAssets?.[0]?.url && (
                      <ArtifactCanvas
                        id="p3-preview-image"
                        key={`step-${localStepIndex}-${activeData.steps[localStepIndex].mediaAssets[0].url}`}
                        imageUrl={activeData.steps[localStepIndex].mediaAssets[0].url}
                        controls={activeData?.steps?.[localStepIndex]?.controls || []}
                        style={{ 
                          width: '100%', 
                          height: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    )}
                  </div>
                </div>
            )}
          </div>
          
          {/* P3 Execution Form Area (Replaces Intent Box if Task Selected) */}
          <div style={{ 
            padding: '20px', 
            background: 'var(--p4-bg-surface)',
            borderTop: '1px solid var(--p4-border-subtle)'
          }}>
             {currentTask ? (
                 <div style={{ maxWidth: '800px', margin: '0 auto', background: '#1e1e1e', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', marginBottom: '10px' }}>
                          {currentTask.title}
                      </div>
                      <div style={{ color: '#888', marginBottom: '20px' }}>{currentTask.description}</div>
                      
                      <Form form={form} onFinish={handleExecute} layout="vertical">
                          {currentTask.ui_schema.map((field: any) => (
                              <Form.Item 
                                  key={field.id} 
                                  name={field.id} 
                                  label={<span style={{ color: '#ccc' }}>{field.label}</span>}
                                  rules={[{ required: true }]}
                              >
                                  <Input style={{ background: '#333', border: '1px solid #555', color: '#fff' }} />
                              </Form.Item>
                          ))}
                          
                          <Button 
                              type="primary" 
                              htmlType="submit" 
                              loading={isRunning}
                              block
                              size="large"
                              style={{ marginTop: '10px' }}
                          >
                              {isRunning ? 'Executing...' : 'Run Task'}
                          </Button>
                      </Form>
                 </div>
             ) : (
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  maxWidth: '800px',
                  margin: '0 auto'
                }}>
                  <input
                    type="text"
                    placeholder="输入创作意图（如：调整亮度、提高对比度）"
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      background: 'var(--p4-bg-input)',
                      border: '1px solid var(--p4-border-strong)',
                      color: 'var(--p4-text-primary)',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontFamily: 'monospace'
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const intent = e.currentTarget.value;
                        console.log('[INTENT_SUBMITTED]', intent);
                        
                        // 其他意图处理：将意图与参数绑定
                        const mappedParams = mapAestheticWordToParams(intent);
                        console.log('[INTENT_MAPPED] 映射到参数:', mappedParams);
                        
                        // 更新当前步骤的参数
                        if (activeData?.steps?.[localStepIndex]) {
                          const newStep = { ...activeData.steps[localStepIndex] };
                          newStep.controls = newStep.controls || [];
                          // 合并映射参数到当前控件
                          Object.entries(mappedParams).forEach(([key, value]) => {
                            const controlIndex = newStep.controls.findIndex((control: any) => control.target === `artifact:${key}`);
                            if (controlIndex >= 0) {
                              newStep.controls[controlIndex].value = value;
                            } else {
                              newStep.controls.push({
                                target: `artifact:${key}`,
                                value: value
                              });
                            }
                          });
                          
                          const newSteps = [...activeData.steps];
                          newSteps[localStepIndex] = newStep;
                        }
                      }
                    }}
                  />
                  <button
                    style={{
                      padding: '12px 24px',
                      background: 'var(--p4-accent)',
                      color: 'var(--p4-bg-canvas)',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontFamily: 'monospace'
                    }}
                    onClick={() => {
                      console.log('[INTENT_EXECUTED] 生成切片');
                      // 生成切片，导出标准化的任务包
                      const missionPack = {
                        targetImageIndex: 0, // 成品图索引
                        currentStepParams: activeData?.steps?.[localStepIndex]?.controls || [], // 当前步参数参考值
                        aestheticInstruction: activeData?.steps?.[localStepIndex]?.instruction || '请根据创作意图调整参数', // 导向文案
                        stepsImages: activeData?.steps?.map((step: any) => step.mediaAssets?.[0]?.url || '') || [] // 步骤图
                      };
                      console.log('[MISSION_PACK_GENERATED] 标准化任务包已生成:', missionPack);
                      
                      // 将missionPack导出为JSON
                      const jsonString = JSON.stringify(missionPack, null, 2);
                      const blob = new Blob([jsonString], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `mission-pack-${Date.now()}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    生成切片
                  </button>
                </div>
             )}
          </div>
        
          {/* 参数收纳：将14个滑块面板默认收起，仅保留一个可移动的悬浮按钮 */}
          <div style={{ 
            position: 'fixed',
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1000,
            background: 'var(--p4-accent)',
            color: 'var(--p4-bg-canvas)',
            padding: '12px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            fontFamily: 'monospace'
          }}>
            ⚙️ 调参面板
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabPage;
