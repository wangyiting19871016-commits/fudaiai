import React from 'react';
import { Monitor } from 'lucide-react';

interface VideoSectionProps {
  missionId: string | number;
}

export const VideoSection: React.FC<VideoSectionProps> = ({ missionId }) => {
  return (
    <div className="h-[65%] bg-gray-900 flex items-center justify-center relative">
      <div className="text-center opacity-50">
        <Monitor size={64} className="block mx-auto mb-2.5 text-cyan-500" />
        <span className="font-mono tracking-wider text-cyan-500">SIGNAL: {missionId}</span>
      </div>
    </div>
  );
};