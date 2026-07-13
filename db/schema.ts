import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  numeric,
  timestamp,
  foreignKey,
  index,
  decimal,
  serial,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'


// ============================================================
// DB SCHEMA
// ============================================================

// ============================================================
// SERVICE TYPE ENUM
// ============================================================
export const serviceTypeEnum = pgEnum("service_type", [
  "laboratory",
  "radiology",
  "cardiology",
  "neurology",
  "oncology",
  "orthopedics",
  "pediatrics",
  "obstetrics_gynecology",
  "dermatology",
  "ophthalmology",
  "otolaryngology",
  "urology",
  "gastroenterology",
  "pulmonology",
  "psychiatry",
  "anesthesiology",
  "critical_care",
  "emergency_medicine",
  "general_surgery",
  "laparoscopic_surgery",
  "plastic_surgery",
  "pathology",
  "microbiology",
  "mammography",
  "echocardiography",
  "mri",
  "ct_scan",
  "xray",
  "physiotherapy",
  "occupational_therapy",
  "pharmacy",
  "general_dentistry",
  "oral_surgery",
  "consultation",
  "dialysis",
  "chemotherapy",
  "radiation_therapy",
  "accommodation",
  "other",
])

// ============================================================
// LAB TEST TYPE ENUM
// ============================================================
export const labTestTypeEnum = pgEnum("lab_test_type", [
  "hematology",
  "chemistry",
  "microbiology",
  "immunology",
  "serology",
  "urinalysis",
  "parasitology",
  "histopathology",
  "molecular",
  "endocrinology",
  "other",
])

// ============================================================
// LAB ORDER STATUS ENUM
// ============================================================
export const labOrderStatusEnum = pgEnum("lab_order_status", [
  "pending",
  "sample_collected",
  "in_analysis",
  "results_entered",
  "validated",
  "cancelled",
])

// ============================================================
// RESULT INTERPRETATION ENUM
// ============================================================
export const resultInterpretationEnum = pgEnum("result_interpretation", [
  "normal",
  "low",
  "high",
  "critical_low",
  "critical_high",
])

// ============================================================
// HOSPITALIZATION STATUS ENUM
// ============================================================
export const bedStatusEnum = pgEnum("bed_status", ["available", "occupied", "maintenance", "reserved"])

export const departments = pgTable(
  'departments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    nameIdx: index('departments_name_idx').on(table.name),
    isActiveIdx: index('departments_is_active_idx').on(table.isActive),
  })
)

export const bedAssignmentTypeEnum = pgEnum("bed_assignment_type", ["admission", "transfer", "discharge"])
// ============================================================
// SPECIALTIES TABLE
// ============================================================
export const specialties = pgTable(
  'specialties',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    departmentId: uuid('department_id')
      .notNull()
      .references(() => departments.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    departmentIdIdx: index('specialties_department_id_idx').on(table.departmentId),
    nameIdx: index('specialties_name_idx').on(table.name),
  })
)

// ============================================================
// DOCTORS TABLE
// ============================================================
// ============================================================
// INSURANCES TABLE
// ============================================================
export const insurances = pgTable(
  'insurances',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    contactInfo: varchar('contact_info', { length: 255 }),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 50 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    nameIdx: index('insurances_name_idx').on(table.name),
    isActiveIdx: index('insurances_is_active_idx').on(table.isActive),
  })
)

// ============================================================
// PATIENTS TABLE
// ============================================================
export const patients = pgTable(
  'patients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientNumber: serial('patient_number'),
    patientRef: varchar('patient_ref', { length: 50 }).default('PT-PENDING'),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    dateOfBirth: varchar('date_of_birth', { length: 10 }).notNull(),
    gender: varchar('gender', { length: 10 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull().unique(),
    email: varchar('email', { length: 255 }).unique(),
    address: text('address'),
    quartierId: uuid('quartier_id')
      .references(() => quartiers.id, {
        onDelete: 'set null',
        onUpdate: 'cascade',
      }),
    isInsured: boolean('is_insured').notNull().default(false),
    insuranceId: uuid('insurance_id').references(() => insurances.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    insuranceNumber: varchar('insurance_number', { length: 100 }).unique(),
    insuranceExpiryDate: varchar('insurance_expiry_date', { length: 10 }),
    insuranceCardNumber: varchar('insurance_card_number', { length: 100 }).unique(),
    coverageRate: decimal('coverage_rate', { precision: 5, scale: 2 }).notNull().default('0'),
    isCorporateEmployee: boolean('is_corporate_employee').notNull().default(false),
    corporatePartnerId: uuid('corporate_partner_id')
      .references(() => corporatePartners.id, { onDelete: 'set null', onUpdate: 'cascade' }),
    corporateEmployeeId: uuid('corporate_employee_id')
      .references(() => (corporateEmployees as any).id, { onDelete: 'set null', onUpdate: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    phoneIdx: index('patients_phone_idx').on(table.phone),
    insuranceIdIdx: index('patients_insurance_id_idx').on(table.insuranceId),
    isInsuredIdx: index('patients_is_insured_idx').on(table.isInsured),
    insuranceCardNumberIdx: index('patients_insurance_card_number_idx').on(table.insuranceCardNumber),
    coverageRateIdx: index('patients_coverage_rate_idx').on(table.coverageRate),
  })
)

export const patientInsurances = pgTable(
  'patient_insurances',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    insuranceId: uuid('insurance_id')
      .notNull()
      .references(() => insurances.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    insuranceNumber: varchar('insurance_number', { length: 100 }),
    insuranceCardNumber: varchar('insurance_card_number', { length: 100 }),
    insuranceExpiryDate: varchar('insurance_expiry_date', { length: 10 }),
    coverageRate: decimal('coverage_rate', { precision: 5, scale: 2 }).notNull().default('0'),
    isPrimary: boolean('is_primary').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    patientIdIdx: index('patient_insurances_patient_id_idx').on(table.patientId),
    insuranceIdIdx: index('patient_insurances_insurance_id_idx').on(table.insuranceId),
  })
)


// ============================================================
// USERS TABLE
// ============================================================
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    username: varchar('username', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    fullName: varchar('full_name', { length: 255 }),
    role: varchar('role', { length: 50 }).notNull().default('user'),
    specialtyId: uuid('specialty_id').references(() => specialties.id, { onDelete: 'set null' }),
    phone: varchar('phone', { length: 20 }),
    email: varchar('email', { length: 255 }),
    licenseNumber: varchar('license_number', { length: 100 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    usernameIdx: index('users_username_idx').on(table.username),
    roleIdx: index('users_role_idx').on(table.role),
    isActiveIdx: index('users_is_active_idx').on(table.isActive),
    specialtyIdIdx: index('users_specialty_id_idx').on(table.specialtyId),
  })
)

// ============================================================
// SESSIONS TABLE
// ============================================================
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    token: varchar('token', { length: 255 }).notNull().unique(),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('sessions_user_id_idx').on(table.userId),
    tokenIdx: index('sessions_token_idx').on(table.token),
  })
)

// ============================================================
// SERVICES TABLE
// ============================================================
export const services = pgTable(
  'services',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    code: varchar('code', { length: 50 }).notNull().unique(),
    type: serviceTypeEnum('type').notNull().default('other'),
    description: text('description'),
    isBillable: boolean('is_billable').notNull().default(true),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    codeIdx: index('services_code_idx').on(table.code),
    isActiveIdx: index('services_is_active_idx').on(table.isActive),
  })
)

