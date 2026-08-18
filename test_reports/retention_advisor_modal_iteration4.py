"""
Focused verification plan for user bug:
- Bug: AI Retention Advisor modal buttons must move to the top, AI analysis card below,
  loading must show a loader instead of early red error, and modal layout must not break/overflow.
- Flow: /finance -> Renewal Insights -> PERLU PERHATIAN -> Tanya ABYNS AI -> advisor modal.
- Proof needed: build succeeds; modal opens; loader visible within 500ms; action grid appears before
  analysis card in DOM; 3 action buttons visible; AI stream completes with on-topic text and green
  selesai status; preventive maintenance action returns success; modal middle content scrolls while
  header/footer stay visible; close button removes modal.
- Skills loaded before this plan: ai-testing-core, ai-testing-llm.
- No relevant separate domain testing skill beyond AI LLM skills was needed.

This file mirrors the Playwright steps executed through the browser automation tool.
"""

import json


async def run(page):
    results = {}
    failures = []

    try:
        await page.set_viewport_size({"width": 1440, "height": 900})

        network_events = []

        def on_response(response):
            url = response.url
            if "/api/v1/ai/retention-advisor" in url or "/api/v1/advisor/actions/" in url:
                network_events.append({"url": url, "status": response.status})

        page.on("response", on_response)

        await page.goto("http://localhost:3000/finance", wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_selector("[data-testid='ask-advisor-btn']", timeout=15000)
        await page.locator("[data-testid='ask-advisor-btn']").scroll_into_view_if_needed()
        await page.locator("[data-testid='ask-advisor-btn']").click(force=True)
        await page.wait_for_selector("[data-testid='advisor-modal']", timeout=5000)
        await page.wait_for_timeout(200)

        loader_count = await page.locator(".advisor-loader-line").count()
        loader_text_visible = await page.get_by_text(
            "ABYNS AI sedang menganalisa data churn Anda", exact=False
        ).is_visible()
        early_error_visible = await page.get_by_text("Gagal memuat analisa", exact=False).is_visible()
        results["loader_within_500ms"] = {
            "loader_line_count": loader_count,
            "loader_text_visible": loader_text_visible,
            "early_error_visible": early_error_visible,
        }
        if loader_count < 1 or not loader_text_visible or early_error_visible:
            failures.append("Loader was not visible within 500ms or early red error appeared")

        dom_order_ok = await page.evaluate(
            """() => {
                const scroll = document.querySelector('.advisor-scroll');
                const actions = scroll?.querySelector('.advisor-actions-grid');
                const analysis = scroll?.querySelector('.advisor-analysis-card');
                return !!(actions && analysis && (actions.compareDocumentPosition(analysis) & Node.DOCUMENT_POSITION_FOLLOWING));
            }"""
        )
        results["dom_order_actions_before_analysis"] = dom_order_ok
        if not dom_order_ok:
            failures.append("advisor-actions-grid is not before advisor-analysis-card in DOM")

        for testid in [
            "advisor-run-exit_interview",
            "advisor-run-loyalty_program",
            "advisor-run-preventive_maintenance",
        ]:
            visible = await page.locator(f"[data-testid='{testid}']").is_visible()
            results[testid] = visible
            if not visible:
                failures.append(f"Missing or hidden action button: {testid}")

        await page.wait_for_function(
            """() => {
                const body = document.querySelector('.advisor-analysis-body');
                const head = document.querySelector('.advisor-analysis-head');
                return body && body.innerText.trim().length > 80 && head && /selesai/i.test(head.innerText);
            }""",
            timeout=15000,
        )
        analysis_text = await page.locator(".advisor-analysis-body").inner_text()
        done_text = await page.locator(".advisor-analysis-head").inner_text()
        results["analysis_done"] = {
            "analysis_length": len(analysis_text.strip()),
            "analysis_excerpt": analysis_text.strip()[:500],
            "head_text": done_text.strip(),
            "on_topic_terms": {
                term: (term.lower() in analysis_text.lower())
                for term in ["DIAGNOSA", "TINDAKAN", "TARGET", "retention"]
            },
        }

        await page.locator("[data-testid='advisor-run-preventive_maintenance']").click(force=True)
        await page.wait_for_selector("[data-testid='advisor-result-preventive_maintenance']", timeout=5000)
        preventive_result = await page.locator("[data-testid='advisor-result-preventive_maintenance']").inner_text()
        results["preventive_action"] = preventive_result.strip()
        if "tugas dibuat" not in preventive_result.lower():
            failures.append("Preventive maintenance success result did not show expected text")

        scroll_info = await page.evaluate(
            """() => {
                const modal = document.querySelector('[data-testid="advisor-modal"]');
                const scroll = document.querySelector('.advisor-scroll');
                const header = modal?.firstElementChild;
                const footer = modal?.lastElementChild;
                const visible = (el) => {
                    if (!el) return false;
                    const r = el.getBoundingClientRect();
                    return r.top >= 0 && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= window.innerWidth;
                };
                const before = {
                    scrollHeight: scroll?.scrollHeight,
                    clientHeight: scroll?.clientHeight,
                    overflowY: scroll ? getComputedStyle(scroll).overflowY : null,
                    headerVisible: visible(header),
                    footerVisible: visible(footer),
                    modalBottom: modal?.getBoundingClientRect().bottom,
                    viewportHeight: window.innerHeight,
                };
                if (scroll) scroll.scrollTop = scroll.scrollHeight;
                const after = {
                    scrollTop: scroll?.scrollTop,
                    headerVisible: visible(header),
                    footerVisible: visible(footer),
                    modalBottom: modal?.getBoundingClientRect().bottom,
                    viewportHeight: window.innerHeight,
                };
                return {before, after};
            }"""
        )
        results["scroll_layout"] = scroll_info
        before = scroll_info["before"]
        after = scroll_info["after"]
        if before["overflowY"] not in ["auto", "scroll"]:
            failures.append("advisor-scroll is not configured with internal scrolling")
        if before["scrollHeight"] <= before["clientHeight"]:
            failures.append("advisor-scroll did not have scrollable overflow during test")
        if not (before["headerVisible"] and before["footerVisible"] and after["headerVisible"] and after["footerVisible"]):
            failures.append("Modal header/footer were not visible before and after middle-content scroll")
        if before["modalBottom"] > before["viewportHeight"] + 1 or after["modalBottom"] > after["viewportHeight"] + 1:
            failures.append("Modal overflowed past viewport")

        await page.locator("[data-testid='advisor-close']").click(force=True)
        await page.wait_for_selector("[data-testid='advisor-modal']", state="detached", timeout=5000)
        results["modal_closed"] = True

        error_text = await page.evaluate(
            """() => {
                const errorElements = Array.from(document.querySelectorAll('.error, [class*="error"], [id*="error"]'));
                return errorElements.map(el => el.textContent).join(", ");
            }"""
        )
        results["error_text_after_close"] = error_text
        results["network_events"] = network_events

        return {"ok": len(failures) == 0, "failures": failures, "results": results}
    except Exception as exc:
        results["exception"] = repr(exc)
        return {"ok": False, "failures": failures + [repr(exc)], "results": results}


if __name__ == "__main__":
    print(json.dumps({"note": "Run this with Playwright page fixture / browser automation tool."}, indent=2))