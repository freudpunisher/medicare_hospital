// ============================================================
// MOCK DATA FOR HOSPITAL MANAGEMENT SYSTEM
// ============================================================

// --- Departments ---
export const departments = [
  { id: "dept-1", name: "Cardiology", description: "Heart and cardiovascular system", is_active: true },
  { id: "dept-2", name: "Neurology", description: "Brain and nervous system disorders", is_active: true },
  { id: "dept-3", name: "Orthopedics", description: "Musculoskeletal system", is_active: true },
  { id: "dept-4", name: "Pediatrics", description: "Medical care for infants and children", is_active: true },
  { id: "dept-5", name: "Radiology", description: "Medical imaging and diagnostics", is_active: false },
  { id: "dept-6", name: "General Surgery", description: "Operative procedures on the body", is_active: true },
]

// --- Specialties ---
export const specialties = [
  { id: "spec-1", name: "Interventional Cardiology", department_id: "dept-1", description: "Catheter-based treatments", is_active: true },
  { id: "spec-2", name: "Electrophysiology", department_id: "dept-1", description: "Heart rhythm disorders", is_active: true },
  { id: "spec-3", name: "Neurophysiology", department_id: "dept-2", description: "Nervous system function testing", is_active: true },
  { id: "spec-4", name: "Sports Medicine", department_id: "dept-3", description: "Athletic injury treatment", is_active: true },
  { id: "spec-5", name: "Neonatology", department_id: "dept-4", description: "Newborn intensive care", is_active: true },
  { id: "spec-6", name: "Trauma Surgery", department_id: "dept-6", description: "Emergency surgical interventions", is_active: true },
]

// --- Services ---
export const services = [
  { id: "svc-1", name: "Consultation", code: "CONS", is_billable: true, is_active: true },
  { id: "svc-2", name: "Laboratory", code: "LAB", is_billable: true, is_active: true },
  { id: "svc-3", name: "Imaging", code: "IMG", is_billable: true, is_active: true },
  { id: "svc-4", name: "Surgery", code: "SURG", is_billable: true, is_active: true },
  { id: "svc-5", name: "Hospitalization", code: "HOSP", is_billable: true, is_active: true },
  { id: "svc-6", name: "Pharmacy", code: "PHAR", is_billable: true, is_active: false },
]

// --- Medical Acts ---
export const acts = [
  { id: "act-1", code: "CONS-GEN", name: "General Consultation", service_id: "svc-1", specialty_id: null, base_price: 50.00, requires_authorization: false, is_active: true },
  { id: "act-2", code: "CONS-SPEC", name: "Specialist Consultation", service_id: "svc-1", specialty_id: "spec-1", base_price: 120.00, requires_authorization: false, is_active: true },
  { id: "act-3", code: "LAB-CBC", name: "Complete Blood Count", service_id: "svc-2", specialty_id: null, base_price: 35.00, requires_authorization: false, is_active: true },
  { id: "act-4", code: "LAB-BIO", name: "Biochemistry Panel", service_id: "svc-2", specialty_id: null, base_price: 80.00, requires_authorization: false, is_active: true },
  { id: "act-5", code: "IMG-XRAY", name: "X-Ray", service_id: "svc-3", specialty_id: null, base_price: 75.00, requires_authorization: false, is_active: true },
  { id: "act-6", code: "IMG-MRI", name: "MRI Scan", service_id: "svc-3", specialty_id: "spec-3", base_price: 450.00, requires_authorization: true, is_active: true },
  { id: "act-7", code: "IMG-CT", name: "CT Scan", service_id: "svc-3", specialty_id: null, base_price: 350.00, requires_authorization: true, is_active: true },
  { id: "act-8", code: "SURG-MIN", name: "Minor Surgery", service_id: "svc-4", specialty_id: "spec-6", base_price: 800.00, requires_authorization: true, is_active: true },
  { id: "act-9", code: "SURG-MAJ", name: "Major Surgery", service_id: "svc-4", specialty_id: "spec-6", base_price: 3500.00, requires_authorization: true, is_active: true },
  { id: "act-10", code: "HOSP-DAY", name: "Day Hospitalization", service_id: "svc-5", specialty_id: null, base_price: 200.00, requires_authorization: false, is_active: true },
  { id: "act-11", code: "ECG-REST", name: "Resting ECG", service_id: "svc-1", specialty_id: "spec-2", base_price: 60.00, requires_authorization: false, is_active: true },
  { id: "act-12", code: "ECHO-CARD", name: "Echocardiogram", service_id: "svc-3", specialty_id: "spec-1", base_price: 250.00, requires_authorization: false, is_active: true },
]