// ============================================================
// MEDICAL ACTS TABLE
// ============================================================
export const medicalActs = pgTable(
  'medical_acts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 100 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    specialtyId: uuid('specialty_id').references(() => specialties.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull(),
    requiresAuthorization: boolean('requires_authorization').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    codeIdx: index('medical_acts_code_idx').on(table.code),
    serviceIdIdx: index('medical_acts_service_id_idx').on(table.serviceId),
    specialtyIdIdx: index('medical_acts_specialty_id_idx').on(table.specialtyId),
    isActiveIdx: index('medical_acts_is_active_idx').on(table.isActive),
  })
)

// ============================================================
// INSURANCE SERVICE RULES TABLE
// ============================================================
export const insuranceServiceRules = pgTable(
  'insurance_service_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    insuranceId: uuid('insurance_id')
      .notNull()
      .references(() => insurances.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    coverageRate: decimal('coverage_rate', { precision: 5, scale: 2 }).notNull().default('0'),
    plafond: decimal('plafond', { precision: 10, scale: 2 }),
    requiresAuthorization: boolean('requires_authorization').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    insuranceIdIdx: index('insurance_service_rules_insurance_id_idx').on(table.insuranceId),
    serviceIdIdx: index('insurance_service_rules_service_id_idx').on(table.serviceId),
  })
)

// ============================================================
// INSURANCE BATCHES (BORDEREAUX) TABLE
// ============================================================
export const insuranceBatches = pgTable(
  'insurance_batches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    insuranceId: uuid('insurance_id')
      .notNull()
      .references(() => insurances.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    batchNumber: varchar('batch_number', { length: 50 }).notNull().unique(),
    status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, submitted, paid
    totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
    submittedAt: timestamp('submitted_at').notNull().defaultNow(),
    paidAt: timestamp('paid_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    insuranceIdIdx: index('insurance_batches_insurance_id_idx').on(table.insuranceId),
    statusIdx: index('insurance_batches_status_idx').on(table.status),
  })
)

// ============================================================
// INSURANCE CLAIMS TABLE
// ============================================================
export const insuranceClaims = pgTable(
  'insurance_claims',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    batchId: uuid('batch_id')
      .references(() => insuranceBatches.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    insuranceId: uuid('insurance_id')
      .notNull()
      .references(() => insurances.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    invoiceId: uuid('invoice_id')
      .notNull()
      .unique() // An invoice cannot be in multiple claims
      .references(() => invoices.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    claimAmount: decimal('claim_amount', { precision: 10, scale: 2 }).notNull(),
    approvedAmount: decimal('approved_amount', { precision: 10, scale: 2 }).notNull().default('0'),
    deniedReason: text('denied_reason'),
    submittedAt: timestamp('submitted_at').notNull().defaultNow(),
    paidAt: timestamp('paid_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    batchIdIdx: index('insurance_claims_batch_id_idx').on(table.batchId),
    insuranceIdIdx: index('insurance_claims_insurance_id_idx').on(table.insuranceId),
    patientIdIdx: index('insurance_claims_patient_id_idx').on(table.patientId),
    invoiceIdIdx: index('insurance_claims_invoice_id_idx').on(table.invoiceId),
  })
)

// ============================================================
// INSURANCE PAYMENTS TABLE
// ============================================================
export const insurancePayments = pgTable(
  'insurance_payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    insuranceId: uuid('insurance_id')
      .notNull()
      .references(() => insurances.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => insuranceBatches.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    claimId: uuid('claim_id')
      .references(() => insuranceClaims.id, { onDelete: 'set null', onUpdate: 'cascade' }),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    paymentMethod: varchar('payment_method', { length: 50 }).notNull().default('transfer'), // cash, card, check, transfer
    paymentDate: timestamp('payment_date').notNull().defaultNow(),
    referenceNumber: varchar('reference_number', { length: 100 }),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    insuranceIdIdx: index('insurance_payments_insurance_id_idx').on(table.insuranceId),
    claimIdIdx: index('insurance_payments_claim_id_idx').on(table.claimId),
  })
)

// ============================================================
// INVOICES TABLE
// ============================================================
export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
    visitId: uuid('visit_id').references(() => visits.id),
    insuranceAmount: decimal('insurance_amount', { precision: 10, scale: 2 }).notNull().default('0'),
    insurancePaidAmount: decimal('insurance_paid_amount', { precision: 10, scale: 2 }).notNull().default('0'),
    patientAmount: decimal('patient_amount', { precision: 10, scale: 2 }).notNull(),
    discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).notNull().default('0'),
    status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, paid, partial, cancelled
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    invoiceNumberIdx: index('invoices_invoice_number_idx').on(table.invoiceNumber),
    patientIdIdx: index('invoices_patient_id_idx').on(table.patientId),
    statusIdx: index('invoices_status_idx').on(table.status),
  })
)

// ============================================================
// INVOICE ITEMS TABLE
// ============================================================
export const invoiceItems = pgTable(
  'invoice_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    medicalActId: uuid('medical_act_id')
      .notNull()
      .references(() => medicalActs.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    quantity: numeric('quantity', { precision: 5, scale: 2 }).notNull().default('1'),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
    totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    invoiceIdIdx: index('invoice_items_invoice_id_idx').on(table.invoiceId),
    medicalActIdIdx: index('invoice_items_medical_act_id_idx').on(table.medicalActId),
  })
)

// ============================================================
// PAYMENTS TABLE
// ============================================================
export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    paymentMethod: varchar('payment_method', { length: 50 }).notNull(), // cash, card, check, insurance, transfer
    referenceNumber: varchar('reference_number', { length: 100 }),
    notes: text('notes'),
    cashSessionId: uuid('cash_session_id').references(() => cashSessions.id, { onDelete: 'set null', onUpdate: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    invoiceIdIdx: index('payments_invoice_id_idx').on(table.invoiceId),
    patientIdIdx: index('payments_patient_id_idx').on(table.patientId),
    paymentMethodIdx: index('payments_payment_method_idx').on(table.paymentMethod),
    cashSessionIdIdx: index('payments_cash_session_id_idx').on(table.cashSessionId),
  })
)

// ============================================================
// CASH REGISTER TABLE
// ============================================================
export const cashRegister = pgTable(
  'cash_register',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    assignedToUserId: uuid('assigned_to_user_id').references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    nameIdx: index('cash_register_name_idx').on(table.name),
  })
)

// ============================================================
// CASH SESSIONS TABLE
// ============================================================
export const cashSessions = pgTable(
  'cash_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cashRegisterId: uuid('cash_register_id')
      .notNull()
      .references(() => cashRegister.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    openingBalance: decimal('opening_balance', { precision: 10, scale: 2 }).notNull().default('0'),
    closingBalance: decimal('closing_balance', { precision: 10, scale: 2 }),
    totalIncome: decimal('total_income', { precision: 10, scale: 2 }).notNull().default('0'),
    totalExpenses: decimal('total_expenses', { precision: 10, scale: 2 }).notNull().default('0'),
    status: varchar('status', { length: 20 }).notNull().default('open'), // open, closed
    openedBy: uuid('opened_by').notNull().references(() => users.id),
    closedBy: uuid('closed_by').references(() => users.id),
    openedAt: timestamp('opened_at').notNull().defaultNow(),
    closedAt: timestamp('closed_at'),
    expectedBalance: decimal('expected_balance', { precision: 10, scale: 2 }).notNull().default('0'),
    physicalBalance: decimal('physical_balance', { precision: 10, scale: 2 }),
    notes: text('notes'),
  },
  (table) => ({
    cashRegisterIdIdx: index('cash_sessions_cash_register_id_idx').on(table.cashRegisterId),
    statusIdx: index('cash_sessions_status_idx').on(table.status),
  })
)

// ============================================================
// EXPENSES TABLE
// ============================================================
export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    description: varchar('description', { length: 255 }).notNull(),
    category: varchar('category', { length: 100 }).notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    cashSessionId: uuid('cash_session_id').references(() => cashSessions.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    categoryIdx: index('expenses_category_idx').on(table.category),
    cashSessionIdIdx: index('expenses_cash_session_id_idx').on(table.cashSessionId),
  })
)

