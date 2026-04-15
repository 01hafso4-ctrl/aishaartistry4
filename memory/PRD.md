# Henna Artistry - Product Requirements Document

## Original Problem Statement
Build a website for a henna business with prices, date, time and place. Norway-focused (kr currency, +47 phone). Includes customer-facing pages and a comprehensive admin dashboard.

## User Personas
- **Customers**: Browse services, view gallery, book appointments, contact business
- **Admin/Owner**: Manage bookings, messages, gallery, settings, services/prices

## Core Requirements
- Web-only website (not a downloadable app)
- Baby pink color theme
- Norwegian Kroner (kr) pricing
- Calendar-based booking system
- Admin dashboard with password protection

## Tech Stack
- Frontend: Expo Web (React Native Web) with expo-router
- Backend: FastAPI + MongoDB (Motor async)
- Auth: Simple password-based admin login

## Architecture
```
app/
├── backend/
│   ├── .env (MONGO_URL, DB_NAME, ADMIN_PASSWORD)
│   ├── requirements.txt
│   └── server.py
├── frontend/
│   ├── .env (EXPO_PUBLIC_BACKEND_URL, etc.)
│   ├── app/
│   │   ├── _layout.tsx (Top nav bar)
│   │   ├── index.tsx (Home)
│   │   ├── services.tsx
│   │   ├── gallery.tsx
│   │   ├── book.tsx (Calendar booking)
│   │   ├── contact.tsx
│   │   └── admin.tsx (Protected admin dashboard)
│   └── package.json
```

## DB Schema
- `services`: {id, name, description, size, price, duration_minutes, image_url, is_active}
- `bookings`: {id, customer_name, customer_email, customer_phone, service_id, service_name, is_custom_quote, custom_description, booking_date, booking_time, location_type, location_address, notes, status, admin_notes}
- `contacts`: {id, name, email, phone, message, is_read}
- `settings`: {id, business_name, tagline, phone, email, instagram, studio_address, about_text}
- `gallery`: {id, image_url, title, is_active}
- `availability`: {id, day_of_week, start_time, end_time, is_available}

## API Endpoints
- POST /api/admin/login — Admin authentication
- GET/POST /api/services, PATCH /api/services/{id}, DELETE /api/services/{id}
- GET /api/services/all
- GET/POST /api/bookings, PATCH /api/bookings/{id}
- GET/POST /api/contacts, PATCH /api/contacts/{id}/read
- GET/PATCH /api/settings
- GET/POST /api/availability, POST /api/availability/bulk
- GET/POST /api/gallery, DELETE /api/gallery/{id}
- POST /api/seed

## What's Been Implemented (Complete)
- [x] Full-stack setup (FastAPI + Expo + MongoDB)
- [x] Customer pages: Home, Services, Gallery, Book Now, Contact
- [x] Admin Dashboard: Bookings, Messages, Gallery, Settings, Prices
- [x] Web-style top navigation bar
- [x] Calendar-based booking with availability checks
- [x] Norway-focused: kr currency, +47 phone, @aishaartistry4 Instagram
- [x] Baby pink color theme (#D4688A primary)
- [x] Admin password protection (password: henna2024)
- [x] Mobile responsive design with hamburger menu

## Admin Credentials
- Password: henna2024 (configurable via ADMIN_PASSWORD in backend/.env)

## Backlog / Future Tasks
- P1: Email notifications for new bookings
- P2: SEO improvements for the website
- P2: Further desktop layout optimizations for large screens
- P3: Admin password change from within dashboard
