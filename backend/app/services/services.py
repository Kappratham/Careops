import uuid
from datetime import datetime, date, time, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

from app.models.contact import Contact, ContactSource
from app.models.conversation import Conversation, ConversationStatus
from app.models.message import Message, MessageDirection, MessageChannel, MessageSenderType, MessageStatus
from app.models.service import Service
from app.models.availability import AvailabilitySlot
from app.models.booking import Booking, BookingStatus
from app.models.form_template import FormTemplate
from app.models.form_submission import FormSubmission, FormSubmissionStatus
from app.models.inventory import InventoryItem
from app.models.integration import Integration, IntegrationStatus
from app.models.automation_log import AutomationLog, AutomationStatus
from app.models.alert import Alert, AlertType, AlertSeverity
from app.models.workspace import Workspace, WorkspaceStatus
from app.models.user import User, UserRole, UserStatus
from app.utils.helpers import calculate_end_time, time_slots, generate_slug


# ============================================================
# WORKSPACE SERVICE
# ============================================================

async def create_workspace(db: AsyncSession, owner_id: uuid.UUID, name: str, address: str, timezone: str, contact_email: str) -> Workspace:
    slug = generate_slug(name)
    workspace = Workspace(
        name=name,
        slug=slug,
        address=address,
        timezone=timezone,
        contact_email=contact_email,
        owner_id=owner_id,
        status=WorkspaceStatus.SETUP,
        onboarding_step=1,
    )
    db.add(workspace)
    await db.flush()

    # Update owner's workspace_id
    result = await db.execute(select(User).where(User.id == owner_id))
    user = result.scalar_one()
    user.workspace_id = workspace.id
    await db.flush()

    return workspace


async def get_workspace(db: AsyncSession, workspace_id: uuid.UUID) -> Optional[Workspace]:
    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
    return result.scalar_one_or_none()


async def get_workspace_by_slug(db: AsyncSession, slug: str) -> Optional[Workspace]:
    result = await db.execute(select(Workspace).where(Workspace.slug == slug))
    return result.scalar_one_or_none()


async def update_workspace(db: AsyncSession, workspace: Workspace, **kwargs) -> Workspace:
    for key, value in kwargs.items():
        if value is not None and hasattr(workspace, key):
            setattr(workspace, key, value)
    workspace.updated_at = datetime.utcnow()
    await db.flush()
    return workspace


async def activate_workspace(db: AsyncSession, workspace: Workspace) -> Workspace:
    workspace.status = WorkspaceStatus.ACTIVE
    workspace.onboarding_step = 8
    workspace.updated_at = datetime.utcnow()
    await db.flush()
    return workspace


async def get_onboarding_status(db: AsyncSession, workspace_id: uuid.UUID, owner_id: uuid.UUID) -> dict:
    workspace = await get_workspace(db, workspace_id)
    if not workspace:
        return {
            "current_step": 0,
            "workspace_created": False,
            "communication_setup": False,
            "contact_form_created": False,
            "services_created": False,
            "forms_created": False,
            "inventory_created": False,
            "team_invited": False,
            "workspace_activated": False,
            "can_activate": False,
        }

    # Check each step
    integrations = await db.execute(
        select(func.count(Integration.id)).where(
            and_(Integration.workspace_id == workspace_id, Integration.status == IntegrationStatus.ACTIVE)
        )
    )
    integration_count = integrations.scalar()

    services = await db.execute(
        select(func.count(Service.id)).where(Service.workspace_id == workspace_id)
    )
    service_count = services.scalar()

    forms = await db.execute(
        select(func.count(FormTemplate.id)).where(FormTemplate.workspace_id == workspace_id)
    )
    form_count = forms.scalar()

    inventory = await db.execute(
        select(func.count(InventoryItem.id)).where(InventoryItem.workspace_id == workspace_id)
    )
    inventory_count = inventory.scalar()

    staff = await db.execute(
        select(func.count(User.id)).where(
            and_(User.workspace_id == workspace_id, User.role == UserRole.STAFF)
        )
    )
    staff_count = staff.scalar()

    comm_setup = integration_count > 0
    contact_form = workspace.contact_form_config is not None
    services_created = service_count > 0
    can_activate = comm_setup and services_created

    return {
        "current_step": workspace.onboarding_step,
        "workspace_created": True,
        "communication_setup": comm_setup,
        "contact_form_created": contact_form,
        "services_created": services_created,
        "forms_created": form_count > 0,
        "inventory_created": inventory_count > 0,
        "team_invited": staff_count > 0,
        "workspace_activated": workspace.status == WorkspaceStatus.ACTIVE,
        "can_activate": can_activate,
    }


# ============================================================
# INTEGRATION SERVICE
# ============================================================