// --- Insurances ---
export const insurances = [
  { id: "ins-1", name: "National Health Insurance", contact_info: "+1 800-555-0100", is_active: true },
  { id: "ins-2", name: "BlueCross Premium", contact_info: "+1 800-555-0200", is_active: true },
  { id: "ins-3", name: "MediGuard International", contact_info: "+1 800-555-0300", is_active: true },
  { id: "ins-4", name: "SafeHealth Plus", contact_info: "+1 800-555-0400", is_active: false },
]

// --- Insurance Service Rules ---
export const insuranceServiceRules = [
  { id: "isr-1", insurance_id: "ins-1", service_id: "svc-1", coverage_rate: 80, plafond: null, requires_authorization: false },
  { id: "isr-2", insurance_id: "ins-1", service_id: "svc-2", coverage_rate: 70, plafond: 500.00, requires_authorization: false },
  { id: "isr-3", insurance_id: "ins-1", service_id: "svc-3", coverage_rate: 60, plafond: 1000.00, requires_authorization: true },
  { id: "isr-4", insurance_id: "ins-1", service_id: "svc-4", coverage_rate: 50, plafond: 5000.00, requires_authorization: true },
  { id: "isr-5", insurance_id: "ins-2", service_id: "svc-1", coverage_rate: 90, plafond: null, requires_authorization: false },
  { id: "isr-6", insurance_id: "ins-2", service_id: "svc-2", coverage_rate: 85, plafond: 800.00, requires_authorization: false },
  { id: "isr-7", insurance_id: "ins-2", service_id: "svc-3", coverage_rate: 80, plafond: 2000.00, requires_authorization: false },
  { id: "isr-8", insurance_id: "ins-2", service_id: "svc-4", coverage_rate: 75, plafond: 10000.00, requires_authorization: true },
  { id: "isr-9", insurance_id: "ins-3", service_id: "svc-1", coverage_rate: 70, plafond: null, requires_authorization: false },
  { id: "isr-10", insurance_id: "ins-3", service_id: "svc-5", coverage_rate: 60, plafond: 3000.00, requires_authorization: true },
]

// --- Doctors ---
export const doctors = [
  { id: "doc-1", first_name: "Sarah", last_name: "Chen", specialty_id: "spec-1", phone: "+1 555-0101", is_active: true },
  { id: "doc-2", first_name: "James", last_name: "Wilson", specialty_id: "spec-2", phone: "+1 555-0102", is_active: true },
  { id: "doc-3", first_name: "Maria", last_name: "Garcia", specialty_id: "spec-3", phone: "+1 555-0103", is_active: true },
  { id: "doc-4", first_name: "Robert", last_name: "Kim", specialty_id: "spec-4", phone: "+1 555-0104", is_active: true },
  { id: "doc-5", first_name: "Emily", last_name: "Johnson", specialty_id: "spec-5", phone: "+1 555-0105", is_active: true },
  { id: "doc-6", first_name: "David", last_name: "Brown", specialty_id: "spec-6", phone: "+1 555-0106", is_active: false },
  { id: "doc-7", first_name: "Lisa", last_name: "Patel", specialty_id: "spec-1", phone: "+1 555-0107", is_active: true },
  { id: "doc-8", first_name: "Michael", last_name: "Lee", specialty_id: "spec-3", phone: "+1 555-0108", is_active: true },
]

