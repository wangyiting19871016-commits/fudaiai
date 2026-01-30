import React, { useState, useRef } from 'react';
import { Play } from 'lucide-react';

interface CodeRunnerProps {
  initialCode: string;
  instruction: string;
}

const CodeRunner: React.FC<CodeRunnerProps> = ({ initialCode, instruction }) => {
  const [code, setCode] = useState(initialCode || '');
  const [isRunning, setIsRunning] = useState(false);
  const [sandboxKey, setSandboxKey] = useState(0);
  const runnerIframeRef = useRef<HTMLIFrameElement>(null);

  const handleRunCode = () => {
    if (!code.trim()) {
      alert('代码不能为空，请先编辑代码');
      return;
    }

    setIsRunning(true);
    setSandboxKey(prev => prev + 1);
  };

  return (
    <div style={{ flex: 0.5, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ color: '#ffff00', fontWeight: 'bold', fontFamily: 'monospace' }}>💡 {instruction || '请参考左侧素材，修改代码。'}</div>
      <textarea 
        style={{ 
          flex: 1, 
          backgroundColor: '#000000', 
          color: '#a3a3a3', 
          fontFamily: 'monospace', 
          padding: '12px', 
          border: 'none',
          resize: 'none'
        }} 
        value={code} 
        onChange={(e) => setCode(e.target.value)} 
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button 
          onClick={handleRunCode} 
          style={{ 
            backgroundColor: '#a3a3a3', 
            color: '#ffffff', 
            padding: '8px 16px', 
            border: 'none', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            fontFamily: 'monospace',
            borderRadius: '0'
          }}
        >
          <Play size={16} /> 运行
        </button>
      </div>
      
      {/* 沙盒预览窗口 */}
      {isRunning && (
        <div style={{ height: '200px', backgroundColor: '#ffffff', border: '1px solid #333' }}>
          <iframe 
            key={sandboxKey} 
            srcDoc={code} 
            style={{ width: '100%', height: '100%', border: 'none' }} 
            sandbox="allow-scripts allow-modals"
          />
        </div>
      )}
    </div>
  );
};

export default CodeRunner;
