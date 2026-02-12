/**
 * 积分管理Store
 * 使用Zustand + persist中间件实现积分系统
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getVisitorId, initVisitor } from '../utils/visitorId';

// Local testing credit switches (DEV only):
// VITE_CREDIT_TEST_MODE=bootstrap | unlimited | off
// VITE_CREDIT_BOOTSTRAP=500000
const CREDIT_TEST_MODE = (import.meta.env.VITE_CREDIT_TEST_MODE || 'off').toLowerCase();
const CREDIT_BOOTSTRAP_RAW = Number(import.meta.env.VITE_CREDIT_BOOTSTRAP || 0);
const IS_DEV_MODE = import.meta.env.DEV;
const ENABLE_UNLIMITED_CREDITS = IS_DEV_MODE && CREDIT_TEST_MODE === 'unlimited';
const ENABLE_BOOTSTRAP_CREDITS = IS_DEV_MODE && CREDIT_TEST_MODE === 'bootstrap';
const CREDIT_BOOTSTRAP = Number.isFinite(CREDIT_BOOTSTRAP_RAW) && CREDIT_BOOTSTRAP_RAW > 0
  ? CREDIT_BOOTSTRAP_RAW
  : 100000;

/**
 * 交易类型
 */
export enum TransactionType {
  RECHARGE = 'recharge',        // 充值
  CONSUME = 'consume',           // 消耗
  REFUND = 'refund',             // 退款
  GIFT = 'gift',                 // 赠送
}

/**
 * 交易记录
 */
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;                // 积分数量（正数为增加，负数为减少）
  balance: number;               // 交易后余额
  description: string;           // 交易描述
  orderId?: string;              // 关联订单ID（充值时）
  featureId?: string;            // 关联功能ID（消耗时）
  createdAt: number;             // 创建时间
}

/**
 * 积分数据
 */
export interface CreditData {
  credits: number;               // 当前余额
  totalRecharged: number;        // 累计充值
  totalConsumed: number;         // 累计消耗
  visitorId: string;             // 访客ID
  transactions: Transaction[];   // 交易记录（最多保留100条）
}

/**
 * Store状态
 */
interface CreditState {
  creditData: CreditData;

  // 操作方法
  initVisitor: () => void;
  addCredits: (amount: number, orderId: string, description?: string) => void;
  consumeCredits: (amount: number, featureId: string, description: string) => boolean;
  refundCredits: (amount: number, originalTransactionId: string, description: string) => void;
  checkCredits: (requiredAmount: number) => boolean;
  getTransactionHistory: (limit?: number) => Transaction[];
  getTotalRecharged: () => number;
  getTotalConsumed: () => number;
  resetCredits: () => void; // 仅用于测试
}

/**
 * 生成交易ID
 */
function generateTransactionId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 限制交易记录数量
 */
function limitTransactions(transactions: Transaction[], maxCount = 100): Transaction[] {
  if (transactions.length <= maxCount) {
    return transactions;
  }
  // 保留最新的maxCount条记录
  return transactions.slice(-maxCount);
}

/**
 * 创建初始状态
 */
function createInitialState(): CreditData {
  const visitorId = getVisitorId();
  const initialCredits = ENABLE_UNLIMITED_CREDITS
    ? CREDIT_BOOTSTRAP
    : ENABLE_BOOTSTRAP_CREDITS
      ? CREDIT_BOOTSTRAP
      : 10000; // 测试阶段改为10000积分
  const initialDescription = ENABLE_UNLIMITED_CREDITS
    ? `🧪 本地测试：无限积分模式（初始 ${initialCredits}）`
    : ENABLE_BOOTSTRAP_CREDITS
      ? `🧪 本地测试：预设积分 ${initialCredits}`
      : '🎁 新春礼包：赠送10000积分体验';

  return {
    credits: initialCredits,
    totalRecharged: 0,
    totalConsumed: 0,
    visitorId,
    transactions: [
      {
        id: `txn_welcome_${Date.now()}`,
        type: TransactionType.GIFT,
        amount: initialCredits,
        balance: initialCredits,
        description: initialDescription,
        createdAt: Date.now(),
      }
    ],
  };
}

/**
 * 积分Store
 */