// --- Patients ---
export const patients = [
  { id: "pat-1", first_name: "Alice", last_name: "Martin", date_of_birth: "1985-03-15", gender: "Female", phone: "+1 555-1001", is_insured: true, insurance_id: "ins-1", insurance_number: "NHI-20853-A", created_at: "2024-01-10T08:30:00Z" },
  { id: "pat-2", first_name: "Bob", last_name: "Thompson", date_of_birth: "1972-07-22", gender: "Male", phone: "+1 555-1002", is_insured: true, insurance_id: "ins-2", insurance_number: "BCP-44721-B", created_at: "2024-01-15T10:00:00Z" },
  { id: "pat-3", first_name: "Clara", last_name: "Rodriguez", date_of_birth: "1990-11-08", gender: "Female", phone: "+1 555-1003", is_insured: false, insurance_id: null, insurance_number: null, created_at: "2024-02-01T14:20:00Z" },
  { id: "pat-4", first_name: "Daniel", last_name: "Nguyen", date_of_birth: "1968-05-30", gender: "Male", phone: "+1 555-1004", is_insured: true, insurance_id: "ins-3", insurance_number: "MGI-77234-D", created_at: "2024-02-10T09:15:00Z" },
  { id: "pat-5", first_name: "Emma", last_name: "Davis", date_of_birth: "2001-09-14", gender: "Female", phone: "+1 555-1005", is_insured: false, insurance_id: null, insurance_number: null, created_at: "2024-03-05T16:45:00Z" },
  { id: "pat-6", first_name: "Frank", last_name: "Miller", date_of_birth: "1955-12-01", gender: "Male", phone: "+1 555-1006", is_insured: true, insurance_id: "ins-1", insurance_number: "NHI-33198-F", created_at: "2024-03-12T11:00:00Z" },
  { id: "pat-7", first_name: "Grace", last_name: "Taylor", date_of_birth: "1998-01-25", gender: "Female", phone: "+1 555-1007", is_insured: true, insurance_id: "ins-2", insurance_number: "BCP-88412-G", created_at: "2024-04-01T08:00:00Z" },
  { id: "pat-8", first_name: "Henry", last_name: "Anderson", date_of_birth: "1980-06-18", gender: "Male", phone: "+1 555-1008", is_insured: false, insurance_id: null, insurance_number: null, created_at: "2024-04-15T13:30:00Z" },
]

// --- Invoices ---
export const invoices = [
  { id: "inv-1", patient_id: "pat-1", total_amount: 170.00, insurance_amount: 136.00, patient_amount: 34.00, status: "paid" as const, created_at: "2024-06-01T10:00:00Z" },
  { id: "inv-2", patient_id: "pat-2", total_amount: 530.00, insurance_amount: 477.00, patient_amount: 53.00, status: "paid" as const, created_at: "2024-06-05T14:30:00Z" },
  { id: "inv-3", patient_id: "pat-3", total_amount: 85.00, insurance_amount: 0, patient_amount: 85.00, status: "partial" as const, created_at: "2024-06-10T09:00:00Z" },
  { id: "inv-4", patient_id: "pat-4", total_amount: 450.00, insurance_amount: 315.00, patient_amount: 135.00, status: "draft" as const, created_at: "2024-06-15T11:00:00Z" },
  { id: "inv-5", patient_id: "pat-5", total_amount: 125.00, insurance_amount: 0, patient_amount: 125.00, status: "paid" as const, created_at: "2024-06-20T16:00:00Z" },
  { id: "inv-6", patient_id: "pat-6", total_amount: 3620.00, insurance_amount: 1810.00, patient_amount: 1810.00, status: "partial" as const, created_at: "2024-07-01T08:00:00Z" },
  { id: "inv-7", patient_id: "pat-7", total_amount: 310.00, insurance_amount: 279.00, patient_amount: 31.00, status: "paid" as const, created_at: "2024-07-05T12:00:00Z" },
]

