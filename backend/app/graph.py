# pyre-strict
"""Graph construction — builds nodes and edges from the O2C SQLite database."""

from typing import Any

from .db import query  # pyre-ignore[21]
from .config import GRAPH_NODE_LIMIT, GRAPH_ITEM_LIMIT  # pyre-ignore[21]
from .utils import trunc  # pyre-ignore[21]


def build_graph() -> dict[str, Any]:
    """Build the full O2C graph with nodes and edges."""
    nodes: list[dict[str, Any]] = []
    edges: list[dict[str, Any]] = []
    seen: set[str] = set()

    def add_node(id_: str, label: str, type_: str, props: dict[str, Any] | None = None) -> None:
        if id_ not in seen:
            seen.add(id_)
            nodes.append({"id": id_, "label": label, "type": type_, "props": props or {}})

    def add_edge(src: str, tgt: str, label: str) -> None:
        edges.append({"source": src, "target": tgt, "label": label})

    _build_sales_orders(add_node, add_edge)
    _build_customers(add_node)
    _build_products(add_node, add_edge, seen)
    _build_deliveries(add_node, add_edge, seen)
    _build_billings(add_node, add_edge, seen)
    journals = _build_journals(add_node, add_edge, seen)
    _build_payments(add_node, add_edge, seen, journals)

    return {"nodes": nodes, "edges": edges}


# ─── Private builders ─────────────────────────────────────────────────────────


def _build_sales_orders(add_node: Any, add_edge: Any) -> None:
    rows = query(f"SELECT * FROM sales_order_headers LIMIT {GRAPH_NODE_LIMIT}")
    for o in rows:
        oid = f"SO_{o['salesOrder']}"
        add_node(oid, f"SO {o['salesOrder']}", "SalesOrder", {
            "Entity": "Sales Order",
            "SalesOrder": o["salesOrder"],
            "Customer": o["soldToParty"],
            "TotalNetAmount": o["totalNetAmount"],
            "TransactionCurrency": o.get("transactionCurrency", ""),
            "DeliveryStatus": o["overallDeliveryStatus"],
            "BillingStatus": o.get("overallOrdReltdBillgStatus", ""),
            "CreationDate": trunc(o["creationDate"]),
            "RequestedDeliveryDate": trunc(o.get("requestedDeliveryDate", "")),
        })
        add_edge(f"BP_{o['soldToParty']}", oid, "placed")


def _build_customers(add_node: Any) -> None:
    rows = query("SELECT * FROM business_partners")
    for bp in rows:
        cid = f"BP_{bp['businessPartner']}"
        add_node(cid, trunc(bp["businessPartnerName"], 20), "Customer", {
            "Entity": "Customer",
            "BusinessPartner": bp["businessPartner"],
            "Name": bp["businessPartnerName"],
            "FullName": bp.get("businessPartnerFullName", ""),
            "Category": bp.get("businessPartnerCategory", ""),
            "IsBlocked": bp["businessPartnerIsBlocked"],
            "CreationDate": trunc(bp.get("creationDate", "")),
        })


def _build_products(add_node: Any, add_edge: Any, seen: set[str]) -> None:
    rows = query(f"SELECT * FROM sales_order_items LIMIT {GRAPH_ITEM_LIMIT}")
    for it in rows:
        oid = f"SO_{it['salesOrder']}"
        pid = f"PROD_{it['material']}"
        add_node(pid, trunc(it["material"], 12), "Product", {
            "Entity": "Product",
            "Material": it["material"],
            "RequestedQuantity": it["requestedQuantity"],
            "QuantityUnit": it["requestedQuantityUnit"],
            "NetAmount": it["netAmount"],
            "MaterialGroup": it.get("materialGroup", ""),
            "ProductionPlant": it.get("productionPlant", ""),
        })
        if oid in seen:
            add_edge(oid, pid, "orders")


def _build_deliveries(add_node: Any, add_edge: Any, seen: set[str]) -> None:
    headers = query(f"SELECT * FROM outbound_delivery_headers LIMIT {GRAPH_NODE_LIMIT}")
    items = query(f"SELECT * FROM outbound_delivery_items LIMIT {GRAPH_ITEM_LIMIT}")

    so_to_del: dict[str, str] = {}
    for di in items:
        so = di.get("referenceSdDocument", "")
        dd = di.get("deliveryDocument", "")
        if so and dd:
            so_to_del.setdefault(str(so), str(dd))

    for d in headers:
        did = f"DEL_{d['deliveryDocument']}"
        add_node(did, f"DEL {d['deliveryDocument']}", "Delivery", {
            "Entity": "Delivery",
            "DeliveryDocument": d["deliveryDocument"],
            "ShippingPoint": d["shippingPoint"],
            "GoodsMovementStatus": d["overallGoodsMovementStatus"],
            "PickingStatus": d["overallPickingStatus"],
            "CreationDate": trunc(d["creationDate"]),
            "IncompletionStatus": d.get("hdrGeneralIncompletionStatus", ""),
        })

    for so, dd in so_to_del.items():
        oid, did = f"SO_{so}", f"DEL_{dd}"
        if oid in seen and did in seen:
            add_edge(oid, did, "fulfilled by")


