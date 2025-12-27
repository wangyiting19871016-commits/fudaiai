import React from 'react';
import { AtomicSlot } from '../../data/schema';

interface GhostSlotProps {
  slot: AtomicSlot;
  onFillBenchmark?: (slotId: string) => void;
}

export const GhostSlot: React.FC<GhostSlotProps> = ({ slot, onFillBenchmark }) => {
  const isGhostState = slot.currentBenchmark === null;

  return (
    <div 
      className={`ghost-slot ${isGhostState ? 'ghost-mode' : 'benchmark-mode'}`}
      style={{
        border: '2px solid #e0e0e0',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        backgroundColor: isGhostState ? '#f5f5f5' : '#ffffff',
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
        <div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>
            {slot.stepLabel}
          </div>
          <h3 style={{ fontSize: '18px', color: '#333', margin: 0 }}>
            {slot.title}
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isGhostState ? (
            <button
              onClick={() => onFillBenchmark?.(slot.id)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4a90e2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              填充槽位
            </button>
          ) : (
            <div style={{ fontSize: '14px', color: '#888' }}>
              由 {slot.currentBenchmark.author} 霸榜
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ fontSize: '14px', color: '#555', margin: '0 0 8px 0' }}>
          官方标准：
        </h4>
        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
          {slot.officialCriteria}
        </p>
      </div>

      <div>
        <h4 style={{ fontSize: '14px', color: '#555', margin: '0 0 8px 0' }}>
          视觉锚点：
        </h4>
        <div style={{
          width: '100%',
          height: '200px',
          backgroundColor: '#e0e0e0',
          borderRadius: '4px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#999',
          fontSize: '14px'
        }}>
          {isGhostState ? (
            <div>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>👻</div>
              <div>灰模态：等待填充</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>🏆</div>
              <div>霸榜态：已填充</div>
            </div>
          )}
        </div>
      </div>

      {slot.currentBenchmark && (
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
          <h4 style={{ fontSize: '14px', color: '#2c5aa0', margin: '0 0 8px 0' }}>
            霸榜者技巧：
          </h4>
          <p style={{ fontSize: '14px', color: '#3366cc', margin: 0 }}>
            {slot.currentBenchmark.tips}
          </p>
        </div>
      )}
    </div>
  );
};