// --- Invoice Items ---
export const invoiceItems = [
  { id: "ii-1", invoice_id: "inv-1", act_id: "act-1", quantity: 1, unit_price: 50.00, insurance_part: 40.00, patient_part: 10.00 },
  { id: "ii-2", invoice_id: "inv-1", act_id: "act-3", quantity: 1, unit_price: 35.00, insurance_part: 24.50, patient_part: 10.50 },
  { id: "ii-3", invoice_id: "inv-1", act_id: "act-5", quantity: 1, unit_price: 75.00, insurance_part: 45.00, patient_part: 30.00 },
  { id: "ii-4", invoice_id: "inv-2", act_id: "act-2", quantity: 1, unit_price: 120.00, insurance_part: 108.00, patient_part: 12.00 },
  { id: "ii-5", invoice_id: "inv-2", act_id: "act-6", quantity: 1, unit_price: 450.00, insurance_part: 360.00, patient_part: 90.00 },
  { id: "ii-6", invoice_id: "inv-3", act_id: "act-1", quantity: 1, unit_price: 50.00, insurance_part: 0, patient_part: 50.00 },
  { id: "ii-7", invoice_id: "inv-3", act_id: "act-3", quantity: 1, unit_price: 35.00, insurance_part: 0, patient_part: 35.00 },
]

// --- Cash Registers ---
export const cashRegisters = [
  { id: "cr-1", name: "Main Reception", is_active: true, created_at: "2024-01-01T00:00:00Z" },
  { id: "cr-2", name: "Emergency Desk", is_active: true, created_at: "2024-01-01T00:00:00Z" },
  { id: "cr-3", name: "Pharmacy Counter", is_active: false, created_at: "2024-03-01T00:00:00Z" },
]

// --- Cash Sessions ---
export const cashSessions = [
  { id: "cs-1", cash_register_id: "cr-1", opened_by: "Marie Dupont", opened_at: "2024-07-01T07:00:00Z", closed_at: "2024-07-01T19:00:00Z", opening_balance: 500.00, closing_balance: 2845.00, status: "closed" as const },
  { id: "cs-2", cash_register_id: "cr-2", opened_by: "Jean Martin", opened_at: "2024-07-01T07:00:00Z", closed_at: "2024-07-01T19:00:00Z", opening_balance: 300.00, closing_balance: 1520.00, status: "closed" as const },
  { id: "cs-3", cash_register_id: "cr-1", opened_by: "Marie Dupont", opened_at: "2024-07-02T07:00:00Z", closed_at: null, opening_balance: 500.00, closing_balance: null, status: "open" as const },
  { id: "cs-4", cash_register_id: "cr-2", opened_by: "Pierre Leroy", opened_at: "2024-07-02T07:00:00Z", closed_at: null, opening_balance: 300.00, closing_balance: null, status: "open" as const },
]

// --- Payments ---
export const payments = [
  { id: "pay-1", invoice_id: "inv-1", patient_name: "Alice Martin", amount: 34.00, payment_method: "cash" as const, paid_at: "2024-06-01T10:15:00Z", received_by: "Marie Dupont", cash_session_id: "cs-1" },
  { id: "pay-2", invoice_id: "inv-2", patient_name: "Bob Thompson", amount: 53.00, payment_method: "card" as const, paid_at: "2024-06-05T14:45:00Z", received_by: "Jean Martin", cash_session_id: "cs-2" },
  { id: "pay-3", invoice_id: "inv-3", patient_name: "Clara Rodriguez", amount: 50.00, payment_method: "mobile_money" as const, paid_at: "2024-06-10T09:30:00Z", received_by: "Marie Dupont", cash_session_id: "cs-1" },
  { id: "pay-4", invoice_id: "inv-5", patient_name: "Emma Davis", amount: 125.00, payment_method: "cash" as const, paid_at: "2024-06-20T16:15:00Z", received_by: "Marie Dupont", cash_session_id: "cs-1" },
  { id: "pay-5", invoice_id: "inv-6", patient_name: "Frank Miller", amount: 900.00, payment_method: "bank_transfer" as const, paid_at: "2024-07-01T10:00:00Z", received_by: "Jean Martin", cash_session_id: "cs-2" },
  { id: "pay-6", invoice_id: "inv-7", patient_name: "Grace Taylor", amount: 31.00, payment_method: "card" as const, paid_at: "2024-07-05T12:15:00Z", received_by: "Marie Dupont", cash_session_id: "cs-3" },
]