// ============================================================
// ACCOUNTING JOURNAL TABLE
// ============================================================
export const accountingJournal = pgTable(
  'accounting_journal',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entryNumber: varchar('entry_number', { length: 50 }).notNull().unique(),
    description: varchar('description', { length: 255 }).notNull(),
    debitAmount: decimal('debit_amount', { precision: 10, scale: 2 }).notNull().default('0'),
    creditAmount: decimal('credit_amount', { precision: 10, scale: 2 }).notNull().default('0'),
    referenceId: uuid('reference_id'), // FK to invoice, payment, expense, etc.
    referenceType: varchar('reference_type', { length: 50 }), // invoice, payment, expense
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    entryNumberIdx: index('accounting_journal_entry_number_idx').on(table.entryNumber),
    referenceIdIdx: index('accounting_journal_reference_id_idx').on(table.referenceId),
  })
)



// ============================================================
//Appointments TABLE
// ============================================================

export const appointments = pgTable(
  'appointments',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),

    doctorId: uuid('doctor_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    appointmentDate: timestamp('appointment_date').notNull(),

    status: varchar('status', { length: 20 })
      .notNull()
      .default('scheduled'), // scheduled | completed | cancelled | no_show

    reason: text('reason'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    patientIdx: index('appointments_patient_idx').on(table.patientId),
    doctorIdx: index('appointments_doctor_idx').on(table.doctorId),
  })
)

// ============================================================
//visits TABLE
// ============================================================
export const visits = pgTable(
  'visits',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id),

    doctorId: uuid('doctor_id')
      .notNull()
      .references(() => users.id),

    appointmentId: uuid('appointment_id')
      .references(() => appointments.id),

    visitDate: timestamp('visit_date').notNull().defaultNow(),

    consultationNumber: varchar('consultation_number', { length: 50 }).unique(),
    status: varchar('status', { length: 30 }).notNull().default('waiting'),
    // waiting, in_consultation, in_exam, in_lab, in_radiology, in_pharmacy, hospitalized, completed, cancelled

    consultationType: varchar('consultation_type', { length: 50 }).notNull().default('general'),
    // general, pediatric, ophthalmology, gynecology

    chiefComplaint: text('chief_complaint'),
    symptoms: text('symptoms'),
    symptomsDuration: varchar('symptoms_duration', { length: 100 }),
    painLevel: numeric('pain_level'),
    onsetDate: timestamp('onset_date'),

    medicalHistory: text('medical_history'),
    surgicalHistory: text('surgical_history'),
    familyHistory: text('family_history'),
    allergies: text('allergies'),
    currentMedications: text('current_medications'),

    notes: text('notes'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    patientIdx: index('visits_patient_idx').on(table.patientId),
    doctorIdx: index('visits_doctor_idx').on(table.doctorId),
    statusIdx: index('visits_status_idx').on(table.status),
    consultationNumberIdx: index('visits_consultation_number_idx').on(table.consultationNumber),
  })
)

//=============================================================
//triage TABLE 
//=============================================================
// ============================================================
// PROVINCES / COMMUNES /ZONES/ QUARTIERS
// (restored - used by patients/visits migrations)
// ============================================================
export const provinces = pgTable(
  'provinces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 150 }).notNull().unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    nameIdx: index('provinces_name_idx').on(table.name),
  })
)

export const communes = pgTable(
  'communes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 150 }).notNull(),
    provinceId: uuid('province_id').notNull().references(() => provinces.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    provinceIdx: index('communes_province_id_idx').on(table.provinceId),
  })
)


export const zones = pgTable(
  'zones',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 150 }).notNull(),
    communeId: uuid('commune_id').notNull().references(() => communes.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    communeIdx: index('zones_commune_id_idx').on(table.communeId),
  })
)


export const quartiers = pgTable(
  'quartiers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 150 }).notNull(),
    zoneId: uuid('zone_id').references(() => zones.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    zoneIdx: index('quartiers_zone_id_idx').on(table.zoneId),
  })
)


export const triage = pgTable(
  'triage',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    visitId: uuid('visit_id')
      .notNull()
      .references(() => visits.id, { onDelete: 'cascade' }),

    temperature: decimal('temperature', { precision: 5, scale: 2 }),
    bloodPressure: varchar('blood_pressure', { length: 20 }),
    heartRate: numeric('heart_rate'),
    respiratoryRate: numeric('respiratory_rate'),
    oxygenSaturation: numeric('oxygen_saturation'),
    weight: decimal('weight', { precision: 5, scale: 2 }),
    height: decimal('height', { precision: 5, scale: 2 }),
    bmi: decimal('bmi', { precision: 5, scale: 2 }),
    painLevel: numeric('pain_level'),
    notes: text('notes'),

    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    visitIdx: index('triage_visit_idx').on(table.visitId),
  })
)


//=============================================================
//diagnosis TABLE 
//=============================================================
export const diagnoses = pgTable(
  'diagnoses',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    visitId: uuid('visit_id')
      .notNull()
      .references(() => visits.id, { onDelete: 'cascade' }),

    diagnosisType: varchar('diagnosis_type', { length: 30 }).notNull().default('principal'),
    // principal, secondary, provisional, final

    diagnosisCode: varchar('diagnosis_code', { length: 50 }),
    diagnosisName: varchar('diagnosis_name', { length: 255 }),
    icdCode: varchar('icd_code', { length: 20 }),

    notes: text('notes'),

    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    visitIdx: index('diagnoses_visit_idx').on(table.visitId),
  })
)


//=============================================================
//prescriptions TABLE 
//=============================================================
export const prescriptions = pgTable(
  'prescriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    visitId: uuid('visit_id')
      .notNull()
      .references(() => visits.id),

    doctorId: uuid('doctor_id')
      .notNull()
      .references(() => users.id),

    notes: text('notes'),

    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    visitIdx: index('prescriptions_visit_idx').on(table.visitId),
  })
)

export const prescriptionItems = pgTable(
  'prescription_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    prescriptionId: uuid('prescription_id')
      .notNull()
      .references(() => prescriptions.id, { onDelete: 'cascade' }),

    medicineName: varchar('medicine_name', { length: 255 }).notNull(),

    dosage: varchar('dosage', { length: 100 }),
    frequency: varchar('frequency', { length: 100 }),
    duration: varchar('duration', { length: 100 }),

    notes: text('notes'),
  },
  (table) => ({
    prescriptionIdx: index('prescription_items_prescription_idx').on(table.prescriptionId),
  })
)


//=============================================================
//medicine and stock TABLE
//=============================================================
export const medicineCategories = pgTable(
  "medicine_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow(),
  }
)
export const medicines = pgTable(
  "medicines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    genericName: varchar("generic_name", { length: 255 }),
    categoryId: uuid("category_id")
      .references(() => medicineCategories.id),
    unit: varchar("unit", { length: 50 }).notNull(), // tablet, bottle
    barcode: varchar("barcode", { length: 100 }),
    sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }).notNull().default('0'),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
  }
)

export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    email: varchar("email", { length: 255 }),
    address: text("address"),
    createdAt: timestamp("created_at").defaultNow(),
  }
)

export const purchaseOrders = pgTable(
  "purchase_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    supplierId: uuid("supplier_id")
      .references(() => suppliers.id),
    orderDate: timestamp("order_date").defaultNow(),
    status: varchar("status", { length: 50 }).default("pending"),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  }
)

export const purchaseOrderItems = pgTable(
  "purchase_order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    purchaseOrderId: uuid("purchase_order_id")
      .references(() => purchaseOrders.id),
    medicineId: uuid("medicine_id")
      .references(() => medicines.id),
    quantity: numeric("quantity"),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  }
)

