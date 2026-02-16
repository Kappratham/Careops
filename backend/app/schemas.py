from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Any
from uuid import UUID
from datetime import datetime, date, time


# ============================================================
# AUTH SCHEMAS
# ============================================================

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    status: str
    workspace_id: Optional[UUID] = None
    permissions: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    user: UserResponse
    tokens: TokenResponse


# ============================================================
# WORKSPACE SCHEMAS
# ============================================================

class WorkspaceCreate(BaseModel):
    name: str
    address: Optional[str] = None
    timezone: str = "UTC"
    contact_email: EmailStr


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    timezone: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_form_config: Optional[dict] = None
    welcome_message_template: Optional[str] = None


class WorkspaceResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    address: Optional[str] = None
    timezone: str
    contact_email: str
    owner_id: UUID
    status: str
    onboarding_step: int
    contact_form_config: Optional[dict] = None
    welcome_message_template: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OnboardingStatusResponse(BaseModel):
    current_step: int
    workspace_created: bool
    communication_setup: bool
    contact_form_created: bool
    services_created: bool
    forms_created: bool
    inventory_created: bool
    team_invited: bool
    workspace_activated: bool
    can_activate: bool


# ============================================================
# INTEGRATION SCHEMAS
# ============================================================

class IntegrationCreate(BaseModel):
    type: str
    provider: str
    config: dict


class IntegrationUpdate(BaseModel):
    config: Optional[dict] = None
    status: Optional[str] = None


class IntegrationResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    type: str
    provider: str
    config: dict
    status: str
    last_error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class IntegrationListResponse(BaseModel):
    integrations: list[IntegrationResponse]
    total: int


class IntegrationTestResponse(BaseModel):
    success: bool
    message: str


# ============================================================
# CONTACT SCHEMAS
# ============================================================

class ContactCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    source: str = "contact_form"
    notes: Optional[str] = None


class ContactUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    notes: Optional[str] = None


class ContactResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    source: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ContactListResponse(BaseModel):
    contacts: list[ContactResponse]
    total: int


