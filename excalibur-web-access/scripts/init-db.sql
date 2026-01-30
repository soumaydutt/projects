-- Initial database setup for Excalibur Web Access
-- Run this script to create all tables

-- Connect to the excalibur_db database
\c excalibur_db

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create schema
CREATE SCHEMA IF NOT EXISTS excalibur;
GRANT ALL PRIVILEGES ON SCHEMA excalibur TO excalibur;

-- Set search_path to include public (for uuid-ossp extension)
SET search_path TO excalibur, public;

-- =============================================
-- Users Table
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(256) NOT NULL UNIQUE,
    password_hash VARCHAR(512) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role INTEGER NOT NULL DEFAULT 3,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    row_version BYTEA
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =============================================
-- Accounts Table
-- =============================================
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_number VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    account_type INTEGER NOT NULL DEFAULT 1,
    status INTEGER NOT NULL DEFAULT 4,
    primary_email VARCHAR(256) NOT NULL,
    primary_phone VARCHAR(20),
    secondary_email VARCHAR(256),
    secondary_phone VARCHAR(20),
    address_line1 VARCHAR(200) NOT NULL,
    address_line2 VARCHAR(200),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) NOT NULL DEFAULT 'US',
    company_name VARCHAR(200),
    tax_id VARCHAR(50),
    kyc_verified BOOLEAN NOT NULL DEFAULT FALSE,
    kyc_verified_at TIMESTAMP,
    kyc_document_type VARCHAR(50),
    kyc_document_number VARCHAR(100),
    credit_limit DECIMAL(18,2) NOT NULL DEFAULT 0,
    current_balance DECIMAL(18,2) NOT NULL DEFAULT 0,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
    billing_day INTEGER NOT NULL DEFAULT 1,
    auto_pay BOOLEAN NOT NULL DEFAULT FALSE,
    default_payment_method_id VARCHAR(100),
    tags TEXT,
    last_collection_action VARCHAR(50),
    last_collection_date TIMESTAMP,
    next_follow_up_date TIMESTAMP,
    collection_assignee VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    row_version BYTEA
);

CREATE INDEX idx_accounts_account_number ON accounts(account_number);
CREATE INDEX idx_accounts_name ON accounts(name);
CREATE INDEX idx_accounts_status ON accounts(status);
CREATE INDEX idx_accounts_email ON accounts(primary_email);

-- =============================================
-- Subscribers Table
-- =============================================
CREATE TABLE IF NOT EXISTS subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id),
    subscriber_number VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(256),
    phone VARCHAR(20),
    status INTEGER NOT NULL DEFAULT 1,
    activation_date TIMESTAMP,
    termination_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    row_version BYTEA
);

CREATE INDEX idx_subscribers_account_id ON subscribers(account_id);
CREATE INDEX idx_subscribers_number ON subscribers(subscriber_number);

-- =============================================
-- Price Plans Table
-- =============================================
CREATE TABLE IF NOT EXISTS price_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    service_type INTEGER NOT NULL,
    monthly_fee DECIMAL(18,2) NOT NULL,
    setup_fee DECIMAL(18,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    effective_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    features JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    row_version BYTEA
);

CREATE INDEX idx_price_plans_code ON price_plans(code);
CREATE INDEX idx_price_plans_service_type ON price_plans(service_type);

-- =============================================
-- Services Table
-- =============================================
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscriber_id UUID NOT NULL REFERENCES subscribers(id),
    price_plan_id UUID REFERENCES price_plans(id),
    service_number VARCHAR(50) NOT NULL,
    service_type INTEGER NOT NULL,
    status INTEGER NOT NULL DEFAULT 1,
    activation_date TIMESTAMP,
    termination_date TIMESTAMP,
    monthly_recurring_charge DECIMAL(18,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    row_version BYTEA
);

CREATE INDEX idx_services_subscriber_id ON services(subscriber_id);
CREATE INDEX idx_services_status ON services(status);