def _build_billings(add_node: Any, add_edge: Any, seen: set[str]) -> None:
    headers = query(f"SELECT * FROM billing_document_headers LIMIT {GRAPH_NODE_LIMIT}")
    items = query(f"SELECT * FROM billing_document_items LIMIT {GRAPH_ITEM_LIMIT}")

    del_to_bill: dict[str, str] = {}
    for bi in items:
        ref = bi.get("referenceSdDocument", "")
        bd = bi.get("billingDocument", "")
        if ref and bd:
            del_to_bill.setdefault(str(ref), str(bd))

    for b in headers:
        bid = f"BILL_{b['billingDocument']}"
        add_node(bid, f"BILL {b['billingDocument']}", "Billing", {
            "Entity": "Billing Document",
            "BillingDocument": b["billingDocument"],
            "DocumentType": b["billingDocumentType"],
            "TotalNetAmount": b["totalNetAmount"],
            "TransactionCurrency": b.get("transactionCurrency", ""),
            "BillingDocumentDate": trunc(b["billingDocumentDate"]),
            "IsCancelled": b["billingDocumentIsCancelled"],
            "AccountingDocument": b["accountingDocument"],
            "CompanyCode": b.get("companyCode", ""),
            "FiscalYear": b.get("fiscalYear", ""),
        })

    for ref, bd in del_to_bill.items():
        did, bid = f"DEL_{ref}", f"BILL_{bd}"
        if did in seen and bid in seen:
            add_edge(did, bid, "billed as")
        else:
            oid = f"SO_{ref}"
            if oid in seen and bid in seen:
                add_edge(oid, bid, "billed as")


def _build_journals(
    add_node: Any, add_edge: Any, seen: set[str]
) -> list[dict[str, Any]]:
    rows = query(
        f"SELECT * FROM journal_entry_items_accounts_receivable LIMIT {GRAPH_NODE_LIMIT}"
    )
    for j in rows:
        jid = f"JE_{j['accountingDocument']}_{j['accountingDocumentItem']}"
        ref_bill: str = j.get("referenceDocument", "")
        add_node(jid, f"JE {j['accountingDocument']}", "JournalEntry", {
            "Entity": "Journal Entry",
            "CompanyCode": j.get("companyCode", ""),
            "FiscalYear": j.get("fiscalYear", ""),
            "AccountingDocument": j["accountingDocument"],
            "GLAccount": j.get("glAccount", ""),
            "ReferenceDocument": ref_bill,
            "CostCenter": j.get("costCenter", ""),
            "ProfitCenter": j.get("profitCenter", ""),
            "TransactionCurrency": j.get("transactionCurrency", ""),
            "AmountInTransactionCurrency": j["amountInTransactionCurrency"],
            "PostingDate": trunc(j["postingDate"]),
            "DocumentDate": trunc(j.get("documentDate", "")),
            "AccountingDocumentType": j.get("accountingDocumentType", ""),
            "AccountingDocumentItem": j.get("accountingDocumentItem", ""),
        })
        if ref_bill:
            bid = f"BILL_{ref_bill}"
            if bid in seen:
                add_edge(bid, jid, "posted to")
    return rows


def _build_payments(
    add_node: Any, add_edge: Any, seen: set[str], journals: list[dict[str, Any]]
) -> None:
    rows = query(
        f"SELECT * FROM payments_accounts_receivable LIMIT {GRAPH_NODE_LIMIT}"
    )
    for p in rows:
        pmid = f"PAY_{p['accountingDocument']}_{p['accountingDocumentItem']}"
        add_node(pmid, f"PAY {p['accountingDocument']}", "Payment", {
            "Entity": "Payment",
            "AccountingDocument": p["accountingDocument"],
            "AmountInTransactionCurrency": p["amountInTransactionCurrency"],
            "TransactionCurrency": p.get("transactionCurrency", ""),
            "ClearingDocument": p["clearingAccountingDocument"],
            "ClearingDate": trunc(p["clearingDate"]),
            "Customer": p["customer"],
            "PostingDate": trunc(p.get("postingDate", "")),
        })
        clearing: str = p.get("clearingAccountingDocument", "")
        if clearing:
            for j in journals:
                if j["accountingDocument"] == clearing:
                    jid = f"JE_{j['accountingDocument']}_{j['accountingDocumentItem']}"
                    if jid in seen:
                        add_edge(jid, pmid, "cleared by")
                    break
