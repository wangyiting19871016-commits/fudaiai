import { AtomTask } from '../types/index';

// 验证结果接口
export interface ValidationResult {
  id: string; // 验证结果唯一ID
  isValid: boolean;
  score: number; // 0-100
  checks: ValidationCheck[];
  suggestions: string[];
  errorMessage?: string;
  timestamp: Date; // 验证时间
}

// 单个验证检查
export interface ValidationCheck {
  name: string;
  passed: boolean;
  score: number;
  maxScore: number;
  message: string;
}

// 验证器基类
abstract class BaseValidator {
  protected task: AtomTask;
  protected content: string;

  constructor(task: AtomTask, content: string) {
    this.task = task;
    this.content = content;
  }

  abstract validate(): ValidationResult;

  // 通用检查方法
  protected checkCodeLength(minLength: number = 50, maxLength: number = 5000): ValidationCheck {
    const length = this.content.length;
    const isValid = length >= minLength && length <= maxLength;
    const score = isValid ? 20 : Math.min(length / 25, 20);
    
    return {
      name: '代码长度检查',
      passed: isValid,
      score,
      maxScore: 20,
      message: `代码长度: ${length} 字符 (要求: ${minLength}-${maxLength})`
    };
  }

  protected checkSyntaxStructure(): ValidationCheck {
    const hasBraces = (this.content.match(/[{}]/g) || []).length >= 4;
    const hasParentheses = (this.content.match(/[()]/g) || []).length >= 2;
    const hasSemicolons = (this.content.match(/;/g) || []).length >= 1;
    
    const structureScore = (hasBraces ? 1 : 0) + (hasParentheses ? 1 : 0) + (hasSemicolons ? 1 : 0);
    const isValid = structureScore >= 2;
    
    return {
      name: '语法结构检查',
      passed: isValid,
      score: (structureScore / 3) * 15,
      maxScore: 15,
      message: `结构元素: 大括号${hasBraces ? '✓' : '✗'}, 括号${hasParentheses ? '✓' : '✗'}, 分号${hasSemicolons ? '✓' : '✗'}`
    };
  }

