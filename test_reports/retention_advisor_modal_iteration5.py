"""Focused Playwright test for /finance AI Retention Advisor modal bug."""

async def run(page):
    await page.set_viewport_size({"width": 1440, "height": 900})
    results = {}
    await page.goto("http://localhost:3000/finance", wait_until="domcontentloaded")
    await page.wait_for_timeout(1200)
    await page.get_by_test_id("ask-advisor-btn").click()
    modal = page.get_by_test_id("advisor-modal")
    await modal.wait_for(state="visible", timeout=5000)
    results["modal_visible"] = True
    try:
        await page.locator(".advisor-loader-line").first.wait_for(state="visible", timeout=500)
        results["loader_visible_within_500ms"] = True
    except Exception:
        results["loader_visible_within_500ms"] = False
    results["error_text_initial"] = await page.evaluate("""() => {
      const errorElements = Array.from(document.querySelectorAll('.error, [class*="error"], [id*="error"]'));
      return errorElements.map(el => el.textContent).join(', ');
    }""")
    results["red_failure_text_initial"] = await page.locator("text=Gagal memuat analisa").count()
    results["dom_order_actions_before_analysis"] = await page.evaluate("""() => {
      const scroll = document.querySelector('.advisor-scroll');
      const actions = document.querySelector('.advisor-actions-grid');
      const analysis = document.querySelector('.advisor-analysis-card');
      return !!scroll && !!actions && !!analysis && actions.compareDocumentPosition(analysis) === Node.DOCUMENT_POSITION_FOLLOWING;
    }""")
    for tid in ["advisor-run-exit_interview", "advisor-run-loyalty_program", "advisor-run-preventive_maintenance"]:
        results[f"{tid}_visible"] = await page.get_by_test_id(tid).is_visible()
    results["initial_geometry"] = await page.evaluate("""() => {
      const modal = document.querySelector('[data-testid="advisor-modal"]');
      const close = document.querySelector('[data-testid="advisor-close"]');
      const done = document.querySelector('[data-testid="advisor-done"]');
      const scroll = document.querySelector('.advisor-scroll');
      const m = modal.getBoundingClientRect();
      const c = close.getBoundingClientRect();
      const d = done.getBoundingClientRect();
      return {
        viewportH: window.innerHeight,
        modalTop: m.top, modalBottom: m.bottom, modalHeight: m.height,
        closeTop: c.top, closeBottom: c.bottom,
        doneTop: d.top, doneBottom: d.bottom,
        bodyScrollY: window.scrollY,
        internalScrollHeight: scroll.scrollHeight, internalClientHeight: scroll.clientHeight,
        modalOverflowY: getComputedStyle(modal).overflowY,
        modalMaxHeight: getComputedStyle(modal).maxHeight,
        advisorScrollFlex: getComputedStyle(scroll).flex,
        advisorScrollOverflowY: getComputedStyle(scroll).overflowY
      };
    }""")
    await page.locator(".advisor-scroll").evaluate("el => { el.scrollTop = el.scrollHeight; }")
    await page.wait_for_timeout(200)
    results["after_internal_scroll_geometry"] = await page.evaluate("""() => {
      const modal = document.querySelector('[data-testid="advisor-modal"]');
      const close = document.querySelector('[data-testid="advisor-close"]');
      const done = document.querySelector('[data-testid="advisor-done"]');
      const scroll = document.querySelector('.advisor-scroll');
      const m = modal.getBoundingClientRect();
      const c = close.getBoundingClientRect();
      const d = done.getBoundingClientRect();
      return {
        viewportH: window.innerHeight,
        modalBottom: m.bottom,
        closeTop: c.top, closeBottom: c.bottom,
        doneTop: d.top, doneBottom: d.bottom,
        bodyScrollY: window.scrollY,
        scrollTop: scroll.scrollTop,
        internalScrollHeight: scroll.scrollHeight, internalClientHeight: scroll.clientHeight
      };
    }""")
    try:
        await page.locator(".advisor-analysis-head").get_by_text("selesai", exact=True).wait_for(state="visible", timeout=20000)
        results["stream_done_visible"] = True
    except Exception:
        results["stream_done_visible"] = False
    analysis_text = await page.locator(".advisor-analysis-body").inner_text(timeout=5000)
    results["analysis_text_length"] = len(analysis_text.strip())
    results["analysis_text_excerpt"] = analysis_text.strip()[:300]
    await page.locator(".advisor-scroll").evaluate("el => { el.scrollTop = 0; }")
    await page.wait_for_timeout(200)
    await page.get_by_test_id("advisor-run-preventive_maintenance").click()
    try:
        await page.get_by_test_id("advisor-result-preventive_maintenance").wait_for(state="visible", timeout=5000)
        results["preventive_success_visible"] = True
        results["preventive_result_text"] = await page.get_by_test_id("advisor-result-preventive_maintenance").inner_text()
    except Exception:
        results["preventive_success_visible"] = False
    await page.get_by_test_id("advisor-close").click()
    try:
        await modal.wait_for(state="detached", timeout=5000)
        results["modal_closed"] = True
    except Exception:
        results["modal_closed"] = False
    print("RETENTION_ADVISOR_RESULTS", results)