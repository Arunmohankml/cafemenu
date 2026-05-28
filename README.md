# QR Cafe Menu Template ☕📱

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38BDF8)
![Firebase](https://img.shields.io/badge/Firebase-Auth-orange)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![Razorpay](https://img.shields.io/badge/Razorpay-Payments-02042B)
![Admin Panel](https://img.shields.io/badge/Admin-Panel-purple)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

A modern QR-based cafe menu and ordering system built with **Next.js, TypeScript, Firebase, Supabase, and Razorpay**.

This project is designed as a ready-to-use template for cafes, restaurants, cloud kitchens, food courts, and small food businesses that want a digital menu system where customers can scan a QR code, browse menu items, place orders, and optionally make payments online.

## Overview

QR Cafe Menu Template allows customers to order food directly from their table using a QR code. Each table can have a unique menu/order page, while cafe staff can manage orders from a dedicated admin dashboard.

The system includes customer ordering, admin order management, authentication, payment integration, and database support.

## Features

* QR-based table ordering system
* Modern customer menu interface
* Table-specific order pages
* Cart and checkout flow
* Razorpay payment integration
* Admin dashboard
* Order status management
* Firebase authentication
* Supabase database support
* Staff/admin account handling
* Responsive mobile-first design
* Toast notifications
* PDF/invoice support
* Mock/local fallback support for development

## Tech Stack

### Frontend

* Next.js 14
* TypeScript
* Tailwind CSS
* Framer Motion
* Lucide React Icons
* React Hot Toast

### Backend / API

* Next.js API Routes
* Server Route Handlers
* Firebase Admin SDK
* Supabase Client

### Authentication

* Firebase Auth
* Firebase Admin Session Cookies
* Supabase Auth Helpers

### Database

* Supabase
* PostgreSQL

### Payments

* Razorpay

### State & Utilities

* Zustand
* SWR
* CLSX
* Tailwind Merge
* jsPDF
* jsPDF AutoTable

## How It Works

### Customer Flow

1. Customer scans the QR code on their table.
2. The QR opens a table-specific menu page.
3. Customer browses available food items.
4. Customer adds items to cart.
5. Customer places the order.
6. Customer can pay online using Razorpay or choose counter payment if enabled.
7. Order appears in the admin dashboard.

### Admin Flow

1. Admin logs in securely.
2. Admin views incoming orders.
3. Admin updates order status.
4. Admin manages menu items, tables, and accounts.
5. Staff can track order progress in real time.

## Project Structure

```bash
src/
├── app/
│   ├── admin/
│   ├── api/
│   │   ├── auth/
│   │   └── orders/
│   ├── auth/
│   ├── table/
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── AdminSidebar.tsx
│   ├── CartDrawer.tsx
│   ├── CustomerCart.tsx
│   └── MenuItemCard.tsx
│
├── lib/
│   ├── auth-context.tsx
│   ├── firebase.ts
│   ├── firebase-admin.ts
│   ├── supabase.ts
│   ├── store.ts
│   └── utils.ts
```

## Main Modules

### Customer Menu

A clean, mobile-friendly menu page where customers can view items, add products to cart, and place orders.

### Admin Dashboard

A secure dashboard for cafe owners or staff to manage orders, update order statuses, and control business operations.

### Authentication

Firebase Auth is used for client-side sign-in, while Firebase Admin SDK handles secure session cookies on the server.

### Database

Supabase is used for storing app data such as profiles, menu items, orders, and account-related records.

### Payments

Razorpay integration allows online payment collection directly from the ordering flow.

## Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

## Installation

Clone the repository:

```bash
git clone https://github.com/your-username/qr-cafe-menu-template.git
```

Move into the project folder:

```bash
cd qr-cafe-menu-template
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open the app:

```bash
http://localhost:3000
```

## Build for Production

```bash
npm run build
```

Start production server:

```bash
npm start
```

## Use Cases

* Cafes
* Restaurants
* Cloud kitchens
* Food courts
* Juice shops
* Bakeries
* Small hotels
* College canteens
* QR menu startups

## Future Improvements

* Real-time order updates
* Kitchen display system
* Table reservation module
* Coupon and offer system
* Inventory tracking
* Multi-branch support
* Staff role permissions
* WhatsApp order notifications
* Sales analytics dashboard
* Customer feedback system

## Topics

`nextjs` `typescript` `tailwindcss` `firebase` `supabase` `razorpay` `qr-menu` `cafe-menu` `restaurant-management` `food-ordering` `admin-dashboard` `full-stack` `saas-template` `web-app`

## Author

Developed by **Arun Mohan**

* GitHub: [Arunmohankml](https://github.com/Arunmohankml)
* Portfolio: [arunmohankml.github.io/portfolio](https://arunmohankml.github.io/portfolio/)

## License

This project is open-source and available under the MIT License.
