import { useState, useEffect } from 'react';

// 定义Lab数据类型
type LabData = {
  title: string;
  material: string;
  type?: string;
  asset?: {
    url: string;
  };
  mediaUrl?: string;
  instruction?: string;
};

export const useLabData = (stepId: string | undefined) => {
  const [labData, setLabData] = useState<LabData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 从localStorage加载数据
  const loadData = () => {
    try {
      setIsLoading(true);
      setError(null);

      // 只读取 P4_SYNC_DATA
      const rawP4Data = localStorage.getItem('P4_SYNC_DATA');
      let parsedData: any = null;

      // 只使用 P4_SYNC_DATA
      if (rawP4Data) {
        parsedData = JSON.parse(rawP4Data);
      }

      if (parsedData) {
        // 适配不同的数据结构
        const normalizedData: LabData = {
          title: parsedData.title || '未命名任务',
          material: parsedData.material || parsedData.rawMaterial || parsedData.content || '',
          asset: parsedData.asset || { url: parsedData.mediaUrl || parsedData.source_url || '' },
          instruction: parsedData.instruction || parsedData.desc || ''
        };
        setLabData(normalizedData);
      } else {
        setError('ERROR: NO SOURCE DATA FOUND IN ANY KEY');
        // 使用默认数据作为最后的保底
        setLabData({
          title: '默认任务',
          material: 'ERROR: NO SOURCE DATA FOUND IN ANY KEY',
          asset: { url: '' }
        });
      }
    } catch (err) {
      setError('数据加载失败：' + (err as Error).message);
      console.error('Lab数据加载失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载数据
  useEffect(() => {
    loadData();
  }, [stepId]);

  // 监听localStorage变化
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (['P4_SYNC_DATA', 'p4MissionData', 'custom_missions', 'activeMission'].includes(event.key || '')) {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 强制注入数据的方法
  const injectData = (data: Partial<LabData>) => {
    try {
      const mockData: LabData = {
        title: data.title || '真迹点火：贪食蛇实验',
        material: data.material || '<html><body><h1>数据已注入</h1></body></html>',
        asset: data.asset || { url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
        instruction: data.instruction || '数据已成功注入'
      };
      localStorage.setItem('P4_SYNC_DATA', JSON.stringify(mockData));
      console.log('发布成功');
      // 不刷新页面，只重新加载数据
      loadData();
    } catch (error) {
      console.error('发布失败:', error);
    }
  };

  return {
    labData,
    isLoading,
    error,
    reloadData: loadData,
    injectData
  };
};
