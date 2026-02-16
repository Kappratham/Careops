import re
import uuid
from datetime import datetime, date, time, timedelta
from typing import Optional


def generate_slug(name: str) -> str:
    """Convert business name to URL-safe slug"""
    slug = name.lower().strip()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = slug.strip('-')
    # Add short unique suffix to prevent collisions
    suffix = uuid.uuid4().hex[:6]
    return f"{slug}-{suffix}"


def generate_token() -> str:
    """Generate a unique token for public form links"""
    return str(uuid.uuid4())


def combine_date_time(d: date, t: time) -> datetime:
    """Combine date and time into datetime"""
    return datetime.combine(d, t)


def calculate_end_time(start: time, duration_minutes: int) -> time:
    """Calculate end time from start time and duration"""
    start_dt = datetime.combine(date.today(), start)
    end_dt = start_dt + timedelta(minutes=duration_minutes)
    return end_dt.time()


def time_slots(
    start: time,
    end: time,
    duration_minutes: int,
    buffer_minutes: int = 0
) -> list[dict]:
    """Generate available time slots between start and end"""
    slots = []
    current = datetime.combine(date.today(), start)
    end_dt = datetime.combine(date.today(), end)
    slot_duration = timedelta(minutes=duration_minutes + buffer_minutes)

    while current + timedelta(minutes=duration_minutes) <= end_dt:
        slot_end = current + timedelta(minutes=duration_minutes)
        slots.append({
            "start_time": current.time().isoformat(),
            "end_time": slot_end.time().isoformat(),
        })
        current += slot_duration

    return slots


def format_datetime(dt: Optional[datetime]) -> Optional[str]:
    """Format datetime to ISO string"""
    if dt is None:
        return None
    return dt.isoformat()