export const useCreditStore = create<CreditState>()(
  persist(
    (set, get) => ({
      creditData: createInitialState(),

      /**
       * 初始化访客
       */
      initVisitor: () => {
        const visitorData = initVisitor();
        set((state) => ({
          creditData: {
            ...state.creditData,
            visitorId: visitorData.id,
          },
        }));
      },

      /**
       * 增加积分（充值）
       * @param amount 积分数量
       * @param orderId 订单ID
       * @param description 描述
       */
      addCredits: (amount: number, orderId: string, description?: string) => {
        set((state) => {
          const newBalance = state.creditData.credits + amount;
          const transaction: Transaction = {
            id: generateTransactionId(),
            type: TransactionType.RECHARGE,
            amount,
            balance: newBalance,
            description: description || `充值 ${amount} 积分`,
            orderId,
            createdAt: Date.now(),
          };

          return {
            creditData: {
              ...state.creditData,
              credits: newBalance,
              totalRecharged: state.creditData.totalRecharged + amount,
              transactions: limitTransactions([
                ...state.creditData.transactions,
                transaction,
              ]),
            },
          };
        });
      },

      /**
       * 消耗积分
       * @param amount 积分数量
       * @param featureId 功能ID
       * @param description 描述
       * @returns 是否成功
       */
      consumeCredits: (amount: number, featureId: string, description: string) => {
        // DEV-only bypass: keep local testing smooth
        if (ENABLE_UNLIMITED_CREDITS) {
          return true;
        }

        const { credits } = get().creditData;

        // 检查余额是否充足
        if (credits < amount) {
          return false;
        }

        set((state) => {
          const newBalance = state.creditData.credits - amount;
          const transaction: Transaction = {
            id: generateTransactionId(),
            type: TransactionType.CONSUME,
            amount: -amount, // 负数表示减少
            balance: newBalance,
            description,
            featureId,
            createdAt: Date.now(),
          };

          return {
            creditData: {
              ...state.creditData,
              credits: newBalance,
              totalConsumed: state.creditData.totalConsumed + amount,
              transactions: limitTransactions([
                ...state.creditData.transactions,
                transaction,
              ]),
            },
          };
        });

        return true;
      },

      /**
       * 退款（功能失败时）
       * @param amount 退款积分数量
       * @param originalTransactionId 原交易ID
       * @param description 描述
       */
      refundCredits: (amount: number, originalTransactionId: string, description: string) => {
        set((state) => {
          const newBalance = state.creditData.credits + amount;
          const transaction: Transaction = {
            id: generateTransactionId(),
            type: TransactionType.REFUND,
            amount,
            balance: newBalance,
            description,
            createdAt: Date.now(),
          };

          return {
            creditData: {
              ...state.creditData,
              credits: newBalance,
              totalConsumed: Math.max(0, state.creditData.totalConsumed - amount),
              transactions: limitTransactions([
                ...state.creditData.transactions,
                transaction,
              ]),
            },
          };
        });
      },

      /**
       * 检查积分是否充足
       * @param requiredAmount 需要的积分数量
       * @returns 是否充足
       */
      checkCredits: (requiredAmount: number) => {
        if (ENABLE_UNLIMITED_CREDITS) {
          return true;
        }
        return get().creditData.credits >= requiredAmount;
      },

      /**
       * 获取交易记录
       * @param limit 限制数量
       * @returns 交易记录数组
       */
      getTransactionHistory: (limit?: number) => {
        const { transactions } = get().creditData;

        // 按时间倒序排列
        const sortedTransactions = [...transactions].sort(
          (a, b) => b.createdAt - a.createdAt
        );

        if (limit) {
          return sortedTransactions.slice(0, limit);
        }

        return sortedTransactions;
      },

      /**
       * 获取累计充值
       */
      getTotalRecharged: () => {
        return get().creditData.totalRecharged;
      },

      /**
       * 获取累计消耗
       */
      getTotalConsumed: () => {
        return get().creditData.totalConsumed;
      },

      /**
       * 重置积分（仅用于测试）
       */
      resetCredits: () => {
        set({ creditData: createInitialState() });
      },
    }),
    {
      name: 'festival-credit-storage',
      version: 1,
      // 可以添加迁移逻辑
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // 从旧版本迁移
          return persistedState;
        }
        return persistedState;
      },
    }
  )
);

/**
 * 便捷hooks
 */

// 获取当前积分余额
export const useCredits = () => useCreditStore((state) => state.creditData.credits);

// 获取完整积分数据
export const useCreditData = () => useCreditStore((state) => state.creditData);

// 获取操作方法
export const useCreditActions = () => ({
  initVisitor: useCreditStore((state) => state.initVisitor),
  addCredits: useCreditStore((state) => state.addCredits),
  consumeCredits: useCreditStore((state) => state.consumeCredits),
  refundCredits: useCreditStore((state) => state.refundCredits),
  checkCredits: useCreditStore((state) => state.checkCredits),
  getTransactionHistory: useCreditStore((state) => state.getTransactionHistory),
});
