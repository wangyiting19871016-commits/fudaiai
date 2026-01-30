// 清除P4LAB缓存脚本
// 在浏览器控制台运行此脚本

console.log('🧹 清除P4LAB缓存...');

// 1. 清除localStorage中的API插槽配置
localStorage.removeItem('api_slots_config');
console.log('✅ 已清除 api_slots_config');

// 2. 清除P4LAB相关的session storage
sessionStorage.removeItem('p4_lab_preview');
sessionStorage.removeItem('p4_lab_source');
console.log('✅ 已清除 session storage');

// 3. 刷新页面
console.log('🔄 正在刷新页面...');
location.reload();
