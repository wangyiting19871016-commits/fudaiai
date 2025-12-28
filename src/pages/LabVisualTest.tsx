import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, Activity } from 'lucide-react';

const LabVisualTest = () => {
  const navigate = useNavigate();
  // 假数据用于视觉展示
  const step = {
    id: '02',
    title: '声韵刻录 · 频率共振',
    type: 'VOICE',
    desc: '请调动你的横膈膜，用腹式呼吸朗读屏幕中央的关键句。注意：AI 将捕捉你的声纹颤动频率。',
    key: 'Can I get a Latte?'
  };

  return (
    <div className="flex h-screen w-full bg-[#030303] text-white overflow-hidden font-sans relative">
      
      {/* 1. 背景层 */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* 2. 顶部导航 */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
          <div className="p-2 rounded-full border border-gray-800 bg-black/50 backdrop-blur group-hover:border-cyan-500">
            <ArrowLeft size={18} />
          </div>
          <span className="text-xs font-mono tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">RETURN BASE</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-mono text-cyan-500">SYSTEM.ONLINE</span>
        </div>
      </div>

      {/* 3. 左舱：信息展示 */}
      <div className="w-[45%] h-full flex flex-col justify-center px-12 relative z-10 border-r border-white/5 bg-gradient-to-b from-black/0 via-black/30 to-black/0">
        <div className="flex items-center gap-3 mb-6">
          <span className="px-2 py-0.5 rounded-sm bg-cyan-950/30 border border-cyan-900/50 text-cyan-400 text-[10px] font-mono tracking-widest">
            PROTOCOL {step.id}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 tracking-wider">
            <Activity size={12} /> {step.type} MODE
          </span>
        </div>

        <h1 className="text-4xl font-black text-white mb-6 leading-tight">
          {step.title}
        </h1>

        <div className="relative pl-6 border-l border-gray-800">
          <p className="text-base text-gray-400 leading-relaxed font-light">
            {step.desc}
          </p>
          <div className="absolute left-[-1px] top-0 h-6 w-[2px] bg-cyan-500"></div>
        </div>

        <div className="mt-10 flex gap-8 opacity-60">
          <div className="text-[10px] text-gray-600 font-mono">
            <p className="mb-1">SIGNAL</p>
            <div className="flex gap-1">
              <div className="w-1 h-2 bg-cyan-500"></div>
              <div className="w-1 h-2 bg-cyan-500"></div>
              <div className="w-1 h-2 bg-cyan-500"></div>
              <div className="w-1 h-2 bg-gray-800"></div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 右舱：交互展示 */}
      <div className="w-[55%] h-full relative flex flex-col items-center justify-center bg-black">
        {/* 网格背景 */}
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        <div className="relative z-20 flex flex-col items-center">
            {/* 录音球 */}
            <div className="group relative w-40 h-40 cursor-pointer">
                <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-xl group-hover:bg-cyan-400/20 transition-all duration-500"></div>
                <div className="absolute inset-0 rounded-full border border-cyan-500/20 group-hover:scale-110 transition-transform duration-500"></div>
                <div className="absolute inset-2 rounded-full bg-black border border-gray-700 flex items-center justify-center group-hover:border-cyan-400 transition-colors duration-300">
                    <Mic size={40} className="text-gray-400 group-hover:text-cyan-400" />
                </div>
            </div>

            <div className="mt-10 text-center space-y-3">
                <p className="text-xs font-mono text-gray-600 tracking-widest">TARGET PHRASE</p>
                <h2 className="text-2xl font-bold text-white tracking-wide">"{step.key}"</h2>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LabVisualTest;