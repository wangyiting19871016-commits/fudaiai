export const API_VAULT = {
  N1N: {
    BASE_URL: 'https://api.n1n.ai/v1',
    MASTER_KEY: 'sk-tTHj1OFcBEgEEQ8oi3kkKUHpjpluQzo0ySRZ8o8vY5EX68fN' // [NEW] n1n Ultimate Key
  },
  SILICONFLOW: {
    BASE_URL: 'https://api.siliconflow.cn/v1',
    MASTER_KEY: 'sk-tpcfhwsckdrngcfeymudxjgnuhxadegbqzjztnakfceutvwy', // 从指令中获取的密钥
    DEFAULT_ENDPOINT: '/images/generations'
  },
  LIBLIB: {
    BASE_URL: 'https://api.liblibai.com/api/www/v1',
    ACCESS_KEY: 'z8_g6KeL5Vac48fUL6am2A',
    SECRET_KEY: 'FbPajEW5edStMVxBJuRUDu7fwr1Hy5Up'
  },
  FISH_AUDIO: {
    BASE_URL: '/api/fish/v1',
    API_KEY: '58864427d9e44e4ca76febe5b50639e6'
  },
  QWEN: {
    MASTER_KEY: import.meta.env.VITE_DASHSCOPE_API_KEY // 动态读取 .env 环境变量
  }
};
