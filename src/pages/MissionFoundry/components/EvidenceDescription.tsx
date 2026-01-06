import React from 'react';

interface EvidenceDescriptionProps {
  step: any;
}

const EvidenceDescription: React.FC<EvidenceDescriptionProps> = ({ step }) => {
  return (
    step.evidence_desc && (
      <div style={{ 
        fontSize: 9, 
        color: '#f59e0b',
        lineHeight: 1.3,
        marginBottom: 8,
        padding: 6,
        background: '#000',
        borderLeft: '2px solid #f59e0b',
        borderRadius: 3,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical'
      }}>
        📷 预期效果：{step.evidence_desc}
      </div>
    )
  );
};

export default EvidenceDescription;
