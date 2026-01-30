from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
from typing import List, Dict, Any

MAX_THREADS = 8
CONFIG_PATH = Path(__file__).parent / "config.json"

def load_config(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)

SEARCH_DIMENSIONS: List[Dict[str, Any]] = [
    {"id": "zero-code_tools", "title": "零代码工具与Agent集成"},
    {"id": "workflow_orchestration", "title": "工作流编排与自动化"},
    {"id": "enterprise_cases", "title": "企业落地案例与治理"},
    {"id": "cost_risk_control", "title": "成本优化与风控策略"},
    {"id": "cn_access_payments", "title": "中国用户可达性与支付替代"}
]

def build_queries(dimensions: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    return [{"dimension": d["id"], "query": d["title"]} for d in dimensions]

def call_serper(query: str, config: Dict[str, Any]) -> Dict[str, Any]:
    return {"provider": "serper", "query": query}

def call_firecrawl(query: str, config: Dict[str, Any]) -> Dict[str, Any]:
    return {"provider": "firecrawl", "query": query}

def run_parallel(queries: List[Dict[str, str]], config: Dict[str, Any]) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []
    with ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
        futures = []
        for item in queries:
            q = item["query"]
            futures.append(executor.submit(call_serper, q, config))
            futures.append(executor.submit(call_firecrawl, q, config))
        for fut in as_completed(futures):
            results.append(fut.result())
    return results

def scaffold_lead(raw: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "lead_id": "",
        "revision": 0,
        "created_at": "",
        "updated_at": "",
        "origin": {
            "source_type": "web_api",
            "provider": raw.get("provider", ""),
            "endpoint": "",
            "url": "",
            "request": {"method": "GET"}
        },
        "evidence": {
            "raw_payload": raw,
            "content_type": "application/json"
        },
        "protocol_snapshot": {
            "io_schema": {"inputType": "url", "outputType": "json"},
            "params_schema": [
                {"id": "url", "name": "目标页面URL", "type": "string", "required": True},
                {"id": "expand", "name": "展开引用与媒体", "type": "boolean"},
                {"id": "include_media", "name": "包含媒体元数据", "type": "boolean"},
                {"id": "sanitize_level", "name": "文本清洗级别", "type": "string"}
            ]
        },
        "input_params": {},
        "scoring": {
            "freshness": 0.0,
            "uniqueness": 0.0,
            "actionability": 0.0,
            "verifiability": 0.0,
            "protocol_fit": 0.0
        },
        "assets": [],
        "lifecycle": {"status": "new", "history": []},
        "compliance": {"auth_type": "api_key"},
        "tags": [],
        "annotations": [],
        "extensions": {}
    }

def build_marp_markdown(slides: List[Dict[str, Any]]) -> str:
    head = "---\nmarp: true\ntheme: default\npaginate: true\n---\n"
    pages = []
    for s in slides:
        page = [
            f"# {s.get('title','')}",
            "",
            f"**核心结论**",
            s.get("conclusion", ""),
            "",
            f"**证据来源（URL 摘要）**",
            s.get("sources", ""),
            "",
            f"**复利评分**",
            s.get("score", ""),
            "",
            f"**可执行下一步**",
            s.get("next_step", "")
        ]
        pages.append("\n".join(page))
    return head + "\n---\n".join(pages)

