import { useState, useEffect, useCallback } from 'react';

// 状态机状态定义
export type FlowState = 'idle' | 'verifying' | 'success' | 'next';

// Hook 参数接口
export interface UseAutoFlowParams {
  missionTitle?: string;
  onSuccess?: () => void;
  onNext?: () => void;
  delay?: number;
}

// Hook 返回接口
export interface UseAutoFlowResult {
  flowState: FlowState;
  isVerifying: boolean;
  isSuccess: boolean;
  isNext: boolean;
  startVerification: () => void;
  resetFlow: () => void;
  completeVerification: () => void;
}

/**
 * 自动流转状态机 Hook
 * 管理 idle -> verifying -> success -> next 的状态流转
 */
export const useAutoFlow = ({
  missionTitle = '',
  onSuccess,
  onNext,
  delay = 1000
}: UseAutoFlowParams = {}): UseAutoFlowResult => {
  const [flowState, setFlowState] = useState<FlowState>('idle');

  // 状态便捷访问器
  const isVerifying = flowState === 'verifying';
  const isSuccess = flowState === 'success';
  const isNext = flowState === 'next';

  // 开始验证
  const startVerification = useCallback(() => {
    setFlowState('verifying');
  }, []);

  // 完成验证
  const completeVerification = useCallback(() => {
    setFlowState('success');
  }, []);

  // 重置状态
  const resetFlow = useCallback(() => {
    setFlowState('idle');
  }, []);

  // 状态流转逻辑
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    switch (flowState) {
      case 'success':
        // 成功状态后延迟进入下一步
        timer = setTimeout(() => {
          const shouldProceed = window.confirm(`[${missionTitle}] 验证通过！返回基地？`);
          if (shouldProceed) {
            setFlowState('next');
            onNext?.();
          } else {
            setFlowState('idle');
          }
        }, delay);
        break;

      case 'next':
        // 下一步状态回调
        onNext?.();
        break;

      default:
        break;
    }

    return () => {
      if (timer) clearTimeout(timer as unknown as number);
    };
  }, [flowState, missionTitle, delay, onNext]);

  // 成功状态回调
  useEffect(() => {
    if (flowState === 'success') {
      onSuccess?.();
    }
  }, [flowState, onSuccess]);

  return {
    flowState,
    isVerifying,
    isSuccess,
    isNext,
    startVerification,
    resetFlow,
    completeVerification
  };
};