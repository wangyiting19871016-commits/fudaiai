import React from 'react';

interface PhysicalInstructionProps {
  step: any;
  onInstructionChange: (instruction: string) => void;
}

const PhysicalInstruction: React.FC<PhysicalInstructionProps> = ({ step, onInstructionChange }) => {
  return (
    <div style={{ 
      marginBottom: 8
    }}>
      {/* 物理指令 - 无边框 Textarea */}
      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 8 }}>
        <span style={{ 
          fontSize: 9, 
          color: '#666', 
          marginBottom: 2,
          display: 'block' 
        }}>
          物理指令
        </span>
        <textarea 
          value={step.action_instruction || step.desc || ''} 
          onChange={(e) => onInstructionChange(e.target.value)}
          style={{
            width: '100%',
            padding: 6,
            background: 'transparent',
            border: 'none',
            borderRadius: 3,
            color: '#fff',
            minHeight: 50,
            maxHeight: 80,
            resize: 'vertical',
            fontSize: 10,
            lineHeight: 1.3,
            overflow: 'hidden',
            outline: 'none'
          }} 
          placeholder="物理操作指令"
          onClick={(e) => e.stopPropagation()}
          onBlur={() => {
            const instruction = step.action_instruction || step.desc || '';
            onInstructionChange(instruction);
          }}
          onInput={(e) => {
            const textarea = e.target as HTMLTextAreaElement;
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
          }}
        />
      </div>
    </div>
  );
};

export default PhysicalInstruction;
