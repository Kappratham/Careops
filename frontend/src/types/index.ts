export interface User {
    id: string;
    email: string;
    full_name: string;
    role: "owner" | "staff";
    status: string;
    workspace_id: string | null;
    permissions: Record<string, boolean> | null;
    created_at: string;
  }
  
  export interface Workspace {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    timezone: string;
    contact_email: string;
    owner_id: string;
    status: "setup" | "active" | "inactive";
    onboarding_step: number;
    contact_form_config: Record<string, any> | null;
    welcome_message_template: string | null;
    created_at: string;
    updated_at: string;
  }
  
  export interface OnboardingStatus {
    current_step: number;
    workspace_created: boolean;
    communication_setup: boolean;
    contact_form_created: boolean;
    services_created: boolean;
    forms_created: boolean;
    inventory_created: boolean;
    team_invited: boolean;
    workspace_activated: boolean;
    can_activate: boolean;
  }
  
  export interface Integration {
    id: string;
    workspace_id: string;
    type: "email" | "sms";
    provider: string;
    config: Record<string, any>;
    status: string;
    last_error: string | null;
    created_at: string;
    updated_at: string;
  }
  
  export interface Contact {
    id: string;
    workspace_id: string;
    name: string;
    email: string | null;
    phone: string | null;
    source: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
  }
  
  export interface Message {
    id: string;
    conversation_id: string;
    direction: "inbound" | "outbound";
    channel: "email" | "sms" | "system";
    sender_type: "customer" | "staff" | "automation";
    sender_id: string | null;
    subject: string | null;
    content: string;
    status: string;
    created_at: string;
  }
  
  export interface Conversation {
    id: string;
    workspace_id: string;
    contact_id: string;
    status: string;
    subject: string | null;
    is_read: boolean;
    automation_paused: boolean;
    last_message_at: string | null;
    created_at: string;
    updated_at: string;
    contact_name: string | null;
    contact_email: string | null;
    last_message: string | null;
    unread_count: number;
  }
  
  export interface ConversationDetail extends Conversation {
    contact_phone: string | null;
    messages: Message[];
  }
  
  export interface AvailabilitySlot {
    id: string;
    service_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
  }
  
  export interface Service {
    id: string;
    workspace_id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
    price: number | null;
    location_type: string;
    address: string | null;
    buffer_minutes: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    availability_slots: AvailabilitySlot[];
  }
  
  export interface Booking {
    id: string;
    workspace_id: string;
    service_id: string;
    contact_id: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    status: "pending" | "confirmed" | "completed" | "no_show" | "cancelled";
    notes: string | null;
    customer_name: string;
    customer_email: string | null;
    customer_phone: string | null;
    created_at: string;
    updated_at: string;
    service_name: string | null;
    service_duration: number | null;
    form_status: string | null;
  }
  
  export interface FormTemplate {
    id: string;
    workspace_id: string;
    name: string;
    description: string | null;
    fields: FormField[];
    linked_service_ids: string[] | null;
    deadline_hours: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  
  export interface FormField {
    name: string;
    label: string;
    type: string;
    required: boolean;
    options: string[] | null;
    placeholder: string | null;
  }
  
  export interface FormSubmission {
    id: string;
    form_template_id: string;
    booking_id: string;
    contact_id: string;
    token: string;
    status: "pending" | "completed" | "overdue";
    data: Record<string, any> | null;
    submitted_at: string | null;
    deadline: string | null;
    created_at: string;
    form_name: string | null;
    contact_name: string | null;
    booking_date: string | null;
  }
  
  export interface InventoryItem {
    id: string;
    workspace_id: string;
    name: string;
    unit: string;
    current_quantity: number;
    low_threshold: number;
    usage_per_booking: Record<string, number> | null;
    is_active: boolean;
    is_low_stock: boolean;
    is_critical: boolean;
    created_at: string;
    updated_at: string;
  }
  
  export interface Alert {
    id: string;
    workspace_id: string;
    type: string;
    title: string;
    description: string | null;
    severity: "info" | "warning" | "critical";
    link_to: string | null;
    is_dismissed: boolean;
    related_id: string | null;
    created_at: string;
  }
  
  export interface AutomationLog {
    id: string;
    workspace_id: string;
    event_type: string;
    action_taken: string;
    status: string;
    details: Record<string, any> | null;
    related_contact_id: string | null;
    related_booking_id: string | null;
    created_at: string;
  }
  
  export interface DashboardStats {
    todays_bookings: number;
    upcoming_bookings: number;
    completed_bookings: number;
    no_show_bookings: number;
    total_contacts: number;
    new_contacts_today: number;
    unread_conversations: number;
    unanswered_conversations: number;
    pending_forms: number;
    overdue_forms: number;
    completed_forms: number;
    low_stock_items: number;
    critical_stock_items: number;
    active_alerts: number;
  }
  
  export interface DashboardBooking {
    id: string;
    customer_name: string;
    service_name: string;
    booking_date: string;
    start_time: string;
    status: string;
  }
  
  export interface DashboardAlert {
    id: string;
    type: string;
    title: string;
    severity: string;
    link_to: string | null;
    created_at: string;
  }
  
  export interface DashboardData {
    stats: DashboardStats;
    todays_bookings: DashboardBooking[];
    upcoming_bookings: DashboardBooking[];
    recent_alerts: DashboardAlert[];
  }
  
  export interface Staff {
    id: string;
    email: string;
    full_name: string;
    role: string;
    status: string;
    permissions: Record<string, boolean> | null;
    created_at: string;
  }