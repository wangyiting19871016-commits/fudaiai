/**
 * LiblibAI工作流配置池
 * 支持多个备用工作流，自动轮询切换
 */

export interface LiblibWorkflowConfig {
  id: string;
  name: string;
  description: string;
  templateUuid: string;
  workflowUuid: string;
  // 节点映射：指定用户照片和模板图应该传给哪些节点
  nodeMapping: {
    userPhoto: string[];      // 用户照片的节点ID列表
    templateImage: string[];  // 模板图的节点ID列表
  };
  // 额外节点（可选）：支持CLIPTextEncode、LayerMask等非LoadImage节点
  extraNodes?: {
    [nodeId: string]: {
      class_type: string;
      inputs: any;
    };
  };
  priority: number;  // 优先级（越小越优先）
  enabled: boolean;  // 是否启用
}

/**
 * M2财神变身工作流池
 */
export const M2_WORKFLOWS: LiblibWorkflowConfig[] = [
  // 🎯 原始稳定工作流（P4Lab测试验证）- 最高优先级
  {
    id: 'original-p4lab-v1',
    name: '原始财神变身工作流（P4Lab验证）',
    description: '使用PersonMaskUltra V2蒙版的稳定换脸工作流 - P4Lab测试通过',
    templateUuid: '4df2efa0f18d46dc9758803e478eb51c',
    workflowUuid: 'ae99b8cbe39a4d66a467211f45ddbda5',
    nodeMapping: {
      userPhoto: ['49'],    // Node 49: 用户面部照片（交换后）
      templateImage: ['40']  // Node 40: 财神模板图（交换后）
    },
    extraNodes: {
      '27': {
        class_type: 'CLIPTextEncode',
        inputs: { text: '' }  // 负面提示词（空字符串表示不添加负面约束）
      },
      '28': {
        class_type: 'CLIPTextEncode',
        inputs: { text: '' }  // 正面提示词（空字符串表示使用默认）
      },
      '271': {
        class_type: 'LayerMask: PersonMaskUltra V2',
        inputs: {
          face: true,   // ✅ 替换面部
          hair: false   // ❌ 保留原发型
        }
      }
    },
    priority: 0,  // 🥇 最高优先级
    enabled: true
  },

  // 新工作流：InstantID人像替换（备用）
  {
    id: 'instantid-v2',
    name: 'InstantID人像替换',
    description: '一键换脸丨人像替换丨InstantID丨容貌替换丨面部迁移',
    templateUuid: '4df2efa0f18d46dc9758803e478eb51c',
    workflowUuid: 'c2284ab826d84cdbabeef0f092d4dca5',
    nodeMapping: {
      userPhoto: ['433', '435', '436'],  // 3个人像节点都传用户照片
      templateImage: ['453']              // 基础图节点传模板
    },
    priority: 1,
    enabled: true  // ✅ 启用，作为备用
  },

  // 最强换脸工作流（7万+生成量，备用）
  {
    id: 'caishen-faceswap-v1',
    name: '最强换脸工作流（7万+）',
    description: '最强换脸工作流（带放大功能）- 7万+生成量验证',
    templateUuid: '4df2efa0f18d46dc9758803e478eb51c',
    workflowUuid: '44d75a7ea2834c4f985ec9396b7db726',
    nodeMapping: {
      userPhoto: ['15'],   // 用户照片节点
      templateImage: ['21'] // 模板图节点
    },
    priority: 2,  // 降低优先级
    enabled: true
  }
];

/**
 * 获取启用的工作流列表（按优先级排序）
 */
export function getEnabledWorkflows(): LiblibWorkflowConfig[] {
  return M2_WORKFLOWS
    .filter(w => w.enabled)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * 根据ID获取工作流
 */
export function getWorkflowById(id: string): LiblibWorkflowConfig | undefined {
  return M2_WORKFLOWS.find(w => w.id === id);
}