export const pharmacyStock = pgTable(
  "pharmacy_stock",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    medicineId: uuid("medicine_id")
      .references(() => medicines.id),
    quantity: numeric("quantity").default("0"),
    expiryDate: timestamp("expiry_date"),
    batchNumber: varchar("batch_number", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow(),
  }
)

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    medicineId: uuid("medicine_id")
      .references(() => medicines.id),
    type: varchar("type", { length: 50 }), // purchase, dispense, adjustment
    quantity: numeric("quantity"),
    referenceId: uuid("reference_id"),
    referenceType: varchar("reference_type", { length: 50 }),
    createdAt: timestamp("created_at").defaultNow(),
  }
)

export const medicineLots = pgTable(
  "medicine_lots",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    medicineId: uuid("medicine_id")
      .notNull()
      .references(() => medicines.id, { onDelete: "cascade" }),

    lotNumber: varchar("lot_number", { length: 100 }).notNull(),

    purchaseOrderItemId: uuid("purchase_order_item_id")
      .references(() => purchaseOrderItems.id),

    quantityReceived: numeric("quantity_received", { precision: 10, scale: 2 }).notNull(),

    quantityRemaining: numeric("quantity_remaining", { precision: 10, scale: 2 }).notNull(),

    unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),

    expiryDate: timestamp("expiry_date"),

    receivedAt: timestamp("received_at").notNull().defaultNow(),

    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    medicineIdx: index("medicine_lots_medicine_idx").on(table.medicineId),
    lotIdx: index("medicine_lots_lot_idx").on(table.lotNumber),
    expiryIdx: index("medicine_lots_expiry_idx").on(table.expiryDate),
  })
)
export const pharmacyDispensations = pgTable(
  "pharmacy_dispensations",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    visitId: uuid("visit_id")
      .notNull()
      .references(() => visits.id, { onDelete: "cascade" }),

    dispensationDate: timestamp("dispensation_date").notNull().defaultNow(),

    notes: text("notes"),

    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    visitIdx: index("pharmacy_dispensations_visit_idx").on(table.visitId),
  })
)




export const dispensationItems = pgTable(
  "dispensation_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    dispensationId: uuid("dispensation_id")
      .notNull()
      .references(() => pharmacyDispensations.id),

    medicineLotId: uuid("medicine_lot_id")
      .notNull()
      .references(() => medicineLots.id),

    quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),

    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    lotIdx: index("dispensation_items_lot_idx").on(table.medicineLotId),
  })
)

// ============================================================
// MEDICAL DECISIONS TABLE
// ============================================================
export const medicalDecisions = pgTable(
  'medical_decisions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    visitId: uuid('visit_id')
      .notNull()
      .references(() => visits.id, { onDelete: 'cascade' }),

    decision: varchar('decision', { length: 50 }).notNull(),
    // return_home, follow_up, refer_to_specialist, hospitalization, surgery, emergency, refer_to_other

    specialistId: uuid('specialist_id')
      .references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),

    followUpDate: timestamp('follow_up_date'),
    reason: text('reason'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    visitIdx: index('medical_decisions_visit_idx').on(table.visitId),
  })
)

// ============================================================
// LAB TEST CATALOG
// ============================================================
export const labTests = pgTable(
  'lab_tests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 50 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    testType: labTestTypeEnum('test_type').notNull(),
    price: numeric('price', { precision: 12, scale: 2 }).notNull().default('0'),
    turnaroundTimeHours: numeric('turnaround_time_hours', { precision: 5, scale: 1 }).notNull().default('24'),
    instructions: text('instructions'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    codeIdx: index('lab_tests_code_idx').on(table.code),
    serviceIdIdx: index('lab_tests_service_id_idx').on(table.serviceId),
    isActiveIdx: index('lab_tests_is_active_idx').on(table.isActive),
  })
)

// ============================================================
// LAB TEST PARAMETERS
// ============================================================
export const labTestParameters = pgTable(
  'lab_test_parameters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    labTestId: uuid('lab_test_id')
      .notNull()
      .references(() => labTests.id, { onDelete: 'cascade' }),
    parameterCode: varchar('parameter_code', { length: 50 }).notNull(),
    parameterName: varchar('parameter_name', { length: 255 }).notNull(),
    unit: varchar('unit', { length: 50 }).notNull(),
    referenceRangeLow: numeric('reference_range_low', { precision: 12, scale: 3 }),
    referenceRangeHigh: numeric('reference_range_high', { precision: 12, scale: 3 }),
    referenceRangeText: text('reference_range_text'),
    maleRefRangeLow: numeric('male_ref_range_low', { precision: 12, scale: 3 }),
    maleRefRangeHigh: numeric('male_ref_range_high', { precision: 12, scale: 3 }),
    femaleRefRangeLow: numeric('female_ref_range_low', { precision: 12, scale: 3 }),
    femaleRefRangeHigh: numeric('female_ref_range_high', { precision: 12, scale: 3 }),
    sortOrder: numeric('sort_order', { precision: 3, scale: 0 }).notNull().default('0'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    labTestIdIdx: index('lab_test_parameters_lab_test_id_idx').on(table.labTestId),
    isActiveIdx: index('lab_test_parameters_is_active_idx').on(table.isActive),
  })
)

// ============================================================
// LAB ORDERS
// Maps a clinical exam_request (lab type) to a structured lab workflow.
// ============================================================
export const labOrders = pgTable(
  'lab_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),

    visitId: uuid('visit_id')
      .references(() => visits.id, { onDelete: 'cascade' }),

    examRequestId: uuid('exam_request_id')
      .references(() => examRequests.id, { onDelete: 'set null' }),

    labTestId: uuid('lab_test_id')
      .notNull()
      .references(() => labTests.id, { onDelete: 'restrict' }),

    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id),

    orderedBy: uuid('ordered_by')
      .notNull()
      .references(() => users.id),

    status: labOrderStatusEnum('status').notNull().default('pending'),

    priority: varchar('priority', { length: 30 }).notNull().default('normal'),

    sampledAt: timestamp('sampled_at'),
    sampledBy: uuid('sampled_by').references(() => users.id, { onDelete: 'set null' }),

    notes: text('notes'),
    clinicalNotes: text('clinical_notes'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    orderNumberIdx: index('lab_orders_order_number_idx').on(table.orderNumber),
    visitIdIdx: index('lab_orders_visit_id_idx').on(table.visitId),
    examRequestIdIdx: index('lab_orders_exam_request_id_idx').on(table.examRequestId),
    labTestIdIdx: index('lab_orders_lab_test_id_idx').on(table.labTestId),
    statusIdx: index('lab_orders_status_idx').on(table.status),
    patientIdIdx: index('lab_orders_patient_id_idx').on(table.patientId),
  })
)

// ============================================================
// LAB RESULTS HEADER
// ============================================================
export const labResults = pgTable(
  'lab_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    labOrderId: uuid('lab_order_id')
      .notNull()
      .references(() => labOrders.id, { onDelete: 'cascade' })
      .unique(),

    recordedBy: uuid('recorded_by')
      .notNull()
      .references(() => users.id),

    recordedAt: timestamp('recorded_at').notNull().defaultNow(),

    notes: text('notes'),

    isVerified: boolean('is_verified').notNull().default(false),
    verifiedBy: uuid('verified_by').references(() => users.id, { onDelete: 'set null' }),
    verifiedAt: timestamp('verified_at'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    labOrderIdIdx: index('lab_results_lab_order_id_idx').on(table.labOrderId),
    verifiedByIdx: index('lab_results_verified_by_idx').on(table.verifiedBy),
  })
)

