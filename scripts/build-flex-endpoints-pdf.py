"""Builds docs/FLEX-2.0-ENDPOINTS.pdf — the Flex 2.0 endpoint requirements, revised for the 6 Oct 2026 decisions,
with request/response shapes for every admin endpoint (derived from the admin mockups).
"""
from decimal import Decimal, ROUND_FLOOR, ROUND_HALF_UP

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    CondPageBreak, KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle, XPreformatted,
)

OUT = r"C:\Users\user\Desktop\Abode-Admin\abode-fe-admin\docs\FLEX-2.0-ENDPOINTS.pdf"

FONTS = "C:/Windows/Fonts"
pdfmetrics.registerFont(TTFont("Body", FONTS + "/arial.ttf"))
pdfmetrics.registerFont(TTFont("Body-Bold", FONTS + "/arialbd.ttf"))
pdfmetrics.registerFont(TTFont("Body-Italic", FONTS + "/ariali.ttf"))
pdfmetrics.registerFont(TTFont("Body-BoldItalic", FONTS + "/arialbi.ttf"))
pdfmetrics.registerFontFamily("Body", normal="Body", bold="Body-Bold", italic="Body-Italic", boldItalic="Body-BoldItalic")
pdfmetrics.registerFont(TTFont("Mono", FONTS + "/consola.ttf"))
pdfmetrics.registerFont(TTFont("Mono-Bold", FONTS + "/consolab.ttf"))
pdfmetrics.registerFontFamily("Mono", normal="Mono", bold="Mono-Bold", italic="Mono", boldItalic="Mono-Bold")

INK = colors.HexColor("#14262b")
MUTED = colors.HexColor("#64748b")
LINE = colors.HexColor("#d5dfe8")
TEAL = colors.HexColor("#0e8a9a")
SOFT = colors.HexColor("#f6f9fb")
CODEBG = colors.HexColor("#f5f7f9")

PILL = {
    "EXISTS": ("#d1fae5", "#065f46"),
    "EXISTS · CHANGE": ("#fef3c7", "#92400e"),
    "NEW": ("#fde4d6", "#9a3412"),
    "MISSING ON BE": ("#fee2e2", "#991b1b"),
    "REMOVED": ("#e5e7eb", "#374151"),
}

base = getSampleStyleSheet()


def st(name, **kw):
    kw.setdefault("fontName", "Body")
    kw.setdefault("textColor", INK)
    return ParagraphStyle(name, parent=base["Normal"], **kw)


S = {
    "title": st("title", fontName="Body-Bold", fontSize=24, leading=28, spaceAfter=6, alignment=TA_LEFT),
    "meta": st("meta", fontSize=8.8, leading=12, textColor=MUTED, spaceAfter=8),
    "h1": st("h1", fontName="Body-Bold", fontSize=15, leading=19, textColor=INK, spaceBefore=14, spaceAfter=3),
    "h2": st("h2", fontName="Body-Bold", fontSize=11, leading=14, textColor=TEAL, spaceBefore=10, spaceAfter=3),
    "body": st("body", fontSize=9, leading=12.6, spaceAfter=4),
    "small": st("small", fontSize=8, leading=11, textColor=MUTED, spaceAfter=3),
    "cell": st("cell", fontSize=8.2, leading=11),
    "head": st("head", fontName="Body-Bold", fontSize=7.8, leading=10),
    "label": st("label", fontName="Body-Bold", fontSize=7.4, leading=9, textColor=MUTED),
    "code": st("code", fontName="Mono", fontSize=7.3, leading=9.4),
    "route": st("route", fontName="Mono-Bold", fontSize=9, leading=12),
    "box": st("box", fontSize=8.6, leading=12),
}

PAGE_W = landscape(A4)[0]
MARGIN = 14 * mm
W = (PAGE_W - 2 * MARGIN) / mm  # usable width in mm


def P(t, s="body"):
    return Paragraph(t, S[s])


def pill(label):
    bg, fg = PILL[label]
    return Paragraph(f'<font backColor="{bg}" color="{fg}" size="7.2"><b>&nbsp;{label}&nbsp;</b></font>', S["cell"])


def H1(t):
    return [P(t, "h1"), Table([[""]], colWidths=[W * mm], rowHeights=[1.2], style=[("LINEBELOW", (0, 0), (-1, -1), 1.2, TEAL)]), Spacer(1, 5)]


def box(html, bg="#f3f8fb", border="#cfe0ea"):
    t = Table([[P(html, "box")]], colWidths=[W * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(bg)),
        ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor(border)),
        ("LEFTPADDING", (0, 0), (-1, -1), 9), ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return [t, Spacer(1, 6)]


def table(header, rows, widths, pill_col=None):
    cells = []
    for row in rows:
        r = []
        for i, c in enumerate(row):
            if pill_col is not None and i == pill_col and c in PILL:
                r.append(pill(c))
            elif isinstance(c, str):
                r.append(P(c, "cell"))
            else:
                r.append(c)
        cells.append(r)
    data = ([[P(h, "head") for h in header]] if header else []) + cells
    t = Table(data, colWidths=[w * mm for w in widths], repeatRows=1 if header else 0)
    style = [
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]
    if header:
        style += [("BACKGROUND", (0, 0), (-1, 0), SOFT), ("LINEABOVE", (0, 0), (-1, 0), 0.5, LINE)]
    t.setStyle(TableStyle(style))
    return t


# ------------------------------------------------------------------ endpoint blocks
COUNTS = {"customer": {}, "admin": {}}


def count(area, status):
    COUNTS[area][status] = COUNTS[area].get(status, 0) + 1


def row_table(rows, area):
    """Compact endpoint table used for customer routes: method, route, status, where used, notes."""
    out = []
    for method, route, status, where, notes in rows:
        count(area, status)
        out.append([f'<font name="Body-Bold" size="7.6">{method}</font>', f'<font name="Mono" size="7.6">{route}</font>', status, where, notes])
    return table(None, out, [16, 70, 28, 40, W - 154], pill_col=2)


