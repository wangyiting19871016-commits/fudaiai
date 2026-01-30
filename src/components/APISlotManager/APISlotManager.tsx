import React, { useState } from 'react';
import { useAPISlot } from '../../stores/APISlotStore';
import { APISlot } from '../../types/APISlot';
import { sendRequest } from '../../services/apiService';

// 简单的图标组件
const Icons = {
  Add: () => <span>➕</span>,
  Edit: () => <span>✏️</span>,
  Delete: () => <span>🗑️</span>,
  Check: () => <span>✅</span>,
  Error: () => <span>❌</span>,
  Loading: () => <span>⏳</span>,
};

export const APISlotManager: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { state, dispatch } = useAPISlot();
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(state.slots[0]?.id || null);
  const [isEditing, setIsEditing] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testMsg, setTestMsg] = useState('');

  // 选中的插槽数据
  const selectedSlot = state.slots.find(s => s.id === selectedSlotId);

  // 临时编辑状态
  const [editForm, setEditForm] = useState<Partial<APISlot>>({});

  const isLiblibSlot = (slot: Partial<APISlot> | undefined) => {
    if (!slot) return false;
    const baseUrl = String(slot.baseUrl || '');
    const id = String((slot as any).id || selectedSlotId || '');
    if (baseUrl.includes('/api/liblib')) return true;
    if (baseUrl.includes('openapi.liblibai.cloud')) return true;
    if (id.includes('liblib')) return true;
    if ((slot.models || []).some(m => String(m).startsWith('liblib'))) return true;
    return false;
  };

  const handleSelectSlot = (id: string) => {
    setSelectedSlotId(id);
    setTestStatus('idle');
    setTestMsg('');
    const slot = state.slots.find(s => s.id === id);
    if (slot) {
      setEditForm({ ...slot });
    }
  };

  const handleAddSlot = () => {
    const newSlot: APISlot = {
      id: `custom-${Date.now()}`,
      name: 'New Custom API',
      provider: 'Custom',
      baseUrl: 'https://api.example.com/v1',
      authType: 'Bearer',
      authKey: '',
      models: [],
      isPreset: false
    };
    dispatch({ type: 'ADD_SLOT', slot: newSlot });
    handleSelectSlot(newSlot.id);
  };

  const handleSave = () => {
    if (selectedSlotId && editForm) {
      dispatch({ type: 'UPDATE_SLOT', id: selectedSlotId, updates: editForm });
      alert('保存成功');
    }
  };

  const handleDelete = () => {
    if (selectedSlotId && selectedSlot && !selectedSlot.isPreset) {
      if (confirm('确定要删除这个插槽吗？')) {
        dispatch({ type: 'REMOVE_SLOT', id: selectedSlotId });
        setSelectedSlotId(state.slots[0]?.id || null);
      }
    }
  };

  // 物理测试连接
  const handleTestConnection = async () => {
    if (!editForm.baseUrl || !editForm.authKey) {
      setTestStatus('error');
      setTestMsg('缺少 Base URL 或 Key');
      return;
    }

    setTestStatus('loading');
    setTestMsg('正在连接...');

    try {
      const provider = editForm.provider || '';
      const base = String(editForm.baseUrl || '').replace(/\/+$/, '');
      const liblib = isLiblibSlot(editForm);

      if (liblib) {
        const lines = String(editForm.authKey || '')
          .split(/\r?\n/g)
          .map(s => s.trim())
          .filter(Boolean);
        if (lines.length < 2) {
          throw new Error('缺少 SecretKey：请分别填写 AccessKey 与 SecretKey');
        }
        await sendRequest(
          { method: 'POST', url: `${base}/api/generate/webui/status`, body: { generateUuid: '00000000000000000000000000000000' } },
          editForm.authKey
        );
      } else if (provider === 'SiliconFlow') {
        await sendRequest({ method: 'GET', url: '/api/siliconflow/v1/models' }, editForm.authKey);
      } else if (provider === 'N1N') {
        await sendRequest({ method: 'GET', url: `${base}/models` }, editForm.authKey);
      } else if (provider === 'Qwen') {
        await sendRequest({
          method: 'POST',
          url: '/api/dashscope/api/v1/services/aigc/multimodal-generation/generation',
          body: {
            model: 'qwen-vl-max',
            input: { messages: [{ role: 'user', content: [{ text: 'ping' }] }] },
            parameters: { result_format: 'message', max_tokens: 16 }
          }
        }, editForm.authKey);
      } else if (provider === 'FishAudio') {
        const model = (Array.isArray(editForm.models) && editForm.models.length > 0 ? editForm.models[0] : 's1') as any;
        await sendRequest(
          {
            method: 'POST',
            url: `${base}/tts`,
            body: { text: 'ping', format: 'mp3' },
            headers: { model },
            outputType: 'audio'
          },
          editForm.authKey
        );
      } else {
        await sendRequest({ method: 'GET', url: `${base}/models` }, editForm.authKey);
      }

      setTestStatus('success');
      setTestMsg('连接成功！API 通畅。');
    } catch (error: any) {
      console.error('Test Connection Failed:', error);
      setTestStatus('error');
      // 尝试解析错误信息
      let errMsg = '连接失败';
      try {
        const errObj = JSON.parse(error.message);
        errMsg = errObj.message || errObj.error?.message || '未知错误';
      } catch (e) {
        errMsg = error.message || '网络错误';
      }
      setTestMsg(`失败: ${errMsg}`);
    }
  };

  return (
    <div className="p4-theme" style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        width: '900px', height: '600px', backgroundColor: '#1e1e1e',
        borderRadius: '12px', display: 'flex', overflow: 'hidden',
        border: '1px solid #333', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>
        
        {/* 左侧：插槽列表 */}
        <div style={{ width: '250px', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>API 插槽</h3>
            <button onClick={handleAddSlot} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}>
              <Icons.Add />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {state.slots.map(slot => (
              <div
                key={slot.id}
                onClick={() => handleSelectSlot(slot.id)}
                style={{
                  padding: '15px 20px',
                  cursor: 'pointer',
                  backgroundColor: selectedSlotId === slot.id ? '#2a2a2a' : 'transparent',
                  borderLeft: selectedSlotId === slot.id ? '3px solid #fff' : '3px solid transparent',
                  color: selectedSlotId === slot.id ? '#fff' : '#888'
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{slot.name}</div>
                <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{slot.provider}</span>
                    {/* [NEW] Billing Platform Badge */}
                    <span style={{ 
                        fontSize: '10px', 
                        backgroundColor: '#333', 
                        padding: '1px 4px', 
                        borderRadius: '3px',
                        color: slot.provider === 'N1N' ? '#facc15' : '#aaa' 
                    }}>
                        {slot.provider === 'N1N' ? '💰 N1N Billing' : '💰 Platform Billing'}
                    </span>
                </div>
                {slot.isPreset && <span style={{ fontSize: '10px', backgroundColor: '#333', padding: '2px 6px', borderRadius: '4px', color: '#aaa', marginTop: '4px', display: 'inline-block' }}>PRESET</span>}
              </div>
            ))}
          </div>
        </div>

        {/* 右侧：编辑区域 */}
        <div style={{ flex: 1, padding: '30px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h2 style={{ margin: 0, color: '#fff' }}>配置详情</h2>
            <button onClick={onClose} style={{ background: 'none', border: '1px solid #444', color: '#fff', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>关闭</button>
          </div>

          {selectedSlotId && editForm ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Name */}
              <div>
                <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '12px' }}>显示名称</label>
                <input
                  value={editForm.name || ''}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  disabled={editForm.isPreset}
                  style={inputStyle}
                />
              </div>

              {/* Base URL */}
              <div>
                <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '12px' }}>Base URL (Endpoint)</label>
                <input
                  value={editForm.baseUrl || ''}
                  onChange={e => setEditForm({ ...editForm, baseUrl: e.target.value })}
                  style={inputStyle}
                />
              </div>

              {/* Auth Key */}
              <div>
                <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '12px' }}>API Key (Auth)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {isLiblibSlot(editForm) ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={String(editForm.authKey || '').split(/\r?\n/g)[0] || ''}
                        onChange={e => {
                          const parts = String(editForm.authKey || '').split(/\r?\n/g);
                          const secret = (parts[1] || '').trim();
                          setEditForm({ ...editForm, authKey: `${e.target.value}\n${secret}` });
                        }}
                        style={{ ...inputStyle }}
                        placeholder="AccessKey"
                      />
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={String(editForm.authKey || '').split(/\r?\n/g)[1] || ''}
                        onChange={e => {
                          const access = (String(editForm.authKey || '').split(/\r?\n/g)[0] || '').trim();
                          setEditForm({ ...editForm, authKey: `${access}\n${e.target.value}` });
                        }}
                        style={{ ...inputStyle }}
                        placeholder="SecretKey"
                      />
                    </div>
                  ) : (
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={editForm.authKey || ''}
                      onChange={e => setEditForm({ ...editForm, authKey: e.target.value })}
                      style={{ ...inputStyle, flex: 1 }}
                      placeholder="sk-..."
                    />
                  )}
                  <button
                    onClick={handleTestConnection}
                    style={{
                      backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '6px',
                      padding: '0 20px', cursor: 'pointer', fontWeight: 'bold'
                    }}
                  >
                    测试连接
                  </button>
                </div>
                {/* 测试结果反馈 */}
                {testStatus !== 'idle' && (
                  <div style={{ 
                    marginTop: '10px', 
                    padding: '10px', 
                    borderRadius: '4px',
                    backgroundColor: testStatus === 'success' ? 'rgba(255, 255, 255, 0.08)' : testStatus === 'error' ? 'rgba(255, 0, 0, 0.1)' : '#333',
                    color: testStatus === 'success' ? '#4ade80' : testStatus === 'error' ? '#ef4444' : '#fff',
                    fontSize: '13px',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}>
                    {testStatus === 'loading' && <Icons.Loading />}
                    {testStatus === 'success' && <Icons.Check />}
                    {testStatus === 'error' && <Icons.Error />}
                    {testMsg}
                  </div>
                )}
              </div>

              {/* Models */}
              <div>
                <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '12px' }}>可用模型 ID (逗号分隔)</label>
                <textarea
                  value={editForm.models?.join(', ') || ''}
                  onChange={e => setEditForm({ ...editForm, models: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
                  placeholder="black-forest-labs/FLUX.1-dev, Qwen/Qwen2.5..."
                />
              </div>

              {/* [New] Capabilities Display */}
              {editForm.capabilities && editForm.capabilities.length > 0 && (
                 <div>
                    <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '12px' }}>能力标签 (Capabilities)</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {editForm.capabilities.map((cap, idx) => (
                            <span key={idx} style={{ 
                                backgroundColor: '#2a2a2a', 
                                color: '#fff', 
                                padding: '4px 8px', 
                                borderRadius: '4px', 
                                fontSize: '12px',
                                border: '1px solid #333'
                            }}>
                                {cap}
                            </span>
                        ))}
                    </div>
                 </div>
              )}

              {/* [New] Adapter Config (Advanced) */}
              <div style={{ marginTop: '10px' }}>
                <details style={{ cursor: 'pointer', color: '#888', fontSize: '12px' }}>
                    <summary>高级适配器配置 (Adapter Config)</summary>
                    <div style={{ marginTop: '10px' }}>
                        <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#666' }}>
                            在此处定义如何将标准 Payload 转换为厂商特定格式。支持 {`{{mustache}}`} 语法。
                        </p>
                        <textarea
                            value={editForm.adapterConfig ? JSON.stringify(editForm.adapterConfig, null, 2) : ''}
                            onChange={e => {
                                try {
                                    const parsed = JSON.parse(e.target.value);
                                    setEditForm({ ...editForm, adapterConfig: parsed });
                                } catch (err) {
                                    // 允许暂时无效的 JSON，但不会保存到 State (或者需要更好的处理方式)
                                    // 简化起见，这里暂不更新 State 直到 JSON 合法，或者存储 raw string
                                }
                            }}
                            placeholder='{ "structure_template": { ... } }'
                            style={{ 
                                ...inputStyle, 
                                height: '200px', 
                                fontFamily: 'monospace', 
                                fontSize: '12px',
                                color: '#d4d4d4',
                                backgroundColor: '#000' 
                            }}
                        />
                    </div>
                </details>
              </div>

              {/* Actions */}
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                {!editForm.isPreset && (
                  <button onClick={handleDelete} style={{ ...buttonStyle, backgroundColor: '#ef4444', opacity: 0.8 }}>删除插槽</button>
                )}
                <button onClick={handleSave} style={{ ...buttonStyle, backgroundColor: '#fff', color: '#000' }}>保存配置</button>
              </div>

            </div>
          ) : (
            <div style={{ color: '#666', textAlign: 'center', marginTop: '100px' }}>请选择一个插槽进行编辑</div>
          )}
        </div>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  backgroundColor: '#111',
  border: '1px solid #333',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '14px',
  outline: 'none'
};

const buttonStyle = {
  padding: '10px 24px',
  border: 'none',
  borderRadius: '6px',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 'bold'
};
