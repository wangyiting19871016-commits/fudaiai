/**
 * 支付服务
 * 处理订单创建和支付相关逻辑
 */

import { RechargePackage } from '../pages/Festival/RechargePage';
import { getVisitorId } from '../utils/visitorId';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

/**
 * 订单状态
 */
export enum OrderStatus {
  PENDING = 'pending',       // 待支付
  PAID = 'paid',            // 已支付
  FAILED = 'failed',        // 支付失败
  EXPIRED = 'expired',      // 已过期
  REFUNDED = 'refunded',    // 已退款
}

/**
 * 订单数据
 */
export interface Order {
  orderId: string;
  visitorId: string;
  packageId: string;
  packageName: string;
  amount: number;
  credits: number;
  status: OrderStatus;
  paymentId?: string;
  paymentUrl?: string;
  createdAt: number;
  paidAt?: number;
  expiredAt?: number;
}

/**
 * 创建充值订单
 */
export async function createRechargeOrder(
  pkg: RechargePackage
): Promise<Order> {
  const visitorId = getVisitorId();

  try {
    const response = await fetch(`${API_BASE}/api/payment/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        visitorId,
        packageId: pkg.id,
        packageName: pkg.name,
        amount: pkg.amount,
        credits: pkg.totalCredits ?? (pkg.credits + (pkg.bonus || 0)),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const order: Order = await response.json();
    return order;
  } catch (error) {
    console.error('Failed to create order:', error);
    throw new Error('创建订单失败，请稍后重试');
  }
}

/**
 * 查询订单状态
 */
export async function getOrderStatus(orderId: string): Promise<Order> {
  try {
    const visitorId = getVisitorId();
    const response = await fetch(
      `${API_BASE}/api/payment/order-status/${orderId}?visitorId=${encodeURIComponent(visitorId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const order: Order = await response.json();
    return order;
  } catch (error) {
    console.error('Failed to get order status:', error);
    throw new Error('查询订单状态失败');
  }
}

/**
 * 轮询订单状态
 * @param orderId 订单ID
 * @param onStatusChange 状态变化回调
 * @param maxAttempts 最大尝试次数
 * @param interval 轮询间隔（毫秒）
 */
export async function pollOrderStatus(
  orderId: string,
  onStatusChange: (order: Order) => void,
  maxAttempts: number = 60,
  interval: number = 2000
): Promise<Order> {
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const timer = setInterval(async () => {
      attempts++;

      try {
        const order = await getOrderStatus(orderId);
        onStatusChange(order);

        // 支付成功或失败，停止轮询
        if (
          order.status === OrderStatus.PAID ||
          order.status === OrderStatus.FAILED ||
          order.status === OrderStatus.EXPIRED
        ) {
          clearInterval(timer);
          resolve(order);
          return;
        }

        // 超过最大尝试次数
        if (attempts >= maxAttempts) {
          clearInterval(timer);
          reject(new Error('查询订单超时'));
        }
      } catch (error) {
        console.error('Poll order status error:', error);

        // 超过最大尝试次数
        if (attempts >= maxAttempts) {
          clearInterval(timer);
          reject(error);
        }
      }
    }, interval);
  });
}