def io(req, resp, req_label="Request", resp_label="Response"):
    def cell(label, body):
        return [P(label, "label"), Spacer(1, 2), XPreformatted(body.strip("\n").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"), S["code"])] if body else [P(label, "label"), Spacer(1, 2), P("No body.", "small")]

    half = W / 2
    t = Table([[cell(req_label, req), cell(resp_label, resp)]], colWidths=[half * mm, half * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CODEBG),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("LINEAFTER", (0, 0), (0, -1), 0.5, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def ep(method, route, status, where, notes, req=None, resp=None, req_label="Request", resp_label="Response", extra=None):
    """One admin endpoint: header strip, notes, request/response shapes."""
    count("admin", status)
    head = Table([[
        P(f"<b>{method}</b>", "cell"), Paragraph(f'<font name="Mono-Bold" size="8.6">{route}</font>', S["cell"]), pill(status), P(where, "cell"),
    ]], colWidths=[24 * mm, 138 * mm, 28 * mm, (W - 190) * mm])
    head.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("BACKGROUND", (0, 0), (-1, -1), SOFT),
        ("LINEABOVE", (0, 0), (-1, 0), 0.8, TEAL), ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    block = [Spacer(1, 7), head, Spacer(1, 3), P(notes)]
    if req is not None or resp is not None:
        block.append(io(req, resp, req_label, resp_label))
    if extra:
        block += extra
    return [KeepTogether(block)]


# ------------------------------------------------------------------ pricing engine reference vectors
def price(base_price, d24, d12, n):
    base_price, d24, d12 = Decimal(str(base_price)), Decimal(str(d24)), Decimal(str(d12))
    d = d24 * (36 - n) / Decimal(12) if n >= 24 else d24 + (d12 - d24) * (24 - n) / Decimal(12)
    total = (base_price * (1 - d / 100)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    regular = (total / n).quantize(Decimal("0.01"), rounding=ROUND_FLOOR)
    return d, total, regular, total - regular * (n - 1)


def fmt(x):
    return f"{x:,.2f}"


vec = []
for n in (36, 30, 24, 22, 18, 12):
    d, t, r, f = price(3600000, 5, 15, n)
    vec.append([str(n), f"{d.quantize(Decimal('0.0001'))}%", fmt(t), fmt(r), fmt(f)])
_, _, r0, f0 = price(1000000, 0, 0, 36)
assert (fmt(r0), fmt(f0)) == ("27,777.77", "27,778.05")
_, t35, r35, f35 = price(3600000, 5, 15, 35)
assert (fmt(t35), fmt(r35), fmt(f35)) == ("3,585,000.00", "102,428.57", "102,428.62")

story = []

# ================================================================== cover
story += [
    P("Abode Flex 2.0 — API endpoint requirements", "title"),
    P("Every endpoint the Flex site and the admin need for Flex 2.0, Streaks &amp; Points and Autopay: what exists, what must change, what is new, "
      "where each is used and why. <b>Admin endpoints now carry request and response shapes.</b>", "body"),
    P("Date: 6 Oct 2026 (status updated 9 Oct) &nbsp;·&nbsp; Revision of the 5 Oct 2026 document &nbsp;·&nbsp; Basis: Flex 2.0 PRD v0.1, Recorded Decisions (6 Oct 2026), "
      "Flex 2.0 admin mockups &nbsp;·&nbsp; Scanned: abode-v2, abode-fe-admin, abode-be-v2 at origin/staging (live OpenAPI) &nbsp;·&nbsp; "
      "Audience: backend, frontend and admin teams", "meta"),
]
story += box(
    "<b>How to read this.</b> &nbsp;<font backColor='#d1fae5' color='#065f46'><b>&nbsp;EXISTS&nbsp;</b></font> verified as a route in the backend. "
    "<font backColor='#fef3c7' color='#92400e'><b>&nbsp;EXISTS · CHANGE&nbsp;</b></font> exists but must change for Flex 2.0. "
    "<font backColor='#fde4d6' color='#9a3412'><b>&nbsp;NEW&nbsp;</b></font> does not exist; names and shapes are proposals for the backend team to confirm. "
    "<font backColor='#fee2e2' color='#991b1b'><b>&nbsp;MISSING ON BE&nbsp;</b></font> the frontend already calls it but the backend has no such route. "
    "<font backColor='#e5e7eb' color='#374151'><b>&nbsp;REMOVED&nbsp;</b></font> was in the 5 Oct document and is no longer needed.")
story += box(
    "<b>Scope rulings given by product (updated 6 Oct).</b> The plan-terms snapshot for support and autopay management are <b>not admin screens</b>; the backend handles them. "
    "The admin app gets: the Offers tab pricing column, the Pricing editor, Pricing history, and <b>(D22) a Streaks &amp; Points card in the user-details Summary "
    "with a streak-adjustment endpoint</b>. Emails are sent by the backend; the app saves no email preferences. "
    "D05 (new quote-change / pending-purchase expiry workflow) is deferred: keep the pricing snapshot and existing checkout handling.",
    bg="#fff6ec", border="#f3d3ae")
story += box(
    "<b>What the 6 Oct decisions changed in this document.</b> "
    "<b>D01</b> base tenor fixed at 36 months: no max-tenor field anywhere. "
    "<b>D02</b> admin enters only the base price; first and monthly payment are calculated (base ÷ 36). "
    "<b>D03</b> rounding settled: regular payments round down to 2 dp, final payment clears the residual. "
    "<b>Q9</b> no Finance approval reference: publishing uses the existing asset-pricing edit permission, enforced on the backend. "
    "<b>Q8</b> all Flex assets switch at launch: the rollout route and the features route are REMOVED. "
    "<b>Q11/D08</b> first installment is the minimum purchase payment, smaller later installments are accepted. "
    "<b>D04</b> no shorter-than-12-month Flex plan. <b>Q12</b> manual plans get an Enable-streaks flag. <b>Q13</b> property suggestions go only to customers with no active plan. "
    "Changed rows are tagged in their notes.", bg="#f3f8fb")

story += box(
    "<b>Status, 9 Oct 2026: implemented.</b> The backend built the admin routes in this document on <font name='Mono'>abode-be-v2</font> "
    "<font name='Mono'>staging</font> (PRs #95 and #96) and they are live on the staging API. <b>Where the shipped behaviour differs from the text below, the backend wins:</b> "
    "(1) pricing writes use <font name='Mono'>manage_assets</font> and reads <font name='Mono'>view_assets</font>; "
    "(2) a draft is refused on a tenor_list size (409 PRICING_MODE_CONFLICT), and drafts are marked deferred by product; "
    "(3) streak adjust needs the new <font name='Mono'>adjust_streak</font> permission, takes a 10–500 character reason and an optional "
    "<font name='Mono'>points_change</font> (±100,000, never below a zero balance, else 409 POINTS_BELOW_ZERO); points are untouched without it; "
    "(4) there is no NO_ACTIVE_STREAK error, and with no streak-enabled plan the summary reports 0 for the current streak but keeps the real best streak (fixed 9 Oct); "
    "(5) <font name='Mono'>enable_streaks</font> is accepted on every manual plan type, not only Flex; "
    "(6) the pricing GET's <font name='Mono'>legacy</font> block adds <font name='Mono'>tenor_36_unavailable_reason</font>; "
    "(7) errors carry the code in <font name='Mono'>code</font> plus top-level <font name='Mono'>errors[]</font> / <font name='Mono'>live_version</font>; "
    "(8) the discounted total is rounded half up per unit, as assumed in section 3.4, and the 2-decimal price check is exact so large kobo prices are accepted (fixed 9 Oct); "
    "(9) history's <font name='Mono'>changed_by</font> is the admin's name, with <font name='Mono'>changed_by_email</font> alongside (9 Oct).",
    bg="#eefaf3", border="#bfe6cf")

# ================================================================== 1 summary (filled after counting)
SUMMARY_INDEX = len(story)
story += [Spacer(1, 1)]  # placeholder replaced below

# ================================================================== 2 customer app
story += H1("2. Customer app — Flex site")
story += [P("Shapes for customer routes are unchanged from the 5 Oct document except where tagged <b>6 Oct</b>; request/response structures for these routes are not part of this revision.", "small")]
story += [P("2.1 Existing endpoints (reused or changed)", "h2")]
story.append(row_table([
    ("GET", "/assets?offer_type=flex", "EXISTS · CHANGE", "Flex catalogue cards, landing",
     "The card's “From ₦…” figure is today the minimum initial payment across stored plans. Sizes on a base plan must feed it from the base plan (the 36-month monthly payment)."),
    ("GET", "/assets/:id", "EXISTS · CHANGE", "Flex detail page, configure card",
     "For a base-plan size also return base tenor (36), base price, checkpoints (24 and 12) and the live pricing version, so the page shows the standard 36-month plan before the budget field. Legacy sizes keep plans[]. <b>6 Oct:</b> no max tenor. Same size fields as the admin tree (section 3.1)."),
    ("GET", "/assets/affordable", "EXISTS · CHANGE", "Affordability page",
     "<b>6 Oct (Q6):</b> must use Flex 2.0 pricing logic so the same estate, size, units and budget yield the same terms in discovery and purchase."),
    ("GET", "/assets/trending", "EXISTS", "Explore, Home; “What's next” on a completed plan",
     "<b>6 Oct (D20):</b> use the existing endpoint and ranking; no new 30-day ranking. Owned estates and unavailable offers are excluded by the caller (e.g. the suggestions email job); take the highest-ranked eligible result."),
    ("GET", "/acquisitions/my-plans", "EXISTS · CHANGE", "My assets list, Home, Wallet autopay plan picker",
     "Add per-plan: pricing summary, covered_through, next obligation, autopay state, streak_enabled. Without these the Wallet picker needs one call per plan."),
    ("GET", "/acquisitions/my-plans/:id", "EXISTS · CHANGE", "My plan page (coverage, timeline)",
     "Add the saved pricing snapshot, per-month coverage including prepaid months, and autopay state. Timeline fields already exist (allocation_status, plan_completed_at, deed_sent_at)."),
    ("GET", "/acquisitions/flex/pending", "EXISTS", "Pending-transfer state after paying",
     "Shows submitted but unconfirmed purchases. Must expose the saved quote so a pending purchase keeps its terms."),
    ("POST", "/acquisitions/flex/paystack/initiate", "EXISTS · CHANGE", "Buy drawer (card)",
     "Today takes tenor_months and looks up a stored plan. Must accept a server-issued quote reference and store the snapshot on the pending transaction. <b>6 Oct (Q11):</b> the first installment is the <i>minimum</i> payment; the customer may pay more, up to the agreed total, and the excess covers future installments without repricing. <b>6 Oct (D05):</b> no new QUOTE_CHANGED / expiry flow; keep existing checkout handling."),
    ("POST", "/acquisitions/flex/transfer/submit", "EXISTS · CHANGE", "Buy drawer (bank transfer)",
     "Same change as above. Approval later must use the submitted snapshot, not the current price."),
    ("POST", "/acquisitions/flex/wallet/pay", "EXISTS · CHANGE", "Buy drawer (wallet)",
     "Same change as above. A comment in the Flex frontend schema says no wallet purchase exists; that is stale — the endpoint exists and the hook uses it."),
    ("POST", "/acquisitions/flex/paystack/recurring", "EXISTS · CHANGE", "Pay installment drawer, “Pay installment” buttons",
     "<b>6 Oct (D08, D11):</b> smaller payments are accepted and aggregate toward the monthly requirement; payments apply to the oldest unpaid installment first and must keep installments and penalties distinct. Must not collide with an in-flight autopay charge (extend the existing pending-recurring check)."),
    ("POST", "/acquisitions/flex/transfer/recurring · /wallet/recurring", "EXISTS · CHANGE", "Pay installment drawer",
     "<b>6 Oct:</b> same partial-payment and oldest-first rules. A pending transfer pauses autopay for that plan (D18); approval uses the verified bank-payment date, not the approval date (D09)."),
    ("GET", "/acquisitions/flex/plans · /plans/:id · /plans/:id/documents(/:kind)", "EXISTS", "Owned plan and documents",
     "Unchanged. Documents (contract of sale, certificate) are separate from payment completion."),
    ("POST", "/payments/verify · /payments/paystack/verify", "EXISTS", "Return from Paystack", "Unchanged."),
    ("GET", "/wallet · /wallet/transactions", "EXISTS · CHANGE", "Wallet page (balance, history)",
     "The Wallet page hosts “Set up autopay”. Transactions should show autopay charges; check whether a new transaction kind is needed. Wallet credits alone never earn points (Q5)."),
    ("GET", "/users/me/recent-activity", "EXISTS", "Home activity feed", "Optional: show autopay results and points awards."),
], "customer"))
story += [P("2.2 New endpoints", "h2")]
story.append(row_table([
    ("POST", "/assets/:assetId/flex/quote", "NEW", "Flex detail — standard plan and budget calculator",
     "Server-side pricing authority. Body: size_sqm, units, optional monthly_budget. Returns the plan that fits (months, discount, total, first/monthly/final payment), or too-low (with the minimum payment). <b>6 Oct (D04):</b> at a budget equal to the 12-month installment return the 12-month plan; above it recommend the estate's actual Full Ownership offer while retaining the 12-month Flex option; if there is no matching FO offer keep the 12-month plan. Never invent a shorter plan or an FO price. Returns a signed quote reference bound to pricing version, size, units and duration."),
    ("GET", "/users/me/streak", "NEW", "Streak &amp; points page",
     "Current and best streak, points balance, this month's qualification, per-plan coverage (what is covered, what is still needed) and upcoming covered months, shown separately from earned points (D12, Q2). One call, account-wide."),
    ("GET", "/users/me/points/ledger", "NEW", "Points history", "Append-only entries (month, points, reason, source). Adjustments and D13 reversals appear as separate entries. Paged."),
    ("POST", "/autopay/authorization/initiate", "NEW", "Wallet → “Set up autopay” → authorize",
     "Starts card authorization with Paystack and returns the redirect URL. Enables no plan. <b>6 Oct (D17):</b> free setup where supported, or an existing reusable authorization with consent; otherwise a disclosed ₦50 charge that is refunded. Capability for Abode's account is still to be verified (Q10). Setup and refund never earn points."),
    ("POST", "/autopay/authorization/verify", "NEW", "Return from authorization", "Confirms the result and stores the reusable authorization. Drives the “setup failed / not finished” state. The webhook can also complete it."),
    ("GET", "/autopay", "NEW", "Wallet autopay section", "Authorization summary (brand, last four digits, status — never the token) plus every owned plan with enabled flag, next charge date, expected amount and last result."),
    ("PUT", "/autopay/plans/:planId", "NEW", "Per-plan switch",
     "Body {enabled}. Explicit consent per plan. Refused for suspended, completed or cancelled plans. A new purchase is never enabled automatically. <b>6 Oct (D19):</b> for Full Ownership one property-level switch covers land installments and then document installments when their phase starts."),
    ("DELETE", "/autopay/authorization", "NEW", "“Change card” / remove",
     "Removes the authorization and stops every plan. <b>6 Oct (D18):</b> stop future charges and retries immediately; a charge already submitted may still resolve — tell the customer."),
    ("GET", "/autopay/attempts", "NEW", "Recent autopay table", "History of paid, failed, skipped (already covered) and confirming attempts for the customer."),
    ("GET", "/users/me/features", "REMOVED", "—", "Q8: all Flex assets follow the new flow at launch; no pilot cohort gating is needed."),
], "customer"))

# ================================================================== 3 admin app
story += [PageBreak()] + H1("3. Admin app")
story += [P("3.0 Conventions used by every shape below", "h2")]
story.append(table(None, [
    ["Envelope", "<font name='Mono'>{ success, data, message, meta }</font>. Shapes below show the contents of <font name='Mono'>data</font>. Lists are <font name='Mono'>data: [..]</font> with <font name='Mono'>meta: { page, limit, total, totalPages }</font>."],
    ["Money", "Naira as a JSON number with at most 2 decimal places (the backend's existing IsNaira convention). Never strings, never kobo integers."],
    ["Percent", "JSON number, e.g. <font name='Mono'>5</font> means 5%. Admin input has at most 2 decimal places; calculated discounts are returned to 4."],
    ["Dates", "ISO-8601 UTC strings. Calendar months are <font name='Mono'>\"YYYY-MM\"</font> in Africa/Lagos."],
    ["Unknown fields", "The backend rejects unknown body fields with 400, so the admin sends exactly the fields shown in each Request."],
    ["Permission", "Pricing writes (PUT/DELETE draft, publish, convert-legacy) require the <b>existing asset-pricing edit permission</b>, enforced on the backend (Q9). The admin app gates the editor on <font name='Mono'>manage_assets</font> (view needs <font name='Mono'>view_assets</font>) — please confirm that is the right existing permission or give us its exact name. The streak card's Adjust button is gated on <font name='Mono'>edit_user</font> as a stand-in until you name the right one. Reads need asset-view. There is <b>no Finance approval field</b>."],
    ["Pricing routes", "All new pricing routes sit under <font name='Mono'>/admin/assets/:assetId/offers/flex/sizes/:sizeId/pricing</font>, written “…/pricing”."],
    ["Errors", "Existing shape <font name='Mono'>{ statusCode, code, message[], path }</font>. Codes proposed for this work are listed in 3.3."],
], [32, W - 32]))

story += [P("3.1 Existing endpoints (reused, changed or missing)", "h2")]

TREE = """
// each size in offers[].sizes[] (additive; FO / commercial unchanged)
{
  "_id": "665f01...",
  "size_sqm": 300,
  "units_available": 26,
  "is_active": true,
  "pricing_mode": "base_plan",      // "base_plan" | "tenor_list" | "unpriced"
  "pricing": {                      // null unless pricing_mode = "base_plan"
    "live_version": 2,
    "base_tenor_months": 36,        // always 36 in this release
    "base_price_per_unit": 3600000,
    "first_payment": 100000,        // calculated; equals monthly_payment
    "monthly_payment": 100000,      // months 1-35
    "final_payment": 100000,        // month 36, clears the residual
    "checkpoints": [
      { "months": 24, "discount_pct": 5 },
      { "months": 12, "discount_pct": 15 }
    ],
    "published_at": "2026-10-05T09:12:00Z",
    "published_by": { "id": "u_1", "name": "A. Bello" },
    "has_draft": false
  },
  "plans": []   // [] for base_plan and unpriced; tenor plans for tenor_list
}
"""
TREE_NOTES = """
pricing_mode drives the Offers tab:
 base_plan  -> one-line summary + "Edit pricing"
 tenor_list -> today's plans table + "Convert to base plan"
 unpriced   -> new Flex size, shown as "Not priced yet";
               must not be sellable until its first publish
"""
story += ep("GET", "/admin/assets · /admin/assets/:id", "EXISTS · CHANGE", "Admin: asset list and Offers tab",
            "The Offers tab needs each Flex size's pricing mode and live version for the Pricing and Price version columns. The <b>list</b> response only needs pricing_mode and pricing.live_version on each size; the <b>detail</b> response returns the full object. "
            "Mockup mapping: “Base plan · ₦1,800,000 · 36 mo · 5% @ 24 · 15% @ 12” is built from pricing.base_price_per_unit and checkpoints; the “Pricing v2” badge from live_version.",
            req="GET /admin/assets/:id\n(no body)\n" + TREE_NOTES, resp=TREE, resp_label="Response (size object)")

story += ep("POST", "/admin/assets/:assetId/offers/:offerType/sizes", "EXISTS · CHANGE", "Admin: Add size",
            "Today AddSizeDto requires plans, so the admin seeds a ₦1 placeholder plan. For a Flex offer, plans must become optional: a size created without plans is created <b>unpriced</b>. "
            "A Flex size sent <i>with</i> plans still works and becomes a tenor_list size. FO and commercial rules are unchanged.",
            req="""
{
  "size_sqm": 300,
  "units_available": 26
}          // no "plans" for the new Flex flow
""",
            resp="""
{
  "_id": "665f02...",
  "size_sqm": 300,
  "units_available": 26,
  "is_active": true,
  "pricing_mode": "unpriced",
  "pricing": null,
  "plans": []
}
""")

story += ep("POST", "/admin/assets/:assetId/offers", "EXISTS · CHANGE", "Admin: Add offer (Flex)",
            "Adding a Flex offer sends its first size inside the body (<b>OfferInputDto.sizes[]</b>), and every nested size is a SizeInputDto, so the same relaxation as Add size applies: for <font name='Mono'>offer_type: \"flex\"</font>, <font name='Mono'>sizes[].plans</font> becomes optional and a size without plans is created <b>unpriced</b>. Everything else about adding an offer is unchanged.",
            req="""
{
  "offer_type": "flex",
  "is_active": true,
  "allocation_qualification_pct": 30,
  "sizes": [
    { "size_sqm": 300, "units_available": 26 }   // no "plans"
  ]
}
""",
            resp="""
201  the created offer, each size with
     "pricing_mode": "unpriced", "pricing": null, "plans": []
""")

story += ep("PATCH / DELETE", "/admin/assets/:assetId/offers/:offerType/sizes/:sizeId", "EXISTS · CHANGE", "Admin: Edit / delete size",
            "Units and active flag keep working in every pricing mode (no new fields). A PATCH that full-replaces plans[] on a base_plan size is refused. "
            "Deleting a size that has purchases keeps its existing guard.",
            req="""
PATCH body (unchanged)
{ "units_available": 30, "is_active": true }

PATCH on base_plan size with "plans": [...]
""",
            resp="""
200  updated size (shape above)

409  { "code": "PRICING_MODE_BASE_PLAN",
       "message": ["This size is priced by a base plan.
                   Edit its pricing instead."] }
""")

story += ep("POST / PATCH / DELETE", "/admin/assets/:assetId/offers/:offerType/sizes/:sizeId/plans(/:tenor)", "EXISTS · CHANGE", "Admin: Add / edit plan (tenor list)",
            "Kept for legacy tenor_list sizes only, so there is one source of truth. Bodies are unchanged (PlanInputDto: tenor_months, land_price, initial_payment, monthly_installment, is_promo, is_active). "
            "On a base_plan or unpriced size return the 409 below.",
            req="existing PlanInputDto — unchanged", resp="""
409  { "statusCode": 409,
       "code": "PRICING_MODE_BASE_PLAN",
       "message": ["Plans cannot be edited on a base-plan size."] }
""")

HIST_RESP = """
{
  "data": [
    {
      "version": 17,               // increasing per asset
      "action": "publish-pricing",
      "summary": "300 sqm · Pricing v2 — 5% @ 24, 15% @ 12 · base ₦3,600,000",
      "changed_by": "A. Bello",    // nullable
      "changed_at": "2026-10-05T09:12:00Z",
      "size_id": "665f01...",      // NEW, null for non-size actions
      "pricing_version": 2,        // NEW, pricing actions only
      "purchase_count": 3,         // NEW, pricing actions only
      "pending_transfer_count": 0, // NEW, pricing actions only
      "superseded": false          // NEW, pricing actions only
    },
    { "version": 14, "action": "update-plan",
      "summary": "500 sqm · 24 months: monthly ₦260,000 → ₦265,000",
      "changed_by": "F. Ade", "changed_at": "2026-09-02T11:02:00Z" }
  ],
  "meta": { "page": 1, "limit": 50, "total": 5, "totalPages": 1 }
}
"""
story += ep("GET", "/admin/assets/:assetId/offers/history", "MISSING ON BE", "Admin: Offers → History sheet",
            "The admin already calls this (paged, newest first); staging has no such route. Existing actions are kept (add-offer, update-offer, add-size, update-size, delete-size, add-plan, update-plan, delete-plan); "
            "<b>two are added: publish-pricing and convert-pricing.</b> The mockup shows each pricing entry with its checkpoints and base price in the summary, a purchase count (“3 purchases so far”), a “now superseded” marker, and an alert about buyers — including transfers awaiting approval — who keep their saved terms; "
            "those come from purchase_count, superseded and pending_transfer_count. The summary stays server-written; the stored snapshot is read from the versions routes below.",
            req="GET …/offers/history?page=1&limit=50", resp=HIST_RESP)

story += ep("GET", "/admin/payment-plans · /summary · /export", "EXISTS", "Admin: Payment Plans page",
            "No new admin screen. Optional: add pricing_version and streak_enabled to each row.", req=None, resp=None)

SNAP = """
{
  ...existing plan fields,
  "streak_enabled": true,
  "pricing_snapshot": {
    "source": "quote",             // "quote" | "admin_created" | "legacy_plan"
    "pricing_version": 2,          // null for admin_created, legacy_plan
    "base_price_per_unit": 3600000,
    "checkpoints": [
      { "months": 24, "discount_pct": 5 },
      { "months": 12, "discount_pct": 15 }
    ],
    "entered_monthly_budget": 350000,   // null if none entered
    "selected_tenor_months": 18,
    "applied_discount_pct": 10,
    "units": 2,
    "total": 6480000,
    "first_payment": 360000,
    "monthly_payment": 360000,
    "final_payment": 360000,
    "method_version": "piecewise-linear-v1"
  }
}
"""
story += ep("GET", "/admin/flex/purchase/plans · /plans/:planId", "EXISTS · CHANGE", "Admin: plan detail (via users and payment plans)",
            "The response carries the saved pricing snapshot read-only. Per the scope ruling there is no admin screen for it; support reads it from the API. For manual plans source is admin_created and the snapshot holds the terms used at creation (Q12).",
            req="(no body)", resp=SNAP, resp_label="Response (plan)")

story += ep("POST", "/admin/users/:id/assets/flex", "EXISTS · CHANGE", "Admin: admin-created plan",
            "A manually created plan has no customer quote, so its snapshot source is admin_created. <b>6 Oct (Q12):</b> add an optional “Enable streaks” flag, on by default; off means the plan neither earns nor blocks the account-wide streak. "
            "Autopay is never enabled by creation. All existing AdminCreateFlexPlanDto fields are unchanged.",
            req="""
{
  ...all existing AdminCreateFlexPlanDto fields...,
  "enable_streaks": true    // NEW, optional, default true
}
""",
            resp="""
{
  ...created plan,
  "streak_enabled": true,
  "pricing_snapshot": {
    "source": "admin_created",
    "pricing_version": null,
    "selected_tenor_months": 24,
    "total": 2400000,
    "first_payment": 100000,
    "monthly_payment": 100000
  }
}
""")

story += ep("POST", "/admin/acquisitions/transactions/:txId/approve · /decline", "EXISTS · CHANGE", "Admin: transfer approval",
            "No change to the admin request or response. Behaviour: approval must create the plan from the <i>submitted</i> snapshot even when a newer pricing version is live, and uses the verified bank-payment date, not the approval date, for streak purposes (D09). "
            "A transfer awaiting review pauses autopay for that plan; a decline must notify the customer before collection resumes (D18).",
            req=None, resp=None)

story += ep("PATCH / POST", "/admin/users/:id/assets/:planId/next-payment-date · balance/adjust · spec · suspend · unsuspend · close", "EXISTS · CHANGE", "Admin: plan mutations",
            "No change to requests or responses. Behaviour: each must recompute coverage, re-evaluate the affected month's streak record, and pause or stop autopay. A suspended streak-enabled plan with an outstanding balance blocks account-wide qualification until reinstated (D11). "
            "A closed or soft-deleted plan stays in assessments until closure is finalised and nothing collectible remains. Reward removals go through the points ledger as visible entries (D13), never a silent edit.",
            req=None, resp=None)

story += [P("3.2 New endpoints", "h2")]

LIMITS = """
{
  "size_id": "665f01...",
  "size_sqm": 300,
  "pricing_mode": "base_plan",
  "limits": {
    "base_tenor_months": 36,
    "min_tenor_months": 12,
    "checkpoint_months": [24, 12]
  },
  "live": {                        // null when unpriced
    "version": 2,
    "base_price_per_unit": 3600000,
    "first_payment": 100000,
    "monthly_payment": 100000,
    "final_payment": 100000,
    "checkpoints": [
      { "months": 24, "discount_pct": 5 },
      { "months": 12, "discount_pct": 15 }
    ],
    "method_version": "piecewise-linear-v1",
    "published_by": { "id": "u_1", "name": "A. Bello" },
    "published_at": "2026-10-05T09:12:00Z",
    "purchase_count": 3
  },
  "draft": null,                   // or the draft object (see PUT draft)
  "legacy": null                   // only when pricing_mode = "tenor_list":
  // { "tenor_36_land_price": 3600000 | null,
  //   "active_tenors": [12, 24, 36] }
}
"""
story += ep("GET", "…/pricing", "NEW", "Admin: Pricing editor (open sheet)",
            "Returns what the editor sheet needs in one call: limits, the live version, the current draft, and for tenor-list sizes the legacy data used to pre-fill “Convert to base plan”. "
            "Mockup mapping: the “Base tenor” field is read-only from limits.base_tenor_months (D01); there is no Maximum-tenor field. The sheet's “Draft v3 · based on v2” badge is draft.next_version and draft.based_on_version. "
            "<b>legacy.tenor_36_land_price</b> is the existing 36-month plan price per unit; when it is null or inconsistent the editor shows a blank base price and says why — a price is never inferred (Q7).",
            req="(no body, no query)", resp=LIMITS)

PV_REQ = """
{
  "base_price_per_unit": 3600000,
  "checkpoints": [
    { "months": 24, "discount_pct": 5 },
    { "months": 12, "discount_pct": 15 }
  ]
}
// same body as draft and publish.
// Price is per unit. Month values are fixed
// by the server (24 and 12); only the
// discounts are editable.
"""
PV_RESP = """
{
  "valid": true,
  "errors": [],
  "first_payment": 100000,
  "monthly_payment": 100000,
  "final_payment": 100000,
  "rows": [
    { "months": 36, "is_base": true, "is_checkpoint": false,
      "discount_pct": 0, "total": 3600000,
      "regular_payment": 100000, "final_payment": 100000,
      "largest_payment": 100000 },
    { "months": 35, "is_base": false, "is_checkpoint": false,
      "discount_pct": 0.4167, "total": 3585000,
      "regular_payment": 102428.57, "final_payment": 102428.62,
      "largest_payment": 102428.62 },
    { "months": 24, "is_checkpoint": true, "discount_pct": 5, ... },
    ...one row per whole month, 36 down to 12...
  ]
}
// invalid numbers: 200 with "valid": false, "errors":
// [{ "field", "code", "message" }] and "rows": []
"""
story += ep("POST", "…/pricing/preview", "NEW", "Admin: Pricing editor (preview table)",
            "Server computes every whole month from 12 to 36: discount, total, regular and final payment, and the largest single payment. The page also calculates instantly in the browser; this proves the server agrees with it. "
            "Mockup mapping: the table columns Months / Discount / Total / Payment / Final payment / “Needs ≥ / mo” are months, discount_pct, total, regular_payment, final_payment, largest_payment; is_base and is_checkpoint drive the “base” and “checkpoint” tags and shading. "
            "“Needs ≥ / mo” is largest_payment, so a customer's entered budget always covers the plan shown. Preview never throws on bad numbers; it returns valid:false and the same error list publish would return.",
            req=PV_REQ, resp=PV_RESP)

DRAFT_RESP = """
{
  "based_on_version": 2,          // null if unpriced
  "next_version": 3,              // what Publish will create
  "base_price_per_unit": 3700000,
  "checkpoints": [
    { "months": 24, "discount_pct": 5 },
    { "months": 12, "discount_pct": 15 }
  ],
  "saved_by": { "id": "u_1", "name": "A. Bello" },
  "saved_at": "2026-10-06T08:00:00Z"
}

DELETE …/pricing/draft   -> 204 (discard the draft)
"""
story += ep("PUT / DELETE", "…/pricing/draft", "NEW", "Admin: Pricing editor → Save draft",
            "Saves the base price and the two discounts without affecting customers. One shared draft per size; PUT replaces it. <b>Also allowed on a tenor_list size</b>, so a conversion can be prepared ahead of launch (Q8) and published later with convert-legacy. A draft is checked for shape only (numbers present, not negative); the full rules run on publish. DELETE discards it.",
            req=PV_REQ, resp=DRAFT_RESP)

PUB_REQ = """
{
  "base_price_per_unit": 3600000,
  "checkpoints": [
    { "months": 24, "discount_pct": 5 },
    { "months": 12, "discount_pct": 15 }
  ],
  "expected_live_version": 2      // null for the first publish
}
// no approval reference, no tenor, no first or
// monthly payment: those are not inputs any more.
"""
PUB_RESP = """
201
{
  "version": 3,
  "based_on_version": 2,
  "size_id": "665f01...",
  "base_tenor_months": 36,
  "base_price_per_unit": 3600000,
  "first_payment": 100000,
  "monthly_payment": 100000,
  "final_payment": 100000,
  "checkpoints": [ ... ],
  "method_version": "piecewise-linear-v1",
  "published_by": { "id": "u_1", "name": "A. Bello" },
  "published_at": "2026-10-06T09:00:00Z",
  "purchase_count": 0,
  "status": "live"
}
// 400 PRICING_VALIDATION_FAILED, 409 PRICING_VERSION_CONFLICT
// (see 3.3). The previous version becomes "superseded".
"""
story += ep("POST", "…/pricing/publish", "NEW", "Admin: Pricing editor → Publish",
            "Validates, then creates a new <b>immutable</b> version and makes it live. Existing and pending purchases are untouched. expected_live_version guards two admins publishing at once. "
            "Validation (every problem is returned, not just the first): base price &gt; 0 with at most 2 dp; exactly two checkpoints at months 24 and 12; each discount ≥ 0 and &lt; 100 with at most 2 dp; and a shorter plan never costs more, i.e. 0 ≤ d24 ≤ d12. "
            "There is no tenor, reconciliation or Finance-reference rule (D01, D02, Q9). Mockup mapping: the red messages (“Two checkpoints are both at…”, “The 24-month discount is larger than the 12-month discount…”) are the server's error list; the Publish button stays disabled client-side while the same rules fail.",
            req=PUB_REQ, resp=PUB_RESP)

VER_RESP = """
GET …/pricing/versions?page=1&limit=20
{
  "data": [
    { "version": 2, "status": "live",
      "base_price_per_unit": 3600000,
      "checkpoints": [ ... ],
      "published_by": { "id": "u_1", "name": "A. Bello" },
      "published_at": "2026-10-05T09:12:00Z",
      "purchase_count": 3, "pending_transfer_count": 0 },
    { "version": 1, "status": "superseded", ...
      "purchase_count": 11, "pending_transfer_count": 2 }
  ],
  "meta": { "page": 1, "limit": 20, "total": 2, "totalPages": 1 }
}

GET …/pricing/versions/2
the publish response shape (full snapshot) plus
"status", "purchase_count", "pending_transfer_count",
so any historical quote can be reproduced.
404 PRICING_VERSION_NOT_FOUND for an unknown version.
"""
story += ep("GET", "…/pricing/versions · …/pricing/versions/:version", "NEW", "Admin: Pricing history",
            "Version list with purchase counts, and a stored snapshot per version so any historical quote can be reproduced. Backs the “Pricing history” detail behind the History sheet (the sheet's list itself comes from offers/history above).",
            req="(no body)", resp=VER_RESP)

CONV_RESP = """
201
{
  "version": { ...publish response shape, version = 1 },
  "size": {
    "_id": "665f01...",
    "pricing_mode": "base_plan",
    "plans": []
  }
}

409 PRICING_MODE_CONFLICT   size is already on a base plan
400 PRICING_VALIDATION_FAILED   same rules as publish
"""
story += ep("POST", "…/pricing/convert-legacy", "NEW", "Admin: Offers tab → “Convert to base plan”",
            "Moves a hand-entered tenor-list size onto a base plan. It is atomic: validation, version 1, the mode switch and the history entry (action convert-pricing) all succeed or none do. "
            "Existing buyers keep their original plans and terms; the old tenor plans stay on the backend for those plans, are no longer returned in plans[], and can no longer be sold. "
            "Every Flex size must be prepared before launch (Q8), so this is the route the pre-launch data task uses; sizes with missing or inconsistent 36-month data must be resolved explicitly, not guessed (Q7).",
            req=PV_REQ.split("// same body")[0] + "// expected_live_version is not accepted:\n// a tenor_list size has no live version.", resp=CONV_RESP)

STREAK_RESP = """
{
  "current_streak": 7,
  "best_streak": 9,
  "points_balance": 1300,
  "current_month": {
    "month": "2026-10",
    "qualified": true,
    "awarded_at": "2026-10-03T11:20:00Z"
  },
  "covered_through": "2026-12",   // last prepaid month; null if none
  "streak_enabled_plans": 2,
  "last_adjustment": {            // null if never adjusted
    "at": "2026-09-30T10:00:00Z",
    "by": "F. Ade",
    "reason": "Support ticket 4411"
  }
}
// no streak-enabled plan: zeros, "current_month": null,
// "streak_enabled_plans": 0 -> the card shows an empty
// state, never a faked zero streak.
"""
story += ep("GET", "/admin/users/:id/streak", "NEW", "Admin: user details → Summary → Streaks &amp; Points card",
            "<b>6 Oct (D22).</b> Data for the card that shows the active streak and points balance. Read-only; requires the user-view permission.",
            req="(no body)", resp=STREAK_RESP)

ADJ_REQ = """
{
  "current_streak": 5,     // integer >= 0: the value the
                           // streak should become
  "reason": "Bank transfer verified on time, approved late (ticket 4411)"
                           // required, 20 to 2000 characters (the admin's
                           // existing reason rule)
}
"""
ADJ_RESP = """
200
{
  "before": { "current_streak": 3, "best_streak": 9, "points_balance": 1300 },
  "after":  { "current_streak": 5, "best_streak": 9, "points_balance": 1300 },
  "audit_id": "adj_8f3c01",
  "adjusted_at": "2026-10-06T10:15:00Z",
  "adjusted_by": { "id": "u_1", "name": "A. Bello" }
}
409 NO_CHANGE   requested value equals the current streak
409 NO_ACTIVE_STREAK   the customer has no streak-enabled plan
403            caller lacks the adjustment permission
"""
story += ep("POST", "/admin/users/:id/streak/adjust", "NEW", "Admin: user details → Streaks &amp; Points card → Adjust",
            "<b>6 Oct (D22).</b> Authorised streak adjustment with a required reason and an append-only audit record (actor, user, before, after, reason, time) that also appears in Admin Logs. "
            "The decisions do <b>not</b> approve arbitrary points adjustment, adjustment limits, or an automatic points change when a streak is adjusted, so points_balance never changes here. "
            "System-led corrections for reversed payments stay governed by D13.",
            req=ADJ_REQ, resp=ADJ_RESP)

story += ep("PATCH", "/admin/config/flex-2-rollout", "REMOVED", "—",
            "Q8: every Flex asset follows the new flow at launch and there is no per-estate pilot switch. Preparing every size's configuration before launch replaces the pilot gate.", req=None, resp=None)

# ---- 3.3 errors
story += [CondPageBreak(60 * mm), P("3.3 Error codes proposed for the admin routes", "h2")]
story.append(table(["HTTP", "code", "When"], [
    ["400", "PRICING_VALIDATION_FAILED", "Publish or convert-legacy failed validation. Body also carries <font name='Mono'>errors: [{ field, code, message }]</font> listing every problem. Rule codes: BASE_PRICE_INVALID, CHECKPOINTS_INVALID, DISCOUNT_OUT_OF_RANGE, DISCOUNT_ORDER_INVALID."],
    ["409", "PRICING_VERSION_CONFLICT", "expected_live_version is stale. Body includes <font name='Mono'>live_version</font> so the app can reload."],
    ["409", "PRICING_MODE_CONFLICT", "A pricing route on a non-Flex size, publish on a tenor_list size, or convert-legacy on a base_plan size."],
    ["409", "PRICING_MODE_BASE_PLAN", "Plan add / edit / delete, or full-replace of plans[], on a base-plan or unpriced size."],
    ["404", "PRICING_VERSION_NOT_FOUND", "Unknown version."],
    ["409", "NO_CHANGE", "Streak adjust to the value the streak already has (no audit record is written)."],
    ["409", "NO_ACTIVE_STREAK", "Streak adjust for a customer with no streak-enabled plan: there is no active streak to change."],
    ["403", "(existing permission error)", "Caller lacks the pricing-edit or streak-adjustment permission."],
], [14, 56, W - 70]))

# ---- 3.4 pricing engine
story += [CondPageBreak(80 * mm), P("3.4 Pricing engine the admin shapes assume", "h2")]
story += [
    P("One 36-month base plan per Flex size, with admin-set discounts at exactly two checkpoints: 24 and 12 months. Any whole month from 12 to 36 is calculated by straight-line interpolation "
      "between the two nearest points of (36, 0%), (24, d24) and (12, d12), separately for each segment (D01–D03). Use decimal arithmetic, not floats."),
    XPreformatted("""
discount(n) = d24 * (36 - n) / 12                     for 24 <= n <= 36
discount(n) = d24 + (d12 - d24) * (24 - n) / 12       for 12 <= n <  24
total(n)    = round_half_up_to_kobo( base_price * (1 - discount(n) / 100) )        per unit
regular(n)  = floor_to_2dp( total(n) / n )            months 1 .. n-1  (month 1 is the first payment)
final(n)    = total(n) - regular(n) * (n - 1)         month n, clears the exact residual
largest(n)  = max(regular(n), final(n))
""".strip("\n"), ParagraphStyle("cb", parent=S["code"], backColor=CODEBG, borderPadding=6, spaceBefore=2, spaceAfter=8, leftIndent=6)),
    P("Rounding the <i>discounted total</i> itself to the kobo is our assumption (D03 fixes only installment rounding) — please confirm, see section 8. "
      "Reference vectors (base ₦3,600,000 per unit, d24 = 5%, d12 = 15%):"),
    table(["Months", "Discount", "Total", "Regular payment", "Final payment"], vec, [26, 36, 52, 52, 52]),
    Spacer(1, 4),
    P("Also from the decisions record: ₦1,000,000 over 36 months at 0% gives 35 payments of ₦27,777.77 and a final payment of ₦27,778.05. For a 5% / 15% configuration, 30 months is 2.5% and 18 months is 10%, as in the table."),
]

# ================================================================== 3.5 mockup mapping
story += [CondPageBreak(60 * mm), P("3.5 How each mockup element is fed", "h2")]
story.append(table(["Mockup screen · element", "Field / route"], [
    ["1 Offers · offer header “Flex · Active · Allocation qualification 30%”", "offer.offer_type, offer.is_active, offer.allocation_qualification_pct (existing)"],
    ["1 Offers · size, units available, status", "size.size_sqm, size.units_available, size.is_active (existing)"],
    ["1 Offers · Pricing cell (“Base plan” + ₦ · 36 mo · discounts)", "size.pricing_mode = base_plan, pricing.base_price_per_unit, pricing.checkpoints"],
    ["1 Offers · Pricing cell (“Tenor list · 3 hand-entered plans”)", "size.pricing_mode = tenor_list, size.plans[].tenor_months"],
    ["1 Offers · Price version badge (“Pricing v2” / —)", "pricing.live_version / null"],
    ["1 Offers · Edit pricing / Convert to base plan", "GET …/pricing, then publish; or convert-legacy for tenor_list"],
    ["1 Offers · + Add size", "POST …/sizes with no plans (unpriced size)"],
    ["2 Editor · size chips", "offers → sizes[] already loaded; one GET …/pricing per size"],
    ["2 Editor · “Draft v3 · based on v2”", "draft.next_version, draft.based_on_version"],
    ["2 Editor · Base tenor 36 (read-only)", "limits.base_tenor_months. <b>Maximum tenor field removed (D01)</b>"],
    ["2 Editor · Base price per unit", "publish / draft / preview body: base_price_per_unit"],
    ["2 Editor · First and monthly payment", "<b>Read-only, calculated (D02)</b>: preview first_payment, monthly_payment, final_payment. <b>Reconciliation check removed</b>"],
    ["2 Editor · Discount checkpoints", "checkpoints[]: months fixed at 24 and 12, discount_pct editable"],
    ["2 Editor · Preview table", "POST …/pricing/preview rows[]"],
    ["2 Editor · validation list", "preview.errors[] / publish 400 errors[]"],
    ["2 Editor · Finance approval reference", "<b>Removed (Q9)</b>"],
    ["2 Editor · Save draft / Publish as v3", "PUT …/pricing/draft / POST …/pricing/publish"],
    ["2 Editor · “Load example” chips", "Demo-only in the mockup; not built"],
    ["3 History · entries, purchases, superseded, transfers note", "GET …/offers/history (publish-pricing, convert-pricing, purchase_count, superseded, pending_transfer_count)"],
    ["User details · Streaks &amp; Points card (D22, not in the mockup)", "GET /admin/users/:id/streak, POST /admin/users/:id/streak/adjust"],
], [110, W - 110]))

# ================================================================== 4 backend-only
story += [PageBreak()] + H1("4. Backend-only work (no endpoint called by the apps)")
story.append(table(None, [
    ["Pricing engine", "Piecewise-linear interpolation at full precision, rounded to the kobo. <b>6 Oct (D03, settled):</b> regular payments round down to 2 dp, the final payment clears the residual; applies to the base plan and generated shorter plans. The backend already accepts two-decimal naira (IsNaira)."],
    ["Quote signing", "Sign and verify the quote reference; short life; bound to version, size, units and duration. <b>6 Oct (D05):</b> no new expiry workflow; keep the snapshot and existing checkout handling."],
    ["Snapshot writer", "Inside the existing initial-purchase settlement transaction, so a plan and its snapshot are created together or not at all. Manual plans store source admin_created."],
    ["Coverage service", "One definition of “covered”: confirmed payments applied to the saved schedule, including prepaid months. <b>6 Oct (D08, D10, D11):</b> smaller payments aggregate; oldest unpaid installment first; penalties do not raise the target; a final balance below the installment covers the last month; suspended plans with a balance block account qualification; FO document installments count only once their schedule starts. Used by the streak job, the autopay collector and the reminder emails."],
    ["Monthly streak evaluator", "One qualification record per customer per month (unique key), Africa/Lagos. Awards 100 points once, as soon as all eligible plans are covered (D07); future prepaid months are awarded as they arrive, not early (Q2). Bank-transfer months use the verified payment date (D09). A missed month resets the streak; best streak and points remain (D12). Idempotent against repeated runs and callbacks."],
    ["Payment reversals", "<b>6 Oct (D13):</b> re-evaluate affected months; if qualification is lost, remove the month's 100 points via a visible adjustment, recalculate the streak and notify the customer; if other confirmed payments preserve coverage, keep the reward."],
    ["Launch backfill", "<b>6 Oct (D14):</b> include existing Flex and FO customers from the launch month onward; no rewards for earlier months; existing prepayments count for launch-month and future coverage."],
    ["Points ledger", "Append-only. Corrections are new entries with actor, reason and before/after. Setup and refunded verification charges never earn points."],
    ["Streak adjustment", "<b>6 Oct (D22):</b> the admin adjust endpoint writes an audit record and a ledger-visible entry; it never changes points unless product approves that."],
    ["Autopay collector (daily)", "Rechecks coverage and the collectible amount; skips covered months and plans with a pending or in-flight payment or a pending transfer; charges no more than the remaining balance; stops on completion; never initiates for suspended or cancelled plans. <b>6 Oct (D18):</b> retries at 24 h and 72 h after the <i>original</i> failed attempt, recheck coverage before each retry, stop after two retries, never retry an unresolved result. Charges the authorized card directly via Paystack, not through a Wallet top-up (D16)."],
    ["Autopay reconciler", "Resolves uncertain attempts before any further charge; protects against duplicate collection."],
    ["Webhook handling", "Extend POST /webhooks/paystack (today it routes charge.success to flex, FO, marketplace and referral by reference) to autopay events, idempotent by reference."],
    ["Suggestions ranking", "<b>6 Oct (D20, Q13):</b> use the existing hottest-assets endpoint and ranking; exclude owned estates and unavailable offers; take the highest-ranked eligible result; send nothing if none exists. Audience: customers who completed payment and have no current active plan."],
    ["Pre-launch data task", "<b>6 Oct (Q7, Q8):</b> before switching, configure every existing Flex size (convert-legacy). Existing 36-month prices are the starting point, subject to validation; missing or inconsistent data is resolved explicitly, not inferred."],
], [40, W - 40]))

# ================================================================== 5 emails
story += H1("5. Emails (sent by the backend)")
story += [P("No endpoint is involved and the app saves no preferences. Timings are the recorded product decisions.", "small")]
story.append(table(["Email", "When", "Status", "Notes"], [
    ["Payment received", "As soon as the customer's payment is confirmed", "Decided", "Templates exist today (flexPaymentConfirmation, flexReceipt). Check they say “month n of N” and fire at settlement."],
    ["Autopay reminder", "<b>One notice 24 hours before the charge</b>", "Decided (Q1)", "Combines the earlier “day or two” and “day before” notices; shows property, amount and date. Routine pre-payment reminders are suppressed for autopay plans (Q3)."],
    ["Failed deduction", "Immediately on a confirmed failure, and after each retry", "Decided", "Stop after the two retries and direct to manual payment or updating authorization. Do not duplicate failure messages."],
    ["Streak celebration", "As soon as a payment qualifies the month", "Decided", "100 points and the correct streak count. Playful tone; payment and failure notices stay accurate and clear."],
    ["Prepaid month recognised", "As each covered month arrives", "Decided (Q2)", "No wait until month-end and no extra payment."],
    ["Streak reminder", "One week before the due date", "Decided", "Combine with nearby existing reminders (15, 10, 3 days, due-today); suppress for covered installments. Account-wide handling of multiple due dates is an implementation detail."],
    ["Streak lost (reversal)", "When D13 removes a month's points", "Decided", "Notify the customer of the adjustment."],
    ["Property suggestions", "Every two weeks", "Decided (Q13)", "<b>Only customers who completed payment and have no active plan</b>; stop once they start a plan. Scheduler anchor (global batch vs 14 days from last send) not yet selected."],
    ["Final payment", "With the final payment", "Decided", "Statement, congratulations and certificate emails exist today. Confirm there is no duplicate celebration; do not tell a completed customer they must buy again to keep their streak."],
], [40, 62, 30, W - 132]))

# ================================================================== 6 data
story += H1("6. Data the backend must add")
story.append(table(None, [
    ["PaymentPlan (extend)", "pricing_snapshot (source, version, checkpoints, method version, entered budget, selected tenor, applied discount, schedule), applied_discount_pct, quote reference, coverage fields, autopay_state, streak_enabled (default true)"],
    ["FlexSize (extend)", "pricing_mode (base_plan | tenor_list | unpriced); base plan (price per unit; base tenor is the constant 36); live version pointer; one draft. <b>No max tenor.</b>"],
    ["FlexPricingVersion (new)", "immutable version records: size, version, base price per unit, checkpoints, method version, published by and when, status. <b>No approval reference (Q9).</b>"],
    ["StreakMonth (new)", "unique (user, month): qualified flag, plans evaluated, coverage per plan, awarded at"],
    ["PointsLedger (new)", "append-only: user, month, points, kind (earn / adjustment / reversal), reason, source, actor"],
    ["StreakAdjustmentAudit (new)", "append-only: user, actor, before and after streak, reason, created at; surfaced in Admin Logs"],
    ["AutopayAuthorization (new)", "user, provider token (never exposed), brand, last four, status, created"],
    ["AutopayPlanSetting (new)", "user, plan, enabled, enabled at, last result"],
    ["AutopayAttempt (new)", "plan, obligation month, amount, reference, outcome (paid / failed / skipped / confirming), reason, retry count, original failed attempt reference"],
], [48, W - 48]))

# ================================================================== 7 findings
story += H1("7. Findings from the code scan")
for b in [
    "<b>Offer history route is missing.</b> The admin calls GET /admin/assets/:id/offers/history; staging has no such route. The existing log would also lack a snapshot to reproduce quotes — hence the pricing versions routes.",
    "<b>The History button is mock-only in the admin today.</b> It is shown only when mocks are on, and flips to real once the route exists.",
    "<b>Purchases are keyed to a stored tenor.</b> The purchase endpoints look up an active plan by tenor_months. A budget-generated 20-month plan has no stored plan to find.",
    "<b>The first payment is free-form today.</b> The caller sends any amount from the required initial up to the total. Flex 2.0 makes the first installment the minimum and lets the customer pay more (Q11).",
    "<b>No reusable card authorization is captured.</b> Paystack initialization requests no reusable card and the webhook only acts on charge.success for purchases. A wallet field paystack_authorization_code exists but holds only migrated v1 data.",
    "<b>Wallet top-up was removed.</b> Confirm which money still lands in the Wallet (commission, marketplace sales, refunds) so the “deposits don't count” rule is worded correctly.",
    "<b>Penalties and suspension already run.</b> flex-defaulting adds penalties from 2 months overdue and suspends at 4. Streak eligibility and autopay must respect D11.",
    "<b>Reminder emails already exist</b> at 15, 10, 3 days, due-today and overdue. New emails need the de-duplication rules in section 5.",
    "<b>Flex size creation needs a plan.</b> The admin seeds a ₦1 placeholder plan to create a size (OfferEditDialogs). A base-plan size must not need one.",
    "<b>Admin permissions are not enforced in the admin app</b> (documented in its CLAUDE.md). Publishing prices must be permission-gated on the backend with a named permission.",
    "<b>Stale comment in the Flex frontend.</b> flex.schema.ts says no wallet-funded purchase exists; the endpoint and hook do.",
]:
    story.append(P("• " + b))

# ================================================================== 8 open items
story += H1("8. Open items")
story += [P("Product-level items the decisions record leaves open, then items the backend team needs to answer for the admin shapes.", "small")]
story.append(table(["#", "Item", "Working assumption in this document"], [
    ["1", "Exact name of the existing asset-pricing edit permission (Q9), and which existing permission controls streak adjustment (D22).", "Pricing writes use the pricing-edit permission; streak adjustment uses a named permission. No numeric adjustment limits."],
    ["2", "Rounding of the discounted <i>total</i> to the kobo. D03 settles installment rounding only.", "Round half up to the kobo, then floor regular payments to 2 dp."],
    ["3", "Is plan land_price per unit? The pricing contract is per unit.", "Per unit, matching how sizes are priced today."],
    ["4", "Does adjusting a streak above best_streak raise best_streak? Does adjusting a streak change points (not approved).", "best_streak = max(best, new current); points never change through this route."],
    ["5", "Tenor plans retained after convert-legacy: referenced by existing purchases only?", "Yes; hidden from plans[] and no longer sellable."],
    ["6", "Existing Flex sizes with no 36-month plan or inconsistent plans (Q7).", "Convert is blocked for the admin until a base price is entered; nothing is inferred."],
    ["7", "Draft ownership: one shared draft per size, or one per admin.", "One shared draft per size."],
    ["8", "Q10 / D17: reusable-card and zero-charge setup support on Abode's Paystack account.", "Technical verification outstanding; not an admin concern."],
    ["9", "Recommendation scheduler anchor; clock time of awards and collection jobs; refund timing and fees for the ₦50 setup charge; goodwill-refund classification; months with no obligation between early land payoff and FO document start.", "Left open by the decisions record; not assumed here."],
], [8, 130, W - 138]))

# ================================================================== 9 build order
story += H1("9. Suggested build order")
for i, t in enumerate([
    "Pricing engine, versioned base plan, publish and preview (admin), plus Flex size creation without a plan — unblocks everything else.",
    "Quote endpoint, then purchase endpoints accepting a quote and writing the snapshot (customer purchase). Update Affordability to the same calculation (Q6).",
    "Pre-launch data task: convert every existing Flex size (Q7, Q8).",
    "Coverage service, streak evaluator and points ledger, then the customer read endpoints and the admin streak summary and adjust endpoints.",
    "Offer-history route, with pricing events.",
    "Autopay: D16 and D18 are decided; D17 needs the Paystack capability check (Q10). Build authorization, per-plan enablement and the collector last.",
    "Emails, in parallel with the above. (The rollout switch is no longer needed.)",
], 1):
    story.append(P(f"{i}. {t}"))
story += [Spacer(1, 6), P("Route names and bodies for NEW items are proposals. Existing routes were checked against the live staging OpenAPI on 6 Oct 2026. Request and response shapes for admin routes were derived from the Flex 2.0 admin mockups and the 6 Oct decisions record.", "small")]

# ---- fill the summary table now that rows are counted
def counts_row(label, d):
    return [label, str(d.get("EXISTS", 0)), str(d.get("EXISTS · CHANGE", 0)), str(d.get("NEW", 0)), str(d.get("MISSING ON BE", 0)), str(d.get("REMOVED", 0))]


summary = H1("1. Summary") + [
    table(["Area", "EXISTS", "EXISTS · CHANGE", "NEW", "MISSING ON BE", "REMOVED"], [
        counts_row("Customer app (Flex)", COUNTS["customer"]),
        counts_row("Admin app", COUNTS["admin"]),
    ], [70, 30, 36, 30, 36, 30]),
    Spacer(1, 3),
    P("Plus the backend-only work (section 4) and the email triggers (section 5). Each row is counted once; a few rows group routes that share a purpose. "
      "Admin rows are the endpoint blocks in section 3, each with request and response shapes.", "small"),
]
story[SUMMARY_INDEX:SUMMARY_INDEX + 1] = summary


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Body", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN, 8 * mm, "Abode Flex 2.0 — API endpoint requirements · revised 6 Oct 2026")
    canvas.drawRightString(PAGE_W - MARGIN, 8 * mm, f"Page {doc.page}")
    canvas.restoreState()


SimpleDocTemplate(OUT, pagesize=landscape(A4), leftMargin=MARGIN, rightMargin=MARGIN, topMargin=12 * mm, bottomMargin=14 * mm,
                  title="Abode Flex 2.0 — API endpoint requirements", author="abode-fe-admin").build(story, onFirstPage=footer, onLaterPages=footer)
print("wrote", OUT)
