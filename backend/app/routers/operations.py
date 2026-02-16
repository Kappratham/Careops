from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.schemas import (
    ContactResponse, ContactListResponse, ContactCreate, ContactUpdate,
    ConversationResponse, ConversationListResponse, ConversationDetailResponse,
    MessageCreate, MessageResponse,
    ServiceCreate, ServiceUpdate, ServiceResponse, ServiceListResponse,
    AvailabilitySlotCreate, AvailabilitySlotResponse,
    BookingResponse, BookingListResponse, BookingStatusUpdate,
)
from app.services.services import (
    create_contact, get_contacts, get_contact,
    get_conversations, get_conversation_detail, send_message,
    create_service, get_services, get_service, update_service, delete_service,
    get_bookings, get_booking, update_booking_status,
)
from app.utils.deps import get_current_user, get_current_owner
from datetime import date
from typing import Optional
import uuid

router = APIRouter()


# ============================================================
# CONTACTS
# ============================================================

@router.get("/contacts", response_model=ContactListResponse)
async def list_contacts(
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.workspace_id:
        raise HTTPException(status_code=404, detail="No workspace found")

    contacts = await get_contacts(db, current_user.workspace_id, search)
    return ContactListResponse(
        contacts=[ContactResponse.model_validate(c) for c in contacts],
        total=len(contacts),
    )


@router.get("/contacts/{contact_id}", response_model=ContactResponse)
async def get_contact_detail(
    contact_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contact = await get_contact(db, uuid.UUID(contact_id))
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return ContactResponse.model_validate(contact)


@router.post("/contacts", response_model=ContactResponse)
async def create_contact_endpoint(
    data: ContactCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.workspace_id:
        raise HTTPException(status_code=404, detail="No workspace found")

    contact = await create_contact(
        db, current_user.workspace_id, data.name, data.email, data.phone, data.source, data.notes
    )
    return ContactResponse.model_validate(contact)


# ============================================================
# CONVERSATIONS (INBOX)
# ============================================================

@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.workspace_id:
        raise HTTPException(status_code=404, detail="No workspace found")

    conversations = await get_conversations(db, current_user.workspace_id)
    return ConversationListResponse(
        conversations=[ConversationResponse(**c) for c in conversations],
        total=len(conversations),
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    detail = await get_conversation_detail(db, uuid.UUID(conversation_id))
    if not detail:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ConversationDetailResponse(**detail)


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def send_reply(
    conversation_id: str,
    data: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    message = await send_message(
        db, uuid.UUID(conversation_id), current_user.id,
        data.content, data.channel, data.subject
    )
    return MessageResponse.model_validate(message)


# ============================================================
# SERVICES
# ============================================================

@router.post("/services", response_model=ServiceResponse)
async def create_service_endpoint(
    data: ServiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_owner),
):
    if not current_user.workspace_id:
        raise HTTPException(status_code=404, detail="No workspace found")

    service = await create_service(db, current_user.workspace_id, data.model_dump())
    # Reload with slots
    service = await get_service(db, service.id)
    return ServiceResponse.model_validate(service)


@router.get("/services", response_model=ServiceListResponse)
async def list_services(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.workspace_id:
        raise HTTPException(status_code=404, detail="No workspace found")

    services = await get_services(db, current_user.workspace_id)
    return ServiceListResponse(
        services=[ServiceResponse.model_validate(s) for s in services],
        total=len(services),
    )


@router.get("/services/{service_id}", response_model=ServiceResponse)
async def get_service_endpoint(
    service_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = await get_service(db, uuid.UUID(service_id))
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return ServiceResponse.model_validate(service)


@router.put("/services/{service_id}", response_model=ServiceResponse)
async def update_service_endpoint(
    service_id: str,
    data: ServiceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_owner),
):
    service = await get_service(db, uuid.UUID(service_id))
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    updated = await update_service(db, service, data.model_dump(exclude_unset=True))
    updated = await get_service(db, updated.id)
    return ServiceResponse.model_validate(updated)


@router.delete("/services/{service_id}")
async def delete_service_endpoint(
    service_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_owner),
):
    service = await get_service(db, uuid.UUID(service_id))
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    await delete_service(db, service)
    return {"message": "Service deleted"}


# ============================================================
# BOOKINGS
# ============================================================

@router.get("/bookings", response_model=BookingListResponse)
async def list_bookings(
    status: Optional[str] = None,
    date: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.workspace_id:
        raise HTTPException(status_code=404, detail="No workspace found")

    from datetime import date as date_type
    date_filter = None
    if date:
        date_filter = date_type.fromisoformat(date)

    bookings = await get_bookings(db, current_user.workspace_id, status, date_filter)
    return BookingListResponse(
        bookings=[BookingResponse(**b) for b in bookings],
        total=len(bookings),
    )


@router.get("/bookings/{booking_id}", response_model=BookingResponse)
async def get_booking_detail(
    booking_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = await get_booking(db, uuid.UUID(booking_id))
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return BookingResponse(**booking)


@router.put("/bookings/{booking_id}/status", response_model=BookingResponse)
async def update_booking(
    booking_id: str,
    data: BookingStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = await update_booking_status(db, uuid.UUID(booking_id), data.status)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking_data = await get_booking(db, uuid.UUID(booking_id))
    return BookingResponse(**booking_data)