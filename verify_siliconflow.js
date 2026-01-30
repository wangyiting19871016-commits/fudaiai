// verify_siliconflow.js
// 这是一个最小化的测试脚本，用于物理验证 SiliconFlow API 的参数要求
// 不依赖任何项目代码，直接使用 fetch 发送请求

const API_KEY = 'sk-tpcfhwsckdrngcfeymudxjgnuhxadegbqzjztnakfceutvwy'; // 使用项目中 API_VAULT 的 Key
const ENDPOINT = 'https://api.siliconflow.cn/v1/images/generations';

const payload = {
    "model": "black-forest-labs/FLUX.1-dev",
    "prompt": "A 3D chibi clay style transformation of a cat, high detail",
    "image_size": "1024x1024",
    "num_inference_steps": 20,
    "guidance_scale": 7.5,
    "strength": 0.65, // 图生图关键参数
    // "image": "..." // 我们先测试文生图，看看是否通，如果文生图都报 Model not exist，那就是模型ID问题
};

console.log('正在发送测试请求...');
console.log('Endpoint:', ENDPOINT);
console.log('Payload:', JSON.stringify(payload, null, 2));

fetch(ENDPOINT, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
})
.then(async res => {
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));
})
.catch(err => {
    console.error('Fetch Error:', err);
});
