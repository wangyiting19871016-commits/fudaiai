import type { APISlot } from '../types/APISlot';

export type RawApiLibraryItem = {
  id: string;
  name: string;
  provider: string;
  slotId: string;
  description?: string;
  tags?: string[];
};

export type RawApiLibraryCategory = {
  id: string;
  category: string;
  icon: string;
  items: RawApiLibraryItem[];
};

const prettyName: Record<string, string> = {
  'tts': 'Fish Audio 语音合成',
  'gpt-4.1': 'GPT-4.1',
  'gpt-4o': 'GPT-4o',
  'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
  'black-forest-labs/FLUX.1-dev': 'FLUX.1 Dev',
  'black-forest-labs/flux-kontext-pro': 'FLUX Kontext Pro',
  'black-forest-labs/flux-kontext-dev': 'FLUX Kontext Dev',
  'black-forest-labs/flux-kontext-max': 'FLUX Kontext Max',
  'flux-pro': 'FLUX.1 Pro',
  'mj_imagine': 'Midjourney',
  'runwayml-gen3a_turbo-5': 'Runway Gen-3 Alpha',
  'Qwen/Qwen2.5-7B-Instruct': 'Qwen 2.5 7B Instruct',
  'deepseek-ai/DeepSeek-V3': 'DeepSeek V3',
  'qwen-vl-max': 'Qwen-VL Max',
  'qwen-vl-plus': 'Qwen-VL Plus',
  'liblib-canny': 'Liblib Canny (边缘检测)',
  'liblib-qrcode': 'Liblib QR Code (光影文字)',
  'liblib-flux-dev': 'Liblib FLUX.1 Dev',
  'liblib-all-in-one-v2': 'Liblib 全能图片模型 V2 (Seedream)',
  'liblib-face-swap-hd': 'Liblib 高清换脸 (Comfy 工作流)',
};

const descriptionHints: Record<string, string> = {
  'tts': '文字转语音，支持创建专属声音',
  'gpt-4.1': '旗舰多模态对话',
  'gpt-4o': '高质量通用对话',
  'claude-3-5-sonnet-20241022': '代码与长文本强项',
  'black-forest-labs/FLUX.1-dev': '开源 FLUX，文生图',
  'black-forest-labs/flux-kontext-pro': '任务型生图/可选参考图',
  'black-forest-labs/flux-kontext-dev': '图生图编辑/保留身份能力强',
  'black-forest-labs/flux-kontext-max': '高级图生图编辑/一致性更强',
  'flux-pro': '高画质文生图',
  'mj_imagine': '风格化艺术生成',
  'runwayml-gen3a_turbo-5': '视频生成',
  'Qwen/Qwen2.5-7B-Instruct': '开源对话模型',
  'deepseek-ai/DeepSeek-V3': '推理能力强',
  'qwen-vl-max': '视觉理解/多模态',
  'qwen-vl-plus': '视觉理解/多模态',
  'liblib-canny': '通过线条控制构图',
  'liblib-qrcode': '文字隐形融入画面',
  'liblib-flux-dev': 'Liblib 托管的 FLUX 模型',
  'liblib-all-in-one-v2': '模板化全能生图（支持 LoRA）',
  'liblib-face-swap-hd': 'Comfy 工作流：上传两张图一键换脸',
};

function isRoutableByPayloadBuilder(provider: string, modelId: string) {
  if (provider === 'SiliconFlow') return true;
  if (provider === 'Qwen') return true;
  if (provider === 'Liblib') return true;
  if (provider === 'FishAudio') return true;
  if (provider === 'Custom' && modelId.startsWith('liblib')) return true;
  if (provider === 'N1N') {
    if (modelId === 'black-forest-labs/flux-kontext-pro') return true;
    if (modelId.includes('gpt') || modelId.includes('claude')) return true;
    if (modelId.includes('flux') || modelId.includes('mj') || modelId.includes('midjourney')) return true;
    if (modelId.includes('runway') || modelId.includes('video')) return true;
    return false;
  }
  return false;
}

function isSlotEnabledForRawLibrary(slot: APISlot) {
  if (slot.isPreset) return true;
  if (slot.adapterConfig) return true;
  if (slot.modelOverrides && Object.values(slot.modelOverrides).some((o: any) => Boolean(o && o.adapterConfig))) return true;
  return false;
}

function detectCategory(provider: string, modelId: string): RawApiLibraryCategory['id'] {
  const normalized = `${provider}:${modelId}`.toLowerCase();
  if (provider === 'N1N') return 'n1n';
  if (provider === 'FishAudio') return 'audio';
  if (modelId.startsWith('liblib-')) return 'visual';
  if (normalized.includes('runway') || normalized.includes('video')) return 'video';
  if (normalized.includes('flux') || normalized.includes('mj') || normalized.includes('midjourney')) return 'visual';
  if (provider === 'Qwen' && modelId.includes('vl')) return 'visual_perception';
  return 'text';
}

export function buildRawApiLibraryFromSlots(slots: APISlot[]): RawApiLibraryCategory[] {
  const categories: Record<string, RawApiLibraryCategory> = {
    n1n: { id: 'n1n', category: 'N1N (聚合网关)', icon: '🧩', items: [] },
    text: { id: 'text', category: '文本/对话 (Text/Chat)', icon: '💬', items: [] },
    visual: { id: 'visual', category: '视觉/生图 (Visual/Image)', icon: '🎨', items: [] },
    video: { id: 'video', category: '视频/动态 (Video/Dynamics)', icon: '🎬', items: [] },
    audio: { id: 'audio', category: '音频/语音 (Audio/Voice)', icon: '🎤', items: [] },
    visual_perception: { id: 'visual_perception', category: '视觉感知 (Visual Perception)', icon: '👁️', items: [] },
  };

  const safeSlots = (slots || []).filter(isSlotEnabledForRawLibrary);
  for (const slot of safeSlots) {
    for (const modelId of slot.models || []) {
      if (!isRoutableByPayloadBuilder(slot.provider, modelId)) continue;
      const catId = detectCategory(slot.provider, modelId);
      categories[catId].items.push({
        id: modelId,
        provider: slot.provider,
        slotId: slot.id,
        name: prettyName[modelId] || modelId.split('/').pop() || modelId,
        description: descriptionHints[modelId],
        tags: slot.isPreset ? ['可用'] : undefined,
      });
    }
  }

  const order = ['n1n', 'text', 'visual', 'video', 'audio', 'visual_perception'];
  return order
    .map(id => categories[id])
    .filter(c => c.items.length > 0)
    .map(c => ({
      ...c,
      items: [...c.items].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')),
    }));
}
