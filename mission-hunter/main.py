import time, json, requests
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

# 1. 物理隔离与环境
BASE_DIR = Path(__file__).parent
CONFIG = json.loads((BASE_DIR / "config.json").read_text(encoding="utf-8"))
REPORTS_DIR = BASE_DIR / "reports"
PROTOCOL = (BASE_DIR / "auditor_protocol.md").read_text(encoding="utf-8")

# 2. 战术工具：定向搜索与强制抓取
def fetch_intelligence(query, num=10):
    # 逻辑：只搜硬核社区 (V2EX, Reddit, GitHub, HuggingFace)
    site_filter = " (site:v2ex.com OR site:reddit.com OR site:github.com OR site:huggingface.co)"
    search_payload = {"q": query + site_filter, "num": num}
    search_res = requests.post(CONFIG["SERPER_ENDPOINT"],
                               headers={"X-API-KEY": CONFIG["SERPER_API_KEY"]},
                               json=search_payload).json()
    
    black = ["awesome", "list", "collection", "resource", "directory"]
    organic = search_res.get("organic", []) or []
    scored = []
    for it in organic:
        link = it.get("link") or ""
        title = (it.get("title") or "").lower()
        url_low = link.lower()
        if any(b in title or b in url_low for b in black):
            continue
        score = 0
        if "huggingface.co/spaces" in link:
            score += 10
        if "replicate.com" in link:
            score += 8
        if "github.com" in link:
            if "readme" in url_low or "#readme" in url_low:
                score += 7
            else:
                score += 4
        scored.append((score, link))
    scored.sort(reverse=True)
    links = [l for _, l in scored]
    results = []
    
    with ThreadPoolExecutor(max_workers=2) as ex:
        futures = {ex.submit(scrape_and_audit, link): link for link in links}
        for fut in as_completed(futures):
            res = fut.result()
            if res:
                results.append(res)
            time.sleep(1.5)
    return results


def scrape_and_audit(url):
    # 动作：抓取并强制要求提取多媒体链接
    scrape_payload = {"url": url, "formats": ["markdown", "links"]}
    r = requests.post(
        CONFIG["FIRECRAWL_ENDPOINT"],
        headers={"Authorization": f"Bearer {CONFIG['FIRECRAWL_API_KEY']}"},
        json=scrape_payload,
    )
    time.sleep(3)
    if r.status_code != 200:
        return None
    
    data_json = r.json().get("data", {}) or {}
    md_content = data_json.get("markdown", "") or ""
    text_low = md_content.lower()
    # 身份核验：非语音/音频直接判定为 INVALID_LEAD
    status = deepseek_validate(md_content, CONFIG)
    if status != "VALID_AUDIO":
        return {"status": "INVALID_LEAD", "url": url}
    raw_links = data_json.get("links") or []
    candidates = []
    for lk in raw_links:
        href = lk if isinstance(lk, str) else (lk.get("url") or "")
        text = "" if isinstance(lk, str) else (lk.get("text") or "")
        score = 0
        if any(k in (text or "").lower() for k in ["demo", "try", "live", "playground", "examples"]):
            score += 5
        if "huggingface.co/spaces" in href:
            score += 4
        if "github.com" in href and href.count("/") >= 4:  # repo
            score += 3
        if "youtube.com" in href or "youtu.be" in href:
            score += 2
        if score > 0:
            candidates.append((score, href))
    candidates.sort(reverse=True)
    preview = candidates[0][1] if candidates else ""
    if not preview:
        # 若为目录类但存在可用 Demo，则保留；否则废弃
        if any(x in text_low for x in ["awesome", "资源列表", "合集", "目录", "列表"]):
            return None
        if ("huggingface.co/spaces" in url) or ("github.com" in url):
            preview = url
    # 调用 DeepSeek 审计：只要真迹，不要总结
    audit_payload = {
        "model": CONFIG["DEEPSEEK_MODEL"],
        "messages": [
            {"role": "system", "content": PROTOCOL},
            {"role": "user", "content": f"素材来自: {url}\n\n内容: {md_content[:8000]}"},
        ],
    }
    audit_res = requests.post(
        f"{CONFIG['DEEPSEEK_ENDPOINT']}/chat/completions",
        headers={"Authorization": f"Bearer {CONFIG['DEEPSEEK_API_KEY']}"},
        json=audit_payload,
    ).json()
    audit_text = audit_res["choices"][0]["message"]["content"]
    problem = deepseek_explain(md_content, CONFIG)
    metrics = deepseek_metrics(md_content, CONFIG)
    return {"status": "VALID_AUDIO", "url": url, "preview": preview, "audit": audit_text, "problem": problem, "metrics": metrics}


