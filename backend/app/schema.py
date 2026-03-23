# pyre-strict
"""SQLite database schema definition — fed to the LLM for context."""

SCHEMA: str = """
Tables in SQLite database (all columns are TEXT unless noted):

1. sales_order_headers: salesOrder (PK), salesOrderType, salesOrganization, soldToParty (FK->business_partners.businessPartner), creationDate, totalNetAmount, overallDeliveryStatus, overallOrdReltdBillgStatus, transactionCurrency, requestedDeliveryDate, headerBillingBlockReason, deliveryBlockReason

2. sales_order_items: salesOrder (FK->sales_order_headers), salesOrderItem, material (FK->products.product), requestedQuantity, requestedQuantityUnit, netAmount, materialGroup, productionPlant, storageLocation, salesDocumentRjcnReason, itemBillingBlockReason

3. sales_order_schedule_lines: salesOrder, salesOrderItem, scheduleLine, requestedDeliveryDate, confirmedDeliveryDate, confirmedQuantity

4. outbound_delivery_headers: deliveryDocument (PK), creationDate, shippingPoint, overallGoodsMovementStatus, overallPickingStatus, deliveryBlockReason, headerBillingBlockReason, hdrGeneralIncompletionStatus

5. outbound_delivery_items: deliveryDocument (FK->outbound_delivery_headers), deliveryDocumentItem, referenceSdDocument (FK->sales_order_headers.salesOrder), referenceSdDocumentItem, plant, storageLocation, actualDeliveryQuantity, deliveryQuantityUnit, itemBillingBlockReason

6. billing_document_headers: billingDocument (PK), billingDocumentType, creationDate, billingDocumentDate, billingDocumentIsCancelled, totalNetAmount, transactionCurrency, companyCode, fiscalYear, accountingDocument (FK->journal_entry_items_accounts_receivable.accountingDocument), soldToParty (FK->business_partners.businessPartner)

7. billing_document_items: billingDocument (FK->billing_document_headers), billingDocumentItem, material (FK->products.product), billingQuantity, billingQuantityUnit, netAmount, referenceSdDocument (FK->outbound_delivery_items.deliveryDocument), referenceSdDocumentItem

8. billing_document_cancellations: billingDocument (PK), billingDocumentType, creationDate, billingDocumentDate, billingDocumentIsCancelled, cancelledBillingDocument, totalNetAmount, accountingDocument, soldToParty

9. journal_entry_items_accounts_receivable: accountingDocument, accountingDocumentItem, companyCode, fiscalYear, glAccount, referenceDocument (FK->billing_document_headers.billingDocument), costCenter, profitCenter, transactionCurrency, amountInTransactionCurrency, postingDate, documentDate, accountingDocumentType, clearingDate, clearingAccountingDocument, customer

10. payments_accounts_receivable: accountingDocument, accountingDocumentItem, companyCode, fiscalYear, clearingDate, clearingAccountingDocument (FK->journal_entry_items_accounts_receivable.accountingDocument), amountInTransactionCurrency, transactionCurrency, customer, postingDate, glAccount, profitCenter

11. business_partners: businessPartner (PK), customer, businessPartnerFullName, businessPartnerName, businessPartnerCategory, businessPartnerIsBlocked, creationDate

12. business_partner_addresses: businessPartner (FK), streetName, cityName, postalCode, country, region

13. products: product (PK), productType, productOldId, grossWeight, weightUnit, netWeight, productGroup, baseUnit, division, industrySector, isMarkedForDeletion

14. product_descriptions: product (FK->products), language, productDescription

15. plants: plant (PK), plantName, country, region, cityName

KEY RELATIONSHIPS (O2C Flow):
- Sales Order -> Delivery: outbound_delivery_items.referenceSdDocument = sales_order_headers.salesOrder
- Delivery -> Billing: billing_document_items.referenceSdDocument = outbound_delivery_items.deliveryDocument
- Billing -> Journal Entry: journal_entry_items_accounts_receivable.referenceDocument = billing_document_headers.billingDocument
- Billing -> Journal Entry (alt): billing_document_headers.accountingDocument = journal_entry_items_accounts_receivable.accountingDocument
- Journal Entry -> Payment: payments_accounts_receivable.clearingAccountingDocument = journal_entry_items_accounts_receivable.accountingDocument
- Customer links: sales_order_headers.soldToParty = business_partners.businessPartner
"""
