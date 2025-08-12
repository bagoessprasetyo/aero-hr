-- Salary History and Change Tracking Schema Extensions
-- For comprehensive audit trail and compliance reporting

-- Salary Component History Table
-- Tracks all changes to salary components with full audit trail
CREATE TABLE salary_component_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    salary_component_id UUID REFERENCES salary_components(id) ON DELETE SET NULL,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Change tracking
    action_type TEXT NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE', 'ACTIVATE', 'DEACTIVATE')),
    change_reason TEXT,
    change_notes TEXT,
    
    -- Previous and new values (stored as JSON for flexibility)
    previous_values JSONB,
    new_values JSONB,
    
    -- Component details (snapshot at time of change)
    component_name TEXT NOT NULL,
    component_type TEXT NOT NULL CHECK (component_type IN ('basic_salary', 'fixed_allowance')),
    previous_amount DECIMAL(15,2),
    new_amount DECIMAL(15,2),
    previous_status BOOLEAN,
    new_status BOOLEAN,
    
    -- Effective date vs change date
    effective_date DATE NOT NULL, -- When the change takes effect
    change_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- When the change was made
    
    -- Approval workflow
    approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'auto_approved')),
    approved_by TEXT, -- User who approved
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Metadata
    changed_by TEXT NOT NULL, -- User who made the change
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX(employee_id, change_date),
    INDEX(salary_component_id),
    INDEX(effective_date),
    INDEX(approval_status)
);

-- Employee Change Log Table
-- Tracks changes to employee profile data
CREATE TABLE employee_change_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Change tracking
    action_type TEXT NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'STATUS_CHANGE', 'PROFILE_UPDATE')),
    field_changed TEXT NOT NULL, -- Which field was changed
    previous_value TEXT,
    new_value TEXT,
    
    -- Change context
    change_reason TEXT,
    change_notes TEXT,
    
    -- Metadata
    changed_by TEXT NOT NULL,
    change_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX(employee_id, change_date),
    INDEX(field_changed)
);

-- Salary Change Summary Table
-- Aggregated view of salary changes for reporting
CREATE TABLE salary_change_summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Period information
    change_period_start DATE NOT NULL,
    change_period_end DATE NOT NULL,
    
    -- Salary comparison
    previous_gross_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
    new_gross_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
    salary_change_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    salary_change_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    
    -- Component breakdown
    basic_salary_change DECIMAL(15,2) DEFAULT 0,
    allowances_change DECIMAL(15,2) DEFAULT 0,
    
    -- Change metadata
    total_changes INTEGER NOT NULL DEFAULT 0,
    change_types TEXT[], -- Array of change types in this period
    
    -- Impact analysis
    annual_cost_impact DECIMAL(15,2) DEFAULT 0,
    bpjs_impact DECIMAL(15,2) DEFAULT 0,
    pph21_impact DECIMAL(15,2) DEFAULT 0,
    
    -- Audit trail
    summary_generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generated_by TEXT NOT NULL,
    
    -- Indexes
    INDEX(employee_id, change_period_start),
    INDEX(change_period_start, change_period_end),
    UNIQUE(employee_id, change_period_start, change_period_end)
);

-- Salary Review Schedule Table
-- Track periodic salary reviews and reminders
CREATE TABLE salary_review_schedule (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Review information
    review_type TEXT NOT NULL CHECK (review_type IN ('annual', 'probation_end', 'promotion', 'market_adjustment', 'performance')),
    scheduled_date DATE NOT NULL,
    review_status TEXT DEFAULT 'scheduled' CHECK (review_status IN ('scheduled', 'in_progress', 'completed', 'skipped')),
    
    -- Review details
    current_gross_salary DECIMAL(15,2),
    recommended_new_salary DECIMAL(15,2),
    review_notes TEXT,
    
    -- Approval workflow
    reviewer TEXT, -- Person assigned to review
    reviewed_by TEXT, -- Person who completed review
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX(employee_id, scheduled_date),
    INDEX(review_status, scheduled_date)
);

-- Bulk Salary Operations Log
-- Track bulk salary update operations
CREATE TABLE bulk_salary_operations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Operation details
    operation_type TEXT NOT NULL CHECK (operation_type IN ('mass_increase', 'department_adjustment', 'annual_review', 'promotion_batch', 'cost_of_living')),
    operation_name TEXT NOT NULL,
    operation_description TEXT,
    
    -- Scope
    affected_employees_count INTEGER NOT NULL DEFAULT 0,
    department_filter TEXT,
    position_filter TEXT,
    salary_range_filter JSONB, -- Min/max salary criteria
    
    -- Changes applied
    adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('percentage', 'fixed_amount', 'new_structure')),
    adjustment_value DECIMAL(15,2), -- Percentage or fixed amount
    
    -- Impact analysis
    total_cost_impact DECIMAL(15,2) DEFAULT 0,
    total_employees_affected INTEGER DEFAULT 0,
    
    -- Operation status
    operation_status TEXT DEFAULT 'draft' CHECK (operation_status IN ('draft', 'approved', 'executed', 'cancelled')),
    
    -- Approval workflow  
    created_by TEXT NOT NULL,
    approved_by TEXT,
    executed_by TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    executed_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    INDEX(operation_status, created_at),
    INDEX(created_by),
    INDEX(executed_at)
);

-- Bulk Operation Items (Detail records)
CREATE TABLE bulk_salary_operation_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bulk_operation_id UUID NOT NULL REFERENCES bulk_salary_operations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Before/after values
    previous_gross_salary DECIMAL(15,2) NOT NULL,
    new_gross_salary DECIMAL(15,2) NOT NULL,
    salary_change_amount DECIMAL(15,2) NOT NULL,
    
    -- Component-level changes
    component_changes JSONB, -- Detailed breakdown of component changes
    
    -- Individual status
    item_status TEXT DEFAULT 'pending' CHECK (item_status IN ('pending', 'applied', 'failed', 'skipped')),
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    applied_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    INDEX(bulk_operation_id, employee_id),
    INDEX(item_status)
);

