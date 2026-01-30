import { useState } from 'react';
import { PayloadBuilder } from '../../../services/PayloadBuilder';
import { useAPISlotStore } from '../../../stores/APISlotStore';
import { MissionStep } from '../../../types';

interface UseMissionRunnerProps {
  draftMission: any;
  updateStep: (index: number, updates: Partial<MissionStep>) => void;
  showFeedback: (message: string) => void;
}

export const useMissionRunner = ({ draftMission, updateStep, showFeedback }: UseMissionRunnerProps) => {
  const { slots } = useAPISlotStore();
  const [isRunning, setIsRunning] = useState(false);

  const handleRunStep = async (index: number) => {
    const step = draftMission.steps[index];
    if (!step.mountedCapability) {
        showFeedback('⚠️ 该步骤未挂载能力');
        return;
    }

    try {
        setIsRunning(true);
        showFeedback(`⚡ 正在执行步骤 ${index + 1} (${step.mountedCapability.meta.name})...`);
        updateStep(index, { status: 'generating' }); // Update status to loading
        
        // 1. Data Relay (Upstream Data)
        let upstreamData: Record<string, any> = {};
        if (index > 0 && step.logicInheritance?.inheritFromPrevious) {
            const prevStep = draftMission.steps[index - 1];
            if (prevStep.outputResult?.type === 'text') {
                // 假设上游输出直接作为 user_prompt
                // TODO: 更复杂的 Mapping 逻辑可以放在这里
                upstreamData = { user_prompt: prevStep.outputResult.data };
                console.log(`[RELAY] 自动引用步骤 ${index} 输出:`, upstreamData);
            }
        }

        // 2. Build Payload
        const capability = step.mountedCapability;
        
        // 获取图片源 (如果有)
        let sourceImage = step.sourceImage;
        // 如果没有直接上传图片，尝试使用上游图片
        if (!sourceImage && index > 0 && step.logicInheritance?.inheritFromPrevious) {
             const prevStep = draftMission.steps[index - 1];
             if (prevStep.outputResult?.type === 'image') {
                 sourceImage = prevStep.outputResult.data;
             }
        }

        const buildResult = await PayloadBuilder.buildFromManifest(
            capability, 
            step.params || {}, 
            upstreamData,
            sourceImage
        );

        console.log('[RUNNER] Final Payload:', buildResult.payload);

        // 3. Find Auth Key
        const slot = slots.find(s => s.provider === capability.routing.provider_id);
        const authKey = slot?.authKey;
        // 注意：有些本地模型不需要 Key，或者 Key 在 Slot 配置里
        if (!authKey && capability.routing.provider_id !== 'Local') {
             console.warn(`[RUNNER] Warning: No auth key found for ${capability.routing.provider_id}`);
        }

        // 4. Execute
        const { sendRequest } = await import('../../../services/apiService');
        const result = await sendRequest({
            method: 'POST',
            url: buildResult.endpoint,
            body: buildResult.payload,
            outputType: buildResult.outputType
        }, authKey || '');

        console.log('[RUNNER] Result:', result);
        
        // 5. Process Result & Update Step
        let outputData: any = null;
        let outputType: any = 'text';
        const outputTypeCandidate = buildResult.outputType || capability.io_interface.output_type || 'text';

        if (outputTypeCandidate === 'audio') {
            outputType = 'audio';
            outputData = result?.audio 
                || result?.uri 
                || (result?.blob instanceof Blob ? URL.createObjectURL(result.blob) : null)
                || (result instanceof Blob ? URL.createObjectURL(result) : null)
                || (typeof result === 'string' ? result : null);
        } else if (outputTypeCandidate === 'image') {
            outputType = 'image';
            outputData = result?.images?.[0]?.url || result?.data?.[0]?.url || result?.url;
        } else if (outputTypeCandidate === 'json') {
            outputType = 'text';
            outputData = typeof result === 'string' ? result : JSON.stringify(result);
        } else {
            outputType = 'text';
            outputData = result?.choices?.[0]?.message?.content || result?.text || (typeof result === 'string' ? result : JSON.stringify(result));
        }

        if (!outputData) {
            throw new Error('无法解析 API 返回结果');
        }

        updateStep(index, {
            outputResult: {
                type: outputType,
                data: outputData,
                metadata: result
            },
            isCompleted: true,
            status: 'ready'
        });
        
        showFeedback('✅ 执行成功');

    } catch (err: any) {
        console.error(err);
        showFeedback(`❌ 执行失败: ${err.message}`);
        updateStep(index, { status: 'idle' }); // Reset status
    } finally {
        setIsRunning(false);
    }
  };

  return { handleRunStep, isRunning };
};
