import React from 'react';

interface InstructionSectionProps {
  displayType: string;
  missionTitle: string;
  missionDescription?: string;
  missionInstruction?: string;
}

export const InstructionSection: React.FC<InstructionSectionProps> = ({
  displayType,
  missionTitle,
  missionDescription,
  missionInstruction
}) => {
  return (
    <div className="flex-1 p-10 overflow-y-auto bg-gray-950">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="px-2 py-1 border border-gray-600 rounded text-xs text-gray-200">PROTOCOL</span>
        <span className="text-xs font-bold text-gray-500">{displayType} MODE</span>
      </div>
      <h1 className="text-3xl font-bold mb-5 leading-tight">{missionTitle}</h1>
      <p className="text-lg text-gray-400 leading-relaxed">{missionDescription || missionInstruction}</p>
    </div>
  );
};
