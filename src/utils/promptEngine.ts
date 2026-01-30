import { CapabilityManifest } from '../types/Protocol';

interface InjectionContext {
  io_interface?: Record<string, any>; // Upstream data
  dynamic?: Record<string, any>;      // User input
  frozen?: Record<string, any>;       // Fixed params
}

/**
 * Prompt Engine
 * 负责解析 CapabilityManifest 中的 prompt_template，并根据 injection_priority 注入参数。
 */
export class PromptEngine {
  /**
   * 解析提示词模板
   * @param template 提示词模板 (e.g., "A photo of {{subject}}, {{style}}")
   * @param context 数据上下文 (IO, Dynamic, Frozen)
   * @param priority 注入优先级 (默认: ['io_interface', 'dynamic', 'frozen'])
   * @returns 解析后的提示词
   */
  static resolve(
    template: string,
    context: InjectionContext,
    priority: ('io_interface' | 'dynamic' | 'frozen')[] = ['io_interface', 'dynamic', 'frozen']
  ): string {
    if (!template) return '';

    // 正则匹配 {{key}}
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const trimmedKey = key.trim();

      // 按照优先级查找值
      for (const source of priority) {
        const value = context[source]?.[trimmedKey];
        if (value !== undefined && value !== null && value !== '') {
          return String(value);
        }
      }

      // 如果都没找到，保留占位符或返回空字符串? 
      // 为了调试友好，保留占位符或者替换为默认标记
      console.warn(`[PromptEngine] ⚠️ Placeholder {{${trimmedKey}}} not found in any context.`);
      return match; // Keep it so user sees it's missing, or maybe remove it? 
                    // Keeping it allows downstream to maybe fill it or fail visibly.
    });
  }

  /**
   * 从 CapabilityManifest 构建 Context 并解析
   */
  static resolveFromCapability(
    manifest: CapabilityManifest,
    userInputs: Record<string, any>,
    upstreamData: Record<string, any> = {}
  ): string {
    const template = manifest.parameter_config.prompt_template || '';
    const priority = manifest.parameter_config.injection_priority || ['io_interface', 'dynamic', 'frozen'];
    
    const context: InjectionContext = {
      io_interface: upstreamData,
      dynamic: userInputs,
      frozen: manifest.parameter_config.frozen
    };

    return this.resolve(template, context, priority);
  }
}
