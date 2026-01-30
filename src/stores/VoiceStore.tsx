import React, { createContext, useContext, useReducer, useEffect } from 'react';

// 我的音色数据结构
export interface MyVoice {
  id: string;           // Fish Audio 返回的 _id (即 reference_id)
  title: string;        // 用户设置的名称
  createdAt: number;    // 创建时间戳
  state: 'created' | 'training' | 'trained' | 'failed';
}

// 存储 Key
const MY_VOICES_KEY = 'fish_audio_my_voices';

// State
interface VoiceState {
  voices: MyVoice[];
  isLoading: boolean;
}

// Actions
type VoiceAction =
  | { type: 'LOAD_VOICES'; voices: MyVoice[] }
  | { type: 'ADD_VOICE'; voice: MyVoice }
  | { type: 'UPDATE_VOICE'; id: string; updates: Partial<MyVoice> }
  | { type: 'REMOVE_VOICE'; id: string }
  | { type: 'SET_LOADING'; isLoading: boolean };

// Reducer
function voiceReducer(state: VoiceState, action: VoiceAction): VoiceState {
  switch (action.type) {
    case 'LOAD_VOICES':
      return { ...state, voices: action.voices, isLoading: false };
    case 'ADD_VOICE':
      return { ...state, voices: [...state.voices, action.voice] };
    case 'UPDATE_VOICE':
      return {
        ...state,
        voices: state.voices.map(v =>
          v.id === action.id ? { ...v, ...action.updates } : v
        )
      };
    case 'REMOVE_VOICE':
      return {
        ...state,
        voices: state.voices.filter(v => v.id !== action.id)
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    default:
      return state;
  }
}

// Context
interface VoiceContextValue {
  state: VoiceState;
  addVoice: (voice: MyVoice) => void;
  updateVoice: (id: string, updates: Partial<MyVoice>) => void;
  removeVoice: (id: string) => void;
}

const VoiceContext = createContext<VoiceContextValue | null>(null);

// Provider
export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(voiceReducer, {
    voices: [],
    isLoading: true
  });

  // 从 localStorage 加载
  useEffect(() => {
    try {
      const saved = localStorage.getItem(MY_VOICES_KEY);
      if (saved) {
        const voices = JSON.parse(saved) as MyVoice[];
        dispatch({ type: 'LOAD_VOICES', voices });
      } else {
        dispatch({ type: 'SET_LOADING', isLoading: false });
      }
    } catch (e) {
      console.error('Failed to load voices from localStorage:', e);
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }, []);

  // 保存到 localStorage
  useEffect(() => {
    if (!state.isLoading) {
      localStorage.setItem(MY_VOICES_KEY, JSON.stringify(state.voices));
    }
  }, [state.voices, state.isLoading]);

  const addVoice = (voice: MyVoice) => {
    dispatch({ type: 'ADD_VOICE', voice });
  };

  const updateVoice = (id: string, updates: Partial<MyVoice>) => {
    dispatch({ type: 'UPDATE_VOICE', id, updates });
  };

  const removeVoice = (id: string) => {
    dispatch({ type: 'REMOVE_VOICE', id });
  };

  return (
    <VoiceContext.Provider value={{ state, addVoice, updateVoice, removeVoice }}>
      {children}
    </VoiceContext.Provider>
  );
};

// Hook
export const useVoiceStore = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoiceStore must be used within a VoiceProvider');
  }
  return context;
};
