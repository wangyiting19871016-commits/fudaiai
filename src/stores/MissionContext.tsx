import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Mission, AtomicSlot } from '../data/schema';
import { missions as initialMissions } from '../data/missions';
import { CapabilityManifest } from '../types/Protocol';

// 定义动作类型
type MissionAction = {
  type: 'OCCUPY_SLOT';
  missionId: string;
  slotId: string;
  solutionData: NonNullable<AtomicSlot['currentBenchmark']>;
} | {
  type: 'MOUNT_CAPABILITY';
  missionId: string;
  slotId: string;
  capability: CapabilityManifest;
} | {
  type: 'UPDATE_MISSIONS';
  missions: Mission[];
} | {
  type: 'UPDATE_PROTOCOL';
  protocol: any;
};

// 定义状态类型
type MissionState = {
  missions: Mission[];
  protocol: any | null;
};

// 从localStorage读取初始状态
const loadInitialState = (): MissionState => {
  try {
    const savedMission = localStorage.getItem('current_mission_draft');
    if (savedMission && savedMission.trim()) {
      const parsed = JSON.parse(savedMission);
      return {
        missions: parsed.missions || initialMissions,
        protocol: parsed.protocol || null,
      };
    }
  } catch (error) {
    console.error('Failed to load mission from localStorage, clearing invalid cache:', error);
    // 清除无效的localStorage缓存
    localStorage.removeItem('current_mission_draft');
  }
  return {
    missions: initialMissions,
    protocol: null,
  };
};

// 初始状态
const initialState: MissionState = loadInitialState();

// 定义 reducer
function missionReducer(state: MissionState, action: MissionAction): MissionState {
  // 日志：输出Context更新，包含payload
  console.log('[CONTEXT_UPDATE]', { type: action.type, payload: action });
  
  switch (action.type) {
    case 'OCCUPY_SLOT':
      return {
        ...state,
        missions: state.missions.map(mission => {
          if (mission.id === action.missionId) {
            return {
              ...mission,
              slots: mission.slots.map(slot => {
                if (slot.id === action.slotId) {
                  return {
                    ...slot,
                    currentBenchmark: action.solutionData
                  };
                }
                return slot;
              })
            };
          }
          return mission;
        })
      };
    case 'MOUNT_CAPABILITY':
      return {
        ...state,
        missions: state.missions.map(mission => {
          if (mission.id === action.missionId) {
            return {
              ...mission,
              slots: mission.slots.map(slot => {
                if (slot.id === action.slotId) {
                  return {
                    ...slot,
                    mountedCapability: action.capability,
                    // 同时初始化验证数据结构
                    verificationData: {
                        endpoint: action.capability.routing.endpoint,
                        model_id: action.capability.routing.model_id,
                        io_schema: {
                            inputType: (action.capability.io_interface.input_slots[0]?.type === 'any' ? 'text' : action.capability.io_interface.input_slots[0]?.type) || 'text',
                            outputType: action.capability.io_interface.output_type as any
                        },
                        params_schema: action.capability.parameter_config.dynamic as any,
                        verified_params: action.capability.parameter_config.frozen
                    }
                  };
                }
                return slot;
              })
            };
          }
          return mission;
        })
      };
    case 'UPDATE_MISSIONS':
      return {
        ...state,
        missions: action.missions
      };
    case 'UPDATE_PROTOCOL':
      return {
        ...state,
        protocol: action.protocol
      };
    default:
      return state;
  }
}

// 创建 Context
const MissionContext = createContext<{
  state: MissionState;
  dispatch: React.Dispatch<MissionAction>;
}>({
  state: initialState,
  dispatch: () => {},
});

// 创建 Provider 组件
export function MissionProvider({ children, formData }: { children: ReactNode; formData?: any }) {
  const [state, dispatch] = useReducer(missionReducer, initialState);

  // 当 formData 变化时，更新 missions
  useEffect(() => {
    if (formData) {
      // 如果 formData 是单个任务，转换为数组
      const missions: Mission[] = Array.isArray(formData) ? formData : [formData as Mission];
      dispatch({ type: 'UPDATE_MISSIONS', missions });
    }
  }, [formData]);

  // 当 state 变化时，自动保存到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem('current_mission_draft', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save mission to localStorage:', error);
    }
  }, [state]);

  return (
    <MissionContext.Provider value={{ state, dispatch }}>
      {children}
    </MissionContext.Provider>
  );
}

// 创建自定义 Hook
export function useMissionContext() {
  return useContext(MissionContext);
}

// 定义 action creator
export function mountCapability(
  missionId: string,
  slotId: string,
  capability: CapabilityManifest
): MissionAction {
  return {
    type: 'MOUNT_CAPABILITY',
    missionId,
    slotId,
    capability
  };
}
export function occupySlot(
  missionId: string,
  slotId: string,
  solutionData: NonNullable<AtomicSlot['currentBenchmark']>
): MissionAction {
  return {
    type: 'OCCUPY_SLOT',
    missionId,
    slotId,
    solutionData
  };
}