class PublicContactSubmit(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    message: Optional[str] = None


# ============================================================
# CONVERSATION SCHEMAS
# ============================================================

class MessageCreate(BaseModel):
    content: str
    channel: str = "email"
    subject: Optional[str] = None


class MessageResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    direction: str
    channel: str
    sender_type: str
    sender_id: Optional[UUID] = None
    subject: Optional[str] = None
    content: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    contact_id: UUID
    status: str
    subject: Optional[str] = None
    is_read: bool
    automation_paused: bool
    last_message_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    last_message: Optional[str] = None
    unread_count: int = 0

    class Config:
        from_attributes = True


class ConversationDetailResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    contact_id: UUID
    status: str
    subject: Optional[str] = None
    is_read: bool
    automation_paused: bool
    last_message_at: Optional[datetime] = None
    created_at: datetime
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    messages: list[MessageResponse] = []

    class Config:
        from_attributes = True


class ConversationListResponse(BaseModel):
    conversations: list[ConversationResponse]
    total: int


# ============================================================
# SERVICE SCHEMAS
# ============================================================

class AvailabilitySlotCreate(BaseModel):
    day_of_week: int
    start_time: str
    end_time: str
    is_active: bool = True


class AvailabilitySlotResponse(BaseModel):
    id: UUID
    service_id: UUID
    day_of_week: int
    start_time: time
    end_time: time
    is_active: bool

    class Config:
        from_attributes = True


class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    duration_minutes: int = 30
    price: Optional[float] = None
    location_type: str = "virtual"
    address: Optional[str] = None
    buffer_minutes: int = 0
    availability_slots: Optional[list[AvailabilitySlotCreate]] = None


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    price: Optional[float] = None
    location_type: Optional[str] = None
    address: Optional[str] = None
    buffer_minutes: Optional[int] = None
    is_active: Optional[bool] = None


class ServiceResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    name: str
    description: Optional[str] = None
    duration_minutes: int
    price: Optional[float] = None
    location_type: str
    address: Optional[str] = None
    buffer_minutes: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    availability_slots: list[AvailabilitySlotResponse] = []

    class Config:
        from_attributes = True


class ServiceListResponse(BaseModel):
    services: list[ServiceResponse]
    total: int


class TimeSlotResponse(BaseModel):
    start_time: str
    end_time: str


class AvailableSlotsResponse(BaseModel):
    service_id: UUID
    service_name: str
    duration_minutes: int
    date: str
    slots: list[TimeSlotResponse]


# ============================================================
# BOOKING SCHEMAS
# ============================================================

class BookingCreate(BaseModel):
    service_id: UUID
    booking_date: date
    start_time: str
    customer_name: str
    customer_email: Optional[EmailStr] = None
    customer_phone: Optional[str] = None
    notes: Optional[str] = None


class BookingStatusUpdate(BaseModel):
    status: str


class BookingResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    service_id: UUID
    contact_id: UUID
    booking_date: date
    start_time: time
    end_time: time
    status: str
    notes: Optional[str] = None
    customer_name: str
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    service_name: Optional[str] = None
    service_duration: Optional[int] = None
    form_status: Optional[str] = None

    class Config:
        from_attributes = True


class BookingListResponse(BaseModel):
    bookings: list[BookingResponse]
    total: int


class PublicBookingCreate(BaseModel):
    service_id: UUID
    booking_date: date
    start_time: str
    customer_name: str
    customer_email: Optional[EmailStr] = None
    customer_phone: Optional[str] = None
    notes: Optional[str] = None


class BookingConfirmationResponse(BaseModel):
    booking_id: UUID
    service_name: str
    booking_date: date
    start_time: str
    end_time: str
    status: str
    message: str = "Booking confirmed successfully!"


# ============================================================
# FORM SCHEMAS
# ============================================================

class FormFieldSchema(BaseModel):
    name: str
    label: str
    type: str
    required: bool = False
    options: Optional[list[str]] = None
    placeholder: Optional[str] = None


class FormTemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    fields: list[FormFieldSchema]
    linked_service_ids: Optional[list[UUID]] = None
    deadline_hours: Optional[int] = 24


class FormTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    fields: Optional[list[FormFieldSchema]] = None
    linked_service_ids: Optional[list[UUID]] = None
    deadline_hours: Optional[int] = None
    is_active: Optional[bool] = None


class FormTemplateResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    name: str
    description: Optional[str] = None
    fields: list[dict]
    linked_service_ids: Optional[list] = None
    deadline_hours: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FormTemplateListResponse(BaseModel):
    templates: list[FormTemplateResponse]
    total: int


class FormSubmissionResponse(BaseModel):
    id: UUID
    form_template_id: UUID
    booking_id: UUID
    contact_id: UUID
    token: UUID
    status: str
    data: Optional[dict] = None
    submitted_at: Optional[datetime] = None
    deadline: Optional[datetime] = None
    created_at: datetime
    form_name: Optional[str] = None
    contact_name: Optional[str] = None
    booking_date: Optional[str] = None

    class Config:
        from_attributes = True


class FormSubmissionListResponse(BaseModel):
    submissions: list[FormSubmissionResponse]
    total: int


class PublicFormResponse(BaseModel):
    form_name: str
    form_description: Optional[str] = None
    fields: list[dict]
    booking_date: Optional[str] = None
    service_name: Optional[str] = None
    status: str


class PublicFormSubmit(BaseModel):
    data: dict[str, Any]


# ============================================================
# INVENTORY SCHEMAS
# ============================================================

class InventoryItemCreate(BaseModel):
    name: str
    unit: str = "pieces"
    current_quantity: int = 0
    low_threshold: int = 5
    usage_per_booking: Optional[dict] = None


class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    current_quantity: Optional[int] = None
    low_threshold: Optional[int] = None
    usage_per_booking: Optional[dict] = None
    is_active: Optional[bool] = None


class InventoryItemResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    name: str
    unit: str
    current_quantity: int
    low_threshold: int
    usage_per_booking: Optional[dict] = None
    is_active: bool
    is_low_stock: bool = False
    is_critical: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InventoryListResponse(BaseModel):
    items: list[InventoryItemResponse]
    total: int
    low_stock_count: int
    critical_count: int


# ============================================================
# ALERT SCHEMAS
# ============================================================

class AlertResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    type: str
    title: str
    description: Optional[str] = None
    severity: str
    link_to: Optional[str] = None
    is_dismissed: bool
    related_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AlertListResponse(BaseModel):
    alerts: list[AlertResponse]
    total: int


# ============================================================
# AUTOMATION LOG SCHEMAS
# ============================================================

class AutomationLogResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    event_type: str
    action_taken: str
    status: str
    details: Optional[dict] = None
    related_contact_id: Optional[UUID] = None
    related_booking_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AutomationLogListResponse(BaseModel):
    logs: list[AutomationLogResponse]
    total: int


# ============================================================
# DASHBOARD SCHEMAS
# ============================================================

class DashboardStats(BaseModel):
    """Aggregated counts for dashboard KPIs."""

    todays_bookings: int = Field(0, description="Number of bookings today")
    upcoming_bookings: int = Field(0, description="Total upcoming confirmed/pending bookings")
    completed_bookings: int = Field(0, description="Completed today")
    no_show_bookings: int = Field(0, description="No-shows today")
    total_contacts: int = Field(0, description="Total contacts in workspace")
    new_contacts_today: int = Field(0, description="Contacts created today")
    unread_conversations: int = Field(0, description="Conversations with unread messages")
    unanswered_conversations: int = Field(0, description="Same as unread for display")
    pending_forms: int = Field(0, description="Form submissions pending")
    overdue_forms: int = Field(0, description="Form submissions past deadline")
    completed_forms: int = Field(0, description="Form submissions completed")
    low_stock_items: int = Field(0, description="Items at or below low threshold")
    critical_stock_items: int = Field(0, description="Items at zero stock")
    active_alerts: int = Field(0, description="Non-dismissed alerts")


class DashboardBooking(BaseModel):
    """Summary of a booking for dashboard lists."""

    id: UUID
    customer_name: str
    service_name: str
    booking_date: date
    start_time: time
    status: str

    class Config:
        from_attributes = True


class DashboardAlert(BaseModel):
    """Alert summary for dashboard."""

    id: UUID
    type: str
    title: str
    severity: str
    link_to: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    """Full dashboard payload: stats plus today's/upcoming bookings and recent alerts."""

    stats: DashboardStats
    todays_bookings: list[DashboardBooking] = Field(default_factory=list)
    upcoming_bookings: list[DashboardBooking] = Field(default_factory=list)
    recent_alerts: list[DashboardAlert] = Field(default_factory=list)


# ============================================================
# STAFF SCHEMAS
# ============================================================

class StaffInvite(BaseModel):
    email: EmailStr
    full_name: str
    permissions: dict = {
        "inbox": True,
        "bookings": True,
        "forms": True,
        "inventory": False,
    }


class StaffUpdatePermissions(BaseModel):
    permissions: dict


class StaffResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    status: str
    permissions: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


class StaffListResponse(BaseModel):
    staff: list[StaffResponse]
    total: int