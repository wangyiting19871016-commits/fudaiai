from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
import requests
from typing import List, Dict, Any, Tuple
from blueprint import load_config

BASE_DIR = Path(__file__).parent
CONFIG_PATH = BASE_DIR / "config.json"
REPORTS_DIR = BASE_DIR / "reports"
AUDITOR_PROTOCOL_PATH = BASE_DIR / "auditor_protocol.md"
MAX_THREADS = 2

def ensure_dirs():
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

def serper_search(query: str, config: Dict[str, Any]) -> List[str]:
    endpoint = config.get("SERPER_ENDPOINT", "")
    key = config.get("SERPER_API_KEY", "")
    payload = {"q": query, "num": 10}
    headers = {"X-API-KEY": key, "Content-Type": "application/json"}
    try:
        r = requests.post(endpoint, headers=headers, json=payload, timeout=20)
        if r.status_code != 200:
            return []
        data = r.json()
        links = []
        for section in ["organic", "news", "videos"]:
            items = data.get(section, [])
            for it in items:
                link = it.get("link") or it.get("url")
                if link:
                    links.append(link)
        return links
    except:
        return []

def firecrawl_markdown(url: str, config: Dict[str, Any]) -> Tuple[str, str]:
    endpoint = config.get("FIRECRAWL_ENDPOINT", "")
    key = config.get("FIRECRAWL_API_KEY", "")
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {"url": url, "formats": ["markdown"]}
    try:
        time.sleep(2)
        r = requests.post(endpoint, headers=headers, json=payload, timeout=30)
        if r.status_code != 200:
            return url, ""
        json_res = r.json()
        data_content = json_res.get("data", {})
        md = data_content.get("markdown") or data_content.get("content") or ""
        return url, md
    except:
        return url, ""

def gather_links(queries: List[str], config: Dict[str, Any], limit: int = 50) -> List[str]:
    links = []
    seen = set()
    with ThreadPoolExecutor(max_workers=MAX_THREADS) as ex:
        futures = [ex.submit(serper_search, q, config) for q in queries]
        for fut in as_completed(futures):
            res = fut.result()
            for link in res:
                if link not in seen:
                    seen.add(link)
                    links.append(link)
                if len(links) >= limit:
                    break
            if len(links) >= limit:
                break
    return links

def fetch_markdowns(urls: List[str], config: Dict[str, Any]) -> Dict[str, str]:
    out: Dict[str, str] = {}
    with ThreadPoolExecutor(max_workers=MAX_THREADS) as ex:
        futures = [ex.submit(firecrawl_markdown, u, config) for u in urls]
        for fut in as_completed(futures):
            url, md = fut.result()
            if md:
                out[url] = md
    return out

def truncate_join(md_map: Dict[str, str], per_doc: int = 4000, max_docs: int = 10) -> str:
    agg = []
    count = 0
    for u, m in md_map.items():
        if count >= max_docs:
            break
        agg.append(f"URL: {u}\n\n{m[:per_doc]}")
        count += 1
    return "\n\n---\n\n".join(agg)

def deepseek_table(text: str, protocol: str, config: Dict[str, Any]) -> str:
    endpoint = config.get("DEEPSEEK_ENDPOINT", "")
    route = config.get("DEEPSEEK_ROUTE", "")
    model = config.get("DEEPSEEK_MODEL", "")
    key = config.get("DEEPSEEK_API_KEY", "")
    url = endpoint.rstrip("/") + "/" + route.lstrip("/")
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    system_prompt = protocol + "\n\n请仅输出一个 Markdown 表格，列包含：方案名、实测成功率、下卡时间、是否需要实体资产、单次任务成本。尽量基于素材的可验证来源，信息不足时做保守估计并标注。"
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": text},
    ]
    payload = {"model": model, "messages": messages}
    try:
        r = requests.post(url, headers=headers, json=payload, timeout=60)
        if r.status_code != 200:
            return ""
        data = r.json()
        c = data.get("choices", [])
        if c and c[0].get("message", {}).get("content"):
            return c[0]["message"]["content"]
        return ""
    except:
        return ""

def make_queries() -> List[str]:
    phrases = [
        "Claude 支付 3DS 绕过",
        "无需信用卡 订阅 OpenAI 2026",
        "OCBC 激活时效",
    ]
    sites = ["site:v2ex.com", "site:reddit.com"]
    return [f"{p} {s}" for p in phrases for s in sites]

def main():
    print("🚀 深度渗透任务启动")
    ensure_dirs()
    config = load_config(CONFIG_PATH)
    print("✅ 配置加载完成")
    queries = make_queries()
    print(f"🔍 目标关键词: {queries}")
    links = gather_links(queries, config, limit=50)
    print(f"🔗 链接总数: {len(links)}")
    if not links:
        print("❌ 未发现任何链接")
        return
    filtered = [u for u in links if ("v2ex.com" in u) or ("reddit.com" in u)]
    if not filtered:
        print("❌ 未筛选到目标站点链接（v2ex/reddit）")
        return
    print(f"🕸️ 正在抓取内容 (线程: {MAX_THREADS})")
    md_map = fetch_markdowns(filtered, config)
    print(f"📄 抓取成功文档数: {len(md_map)}")
    if not md_map:
        print("❌ 未获取到任何网页内容")
        return
    protocol = (AUDITOR_PROTOCOL_PATH.read_text(encoding="utf-8") if AUDITOR_PROTOCOL_PATH.exists() else "")
    material = truncate_join(md_map, per_doc=4000, max_docs=10)
    print("🧠 正在生成可行性对比表")
    table = deepseek_table(material, protocol, config)
    if not table:
        print("❌ DeepSeek 返回为空")
        return
    out_path = REPORTS_DIR / "feasibility_table.md"
    out_path.write_text(table, encoding="utf-8")
    print(f"🏁 已输出: {out_path}")

if __name__ == "__main__":
    main()