// ============================================================
// LAB RESULT VALUES
// ============================================================
export const labResultValues = pgTable(
  'lab_result_values',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    labResultId: uuid('lab_result_id')
      .notNull()
      .references(() => labResults.id, { onDelete: 'cascade' }),

    labTestParameterId: uuid('lab_test_parameter_id')
      .notNull()
      .references(() => labTestParameters.id, { onDelete: 'restrict' }),

    value: text('value').notNull(),
    numericValue: numeric('numeric_value', { precision: 12, scale: 3 }),

    unit: varchar('unit', { length: 50 }),

    interpretation: resultInterpretationEnum('interpretation'),

    flagged: boolean('flagged').notNull().default(false),
    referenceRangeUsed: text('reference_range_used'),
    comment: text('comment'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    labResultIdIdx: index('lab_result_values_lab_result_id_idx').on(table.labResultId),
    parameterIdIdx: index('lab_result_values_parameter_id_idx').on(table.labTestParameterId),
  })
)

// ============================================================
// EXAM REQUESTS TABLE
// ============================================================
export const examRequests = pgTable(
  'exam_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    visitId: uuid('visit_id')
      .notNull()
      .references(() => visits.id, { onDelete: 'cascade' }),

    examType: varchar('exam_type', { length: 30 }).notNull(),
    // lab, imaging

    examName: varchar('exam_name', { length: 255 }).notNull(),
    // For lab: NFS, Glycémie, CRP, ECBU, Sérologie, etc.
    // For imaging: Radiographie, Échographie, Scanner, IRM, ECG, etc.

    priority: varchar('priority', { length: 30 }).notNull().default('normal'),
    // normal, urgent, very_urgent

    status: varchar('status', { length: 30 }).notNull().default('pending'),
    // pending, in_progress, completed, validated

    requestedBy: uuid('requested_by')
      .references(() => users.id, { onDelete: 'set null' }),

    notes: text('notes'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    visitIdx: index('exam_requests_visit_idx').on(table.visitId),
    statusIdx: index('exam_requests_status_idx').on(table.status),
  })
)

// ============================================================
// EXAM RESULTS TABLE
// ============================================================
export const examResults = pgTable(
  'exam_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    examRequestId: uuid('exam_request_id')
      .notNull()
      .references(() => examRequests.id, { onDelete: 'cascade' }),

    resultDate: timestamp('result_date').notNull().defaultNow(),
    resultText: text('result_text'),
    fileUrl: text('file_url'),
    notes: text('notes'),

    validatedBy: uuid('validated_by')
      .references(() => users.id, { onDelete: 'set null' }),

    validatedAt: timestamp('validated_at'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    examRequestIdx: index('exam_results_exam_request_idx').on(table.examRequestId),
  })
)

// ============================================================
// HOSPITALIZATIONS TABLE
// ============================================================


export const wards = pgTable(
  'wards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 150 }).notNull(), // "Maternité", "Pédiatrie", "Chirurgie"
    departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'set null' }),
    floor: varchar('floor', { length: 50 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  }
)

export const beds = pgTable(
  'beds',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    wardId: uuid('ward_id').notNull().references(() => wards.id, { onDelete: 'cascade' }),
    bedNumber: varchar('bed_number', { length: 20 }).notNull(),
    bedType: varchar('bed_type', { length: 50 }), // standard, icu, private
    status: bedStatusEnum('status').notNull().default('available'),
    dailyRateActId: uuid('daily_rate_act_id').references(() => medicalActs.id, { onDelete: 'set null' }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    wardIdx: index('beds_ward_idx').on(table.wardId),
    statusIdx: index('beds_status_idx').on(table.status),
  })
)
export const hospitalizations = pgTable(
  'hospitalizations',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    visitId: uuid('visit_id')
      .notNull()
      .references(() => visits.id, { onDelete: 'cascade' }),

    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),

    departmentId: uuid('department_id')
      .references(() => departments.id, { onDelete: 'set null' }),

    doctorId: uuid('doctor_id')
      .references(() => users.id, { onDelete: 'set null' }),

    admissionDate: timestamp('admission_date').notNull().defaultNow(),
    dischargeDate: timestamp('discharge_date'),

    serviceId: uuid('service_id').references(() => services.id, { onDelete: 'set null' }),
    expectedDischargeDate: timestamp('expected_discharge_date'),
    dischargeSummary: text('discharge_summary'),

    status: varchar('status', { length: 30 }).notNull().default('admitted'),
    // admitted, discharged, transferred

    reason: text('reason'),
    notes: text('notes'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    visitIdx: index('hospitalizations_visit_idx').on(table.visitId),
    patientIdx: index('hospitalizations_patient_idx').on(table.patientId),
    statusIdx: index('hospitalizations_status_idx').on(table.status),
  })
)

export const bedAssignments = pgTable(
  'bed_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    hospitalizationId: uuid('hospitalization_id')
      .notNull()
      .references(() => hospitalizations.id, { onDelete: 'cascade' }),
    bedId: uuid('bed_id').notNull().references(() => beds.id, { onDelete: 'restrict' }),
    assignmentType: bedAssignmentTypeEnum('assignment_type').notNull().default('admission'),
    assignedAt: timestamp('assigned_at').notNull().defaultNow(),
    releasedAt: timestamp('released_at'), // null while still occupying this bed
    assignedBy: uuid('assigned_by').references(() => users.id, { onDelete: 'set null' }),
    reason: text('reason'), // why the transfer happened
  },
  (table) => ({
    hospitalizationIdx: index('bed_assignments_hospitalization_idx').on(table.hospitalizationId),
    bedIdx: index('bed_assignments_bed_idx').on(table.bedId),
  })
)

// ============================================================
// PHARMACY SALES TABLES
// ============================================================
export const pharmacySales = pgTable(
  "pharmacy_sales",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    saleDate: timestamp("sale_date").notNull().defaultNow(),
    status: varchar("status", { length: 50 }).notNull().default("confirmed"),
    paymentMethod: varchar("payment_method", { length: 50 }).notNull().default("cash"),
    paymentStatus: varchar("payment_status", { length: 50 }).notNull().default("paid"),
    customerName: varchar("customer_name", { length: 255 }), // nullable = anonymous
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
  }
)

export const pharmacySaleItems = pgTable(
  "pharmacy_sale_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    saleId: uuid("sale_id")
      .notNull()
      .references(() => pharmacySales.id, { onDelete: "cascade" }),
    medicineId: uuid("medicine_id")
      .notNull()
      .references(() => medicines.id),
    lotId: uuid("lot_id")
      .notNull()
      .references(() => medicineLots.id),
    quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    saleIdx: index("pharmacy_sale_items_sale_idx").on(table.saleId),
    medicineIdx: index("pharmacy_sale_items_medicine_idx").on(table.medicineId),
    lotIdx: index("pharmacy_sale_items_lot_idx").on(table.lotId),
  })
)

// ============================================================
// CORPORATE PARTNERS / COMPANIES TABLE
// ============================================================
export const corporatePartners = pgTable(
  'corporate_partners',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyName: varchar('company_name', { length: 255 }).notNull().unique(),
    registrationNumber: varchar('registration_number', { length: 100 }).unique(),
    taxId: varchar('tax_id', { length: 100 }).unique(),
    contactPerson: varchar('contact_person', { length: 255 }),
    contactEmail: varchar('contact_email', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 50 }),
    address: text('address'),
    website: varchar('website', { length: 255 }),
    isActive: boolean('is_active').notNull().default(true),
    // Partnership details
    partnershipStartDate: timestamp('partnership_start_date').notNull(),
    partnershipEndDate: timestamp('partnership_end_date'),
    autoRenew: boolean('auto_renew').notNull().default(false),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    companyNameIdx: index('corporate_partners_company_name_idx').on(table.companyName),
    isActiveIdx: index('corporate_partners_is_active_idx').on(table.isActive),
  })
)

