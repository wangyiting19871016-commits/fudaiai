#!/bin/bash

# ========================================
# 绂忚AI 涓€閿儴缃茶剼鏈?
# ========================================

set -e

echo "馃殌 寮€濮嬮儴缃茬琚婣I..."

# 1. 妫€鏌ョ幆澧?
echo "馃搵 妫€鏌ョ幆澧?.."
command -v node >/dev/null 2>&1 || { echo "鉂?Node.js鏈畨瑁?; exit 1; }
command -v pm2 >/dev/null 2>&1 || { echo "鉂?PM2鏈畨瑁?; exit 1; }
command -v ffmpeg >/dev/null 2>&1 || { echo "鉂?FFmpeg鏈畨瑁?; exit 1; }
echo "鉁?鐜妫€鏌ラ€氳繃"

# 2. 瀹夎渚濊禆
echo "馃摝 瀹夎渚濊禆..."
npm install

# 3. 妫€鏌ラ厤缃枃浠?
if [ ! -f ".env" ]; then
    echo "鈿狅笍  .env鏂囦欢涓嶅瓨鍦紝浠庢ā鏉垮鍒?.."
    cp .env.production .env
    echo "鈿狅笍  璇风紪杈?.env 鏂囦欢璁剧疆绠＄悊鍛樺瘑鐮侊紒"
    exit 1
fi

# 4. 鍒涘缓蹇呰鐩綍
echo "馃搧 鍒涘缓鐩綍..."
mkdir -p logs temp_processing downloads

# 5. 鍋滄鏃ц繘绋嬶紙濡傛灉瀛樺湪锛?
echo "馃洃 鍋滄鏃ц繘绋?.."
pm2 stop fudaiai-backend 2>/dev/null || true
pm2 delete fudaiai-backend 2>/dev/null || true

# 6. 鍚姩鏂拌繘绋?
echo "馃殌 鍚姩搴旂敤..."
pm2 start ecosystem.config.js --env production

# 7. 淇濆瓨PM2閰嶇疆
pm2 save

# 8. 鏄剧ず鐘舵€?
echo "鉁?閮ㄧ讲瀹屾垚锛?
pm2 status
pm2 logs fudaiai-backend --lines 20

echo ""
echo "馃摑 绠＄悊鍛戒护锛?
echo "  鏌ョ湅鏃ュ織: pm2 logs fudaiai-backend"
echo "  閲嶅惎搴旂敤: pm2 restart fudaiai-backend"
echo "  鏌ョ湅鐘舵€? pm2 status"

