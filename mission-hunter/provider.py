from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from playwright.async_api import async_playwright
import html2text

app = FastAPI()

class ScrapeRequest(BaseModel):
    url: str

@app.post("/scrape")
async def scrape(request: ScrapeRequest):
    """
    Simulates Crawl4AI scraping using Playwright directly.
    Returns: {"data": {"markdown": "...", "links": [...]}}
    """
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            # Use a realistic user agent
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            )
            page = await context.new_page()
            
            # Navigate
            try:
                await page.goto(request.url, timeout=30000, wait_until="domcontentloaded")
                # Wait a bit for dynamic content if needed, or rely on domcontentloaded
                # await page.wait_for_timeout(2000) 
            except Exception as e:
                await browser.close()
                raise HTTPException(status_code=400, detail=f"Failed to load page: {str(e)}")

            # Get content
            html_content = await page.content()
            
            # Extract links
            links = await page.evaluate("""
                () => Array.from(document.querySelectorAll('a')).map(a => ({
                    url: a.href,
                    text: a.innerText
                }))
            """)
            
            await browser.close()
            
            # Convert to Markdown
            h = html2text.HTML2Text()
            h.ignore_links = False
            h.ignore_images = False
            h.body_width = 0 # No wrap
            markdown = h.handle(html_content)
            
            # Return in structure similar to Crawl4AI/Firecrawl response
            return {
                "success": True,
                "data": {
                    "markdown": markdown,
                    "links": links
                }
            }

    except Exception as e:
        # Check if browser is closed? Playwright context manager handles it usually.
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("🚀 Starting Provider Service on http://127.0.0.1:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