-- =============================================
-- Invoices Table
-- =============================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    account_id UUID NOT NULL REFERENCES accounts(id),
    status INTEGER NOT NULL DEFAULT 1,
    billing_period_start TIMESTAMP NOT NULL,
    billing_period_end TIMESTAMP NOT NULL,
    issue_date TIMESTAMP NOT NULL,
    due_date TIMESTAMP NOT NULL,
    sub_total DECIMAL(18,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
    paid_at TIMESTAMP,
    overdue_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    row_version BYTEA
);

CREATE INDEX idx_invoices_account_id ON invoices(account_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- =============================================
-- Invoice Line Items Table
-- =============================================
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    service_id UUID REFERENCES services(id),
    description VARCHAR(500) NOT NULL,
    charge_type INTEGER NOT NULL,
    quantity DECIMAL(18,4) NOT NULL DEFAULT 1,
    unit_price DECIMAL(18,4) NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    tax_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    service_code VARCHAR(50),
    period_start TIMESTAMP,
    period_end TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    row_version BYTEA
);

CREATE INDEX idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);

-- =============================================
-- Payments Table
-- =============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id),
    payment_number VARCHAR(50) NOT NULL UNIQUE,
    amount DECIMAL(18,2) NOT NULL,
    method INTEGER NOT NULL,
    status INTEGER NOT NULL DEFAULT 1,
    payment_date TIMESTAMP NOT NULL,
    reference VARCHAR(100),
    check_number VARCHAR(50),
    card_last_four VARCHAR(4),
    transaction_id VARCHAR(100),
    notes TEXT,
    processed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    row_version BYTEA
);

CREATE INDEX idx_payments_account_id ON payments(account_id);
CREATE INDEX idx_payments_number ON payments(payment_number);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- =============================================
-- Payment Allocations Table
-- =============================================
CREATE TABLE IF NOT EXISTS payment_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    amount DECIMAL(18,2) NOT NULL,
    allocated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    row_version BYTEA
);

CREATE INDEX idx_payment_allocations_payment_id ON payment_allocations(payment_id);
CREATE INDEX idx_payment_allocations_invoice_id ON payment_allocations(invoice_id);

-- =============================================
-- AR Ledger Entries Table
-- =============================================
CREATE TABLE IF NOT EXISTS ar_ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id),
    entry_type INTEGER NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    balance_after DECIMAL(18,2) NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    description VARCHAR(500),
    entry_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    row_version BYTEA
);

CREATE INDEX idx_ar_ledger_account_id ON ar_ledger_entries(account_id);
CREATE INDEX idx_ar_ledger_entry_date ON ar_ledger_entries(entry_date);

-- =============================================
-- Collection Cases Table
-- =============================================
CREATE TABLE IF NOT EXISTS collection_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id),
    assigned_to_id UUID REFERENCES users(id),
    status INTEGER NOT NULL DEFAULT 1,
    priority INTEGER NOT NULL DEFAULT 2,
    total_amount_due DECIMAL(18,2) NOT NULL,
    oldest_invoice_date TIMESTAMP,
    last_contact_date TIMESTAMP,
    next_follow_up_date TIMESTAMP,
    promise_to_pay_date TIMESTAMP,
    promise_to_pay_amount DECIMAL(18,2),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    row_version BYTEA
);

CREATE INDEX idx_collection_cases_account_id ON collection_cases(account_id);
CREATE INDEX idx_collection_cases_status ON collection_cases(status);
CREATE INDEX idx_collection_cases_assigned_to ON collection_cases(assigned_to_id);

-- =============================================
-- Collection Case Notes Table
-- =============================================
CREATE TABLE IF NOT EXISTS collection_case_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_case_id UUID NOT NULL REFERENCES collection_cases(id),
    created_by_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    contact_type INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    row_version BYTEA
);

CREATE INDEX idx_collection_notes_case_id ON collection_case_notes(collection_case_id);

