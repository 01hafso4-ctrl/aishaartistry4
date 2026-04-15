from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class ServiceSize(str, Enum):
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"
    BRIDAL = "bridal"
    CUSTOM = "custom"

class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"
    COMPLETED = "completed"

class LocationType(str, Enum):
    STUDIO = "studio"
    MOBILE = "mobile"

# Models
class Service(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    size: ServiceSize
    price: float
    duration_minutes: int
    image_url: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ServiceCreate(BaseModel):
    name: str
    description: str
    size: ServiceSize
    price: float
    duration_minutes: int
    image_url: Optional[str] = None

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    duration_minutes: Optional[int] = None

class GalleryItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    image_base64: str
    category: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GalleryItemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    image_base64: str
    category: Optional[str] = None

class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    customer_email: str
    customer_phone: str
    service_id: Optional[str] = None
    service_name: Optional[str] = None
    is_custom_quote: bool = False
    custom_description: Optional[str] = None
    preferred_date: str
    preferred_time: str
    location_type: LocationType
    location_address: Optional[str] = None
    notes: Optional[str] = None
    status: BookingStatus = BookingStatus.PENDING
    admin_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class BookingCreate(BaseModel):
    customer_name: str
    customer_email: str
    customer_phone: str
    service_id: Optional[str] = None
    service_name: Optional[str] = None
    is_custom_quote: bool = False
    custom_description: Optional[str] = None
    preferred_date: str
    preferred_time: str
    location_type: LocationType
    location_address: Optional[str] = None
    notes: Optional[str] = None

class BookingUpdate(BaseModel):
    status: Optional[BookingStatus] = None
    admin_notes: Optional[str] = None

class Contact(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: Optional[str] = None
    message: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ContactCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    message: str

class Availability(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    day_of_week: int  # 0=Sunday, 6=Saturday
    start_time: str  # "09:00"
    end_time: str  # "18:00"
    is_available: bool = True

class AvailabilityCreate(BaseModel):
    day_of_week: int
    start_time: str
    end_time: str
    is_available: bool = True

class BusinessSettings(BaseModel):
    id: str = "main_settings"
    business_name: str = "Henna by Artist"
    tagline: str = "Beautiful Henna Art for Every Occasion"
    phone: str = ""
    email: str = ""
    instagram: str = ""
    studio_address: str = ""
    about_text: str = ""
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class BusinessSettingsUpdate(BaseModel):
    business_name: Optional[str] = None
    tagline: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    instagram: Optional[str] = None
    studio_address: Optional[str] = None
    about_text: Optional[str] = None

class AdminLogin(BaseModel):
    password: str

class AdminPasswordChange(BaseModel):
    current_password: str
    new_password: str

# Routes

@api_router.get("/")
async def root():
    return {"message": "Henna Business API"}

# Helper to get admin password from DB (falls back to env)
async def get_admin_password():
    record = await db.admin_auth.find_one({"id": "admin_password"})
    if record:
        return record["password"]
    # Seed from env on first use
    env_pw = os.environ.get('ADMIN_PASSWORD')
    await db.admin_auth.insert_one({"id": "admin_password", "password": env_pw})
    return env_pw

# Admin Login
@api_router.post("/admin/login")
async def admin_login(login: AdminLogin):
    admin_password = await get_admin_password()
    if login.password == admin_password:
        return {"success": True}
    raise HTTPException(status_code=401, detail="Invalid password")

# Admin Change Password
@api_router.patch("/admin/password")
async def change_admin_password(data: AdminPasswordChange):
    current_pw = await get_admin_password()
    if data.current_password != current_pw:
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    await db.admin_auth.update_one(
        {"id": "admin_password"},
        {"$set": {"password": data.new_password}},
        upsert=True
    )
    return {"success": True, "message": "Password updated successfully"}

# Services Routes
@api_router.get("/services", response_model=List[Service])
async def get_services():
    services = await db.services.find({"is_active": True}).to_list(100)
    return [Service(**service) for service in services]

@api_router.get("/services/all", response_model=List[Service])
async def get_all_services():
    services = await db.services.find().to_list(100)
    return [Service(**service) for service in services]

@api_router.post("/services", response_model=Service)
async def create_service(service: ServiceCreate):
    service_obj = Service(**service.dict())
    await db.services.insert_one(service_obj.dict())
    return service_obj

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str):
    result = await db.services.delete_one({"id": service_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service deleted"}

@api_router.patch("/services/{service_id}", response_model=Service)
async def update_service(service_id: str, update: ServiceUpdate):
    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.services.find_one_and_update(
        {"id": service_id},
        {"$set": update_dict},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Service not found")
    return Service(**result)

# Gallery Routes
@api_router.get("/gallery", response_model=List[GalleryItem])
async def get_gallery():
    items = await db.gallery.find().sort("created_at", -1).to_list(100)
    return [GalleryItem(**item) for item in items]

@api_router.post("/gallery", response_model=GalleryItem)
async def create_gallery_item(item: GalleryItemCreate):
    item_obj = GalleryItem(**item.dict())
    await db.gallery.insert_one(item_obj.dict())
    return item_obj

@api_router.delete("/gallery/{item_id}")
async def delete_gallery_item(item_id: str):
    result = await db.gallery.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    return {"message": "Gallery item deleted"}

# Booking Routes
@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings():
    bookings = await db.bookings.find().sort("created_at", -1).to_list(1000)
    return [Booking(**booking) for booking in bookings]

@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking: BookingCreate):
    booking_obj = Booking(**booking.dict())
    await db.bookings.insert_one(booking_obj.dict())
    return booking_obj

@api_router.patch("/bookings/{booking_id}", response_model=Booking)
async def update_booking(booking_id: str, update: BookingUpdate):
    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    
    result = await db.bookings.find_one_and_update(
        {"id": booking_id},
        {"$set": update_dict},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Booking not found")
    return Booking(**result)

# Contact Routes
@api_router.get("/contacts", response_model=List[Contact])
async def get_contacts():
    contacts = await db.contacts.find().sort("created_at", -1).to_list(1000)
    return [Contact(**contact) for contact in contacts]

@api_router.post("/contacts", response_model=Contact)
async def create_contact(contact: ContactCreate):
    contact_obj = Contact(**contact.dict())
    await db.contacts.insert_one(contact_obj.dict())
    return contact_obj

@api_router.patch("/contacts/{contact_id}/read")
async def mark_contact_read(contact_id: str):
    result = await db.contacts.update_one(
        {"id": contact_id},
        {"$set": {"is_read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Contact marked as read"}

# Availability Routes
@api_router.get("/availability", response_model=List[Availability])
async def get_availability():
    availability = await db.availability.find().sort("day_of_week", 1).to_list(7)
    return [Availability(**item) for item in availability]

@api_router.post("/availability", response_model=Availability)
async def create_availability(availability: AvailabilityCreate):
    # Remove existing availability for this day
    await db.availability.delete_many({"day_of_week": availability.day_of_week})
    
    availability_obj = Availability(**availability.dict())
    await db.availability.insert_one(availability_obj.dict())
    return availability_obj

@api_router.post("/availability/bulk", response_model=List[Availability])
async def set_bulk_availability(availabilities: List[AvailabilityCreate]):
    result = []
    for avail in availabilities:
        await db.availability.delete_many({"day_of_week": avail.day_of_week})
        avail_obj = Availability(**avail.dict())
        await db.availability.insert_one(avail_obj.dict())
        result.append(avail_obj)
    return result

# Business Settings Routes
@api_router.get("/settings", response_model=BusinessSettings)
async def get_settings():
    settings = await db.settings.find_one({"id": "main_settings"})
    if not settings:
        # Create default settings
        default_settings = BusinessSettings()
        await db.settings.insert_one(default_settings.dict())
        return default_settings
    return BusinessSettings(**settings)

@api_router.patch("/settings", response_model=BusinessSettings)
async def update_settings(update: BusinessSettingsUpdate):
    update_dict = {k: v for k, v in update.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    
    result = await db.settings.find_one_and_update(
        {"id": "main_settings"},
        {"$set": update_dict},
        upsert=True,
        return_document=True
    )
    return BusinessSettings(**result)

# Seed default services
@api_router.post("/seed")
async def seed_data():
    # Check if already seeded
    existing = await db.services.find_one()
    if existing:
        return {"message": "Data already seeded"}
    
    default_services = [
        {
            "name": "Small Hand Design",
            "description": "Beautiful minimalist henna design. Perfect for beginners or casual occasions.",
            "size": "small",
            "price": 100.00,
            "duration_minutes": 30,
        },
        {
            "name": "Medium Hand Design",
            "description": "Intricate design covering the front of one hand. Great for parties and events.",
            "size": "medium",
            "price": 150.00,
            "duration_minutes": 45,
        },
        {
            "name": "Feet Henna",
            "description": "Beautiful henna design on one foot. Perfect for weddings and summer occasions.",
            "size": "medium",
            "price": 150.00,
            "duration_minutes": 45,
        },
        {
            "name": "Bridal Package",
            "description": "Complete bridal henna — hands, arms, legs, chest and back. Includes consultation and custom design.",
            "size": "bridal",
            "price": 2000.00,
            "duration_minutes": 300,
        },
        {
            "name": "Custom Quote",
            "description": "Have something special in mind? Request a custom quote. Additional designs start from 100–150 kr.",
            "size": "custom",
            "price": 0.00,
            "duration_minutes": 0,
        },
    ]
    
    for service_data in default_services:
        service = Service(**service_data)
        await db.services.insert_one(service.dict())
    
    # Seed default availability (Mon-Sat 10am-6pm)
    for day in range(1, 7):  # Monday to Saturday
        avail = Availability(
            day_of_week=day,
            start_time="10:00",
            end_time="18:00",
            is_available=True
        )
        await db.availability.insert_one(avail.dict())
    
    # Sunday closed
    sunday = Availability(
        day_of_week=0,
        start_time="00:00",
        end_time="00:00",
        is_available=False
    )
    await db.availability.insert_one(sunday.dict())
    
    # Seed default settings
    settings = BusinessSettings(
        business_name="Henna Artistry",
        tagline="Beautiful Henna Art for Every Occasion",
        phone="46655648",
        email="hello@hennaartistry.com",
        instagram="@aishaartistry4",
        studio_address="123 Beauty Lane, Suite 100",
        about_text="Welcome to Henna Artistry! I am a passionate henna artist with over 5 years of experience creating beautiful, intricate designs for weddings, parties, and special occasions. I offer both studio appointments and mobile services to make your henna experience convenient and memorable."
    )
    await db.settings.insert_one(settings.dict())
    
    return {"message": "Data seeded successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
