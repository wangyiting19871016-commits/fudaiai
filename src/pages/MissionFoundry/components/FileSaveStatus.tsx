import React from 'react';

interface FileSaveStatusProps {
  step: any;
}

const FileSaveStatus: React.FC<FileSaveStatusProps> = ({ step }) => {
  return (
    <div style={{
      marginTop: 8,
      padding: 8,
      background: '#000',
      border: '1px solid #06b6d4',
      borderRadius: 4,
      fontSize: 10
    }}>
      <div style={{ marginBottom: 4, color: '#06b6d4', fontWeight: 'bold' }}>📁 保存成功</div>
      
      {/* 视频文件路径 */}
      {step.videoPath && (
        <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#666', fontSize: 9 }}>视频:</span>
          <span style={{ color: '#fff', fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {step.videoPath}
          </span>
          <button
            onClick={() => {
              // 打开所在文件夹
              const folderPath = step.videoPath.substring(0, step.videoPath.lastIndexOf('/'));
              console.log(`Opening folder: ${folderPath}`);
              // 在真实应用中，这会调用后端 API 来打开系统资源管理器
              alert(`打开文件夹: ${folderPath}`);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#06b6d4',
              fontSize: 9,
              cursor: 'pointer',
              padding: 0
            }}
          >
            打开所在文件夹
          </button>
        </div>
      )}
      
      {/* 音频文件路径 */}
      {step.audioPath && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#666', fontSize: 9 }}>音频:</span>
          <span style={{ color: '#fff', fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {step.audioPath}
          </span>
          <button
            onClick={() => {
              // 打开所在文件夹
              const folderPath = step.audioPath.substring(0, step.audioPath.lastIndexOf('/'));
              console.log(`Opening folder: ${folderPath}`);
              // 在真实应用中，这会调用后端 API 来打开系统资源管理器
              alert(`打开文件夹: ${folderPath}`);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#06b6d4',
              fontSize: 9,
              cursor: 'pointer',
              padding: 0
            }}
          >
            打开所在文件夹
          </button>
        </div>
      )}
    </div>
  );
};

export default FileSaveStatus;