// --- Expenses ---
export const expenses = [
  { id: "exp-1", description: "Office supplies", amount: 150.00, category: "Supplies", expense_date: "2024-07-01", recorded_by: "Marie Dupont", cash_session_id: "cs-1" },
  { id: "exp-2", description: "Equipment maintenance", amount: 320.00, category: "Maintenance", expense_date: "2024-07-01", recorded_by: "Jean Martin", cash_session_id: "cs-2" },
  { id: "exp-3", description: "Cleaning service", amount: 200.00, category: "Services", expense_date: "2024-07-02", recorded_by: "Marie Dupont", cash_session_id: "cs-3" },
  { id: "exp-4", description: "Printer cartridges", amount: 85.00, category: "Supplies", expense_date: "2024-07-02", recorded_by: "Pierre Leroy", cash_session_id: "cs-4" },
  { id: "exp-5", description: "Emergency medical supplies", amount: 540.00, category: "Medical", expense_date: "2024-07-02", recorded_by: "Marie Dupont", cash_session_id: "cs-3" },
]

// --- Accounting Journal ---
export const accountingJournal = [
  { id: "aj-1", reference: "JRN-2024-001", type: "income" as const, description: "Payment from Alice Martin", debit: 34.00, credit: 0, created_at: "2024-06-01T10:15:00Z", related_payment_id: "pay-1", related_expense_id: null },
  { id: "aj-2", reference: "JRN-2024-002", type: "income" as const, description: "Payment from Bob Thompson", debit: 53.00, credit: 0, created_at: "2024-06-05T14:45:00Z", related_payment_id: "pay-2", related_expense_id: null },
  { id: "aj-3", reference: "JRN-2024-003", type: "income" as const, description: "Payment from Clara Rodriguez", debit: 50.00, credit: 0, created_at: "2024-06-10T09:30:00Z", related_payment_id: "pay-3", related_expense_id: null },
  { id: "aj-4", reference: "JRN-2024-004", type: "expense" as const, description: "Office supplies", debit: 0, credit: 150.00, created_at: "2024-07-01T08:00:00Z", related_payment_id: null, related_expense_id: "exp-1" },
  { id: "aj-5", reference: "JRN-2024-005", type: "expense" as const, description: "Equipment maintenance", debit: 0, credit: 320.00, created_at: "2024-07-01T09:00:00Z", related_payment_id: null, related_expense_id: "exp-2" },
  { id: "aj-6", reference: "JRN-2024-006", type: "income" as const, description: "Payment from Emma Davis", debit: 125.00, credit: 0, created_at: "2024-06-20T16:15:00Z", related_payment_id: "pay-4", related_expense_id: null },
  { id: "aj-7", reference: "JRN-2024-007", type: "income" as const, description: "Payment from Frank Miller", debit: 900.00, credit: 0, created_at: "2024-07-01T10:00:00Z", related_payment_id: "pay-5", related_expense_id: null },
  { id: "aj-8", reference: "JRN-2024-008", type: "expense" as const, description: "Cleaning service", debit: 0, credit: 200.00, created_at: "2024-07-02T08:00:00Z", related_payment_id: null, related_expense_id: "exp-3" },
  { id: "aj-9", reference: "JRN-2024-009", type: "income" as const, description: "Payment from Grace Taylor", debit: 31.00, credit: 0, created_at: "2024-07-05T12:15:00Z", related_payment_id: "pay-6", related_expense_id: null },
  { id: "aj-10", reference: "JRN-2024-010", type: "expense" as const, description: "Emergency medical supplies", debit: 0, credit: 540.00, created_at: "2024-07-02T09:00:00Z", related_payment_id: null, related_expense_id: "exp-5" },
]
