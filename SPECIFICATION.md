# EasyDukaan - Comprehensive Feature Specification

**Project Name:** EasyDukaan  
**Tagline:** Modern GST Billing, Inventory & Accounting for Indian Retail Shops  
**Inspired by:** myBillBook.in + Vyapar + Best practices for small Indian retailers (Electronics, Mobile, Hardware, Kirana, etc.)  
**Target Users:** Small & Medium Retail Shop Owners in India (especially electronics, appliances, mobile, and general stores)  
**Version:** 1.0 (Demo-Ready Spec)  
**Date:** June 2026

---

## 1. Vision & Objectives

EasyDukaan aims to be a **complete, easy-to-use ERP + Billing system** for small Indian retail businesses. It should feel like myBillBook and Vyapar but with a cleaner, more modern interface and deeper support for serialized inventory (IMEI/Serial tracking) which is critical for electronics and mobile shops.

### Core Objectives
- **Speed First**: Create a GST invoice in under 10–15 seconds.
- **GST Compliance**: 100% accurate automatic tax calculation and report generation.
- **Inventory Accuracy**: Real-time stock with support for serial/IMEI tracking.
- **Cash Flow Focus**: Strong emphasis on outstanding collection (To Collect / To Pay).
- **WhatsApp-first**: Most actions (invoices, reminders, ledgers) should be shareable via WhatsApp.
- **Low Learning Curve**: Non-technical shop owners should be able to use it without training.

---

## 2. Key Design Principles

| Principle              | Description                                                                 |
|------------------------|-----------------------------------------------------------------------------|
| **Speed & Simplicity** | Every frequent action should take minimal clicks and time                   |
| **Mobile + Desktop**   | Fully responsive. POS optimized for counter use (touch + keyboard)          |
| **GST Native**         | Every transaction auto-calculates CGST/SGST/IGST correctly                  |
| **Real-time Updates**  | Stock, balances, and reports update instantly across the app                |
| **Offline Resilient**  | Core billing should work offline with sync when back online                 |
| **Professional Output**| Invoices should look premium and build trust with customers                 |
| **Data Portability**   | Easy export to Excel, PDF, and Tally format for CA                          |

---

## 3. Core Modules

### 3.1 Authentication & Multi-Business Support

- Mobile number + OTP login (primary method)
- Support for multiple businesses under one account (switcher in header)
- Business creation wizard (Name, GSTIN, Address, Logo, Signature)
- Role-based access: Owner, Manager, Accountant, Staff (View-only)
- Session management with "Remember me"
- Device fingerprinting (optional security layer)

### 3.2 Business Profile & Settings

**Business Information**
- Business Name, Logo (color + monochrome for thermal)
- Address (Billing + Shipping)
- Phone, Email, Website
- GSTIN, PAN, State, Pincode
- Signature upload (hand-drawn style supported)
- Bank Account details (for invoices)

**Advanced Settings**
- Invoice Numbering Format (e.g., `ME/2025-26/XXXX`)
- Financial Year settings
- Enable/Disable e-Invoicing
- Enable TDS
- Multi-Godown / Warehouse management
- Default Invoice Theme selection

### 3.3 Party Management (Customers + Suppliers)

**Core Features**
- Create, Edit, Delete Parties
- Fields: Name, Mobile, Email, Address, GSTIN, Type (Customer / Supplier / Both), Category, Credit Limit, Opening Balance
- Smart search (name, mobile, GSTIN)
- Bulk import from Excel/CSV
- Party-wise special pricing / rate lists

**Outstanding & Ledger**
- Real-time balance (positive = To Collect, negative = To Pay)
- Full Party Ledger / Statement with running balance
- Receivable Ageing Report
- Party-wise Outstanding Report
- One-click "Send Ledger on WhatsApp"
- Shared Ledger Portal (customer can view their invoices & pay)

**Communication**
- Send Payment Reminders via WhatsApp + SMS with UPI payment link
- Bulk reminder sending

### 3.4 Item & Inventory Management

**Item Master**
- Item Name, Code/SKU, HSN/SAC Code, Category
- GST Rate (auto-suggest based on category)
- Selling Price (with/without tax), Purchase Price, MRP
- Low Stock Quantity threshold
- Description, Images (optional)
- Serialisation toggle (Enable/Disable per item)

