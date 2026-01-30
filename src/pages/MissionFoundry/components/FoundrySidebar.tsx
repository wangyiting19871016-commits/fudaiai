import React from 'react';
import { Sparkles, Cpu, Loader2, ArrowRight } from 'lucide-react';
import { useProtocolContext } from '../../../stores/ActiveProtocolStore';
import { useMissionContext } from '../../../stores/MissionContext';
import { useNavigate } from 'react-router-dom';

interface FoundrySidebarProps {
  // 状态
  isAnalyzing: boolean;
  draftMission: any;
  selectedStepIndex: number;
  
  // 方法
  handleAnalyze: (instruction?: string) => Promise<void>;
  handleSignAndRelease: () => void;
}

const FoundrySidebar: React.FC<FoundrySidebarProps> = ({
  isAnalyzing,
  draftMission,
  selectedStepIndex,
  
  handleAnalyze,
  handleSignAndRelease
}) => {
  // 智能指令状态管理
  const [smartInstruction, setSmartInstruction] = React.useState<string>('');
  const { state: protocolState } = useProtocolContext();
  const { dispatch } = useMissionContext();
  const navigate = useNavigate();

  // [RECIPE_OVERRIDE] 动态计算显示的协议数据
  const displayProtocol = React.useMemo(() => {
    const baseProtocol = protocolState.activeProtocol;
    if (!baseProtocol) return null;

    const currentStep = draftMission?.steps?.[selectedStepIndex];
    // 检查是否已挂载配方 (通过 isRecipeMode 或 modelId+parameters 判断)
    const isRecipeMode = currentStep?.isRecipeMode || (currentStep?.modelId && currentStep?.parameters);

    if (isRecipeMode) {
      return {
        ...baseProtocol,
        model_id: currentStep.modelId, // 覆盖模型 ID
        recipeParams: currentStep.recipeParams || currentStep.parameters, // 优先使用 recipeParams
        isRecipeMode: true // 标记为配方模式
      };
    }
    return { ...baseProtocol, isRecipeMode: false };
  }, [protocolState.activeProtocol, draftMission, selectedStepIndex]);
  
  // 进入P4LAB验证
  const handleEnterP4Lab = () => {
    if (protocolState.activeProtocol) {
      // 将当前抓到的JSON协议存入全局ActiveMissionContext
      dispatch({ 
        type: 'UPDATE_PROTOCOL', 
        protocol: protocolState.activeProtocol 
      });
      
      navigate('/p4-lab', {
        state: {
          stepIndex: selectedStepIndex,
          toolType: 'github-plugin',
          protocol: protocolState.activeProtocol // 同时传递给URL状态，确保P4Lab能获取到协议
        }
      });
    }
  };
  
  // 强制显影控制台数据
  console.log("【当前协议状态】:", protocolState.activeProtocol);
  
  return (
    <div style={{
        flex: '0 0 25%',
        height: '100%',
        borderRight: '1px solid #222',
        background: '#050505',
        display: 'flex',
        flexDirection: 'column',
        padding: '80px 40px',
        overflowY: 'auto',
        boxSizing: 'border-box'
      }}>
      <h1 style={{ fontSize: 28, fontWeight: '900', marginBottom: 10 }}>GitHub 逻辑提取器 <span style={{ color: '#a3a3a3' }}>(Powered by DeepSeek)</span></h1>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 30 }}>粘贴 GitHub README 或链接，我将为您自动生成 P2 路径与 API 协议。</p>

      {/* 智能指令输入框 - DeepSeek输入与执行区 */}
      <div style={{ marginBottom: 30, background: '#111', border: '1px solid #333', borderRadius: 8, padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 'bold', color: '#a3a3a3', marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16}/> 智能指令调参
        </h3>
        <div style={{ display: 'flex', gap: 10, marginBottom: 15, alignItems: 'flex-start' }}>
          <input
            type="text"
            placeholder="粘贴 GitHub README 或链接，我将为您自动生成 P2 路径与 API 协议。"
            value={smartInstruction}
            onChange={(e) => setSmartInstruction(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: '#000',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: 8,
              fontSize: 14,
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAnalyze(smartInstruction);
              }
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '120px' }}>
            <button 
              onClick={() => handleAnalyze(smartInstruction)}
              disabled={isAnalyzing}
              style={{
                padding: '12px 20px',
                height: '42px',
                background: isAnalyzing ? '#222' : '#a3a3a3',
                color: isAnalyzing ? '#666' : '#000',
                border: 'none',
                borderRadius: 8,
                fontWeight: 'bold',
                fontSize: 14,
                cursor: isAnalyzing ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              {isAnalyzing ? <><Loader2 className="animate-spin" size={16}/> 生成中...</> : '执行'}
            </button>
            
            {/* 信号显影 - 唯一留下的调试灯 */}
            <div style={{
              backgroundColor: protocolState.activeProtocol ? '#0f422d' : '#421212',
              color: protocolState.activeProtocol ? '#a3a3a3' : '#ef4444',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              {protocolState.activeProtocol ? "🟢 协议已就绪" : "🔴 协议为空"}
            </div>
          </div>
        </div>
        
        {/* 快速操作按钮 */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            onClick={() => handleAnalyze(smartInstruction)}
            disabled={isAnalyzing}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: '#000',
              color: '#a3a3a3',
              border: '1px solid #a3a3a3',
              borderRadius: 8,
              fontWeight: 'bold',
              fontSize: 13,
              cursor: isAnalyzing ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.2s ease'
            }}
          >
            <Cpu size={14}/> 解析原子任务
          </button>
          {/* 签署并发布按钮 */}
          <button 
            onClick={handleSignAndRelease}
            disabled={!protocolState.activeProtocol?.verified}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: protocolState.activeProtocol?.verified ? '#a3a3a3' : '#333',
              color: protocolState.activeProtocol?.verified ? '#000' : '#666',
              border: '1px solid #a3a3a3',
              borderRadius: 8,
              fontWeight: 'bold',
              fontSize: 13,
              cursor: protocolState.activeProtocol?.verified ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.2s ease'
            }}
          >
            📦 签署并发布
          </button>
        </div>
      </div>

      {/* ProtocolPreviewCard - 当DeepSeek解析成功后显示 (支持配方动态覆盖) */}
      {displayProtocol && (
        <div style={{ marginBottom: 30, background: '#111', border: '1px solid #333', borderRadius: 8, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 'bold', color: '#a3a3a3', marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16}/> 
            {displayProtocol.isRecipeMode ? 'API 协议 (已挂载配方)' : 'API 协议已生成'}
            {displayProtocol.isRecipeMode && <span style={{ fontSize: 10, backgroundColor: '#a3a3a3', color: '#000', padding: '2px 6px', borderRadius: 4 }}>RECIPE ACTIVE</span>}
          </h3>
          
          <div style={{ backgroundColor: '#000', borderRadius: 8, padding: 15, marginBottom: 15, fontSize: 13, lineHeight: 1.6 }}>
            <div style={{ marginBottom: 12 }}>
              <span style={{ color: '#a3a3a3', fontWeight: 'bold' }}>模型ID:</span> 
              <span style={{ marginLeft: 8, color: displayProtocol.isRecipeMode ? '#a3a3a3' : '#fff', fontWeight: displayProtocol.isRecipeMode ? 'bold' : 'normal' }}>
                {displayProtocol.model_id || '无'}
              </span>
            </div>
            <div style={{ marginBottom: 12 }}>
              <span style={{ color: '#a3a3a3', fontWeight: 'bold' }}>API地址:</span> 
              <span style={{ color: '#fff', wordBreak: 'break-all', display: 'block', marginTop: 5 }}>
                {displayProtocol.endpoint || '无'}
              </span>
            </div>
            
            {/* 动态参数列表 */}
            <div style={{ marginTop: 15 }}>
              <span style={{ color: '#a3a3a3', fontWeight: 'bold', display: 'block', marginBottom: 8 }}>
                参数列表:
              </span>
              <div style={{ backgroundColor: '#111', borderRadius: 6, padding: 12, maxHeight: 200, overflowY: 'auto' }}>
                {displayProtocol.params_schema && displayProtocol.params_schema.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {displayProtocol.params_schema.map((param: any, index: number) => {
                      // 检查该参数是否被配方覆盖或有输入值
                      const recipeValue = displayProtocol.recipeParams?.[param.id];
                      const inputValue = displayProtocol.input_params?.[param.id];
                      
                      // 优先级：配方 > 输入 > 默认
                      let finalValue = param.defaultValue;
                      let source = 'default'; // default, input, recipe
                      
                      if (recipeValue !== undefined) {
                        finalValue = recipeValue;
                        source = 'recipe';
                      } else if (inputValue !== undefined) {
                        finalValue = inputValue;
                        source = 'input';
                      }

                      const isOverridden = source === 'recipe';
                      
                      return (
                        <div key={index} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          padding: '8px 0',
                          borderBottom: index < displayProtocol.params_schema.length - 1 ? '1px solid #333' : 'none'
                        }}>
                          <div>
                            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
                              {param.name}
                            </div>
                            <div style={{ color: '#666', fontSize: 11, marginTop: 2 }}>
                              {param.type} {param.required ? '(必填)' : '(可选)'}
                            </div>
                          </div>
                          <div style={{ 
                            color: source === 'recipe' ? '#a3a3a3' : (source === 'input' ? '#fff' : '#f59e0b'), 
                            fontSize: 11,
                            fontWeight: source !== 'default' ? 'bold' : 'normal',
                            textAlign: 'right',
                            maxWidth: '120px',
                            wordBreak: 'break-all'
                          }}>
                            {source === 'recipe' ? (
                              <>
                                <span>{JSON.stringify(finalValue)}</span>
                                <div style={{ fontSize: 9, opacity: 0.7 }}>✨ [配方覆盖]</div>
                              </>
                            ) : (
                              source === 'input' ? (
                                <span>{JSON.stringify(finalValue)}</span>
                              ) : (
                                `默认值: ${finalValue !== undefined ? JSON.stringify(finalValue) : '无'}`
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ color: '#666', textAlign: 'center', fontSize: 12 }}>
                    暂无参数
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleEnterP4Lab}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: '#a3a3a3',
              color: '#000',
              border: 'none',
              borderRadius: 8,
              fontWeight: 'bold',
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            ⚡ 进入 P4LAB 实测 <ArrowRight size={16}/>
          </button>
        </div>
      )}
    </div>
  );
};

export default FoundrySidebar;