-- =============================================
-- Collection Case Activities Table
-- =============================================
CREATE TABLE IF NOT EXISTS collection_case_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_case_id UUID NOT NULL REFERENCES collection_cases(id),
    performed_by_id UUID NOT NULL REFERENCES users(id),
    activity_type INTEGER NOT NULL,
    description VARCHAR(500),
    performed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    row_version BYTEA
);

CREATE INDEX idx_collection_activities_case_id ON collection_case_activities(collection_case_id);

-- =============================================
-- Collection Actions Table
-- =============================================
CREATE TABLE IF NOT EXISTS collection_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id),
    action_type INTEGER NOT NULL,
    notes TEXT NOT NULL,
    follow_up_date TIMESTAMP,
    promised_amount DECIMAL(18,2),
    promised_date TIMESTAMP,
    contact_method VARCHAR(50),
    contacted_person VARCHAR(100),
    performed_by VARCHAR(100) NOT NULL,
    performed_at TIMESTAMP NOT NULL,
    promise_kept BOOLEAN,
    promise_evaluated_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    row_version BYTEA
);

CREATE INDEX idx_collection_actions_account_id ON collection_actions(account_id);

-- =============================================
-- Switch Actions Table
-- =============================================
CREATE TABLE IF NOT EXISTS switch_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id),
    action_type INTEGER NOT NULL,
    status INTEGER NOT NULL DEFAULT 1,
    requested_by_id UUID REFERENCES users(id),
    approved_by_id UUID REFERENCES users(id),
    scheduled_at TIMESTAMP,
    executed_at TIMESTAMP,
    result_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    row_version BYTEA
);

CREATE INDEX idx_switch_actions_service_id ON switch_actions(service_id);
CREATE INDEX idx_switch_actions_status ON switch_actions(status);

-- =============================================
-- Audit Logs Table
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    description TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    row_version BYTEA
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- =============================================
-- Usage Records Table
-- =============================================
CREATE TABLE IF NOT EXISTS usage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id),
    usage_type VARCHAR(50) NOT NULL,
    quantity DECIMAL(18,4) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    rate DECIMAL(18,6),
    amount DECIMAL(18,2),
    usage_date TIMESTAMP NOT NULL,
    billed BOOLEAN NOT NULL DEFAULT FALSE,
    invoice_id UUID REFERENCES invoices(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    row_version BYTEA
);

CREATE INDEX idx_usage_records_service_id ON usage_records(service_id);
CREATE INDEX idx_usage_records_date ON usage_records(usage_date);

-- =============================================
-- Account Notes Table
-- =============================================
CREATE TABLE IF NOT EXISTS account_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id),
    created_by_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    note_type VARCHAR(50),
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    row_version BYTEA
);

CREATE INDEX idx_account_notes_account_id ON account_notes(account_id);

-- =============================================
-- Account Attachments Table
-- =============================================
CREATE TABLE IF NOT EXISTS account_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id),
    uploaded_by_id UUID REFERENCES users(id),
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    storage_path VARCHAR(500) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    row_version BYTEA
);

CREATE INDEX idx_account_attachments_account_id ON account_attachments(account_id);

-- =============================================
-- Service Plan History Table
-- =============================================
CREATE TABLE IF NOT EXISTS service_plan_histories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id),
    old_plan_id UUID REFERENCES price_plans(id),
    new_plan_id UUID NOT NULL REFERENCES price_plans(id),
    changed_by_id UUID REFERENCES users(id),
    change_reason VARCHAR(500),
    effective_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    row_version BYTEA
);

CREATE INDEX idx_service_plan_history_service_id ON service_plan_histories(service_id);

-- =============================================
-- Form Rules Table
-- =============================================
CREATE TABLE IF NOT EXISTS form_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    rule_config JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    priority INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    row_version BYTEA
);

CREATE INDEX idx_form_rules_entity ON form_rules(entity_type);

-- =============================================
-- Seed Data
-- =============================================

