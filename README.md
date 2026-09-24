# QuickStay — Hotel Booking Platform

QuickStay is a full-stack hotel booking platform built with React, Node.js, Express and MongoDB. It supports customer bookings, real date-based availability, secure Stripe checkout, reviews, hotel-owner management and responsive UI.

## Features

- Clerk authentication and protected routes
- Hotel registration and management
- Room creation, editing, deletion and availability control
- Cloudinary room image uploads
- Destination/date/guest search
- Real server-side room availability checks
- Guest capacity validation
- Booking creation, editing and cancellation
- My Bookings
- Stripe Checkout and verified webhooks
- Idempotent payment processing
- Booking confirmation email support
- Hotel ratings and reviews
- Owner dashboard and booking management
- Responsive mobile/tablet/desktop UI

## Tech stack

Frontend: React, Vite, React Router, Tailwind CSS, Clerk, Axios, React Hot Toast

Backend: Node.js, Express, MongoDB/Mongoose, Clerk Express, Cloudinary, Stripe, Nodemailer

## Local setup

### Backend

```bash
cd server
npm install
cp .env.example .env
npm start
```

### Frontend

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Set the environment variables from the examples before starting the application.

## Required services

- MongoDB Atlas
- Clerk
- Cloudinary
- Stripe
- SMTP-compatible email provider

Stripe webhooks must point to:

`/api/stripe`

Clerk webhooks must point to:

`/api/clerk`

Use the public deployed backend URL for production webhook configuration.

## Important security notes

Never commit `.env` files or real API keys. Prices, availability and payment state are validated on the backend. Stripe payment status is changed only from a verified webhook.

## Deployment

Deploy the backend and frontend separately. Set the production environment variables in the hosting provider, update `CLIENT_URL` and `VITE_BACKEND_URL`, and configure Clerk and Stripe webhook URLs for the production domains.

## CRUD resources

The application provides domain-appropriate CRUD operations for:

1. Hotels
2. Rooms
3. Bookings
4. Reviews
5. User profile data

Paid bookings are deliberately protected from destructive modification; cancellation/refund rules are handled as business operations instead of exposing unsafe arbitrary deletion.