def main():
    print("🚀 启动语音垂直实效收割...")
    REPORTS_DIR.mkdir(exist_ok=True)
    tasks = [
        {"query": "Fish-Speech 商业化实测 语音克隆 效果演示 site:v2ex.com", "category": "Fish-Speech"},
        {"query": "GPT-SoVITS 还原度 避坑指南 变现方案 site:reddit.com", "category": "GPT-SoVITS"},
        {"query": "ElevenLabs 替代品 开源 实时翻译 效果对比 site:huggingface.co", "category": "ElevenLabs 替代"},
    ]
    fallback_seeds = {
        "Fish-Speech": ["https://huggingface.co/spaces/fishaudio/fish-speech"],
        "GPT-SoVITS": ["https://github.com/RVC-Boss/GPT-SoVITS"],
        "ElevenLabs 替代": ["https://huggingface.co/spaces/Plachta/Realtime-TTS"]
    }
    
    items = []
    for t in tasks:
        print(f"📡 正在收割类目: {t['category']}")
        res = fetch_intelligence(t["query"], num=10)
        invalid = sum(1 for it in res if isinstance(it, dict) and it.get("status") == "INVALID_LEAD")
        valid = [it for it in res if isinstance(it, dict) and it.get("status") != "INVALID_LEAD"]
        if invalid >= 8 and len(valid) < 3:
            # 自动扩展搜索深度
            res = fetch_intelligence(t["query"], num=30)
            valid = [it for it in res if isinstance(it, dict) and it.get("status") != "INVALID_LEAD"]
        for it in res:
            if isinstance(it, dict):
                it["category"] = t["category"]
                if it.get("status") != "INVALID_LEAD":
                    items.append(it)
        if not any(x.get("category")==t["category"] for x in items):
            # 使用种子链接确保至少一条演示
            for u in fallback_seeds.get(t["category"], []):
                tmp = scrape_and_audit(u)
                if isinstance(tmp, dict):
                    tmp["category"] = t["category"]
                    if tmp.get("status") != "INVALID_LEAD":
                        items.append(tmp)
                    break
    
    date_str = time.strftime("%Y-%m-%d")
    title = f"AI 语音实效情报 {date_str} [Fish-Speech | GPT-SoVITS | ElevenLabs 替代]"
    def trunc(s, n=250):
        return s[:n]
    parts = []
    parts.append(f"---\nmarp: true\ntitle: {title}\n---\n# {title}\n\n收割条目：{len(items)}")
    for it in items:
        body1 = f"- 解决了什么: {trunc(it.get('problem',''), 200)}\n- 效果指标: {trunc(it.get('metrics',''), 40)}\n- 成品预览: {it['preview']}\n- 来源: {it['url']}"
        parts.append(f"---\n# {it['category']}\n\n{trunc(body1, 250)}")
        audit_txt = it.get("audit","")
        if audit_txt:
            # 分页展示审计内容，避免删减
            chunk = 240
            for i in range(0, len(audit_txt), chunk):
                parts.append(f"---\n## 审计细节\n\n{audit_txt[i:i+chunk]}")
    report_path = REPORTS_DIR / f"voice_intel_{int(time.time())}.md"
    report_path.write_text("\n".join(parts), encoding="utf-8")
    print(f"🏁 任务完成。报告见: {report_path}")
    if items:
        first = items[0]
        print(f"✅ 首条验证 | 解决了什么: {first.get('problem','')}")
        print(f"✅ 首条验证 | 成品链接: {first.get('preview','')}")
        print(f"✅ 首条验证 | 效果指标: {first.get('metrics','')}")

def deepseek_explain(text: str, config: dict) -> str:
    payload = {
        "model": config["DEEPSEEK_MODEL"],
        "messages": [
            {"role": "system", "content": f"{PROTOCOL}\n仅输出一句话，说明该项目解决了什么语音难题（如极速克隆、情感表达、实时翻译）。禁止使用形容词，必须具体、可验证。"},
            {"role": "user", "content": text[:6000]}
        ]
    }
    try:
        r = requests.post(f"{config['DEEPSEEK_ENDPOINT']}/chat/completions",
                          headers={"Authorization": f"Bearer {config['DEEPSEEK_API_KEY']}"},
                          json=payload, timeout=60)
        if r.status_code != 200:
            return ""
        js = r.json()
        return js.get("choices",[{}])[0].get("message",{}).get("content","")
    except:
        return ""

def deepseek_validate(text: str, config: dict) -> str:
    payload = {
        "model": config["DEEPSEEK_MODEL"],
        "messages": [
            {"role": "system", "content": "判断该素材是否属于语音/音频工具或方案。只返回两个词之一：VALID_AUDIO 或 INVALID_LEAD。"},
            {"role": "user", "content": text[:4000]}
        ]
    }
    try:
        r = requests.post(f"{config['DEEPSEEK_ENDPOINT']}/chat/completions",
                          headers={"Authorization": f"Bearer {config['DEEPSEEK_API_KEY']}"},
                          json=payload, timeout=40)
        if r.status_code != 200:
            return "INVALID_LEAD"
        js = r.json()
        out = js.get("choices",[{}])[0].get("message",{}).get("content","").strip().upper()
        return "VALID_AUDIO" if "VALID_AUDIO" in out else "INVALID_LEAD"
    except:
        return "INVALID_LEAD"

def deepseek_metrics(text: str, config: dict) -> str:
    payload = {
        "model": config["DEEPSEEK_MODEL"],
        "messages": [
            {"role": "system", "content": "仅提取一句具体效果指标（如延迟<100ms、3秒素材可复刻、实时性90fps）。禁止形容词。字数≤40。"},
            {"role": "user", "content": text[:4000]}
        ]
    }
    try:
        r = requests.post(f"{config['DEEPSEEK_ENDPOINT']}/chat/completions",
                          headers={"Authorization": f"Bearer {config['DEEPSEEK_API_KEY']}"},
                          json=payload, timeout=40)
        if r.status_code != 200:
            return ""
        js = r.json()
        return js.get("choices",[{}])[0].get("message",{}).get("content","").strip()
    except:
        return ""


if __name__ == "__main__":
    main()
