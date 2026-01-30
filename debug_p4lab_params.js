// P4LAB参数检查与修复脚本
// 在浏览器Console中运行

console.log('🔍 开始诊断P4LAB参数问题...\n');

// 1. 检查localStorage配置
try {
    const config = JSON.parse(localStorage.getItem('api_slots_config') || '{}');
    console.log('📦 当前配置:', config);
    
    // 2. 查找Liblib插槽
    const liblibSlot = config.slots?.find(s => s.id === 'liblib-controlnet');
    
    if (!liblibSlot) {
        console.error('❌ 未找到Liblib插槽！');
        console.log('🔧 执行修复: 清除配置并刷新');
        localStorage.removeItem('api_slots_config');
        location.reload();
        throw new Error('配置损坏，已自动修复');
    }
    
    console.log('✅ Liblib插槽存在:', liblibSlot.name);
    
    // 3. 检查FLUX配置
    const fluxConfig = liblibSlot.modelOverrides?.['liblib-flux-dev'];
    
    if (!fluxConfig) {
        console.error('❌ FLUX配置缺失！');
        localStorage.removeItem('api_slots_config');
        location.reload();
        throw new Error('FLUX配置缺失，已自动修复');
    }
    
    console.log('✅ FLUX配置存在');
    console.log('📋 参数数量:', fluxConfig.params_schema?.length || 0);
    
    // 4. 检查LoRA参数
    const loraUuidParam = fluxConfig.params_schema?.find(p => p.id === 'lora_uuid');
    const loraWeightParam = fluxConfig.params_schema?.find(p => p.id === 'lora_weight');
    
    console.log('✅ LoRA UUID参数:', loraUuidParam ? '存在' : '❌ 缺失');
    console.log('✅ LoRA Weight参数:', loraWeightParam ? '存在' : '❌ 缺失');
    
    if (!loraUuidParam || !loraWeightParam) {
        console.error('\n❌ LoRA参数缺失！需要清除缓存重新加载');
        console.log('🔧 执行修复...');
        localStorage.removeItem('api_slots_config');
        location.reload();
    } else {
        console.log('\n✅ 所有检查通过！');
        console.log('📝 完整参数列表:');
        fluxConfig.params_schema.forEach((p, i) => {
            console.log(`  ${i+1}. ${p.name} (${p.id})`);
        });
    }
    
} catch (e) {
    console.error('检查过程中出错:', e.message);
}
