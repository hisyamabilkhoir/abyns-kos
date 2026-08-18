"""Backend tests for ABYNS KOS API (v1)."""
import os
import json
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://abyns-demo.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api/v1"


# ----- Health -----
def test_health():
    r = requests.get(f"{API}/health", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data.get("app") == "ABYNS KOS"
    assert data.get("status") == "ok"


# ----- Dashboard -----
def test_dashboard():
    r = requests.get(f"{API}/dashboard", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "kpis" in data
    kpis = data["kpis"]
    assert kpis.get("total_rooms") == 24
    for k in ["occupied", "available", "maintenance", "revenue", "outstanding", "revenue_change_pct"]:
        assert k in kpis, f"missing {k}"
    assert abs(kpis["revenue_change_pct"] - 12.4) < 0.001
    assert "health" in data and isinstance(data["health"], dict)
    # health components: 5 sub-scores (occupancy, payments, maintenance, revenue, tenant_experience)
    expected_components = {"occupancy", "payments", "maintenance", "revenue", "tenant_experience"}
    assert expected_components.issubset(set(data["health"].keys())), f"missing health components: {expected_components - set(data['health'].keys())}"
    assert "payment_overview" in data
    assert "revenue_history" in data and len(data["revenue_history"]) == 6
    for key in ["upcoming_billing", "overdue_tenants", "activity"]:
        assert key in data


# ----- Properties -----
def test_properties_list():
    r = requests.get(f"{API}/properties", timeout=15)
    assert r.status_code == 200
    props = r.json()
    assert isinstance(props, list) and len(props) >= 1
    for p in props:
        for k in ["id", "name", "address", "total_rooms", "occupied", "available", "maintenance", "monthly_revenue"]:
            assert k in p, f"property missing {k}"


def test_property_detail():
    props = requests.get(f"{API}/properties", timeout=15).json()
    pid = props[0]["id"]
    r = requests.get(f"{API}/properties/{pid}", timeout=15)
    assert r.status_code == 200
    prop = r.json()
    assert "rooms" in prop
    assert len(prop["rooms"]) == 24


# ----- Rooms -----
def test_rooms():
    r = requests.get(f"{API}/rooms", timeout=15)
    assert r.status_code == 200
    rooms = r.json()
    assert len(rooms) == 24
    # filter
    props = requests.get(f"{API}/properties", timeout=15).json()
    pid = props[0]["id"]
    r2 = requests.get(f"{API}/rooms", params={"property_id": pid}, timeout=15)
    assert r2.status_code == 200
    assert isinstance(r2.json(), list)


# ----- Tenants -----
def test_tenants_list():
    r = requests.get(f"{API}/tenants", timeout=15)
    assert r.status_code == 200
    tenants = r.json()
    assert len(tenants) == 19, f"expected 19 tenants, got {len(tenants)}"


def test_tenant_detail():
    tenants = requests.get(f"{API}/tenants", timeout=15).json()
    tid = tenants[0]["id"]
    r = requests.get(f"{API}/tenants/{tid}", timeout=15)
    assert r.status_code == 200
    td = r.json()
    for k in ["contract", "invoices", "payments"]:
        assert k in td, f"tenant detail missing {k}"


# ----- Invoices -----
def test_invoices_current():
    r = requests.get(f"{API}/invoices", params={"current": "true"}, timeout=15)
    assert r.status_code == 200
    invs = r.json()
    assert isinstance(invs, list) and len(invs) >= 1
    for inv in invs[:3]:
        assert "tenant_name" in inv
        assert "room_number" in inv
        assert "days_diff" in inv


# ----- Maintenance -----
def test_maintenance():
    r = requests.get(f"{API}/maintenance", timeout=15)
    assert r.status_code == 200
    items = r.json()
    assert isinstance(items, list) and len(items) >= 1
    for it in items[:3]:
        assert "issue" in it and "status" in it and "priority" in it
    # sort desc by reported_at
    ts = [it.get("reported_at") for it in items if it.get("reported_at")]
    assert ts == sorted(ts, reverse=True)


# ----- Finance -----
def test_finance_summary():
    r = requests.get(f"{API}/finance/summary", timeout=15)
    assert r.status_code == 200
    data = r.json()
    for k in ["revenue", "expenses", "net", "categories", "history"]:
        assert k in data, f"finance missing {k}"
    assert len(data["history"]) == 6


def test_expenses():
    r = requests.get(f"{API}/expenses", timeout=15)
    assert r.status_code == 200
    exp = r.json()
    assert len(exp) >= 6


# ----- Notifications -----
def test_notifications():
    r = requests.get(f"{API}/notifications", timeout=15)
    assert r.status_code == 200
    n = r.json()
    assert isinstance(n, list)


# ----- AI Chat SSE -----
def test_ai_chat_sse():
    url = f"{API}/ai/chat"
    payload = {"message": "Siapa yang belum bayar bulan ini?"}
    with requests.post(url, json=payload, stream=True, timeout=60) as r:
        assert r.status_code == 200
        ctype = r.headers.get("content-type", "")
        assert "text/event-stream" in ctype, f"content-type={ctype}"
        got_session = False
        got_delta = False
        got_done = False
        collected_text = ""
        start = time.time()
        for raw in r.iter_lines(decode_unicode=True):
            if raw is None:
                continue
            if time.time() - start > 45:
                break
            if not raw:
                continue
            if raw.startswith("event:"):
                ev = raw.split(":", 1)[1].strip()
                if ev == "session":
                    got_session = True
                if ev == "done":
                    got_done = True
                    break
            elif raw.startswith("data:"):
                body = raw[5:].strip()
                try:
                    j = json.loads(body)
                    if "delta" in j:
                        got_delta = True
                        collected_text += j.get("delta", "")
                    if "session_id" in j:
                        got_session = True
                except Exception:
                    pass
        assert got_session, "no session event"
        assert got_delta, "no delta data received"
        low = collected_text.lower()
        assert any(w in low for w in ["tenant", "kos", "bayar", "kamar", "belum"]), f"no indonesian keywords in: {collected_text[:200]}"
