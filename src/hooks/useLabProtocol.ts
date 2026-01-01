import { useState, useEffect } from 'react';
import { useMissionContext } from '../stores/MissionContext';

// Define the Lab Protocol data structure
type LabProtocol = {
  title: string;
  material: string;
  asset: {
    url: string;
  };
  instruction: string;
  type: string;
  key: string;
};

// Standard test data set
const TRACE_TEST_DATA: LabProtocol = {
  title: "真迹点火：贪食蛇实验",
  material: "<html><body><h1>贪食蛇游戏</h1><p>这是一个简单的贪食蛇游戏示例</p></body></html>",
  asset: {
    url: ""
  },
  instruction: "请参考左侧视频，修改代码实现贪食蛇游戏。使用方向键控制蛇的移动，吃到红色食物得分。",
  type: "TEXT",
  key: "贪吃蛇"
};

export const useLabProtocol = (stepId: string | undefined) => {
  const [protocol, setProtocol] = useState<LabProtocol>(TRACE_TEST_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const { state: missionState } = useMissionContext();

  const loadProtocolData = () => {
    try {
      setIsLoading(true);
      
      // Get data from localStorage first
      const p4SyncData = localStorage.getItem('P4_SYNC_DATA');
      const p4MissionData = localStorage.getItem('p4MissionData');
      const customMissions = localStorage.getItem('custom_missions');
      const activeMission = localStorage.getItem('activeMission');
      
      let parsedData: any = null;
      
      // Try to get data from various sources
      if (p4SyncData) {
        parsedData = JSON.parse(p4SyncData);
      } else if (p4MissionData) {
        parsedData = JSON.parse(p4MissionData);
      } else if (customMissions) {
        const missions = JSON.parse(customMissions);
        parsedData = stepId ? missions.find((m: any) => String(m.id) === String(stepId)) : missions[0];
      } else if (activeMission) {
        parsedData = JSON.parse(activeMission);
      } 
      // Then try to get from context
      else if (missionState.missions && missionState.missions.length > 0) {
        parsedData = missionState.missions[0];
      }
      
      if (parsedData) {
        setProtocol({
          title: parsedData.title || TRACE_TEST_DATA.title,
          material: parsedData.material || TRACE_TEST_DATA.material,
          asset: {
            url: parsedData.asset?.url || parsedData.mediaUrl || TRACE_TEST_DATA.asset.url
          },
          instruction: parsedData.instruction || parsedData.desc || TRACE_TEST_DATA.instruction,
          type: parsedData.type || TRACE_TEST_DATA.type,
          key: parsedData.key || TRACE_TEST_DATA.key
        });
      } 
      // Fallback to test data
      else {
        setProtocol(TRACE_TEST_DATA);
      }
    } catch (error) {
      console.error('Failed to load lab protocol:', error);
      // Use test data on error
      setProtocol(TRACE_TEST_DATA);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data initially
  useEffect(() => {
    loadProtocolData();
  }, [missionState.missions, stepId]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (['P4_SYNC_DATA', 'p4MissionData', 'custom_missions', 'activeMission'].includes(event.key || '')) {
        loadProtocolData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [stepId]);

  return {
    protocol,
    isLoading,
    reloadProtocol: loadProtocolData
  };
};
