import React from 'react';
import { Mic, CheckCircle, Monitor, Camera } from 'lucide-react';

interface ActionPanelProps {
  displayType: string;
  inputText: string;
  setInputText: (text: string) => void;
  isVerifying: boolean;
  isSuccess: boolean;
  handleVerify: () => void;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  displayType,
  inputText,
  setInputText,
  isVerifying,
  isSuccess,
  handleVerify
}) => {
  // TEXT 模式
  if (displayType === 'TEXT') {
    return (
      <div className="w-full">
        <textarea 
          value={inputText} 
          onChange={e => setInputText(e.target.value)}
          placeholder="请输入验证词..."
          disabled={isSuccess}
          className="w-full h-36 bg-gray-800 border border-gray-600 rounded-xl p-5 text-white text-lg outline-none resize-none placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button 
          onClick={handleVerify} 
          disabled={isSuccess || isVerifying}
          className={`w-full mt-5 p-4 border-none rounded-xl font-bold text-lg cursor-pointer transition-colors ${
            isSuccess 
              ? 'bg-green-600 text-white' 
              : isVerifying
              ? 'bg-yellow-600 text-white animate-pulse'
              : 'bg-white text-black hover:bg-gray-200'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSuccess ? 'VERIFIED' : isVerifying ? '验证中...' : '确认提交'}
        </button>
      </div>
    );
  }

  // VOICE 模式
  if (displayType === 'VOICE') {
    return (
      <div className="flex flex-col items-center">
        <div 
          onClick={!isSuccess && !isVerifying ? handleVerify : undefined}
          className={`w-36 h-36 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
            isSuccess 
              ? 'bg-green-600 border-green-600' 
              : isVerifying
              ? 'bg-yellow-600 border-yellow-600 animate-pulse'
              : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
          } border-4 ${(isSuccess || isVerifying) ? 'cursor-default' : 'cursor-pointer'}`}
        >
          {isSuccess ? (
            <CheckCircle size={60} className="text-white" />
          ) : isVerifying ? (
            <div className="animate-spin">
              <Mic size={50} className="text-white" />
            </div>
          ) : (
            <Mic size={50} className="text-gray-500" />
          )}
        </div>
        <p className="mt-7 text-lg text-gray-500">
          {isSuccess ? '声纹已锁定' : isVerifying ? '声纹识别中...' : '点击录音球 · 开始朗读'}
        </p>
      </div>
    );
  }

  // SCREEN 模式
  return (
    <div className="w-full text-center">
      <div className="w-full h-48 border-2 border-dashed border-gray-600 rounded-2xl flex items-center justify-center mb-7 bg-gray-900">
        {isSuccess ? (
          <CheckCircle size={48} className="text-green-500" />
        ) : isVerifying ? (
          <div className="animate-pulse">
            <Camera size={48} className="text-yellow-500" />
          </div>
        ) : (
          <Camera size={48} className="text-gray-600" />
        )}
      </div>
      <button 
        onClick={handleVerify}
        disabled={isSuccess || isVerifying}
        className={`px-10 py-4 border-none rounded-full text-lg font-bold cursor-pointer flex items-center gap-2.5 mx-auto transition-colors ${
          isSuccess 
            ? 'bg-green-600 text-white' 
            : isVerifying
            ? 'bg-yellow-600 text-white animate-pulse'
            : 'bg-cyan-600 text-white hover:bg-cyan-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isSuccess ? (
          <>
            <CheckCircle size={20}/> 已定格
          </>
        ) : isVerifying ? (
          <>
            <div className="animate-spin"><Monitor size={20}/></div> 调取中...
          </>
        ) : (
          <>
            <Monitor size={20}/> 调取屏幕流
          </>
        )}
      </button>
    </div>
  );
};