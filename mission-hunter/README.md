# 小红书需求抓取工具

基于 Python 和 Playwright 开发的小红书需求抓取工具，用于从小红书平台抓取产品需求相关的帖子数据。

## 功能特点

- 🚀 **高效抓取**：基于 Playwright 实现高速、稳定的数据抓取
- 📋 **多种输出格式**：支持 JSON 和 CSV 格式输出
- 🎯 **精准提取**：提取帖子标题、内容、作者、点赞数、评论数、收藏数等信息
- 🧠 **智能模拟**：模拟人类行为，降低被反爬风险
- ⚙️ **灵活配置**：支持通过配置文件或环境变量进行灵活配置
- 📊 **数据可视化**：自动生成结构化数据，便于后续分析
- 📝 **完善日志**：详细的日志记录，便于调试和监控

## 项目结构

```
mission-hunter/
├── xiaohongshu_scraper.py  # 主程序文件
├── config.py               # 配置文件
├── init_playwright.py      # Playwright 初始化脚本
├── requirements.txt        # 项目依赖
├── README.md               # 项目文档
└── .env                    # 环境变量文件（可选）
```

## 安装步骤

### 1. 安装 Python 依赖

```bash
cd mission-hunter
pip install -r requirements.txt
```

### 2. 初始化 Playwright

运行以下脚本安装 Playwright 浏览器：

```bash
python init_playwright.py
```

## 配置选项

### 1. 通过配置文件配置

编辑 `config.py` 文件，可以修改以下配置项：

#### 浏览器配置
- `browser_type`：浏览器类型（chromium, firefox, webkit）
- `headless`：是否启用无头模式
- `window_width`、`window_height`：浏览器窗口大小
- `slow_mo`：慢速模式，用于调试
- `timeout`：页面加载超时时间
- `use_proxy`：是否启用代理
- `proxy_url`：代理地址

#### 抓取配置
- `search_keyword`：搜索关键词
- `max_items`：最大抓取数量
- `retry_times`：重试次数
- `request_interval`：请求间隔时间
- `simulate_human`：是否模拟人类行为
- `scroll_times`：滚动次数
- `scroll_wait_time`：每次滚动等待时间

#### 输出配置
- `output_format`：输出格式（json, csv）
- `output_file`：输出文件名称
- `append`：是否追加模式
- `print_to_console`：是否打印到控制台

#### 日志配置
- `log_level`：日志级别（DEBUG, INFO, WARNING, ERROR）
- `log_file`：日志文件路径
- `console_log`：是否启用控制台日志
- `file_log`：是否启用文件日志

### 2. 通过环境变量配置

创建 `.env` 文件，可以通过环境变量覆盖配置：

```env
# 浏览器配置
BROWSER__BROWSER_TYPE=chromium
BROWSER__HEADLESS=true

# 抓取配置
SCRAPER__SEARCH_KEYWORD=产品需求
SCRAPER__MAX_ITEMS=100

# 输出配置
OUTPUT__OUTPUT_FORMAT=json
```

## 使用方法

### 1. 基本使用

直接运行主程序，使用默认配置：

```bash
python xiaohongshu_scraper.py
```

### 2. 自定义关键词

在代码中修改 `search_keyword` 参数，或者通过环境变量配置：

```bash
# 通过环境变量设置关键词
set SCRAPER__SEARCH_KEYWORD=设计需求
python xiaohongshu_scraper.py
```

### 3. 高级用法

```python
from xiaohongshu_scraper import XiaohongshuScraper

# 创建抓取工具实例
scraper = XiaohongshuScraper()

# 运行抓取，指定关键词
scraper.run(keyword="产品需求")
```

## 输出示例

### JSON 格式

```json
[
  {
    "title": "产品经理必看！2024年最新产品需求分析",
    "content": "今天给大家分享一下2024年最新的产品需求趋势...",
    "author": "产品小王",
    "likes": "1234",
    "comments": "156",
    "collects": "890",
    "publish_time": "2024-01-05",
    "tags": ["产品需求", "产品经理", "2024趋势"],
    "link": "https://www.xiaohongshu.com/note/123456789",
    "crawl_time": "2024-01-07 10:00:00"
  }
]
```

### CSV 格式

| title | content | author | likes | comments | collects | publish_time | tags | link | crawl_time |
|-------|---------|--------|-------|----------|----------|--------------|------|------|------------|
| 产品经理必看！2024年最新产品需求分析 | 今天给大家分享一下2024年最新的产品需求趋势... | 产品小王 | 1234 | 156 | 890 | 2024-01-05 | 产品需求,产品经理,2024趋势 | https://www.xiaohongshu.com/note/123456789 | 2024-01-07 10:00:00 |

## 注意事项

1. **遵守法律法规**：请遵守相关法律法规，不要用于非法用途
2. **尊重平台规则**：不要过度抓取，避免对平台造成负担
3. **反爬机制**：小红书有反爬机制，建议合理设置抓取间隔
4. **数据隐私**：请尊重用户隐私，不要泄露抓取到的个人信息
5. **定期更新**：由于网站结构可能变化，需要定期更新抓取规则

## 常见问题

### 1. 抓取失败怎么办？

- 检查网络连接是否正常
- 检查浏览器是否正确安装
- 查看日志文件，分析具体错误原因
- 尝试调整浏览器配置，如禁用无头模式

### 2. 抓取的数据为空怎么办？

- 检查关键词是否正确
- 检查网站结构是否变化，可能需要更新抓取规则
- 尝试增加滚动次数和等待时间

### 3. 如何避免被反爬？

- 启用 `simulate_human` 选项
- 增加请求间隔时间
- 使用代理 IP
- 避免短时间内大量抓取

## 技术栈

- Python 3.8+
- Playwright：浏览器自动化
- Pydantic：数据验证
- Loguru：日志管理
- python-dotenv：环境变量管理
- BeautifulSoup4：HTML 解析

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

### v1.0.0
- 初始版本发布
- 实现基本的小红书需求抓取功能
- 支持 JSON 和 CSV 格式输出
- 支持灵活配置

## 联系方式

如有问题或建议，欢迎通过以下方式联系：

- 邮箱：example@example.com
- GitHub：https://github.com/example/xiaohongshu-scraper
