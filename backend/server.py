"""ABYNS KOS - AI Property Operating System (Backend).

FastAPI + MongoDB. Data is modeled relationally (foreign-key style UUIDs)
so this prototype can be re-implemented on CodeIgniter 4 + MySQL later.
"""
from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
import json
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

# Midtrans QRIS
import base64
import hashlib
import requests

MIDTRANS_SERVER_KEY = os.environ.get("MIDTRANS_SERVER_KEY", "")
MIDTRANS_CLIENT_KEY = os.environ.get("MIDTRANS_CLIENT_KEY", "")
MIDTRANS_ENV = os.environ.get("MIDTRANS_ENV", "sandbox")
MIDTRANS_BASE = (
    "https://api.sandbox.midtrans.com"
    if MIDTRANS_ENV != "production"
    else "https://api.midtrans.com"
)


def midtrans_auth_headers():
    token = base64.b64encode(f"{MIDTRANS_SERVER_KEY}:".encode()).decode()
    return {
        "Authorization": f"Basic {token}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

app = FastAPI(title="ABYNS KOS API", version="1.0")
api = APIRouter(prefix="/api/v1")

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("abyns")


# ---------- helpers ----------
def uid() -> str:
    return str(uuid.uuid4())


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def clean(doc):
    if isinstance(doc, list):
        return [clean(d) for d in doc]
    if isinstance(doc, dict):
        doc.pop("_id", None)
    return doc


# ---------- Pydantic bodies ----------
class AiChatBody(BaseModel):
    session_id: Optional[str] = None
    message: str


# ---------- SEED DATA ----------
async def seed_if_empty():
    if await db.properties.count_documents({}) > 0:
        return
    log.info("Seeding ABYNS KOS demo database...")

    owner_id = uid()
    prop_id = uid()
    bld_a = uid()
    bld_b = uid()

    owner = {
        "id": owner_id,
        "name": "Pak Adi",
        "email": "adi@abyns.id",
        "phone": "+62 812-3400-9911",
        "role": "owner",
        "created_at": now_iso(),
    }
    await db.users.insert_one(owner)

    prop = {
        "id": prop_id,
        "owner_id": owner_id,
        "name": "ABYNS Residence Bandung",
        "address": "Jl. Dipati Ukur No. 42, Bandung",
        "city": "Bandung",
        "total_rooms": 24,
        "created_at": now_iso(),
    }
    await db.properties.insert_one(prop)

    await db.buildings.insert_many([
        {"id": bld_a, "property_id": prop_id, "name": "Building A", "floors": 3},
        {"id": bld_b, "property_id": prop_id, "name": "Building B", "floors": 2},
    ])

    # Rooms: 14 in A (A-01..A-14), 10 in B (B-01..B-10). 24 total.
    rooms = []
    for i in range(1, 15):
        rooms.append({
            "id": uid(),
            "property_id": prop_id,
            "building_id": bld_a,
            "number": f"A-{i:02d}",
            "monthly_rent": 1500000 if i <= 10 else 1700000,
            "status": "occupied",
        })
    for i in range(1, 11):
        rooms.append({
            "id": uid(),
            "property_id": prop_id,
            "building_id": bld_b,
            "number": f"B-{i:02d}",
            "monthly_rent": 1600000,
            "status": "occupied",
        })

    # Assign statuses: 19 occupied, 3 available, 2 maintenance
    # Available: A-02, B-06, B-10
    # Maintenance: A-03, A-08
    for r in rooms:
        if r["number"] in ("A-02", "B-06", "B-10"):
            r["status"] = "available"
        elif r["number"] in ("A-03", "A-08"):
            r["status"] = "maintenance"
    await db.rooms.insert_many(rooms)

    # Tenants
    tenant_data = [
        ("Budi Santoso", "A-12", "active", "paid", 98),
        ("Sinta Wijaya", "A-14", "active", "due_today", 85),
        ("Dodi Pratama", "B-05", "active", "due_soon", 92),
        ("Maya Kartika", "A-07", "active", "due_soon", 90),
        ("Rian Nugroho", "B-03", "active", "overdue", 61),
        ("Fajar Ramadhan", "A-09", "active", "overdue", 68),
        ("Lina Marlina", "B-08", "active", "overdue", 72),
        ("Andi Setiawan", "A-01", "active", "paid", 96),
        ("Citra Dewi", "A-04", "active", "paid", 94),
        ("Eko Yulianto", "A-05", "active", "paid", 89),
        ("Gita Anindya", "A-06", "active", "paid", 91),
        ("Hendra Wibowo", "A-10", "active", "paid", 93),
        ("Indra Kusuma", "A-11", "active", "paid", 88),
        ("Joko Prabowo", "A-13", "active", "paid", 90),
        ("Kartika Sari", "B-01", "active", "paid", 95),
        ("Luki Hartono", "B-02", "active", "paid", 87),
        ("Mira Sulistiani", "B-04", "active", "paid", 92),
        ("Nadia Puspita", "B-07", "active", "paid", 94),
        ("Oscar Fadli", "B-09", "active", "paid", 89),
    ]

    room_by_num = {r["number"]: r for r in rooms}
    tenants = []
    contracts = []
    invoices = []
    payments = []
    today = datetime.now(timezone.utc)

    for name, room_num, ct_status, pay_status, health in tenant_data:
        tid = uid()
        room = room_by_num[room_num]
        # Move-in random 3-14 months ago
        months_ago = 3 + (hash(name) % 12)
        start = today - timedelta(days=30 * months_ago)
        tenants.append({
            "id": tid,
            "name": name,
            "email": f"{name.split()[0].lower()}@example.id",
            "phone": f"+62 812-{1000+hash(name)%9000:04d}-{1000+hash(name+'x')%9000:04d}",
            "id_number": f"32{hash(name)%10000000000:010d}",
            "avatar_seed": name.lower().replace(" ", "-"),
            "property_id": prop_id,
            "room_id": room["id"],
            "room_number": room_num,
            "status": ct_status,
            "payment_status": pay_status,
            "payment_health": health,
            "move_in_date": start.date().isoformat(),
        })
        contracts.append({
            "id": uid(),
            "tenant_id": tid,
            "room_id": room["id"],
            "start_date": start.date().isoformat(),
            "end_date": (start + timedelta(days=365)).date().isoformat(),
            "monthly_rent": room["monthly_rent"],
            "deposit": room["monthly_rent"],
            "status": "active",
        })

        # Past invoices (all paid) for last N months except current
        for m in range(months_ago, 0, -1):
            issue = today - timedelta(days=30 * m)
            due = issue + timedelta(days=5)
            iid = uid()
            invoices.append({
                "id": iid,
                "tenant_id": tid,
                "room_id": room["id"],
                "property_id": prop_id,
                "period": issue.strftime("%Y-%m"),
                "amount": room["monthly_rent"],
                "issue_date": issue.date().isoformat(),
                "due_date": due.date().isoformat(),
                "status": "paid",
            })
            payments.append({
                "id": uid(),
                "invoice_id": iid,
                "tenant_id": tid,
                "amount": room["monthly_rent"],
                "method": "bank_transfer",
                "paid_at": (due - timedelta(days=1)).isoformat(),
                "status": "verified",
            })

        # Current-month invoice with status from pay_status
        current_issue = today - timedelta(days=6)
        if pay_status == "overdue":
            due = today - timedelta(days=(2 + hash(name) % 4))
            inv_status = "overdue"
        elif pay_status == "due_today":
            due = today
            inv_status = "pending"
        elif pay_status == "due_soon":
            due = today + timedelta(days=1 + hash(name) % 2)
            inv_status = "pending"
        else:  # paid
            due = today + timedelta(days=3)
            inv_status = "paid"

        iid = uid()
        invoices.append({
            "id": iid,
            "tenant_id": tid,
            "room_id": room["id"],
            "property_id": prop_id,
            "period": today.strftime("%Y-%m"),
            "amount": room["monthly_rent"],
            "issue_date": current_issue.date().isoformat(),
            "due_date": due.date().isoformat(),
            "status": inv_status,
        })
        if inv_status == "paid":
            payments.append({
                "id": uid(),
                "invoice_id": iid,
                "tenant_id": tid,
                "amount": room["monthly_rent"],
                "method": "bank_transfer",
                "paid_at": (today - timedelta(days=2)).isoformat(),
                "status": "verified",
            })

    await db.tenants.insert_many(tenants)
    await db.contracts.insert_many(contracts)
    await db.invoices.insert_many(invoices)
    if payments:
        await db.payments.insert_many(payments)

    # Maintenance
    maint = [
        {"id": uid(), "room_number": "A-08", "issue": "Air conditioner not cooling", "status": "in_progress", "priority": "high", "technician": "Pak Asep", "reported_at": (today - timedelta(days=3)).isoformat()},
        {"id": uid(), "room_number": "A-03", "issue": "Leaking bathroom pipe", "status": "in_progress", "priority": "high", "technician": "Pak Asep", "reported_at": (today - timedelta(days=5)).isoformat()},
        {"id": uid(), "room_number": "A-12", "issue": "Water pressure issue", "status": "waiting", "priority": "medium", "technician": None, "reported_at": (today - timedelta(days=1)).isoformat()},
        {"id": uid(), "room_number": "B-04", "issue": "Broken window latch", "status": "waiting", "priority": "low", "technician": None, "reported_at": (today - timedelta(days=2)).isoformat()},
        {"id": uid(), "room_number": "A-01", "issue": "WiFi router replacement", "status": "in_progress", "priority": "medium", "technician": "Pak Dedi", "reported_at": (today - timedelta(days=4)).isoformat()},
    ]
    for i in range(7):
        maint.append({"id": uid(), "room_number": f"A-{(i%14)+1:02d}", "issue": "Routine inspection", "status": "completed", "priority": "low", "technician": "Pak Asep", "reported_at": (today - timedelta(days=10+i)).isoformat(), "completed_at": (today - timedelta(days=8+i)).isoformat()})
    for m in maint:
        m["property_id"] = prop_id
    await db.maintenance.insert_many(maint)

    # Expenses (current month)
    expenses = [
        {"id": uid(), "property_id": prop_id, "category": "Maintenance", "amount": 2400000, "description": "AC repairs & plumbing", "date": (today - timedelta(days=8)).date().isoformat()},
        {"id": uid(), "property_id": prop_id, "category": "Utilities", "amount": 2800000, "description": "Electricity & water", "date": (today - timedelta(days=5)).date().isoformat()},
        {"id": uid(), "property_id": prop_id, "category": "Internet", "amount": 1200000, "description": "Fiber internet 200Mbps", "date": (today - timedelta(days=3)).date().isoformat()},
        {"id": uid(), "property_id": prop_id, "category": "Cleaning", "amount": 900000, "description": "Cleaning service", "date": (today - timedelta(days=6)).date().isoformat()},
        {"id": uid(), "property_id": prop_id, "category": "Staff", "amount": 1100000, "description": "Caretaker salary", "date": (today - timedelta(days=1)).date().isoformat()},
        {"id": uid(), "property_id": prop_id, "category": "Other", "amount": 300000, "description": "Supplies", "date": (today - timedelta(days=2)).date().isoformat()},
    ]
    await db.expenses.insert_many(expenses)

    # Notifications
    notifs = [
        {"id": uid(), "property_id": prop_id, "type": "payment", "title": "Payment received", "message": "Budi Santoso paid Rp1.500.000", "created_at": (today - timedelta(hours=2)).isoformat()},
        {"id": uid(), "property_id": prop_id, "type": "maintenance", "title": "Maintenance completed", "message": "A-08 AC inspection", "created_at": (today - timedelta(hours=6)).isoformat()},
        {"id": uid(), "property_id": prop_id, "type": "tenant", "title": "New tenant onboarded", "message": "Oscar Fadli — B-09", "created_at": (today - timedelta(days=1)).isoformat()},
        {"id": uid(), "property_id": prop_id, "type": "invoice", "title": "Invoice generated", "message": "Monthly invoices for August", "created_at": (today - timedelta(days=1, hours=3)).isoformat()},
    ]
    await db.notifications.insert_many(notifs)
    log.info("Seed complete.")


@app.on_event("startup")
async def on_start():
    await seed_if_empty()


# ---------- ROUTES ----------
@api.get("/health")
async def health():
    return {"status": "ok", "app": "ABYNS KOS", "time": now_iso()}


# Properties
@api.get("/properties")
async def list_properties():
    props = await db.properties.find({}, {"_id": 0}).to_list(100)
    for p in props:
        p["occupied"] = await db.rooms.count_documents({"property_id": p["id"], "status": "occupied"})
        p["available"] = await db.rooms.count_documents({"property_id": p["id"], "status": "available"})
        p["maintenance"] = await db.rooms.count_documents({"property_id": p["id"], "status": "maintenance"})
        # Monthly revenue = sum of paid invoices this month
        pipeline = [
            {"$match": {"property_id": p["id"], "status": "paid", "period": datetime.now(timezone.utc).strftime("%Y-%m")}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
        ]
        agg = await db.invoices.aggregate(pipeline).to_list(1)
        p["monthly_revenue"] = agg[0]["total"] if agg else 0
    return props


@api.get("/properties/{property_id}")
async def get_property(property_id: str):
    prop = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(404, "Property not found")
    prop["rooms"] = clean(await db.rooms.find({"property_id": property_id}).to_list(1000))
    prop["occupied"] = sum(1 for r in prop["rooms"] if r["status"] == "occupied")
    prop["available"] = sum(1 for r in prop["rooms"] if r["status"] == "available")
    prop["maintenance"] = sum(1 for r in prop["rooms"] if r["status"] == "maintenance")
    return prop


# Rooms
@api.get("/rooms")
async def list_rooms(property_id: Optional[str] = None):
    q = {"property_id": property_id} if property_id else {}
    rooms = await db.rooms.find(q, {"_id": 0}).to_list(1000)
    # attach tenant name
    tenants = {t["room_id"]: t for t in await db.tenants.find({}, {"_id": 0}).to_list(1000)}
    for r in rooms:
        t = tenants.get(r["id"])
        r["tenant_name"] = t["name"] if t else None
    rooms.sort(key=lambda r: r["number"])
    return rooms


# Tenants
@api.get("/tenants")
async def list_tenants():
    return clean(await db.tenants.find({}).to_list(1000))


@api.get("/tenants/{tenant_id}")
async def get_tenant(tenant_id: str):
    t = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    if not t:
        raise HTTPException(404, "Tenant not found")
    t["contract"] = await db.contracts.find_one({"tenant_id": tenant_id}, {"_id": 0})
    t["invoices"] = clean(await db.invoices.find({"tenant_id": tenant_id}).sort("issue_date", -1).to_list(50))
    t["payments"] = clean(await db.payments.find({"tenant_id": tenant_id}).sort("paid_at", -1).to_list(50))
    return t


# Invoices / Billing
@api.get("/invoices")
async def list_invoices(status: Optional[str] = None, current: Optional[bool] = None):
    q = {}
    if status:
        q["status"] = status
    if current:
        q["period"] = datetime.now(timezone.utc).strftime("%Y-%m")
    invs = await db.invoices.find(q, {"_id": 0}).sort("due_date", 1).to_list(500)
    tenants = {t["id"]: t for t in await db.tenants.find({}, {"_id": 0}).to_list(1000)}
    today = datetime.now(timezone.utc).date()
    for i in invs:
        t = tenants.get(i["tenant_id"])
        i["tenant_name"] = t["name"] if t else "-"
        i["room_number"] = t["room_number"] if t else "-"
        due = datetime.fromisoformat(i["due_date"]).date()
        i["days_diff"] = (due - today).days
    return invs


# Maintenance
@api.get("/maintenance")
async def list_maintenance():
    return clean(await db.maintenance.find({}).sort("reported_at", -1).to_list(200))


# Finance
@api.get("/finance/summary")
async def finance_summary():
    month = datetime.now(timezone.utc).strftime("%Y-%m")
    revenue_agg = await db.invoices.aggregate([
        {"$match": {"status": "paid", "period": month}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]).to_list(1)
    revenue = revenue_agg[0]["total"] if revenue_agg else 0

    expense_agg = await db.expenses.aggregate([
        {"$group": {"_id": "$category", "total": {"$sum": "$amount"}}},
    ]).to_list(20)
    expenses_total = sum(e["total"] for e in expense_agg)
    categories = [{"category": e["_id"], "amount": e["total"]} for e in expense_agg]

    # 6-month history
    today = datetime.now(timezone.utc)
    history = []
    for i in range(5, -1, -1):
        m_date = today - timedelta(days=30 * i)
        period = m_date.strftime("%Y-%m")
        r = await db.invoices.aggregate([
            {"$match": {"status": "paid", "period": period}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
        ]).to_list(1)
        # deterministic expense estimation for older months
        exp_est = int(expenses_total * (0.85 + (i * 0.03)))
        history.append({
            "month": m_date.strftime("%b"),
            "revenue": r[0]["total"] if r else 0,
            "expenses": exp_est if i > 0 else expenses_total,
        })

    return {
        "revenue": revenue,
        "expenses": expenses_total,
        "net": revenue - expenses_total,
        "categories": categories,
        "history": history,
    }


@api.get("/expenses")
async def list_expenses():
    return clean(await db.expenses.find({}).sort("date", -1).to_list(100))


# Notifications
@api.get("/notifications")
async def list_notifications():
    return clean(await db.notifications.find({}).sort("created_at", -1).to_list(50))


# Dashboard
@api.get("/dashboard")
async def dashboard():
    prop = await db.properties.find_one({}, {"_id": 0})
    rooms = await db.rooms.find({}, {"_id": 0}).to_list(1000)
    total = len(rooms)
    occupied = sum(1 for r in rooms if r["status"] == "occupied")
    available = sum(1 for r in rooms if r["status"] == "available")
    maintenance = sum(1 for r in rooms if r["status"] == "maintenance")

    month = datetime.now(timezone.utc).strftime("%Y-%m")
    revenue_agg = await db.invoices.aggregate([
        {"$match": {"status": "paid", "period": month}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]).to_list(1)
    outstanding_agg = await db.invoices.aggregate([
        {"$match": {"status": {"$in": ["pending", "overdue"]}, "period": month}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]).to_list(1)
    paid_agg = revenue_agg
    pending_agg = await db.invoices.aggregate([
        {"$match": {"status": "pending", "period": month}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]).to_list(1)
    overdue_agg = await db.invoices.aggregate([
        {"$match": {"status": "overdue", "period": month}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]).to_list(1)

    revenue = revenue_agg[0]["total"] if revenue_agg else 0
    outstanding = outstanding_agg[0]["total"] if outstanding_agg else 0

    # Health score
    occ_score = round((occupied / total) * 100) if total else 0
    total_current_inv = revenue + outstanding
    pay_score = round((revenue / total_current_inv) * 100) if total_current_inv else 100
    maint_pending = await db.maintenance.count_documents({"status": {"$in": ["in_progress", "waiting"]}})
    maint_score = max(50, 100 - maint_pending * 5)
    rev_score = 83
    tenant_score = 91
    health_overall = round((occ_score + pay_score + maint_score + rev_score + tenant_score) / 5)

    # Revenue history 6 months
    today = datetime.now(timezone.utc)
    history = []
    for i in range(5, -1, -1):
        m_date = today - timedelta(days=30 * i)
        period = m_date.strftime("%Y-%m")
        r = await db.invoices.aggregate([
            {"$match": {"status": "paid", "period": period}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
        ]).to_list(1)
        history.append({"month": m_date.strftime("%b"), "revenue": r[0]["total"] if r else 0})

    # Upcoming & overdue
    tenants = {t["id"]: t for t in await db.tenants.find({}, {"_id": 0}).to_list(1000)}
    upcoming = []
    overdue = []
    invs = await db.invoices.find({"status": {"$in": ["pending", "overdue"]}, "period": month}, {"_id": 0}).to_list(200)
    today_date = today.date()
    for i in invs:
        t = tenants.get(i["tenant_id"], {})
        due = datetime.fromisoformat(i["due_date"]).date()
        days_diff = (due - today_date).days
        entry = {
            "invoice_id": i["id"],
            "tenant_id": i["tenant_id"],
            "tenant_name": t.get("name", "-"),
            "room_number": t.get("room_number", "-"),
            "amount": i["amount"],
            "days_diff": days_diff,
            "avatar_seed": t.get("avatar_seed", "x"),
        }
        if i["status"] == "overdue":
            entry["priority"] = "high" if days_diff <= -3 else "medium"
            overdue.append(entry)
        else:
            upcoming.append(entry)
    upcoming.sort(key=lambda x: x["days_diff"])
    overdue.sort(key=lambda x: x["days_diff"])

    notifs = clean(await db.notifications.find({}).sort("created_at", -1).to_list(10))

    return {
        "owner_name": "Pak Adi",
        "property_name": prop["name"] if prop else "",
        "kpis": {
            "total_rooms": total,
            "occupied": occupied,
            "occupancy_pct": round((occupied / total) * 100) if total else 0,
            "available": available,
            "maintenance": maintenance,
            "revenue": revenue,
            "outstanding": outstanding,
            "revenue_change_pct": 12.4,
        },
        "health": {
            "overall": health_overall,
            "occupancy": occ_score,
            "payments": pay_score,
            "maintenance": maint_score,
            "revenue": rev_score,
            "tenant_experience": tenant_score,
        },
        "payment_overview": {
            "total": revenue + outstanding,
            "paid": paid_agg[0]["total"] if paid_agg else 0,
            "pending": pending_agg[0]["total"] if pending_agg else 0,
            "overdue": overdue_agg[0]["total"] if overdue_agg else 0,
        },
        "revenue_history": history,
        "upcoming_billing": upcoming[:5],
        "overdue_tenants": overdue[:5],
        "activity": notifs,
    }


# ---------- AI ----------
SYSTEM_PROMPT = """Kamu adalah ABYNS AI, asisten cerdas untuk pemilik kos di Indonesia.
Kamu berbicara dalam bahasa Indonesia yang santai, ringkas, dan profesional (boleh sesekali menggunakan istilah Inggris singkat).
Kamu selalu memberikan: (1) fakta ringkas dari data, (2) insight/analisa, dan (3) rekomendasi tindakan konkret.
Gunakan format list singkat bila perlu. Jangan bertele-tele. Kalau data spesifik belum tersedia, gunakan estimasi yang masuk akal berdasarkan konteks yang diberikan."""


async def build_data_context():
    dash = await dashboard()
    invs = await db.invoices.find({"status": {"$in": ["overdue", "pending"]}, "period": datetime.now(timezone.utc).strftime("%Y-%m")}, {"_id": 0}).to_list(50)
    tenants = {t["id"]: t for t in await db.tenants.find({}, {"_id": 0}).to_list(1000)}
    outstanding = []
    for i in invs:
        t = tenants.get(i["tenant_id"], {})
        outstanding.append(f"{t.get('name','-')} kamar {t.get('room_number','-')} Rp{i['amount']:,} status {i['status']} jatuh tempo {i['due_date']}")
    rooms = await db.rooms.find({"status": {"$in": ["available", "maintenance"]}}, {"_id": 0}).to_list(50)
    room_issues = [f"{r['number']} - {r['status']}" for r in rooms]
    maint_open = await db.maintenance.find({"status": {"$in": ["in_progress", "waiting"]}}, {"_id": 0}).to_list(50)
    maint_lines = [f"{m['room_number']}: {m['issue']} ({m['status']}, prio {m['priority']})" for m in maint_open]

    ctx = f"""DATA KONTEKS ABYNS RESIDENCE BANDUNG:
- Total kamar: {dash['kpis']['total_rooms']}, terisi {dash['kpis']['occupied']} ({dash['kpis']['occupancy_pct']}%), tersedia {dash['kpis']['available']}, maintenance {dash['kpis']['maintenance']}.
- Revenue bulan ini: Rp{dash['kpis']['revenue']:,} (perubahan {dash['kpis']['revenue_change_pct']}% vs bulan lalu).
- Outstanding (belum lunas): Rp{dash['kpis']['outstanding']:,}.
- Property Health Score: {dash['health']['overall']}/100 (Occupancy {dash['health']['occupancy']}, Payments {dash['health']['payments']}, Maintenance {dash['health']['maintenance']}).

TENANT DENGAN TAGIHAN BELUM LUNAS:
{chr(10).join(outstanding) or '- Tidak ada.'}

KAMAR TIDAK TERISI / MAINTENANCE:
{chr(10).join(room_issues) or '- Semua terisi.'}

MAINTENANCE TERBUKA:
{chr(10).join(maint_lines) or '- Tidak ada.'}
"""
    return ctx


@api.post("/ai/chat")
async def ai_chat(body: AiChatBody):
    """Stream a Gemini response as SSE."""
    from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

    session_id = body.session_id or uid()
    context = await build_data_context()

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=SYSTEM_PROMPT + "\n\n" + context,
    ).with_model("gemini", "gemini-3-flash-preview")

    async def gen():
        try:
            yield f"event: session\ndata: {json.dumps({'session_id': session_id})}\n\n"
            async for ev in chat.stream_message(UserMessage(text=body.message)):
                if isinstance(ev, TextDelta):
                    yield f"data: {json.dumps({'delta': ev.content})}\n\n"
                elif isinstance(ev, StreamDone):
                    break
            yield "event: done\ndata: {}\n\n"
        except Exception as e:
            log.exception("AI stream error")
            yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

    # Save conversation shell (persistent history)
    await db.ai_chats.update_one(
        {"session_id": session_id},
        {"$push": {"messages": {"role": "user", "text": body.message, "at": now_iso()}},
         "$setOnInsert": {"session_id": session_id, "created_at": now_iso()}},
        upsert=True,
    )

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )


# ---------- TENANT PORTAL ----------
class TenantLoginBody(BaseModel):
    email: str


class MaintenanceCreateBody(BaseModel):
    issue: str
    priority: Optional[str] = "medium"
    description: Optional[str] = ""


@api.post("/tenant/login")
async def tenant_login(body: TenantLoginBody):
    """Mock login — matches by email (case-insensitive)."""
    t = await db.tenants.find_one({"email": {"$regex": f"^{body.email}$", "$options": "i"}}, {"_id": 0})
    if not t:
        raise HTTPException(404, "Tenant not found. Coba email lain.")
    return {"tenant": t, "token": f"mock-{t['id']}"}


@api.get("/tenant/{tenant_id}/dashboard")
async def tenant_dashboard(tenant_id: str):
    t = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    if not t:
        raise HTTPException(404, "Tenant not found")
    contract = await db.contracts.find_one({"tenant_id": tenant_id}, {"_id": 0})
    current_period = datetime.now(timezone.utc).strftime("%Y-%m")
    current_inv = await db.invoices.find_one(
        {"tenant_id": tenant_id, "period": current_period}, {"_id": 0}
    )
    total_paid_agg = await db.payments.aggregate([
        {"$match": {"tenant_id": tenant_id, "status": "verified"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]).to_list(1)
    total_invoices = await db.invoices.count_documents({"tenant_id": tenant_id})
    paid_invoices = await db.invoices.count_documents({"tenant_id": tenant_id, "status": "paid"})
    open_maint = await db.maintenance.count_documents({
        "tenant_id": tenant_id, "status": {"$in": ["waiting", "in_progress"]},
    })
    today = datetime.now(timezone.utc).date()
    days_left = None
    if current_inv and current_inv.get("status") != "paid":
        due = datetime.fromisoformat(current_inv["due_date"]).date()
        days_left = (due - today).days
    return {
        "tenant": t,
        "contract": contract,
        "current_invoice": current_inv,
        "days_until_due": days_left,
        "total_paid": total_paid_agg[0]["total"] if total_paid_agg else 0,
        "total_invoices": total_invoices,
        "paid_invoices": paid_invoices,
        "open_maintenance": open_maint,
    }


@api.get("/tenant/{tenant_id}/invoices")
async def tenant_invoices(tenant_id: str):
    invs = await db.invoices.find({"tenant_id": tenant_id}, {"_id": 0}).sort("issue_date", -1).to_list(100)
    today = datetime.now(timezone.utc).date()
    for i in invs:
        try:
            due = datetime.fromisoformat(i["due_date"]).date()
            i["days_diff"] = (due - today).days
        except Exception:
            i["days_diff"] = None
    return invs


@api.post("/invoices/{invoice_id}/pay")
async def pay_invoice(invoice_id: str):
    inv = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not inv:
        raise HTTPException(404, "Invoice not found")
    if inv["status"] == "paid":
        return {"ok": True, "already_paid": True, "invoice": inv}
    now = now_iso()
    payment = {
        "id": uid(),
        "invoice_id": invoice_id,
        "tenant_id": inv["tenant_id"],
        "amount": inv["amount"],
        "method": "abyns_pay",
        "paid_at": now,
        "status": "verified",
    }
    await db.payments.insert_one(payment)
    await db.invoices.update_one({"id": invoice_id}, {"$set": {"status": "paid"}})
    # Update tenant payment_status snapshot
    await db.tenants.update_one({"id": inv["tenant_id"]}, {"$set": {"payment_status": "paid"}})
    # Notify owner
    tenant = await db.tenants.find_one({"id": inv["tenant_id"]}, {"_id": 0})
    await db.notifications.insert_one({
        "id": uid(),
        "property_id": inv["property_id"],
        "type": "payment",
        "title": "Payment received",
        "message": f"{tenant['name'] if tenant else 'Tenant'} paid {inv['amount']:,} via ABYNS Pay",
        "created_at": now,
    })
    payment.pop("_id", None)
    return {"ok": True, "payment": payment}


@api.get("/tenant/{tenant_id}/maintenance")
async def tenant_maintenance(tenant_id: str):
    items = await db.maintenance.find(
        {"tenant_id": tenant_id}, {"_id": 0}
    ).sort("reported_at", -1).to_list(50)
    return items


@api.post("/tenant/{tenant_id}/maintenance")
async def create_tenant_maintenance(tenant_id: str, body: MaintenanceCreateBody):
    t = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    if not t:
        raise HTTPException(404, "Tenant not found")
    doc = {
        "id": uid(),
        "tenant_id": tenant_id,
        "property_id": t.get("property_id"),
        "room_number": t.get("room_number"),
        "issue": body.issue,
        "description": body.description or "",
        "priority": body.priority or "medium",
        "status": "waiting",
        "technician": None,
        "reported_at": now_iso(),
    }
    await db.maintenance.insert_one(doc)
    await db.notifications.insert_one({
        "id": uid(),
        "property_id": t.get("property_id"),
        "type": "maintenance",
        "title": "New maintenance report",
        "message": f"{t['name']} ({t.get('room_number')}) — {body.issue}",
        "created_at": now_iso(),
    })
    doc.pop("_id", None)
    return doc


# ---------- MIDTRANS QRIS ----------
async def _mark_invoice_paid(invoice_id: str, method: str = "qris_gopay"):
    inv = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not inv or inv.get("status") == "paid":
        return
    now = now_iso()
    await db.invoices.update_one({"id": invoice_id}, {"$set": {"status": "paid"}})
    await db.payments.insert_one({
        "id": uid(),
        "invoice_id": invoice_id,
        "tenant_id": inv["tenant_id"],
        "amount": inv["amount"],
        "method": method,
        "paid_at": now,
        "status": "verified",
    })
    await db.tenants.update_one(
        {"id": inv["tenant_id"]}, {"$set": {"payment_status": "paid"}}
    )
    tenant = await db.tenants.find_one({"id": inv["tenant_id"]}, {"_id": 0})
    await db.notifications.insert_one({
        "id": uid(),
        "property_id": inv.get("property_id"),
        "type": "payment",
        "title": "Payment received via QRIS",
        "message": f"{tenant['name'] if tenant else 'Tenant'} paid Rp{inv['amount']:,} — {method}",
        "created_at": now,
    })


@api.post("/invoices/{invoice_id}/qris/charge")
async def qris_charge(invoice_id: str):
    """Create a Midtrans QRIS charge and return QR image URL + order id."""
    inv = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not inv:
        raise HTTPException(404, "Invoice not found")
    if inv["status"] == "paid":
        return {"already_paid": True, "invoice_id": invoice_id}

    # Reuse existing pending intent (< 25 minutes old and has snap_token)
    existing = await db.payment_intents.find_one(
        {
            "invoice_id": invoice_id,
            "status": "pending",
            "snap_token": {"$exists": True, "$ne": None},
        },
        {"_id": 0},
        sort=[("created_at", -1)],
    )
    if existing:
        try:
            created = datetime.fromisoformat(existing["created_at"])
            if (datetime.now(timezone.utc) - created).total_seconds() < 25 * 60:
                return existing
        except Exception:
            pass

    order_id = f"ABYNS-{invoice_id[:8].upper()}-{int(datetime.now(timezone.utc).timestamp())}"
    tenant = await db.tenants.find_one({"id": inv["tenant_id"]}, {"_id": 0}) or {}
    name_parts = (tenant.get("name") or "Tenant").split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    payload = {
        "transaction_details": {
            "order_id": order_id,
            "gross_amount": int(inv["amount"]),
        },
        "item_details": [{
            "id": inv["id"],
            "price": int(inv["amount"]),
            "quantity": 1,
            "name": f"Sewa Kos {inv.get('period','')} - Kamar {tenant.get('room_number','-')}"[:50],
        }],
        "customer_details": {
            "first_name": first_name[:20],
            "last_name": last_name[:20],
            "email": tenant.get("email", "tenant@abyns.id"),
            "phone": tenant.get("phone", ""),
        },
        "enabled_payments": [
            "other_qris", "gopay", "shopeepay", "dana", "ovo",
            "bca_va", "bni_va", "bri_va", "permata_va", "other_va",
            "credit_card",
        ],
        "credit_card": {"secure": True},
        "callbacks": {"finish": ""},
    }
    try:
        r = requests.post(
            f"{MIDTRANS_BASE.replace('api.', 'app.')}/snap/v1/transactions"
            if "sandbox" in MIDTRANS_BASE
            else "https://app.midtrans.com/snap/v1/transactions",
            json=payload,
            headers=midtrans_auth_headers(),
            timeout=20,
        )
    except Exception as e:
        log.exception("Midtrans network error")
        raise HTTPException(502, f"Midtrans network error: {e}")
    if r.status_code >= 400:
        log.error("Midtrans Snap failed %s %s", r.status_code, r.text)
        raise HTTPException(502, f"Midtrans Snap error: {r.text[:400]}")
    data = r.json()
    if not data.get("token"):
        raise HTTPException(502, f"Midtrans Snap: no token returned ({data})")

    intent = {
        "id": uid(),
        "invoice_id": invoice_id,
        "tenant_id": inv["tenant_id"],
        "order_id": order_id,
        "amount": int(inv["amount"]),
        "snap_token": data["token"],
        "snap_redirect_url": data.get("redirect_url"),
        "acquirer": "snap",
        "status": "pending",
        "created_at": now_iso(),
        "raw_status": "pending",
    }
    await db.payment_intents.insert_one(intent)
    intent.pop("_id", None)
    return intent


@api.get("/invoices/{invoice_id}/qris/status")
async def qris_status(invoice_id: str):
    """Get latest intent and refresh status from Midtrans."""
    intent = await db.payment_intents.find_one(
        {"invoice_id": invoice_id}, {"_id": 0}, sort=[("created_at", -1)]
    )
    if not intent:
        raise HTTPException(404, "No payment intent")

    if intent["status"] == "settlement":
        return intent

    try:
        r = requests.get(
            f"{MIDTRANS_BASE}/v2/{intent['order_id']}/status",
            headers=midtrans_auth_headers(),
            timeout=15,
        )
    except Exception:
        return intent

    if r.status_code == 404 or r.status_code >= 500:
        return intent
    data = r.json()
    t_status = data.get("transaction_status", "pending")
    fraud = data.get("fraud_status", "accept")

    if t_status in ("settlement", "capture") and fraud == "accept":
        new_status = "settlement"
    elif t_status in ("expire", "cancel", "deny"):
        new_status = t_status
    else:
        new_status = "pending"

    if new_status != intent["status"]:
        await db.payment_intents.update_one(
            {"order_id": intent["order_id"]},
            {"$set": {"status": new_status, "raw_status": t_status, "updated_at": now_iso()}},
        )
        intent["status"] = new_status
        intent["raw_status"] = t_status
        if new_status == "settlement":
            await _mark_invoice_paid(intent["invoice_id"], method=f"qris_{data.get('acquirer', 'gopay')}")
    return intent


@api.post("/midtrans/notification")
async def midtrans_notification(payload: dict):
    """Webhook endpoint for Midtrans HTTP notifications.
    Configure in Midtrans dashboard: <backend>/api/v1/midtrans/notification
    """
    order_id = payload.get("order_id", "")
    status_code = payload.get("status_code", "")
    gross_amount = payload.get("gross_amount", "")
    signature = payload.get("signature_key", "")

    expected = hashlib.sha512(
        f"{order_id}{status_code}{gross_amount}{MIDTRANS_SERVER_KEY}".encode()
    ).hexdigest()
    if not signature or signature != expected:
        log.warning("Midtrans notification: bad signature for order=%s", order_id)
        raise HTTPException(401, "Invalid signature")

    t_status = payload.get("transaction_status", "pending")
    fraud = payload.get("fraud_status", "accept")

    intent = await db.payment_intents.find_one({"order_id": order_id}, {"_id": 0})
    if not intent:
        return {"ok": True, "note": "unknown order"}

    if t_status in ("settlement", "capture") and fraud == "accept":
        await db.payment_intents.update_one(
            {"order_id": order_id},
            {"$set": {"status": "settlement", "raw_status": t_status, "updated_at": now_iso()}},
        )
        await _mark_invoice_paid(
            intent["invoice_id"], method=f"qris_{payload.get('acquirer', 'gopay')}"
        )
    elif t_status in ("expire", "cancel", "deny"):
        await db.payment_intents.update_one(
            {"order_id": order_id},
            {"$set": {"status": t_status, "raw_status": t_status, "updated_at": now_iso()}},
        )
    return {"ok": True}


@api.get("/midtrans/config")
async def midtrans_config():
    return {
        "client_key": MIDTRANS_CLIENT_KEY,
        "env": MIDTRANS_ENV,
        "merchant_id": os.environ.get("MIDTRANS_MERCHANT_ID", ""),
    }


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown():
    client.close()