-- Compliance Audit Log
-- Track all compliance-related activities and exports
CREATE TABLE compliance_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Audit activity
    audit_type TEXT NOT NULL CHECK (audit_type IN ('salary_export', 'pph21_report', 'bpjs_report', 'government_inquiry', 'internal_audit')),
    audit_description TEXT NOT NULL,
    
    -- Scope of audit
    period_start DATE,
    period_end DATE,
    employee_ids UUID[], -- Array of employee IDs included
    departments TEXT[], -- Departments included
    
    -- Audit results
    total_employees_audited INTEGER DEFAULT 0,
    total_salary_components_reviewed INTEGER DEFAULT 0,
    issues_found INTEGER DEFAULT 0,
    audit_findings JSONB, -- Detailed findings
    
    -- Export information (if applicable)
    export_format TEXT, -- 'pdf', 'excel', 'csv', etc.
    export_file_path TEXT,
    export_file_size BIGINT,
    
    -- Metadata
    requested_by TEXT NOT NULL,
    generated_by TEXT NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX(audit_type, generated_at),
    INDEX(period_start, period_end),
    INDEX(requested_by)
);

-- Create triggers for automatic change tracking
-- Trigger for salary_components table
CREATE OR REPLACE FUNCTION log_salary_component_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO salary_component_history (
            salary_component_id, employee_id, action_type,
            component_name, component_type, new_amount, new_status,
            new_values, effective_date, changed_by, approval_status
        ) VALUES (
            NEW.id, NEW.employee_id, 'CREATE',
            NEW.component_name, NEW.component_type, NEW.amount, NEW.is_active,
            row_to_json(NEW), CURRENT_DATE, 'system', 'auto_approved'
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO salary_component_history (
            salary_component_id, employee_id, action_type,
            component_name, component_type,
            previous_amount, new_amount,
            previous_status, new_status,
            previous_values, new_values,
            effective_date, changed_by, approval_status
        ) VALUES (
            NEW.id, NEW.employee_id, 'UPDATE',
            NEW.component_name, NEW.component_type,
            OLD.amount, NEW.amount,
            OLD.is_active, NEW.is_active,
            row_to_json(OLD), row_to_json(NEW),
            CURRENT_DATE, 'system', 'auto_approved'
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO salary_component_history (
            salary_component_id, employee_id, action_type,
            component_name, component_type, previous_amount, previous_status,
            previous_values, effective_date, changed_by, approval_status
        ) VALUES (
            OLD.id, OLD.employee_id, 'DELETE',
            OLD.component_name, OLD.component_type, OLD.amount, OLD.is_active,
            row_to_json(OLD), CURRENT_DATE, 'system', 'auto_approved'
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER salary_component_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON salary_components
    FOR EACH ROW EXECUTE FUNCTION log_salary_component_changes();

-- Create indexes for optimal query performance
CREATE INDEX CONCURRENTLY idx_salary_history_employee_date ON salary_component_history(employee_id, change_date DESC);
CREATE INDEX CONCURRENTLY idx_salary_history_effective_date ON salary_component_history(effective_date);
CREATE INDEX CONCURRENTLY idx_salary_history_approval ON salary_component_history(approval_status) WHERE approval_status != 'auto_approved';
CREATE INDEX CONCURRENTLY idx_employee_changes_date ON employee_change_log(employee_id, change_date DESC);

-- Create views for common queries
CREATE VIEW employee_salary_timeline AS
SELECT 
    h.employee_id,
    e.full_name,
    h.component_name,
    h.component_type,
    h.action_type,
    h.previous_amount,
    h.new_amount,
    (h.new_amount - COALESCE(h.previous_amount, 0)) AS change_amount,
    CASE 
        WHEN h.previous_amount IS NOT NULL AND h.previous_amount > 0 
        THEN ((h.new_amount - h.previous_amount) / h.previous_amount * 100)
        ELSE NULL 
    END AS change_percentage,
    h.effective_date,
    h.change_date,
    h.changed_by,
    h.change_reason,
    h.approval_status
FROM salary_component_history h
JOIN employees e ON h.employee_id = e.id
ORDER BY h.employee_id, h.change_date DESC;

CREATE VIEW current_vs_previous_salary AS
WITH current_salary AS (
    SELECT 
        employee_id,
        SUM(CASE WHEN component_type = 'basic_salary' AND is_active THEN amount ELSE 0 END) AS current_basic,
        SUM(CASE WHEN component_type = 'fixed_allowance' AND is_active THEN amount ELSE 0 END) AS current_allowances,
        SUM(CASE WHEN is_active THEN amount ELSE 0 END) AS current_gross
    FROM salary_components 
    GROUP BY employee_id
),
latest_changes AS (
    SELECT DISTINCT ON (employee_id)
        employee_id,
        change_date,
        previous_values,
        new_values
    FROM salary_component_history 
    WHERE action_type IN ('UPDATE', 'CREATE')
    ORDER BY employee_id, change_date DESC
)
SELECT 
    e.id as employee_id,
    e.full_name,
    cs.current_basic,
    cs.current_allowances,
    cs.current_gross,
    lc.change_date as last_change_date,
    lc.previous_values,
    lc.new_values
FROM employees e
LEFT JOIN current_salary cs ON e.id = cs.employee_id
LEFT JOIN latest_changes lc ON e.id = lc.employee_id;