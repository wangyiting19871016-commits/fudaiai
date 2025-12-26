import { useState, useEffect } from 'react';

export const useCreditSystem = (initialCredit = 896) => {
  // 1. 初始化逻辑：先看浏览器存没存，没存用初始值
  const [credit, setCredit] = useState(() => {
    // 这里的 typeof window 检查是防止在某些环境下报错，非常稳
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_credit_score');
      return saved ? parseInt(saved, 10) : initialCredit;
    }
    return initialCredit;
  });

  // 2. 最近信用分变化，用于动画提示
  const [recentCreditChange, setRecentCreditChange] = useState(0);

  // 3. 等级计算逻辑：每 100 分一档
  const level = Math.floor(credit / 100);

  // 4. 存档逻辑：只要 credit 变了，就自动存进硬盘
  useEffect(() => {
    localStorage.setItem('user_credit_score', credit.toString());
  }, [credit]);

  // 5. 加分动作
  const addCredit = (amount: number) => {
    setCredit(prev => prev + amount);
    setRecentCreditChange(amount);
    
    // 重置最近变化，避免动画一直显示
    setTimeout(() => {
      setRecentCreditChange(0);
    }, 1000);
  };

  return { credit, level, addCredit, recentCreditChange };
};