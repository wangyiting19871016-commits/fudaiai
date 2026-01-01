import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Mission, AtomicSlot } from '../data/schema';
import { missions as initialMissions } from '../data/missions';

// 定义动作类型
type MissionAction = {
  type: 'OCCUPY_SLOT';
  missionId: string;
  slotId: string;
  solutionData: NonNullable<AtomicSlot['currentBenchmark']>;
} | {
  type: 'UPDATE_MISSIONS';
  missions: Mission[];
};

// 定义状态类型
type MissionState = {
  missions: Mission[];
};

// 初始状态
const initialState: MissionState = {
  missions: initialMissions,
};

// 定义 reducer
function missionReducer(state: MissionState, action: MissionAction): MissionState {
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
    case 'UPDATE_MISSIONS':
      return {
        ...state,
        missions: action.missions
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