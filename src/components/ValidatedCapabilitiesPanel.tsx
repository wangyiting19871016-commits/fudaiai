import React, { useState } from 'react';
import { useAPISlotStore } from '../stores/APISlotStore';
import { Recipe } from '../types/APISlot';

interface ValidatedCapabilitiesPanelProps {
  className?: string;
  onRecipeSelect?: (recipe: Recipe) => void;
}

const ValidatedCapabilitiesPanel: React.FC<ValidatedCapabilitiesPanelProps> = ({ 
  className = '', 
  onRecipeSelect 
}) => {
  const { recipes, deleteRecipe } = useAPISlotStore();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div 
      className={className} 
      style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '8px',
        marginBottom: '20px',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}
    >
      {/* 面板标题栏 */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          backgroundColor: '#222',
          cursor: 'pointer',
          borderBottom: isOpen ? '1px solid #333' : 'none'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#a3a3a3',
          fontWeight: 'bold',
          fontSize: '16px'
        }}>
          📚 已验证能力库 (Validated Capabilities)
        </div>
        <div style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease',
          color: '#666'
        }}>
          ▼
        </div>
      </div>

      {/* 面板内容 */}
      {isOpen && (
        <div style={{ padding: '16px' }}>
          {recipes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recipes.map((recipe) => (
                <div 
                  key={recipe.id}
                  style={{
                    backgroundColor: '#222',
                    borderRadius: '6px',
                    border: '1px solid #333',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onClick={() => onRecipeSelect && onRecipeSelect(recipe)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#a3a3a3';
                    e.currentTarget.style.backgroundColor = '#2a2a2a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#333';
                    e.currentTarget.style.backgroundColor = '#222';
                  }}
                >
                  {/* Recipe Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>
                      {recipe.name}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: '#666',
                      backgroundColor: '#111',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {new Date(recipe.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Model Info */}
                  <div style={{
                    fontSize: '12px',
                    color: '#aaa',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{ color: '#a3a3a3' }}>⚡</span>
                    {recipe.modelId}
                  </div>

                  {/* Description */}
                  {recipe.description && (
                    <div style={{
                      fontSize: '12px',
                      color: '#666',
                      fontStyle: 'italic',
                      marginBottom: '8px'
                    }}>
                      {recipe.description}
                    </div>
                  )}

                  {/* Parameters Preview */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px'
                  }}>
                    {Object.keys(recipe.parameters).slice(0, 3).map(key => (
                      <span key={key} style={{
                        fontSize: '10px',
                        color: '#888',
                        backgroundColor: '#1a1a1a',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid #333'
                      }}>
                        {key}
                      </span>
                    ))}
                    {Object.keys(recipe.parameters).length > 3 && (
                      <span style={{
                        fontSize: '10px',
                        color: '#666',
                        padding: '2px'
                      }}>
                        +{Object.keys(recipe.parameters).length - 3}
                      </span>
                    )}
                  </div>
                  
                  {/* Delete Button (Optional) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this recipe?')) {
                        deleteRecipe(recipe.id);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'none',
                      border: 'none',
                      color: '#444',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '4px'
                    }}
                    title="Delete Recipe"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              color: '#666',
              fontSize: '14px',
              padding: '20px 0',
              border: '1px dashed #333',
              borderRadius: '6px'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📭</div>
              暂无已验证能力
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#444' }}>
                请前往 P4LAB (实验室) <br/> 验证并生成配方
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ValidatedCapabilitiesPanel;