// ============================================================
// CORPORATE EMPLOYEES TABLE
// ============================================================
export const corporateEmployees: any = pgTable(
  'corporate_employees',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => corporatePartners.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => (patients as any).id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    employeeNumber: varchar('employee_number', { length: 100 }).notNull().unique(),
    department: varchar('department', { length: 255 }),
    position: varchar('position', { length: 255 }),
    hireDate: timestamp('hire_date'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    partnerIdIdx: index('corporate_employees_partner_id_idx').on(table.partnerId),
    patientIdIdx: index('corporate_employees_patient_id_idx').on(table.patientId),
    employeeNumberIdx: index('corporate_employees_employee_number_idx').on(table.employeeNumber),
  })
)

// ============================================================
// PARTNERSHIP AGREEMENTS TABLE
// ============================================================
export const partnershipAgreements = pgTable(
  'partnership_agreements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => corporatePartners.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    agreementNumber: varchar('agreement_number', { length: 100 }).notNull().unique(),
    agreementType: varchar('agreement_type', { length: 50 }).notNull(), // 'discount', 'flat_rate', 'capped'
    effectiveDate: timestamp('effective_date').notNull(),
    expiryDate: timestamp('expiry_date'),
    isActive: boolean('is_active').notNull().default(true),
    // Global discount for all services (optional)
    globalDiscountPercentage: decimal('global_discount_percentage', { precision: 5, scale: 2 }),
    // Cap per visit or per year
    maxDiscountPerVisit: decimal('max_discount_per_visit', { precision: 10, scale: 2 }),
    maxDiscountPerYear: decimal('max_discount_per_year', { precision: 10, scale: 2 }),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    partnerIdIdx: index('partnership_agreements_partner_id_idx').on(table.partnerId),
    agreementNumberIdx: index('partnership_agreements_agreement_number_idx').on(table.agreementNumber),
    isActiveIdx: index('partnership_agreements_is_active_idx').on(table.isActive),
  })
)

// ============================================================
// PARTNERSHIP SERVICE RULES (Act-level reductions)
// ============================================================
export const partnershipServiceRules = pgTable(
  'partnership_service_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => corporatePartners.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    agreementId: uuid('agreement_id')
      .notNull()
      .references(() => partnershipAgreements.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    // Target for reduction
    serviceId: uuid('service_id')
      .references(() => services.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    medicalActId: uuid('medical_act_id')
      .references(() => medicalActs.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    specialtyId: uuid('specialty_id')
      .references(() => specialties.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    // Reduction rules
    reductionType: varchar('reduction_type', { length: 50 }).notNull(), // 'percentage', 'fixed_amount'
    reductionValue: decimal('reduction_value', { precision: 10, scale: 2 }).notNull(),
    // Optionally cap the reduction
    maxReductionAmount: decimal('max_reduction_amount', { precision: 10, scale: 2 }),
    minBillableAmount: decimal('min_billable_amount', { precision: 10, scale: 2 }).default('0'),
    isActive: boolean('is_active').notNull().default(true),
    priority: numeric('priority').notNull().default('1'), // Higher priority wins if multiple rules match
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    partnerIdIdx: index('partnership_service_rules_partner_id_idx').on(table.partnerId),
    agreementIdIdx: index('partnership_service_rules_agreement_id_idx').on(table.agreementId),
    serviceIdIdx: index('partnership_service_rules_service_id_idx').on(table.serviceId),
    medicalActIdIdx: index('partnership_service_rules_medical_act_id_idx').on(table.medicalActId),
  })
)

// ============================================================
// CLINIC SETTINGS TABLE
// ============================================================
export const clinicSettings = pgTable(
  'clinic_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    nif: varchar('nif', { length: 100 }),
    rc: varchar('rc', { length: 100 }),
    formeJuridique: varchar('forme_juridique', { length: 100 }),
    address: text('address'),
    city: varchar('city', { length: 100 }),
    commune: varchar('commune', { length: 100 }),
    province: varchar('province', { length: 100 }),
    phone: varchar('phone', { length: 50 }),
    email: varchar('email', { length: 255 }),
    website: varchar('website', { length: 255 }),
    logoUrl: text('logo_url'),
    centreFiscal: varchar('centre_fiscal', { length: 100 }),
    slogan: varchar('slogan', { length: 255 }),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  }
)

// ============================================================
// PARTNERSHIP VISIT LOGS (Track actual usage)
// ============================================================
export const partnershipVisitLogs = pgTable(
  'partnership_visit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => corporatePartners.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => corporateEmployees.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    visitId: uuid('visit_id')
      .notNull()
      .references(() => visits.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    invoiceId: uuid('invoice_id')
      .references(() => invoices.id, { onDelete: 'set null', onUpdate: 'cascade' }),
    // Track discounts applied
    totalDiscountApplied: decimal('total_discount_applied', { precision: 10, scale: 2 }).notNull().default('0'),
    originalTotal: decimal('original_total', { precision: 10, scale: 2 }).notNull(),
    finalTotal: decimal('final_total', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    partnerIdIdx: index('partnership_visit_logs_partner_id_idx').on(table.partnerId),
    employeeIdIdx: index('partnership_visit_logs_employee_id_idx').on(table.employeeId),
    visitIdIdx: index('partnership_visit_logs_visit_id_idx').on(table.visitId),
  })
)

// ============================================================
// PARTNERSHIP DISCOUNT HISTORY (Detailed breakdown)
// ============================================================
export const partnershipDiscountHistory = pgTable(
  'partnership_discount_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => corporatePartners.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    invoiceItemId: uuid('invoice_item_id')
      .notNull()
      .references(() => invoiceItems.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    ruleId: uuid('rule_id')
      .notNull()
      .references(() => partnershipServiceRules.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    originalPrice: decimal('original_price', { precision: 10, scale: 2 }).notNull(),
    discountedPrice: decimal('discounted_price', { precision: 10, scale: 2 }).notNull(),
    discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).notNull(),
    discountType: varchar('discount_type', { length: 50 }).notNull(),
    discountValue: decimal('discount_value', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    partnerIdIdx: index('partnership_discount_history_partner_id_idx').on(table.partnerId),
    invoiceItemIdIdx: index('partnership_discount_history_invoice_item_id_idx').on(table.invoiceItemId),
    ruleIdIdx: index('partnership_discount_history_rule_id_idx').on(table.ruleId),
  })
)

// ============================================================
// RELATIONS
// ============================================================

export const provincesRelations = relations(provinces, ({ many }) => ({
  communes: many(communes),
}))

export const communesRelations = relations(communes, ({ one, many }) => ({
  province: one(provinces, {
    fields: [communes.provinceId],
    references: [provinces.id],
  }),
  quartiers: many(quartiers),
}))

export const zonesRelations = relations(zones, ({ one, many }) => ({
  commune: one(communes, {
    fields: [zones.communeId],
    references: [communes.id],
  }),
  quartiers: many(quartiers),
}))

export const quartiersRelations = relations(quartiers, ({ one, many }) => ({
  zone: one(zones, {
    fields: [quartiers.zoneId],
    references: [zones.id],
  }),
  patients: many(patients),
}))

export const departmentsRelations = relations(departments, ({ many }) => ({
  specialties: many(specialties),
}))

export const specialtiesRelations = relations(specialties, ({ one, many }) => ({
  department: one(departments, {
    fields: [specialties.departmentId],
    references: [departments.id],
  }),
  medicalActs: many(medicalActs),
}))

export const insurancesRelations = relations(insurances, ({ many }) => ({
  patients: many(patients),
  patientInsurances: many(patientInsurances),
  claims: many(insuranceClaims),
  payments: many(insurancePayments),
  rules: many(insuranceServiceRules),
}))

export const patientsRelations = relations(patients, ({ one, many }) => ({
  quartier: one(quartiers, {
    fields: [patients.quartierId],
    references: [quartiers.id],
  }),

  insurance: one(insurances, {
    fields: [patients.insuranceId],
    references: [insurances.id],
  }),
  insurances: many(patientInsurances),
  invoices: many(invoices),
  payments: many(payments),
  claims: many(insuranceClaims),
  corporateEmployee: one(corporateEmployees, {
    fields: [patients.corporateEmployeeId],
    references: [corporateEmployees.id],
  }),
}))

export const servicesRelations = relations(services, ({ many }) => ({
  medicalActs: many(medicalActs),
  rules: many(insuranceServiceRules),
}))

export const insuranceBatchesRelations = relations(insuranceBatches, ({ one, many }) => ({
  insurance: one(insurances, {
    fields: [insuranceBatches.insuranceId],
    references: [insurances.id],
  }),
  claims: many(insuranceClaims),
  payments: many(insurancePayments),
}))

export const insuranceClaimsRelations = relations(insuranceClaims, ({ one, many }) => ({
  batch: one(insuranceBatches, {
    fields: [insuranceClaims.batchId],
    references: [insuranceBatches.id],
  }),
  insurance: one(insurances, {
    fields: [insuranceClaims.insuranceId],
    references: [insurances.id],
  }),
  patient: one(patients, {
    fields: [insuranceClaims.patientId],
    references: [patients.id],
  }),
  invoice: one(invoices, {
    fields: [insuranceClaims.invoiceId],
    references: [invoices.id],
  }),
  payments: many(insurancePayments),
}))

export const insurancePaymentsRelations = relations(insurancePayments, ({ one }) => ({
  insurance: one(insurances, {
    fields: [insurancePayments.insuranceId],
    references: [insurances.id],
  }),
  batch: one(insuranceBatches, {
    fields: [insurancePayments.batchId],
    references: [insuranceBatches.id],
  }),
  claim: one(insuranceClaims, {
    fields: [insurancePayments.claimId],
    references: [insuranceClaims.id],
  }),
}))

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  patient: one(patients, {
    fields: [invoices.patientId],
    references: [patients.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
  claims: many(insuranceClaims),
}))

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  medicalAct: one(medicalActs, {
    fields: [invoiceItems.medicalActId],
    references: [medicalActs.id],
  }),
}))

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  patient: one(patients, {
    fields: [payments.patientId],
    references: [patients.id],
  }),
  cashSession: one(cashSessions, {
    fields: [payments.cashSessionId],
    references: [cashSessions.id],
  }),
}))

