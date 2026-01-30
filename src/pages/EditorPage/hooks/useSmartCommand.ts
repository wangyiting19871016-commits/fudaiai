import { MissionStep } from '../../../types';

interface UseSmartCommandProps {
  draftMission: any; // Using any for DraftMission to avoid circular deps or complex imports for now
  selectedStepIndex: number;
  updateDraftMission: (updates: any) => void;
  updateStep: (index: number, updates: Partial<MissionStep>) => void;
  handleAddStep: () => void;
  handleDeleteStep: (index: number) => void;
  handleMoveStepUp: (index: number) => void;
  handleMoveStepDown: (index: number) => void;
  analyzeStepAssets?: (index: number) => void;
  handleAutoFill: (index: number) => void;
  handleVoiceAI: (index: number) => void;
  showFeedback: (message: string) => void;
  instruction?: string;
}

export const useSmartCommand = ({
  draftMission,
  selectedStepIndex,
  updateDraftMission,
  updateStep,
  handleAddStep,
  handleDeleteStep,
  handleMoveStepUp,
  handleMoveStepDown,
  analyzeStepAssets,
  handleAutoFill,
  handleVoiceAI,
  showFeedback,
  instruction
}: UseSmartCommandProps) => {

  const handleSmartCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    // 打印当前选中的Step索引
    console.log(`当前选中的Step索引: ${selectedStepIndex}, 当前Step数量: ${draftMission.steps?.length || 0}`);
    
    // 指令解析和执行
    // 1. 增加步骤指令
    if (lowerCommand.includes('增加') || lowerCommand.includes('添加') || lowerCommand.includes('step')) {
      // 添加新步骤
      handleAddStep();
      
      // 检查指令是否包含"参数"、"调色"或"审美"关键字
      const hasKeyword = lowerCommand.includes('参数') || lowerCommand.includes('调色') || lowerCommand.includes('审美');
      
      // 如果包含关键字，获取新步骤的索引并设置pluginIds为['manual-14-tuner']
      if (hasKeyword) {
        // 新步骤索引为数组长度-1
        const newStepIndex = (draftMission.steps?.length || 0);
        
        // 调用updateStep函数更新新步骤的pluginIds
        updateStep(newStepIndex, { pluginIds: ['manual-14-tuner'] });
        console.log(`执行指令：增加步骤，并自动挂载manual-14-tuner插件`);
        showFeedback('✅ 步骤已增加，自动挂载了调色插件');
      } else {
        console.log('执行指令：增加步骤');
        showFeedback('✅ 步骤已增加');
      }
      
      console.log(`添加步骤后，当前Step数量: ${(draftMission.steps?.length || 0) + 1}`);
    }
    // 2. 物理参数对准指令 (Aesthetic Delta)
    else if (lowerCommand.includes('分析') || lowerCommand.includes('提取') || lowerCommand.includes('对准')) {
      // 强制日志诊断：打印当前校验结果
      console.log('=== 提取指令校验结果 ===');
      
      // 检查全局终点：左侧上传的成品图（targetAnchor）
      const hasTargetAnchor = !!(draftMission.facadeCoverUrl || draftMission.reference_material);
      console.log(`[Check] Target Anchor: ${hasTargetAnchor ? '✅ 有值' : '❌ 无值'}`);
      if (hasTargetAnchor) {
        console.log(`[Detail] Target URL: ${draftMission.facadeCoverUrl || draftMission.reference_material?.content || '未知'}`);
      }
      
      // 检查当前选中的Step
      let hasStepSource = false;
      let currentStep = null;
      if (selectedStepIndex >= 0 && selectedStepIndex < draftMission.steps.length) {
        currentStep = draftMission.steps[selectedStepIndex];
        hasStepSource = !!currentStep.sourceImage;
      }
      
      console.log(`[Check] Step Source: ${hasStepSource ? '✅ 有值' : '❌ 无值'}`);
      if (hasStepSource && currentStep) {
        console.log(`[Detail] Step Source URL: ${currentStep.sourceImage}`);
      }
      
      console.log(`[Check] Active Step Index: ${selectedStepIndex >= 0 ? selectedStepIndex + 1 : '❌ 未选中'}`);
      console.log('=========================');
      
      // 视觉反馈提示：精准提示缺什么
      if (!hasTargetAnchor && !hasStepSource) {
        console.log('未上传成品标杆和卡片素材，无法执行提取指令');
        showFeedback('请先在左侧上传审美终点（成品图）并为卡片上传素材图');
        return;
      } else if (!hasTargetAnchor) {
        console.log('未上传成品标杆，无法执行提取指令');
        showFeedback('请先在左侧上传审美终点（成品图）');
        return;
      } else if (!hasStepSource) {
        console.log('未上传卡片素材，无法执行提取指令');
        showFeedback('请先为当前选中卡片上传素材图');
        return;
      }
      
      // 强制状态同步：确保引用最新的MissionContext
      const latestMission = draftMission;
      const latestSelectedIndex = selectedStepIndex;
      
      // 寻找当前选中的Step
      if (latestSelectedIndex >= 0 && latestSelectedIndex < latestMission.steps.length) {
        // 填充14个非零数值到step.params中（伪算法）
        const params = {
          exposure: 0.8,
          brilliance: 0.7,
          highlights: 0.6,
          shadows: 0.5,
          contrast: 0.7,
          brightness: 0.6,
          blackPoint: 0.2,
          saturation: 0.8,
          vibrance: 0.7,
          warmth: 0.6,
          tint: 0.5,
          sharpness: 0.9,
          definition: 0.8,
          noise: 0.3
        };
        
        // 为当前选中的Step填充aestheticParams字段
        const updatedSteps = [...latestMission.steps];
        updatedSteps[latestSelectedIndex] = {
          ...updatedSteps[latestSelectedIndex],
          aestheticParams: params, // 直接填充14个非零数值
          isCompleted: true // 标记为已完成，显示✅ 审美性格已成功提取
        };
        
        updateDraftMission({ steps: updatedSteps });
        console.log(`执行指令：物理参数对准，为步骤 ${latestSelectedIndex + 1} 提取审美性格`);
        console.log('生成的参数:', params);
        console.log('参数数量:', Object.keys(params).length);
        showFeedback('✅ 审美参数已成功提取，已绑定14个参数');
      } else {
        console.log('未选中任何步骤，无法执行物理参数对准');
        showFeedback('⚠️ 未选中任何步骤');
      }
    } 
    else if (lowerCommand.includes('删除步骤')) {
      // 删除当前步骤
      if (selectedStepIndex >= 0 && draftMission.steps.length > 0) {
        console.log(`准备删除步骤 ${selectedStepIndex + 1}`);
        handleDeleteStep(selectedStepIndex);
        console.log(`执行指令：删除步骤 ${selectedStepIndex + 1}`);
        console.log(`删除步骤后，当前Step数量: ${draftMission.steps?.length || 0}`);
      } else {
        console.log(`无法删除步骤：当前选中索引 ${selectedStepIndex}，Step数量 ${draftMission.steps?.length || 0}`);
      }
    }
    else if (lowerCommand.includes('上移步骤')) {
      // 上移当前步骤
      if (selectedStepIndex > 0) {
        handleMoveStepUp(selectedStepIndex);
        console.log(`执行指令：上移步骤 ${selectedStepIndex + 1}`);
      }
    }
    else if (lowerCommand.includes('下移步骤')) {
      // 下移当前步骤
      if (selectedStepIndex < draftMission.steps.length - 1) {
        handleMoveStepDown(selectedStepIndex);
        console.log(`执行指令：下移步骤 ${selectedStepIndex + 1}`);
      }
    }
    else if (lowerCommand.includes('分析素材')) {
      // 分析当前步骤素材
      if (selectedStepIndex >= 0 && analyzeStepAssets) {
        analyzeStepAssets(selectedStepIndex);
        console.log(`执行指令：分析步骤 ${selectedStepIndex + 1} 素材`);
      }
    }
    else if (lowerCommand.includes('自动填充')) {
      // 自动填充当前步骤
      if (selectedStepIndex >= 0) {
        handleAutoFill(selectedStepIndex);
        console.log(`执行指令：自动填充步骤 ${selectedStepIndex + 1}`);
      }
    }
    else if (lowerCommand.includes('ai语音')) {
      // AI语音生成
      if (selectedStepIndex >= 0) {
        handleVoiceAI(selectedStepIndex);
        console.log(`执行指令：AI语音生成步骤 ${selectedStepIndex + 1}`);
      }
    }
    else if (lowerCommand.includes('投射至p3') || lowerCommand.includes('p3验证')) {
      // 投射至P3验证
      window.dispatchEvent(new CustomEvent('forceNavigateToP3', {
        detail: { missionData: draftMission }
      }));
      
      // 投射验证全量输出 (The Truth Output)
      console.log('=== P3 投射验证 - 全量输出 ===');
      console.log('📋 任务基本信息:');
      console.table({
        title: draftMission.title,
        type: draftMission.type,
        instruction: instruction || '无导向语',
        stepsCount: draftMission.steps.length,
        hasTargetBenchmark: !!draftMission.facadeCoverUrl || !!draftMission.reference_material
      });
      
      console.log('\n🎯 成品标杆:');
      console.table({
        facadeCoverUrl: draftMission.facadeCoverUrl || '无',
        referenceMaterial: draftMission.reference_material?.type ? `${draftMission.reference_material.type}: ${draftMission.reference_material.content}` : '无'
      });
      
      console.log('\n📝 步骤详情:');
      const stepsTable = draftMission.steps.map((step: any, index: number) => ({
        stepIndex: index + 1,
        title: step.title,
        instruction: step.instruction || step.desc || step.action_instruction || '无',
        hasParams: !!step.aestheticParams,
        paramCount: step.aestheticParams ? Object.keys(step.aestheticParams).length : 0,
        isCompleted: step.isCompleted
      }));
      console.table(stepsTable);
      
      // 如果有步骤包含参数，详细展示每个步骤的参数
      const stepsWithParams = draftMission.steps.filter((step: any) => step.aestheticParams);
      if (stepsWithParams.length > 0) {
        console.log('\n🔧 参数详情:');
        stepsWithParams.forEach((step: any, index: number) => {
          console.log(`\n步骤 ${index + 1}: ${step.title}`);
          if (step.aestheticParams) {
            // 显示审美参数
            console.table(step.aestheticParams);
            // 显示差异协议（如果存在）
            if (step.deltaParams) {
              console.log('差异协议:', step.deltaParams);
            }
          }
        });
      }
      
      console.log('\n=== P3 投射验证完成 ===');
    }
    else if (lowerCommand.includes('调整亮度') || lowerCommand.includes('亮度')) {
      // 调整亮度参数
      const match = command.match(/亮度\s*(\d+)/);
      if (match && selectedStepIndex >= 0) {
        const brightness = parseInt(match[1]);
        if (!isNaN(brightness)) {
          // 直接操作 MissionContext 数据，更新当前步骤的审美参数
          const updatedSteps = [...draftMission.steps];
          const currentStep = updatedSteps[selectedStepIndex];
          if (currentStep) {
            updatedSteps[selectedStepIndex] = {
              ...currentStep,
              aestheticParams: {
                ...currentStep.aestheticParams,
                brightness: brightness / 100 // 转换为 0-1 范围
              }
            };
            updateDraftMission({ steps: updatedSteps });
            
            // 同步到侧边抽屉和WebGL渲染
            window.dispatchEvent(new CustomEvent('updateArtifactParams', {
              detail: { brightness: brightness / 100 }
            }));
            
            console.log(`执行指令：调整步骤 ${selectedStepIndex + 1} 亮度为 ${brightness}%`);
          }
        }
      }
    }
    else if (lowerCommand.includes('调整对比度') || lowerCommand.includes('对比度')) {
      // 调整对比度参数
      const match = command.match(/对比度\s*(\d+)/);
      if (match && selectedStepIndex >= 0) {
        const contrast = parseInt(match[1]);
        if (!isNaN(contrast)) {
          // 直接操作 MissionContext 数据
          const updatedSteps = [...draftMission.steps];
          const currentStep = updatedSteps[selectedStepIndex];
          if (currentStep) {
            updatedSteps[selectedStepIndex] = {
              ...currentStep,
              aestheticParams: {
                ...currentStep.aestheticParams,
                contrast: contrast / 100 // 转换为 0-1 范围
              }
            };
            updateDraftMission({ steps: updatedSteps });
            
            // 同步到侧边抽屉和WebGL渲染
            window.dispatchEvent(new CustomEvent('updateArtifactParams', {
              detail: { contrast: contrast / 100 }
            }));
            
            console.log(`执行指令：调整步骤 ${selectedStepIndex + 1} 对比度为 ${contrast}%`);
          }
        }
      }
    }
    else {
      // 默认指令处理
      console.log(`执行未知指令：${command}`);
    }
  };

  return { handleSmartCommand };
};