  protected checkComments(): ValidationCheck {
    const commentPatterns = [
      /\/\//g,     // 单行注释
      /\/\*/g,     // 多行注释开始
      /\*\//g,     // 多行注释结束
      /#.*$/gm,    // Python注释
      /<!--/g      // HTML注释
    ];
    
    const commentMatches = commentPatterns.reduce((count, pattern) => {
      const matches = this.content.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);
    
    const hasGoodComments = commentMatches >= 2;
    
    return {
      name: '代码注释',
      passed: hasGoodComments,
      score: Math.min(commentMatches * 5, 15),
      maxScore: 15,
      message: `注释数量: ${commentMatches} 个`
    };
  }

  protected checkCodeQuality(): ValidationCheck {
    const qualityIndicators = [
      { pattern: /const\s+\w+/g, name: '常量定义' },
      { pattern: /function\s+\w+/g, name: '函数定义' },
      { pattern: /class\s+\w+/g, name: '类定义' },
      { pattern: /interface\s+\w+/g, name: '接口定义' },
      { pattern: /import\s+.*from/g, name: '模块导入' },
      { pattern: /export\s+/g, name: '模块导出' }
    ];
    
    const foundIndicators = qualityIndicators.filter(indicator => 
      indicator.pattern.test(this.content)
    ).length;
    
    const isGood = foundIndicators >= 2;
    
    return {
      name: '代码质量指标',
      passed: isGood,
      score: (foundIndicators / qualityIndicators.length) * 10,
      maxScore: 10,
      message: `质量指标: ${foundIndicators}/${qualityIndicators.length}`
    };
  }
}

// 智能合约验证器
class SmartContractValidator extends BaseValidator {
  validate(): ValidationResult {
    const checks: ValidationCheck[] = [];
    const suggestions: string[] = [];
    let totalScore = 0;
    let maxScore = 0;

    // 使用通用检查
    const lengthCheck = this.checkCodeLength(200, 5000);
    checks.push(lengthCheck);
    totalScore += lengthCheck.score;
    maxScore += lengthCheck.maxScore;

    const structureCheck = this.checkSyntaxStructure();
    checks.push(structureCheck);
    totalScore += structureCheck.score;
    maxScore += structureCheck.maxScore;

    const commentCheck = this.checkComments();
    checks.push(commentCheck);
    totalScore += commentCheck.score;
    maxScore += commentCheck.maxScore;

    const qualityCheck = this.checkCodeQuality();
    checks.push(qualityCheck);
    totalScore += qualityCheck.score;
    maxScore += qualityCheck.maxScore;

    // 检查智能合约关键词
    const contractKeywords = ['contract', 'function', 'pragma', 'solidity', 'address', 'uint256'];
    const keywordMatches = contractKeywords.filter(keyword => 
      this.content.toLowerCase().includes(keyword)
    ).length;
    const keywordCheck: ValidationCheck = {
      name: '智能合约关键词',
      passed: keywordMatches >= 3,
      score: (keywordMatches / contractKeywords.length) * 20,
      maxScore: 20,
      message: `找到 ${keywordMatches}/${contractKeywords.length} 个关键词`
    };
    checks.push(keywordCheck);
    totalScore += keywordCheck.score;
    maxScore += keywordCheck.maxScore;

    // 检查安全性
    const securityPatterns = [
      /modifier\s+\w+.*\{/, // 修饰符检查
      /require\(/, // require语句
      /revert/, // revert语句
      /onlyOwner/i, // 权限控制
      /safemath/i // SafeMath
    ];
    const securityMatches = securityPatterns.filter(pattern => pattern.test(this.content)).length;
    const securityCheck: ValidationCheck = {
      name: '安全性检查',
      passed: securityMatches >= 2,
      score: (securityMatches / securityPatterns.length) * 20,
      maxScore: 20,
      message: `找到 ${securityMatches} 个安全模式`
    };
    checks.push(securityCheck);
    totalScore += securityCheck.score;
    maxScore += securityCheck.maxScore;

    // 检查Gas优化
    const gasOptimizationPatterns = [
      /storage/i,
      /memory/i,
      /calldata/i,
      /unchecked/i
    ];
    const gasMatches = gasOptimizationPatterns.filter(pattern => pattern.test(this.content)).length;
    const gasCheck: ValidationCheck = {
      name: 'Gas优化',
      passed: gasMatches >= 1,
      score: Math.min((gasMatches / gasOptimizationPatterns.length) * 10, 10),
      maxScore: 10,
      message: `找到 ${gasMatches} 个优化模式`
    };
    checks.push(gasCheck);
    totalScore += gasCheck.score;
    maxScore += gasCheck.maxScore;

    // 验证ERC-20标准
    const erc20Keywords = ['totalSupply', 'balanceOf', 'transfer', 'allowance', 'transferFrom', 'approve'];
    const erc20Matches = erc20Keywords.filter(keyword => this.content.includes(keyword)).length;
    const erc20Check: ValidationCheck = {
      name: 'ERC-20标准兼容性',
      passed: erc20Matches >= 3,
      score: (erc20Matches / erc20Keywords.length) * 20,
      maxScore: 20,
      message: `找到 ${erc20Matches}/${erc20Keywords.length} 个ERC-20标准方法`
    };
    checks.push(erc20Check);
    totalScore += erc20Check.score;
    maxScore += erc20Check.maxScore;

    // 生成建议
    if (keywordMatches < 3) {
      suggestions.push('添加更多智能合约相关的关键词和结构');
    }
    if (securityMatches < 2) {
      suggestions.push('增加安全检查机制，如修饰符和require语句');
    }
    if (erc20Matches < 3) {
      suggestions.push('实现更多ERC-20标准方法');
    }
    if (gasMatches < 1) {
      suggestions.push('考虑添加Gas优化机制');
    }

    const finalScore = Math.round((totalScore / maxScore) * 100);
    const isValid = finalScore >= 60; // 60%及格线

    return {
      id: `smart-contract-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isValid,
      score: finalScore,
      checks,
      suggestions,
      errorMessage: isValid ? undefined : '代码质量未达到基本要求',
      timestamp: new Date()
    };
  }
}

// 数据存证验证器
class DataCertificationValidator extends BaseValidator {
  validate(): ValidationResult {
    const checks: ValidationCheck[] = [];
    const suggestions: string[] = [];
    let totalScore = 0;
    let maxScore = 0;

    // 检查哈希算法
    const hashPatterns = [
      /sha256/i,
      /keccak/i,
      /hash/i,
      /digest/i
    ];
    const hashMatches = hashPatterns.filter(pattern => pattern.test(this.content)).length;
    const hashCheck: ValidationCheck = {
      name: '哈希算法实现',
      passed: hashMatches >= 2,
      score: (hashMatches / hashPatterns.length) * 25,
      maxScore: 25,
      message: `找到 ${hashMatches} 个哈希相关实现`
    };
    checks.push(hashCheck);
    totalScore += hashCheck.score;
    maxScore += hashCheck.maxScore;

    // 检查时间戳
    const timestampPatterns = [
      /timestamp/i,
      /datetime/i,
      /Date/i,
      /time/i
    ];
    const timestampMatches = timestampPatterns.filter(pattern => pattern.test(this.content)).length;
    const timestampCheck: ValidationCheck = {
      name: '时间戳处理',
      passed: timestampMatches >= 1,
      score: Math.min((timestampMatches / timestampPatterns.length) * 20, 20),
      maxScore: 20,
      message: `找到 ${timestampMatches} 个时间戳处理`
    };
    checks.push(timestampCheck);
    totalScore += timestampCheck.score;
    maxScore += timestampCheck.maxScore;

    // 检查数据完整性
    const integrityPatterns = [
      /checksum/i,
      /integrity/i,
      /verify/i,
      /validate/i
    ];
    const integrityMatches = integrityPatterns.filter(pattern => pattern.test(this.content)).length;
    const integrityCheck: ValidationCheck = {
      name: '数据完整性验证',
      passed: integrityMatches >= 1,
      score: Math.min((integrityMatches / integrityPatterns.length) * 25, 25),
      maxScore: 25,
      message: `找到 ${integrityMatches} 个完整性检查`
    };
    checks.push(integrityCheck);
    totalScore += integrityCheck.score;
    maxScore += integrityCheck.maxScore;

    // 检查防篡改机制
    const tamperPatterns = [
      /tamper/i,
      /prevent/i,
      /secure/i,
      /lock/i
    ];
    const tamperMatches = tamperPatterns.filter(pattern => pattern.test(this.content)).length;
    const tamperCheck: ValidationCheck = {
      name: '防篡改机制',
      passed: tamperMatches >= 1,
      score: Math.min((tamperMatches / tamperPatterns.length) * 20, 20),
      maxScore: 20,
      message: `找到 ${tamperMatches} 个防篡改机制`
    };
    checks.push(tamperCheck);
    totalScore += tamperCheck.score;
    maxScore += tamperCheck.maxScore;

    // 检查报告结构
    const reportPatterns = [
      /report/i,
      /result/i,
      /analysis/i,
      /summary/i
    ];
    const reportMatches = reportPatterns.filter(pattern => pattern.test(this.content)).length;
    const reportCheck: ValidationCheck = {
      name: '报告结构',
      passed: reportMatches >= 2,
      score: Math.min((reportMatches / reportPatterns.length) * 10, 10),
      maxScore: 10,
      message: `找到 ${reportMatches} 个报告元素`
    };
    checks.push(reportCheck);
    totalScore += reportCheck.score;
    maxScore += reportCheck.maxScore;

    const finalScore = Math.round((totalScore / maxScore) * 100);
    const isValid = finalScore >= 50;

    return {
      id: `data-certification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isValid,
      score: finalScore,
      checks,
      suggestions,
      errorMessage: isValid ? undefined : '存证方案未达到基本要求',
      timestamp: new Date()
    };
  }
}

// 系统联动验证器
class SystemIntegrationValidator extends BaseValidator {
  validate(): ValidationResult {
    const checks: ValidationCheck[] = [];
    const suggestions: string[] = [];
    let totalScore = 0;
    let maxScore = 0;

    // 检查API接口
    const apiPatterns = [
      /fetch/i,
      /axios/i,
      /api/i,
      /endpoint/i,
      /request/i
    ];
    const apiMatches = apiPatterns.filter(pattern => pattern.test(this.content)).length;
    const apiCheck: ValidationCheck = {
      name: 'API接口处理',
      passed: apiMatches >= 3,
      score: (apiMatches / apiPatterns.length) * 25,
      maxScore: 25,
      message: `找到 ${apiMatches}/${apiPatterns.length} 个API相关实现`
    };
    checks.push(apiCheck);
    totalScore += apiCheck.score;
    maxScore += apiCheck.maxScore;

    // 检查数据流同步
    const syncPatterns = [
      /sync/i,
      /consistent/i,
      /stream/i,
      /pipe/i
    ];
    const syncMatches = syncPatterns.filter(pattern => pattern.test(this.content)).length;
    const syncCheck: ValidationCheck = {
      name: '数据流同步',
      passed: syncMatches >= 1,
      score: Math.min((syncMatches / syncPatterns.length) * 20, 20),
      maxScore: 20,
      message: `找到 ${syncMatches} 个同步机制`
    };
    checks.push(syncCheck);
    totalScore += syncCheck.score;
    maxScore += syncCheck.maxScore;

    // 检查错误处理
    const errorPatterns = [
      /try.*catch/i,
      /error/i,
      /exception/i,
      /throw/i
    ];
    const errorMatches = errorPatterns.filter(pattern => pattern.test(this.content)).length;
    const errorCheck: ValidationCheck = {
      name: '错误处理',
      passed: errorMatches >= 2,
      score: (errorMatches / errorPatterns.length) * 20,
      maxScore: 20,
      message: `找到 ${errorMatches} 个错误处理机制`
    };
    checks.push(errorCheck);
    totalScore += errorCheck.score;
    maxScore += errorCheck.maxScore;

    // 检查性能指标
    const performancePatterns = [
      /performance/i,
      /monitor/i,
      /metric/i,
      /benchmark/i
    ];
    const performanceMatches = performancePatterns.filter(pattern => pattern.test(this.content)).length;
    const performanceCheck: ValidationCheck = {
      name: '性能监控',
      passed: performanceMatches >= 1,
      score: Math.min((performanceMatches / performancePatterns.length) * 15, 15),
      maxScore: 15,
      message: `找到 ${performanceMatches} 个性能监控元素`
    };
    checks.push(performanceCheck);
    totalScore += performanceCheck.score;
    maxScore += performanceCheck.maxScore;

    // 检查监控告警
    const alertPatterns = [
      /alert/i,
      /notify/i,
      /log/i,
      /warn/i
    ];
    const alertMatches = alertPatterns.filter(pattern => pattern.test(this.content)).length;
    const alertCheck: ValidationCheck = {
      name: '监控告警',
      passed: alertMatches >= 1,
      score: Math.min((alertMatches / alertPatterns.length) * 20, 20),
      maxScore: 20,
      message: `找到 ${alertMatches} 个监控告警机制`
    };
    checks.push(alertCheck);
    totalScore += alertCheck.score;
    maxScore += alertCheck.maxScore;

    const finalScore = Math.round((totalScore / maxScore) * 100);
    const isValid = finalScore >= 55;

    return {
      id: `validation_${Date.now()}`,
      isValid,
      score: finalScore,
      checks,
      suggestions,
      errorMessage: isValid ? undefined : '系统联动方案未达到基本要求',
      timestamp: new Date()
    };
  }
}

// 主验证函数
export function validateTask(task: AtomTask, content: string): ValidationResult {
  let validator: BaseValidator;

  switch (task.category) {
    case 'smart-contract':
      validator = new SmartContractValidator(task, content);
      break;
    case 'data-certification':
      validator = new DataCertificationValidator(task, content);
      break;
    case 'system-integration':
      validator = new SystemIntegrationValidator(task, content);
      break;
    default:
      // 默认验证器
      validator = new DataCertificationValidator(task, content);
  }

  return validator.validate();
}

// 获取验证状态颜色
export function getValidationStatusColor(status: 'idle' | 'verifying' | 'success' | 'failed'): string {
  switch (status) {
    case 'idle':
      return '#666';
    case 'verifying':
      return '#2196F3';
    case 'success':
      return '#4CAF50';
    case 'failed':
      return '#F44336';
    default:
      return '#666';
  }
}

// 获取验证状态文本
export function getValidationStatusText(status: 'idle' | 'verifying' | 'success' | 'failed'): string {
  switch (status) {
    case 'idle':
      return '等待提交';
    case 'verifying':
      return '验证中...';
    case 'success':
      return '验证通过';
    case 'failed':
      return '验证失败';
    default:
      return '未知状态';
  }
}