export const cashRegisterRelations = relations(cashRegister, ({ many }) => ({
  sessions: many(cashSessions),
}))

export const cashSessionsRelations = relations(cashSessions, ({ one, many }) => ({
  cashRegister: one(cashRegister, {
    fields: [cashSessions.cashRegisterId],
    references: [cashRegister.id],
  }),
  payments: many(payments),
}))

export const expensesRelations = relations(expenses, ({ one }) => ({
  cashSession: one(cashSessions, {
    fields: [expenses.cashSessionId],
    references: [cashSessions.id],
  }),
}))

export const accountingJournalRelations = relations(accountingJournal, ({ }) => ({}))

export const usersRelations = relations(users, ({ one, many }) => ({
  sessions: many(sessions),
  specialty: one(specialties, {
    fields: [users.specialtyId],
    references: [specialties.id],
  }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

export const patientInsurancesRelations = relations(patientInsurances, ({ one }) => ({
  patient: one(patients, {
    fields: [patientInsurances.patientId],
    references: [patients.id],
  }),
  insurance: one(insurances, {
    fields: [patientInsurances.insuranceId],
    references: [insurances.id],
  }),
}))

export const insuranceServiceRulesRelations = relations(insuranceServiceRules, ({ one }) => ({
  insurance: one(insurances, {
    fields: [insuranceServiceRules.insuranceId],
    references: [insurances.id],
  }),
  service: one(services, {
    fields: [insuranceServiceRules.serviceId],
    references: [services.id],
  }),
}))

export const pharmacySalesRelations = relations(pharmacySales, ({ many }) => ({
  items: many(pharmacySaleItems),
}))

export const pharmacySaleItemsRelations = relations(pharmacySaleItems, ({ one }) => ({
  sale: one(pharmacySales, {
    fields: [pharmacySaleItems.saleId],
    references: [pharmacySales.id],
  }),
  medicine: one(medicines, {
    fields: [pharmacySaleItems.medicineId],
    references: [medicines.id],
  }),
  lot: one(medicineLots, {
    fields: [pharmacySaleItems.lotId],
    references: [medicineLots.id],
  }),
}))

export const medicinesRelations = relations(medicines, ({ one, many }) => ({
  category: one(medicineCategories, {
    fields: [medicines.categoryId],
    references: [medicineCategories.id],
  }),
  lots: many(medicineLots),
  sales: many(pharmacySaleItems),
  movements: many(stockMovements),
}))

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  medicine: one(medicines, {
    fields: [stockMovements.medicineId],
    references: [medicines.id],
  }),
}))

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchaseOrders: many(purchaseOrders),
}))

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id],
  }),
  items: many(purchaseOrderItems),
}))

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one, many }) => ({
  order: one(purchaseOrders, {
    fields: [purchaseOrderItems.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  medicine: one(medicines, {
    fields: [purchaseOrderItems.medicineId],
    references: [medicines.id],
  }),
  lots: many(medicineLots),
}))

export const medicineLotsRelations = relations(medicineLots, ({ one, many }) => ({
  medicine: one(medicines, {
    fields: [medicineLots.medicineId],
    references: [medicines.id],
  }),
  saleItems: many(pharmacySaleItems),
}))

export const corporatePartnersRelations = relations(corporatePartners, ({ many }) => ({
  employees: many(corporateEmployees),
  agreements: many(partnershipAgreements),
  serviceRules: many(partnershipServiceRules),
  visitLogs: many(partnershipVisitLogs),
}))

export const corporateEmployeesRelations = relations(corporateEmployees, ({ one, many }) => ({
  partner: one(corporatePartners, {
    fields: [corporateEmployees.partnerId],
    references: [corporatePartners.id],
  }),
  patient: one(patients, {
    fields: [corporateEmployees.patientId],
    references: [patients.id],
  }),
  visitLogs: many(partnershipVisitLogs),
}))

export const partnershipAgreementsRelations = relations(partnershipAgreements, ({ one, many }) => ({
  partner: one(corporatePartners, {
    fields: [partnershipAgreements.partnerId],
    references: [corporatePartners.id],
  }),
  serviceRules: many(partnershipServiceRules),
}))

export const partnershipServiceRulesRelations = relations(partnershipServiceRules, ({ one }) => ({
  partner: one(corporatePartners, {
    fields: [partnershipServiceRules.partnerId],
    references: [corporatePartners.id],
  }),
  agreement: one(partnershipAgreements, {
    fields: [partnershipServiceRules.agreementId],
    references: [partnershipAgreements.id],
  }),
  service: one(services, {
    fields: [partnershipServiceRules.serviceId],
    references: [services.id],
  }),
  medicalAct: one(medicalActs, {
    fields: [partnershipServiceRules.medicalActId],
    references: [medicalActs.id],
  }),
  specialty: one(specialties, {
    fields: [partnershipServiceRules.specialtyId],
    references: [specialties.id],
  }),
}))

export const partnershipVisitLogsRelations = relations(partnershipVisitLogs, ({ one }) => ({
  partner: one(corporatePartners, {
    fields: [partnershipVisitLogs.partnerId],
    references: [corporatePartners.id],
  }),
  employee: one(corporateEmployees, {
    fields: [partnershipVisitLogs.employeeId],
    references: [corporateEmployees.id],
  }),
  visit: one(visits, {
    fields: [partnershipVisitLogs.visitId],
    references: [visits.id],
  }),
  invoice: one(invoices, {
    fields: [partnershipVisitLogs.invoiceId],
    references: [invoices.id],
  }),
}))

export const partnershipDiscountHistoryRelations = relations(partnershipDiscountHistory, ({ one }) => ({
  partner: one(corporatePartners, {
    fields: [partnershipDiscountHistory.partnerId],
    references: [corporatePartners.id],
  }),
  invoiceItem: one(invoiceItems, {
    fields: [partnershipDiscountHistory.invoiceItemId],
    references: [invoiceItems.id],
  }),
  rule: one(partnershipServiceRules, {
    fields: [partnershipDiscountHistory.ruleId],
    references: [partnershipServiceRules.id],
  }),
}))

export const visitsRelations = relations(visits, ({ one, many }) => ({
  patient: one(patients, {
    fields: [visits.patientId],
    references: [patients.id],
  }),
  doctor: one(users, {
    fields: [visits.doctorId],
    references: [users.id],
  }),
  appointment: one(appointments, {
    fields: [visits.appointmentId],
    references: [appointments.id],
  }),
  triage: many(triage),
  diagnoses: many(diagnoses),
  prescriptions: many(prescriptions),
  medicalDecisions: many(medicalDecisions),
  examRequests: many(examRequests),
  hospitalizations: many(hospitalizations),
}))

export const triageRelations = relations(triage, ({ one }) => ({
  visit: one(visits, {
    fields: [triage.visitId],
    references: [visits.id],
  }),
}))

export const diagnosesRelations = relations(diagnoses, ({ one }) => ({
  visit: one(visits, {
    fields: [diagnoses.visitId],
    references: [visits.id],
  }),
}))

export const prescriptionsRelations = relations(prescriptions, ({ one, many }) => ({
  visit: one(visits, {
    fields: [prescriptions.visitId],
    references: [visits.id],
  }),
  doctor: one(users, {
    fields: [prescriptions.doctorId],
    references: [users.id],
  }),
  items: many(prescriptionItems),
}))

export const prescriptionItemsRelations = relations(prescriptionItems, ({ one }) => ({
  prescription: one(prescriptions, {
    fields: [prescriptionItems.prescriptionId],
    references: [prescriptions.id],
  }),
}))

export const medicalDecisionsRelations = relations(medicalDecisions, ({ one }) => ({
  visit: one(visits, {
    fields: [medicalDecisions.visitId],
    references: [visits.id],
  }),
  specialist: one(users, {
    fields: [medicalDecisions.specialistId],
    references: [users.id],
  }),
}))

export const examRequestsRelations = relations(examRequests, ({ one, many }) => ({
  visit: one(visits, {
    fields: [examRequests.visitId],
    references: [visits.id],
  }),
  doctor: one(users, {
    fields: [examRequests.requestedBy],
    references: [users.id],
  }),
  results: many(examResults),
}))

export const examResultsRelations = relations(examResults, ({ one }) => ({
  examRequest: one(examRequests, {
    fields: [examResults.examRequestId],
    references: [examRequests.id],
  }),
  validator: one(users, {
    fields: [examResults.validatedBy],
    references: [users.id],
  }),
}))

// ============================================================
// LAB RELATIONS
// ============================================================

export const labTestsRelations = relations(labTests, ({ one, many }) => ({
  service: one(services, {
    fields: [labTests.serviceId],
    references: [services.id],
  }),
  parameters: many(labTestParameters),
  orders: many(labOrders),
}))

export const labTestParametersRelations = relations(labTestParameters, ({ one, many }) => ({
  labTest: one(labTests, {
    fields: [labTestParameters.labTestId],
    references: [labTests.id],
  }),
  resultValues: many(labResultValues),
}))

export const labOrdersRelations = relations(labOrders, ({ one, many }) => ({
  visit: one(visits, {
    fields: [labOrders.visitId],
    references: [visits.id],
  }),
  examRequest: one(examRequests, {
    fields: [labOrders.examRequestId],
    references: [examRequests.id],
  }),
  labTest: one(labTests, {
    fields: [labOrders.labTestId],
    references: [labTests.id],
  }),
  patient: one(patients, {
    fields: [labOrders.patientId],
    references: [patients.id],
  }),
  orderer: one(users, {
    fields: [labOrders.orderedBy],
    references: [users.id],
  }),
  sampler: one(users, {
    fields: [labOrders.sampledBy],
    references: [users.id],
  }),
  result: one(labResults, {
    fields: [labOrders.id],
    references: [labResults.labOrderId],
  }),
}))

export const labResultsRelations = relations(labResults, ({ one, many }) => ({
  labOrder: one(labOrders, {
    fields: [labResults.labOrderId],
    references: [labOrders.id],
  }),
  recordedByUser: one(users, {
    fields: [labResults.recordedBy],
    references: [users.id],
  }),
  verifier: one(users, {
    fields: [labResults.verifiedBy],
    references: [users.id],
  }),
  values: many(labResultValues),
}))

export const labResultValuesRelations = relations(labResultValues, ({ one }) => ({
  labResult: one(labResults, {
    fields: [labResultValues.labResultId],
    references: [labResults.id],
  }),
  parameter: one(labTestParameters, {
    fields: [labResultValues.labTestParameterId],
    references: [labTestParameters.id],
  }),
}))

export const wardsRelations = relations(wards, ({ one, many }) => ({
  department: one(departments, {
    fields: [wards.departmentId],
    references: [departments.id],
  }),
  beds: many(beds),
}))

export const bedsRelations = relations(beds, ({ one, many }) => ({
  ward: one(wards, {
    fields: [beds.wardId],
    references: [wards.id],
  }),
  dailyRateAct: one(medicalActs, {
    fields: [beds.dailyRateActId],
    references: [medicalActs.id],
  }),
  assignments: many(bedAssignments),
}))

export const bedAssignmentsRelations = relations(bedAssignments, ({ one }) => ({
  hospitalization: one(hospitalizations, {
    fields: [bedAssignments.hospitalizationId],
    references: [hospitalizations.id],
  }),
  bed: one(beds, {
    fields: [bedAssignments.bedId],
    references: [beds.id],
  }),
  assignedByUser: one(users, {
    fields: [bedAssignments.assignedBy],
    references: [users.id],
  }),
}))

// extend your existing hospitalizationsRelations with:
export const hospitalizationsRelations = relations(hospitalizations, ({ one, many }) => ({
  visit: one(visits, { fields: [hospitalizations.visitId], references: [visits.id] }),
  patient: one(patients, { fields: [hospitalizations.patientId], references: [patients.id] }),
  department: one(departments, { fields: [hospitalizations.departmentId], references: [departments.id] }),
  doctor: one(users, { fields: [hospitalizations.doctorId], references: [users.id] }),
  service: one(services, { fields: [hospitalizations.serviceId], references: [services.id] }),
  bedAssignments: many(bedAssignments),
}))


// export const hospitalizationsRelations = relations(hospitalizations, ({ one }) => ({
//   visit: one(visits, {
//     fields: [hospitalizations.visitId],
//     references: [visits.id],
//   }),
//   patient: one(patients, {
//     fields: [hospitalizations.patientId],
//     references: [patients.id],
//   }),
//   department: one(departments, {
//     fields: [hospitalizations.departmentId],
//     references: [departments.id],
//   }),
//   doctor: one(users, {
//     fields: [hospitalizations.doctorId],
//     references: [users.id],
//   }),
// }))
