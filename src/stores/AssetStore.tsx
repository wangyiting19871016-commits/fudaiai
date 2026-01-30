import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 定义资产类型
export interface Asset {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'audio' | 'video';
  size: number;
  createdAt: string;
}

// 定义AssetStore上下文类型
interface AssetStoreContextType {
  assets: Asset[];
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt'>) => Asset;
  removeAsset: (id: string) => void;
  getAsset: (id: string) => Asset | undefined;
}

// 创建上下文
const AssetStoreContext = createContext<AssetStoreContextType | undefined>(undefined);

// 从localStorage加载资产
export const loadAssetsFromStorage = (): Asset[] => {
  try {
    const savedAssets = localStorage.getItem('global_assets');
    return savedAssets ? JSON.parse(savedAssets) : [];
  } catch (error) {
    console.error('Failed to load assets from localStorage:', error);
    return [];
  }
};

// 保存资产到localStorage
export const saveAssetsToStorage = (assets: Asset[]): void => {
  try {
    localStorage.setItem('global_assets', JSON.stringify(assets));
  } catch (error) {
    console.error('Failed to save assets to localStorage:', error);
  }
};

// AssetStore提供者组件
export const AssetProvider = ({ children }: { children: ReactNode }) => {
  const [assets, setAssets] = useState<Asset[]>(loadAssetsFromStorage);

  // 当assets变化时，保存到localStorage
  useEffect(() => {
    saveAssetsToStorage(assets);
  }, [assets]);

  // 添加资产
  const addAsset = (asset: Omit<Asset, 'id' | 'createdAt'>) => {
    const newAsset: Asset = {
      ...asset,
      id: `asset_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setAssets(prev => [...prev, newAsset]);
    return newAsset;
  };

  // 移除资产
  const removeAsset = (id: string) => {
    setAssets(prev => prev.filter(asset => asset.id !== id));
  };

  // 获取资产
  const getAsset = (id: string) => {
    return assets.find(asset => asset.id === id);
  };

  return (
    <AssetStoreContext.Provider value={{ assets, addAsset, removeAsset, getAsset }}>
      {children}
    </AssetStoreContext.Provider>
  );
};

// 自定义钩子，用于访问AssetStore
export const useAssetStore = () => {
  const context = useContext(AssetStoreContext);
  if (context === undefined) {
    throw new Error('useAssetStore must be used within an AssetProvider');
  }
  return context;
};