async def create_integration(db: AsyncSession, workspace_id: uuid.UUID, type: str, provider: str, config: dict) -> Integration:
    integration = Integration(
        workspace_id=workspace_id,
        type=type,
        provider=provider,
        config=config,
        status=IntegrationStatus.ACTIVE,
    )
    db.add(integration)
    await db.flush()
    return integration


async def get_integrations(db: AsyncSession, workspace_id: uuid.UUID) -> list[Integration]:
    result = await db.execute(
        select(Integration).where(Integration.workspace_id == workspace_id)
    )
    return result.scalars().all()


async def get_active_email_integration(db: AsyncSession, workspace_id: uuid.UUID) -> Optional[Integration]:
    result = await db.execute(
        select(Integration).where(
            and_(
                Integration.workspace_id == workspace_id,
                Integration.type == "email",
                Integration.status == IntegrationStatus.ACTIVE,
            )
        )
    )
    return result.scalar_one_or_none()


# ============================================================
# CONTACT SERVICE
# ============================================================

async def create_contact(db: AsyncSession, workspace_id: uuid.UUID, name: str, email: str = None, phone: str = None, source: str = "contact_form", notes: str = None) -> Contact:
    # Check for existing contact
    if email:
        result = await db.execute(
            select(Contact).where(
                and_(Contact.workspace_id == workspace_id, Contact.email == email)
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            return existing

    if phone:
        result = await db.execute(
            select(Contact).where(
                and_(Contact.workspace_id == workspace_id, Contact.phone == phone)
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            return existing

    contact = Contact(
        workspace_id=workspace_id,
        name=name,
        email=email,
        phone=phone,
        source=source,
        notes=notes,
    )
    db.add(contact)
    await db.flush()
    return contact


async def get_contacts(db: AsyncSession, workspace_id: uuid.UUID, search: str = None) -> list[Contact]:
    query = select(Contact).where(Contact.workspace_id == workspace_id)
    if search:
        query = query.where(
            or_(
                Contact.name.ilike(f"%{search}%"),
                Contact.email.ilike(f"%{search}%"),
                Contact.phone.ilike(f"%{search}%"),
            )
        )
    query = query.order_by(Contact.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


async def get_contact(db: AsyncSession, contact_id: uuid.UUID) -> Optional[Contact]:
    result = await db.execute(select(Contact).where(Contact.id == contact_id))
    return result.scalar_one_or_none()


# ============================================================
# CONVERSATION SERVICE
# ============================================================

async def create_conversation(db: AsyncSession, workspace_id: uuid.UUID, contact_id: uuid.UUID, subject: str = None, initial_message: str = None) -> Conversation:
    conversation = Conversation(
        workspace_id=workspace_id,
        contact_id=contact_id,
        subject=subject,
        status=ConversationStatus.ACTIVE,
        last_message_at=datetime.utcnow(),
    )
    db.add(conversation)
    await db.flush()

    if initial_message:
        message = Message(
            conversation_id=conversation.id,
            direction=MessageDirection.INBOUND,
            channel=MessageChannel.EMAIL,
            sender_type=MessageSenderType.CUSTOMER,
            content=initial_message,
            status=MessageStatus.DELIVERED,
        )
        db.add(message)
        await db.flush()

    return conversation


async def get_conversations(db: AsyncSession, workspace_id: uuid.UUID) -> list:
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.contact), selectinload(Conversation.messages))
        .where(Conversation.workspace_id == workspace_id)
        .order_by(Conversation.last_message_at.desc())
    )
    conversations = result.scalars().all()

    conv_list = []
    for conv in conversations:
        last_msg = conv.messages[-1] if conv.messages else None
        unread = sum(1 for m in conv.messages if m.direction == "inbound" and m.status != "read")
        conv_list.append({
            "id": conv.id,
            "workspace_id": conv.workspace_id,
            "contact_id": conv.contact_id,
            "status": conv.status,
            "subject": conv.subject,
            "is_read": conv.is_read,
            "automation_paused": conv.automation_paused,
            "last_message_at": conv.last_message_at,
            "created_at": conv.created_at,
            "updated_at": conv.updated_at,
            "contact_name": conv.contact.name if conv.contact else None,
            "contact_email": conv.contact.email if conv.contact else None,
            "last_message": last_msg.content[:100] if last_msg else None,
            "unread_count": unread,
        })
    return conv_list


async def get_conversation_detail(db: AsyncSession, conversation_id: uuid.UUID) -> Optional[dict]:
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.contact), selectinload(Conversation.messages))
        .where(Conversation.id == conversation_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        return None

    conv.is_read = True
    await db.flush()

    return {
        "id": conv.id,
        "workspace_id": conv.workspace_id,
        "contact_id": conv.contact_id,
        "status": conv.status,
        "subject": conv.subject,
        "is_read": conv.is_read,
        "automation_paused": conv.automation_paused,
        "last_message_at": conv.last_message_at,
        "created_at": conv.created_at,
        "contact_name": conv.contact.name if conv.contact else None,
        "contact_email": conv.contact.email if conv.contact else None,
        "contact_phone": conv.contact.phone if conv.contact else None,
        "messages": [
            {
                "id": m.id,
                "conversation_id": m.conversation_id,
                "direction": m.direction,
                "channel": m.channel,
                "sender_type": m.sender_type,
                "sender_id": m.sender_id,
                "subject": m.subject,
                "content": m.content,
                "status": m.status,
                "created_at": m.created_at,
            }
            for m in conv.messages
        ],
    }


async def send_message(db: AsyncSession, conversation_id: uuid.UUID, sender_id: uuid.UUID, content: str, channel: str = "email", subject: str = None) -> Message:
    message = Message(
        conversation_id=conversation_id,
        direction=MessageDirection.OUTBOUND,
        channel=channel,
        sender_type=MessageSenderType.STAFF,
        sender_id=sender_id,
        subject=subject,
        content=content,
        status=MessageStatus.SENT,
    )
    db.add(message)

    # Update conversation
    result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conv = result.scalar_one()
    conv.last_message_at = datetime.utcnow()
    conv.automation_paused = True

    await db.flush()

    # Log automation pause
    await log_automation(db, conv.workspace_id, "staff_reply", "pause_automation",
                         AutomationStatus.SUCCESS, {"conversation_id": str(conversation_id)})

    return message


# ============================================================
# SERVICE (business service types) SERVICE
# ============================================================

async def create_service(db: AsyncSession, workspace_id: uuid.UUID, data: dict) -> Service:
    service = Service(
        workspace_id=workspace_id,
        name=data["name"],
        description=data.get("description"),
        duration_minutes=data.get("duration_minutes", 30),
        price=data.get("price"),
        location_type=data.get("location_type", "virtual"),
        address=data.get("address"),
        buffer_minutes=data.get("buffer_minutes", 0),
    )
    db.add(service)
    await db.flush()

    # Create availability slots
    slots = data.get("availability_slots", [])
    for slot in slots:
        avail = AvailabilitySlot(
            service_id=service.id,
            day_of_week=slot["day_of_week"],
            start_time=time.fromisoformat(slot["start_time"]),
            end_time=time.fromisoformat(slot["end_time"]),
            is_active=slot.get("is_active", True),
        )
        db.add(avail)

    await db.flush()
    return service


async def get_services(db: AsyncSession, workspace_id: uuid.UUID) -> list[Service]:
    result = await db.execute(
        select(Service)
        .options(selectinload(Service.availability_slots))
        .where(Service.workspace_id == workspace_id)
        .order_by(Service.created_at.desc())
    )
    return result.scalars().all()


async def get_service(db: AsyncSession, service_id: uuid.UUID) -> Optional[Service]:
    result = await db.execute(
        select(Service)
        .options(selectinload(Service.availability_slots))
        .where(Service.id == service_id)
    )
    return result.scalar_one_or_none()


async def update_service(db: AsyncSession, service: Service, data: dict) -> Service:
    for key, value in data.items():
        if value is not None and hasattr(service, key) and key != "availability_slots":
            setattr(service, key, value)
    service.updated_at = datetime.utcnow()
    await db.flush()
    return service


async def delete_service(db: AsyncSession, service: Service):
    await db.delete(service)
    await db.flush()


async def get_available_slots(db: AsyncSession, service_id: uuid.UUID, target_date: date) -> list[dict]:
    service = await get_service(db, service_id)
    if not service:
        return []

    day_of_week = target_date.weekday()

    # Get availability for this day
    available = [s for s in service.availability_slots if s.day_of_week == day_of_week and s.is_active]
    if not available:
        return []

    # Get existing bookings for this date
    result = await db.execute(
        select(Booking).where(
            and_(
                Booking.service_id == service_id,
                Booking.booking_date == target_date,
                Booking.status.in_(["confirmed", "pending"]),
            )
        )
    )
    existing_bookings = result.scalars().all()
    booked_times = [(b.start_time, b.end_time) for b in existing_bookings]

    all_slots = []
    for avail in available:
        slots = time_slots(avail.start_time, avail.end_time, service.duration_minutes, service.buffer_minutes)
        for slot in slots:
            slot_start = time.fromisoformat(slot["start_time"])
            slot_end = time.fromisoformat(slot["end_time"])

            # Check conflict
            is_booked = False
            for booked_start, booked_end in booked_times:
                if slot_start < booked_end and slot_end > booked_start:
                    is_booked = True
                    break

            if not is_booked:
                # Skip past times for today
                if target_date == date.today():
                    now = datetime.now().time()
                    if slot_start <= now:
                        continue

                all_slots.append(slot)

    return all_slots


# ============================================================
# BOOKING SERVICE
# ============================================================

async def create_booking(db: AsyncSession, workspace_id: uuid.UUID, data: dict) -> Booking:
    service = await get_service(db, data["service_id"])
    if not service:
        raise ValueError("Service not found")

    start = time.fromisoformat(data["start_time"])
    end = calculate_end_time(start, service.duration_minutes)

    # Create or find contact
    contact = await create_contact(
        db, workspace_id,
        name=data["customer_name"],
        email=data.get("customer_email"),
        phone=data.get("customer_phone"),
        source="booking",
    )

    booking = Booking(
        workspace_id=workspace_id,
        service_id=data["service_id"],
        contact_id=contact.id,
        booking_date=data["booking_date"],
        start_time=start,
        end_time=end,
        status=BookingStatus.CONFIRMED,
        customer_name=data["customer_name"],
        customer_email=data.get("customer_email"),
        customer_phone=data.get("customer_phone"),
        notes=data.get("notes"),
    )
    db.add(booking)
    await db.flush()

    # Auto-create form submissions for linked forms
    result = await db.execute(
        select(FormTemplate).where(FormTemplate.workspace_id == workspace_id)
    )
    templates = result.scalars().all()

    for template in templates:
        linked = template.linked_service_ids or []
        if str(data["service_id"]) in [str(s) for s in linked] or not linked:
            deadline = None
            if template.deadline_hours:
                deadline = datetime.combine(data["booking_date"], start) - timedelta(hours=template.deadline_hours)

            submission = FormSubmission(
                form_template_id=template.id,
                booking_id=booking.id,
                contact_id=contact.id,
                status=FormSubmissionStatus.PENDING,
                deadline=deadline,
            )
            db.add(submission)

    await db.flush()

    # Deduct inventory
    await deduct_inventory_for_booking(db, workspace_id, data["service_id"])

    # Log automation
    await log_automation(db, workspace_id, "booking_created", "send_confirmation",
                         AutomationStatus.SUCCESS,
                         {"booking_id": str(booking.id), "contact_id": str(contact.id)})

    return booking


async def get_bookings(db: AsyncSession, workspace_id: uuid.UUID, status_filter: str = None, date_filter: date = None) -> list:
    query = select(Booking).options(selectinload(Booking.service)).where(Booking.workspace_id == workspace_id)

    if status_filter:
        query = query.where(Booking.status == status_filter)
    if date_filter:
        query = query.where(Booking.booking_date == date_filter)

    query = query.order_by(Booking.booking_date.desc(), Booking.start_time.desc())
    result = await db.execute(query)
    bookings = result.scalars().all()

    booking_list = []
    for b in bookings:
        # Check form status
        forms_result = await db.execute(
            select(FormSubmission).where(FormSubmission.booking_id == b.id)
        )
        form_subs = forms_result.scalars().all()
        form_status = None
        if form_subs:
            if all(f.status == "completed" for f in form_subs):
                form_status = "completed"
            elif any(f.status == "overdue" for f in form_subs):
                form_status = "overdue"
            else:
                form_status = "pending"

        booking_list.append({
            "id": b.id,
            "workspace_id": b.workspace_id,
            "service_id": b.service_id,
            "contact_id": b.contact_id,
            "booking_date": b.booking_date,
            "start_time": b.start_time,
            "end_time": b.end_time,
            "status": b.status,
            "notes": b.notes,
            "customer_name": b.customer_name,
            "customer_email": b.customer_email,
            "customer_phone": b.customer_phone,
            "created_at": b.created_at,
            "updated_at": b.updated_at,
            "service_name": b.service.name if b.service else None,
            "service_duration": b.service.duration_minutes if b.service else None,
            "form_status": form_status,
        })

    return booking_list


async def get_booking(db: AsyncSession, booking_id: uuid.UUID) -> Optional[dict]:
    result = await db.execute(
        select(Booking).options(selectinload(Booking.service)).where(Booking.id == booking_id)
    )
    b = result.scalar_one_or_none()
    if not b:
        return None

    forms_result = await db.execute(
        select(FormSubmission).where(FormSubmission.booking_id == b.id)
    )
    form_subs = forms_result.scalars().all()
    form_status = None
    if form_subs:
        if all(f.status == "completed" for f in form_subs):
            form_status = "completed"
        elif any(f.status == "overdue" for f in form_subs):
            form_status = "overdue"
        else:
            form_status = "pending"

    return {
        "id": b.id,
        "workspace_id": b.workspace_id,
        "service_id": b.service_id,
        "contact_id": b.contact_id,
        "booking_date": b.booking_date,
        "start_time": b.start_time,
        "end_time": b.end_time,
        "status": b.status,
        "notes": b.notes,
        "customer_name": b.customer_name,
        "customer_email": b.customer_email,
        "customer_phone": b.customer_phone,
        "created_at": b.created_at,
        "updated_at": b.updated_at,
        "service_name": b.service.name if b.service else None,
        "service_duration": b.service.duration_minutes if b.service else None,
        "form_status": form_status,
    }


async def update_booking_status(db: AsyncSession, booking_id: uuid.UUID, status: str) -> Optional[Booking]:
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        return None
    booking.status = status
    booking.updated_at = datetime.utcnow()
    await db.flush()
    return booking


# ============================================================
# FORM SERVICE
# ============================================================

async def create_form_template(db: AsyncSession, workspace_id: uuid.UUID, data: dict) -> FormTemplate:
    template = FormTemplate(
        workspace_id=workspace_id,
        name=data["name"],
        description=data.get("description"),
        fields=[f if isinstance(f, dict) else f.model_dump() for f in data["fields"]],
        linked_service_ids=[str(s) for s in data.get("linked_service_ids", [])] if data.get("linked_service_ids") else [],
        deadline_hours=data.get("deadline_hours", 24),
    )
    db.add(template)
    await db.flush()
    return template


async def get_form_templates(db: AsyncSession, workspace_id: uuid.UUID) -> list[FormTemplate]:
    result = await db.execute(
        select(FormTemplate).where(FormTemplate.workspace_id == workspace_id).order_by(FormTemplate.created_at.desc())
    )
    return result.scalars().all()


async def get_form_submissions(db: AsyncSession, workspace_id: uuid.UUID) -> list[dict]:
    result = await db.execute(
        select(FormSubmission)
        .join(FormTemplate)
        .join(Booking)
        .join(Contact)
        .where(FormTemplate.workspace_id == workspace_id)
        .order_by(FormSubmission.created_at.desc())
    )
    submissions = result.scalars().all()

    sub_list = []
    for s in submissions:
        # Get related data
        template = await db.execute(select(FormTemplate).where(FormTemplate.id == s.form_template_id))
        tmpl = template.scalar_one_or_none()
        contact = await db.execute(select(Contact).where(Contact.id == s.contact_id))
        cont = contact.scalar_one_or_none()
        booking = await db.execute(select(Booking).where(Booking.id == s.booking_id))
        bk = booking.scalar_one_or_none()

        sub_list.append({
            "id": s.id,
            "form_template_id": s.form_template_id,
            "booking_id": s.booking_id,
            "contact_id": s.contact_id,
            "token": s.token,
            "status": s.status,
            "data": s.data,
            "submitted_at": s.submitted_at,
            "deadline": s.deadline,
            "created_at": s.created_at,
            "form_name": tmpl.name if tmpl else None,
            "contact_name": cont.name if cont else None,
            "booking_date": str(bk.booking_date) if bk else None,
        })

    return sub_list


async def get_public_form(db: AsyncSession, token: str) -> Optional[dict]:
    try:
        token_uuid = uuid.UUID(token)
    except ValueError:
        return None

    result = await db.execute(
        select(FormSubmission).where(FormSubmission.token == token_uuid)
    )
    submission = result.scalar_one_or_none()
    if not submission:
        return None

    template = await db.execute(select(FormTemplate).where(FormTemplate.id == submission.form_template_id))
    tmpl = template.scalar_one_or_none()

    booking = await db.execute(select(Booking).where(Booking.id == submission.booking_id))
    bk = booking.scalar_one_or_none()

    service_name = None
    if bk:
        svc = await db.execute(select(Service).where(Service.id == bk.service_id))
        s = svc.scalar_one_or_none()
        service_name = s.name if s else None

    return {
        "form_name": tmpl.name if tmpl else "Form",
        "form_description": tmpl.description if tmpl else None,
        "fields": tmpl.fields if tmpl else [],
        "booking_date": str(bk.booking_date) if bk else None,
        "service_name": service_name,
        "status": submission.status,
    }


async def submit_public_form(db: AsyncSession, token: str, data: dict) -> bool:
    try:
        token_uuid = uuid.UUID(token)
    except ValueError:
        return False

    result = await db.execute(
        select(FormSubmission).where(FormSubmission.token == token_uuid)
    )
    submission = result.scalar_one_or_none()
    if not submission or submission.status == "completed":
        return False

    submission.data = data
    submission.status = FormSubmissionStatus.COMPLETED
    submission.submitted_at = datetime.utcnow()
    submission.updated_at = datetime.utcnow()
    await db.flush()
    return True


# ============================================================
# INVENTORY SERVICE
# ============================================================

async def create_inventory_item(db: AsyncSession, workspace_id: uuid.UUID, data: dict) -> InventoryItem:
    item = InventoryItem(
        workspace_id=workspace_id,
        name=data["name"],
        unit=data.get("unit", "pieces"),
        current_quantity=data.get("current_quantity", 0),
        low_threshold=data.get("low_threshold", 5),
        usage_per_booking=data.get("usage_per_booking"),
    )
    db.add(item)
    await db.flush()
    return item


async def get_inventory_items(db: AsyncSession, workspace_id: uuid.UUID) -> list[dict]:
    result = await db.execute(
        select(InventoryItem).where(InventoryItem.workspace_id == workspace_id).order_by(InventoryItem.name)
    )
    items = result.scalars().all()

    item_list = []
    for item in items:
        is_low = item.current_quantity <= item.low_threshold
        is_critical = item.current_quantity == 0
        item_list.append({
            "id": item.id,
            "workspace_id": item.workspace_id,
            "name": item.name,
            "unit": item.unit,
            "current_quantity": item.current_quantity,
            "low_threshold": item.low_threshold,
            "usage_per_booking": item.usage_per_booking,
            "is_active": item.is_active,
            "is_low_stock": is_low,
            "is_critical": is_critical,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
        })
    return item_list


async def update_inventory_item(db: AsyncSession, item_id: uuid.UUID, data: dict) -> Optional[InventoryItem]:
    result = await db.execute(select(InventoryItem).where(InventoryItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        return None
    for key, value in data.items():
        if value is not None and hasattr(item, key):
            setattr(item, key, value)
    item.updated_at = datetime.utcnow()
    await db.flush()
    return item


async def deduct_inventory_for_booking(db: AsyncSession, workspace_id: uuid.UUID, service_id: uuid.UUID):
    result = await db.execute(
        select(InventoryItem).where(InventoryItem.workspace_id == workspace_id)
    )
    items = result.scalars().all()

    for item in items:
        usage = item.usage_per_booking or {}
        qty = usage.get(str(service_id), 0)
        if qty > 0:
            item.current_quantity = max(0, item.current_quantity - qty)
            item.updated_at = datetime.utcnow()

            if item.current_quantity <= item.low_threshold:
                severity = AlertSeverity.CRITICAL if item.current_quantity == 0 else AlertSeverity.WARNING
                await create_alert(
                    db, workspace_id,
                    AlertType.INVENTORY_LOW,
                    f"Low stock: {item.name}",
                    f"{item.name} has {item.current_quantity} {item.unit} remaining",
                    severity,
                    f"/dashboard/inventory",
                    item.id,
                )
                await log_automation(db, workspace_id, "inventory_low", "create_alert",
                                     AutomationStatus.SUCCESS, {"item": item.name, "qty": item.current_quantity})

    await db.flush()


# ============================================================
# ALERT SERVICE
# ============================================================

async def create_alert(db: AsyncSession, workspace_id: uuid.UUID, type: AlertType, title: str, description: str, severity: AlertSeverity, link_to: str = None, related_id: uuid.UUID = None) -> Alert:
    alert = Alert(
        workspace_id=workspace_id,
        type=type,
        title=title,
        description=description,
        severity=severity,
        link_to=link_to,
        related_id=related_id,
    )
    db.add(alert)
    await db.flush()
    return alert


async def get_alerts(db: AsyncSession, workspace_id: uuid.UUID, dismissed: bool = False) -> list[Alert]:
    result = await db.execute(
        select(Alert)
        .where(and_(Alert.workspace_id == workspace_id, Alert.is_dismissed == dismissed))
        .order_by(Alert.created_at.desc())
    )
    return result.scalars().all()


async def dismiss_alert(db: AsyncSession, alert_id: uuid.UUID) -> Optional[Alert]:
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if alert:
        alert.is_dismissed = True
        alert.updated_at = datetime.utcnow()
        await db.flush()
    return alert


# ============================================================
# AUTOMATION LOG SERVICE
# ============================================================

async def log_automation(db: AsyncSession, workspace_id: uuid.UUID, event_type: str, action: str, status: AutomationStatus, details: dict = None, contact_id: uuid.UUID = None, booking_id: uuid.UUID = None):
    log = AutomationLog(
        workspace_id=workspace_id,
        event_type=event_type,
        action_taken=action,
        status=status,
        details=details,
        related_contact_id=contact_id,
        related_booking_id=booking_id,
    )
    db.add(log)
    await db.flush()
    return log


async def get_automation_logs(db: AsyncSession, workspace_id: uuid.UUID) -> list[AutomationLog]:
    result = await db.execute(
        select(AutomationLog)
        .where(AutomationLog.workspace_id == workspace_id)
        .order_by(AutomationLog.created_at.desc())
        .limit(100)
    )
    return result.scalars().all()


# ============================================================
# STAFF SERVICE
# ============================================================

async def invite_staff(db: AsyncSession, workspace_id: uuid.UUID, email: str, full_name: str, permissions: dict) -> User:
    from app.services.auth_service import hash_password
    temp_password = uuid.uuid4().hex[:12]

    user = User(
        email=email,
        password_hash=hash_password(temp_password),
        full_name=full_name,
        role=UserRole.STAFF,
        status=UserStatus.INVITED,
        workspace_id=workspace_id,
        permissions=permissions,
    )
    db.add(user)
    await db.flush()
    return user


async def get_staff(db: AsyncSession, workspace_id: uuid.UUID) -> list[User]:
    result = await db.execute(
        select(User).where(
            and_(User.workspace_id == workspace_id, User.role == UserRole.STAFF)
        )
    )
    return result.scalars().all()


async def update_staff_permissions(db: AsyncSession, staff_id: uuid.UUID, permissions: dict) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == staff_id))
    user = result.scalar_one_or_none()
    if user:
        user.permissions = permissions
        await db.flush()
    return user


# ============================================================
# DASHBOARD SERVICE
# ============================================================

async def get_dashboard_data(db: AsyncSession, workspace_id: uuid.UUID) -> dict:
    """Aggregate dashboard stats and lists in a minimal set of queries."""
    today = date.today()
    booking_confirmed_pending = [BookingStatus.CONFIRMED.value, BookingStatus.PENDING.value]

    # Today's bookings (list + derive completed/no_show from same result)
    todays = await db.execute(
        select(Booking).options(selectinload(Booking.service))
        .where(and_(Booking.workspace_id == workspace_id, Booking.booking_date == today))
        .order_by(Booking.start_time)
    )
    todays_bookings = todays.scalars().all()
    completed = sum(1 for b in todays_bookings if b.status == BookingStatus.COMPLETED.value)
    no_show = sum(1 for b in todays_bookings if b.status == BookingStatus.NO_SHOW.value)

    # Upcoming: list (limit 10) + total count for stats
    upcoming = await db.execute(
        select(Booking).options(selectinload(Booking.service))
        .where(
            and_(
                Booking.workspace_id == workspace_id,
                Booking.booking_date > today,
                Booking.status.in_(booking_confirmed_pending),
            )
        )
        .order_by(Booking.booking_date, Booking.start_time)
        .limit(10)
    )
    upcoming_bookings = upcoming.scalars().all()
    upcoming_count = await db.execute(
        select(func.count(Booking.id)).where(
            and_(
                Booking.workspace_id == workspace_id,
                Booking.booking_date > today,
                Booking.status.in_(booking_confirmed_pending),
            )
        )
    )
    total_upcoming = upcoming_count.scalar() or 0

    # Contact stats
    total_contacts = await db.execute(
        select(func.count(Contact.id)).where(Contact.workspace_id == workspace_id)
    )
    new_today = await db.execute(
        select(func.count(Contact.id)).where(
            and_(Contact.workspace_id == workspace_id, func.date(Contact.created_at) == today)
        )
    )

    # Conversation stats
    unread = await db.execute(
        select(func.count(Conversation.id)).where(
            and_(Conversation.workspace_id == workspace_id, Conversation.is_read == False)
        )
    )

    # Form stats (use enum values)
    pending_forms = await db.execute(
        select(func.count(FormSubmission.id))
        .join(FormTemplate)
        .where(
            and_(
                FormTemplate.workspace_id == workspace_id,
                FormSubmission.status == FormSubmissionStatus.PENDING.value,
            )
        )
    )
    overdue_forms = await db.execute(
        select(func.count(FormSubmission.id))
        .join(FormTemplate)
        .where(
            and_(
                FormTemplate.workspace_id == workspace_id,
                FormSubmission.status == FormSubmissionStatus.OVERDUE.value,
            )
        )
    )
    completed_forms = await db.execute(
        select(func.count(FormSubmission.id))
        .join(FormTemplate)
        .where(
            and_(
                FormTemplate.workspace_id == workspace_id,
                FormSubmission.status == FormSubmissionStatus.COMPLETED.value,
            )
        )
    )

    # Inventory: count in DB instead of loading all rows
    low_stock_q = await db.execute(
        select(func.count(InventoryItem.id)).where(
            and_(
                InventoryItem.workspace_id == workspace_id,
                InventoryItem.current_quantity <= InventoryItem.low_threshold,
                InventoryItem.current_quantity > 0,
            )
        )
    )
    critical_stock_q = await db.execute(
        select(func.count(InventoryItem.id)).where(
            and_(
                InventoryItem.workspace_id == workspace_id,
                InventoryItem.current_quantity == 0,
            )
        )
    )
    low_stock = low_stock_q.scalar() or 0
    critical = critical_stock_q.scalar() or 0

    # Recent alerts (limit 10)
    active_alerts = await db.execute(
        select(Alert)
        .where(and_(Alert.workspace_id == workspace_id, Alert.is_dismissed == False))
        .order_by(Alert.created_at.desc())
        .limit(10)
    )
    alerts = active_alerts.scalars().all()

    return {
        "stats": {
            "todays_bookings": len(todays_bookings),
            "upcoming_bookings": total_upcoming,
            "completed_bookings": completed,
            "no_show_bookings": no_show,
            "total_contacts": total_contacts.scalar() or 0,
            "new_contacts_today": new_today.scalar() or 0,
            "unread_conversations": unread.scalar() or 0,
            "unanswered_conversations": unread.scalar() or 0,
            "pending_forms": pending_forms.scalar() or 0,
            "overdue_forms": overdue_forms.scalar() or 0,
            "completed_forms": completed_forms.scalar() or 0,
            "low_stock_items": low_stock,
            "critical_stock_items": critical,
            "active_alerts": len(alerts),
        },
        "todays_bookings": [
            {
                "id": b.id,
                "customer_name": b.customer_name,
                "service_name": b.service.name if b.service else "N/A",
                "booking_date": b.booking_date,
                "start_time": b.start_time,
                "status": b.status,
            }
            for b in todays_bookings
        ],
        "upcoming_bookings": [
            {
                "id": b.id,
                "customer_name": b.customer_name,
                "service_name": b.service.name if b.service else "N/A",
                "booking_date": b.booking_date,
                "start_time": b.start_time,
                "status": b.status,
            }
            for b in upcoming_bookings
        ],
        "recent_alerts": [
            {
                "id": a.id,
                "type": a.type,
                "title": a.title,
                "severity": a.severity,
                "link_to": a.link_to,
                "created_at": a.created_at,
            }
            for a in alerts
        ],
    }


# ============================================================
# EMAIL SERVICE (Resend)
# ============================================================

async def send_email(to: str, subject: str, body: str, workspace_id: uuid.UUID = None, db: AsyncSession = None):
    """Send email via Resend - fails gracefully"""
    try:
        from app.config import settings
        if not settings.RESEND_API_KEY:
            print(f"📧 [MOCK EMAIL] To: {to}, Subject: {subject}")
            if db and workspace_id:
                await log_automation(db, workspace_id, "email_send", "mock_email",
                                     AutomationStatus.SUCCESS, {"to": to, "subject": subject})
            return True

        import resend
        resend.api_key = settings.RESEND_API_KEY

        resend.Emails.send({
            "from": "CareOps <onboarding@resend.dev>",
            "to": [to],
            "subject": subject,
            "html": body,
        })

        if db and workspace_id:
            await log_automation(db, workspace_id, "email_send", "send_email",
                                 AutomationStatus.SUCCESS, {"to": to, "subject": subject})
        return True
    except Exception as e:
        print(f"❌ Email failed: {e}")
        if db and workspace_id:
            await log_automation(db, workspace_id, "email_send", "send_email",
                                 AutomationStatus.FAILED, {"to": to, "error": str(e)})
        return False
# ============================================================
# OVERDUE FORM CHECK (call periodically or on dashboard load)
# ============================================================

async def check_overdue_forms(db: AsyncSession, workspace_id: uuid.UUID):
    """Mark pending forms as overdue if deadline has passed"""
    now = datetime.utcnow()

    result = await db.execute(
        select(FormSubmission)
        .join(FormTemplate)
        .where(
            and_(
                FormTemplate.workspace_id == workspace_id,
                FormSubmission.status == FormSubmissionStatus.PENDING,
                FormSubmission.deadline != None,
                FormSubmission.deadline < now,
            )
        )
    )
    overdue_forms = result.scalars().all()

    for form in overdue_forms:
        form.status = FormSubmissionStatus.OVERDUE
        form.updated_at = now

        # Create alert
        await create_alert(
            db, workspace_id,
            AlertType.FORM_OVERDUE,
            f"Form overdue",
            f"A form submission is past its deadline",
            AlertSeverity.WARNING,
            "/dashboard/forms",
            form.id,
        )

        # Log automation
        await log_automation(
            db, workspace_id, "form_overdue", "mark_overdue_and_alert",
            AutomationStatus.SUCCESS,
            {"form_submission_id": str(form.id)},
        )

    await db.flush()
    return len(overdue_forms)        