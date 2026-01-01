// 后端模拟服务，用于处理目录浏览和路径验证

// 模拟磁盘列表
const mockDisks = ['C:', 'D:', 'F:'];

// 模拟文件夹结构
const mockFolderStructure: Record<string, string[]> = {
  'C:': ['Users', 'Program Files', 'Windows'],
  'D:': ['Games', 'Movies', 'Music'],
  'F:': ['Truth', 'Projects', 'Backup'],
  'F:/Truth': ['raw', 'audio', 'slices'],
  'F:/Projects': ['Project1', 'Project2', 'Project3'],
  'F:/Backup': ['2025', '2026'],
  'F:/Truth/raw': [],
  'F:/Truth/audio': [],
  'F:/Truth/slices': []
};

// 模拟项目配置文件内容
const projectConfigFile = {
  projectName: 'Truth Project',
  createdAt: new Date().toISOString(),
  version: '1.0.0',
  rootPath: '',
  structure: {
    raw: '原始媒体文件',
    audio: '音频文件',
    slices: '切片视频文件'
  }
};

// 模拟目录浏览API
export const listDirs = async (path: string = ''): Promise<{ disks?: string[]; folders?: string[]; error?: string }> => {
  try {
    // 如果没有路径，返回磁盘列表
    if (!path) {
      return { disks: mockDisks };
    }

    // 检查路径是否存在于模拟结构中
    if (!mockFolderStructure[path]) {
      // 模拟创建不存在的文件夹路径
      mockFolderStructure[path] = [];
    }

    return { folders: mockFolderStructure[path] };
  } catch (error) {
    return { error: '目录浏览失败' };
  }
};

// 模拟路径验证API
export const validatePath = async (path: string): Promise<{ success: boolean; error?: string; filePath?: string }> => {
  try {
    // 确保路径以F:开头
    if (!path.startsWith('F:')) {
      return { success: false, error: '路径必须以F:开头' };
    }

    // 模拟创建项目配置文件
    const configFilePath = `${path}/__TRUTH_P4_PROJECT__.json`;
    const configContent = { ...projectConfigFile, rootPath: path };
    
    // 模拟文件写入成功
    console.log('项目配置文件已创建:', configFilePath);
    console.log('配置内容:', configContent);
    
    // 保存到localStorage，模拟文件系统
    localStorage.setItem('truth_project_config', JSON.stringify(configContent));
    localStorage.setItem('truth_project_path', path);
    
    return { success: true, filePath: configFilePath };
  } catch (error) {
    return { success: false, error: '路径验证失败' };
  }
};

// 模拟获取当前项目路径
export const getCurrentProjectPath = (): string | null => {
  return localStorage.getItem('truth_project_path');
};

// 模拟获取项目配置
export const getProjectConfig = (): any => {
  const config = localStorage.getItem('truth_project_config');
  return config ? JSON.parse(config) : null;
};

// 模拟创建测试文件
export const createTestFile = async (path: string): Promise<boolean> => {
  try {
    // 模拟创建测试文件
    const testFilePath = `${path}/test.tmp`;
    console.log('测试文件已创建:', testFilePath);
    return true;
  } catch (error) {
    return false;
  }
};
