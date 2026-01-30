// verify_siliconflow_img2img.js
// 这是一个最小化的图生图测试脚本，用于定位 400 错误的具体参数原因
const fs = require('fs');
const path = require('path');

const API_KEY = 'sk-tpcfhwsckdrngcfeymudxjgnuhxadegbqzjztnakfceutvwy';
const ENDPOINT = 'https://api.siliconflow.cn/v1/images/generations';

// 创建一个极小的 1x1 红色像素 Base64 图片用于测试
const dummyImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

// 模拟 PayloadBuilder 构建出的最终 Payload
const payload = {
    "model": "black-forest-labs/FLUX.1-dev",
    "prompt": "A 3D chibi clay style transformation, high detail",
    "image_size": "1024x1024",
    "num_inference_steps": 20,
    "guidance_scale": 7.5,
    "strength": 0.65,
    // "image": dummyImage, // 测试点 1: 使用 image 字段
    "input_image": dummyImage // 测试点 2: 如果上面的失败，尝试这个字段
};

console.log('正在发送图生图测试请求...');
console.log('Endpoint:', ENDPOINT);
console.log('Payload Keys:', Object.keys(payload));

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
