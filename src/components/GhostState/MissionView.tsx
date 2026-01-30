import React from 'react';
import { Mission } from '../../data/schema';
import { GhostSlot } from './GhostSlot';

interface MissionViewProps {
  mission: Mission;
  onFillBenchmark?: (slotId: string) => void;
}

export const MissionView: React.FC<MissionViewProps> = ({ mission, onFillBenchmark }) => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h2 style={{ fontSize: '28px', color: '#333', margin: 0 }}>
            {mission.title}
          </h2>
          <div style={{ 
            padding: '6px 12px', 
            backgroundColor: mission.difficulty === 'Easy' ? '#a3a3a3' : mission.difficulty === 'Hard' ? '#ff9800' : '#f44336',
            color: 'white',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            {mission.difficulty}
          </div>
        </div>
        <p style={{ fontSize: '16px', color: '#666', lineHeight: '1.6' }}>
          {mission.description}
        </p>
      </div>

      <div>
        <h3 style={{ fontSize: '20px', color: '#444', margin: '0 0 20px 0' }}>
          原子槽位 ({mission.slots.length} 个)
        </h3>
        {mission.slots.map((slot) => (
          <GhostSlot
            key={slot.id}
            slot={slot}
            onFillBenchmark={onFillBenchmark}
          />
        ))}
      </div>
    </div>
  );
};