**Serial / IMEI Tracking** (Critical for Electronics Shops)
- Enable serialisation on items (Mobiles, TVs, Washing Machines, etc.)
- Track individual units by IMEI / Serial Number
- Auto-assign serials during sale (FIFO or manual selection)
- Dedicated **IMEI/Serial No Report**
- Warranty tracking support (future)

**Stock Management**
- Real-time stock quantity
- Multi-Godown / Warehouse stock view + transfer
- Stock Adjustment (Increase / Decrease with reason)
- Low Stock Alerts + Dashboard widget
- Batch tracking + Expiry management (optional for general stores)
- Barcode generation + printing

**Offers & Pricing**
- Create Offers / Discounts on items
- Launch Offers banner on inventory screen
- Party-wise pricing

### 3.5 Sales & Invoicing

**Document Types Supported**
- Tax Invoice (GST)
- Bill of Supply (Non-GST)
- Quotation / Estimate
- Proforma Invoice
- Delivery Challan
- Credit Note / Debit Note
- Sales Return

**Invoice Creation Features**
- Fast party search + auto-fill (GSTIN, Address, Balance)
- Add multiple items with live tax calculation
- Line-level discount + Bill-level discount
- Previous Balance display on invoice
- Multiple payment methods in one invoice (Cash + UPI + Card)
- Due Date tracking
- Notes / Terms & Conditions
- Signature on invoice
- Print + Share via WhatsApp, SMS, Email, PDF

**Invoice List**
- Status: Paid / Unpaid / Partial / Cancelled
- Filters: Date range, Party, Status, Amount
- Bulk actions (Cancel, Send Reminder, Export)
- Quick "Mark as Paid" action

### 3.6 POS Billing (Most Important Module for Retail)

**Core POS Experience**
- Category sidebar + searchable item grid
- Search by: Item Name, Serial/IMEI, HSN, SKU, Category
- Barcode scanner support (keyboard wedge)
- Fast item addition
- Edit quantity, rate, and discount on the fly
- Live bill summary with tax breakup

**Keyboard Shortcuts (Critical for Speed)**

| Shortcut              | Action                              |
|-----------------------|-------------------------------------|
| `F1` or `/`           | Focus search bar                    |
| `Enter`               | Add selected item                   |
| `F2` or `D`           | Edit quantity / discount on line    |
| `F3`                  | Apply bill-level discount           |
| `F4`                  | Focus on Received Amount            |
| `F5`                  | Select / Add Customer               |
| `F6` or `H`           | Hold current bill                   |
| `F7` or `Ctrl + S`    | Save & Print Bill                   |
| `F8`                  | Print without saving                |
| `F9` or `N`           | New Bill / Clear                    |
| `ESC`                 | Cancel / Remove last item           |
| `Ctrl + F`            | Global search                       |
| `ALT`                 | Show all shortcuts overlay          |

**Advanced POS Features**
- Hold & Resume multiple bills
- Cash Sale toggle
- Split payment support
- Quick add new item from POS
- Low stock warning during billing
- Auto stock deduction + serial assignment on save
- Thermal printer support (2" & 3")
- A4 print option

### 3.7 Purchase Management

- Create Purchase Invoices
- Link to Supplier + auto stock addition
- Purchase Return, Debit Note
- Purchase Orders
- Purchase Summary reports
- TDS tracking on purchases

### 3.8 Payments, Cash & Bank

- Record Payment In / Payment Out
- Multiple Bank Accounts + Cash
- Bank Reconciliation (manual + AI-assisted suggestions)
- UPI payment links generation
- Cash flow tracking
- Daybook

### 3.9 Expenses

- Record business expenses
- Categorize as GST / Non-GST
- Link expense to supplier
- Expense reports + analytics

### 3.10 Reports & Analytics (Very Comprehensive)

**GST Reports**
- GSTR-1 (Sales)
- GSTR-2 (Purchase)
- GSTR-3B
- GST Sales / Purchase with HSN
- HSN-wise Sales Summary
- Input Tax Credit Report

