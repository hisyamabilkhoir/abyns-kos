"""Focused verification for AI Retention Advisor modal bug on /finance.

Run with: python3 /app/test_reports/retention_advisor_modal_iteration3.py
"""

import asyncio

from playwright.async_api import async_playwright


FRONTEND_URL = "https://abyns-demo.preview.emergentagent.com/finance"


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        try:
            await page.goto(FRONTEND_URL, wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(1000)
            print(f"Loaded: {page.url}")

            # Mandatory targeted error selector scan.
            error_text = await page.evaluate("""() => {
              const errorElements = Array.from(document.querySelectorAll('.error, [class*="error"], [id*="error"]'));
              return errorElements.map(el => el.textContent).join(", ");
            }""")
            print(f"Error text: {error_text or 'none'}")

            # If the app compiles, continue with the exact user flow.
            await page.get_by_text("Renewal Insights", exact=True).scroll_into_view_if_needed(timeout=15000)
            await page.get_by_test_id("ask-advisor-btn").click()
            await page.get_by_test_id("advisor-modal").wait_for(state="visible", timeout=5000)
            await page.wait_for_timeout(300)

            initial = await page.evaluate("""() => {
              const modal = document.querySelector('[data-testid="advisor-modal"]');
              const scroll = document.querySelector('.advisor-scroll');
              const grid = document.querySelector('.advisor-actions-grid');
              const analysis = document.querySelector('.advisor-analysis-card');
              return {
                modalVisible: !!modal,
                loaderLines: document.querySelectorAll('.advisor-loader-line').length,
                loaderText: document.body.innerText.includes('ABYNS AI sedang menganalisa data churn Anda...'),
                redError: document.body.innerText.includes('Gagal memuat analisa'),
                actionsBeforeAnalysis: !!(grid && analysis && (grid.compareDocumentPosition(analysis) & Node.DOCUMENT_POSITION_FOLLOWING)),
                maxHeight: modal ? getComputedStyle(modal).maxHeight : null,
                scrollOverflowY: scroll ? getComputedStyle(scroll).overflowY : null,
              };
            }""")
            print(f"Initial modal state: {initial}")

            for testid in [
                "advisor-run-exit_interview",
                "advisor-run-loyalty_program",
                "advisor-run-preventive_maintenance",
            ]:
                await page.get_by_test_id(testid).wait_for(state="visible", timeout=5000)
                print(testid, await page.get_by_test_id(testid).inner_text())

            await page.wait_for_function("""() => {
              const head = document.querySelector('.advisor-analysis-head');
              const body = document.querySelector('.advisor-analysis-body');
              return head && body && head.innerText.toLowerCase().includes('selesai') && body.innerText.trim().length > 30;
            }""", timeout=15000)
            print("AI analysis reached done state")

            await page.get_by_test_id("advisor-run-preventive_maintenance").click()
            await page.wait_for_selector('[data-testid="advisor-result-preventive_maintenance"]', state="visible", timeout=8000)
            print(await page.get_by_test_id("advisor-result-preventive_maintenance").inner_text())

            await page.get_by_test_id("advisor-close").click()
            await page.wait_for_selector('[data-testid="advisor-modal"]', state="detached", timeout=5000)
            print("Modal closed without overlay ghost")
        finally:
            await browser.close()


if __name__ == "__main__":
    asyncio.run(main())