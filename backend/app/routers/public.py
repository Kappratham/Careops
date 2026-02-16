from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas import (
    PublicContactSubmit,
    PublicBookingCreate, BookingConfirmationResponse,
    AvailableSlotsResponse, TimeSlotResponse,
    ServiceResponse, ServiceListResponse,
    PublicFormResponse, PublicFormSubmit,
)
from app.services.services import (
    get_workspace_by_slug,
    create_contact, create_conversation,
    get_services, get_service, get_available_slots,
    create_booking,
    get_public_form, submit_public_form,
    send_email, log_automation,
)
from app.models.automation_log import AutomationStatus
from datetime import date

router = APIRouter()


@router.get("/{slug}/services")
async def get_public_services(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    workspace = await get_workspace_by_slug(db, slug)
    if not workspace:
        raise HTTPException(status_code=404, detail="Business not found")

    services = await get_services(db, workspace.id)
    active_services = [s for s in services if s.is_active]

    return {
        "business_name": workspace.name,
        "services": [
            {
                "id": str(s.id),
                "name": s.name,
                "description": s.description,
                "duration_minutes": s.duration_minutes,
                "price": float(s.price) if s.price else None,
                "location_type": s.location_type,
                "address": s.address,
            }
            for s in active_services
        ],
    }


@router.get("/{slug}/slots/{service_id}")
async def get_public_slots(
    slug: str,
    service_id: str,
    target_date: str,
    db: AsyncSession = Depends(get_db),
):
    workspace = await get_workspace_by_slug(db, slug)
    if not workspace:
        raise HTTPException(status_code=404, detail="Business not found")

    import uuid
    service = await get_service(db, uuid.UUID(service_id))
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    d = date.fromisoformat(target_date)
    slots = await get_available_slots(db, uuid.UUID(service_id), d)

    return AvailableSlotsResponse(
        service_id=service.id,
        service_name=service.name,
        duration_minutes=service.duration_minutes,
        date=target_date,
        slots=[TimeSlotResponse(**s) for s in slots],
    )


@router.post("/{slug}/contact")
async def submit_contact_form(
    slug: str,
    data: PublicContactSubmit,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    workspace = await get_workspace_by_slug(db, slug)
    if not workspace:
        raise HTTPException(status_code=404, detail="Business not found")

    # Create contact
    contact = await create_contact(
        db, workspace.id, data.name, data.email, data.phone, "contact_form"
    )

    # Create conversation with initial message
    conversation = await create_conversation(
        db, workspace.id, contact.id,
        subject=f"New inquiry from {data.name}",
        initial_message=data.message or f"New contact form submission from {data.name}",
    )

    # Log automation
    await log_automation(
        db, workspace.id, "new_contact", "create_contact_and_conversation",
        AutomationStatus.SUCCESS,
        {"contact_name": data.name, "contact_email": data.email},
        contact_id=contact.id,
    )

    # Send welcome email in background
    if data.email and workspace.welcome_message_template:
        background_tasks.add_task(
            send_email,
            data.email,
            f"Welcome from {workspace.name}!",
            workspace.welcome_message_template,
            workspace.id,
            db,
        )

    return {
        "message": "Thank you! We will be in touch soon.",
        "contact_id": str(contact.id),
    }


@router.post("/{slug}/book", response_model=BookingConfirmationResponse)
async def create_public_booking(
    slug: str,
    data: PublicBookingCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    workspace = await get_workspace_by_slug(db, slug)
    if not workspace:
        raise HTTPException(status_code=404, detail="Business not found")

    service = await get_service(db, data.service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    # Verify slot is available
    slots = await get_available_slots(db, data.service_id, data.booking_date)
    slot_available = any(s["start_time"] == data.start_time for s in slots)
    if not slot_available:
        raise HTTPException(status_code=400, detail="Selected time slot is no longer available")

    try:
        booking = await create_booking(db, workspace.id, data.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Create conversation for new booking
    contact = await create_contact(
        db, workspace.id,
        name=data.customer_name,
        email=data.customer_email,
        phone=data.customer_phone,
        source="booking",
    )

    await create_conversation(
        db, workspace.id, contact.id,
        subject=f"Booking: {service.name} on {data.booking_date}",
        initial_message=f"New booking for {service.name} on {data.booking_date} at {data.start_time}",
    )

    # Send confirmation email in background
    if data.customer_email:
        background_tasks.add_task(
            send_email,
            data.customer_email,
            f"Booking Confirmed - {service.name}",
            f"""
            <h2>Booking Confirmed!</h2>
            <p>Hi {data.customer_name},</p>
            <p>Your booking has been confirmed:</p>
            <ul>
                <li><strong>Service:</strong> {service.name}</li>
                <li><strong>Date:</strong> {data.booking_date}</li>
                <li><strong>Time:</strong> {data.start_time}</li>
                <li><strong>Duration:</strong> {service.duration_minutes} minutes</li>
            </ul>
            <p>Thank you for choosing {workspace.name}!</p>
            """,
            workspace.id,
            db,
        )

    from app.utils.helpers import calculate_end_time
    from datetime import time
    start = time.fromisoformat(data.start_time)
    end = calculate_end_time(start, service.duration_minutes)

    return BookingConfirmationResponse(
        booking_id=booking.id,
        service_name=service.name,
        booking_date=data.booking_date,
        start_time=data.start_time,
        end_time=end.isoformat(),
        status=booking.status,
    )


@router.get("/forms/{token}", response_model=PublicFormResponse)
async def get_form(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    form_data = await get_public_form(db, token)
    if not form_data:
        raise HTTPException(status_code=404, detail="Form not found or already submitted")
    return PublicFormResponse(**form_data)


@router.post("/forms/{token}")
async def submit_form(
    token: str,
    data: PublicFormSubmit,
    db: AsyncSession = Depends(get_db),
):
    success = await submit_public_form(db, token, data.data)
    if not success:
        raise HTTPException(status_code=400, detail="Form not found or already submitted")
    return {"message": "Form submitted successfully!"}