**Financial Reports**
- Balance Sheet
- Profit & Loss Statement
- Cash & Bank Report
- Daybook
- Audit Trail
- Bill-wise Profit Report

**Inventory Reports**
- Stock Summary
- Low Stock Report
- IMEI / Serial Number Report
- Item-wise Sales Report
- Godown-wise Stock

**Party Reports**
- Party Statement (Ledger)
- Party-wise Outstanding
- Receivable Ageing Report
- Party Report by Item

**Other Reports**
- Sales Summary (Category-wise)
- Purchase Summary
- Expense Reports
- TDS / TCS Reports

All reports should support:
- Date filters
- Export to Excel / PDF
- Share directly with CA

### 3.11 Staff Attendance & Payroll

- Add Staff members
- Daily attendance marking (Present / Absent / Half Day)
- Salary, Advance & Pending Payment tracking
- Payroll processing
- Custom attendance reminders

### 3.12 Settings & Customization

**Invoice Customization**
- Multiple pre-built themes (Advanced GST, Luxury, Stylish, Modern)
- Custom Theme Creator (colors, layout options)
- Show/Hide fields on invoice (Party Balance, Item Description, Phone, etc.)
- Auto-apply luxury theme option

**Print Settings**
- Thermal Printer (2 inch / 3 inch) with live preview
- Barcode Printer support
- Upload Monochrome Logo (specific dimensions)
- A4 printing options

**Other Settings**
- Reminders configuration
- SMS / WhatsApp Marketing
- Refer & Earn
- Data Backup & Export
- CA Report Sharing

---

## 4. Cross-Cutting Features

| Feature                    | Description                                                                 |
|---------------------------|-----------------------------------------------------------------------------|
| **Multi-Business**        | Switch between multiple shops easily                                        |
| **Multi-User + Roles**    | Fine-grained permissions                                                    |
| **Offline Mode**          | Core billing works offline, syncs later                                     |
| **WhatsApp Integration**  | Send invoices, ledgers, reminders with one click + UPI link                 |
| **E-Invoicing**           | Generate e-Invoices for B2B transactions                                    |
| **E-Way Bill**            | Generate E-Way Bills                                                        |
| **Tally Export**          | Export data in Tally-compatible format for CA                               |
| **Barcode Scanning**      | Native support in Items, Sales, and POS                                     |
| **Pending Actions**       | Notification center for overdue invoices, low stock, etc.                   |
| **Audit Log**             | Track who did what and when                                                 |

---

## 5. Recommended Data Models (TypeScript)

```ts
interface Business { ... }
interface Party { ... }
interface Item { serialisationEnabled: boolean; serials?: string[]; ... }
interface InvoiceItem { ... }
interface SaleInvoice { ... }
interface PurchaseInvoice { ... }
interface Transaction { ... }
interface Staff { ... }
```

---

## 6. Implementation Priorities (MVP → v1.0)

**Phase 1 (MVP - 4-6 weeks)**
- Login + Business Setup
- Party Management + Ledger
- Item Management + Basic Stock
- Sales Invoice + Basic POS
- Dashboard

**Phase 2**
- Full POS with keyboard shortcuts + serial tracking
- Purchase Module
- Reports (GST + Financial)
- Settings & Invoice Themes

**Phase 3**
- Multi-business + Multi-user
- Staff Attendance & Payroll
- E-Invoicing + E-Way Bill
- Advanced Analytics

---

## 7. Non-Functional Requirements

- **Performance**: Invoice creation < 2 seconds even with 5000+ items
- **Reliability**: Data should never be lost (local + cloud sync)
- **Security**: GSTIN validation, proper auth, audit logs
- **Accessibility**: Should work well on low-end Android devices + desktop

---

## 8. Future Roadmap Ideas

- Online Store integration
- Loyalty Points system
- AI-powered low stock prediction & reordering
- Voice input for billing (future)
- Integration with accounting software (Zoho, Tally)
- Mobile App (React Native / Flutter)

---

**This document serves as the single source of truth** for building EasyDukaan.

It is intentionally very detailed so that developers, designers, and stakeholders have complete clarity on what needs to be built.

---

*Document prepared based on deep analysis of myBillBook.in, Vyapar, and real requirements of Indian retail shops (especially electronics & mobile stores).*