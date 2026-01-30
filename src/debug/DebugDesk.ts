import type { ArtifactEngineParams } from '../engines/ArtifactEngine';

interface DebugDeskOptions {
  container: HTMLElement;
  engine: any; // 简化类型，实际使用时应传入正确的ArtifactEngine实例
}

interface ParamConfig {
  key: keyof ArtifactEngineParams;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

class DebugDesk {
  private container: HTMLElement;
  private engine: any;
  private params: ArtifactEngineParams;
  private paramConfigs: ParamConfig[] = [
    { key: 'exposure', label: '曝光', min: -2.0, max: 2.0, step: 0.01, defaultValue: 0 },
    { key: 'brilliance', label: '鲜明度', min: -1.0, max: 1.0, step: 0.01, defaultValue: 0 },
    { key: 'highlights', label: '高光', min: -1.0, max: 1.0, step: 0.01, defaultValue: 0 },
    { key: 'shadows', label: '阴影', min: -1.0, max: 1.0, step: 0.01, defaultValue: 0 },
    { key: 'contrast', label: '对比度', min: -1.0, max: 1.0, step: 0.01, defaultValue: 0 },
    { key: 'brightness', label: '亮度', min: -1.0, max: 1.0, step: 0.01, defaultValue: 0 },
    { key: 'saturation', label: '饱和度', min: -1.0, max: 1.0, step: 0.01, defaultValue: 0 },
    { key: 'vibrance', label: '鲜艳度', min: -1.0, max: 1.0, step: 0.01, defaultValue: 0 },
    { key: 'warmth', label: '色温', min: -1.0, max: 1.0, step: 0.01, defaultValue: 0 },
    { key: 'tint', label: '色调', min: -1.0, max: 1.0, step: 0.01, defaultValue: 0 },
    { key: 'sharpness', label: '锐度', min: 0.0, max: 2.0, step: 0.01, defaultValue: 0 },
    { key: 'definition', label: '清晰度', min: 0.0, max: 2.0, step: 0.01, defaultValue: 0 },
    { key: 'noise', label: '降噪', min: 0.0, max: 1.0, step: 0.01, defaultValue: 0 },
    { key: 'vignette', label: '暗角', min: 0.0, max: 2.0, step: 0.01, defaultValue: 0 },
    { key: 'filterIntensity', label: '滤镜强度', min: 0.0, max: 1.0, step: 0.01, defaultValue: 0 }
  ];

  constructor(options: DebugDeskOptions) {
    this.container = options.container;
    this.engine = options.engine;
    
    // Initialize params with default values
    this.params = this.paramConfigs.reduce((acc, config) => {
      acc[config.key] = config.defaultValue;
      return acc;
    }, {} as ArtifactEngineParams);

    this.init();
  }

  private init(): void {
    this.renderUI();
    this.bindEvents();
  }

  private renderUI(): void {
    // Clear container
    this.container.innerHTML = '';

    // Create title
    const title = document.createElement('h2');
    title.textContent = '14-Parameter Debug Desk';
    title.style.color = '#fff';
    title.style.marginBottom = '20px';
    this.container.appendChild(title);

    // Create params container
    const paramsContainer = document.createElement('div');
    paramsContainer.style.display = 'grid';
    paramsContainer.style.gridTemplateColumns = '1fr 1fr';
    paramsContainer.style.gap = '15px';
    paramsContainer.style.marginBottom = '20px';
    this.container.appendChild(paramsContainer);

    // Create sliders for each parameter
    this.paramConfigs.forEach(config => {
      const paramGroup = this.createParamGroup(config);
      paramsContainer.appendChild(paramGroup);
    });

    // Create snapshot button
    const snapshotButton = document.createElement('button');
    snapshotButton.textContent = '复制当前偏好 JSON';
    snapshotButton.style.padding = '10px 20px';
    snapshotButton.style.backgroundColor = '#a3a3a3';
    snapshotButton.style.color = 'white';
    snapshotButton.style.border = 'none';
    snapshotButton.style.borderRadius = '4px';
    snapshotButton.style.cursor = 'pointer';
    snapshotButton.style.fontSize = '14px';
    this.container.appendChild(snapshotButton);

    // Store reference for event binding
    snapshotButton.setAttribute('data-action', 'snapshot');
  }

  private createParamGroup(config: ParamConfig): HTMLElement {
    const group = document.createElement('div');
    group.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    group.style.padding = '10px';
    group.style.borderRadius = '4px';
    group.style.display = 'flex';
    group.style.flexDirection = 'column';
    group.style.gap = '5px';

    // Create label
    const label = document.createElement('label');
    label.textContent = `${config.label}: ${this.params[config.key].toFixed(2)}`;
    label.style.color = '#fff';
    label.style.fontSize = '14px';
    label.setAttribute('data-param-label', config.key);
    group.appendChild(label);

    // Create slider
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = config.min.toString();
    slider.max = config.max.toString();
    slider.step = config.step.toString();
    slider.value = this.params[config.key].toString();
    slider.style.width = '100%';
    slider.setAttribute('data-param-key', config.key);
    group.appendChild(slider);

    return group;
  }

  private bindEvents(): void {
    // Bind slider events
    this.container.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.tagName === 'INPUT' && target.type === 'range') {
        const paramKey = target.getAttribute('data-param-key') as keyof ArtifactEngineParams;
        const value = parseFloat(target.value);
        this.updateParam(paramKey, value);
      }
    });

    // Bind snapshot button event
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.hasAttribute('data-action') && target.getAttribute('data-action') === 'snapshot') {
        this.copySnapshot();
      }
    });
  }

  private updateParam(key: keyof ArtifactEngineParams, value: number): void {
    // Update local params
    this.params[key] = value;

    // Update engine params
    this.engine.setParams({ [key]: value });

    // Update label
    const label = this.container.querySelector(`[data-param-label="${key}"]`) as HTMLLabelElement;
    if (label) {
      label.textContent = `${this.paramConfigs.find(c => c.key === key)?.label}: ${value.toFixed(2)}`;
    }
  }

  private copySnapshot(): void {
    // Create snapshot JSON
    const snapshot = JSON.stringify(this.params, null, 2);

    // Copy to clipboard
    navigator.clipboard.writeText(snapshot).then(() => {
      // Show feedback
      const feedback = document.createElement('div');
      feedback.textContent = 'JSON 已复制到剪贴板！';
      feedback.style.position = 'fixed';
      feedback.style.top = '20px';
      feedback.style.right = '20px';
      feedback.style.backgroundColor = '#a3a3a3';
      feedback.style.color = 'white';
      feedback.style.padding = '10px 20px';
      feedback.style.borderRadius = '4px';
      feedback.style.zIndex = '1000';
      document.body.appendChild(feedback);

      // Remove feedback after 2 seconds
      setTimeout(() => {
        feedback.remove();
      }, 2000);
    }).catch(err => {
      console.error('复制失败:', err);
    });
  }

  // Public method to update params from external sources
  public updateParams(params: Partial<ArtifactEngineParams>): void {
    Object.entries(params).forEach(([key, value]) => {
      this.updateParam(key as keyof ArtifactEngineParams, value);
    });
  }

  // Public method to get current params
  public getParams(): ArtifactEngineParams {
    return { ...this.params };
  }
}

export default DebugDesk;