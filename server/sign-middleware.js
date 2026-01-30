/**
 * LiblibAI 签名中间件
 * 用于移动端HTTP环境下计算HMAC-SHA1签名
 */
const crypto = require('crypto');

module.exports = function signMiddleware() {
  return {
    name: 'liblib-sign-middleware',
    configureServer(server) {
      server.middlewares.use('/api/sign-liblib', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', () => {
          try {
            const { secret, message } = JSON.parse(body);

            if (!secret || !message) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing secret or message' }));
              return;
            }

            // 使用Node.js原生crypto计算HMAC-SHA1
            const hmac = crypto.createHmac('sha1', secret);
            hmac.update(message);
            const signature = hmac.digest('base64')
              .replace(/\+/g, '-')
              .replace(/\//g, '_')
              .replace(/=+$/g, '');

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ signature }));
          } catch (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: error.message }));
          }
        });
      });
    }
  };
};
