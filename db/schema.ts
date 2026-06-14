import {
  pgTable,
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
export const doctors = pgTable(
  'doctors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    specialtyId: uuid('specialty_id')
      .notNull()
      .references(() => specialties.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    phone: varchar('phone', { length: 20 }).notNull().unique(),
    email: varchar('email', { length: 255 }).unique(),
    licenseNumber: varchar('license_number', { length: 100 }).unique(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    specialtyIdIdx: index('doctors_specialty_id_idx').on(table.specialtyId),
    phoneIdx: index('doctors_phone_idx').on(table.phone),
    isActiveIdx: index('doctors_is_active_idx').on(table.isActive),
  })
)

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
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    usernameIdx: index('users_username_idx').on(table.username),
    roleIdx: index('users_role_idx').on(table.role),
    isActiveIdx: index('users_is_active_idx').on(table.isActive),
  })
)

// ============================================================
// MENU PERMISSIONS TABLE
// ============================================================
export const menuPermissions = pgTable(
  'menu_permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    group: varchar('group', { length: 255 }).notNull().unique(), // e.g. "Clinical"
    roles: text('roles').notNull().default('*'), // Stores "admin,user" or "*"
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    groupIdx: index('menu_permissions_group_idx').on(table.group),
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
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    invoiceIdIdx: index('payments_invoice_id_idx').on(table.invoiceId),
    patientIdIdx: index('payments_patient_id_idx').on(table.patientId),
    paymentMethodIdx: index('payments_payment_method_idx').on(table.paymentMethod),
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
      .references(() => doctors.id, { onDelete: 'restrict' }),

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
      .references(() => doctors.id),

    appointmentId: uuid('appointment_id')
      .references(() => appointments.id),

    visitDate: timestamp('visit_date').notNull().defaultNow(),

    chiefComplaint: text('chief_complaint'),
    notes: text('notes'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    patientIdx: index('visits_patient_idx').on(table.patientId),
    doctorIdx: index('visits_doctor_idx').on(table.doctorId),
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
    weight: decimal('weight', { precision: 5, scale: 2 }),
    height: decimal('height', { precision: 5, scale: 2 }),

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

    diagnosisCode: varchar('diagnosis_code', { length: 50 }),
    diagnosisName: varchar('diagnosis_name', { length: 255 }),

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
      .references(() => doctors.id),

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
  doctors: many(doctors),
  medicalActs: many(medicalActs),
}))

export const doctorsRelations = relations(doctors, ({ one }) => ({
  specialty: one(specialties, {
    fields: [doctors.specialtyId],
    references: [specialties.id],
  }),
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
}))

export const cashRegisterRelations = relations(cashRegister, ({ many }) => ({
  sessions: many(cashSessions),
}))

export const cashSessionsRelations = relations(cashSessions, ({ one }) => ({
  cashRegister: one(cashRegister, {
    fields: [cashSessions.cashRegisterId],
    references: [cashRegister.id],
  }),
}))

export const expensesRelations = relations(expenses, ({ one }) => ({
  cashSession: one(cashSessions, {
    fields: [expenses.cashSessionId],
    references: [cashSessions.id],
  }),
}))

export const accountingJournalRelations = relations(accountingJournal, ({ }) => ({}))

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
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