-- Insert default admin user (password: Admin@123)
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'admin@excalibur.local',
    '$2a$11$rBNhfgDOpHPVqN5B4tXxO.ZkPq0t0Y.YjPqH7i6U1iXj3K4U1JO6O',
    'System',
    'Administrator',
    1,
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Insert sample users
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
VALUES
    ('billing@excalibur.local', '$2a$11$rBNhfgDOpHPVqN5B4tXxO.ZkPq0t0Y.YjPqH7i6U1iXj3K4U1JO6O', 'Jane', 'Billing', 2, TRUE),
    ('care@excalibur.local', '$2a$11$rBNhfgDOpHPVqN5B4tXxO.ZkPq0t0Y.YjPqH7i6U1iXj3K4U1JO6O', 'John', 'Care', 3, TRUE),
    ('collector@excalibur.local', '$2a$11$rBNhfgDOpHPVqN5B4tXxO.ZkPq0t0Y.YjPqH7i6U1iXj3K4U1JO6O', 'Bob', 'Collector', 4, TRUE)
ON CONFLICT (email) DO NOTHING;

-- Insert sample price plans
INSERT INTO price_plans (code, name, description, service_type, monthly_fee, setup_fee, effective_date, features)
VALUES
    ('MOBILE-BASIC', 'Mobile Basic', 'Basic mobile plan with 5GB data', 1, 29.99, 0, CURRENT_TIMESTAMP, '{"data_gb": 5, "minutes": 500, "sms": 500}'),
    ('MOBILE-PREMIUM', 'Mobile Premium', 'Premium mobile plan with unlimited data', 1, 59.99, 0, CURRENT_TIMESTAMP, '{"data_gb": -1, "minutes": -1, "sms": -1}'),
    ('BROADBAND-50', 'Broadband 50Mbps', '50 Mbps broadband connection', 2, 49.99, 49.99, CURRENT_TIMESTAMP, '{"speed_mbps": 50, "data_cap_gb": 500}'),
    ('BROADBAND-100', 'Broadband 100Mbps', '100 Mbps broadband connection', 2, 79.99, 49.99, CURRENT_TIMESTAMP, '{"speed_mbps": 100, "data_cap_gb": -1}'),
    ('IPTV-BASIC', 'IPTV Basic', 'Basic TV package with 100 channels', 3, 24.99, 0, CURRENT_TIMESTAMP, '{"channels": 100, "hd": false}'),
    ('IPTV-PREMIUM', 'IPTV Premium', 'Premium TV with 300 HD channels', 3, 54.99, 0, CURRENT_TIMESTAMP, '{"channels": 300, "hd": true}')
ON CONFLICT (code) DO NOTHING;

-- Insert sample accounts
INSERT INTO accounts (account_number, name, account_type, status, primary_email, primary_phone, address_line1, city, state, postal_code, credit_limit, current_balance)
VALUES
    ('ACC-20240101-DEMO0001', 'Acme Corporation', 2, 1, 'billing@acme.com', '555-0100', '123 Business Ave', 'New York', 'NY', '10001', 10000, 1250.50),
    ('ACC-20240101-DEMO0002', 'John Smith', 1, 1, 'john.smith@email.com', '555-0101', '456 Residential St', 'Los Angeles', 'CA', '90001', 500, 89.99),
    ('ACC-20240101-DEMO0003', 'Tech Startup Inc', 2, 1, 'accounts@techstartup.io', '555-0102', '789 Innovation Blvd', 'San Francisco', 'CA', '94102', 5000, 2340.00),
    ('ACC-20240101-DEMO0004', 'Sarah Johnson', 1, 2, 'sarah.j@email.com', '555-0103', '321 Oak Lane', 'Chicago', 'IL', '60601', 500, 450.00),
    ('ACC-20240101-DEMO0005', 'Global Enterprises', 2, 1, 'ar@globalent.com', '555-0104', '555 Corporate Plaza', 'Houston', 'TX', '77001', 25000, 8750.25)
ON CONFLICT (account_number) DO NOTHING;

COMMIT;
