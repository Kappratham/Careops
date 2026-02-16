import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import enum


class MessageDirection(str, enum.Enum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"


class MessageChannel(str, enum.Enum):
    EMAIL = "email"
    SMS = "sms"
    SYSTEM = "system"


class MessageSenderType(str, enum.Enum):
    CUSTOMER = "customer"
    STAFF = "staff"
    AUTOMATION = "automation"


class MessageStatus(str, enum.Enum):
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    PENDING = "pending"


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False
    )
    direction: Mapped[str] = mapped_column(
        SAEnum(MessageDirection, name="message_direction", create_constraint=True),
        nullable=False,
    )
    channel: Mapped[str] = mapped_column(
        SAEnum(MessageChannel, name="message_channel", create_constraint=True),
        default=MessageChannel.EMAIL,
        nullable=False,
    )
    sender_type: Mapped[str] = mapped_column(
        SAEnum(MessageSenderType, name="message_sender_type", create_constraint=True),
        nullable=False,
    )
    sender_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    subject: Mapped[str | None] = mapped_column(String(500), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        SAEnum(MessageStatus, name="message_status", create_constraint=True),
        default=MessageStatus.PENDING,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")