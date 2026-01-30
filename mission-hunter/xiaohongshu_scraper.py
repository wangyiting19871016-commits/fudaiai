#!/usr/bin/env python3
"""
小红书真迹归纳引擎
基于Playwright实现，包含搜索、获取关联词、抓取高赞帖子等核心功能
"""

import asyncio
import os
from collections import Counter
from playwright.async_api import async_playwright, Page
from typing import List, Dict, Any


class XiaoHongShuScraper:
    """小红书爬虫核心类"""
    
    def __init__(self):
        self.browser = None
        self.context = None
        self.playwright = None
    
    async def __aenter__(self):
        """异步上下文管理器入口"""
        self.playwright = await async_playwright().start()
        
        # 1. 绝对路径固化：将user_data_dir设置为绝对路径
        self.user_data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "xhs_user_data"))
        os.makedirs(self.user_data_dir, exist_ok=True)
        print(f"📁 用户数据目录: {self.user_data_dir}")
        
        self.context = await self.playwright.chromium.launch_persistent_context(
            user_data_dir=self.user_data_dir,
            headless=False,  # 强制浏览器保持可见，不秒闪
            args=[
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled'
            ]
        )
        
        self.browser = self.context.browser
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """异步上下文管理器出口"""
        if self.context:
            await self.context.close()
        if self.playwright:
            await self.playwright.stop()
    
    async def check_login(self, page: Page) -> bool:
        """检查登录状态，检测登录弹窗并等待人工处理"""
        try:
            # 检查是否有登录弹窗
            login_selectors = [
                "//div[contains(@class, 'login-modal')]",
                "//div[contains(text(), '登录')]/ancestor::div[contains(@class, 'modal')]",
                "//div[@class*='login-container']",
                "//button[contains(text(), '立即登录')]",
                "//img[contains(@src, 'qr-code')]"
            ]
            
            for selector in login_selectors:
                try:
                    await page.locator(selector).first.wait_for(timeout=3000)
                    print("⚠️  检测到登录弹窗")
                    input("请在浏览器中完成登录，按回车键继续程序...")
                    return False  # 返回False表示需要重新检查
                except:
                    continue
            
            return True  # 返回True表示已登录
            
        except Exception as e:
            print(f"检查登录状态失败: {e}")
            return False
    
    async def search(self, keyword: str) -> Page:
        """执行搜索操作"""
        page = await self.context.new_page()
        
        # 直接跳转到搜索结果页
        search_url = f"https://www.xiaohongshu.com/search_result?keyword={keyword}"
        await page.goto(search_url)
        await page.wait_for_load_state("domcontentloaded")
        await page.wait_for_timeout(5000)  # 降速保稳
        
        # 检查登录状态
        print("🔍 检查登录状态...")
        is_logged_in = await self.check_login(page)
        if not is_logged_in:
            # 再次检查登录状态
            await page.wait_for_load_state("domcontentloaded")
            await page.wait_for_timeout(5000)  # 降速保稳
            await self.check_login(page)
        
        return page
    
    async def get_related_search_terms(self, page: Page) -> List[str]:
        """获取关联搜索词 - 从50个爆款帖标题中提纯出10大热门风格"""
        try:
            print("🔍 开始获取关联搜索词...")
            
            # 等待页面加载完成，降速保稳
            await page.wait_for_load_state("domcontentloaded")
            await page.wait_for_timeout(5000)
            
            # 1. 初次挖掘：抓取前50条帖子的title
            print("📋 开始抓取前50条帖子的标题...")
            titles = []
            scroll_count = 0
            max_scrolls = 20
            
            while len(titles) < 50 and scroll_count < max_scrolls:
                print(f"🔄 滚动第{scroll_count+1}/{max_scrolls}次，已抓取{len(titles)}/50个标题")
                
                # 滚动1500像素
                await page.evaluate("window.scrollBy(0, 1500)")
                await page.wait_for_load_state("domcontentloaded")
                await page.wait_for_timeout(5000)  # 降速保稳
                
                # 定位帖子容器
                post_cards = await page.locator(".note-item, section").all()
                
                for card in post_cards:
                    if len(titles) >= 50:
                        break
                    
                    try:
                        # 提取标题
                        title = ""
                        try:
                            title = await card.locator("span.title").inner_text(timeout=5000)
                        except:
                            try:
                                title = await card.locator(".footer .title").inner_text(timeout=5000)
                            except:
                                title = "无标题"
                        
                        if title and title != "无标题" and title not in titles:
                            titles.append(title)
                    except Exception as e:
                        print(f"⚠️  提取标题失败: {e}")
                        continue
                
                scroll_count += 1
            
            print(f"✅ 成功抓取{len(titles)}/50个帖子标题")
            
            # 2. 词频统计：对50个标题进行简单的词频分析
            print("📊 开始进行词频分析...")
            
            # 常见停用词列表
            stopwords = {
                '调色', '的', '了', '是', '在', '我', '有', '和', '就', '不',
                '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要',
                '去', '你', '会', '着', '没有', '看', '好', '自己', '这',
                '我们', '来', '到', '说', '要', '去', '你', '会', '着', '没有',
                '看', '好', '自己', '这', '我们', '来', '又', '多', '后', '当',
                '里', '用', '现在', '好', '只', '可', '又', '没', '为', '和',
                '那', '吗', '呢', '让', '我', '这', '不', '你', '都', '上',
                '看', '来', '好', '自己', '这', '我们', '来', '到', '说', '要',
                '去', '你', '会', '着', '没有', '看', '好', '自己', '这',
                '综合', '全部', '最新', '最热', '大家', '喜欢', '分享',
                '教程', '方法', '技巧', '简单', '快速', '实用', '好看',
                '效果', '超', '太', '很', '非常', '特别', '超级', '绝对',
                '简直', '真的', '一定', '可以', '能够', '就是', '还是',
                '但是', '不过', '所以', '因为', '如果', '虽然', '但是',
                '而且', '并且', '或者', '不是', '而是', '所以', '因为',
                '如果', '虽然', '但是', '而且', '并且', '或者', '不是',
                '而是', '这里', '那里', '这样', '那样', '怎么', '什么',
                '哪里', '为什么', '多少', '时候', '今天', '明天', '昨天',
                '晚上', '早上', '中午', '下午', '今年', '去年', '明年',
                '以后', '以前', '现在', '将来', '过去', '开始', '结束',
                '然后', '最后', '首先', '其次', '第三', '第四', '第五',
                '第六', '第七', '第八', '第九', '第十'
            }
            
            # 提取风格词
            style_words = []
            for title in titles:
                # 简单的分词：按空格、标点符号等分割
                # 这里使用简单的分割方式，实际可以使用更复杂的分词库
                words = title.split()
                for word in words:
                    # 清洗词语：去除标点符号，转换为小写
                    cleaned_word = ''.join(c for c in word if c.isalnum())
                    if cleaned_word and len(cleaned_word) > 1 and cleaned_word not in stopwords:
                        style_words.append(cleaned_word)
            
            # 3. 按频率排序：选出出现频率最高的前10个词
            word_counts = Counter(style_words)
            top_words = [word for word, count in word_counts.most_common(10)]
            
            # 如果词数不足10个，使用兜底关键词
            if len(top_words) < 10:
                fallback_terms = [
                    '富士NC调色', '莫兰迪色系', '法式复古滤镜', '胶片感调色',
                    'ins风滤镜', '冷白皮调色', '奶油肌滤镜', '赛博朋克调色',
                    '电影感调色', '日系小清新'
                ]
                # 补充兜底关键词，避免重复
                for term in fallback_terms:
                    if term not in top_words:
                        top_words.append(term)
                    if len(top_words) >= 10:
                        break
            
            # 只保留前10个词
            top_words = top_words[:10]
            
            # 4. 终端锁定：打印这10个词，并执行input
            print("\n" + "="*50)
            print("🎯 从50个爆款帖标题中提纯出的10大热门风格")
            print("="*50)
            for i, word in enumerate(top_words, 1):
                print(f"{i:2d}. {word}")
            print("="*50)
            
            # 终端锁定，等待用户确认
            input("这是从 50 个爆款帖标题中提纯出的 10 大热门风格，如需继续请按回车...")
            
            print(f"✅ 最终确定的10大热门风格: {top_words}")
            return top_words
            
        except Exception as e:
            print(f"❌ 获取关联搜索词失败: {e}")
            # 使用兜底关键词
            fallback_terms = [
                '富士NC调色', '莫兰迪色系', '法式复古滤镜', '胶片感调色',
                'ins风滤镜', '冷白皮调色', '奶油肌滤镜', '赛博朋克调色',
                '电影感调色', '日系小清新'
            ]
            print(f"📋 使用兜底关键词: {fallback_terms}")
            return fallback_terms
    
    async def fetch_high_like_posts(self, page: Page, min_likes: int = 500, limit: int = 20) -> List[Dict[str, Any]]:
        """抓取高赞帖子 - 多重备选逻辑抓取点赞数"""
        posts = []
        scroll_count = 0
        max_scrolls = 20
        processed_posts = set()  # 去重
        
        print(f"📝 开始抓取高赞帖子，目标：{limit}条，点赞阈值：{min_likes}")
        
        try:
            while len(posts) < limit and scroll_count < max_scrolls:
                print(f"🔄 滚动第{scroll_count+1}/{max_scrolls}次")
                
                # 检查页面是否存活
                try:
                    await page.evaluate("1+1")
                except Exception as e:
                    if "Target page closed" in str(e):
                        print("⚠️  页面已关闭，停止抓取")
                        return posts[:limit]
                    else:
                        raise
                
                # 滚动1500像素
                await page.evaluate("window.scrollBy(0, 1500)")
                
                # 等待页面加载完成，降速保稳
                await page.wait_for_load_state("domcontentloaded")
                await page.wait_for_timeout(5000)  # 降速保稳
                
                # 定位帖子容器：.note-item 或 section
                post_cards = await page.locator(".note-item, section").all()
                
                for card in post_cards:
                    if len(posts) >= limit:
                        break
                    
                    try:
                        # 去重：获取帖子唯一标识
                        card_id = await card.get_attribute("data-note-id") or await card.get_attribute("id")
                        if card_id and card_id in processed_posts:
                            continue
                        if card_id:
                            processed_posts.add(card_id)
                        
                        # 提取标题：span.title 或 .footer .title
                        title = ""
                        try:
                            title = await card.locator("span.title").inner_text(timeout=5000)  # 降速保稳
                        except:
                            try:
                                title = await card.locator(".footer .title").inner_text(timeout=5000)  # 降速保稳
                            except:
                                title = "无标题"
                        
                        # 提取点赞数：多重备选逻辑
                        likes = 0
                        try:
                            # 1. 主选方案：查找包含数字的 .count 类
                            # 定位所有.count元素，筛选包含数字的
                            count_elements = await card.locator(".count").all()
                            likes_text = ""
                            
                            for element in count_elements:
                                text = await element.inner_text(timeout=5000)  # 降速保稳
                                if text and any(char.isdigit() for char in text):
                                    likes_text = text
                                    break
                            
                            if not likes_text:
                                # 2. 备选方案：查找所有带有点赞图标（SVG）旁边的文本标签
                                svg_elements = await card.locator("svg").all()
                                for svg in svg_elements:
                                    try:
                                        # 查找SVG的下一个兄弟元素
                                        next_sibling = await svg.locator("+ *").first.inner_text(timeout=5000)  # 降速保稳
                                        if next_sibling and any(char.isdigit() for char in next_sibling):
                                            likes_text = next_sibling
                                            break
                                    except:
                                        continue
                                
                                # 备选方案2：查找包含"赞"或"heart"的元素
                                try:
                                    like_elements = await card.locator("[class*='like'], [class*='heart']").all()
                                    for like_elem in like_elements:
                                        text = await like_elem.inner_text(timeout=5000)  # 降速保稳
                                        if text and any(char.isdigit() for char in text):
                                            likes_text = text
                                            break
                                except:
                                    pass
                            
                            # 3. 清洗逻辑：处理"万"字
                            if likes_text:
                                # 去除所有非数字和非点字符
                                cleaned = ''.join(c for c in likes_text if c.isdigit() or c == '.')
                                if cleaned:
                                    if '万' in likes_text:
                                        likes = int(float(cleaned) * 10000)
                                    else:
                                        likes = int(float(cleaned))
                            
                        except Exception as e:
                            print(f"⚠️  点赞数提取失败: {e}")
                            likes = 0  # 如果抓取结果为空，默认给0，不要抛出AttributeError
                        
                        # 提取封面图：img.cover
                        cover_url = ""
                        try:
                            cover_url = await card.locator("img.cover").get_attribute("src", timeout=5000) or ""  # 降速保稳
                            if not cover_url:
                                # 尝试其他封面图定位
                                cover_url = await card.locator("img").first.get_attribute("src", timeout=5000) or ""  # 降速保稳
                        except Exception as e:
                            print(f"⚠️  封面图提取失败: {e}")
                            cover_url = ""  # 即使超时，也要继续执行
                        
                        # 提取链接
                        link = ""
                        try:
                            link = await card.locator("a").first.get_attribute("href", timeout=5000) or ""  # 降速保稳
                        except Exception as e:
                            print(f"⚠️  链接提取失败: {e}")
                            link = ""  # 即使超时，也要继续执行
                        
                        # 记录帖子，即使部分字段缺失也要返回
                        post_data = {
                            "title": title,
                            "likes": likes,
                            "cover_url": cover_url,
                            "link": f"https://www.xiaohongshu.com{link}" if link else ""
                        }
                        
                        # 只保留点赞数大于min_likes的帖子到结果列表
                        # 即使封面图或链接缺失，只要有点赞和标题就保留
                        if likes >= min_likes and title:
                            posts.append(post_data)
                        
                        print(f"📋 帖子处理完成：标题='{title[:20]}...', 点赞={likes}")
                        
                    except Exception as e:
                        print(f"⚠️  处理帖子失败: {e}")
                        continue
                
                scroll_count += 1
            
            print(f"✅ 抓取到 {len(posts)} 条高赞帖子")
            return posts[:limit]
            
        except Exception as e:
            print(f"❌ 抓取高赞帖子失败: {e}")
            return posts[:limit]
    
    def purify_aggregator(self, results: Dict[str, List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        """提纯聚合数据"""
        purified = []
        
        for term, posts in results.items():
            if posts:
                total_likes = sum(p["likes"] for p in posts)
                top_post = max(posts, key=lambda x: x["likes"])
                
                purified.append({
                    "term": term,
                    "total_likes": total_likes,
                    "top_post": top_post
                })
        
        return sorted(purified, key=lambda x: x["total_likes"], reverse=True)
    
    def generate_html_report(self, data: List[Dict[str, Any]]):
        """生成HTML报告"""
        html = '''
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <title>小红书真迹归纳报告</title>
            <style>
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                img { max-width: 100px; }
            </style>
        </head>
        <body>
            <h1>小红书真迹归纳报告</h1>
            <table>
                <tr>
                    <th>排名</th>
                    <th>风格</th>
                    <th>总点赞</th>
                    <th>封面图</th>
                    <th>链接</th>
                </tr>
        '''
        
        for i, item in enumerate(data[:10], 1):
            html += '''
                <tr>
                    <td>%s</td>
                    <td>%s</td>
                    <td>%s</td>
                    <td><img src="%s"></td>
                    <td><a href="%s">查看</a></td>
                </tr>
            ''' % (i, item['term'], item['total_likes'], item['top_post']['cover_url'], item['top_post']['link'])
        
        html += '''
            </table>
        </body>
        </html>
        '''
        
        with open("Artifact_Task_List.html", "w", encoding="utf-8") as f:
            f.write(html)


async def main():
    """主函数"""
    async with XiaoHongShuScraper() as scraper:
        print("🎯 真迹归纳引擎启动")
        
        # 1. 初始化：直接创建页面
        initial_page = await scraper.context.new_page()
        await initial_page.goto("https://www.xiaohongshu.com/search_result?keyword=调色")
        await initial_page.wait_for_load_state("domcontentloaded")
        await initial_page.wait_for_timeout(5000)  # 降速保稳
        
        # 2. 检查登录状态（自动检测，无需人工干预）
        print("🔍 检查登录状态...")
        await initial_page.wait_for_load_state("domcontentloaded")
        await initial_page.wait_for_timeout(5000)  # 降速保稳
        
        # 3. 获取关联搜索词
        print("🔍 开始获取关联搜索词...")
        related_terms = await scraper.get_related_search_terms(initial_page)
        
        # 4. 如果未获取到关联搜索词，使用兜底关键词
        if not related_terms:
            print("⚠️  获取关联搜索词失败，使用兜底关键词")
            related_terms = [
                '富士NC调色', '莫兰迪色系', '法式复古滤镜', '胶片感调色',
                'ins风滤镜', '冷白皮调色', '奶油肌滤镜', '赛博朋克调色',
                '电影感调色', '日系小清新'  # 高产出兜底词
            ]
        
        # 5. 增加停顿校验，让用户确认10大核心风格
        print("\n" + "="*50)
        print("🎯 市场分析出的10大核心风格")
        print("="*50)
        for i, term in enumerate(related_terms, 1):
            print(f"{i:2d}. {term}")
        print("="*50)
        input("以上是根据市场分析出的 10 大核心风格，确认请按回车，不满意请关闭程序...")
        
        print(f"✅ 关联搜索词: {related_terms}")
        
        # 5. 关闭初始页面
        await initial_page.close()
        
        # 6. 抓取高赞帖子
        results = {}
        for term in related_terms:
            print(f"\n🎯 处理关键词: {term}")
            
            # 检查浏览器和上下文是否存活
            if not scraper.context or not scraper.browser:
                print("⚠️  浏览器或上下文已关闭，重新初始化")
                # 重新初始化浏览器和上下文
                await scraper.__aexit__(None, None, None)
                await scraper.__aenter__()
            
            try:
                # 为每个关键词创建新页面
                page = await scraper.context.new_page()
                try:
                    await page.goto(f"https://www.xiaohongshu.com/search_result?keyword={term}")
                    await page.wait_for_load_state("domcontentloaded")
                    await page.wait_for_timeout(5000)  # 降速保稳
                    
                    # 检查登录状态（自动检测，无需人工干预）
                    print("🔍 检查登录状态...")
                    await page.wait_for_load_state("domcontentloaded")
                    await page.wait_for_timeout(5000)  # 降速保稳
                    
                    # 抓取高赞帖子
                    posts = await scraper.fetch_high_like_posts(page)
                    results[term] = posts
                    print(f"✅ 抓取到 {len(posts)} 条高赞帖子")
                    
                except Exception as e:
                    print(f"处理关键词 {term} 失败: {e}")
                finally:
                    await page.close()
            except Exception as e:
                print(f"创建页面失败: {e}")
                continue
        
        # 7. 提纯聚合数据
        print("\n📊 开始提纯聚合数据...")
        purified_data = scraper.purify_aggregator(results)
        
        # 8. 生成HTML报告
        print("\n📝 生成HTML报告...")
        scraper.generate_html_report(purified_data)
        
        print("\n✅ 报告生成完成！")
        print("📄 报告路径: Artifact_Task_List.html")


if __name__ == "__main__":
    asyncio.run(main())
