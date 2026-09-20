# Daily Mart Super Market

A production-ready grocery e-commerce website and administration system built for **Daily Mart Super Market**.

The platform allows customers to browse the store catalogue, search products, select product variants or quantities, add products to cart, calculate delivery charges, and submit orders through WhatsApp.

The system also includes a protected admin panel for managing products, categories, promotional sliders, store settings, pricing, variants, images, and bulk catalogue imports.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Live Project](#live-project)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Main Features](#main-features)
- [Customer Website](#customer-website)
- [Product Management](#product-management)
- [Product Variants](#product-variants)
- [Type-Based Pricing](#type-based-pricing)
- [Cart and Checkout](#cart-and-checkout)
- [Delivery Charges](#delivery-charges)
- [WhatsApp Ordering](#whatsapp-ordering)
- [Admin Panel](#admin-panel)
- [CSV Bulk Import](#csv-bulk-import)
- [Image Management](#image-management)
- [Store Settings](#store-settings)
- [Authentication and Security](#authentication-and-security)
- [SEO and Discoverability](#seo-and-discoverability)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Local Development Setup](#local-development-setup)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Production Services](#production-services)
- [Features Not Included](#features-not-included)
- [Business Responsibilities](#business-responsibilities)
- [Maintenance and Support](#maintenance-and-support)
- [Security Guidelines](#security-guidelines)
- [Ownership and Handover](#ownership-and-handover)
- [Project Delivery](#project-delivery)
- [License and Usage](#license-and-usage)

---

# Project Overview

**Daily Mart Super Market** is a full-stack grocery e-commerce platform developed to provide customers with an easy way to browse products and place orders online.

The platform provides:

- Customer-facing grocery catalogue
- Product search
- Departments and categories
- Product detail pages
- Standard product variants
- Type-based product pricing
- Quantity and size selection
- Shopping cart
- Checkout
- Delivery charge calculation
- WhatsApp-based order submission
- Protected admin panel
- Product management
- Category management
- Hero slider management
- Store configuration
- CSV bulk product import
- Cloudinary image management
- Responsive design
- Production deployment

---

# Live Project

## Customer Website

https://www.dailymartsupermarket.in/

## Admin Panel

https://www.dailymartsupermarket.in/admin

## Backend API

https://karle-daily-mart-api.onrender.com

## Health Check

https://karle-daily-mart-api.onrender.com/health

---

# Technology Stack

## Frontend

- React
- Vite
- React Router
- CSS
- JavaScript
- Responsive UI

## Backend

- Node.js
- Express.js
- JavaScript
- REST API

## Database

- MongoDB
- MongoDB Atlas
- Mongoose

## Image Storage

- Cloudinary

## Hosting

- Vercel — Frontend
- Render — Backend
- MongoDB Atlas — Database
- Cloudinary — Image storage and delivery
- Hostinger — Domain

## Monitoring

- UptimeRobot

## Ordering

- WhatsApp-based order submission

## Source Control

- Git
- GitHub

---

# Architecture

The application follows a separate frontend/backend architecture.

```text
                    CUSTOMER
                       |
                       v
        +-----------------------------+
        |       React + Vite          |
        |         Frontend            |
        |          Vercel             |
        +-------------+---------------+
                      |
                      | REST API
                      v
        +-----------------------------+
        |      Node.js + Express      |
        |          Backend            |
        |           Render            |
        +-------------+---------------+
                      |
          +-----------+-----------+
          |                       |
          v                       v
+-------------------+   +-------------------+
|   MongoDB Atlas   |   |    Cloudinary     |
|     Database      |   |  Product Images   |
+-------------------+   +-------------------+

Main Features
Customer Features
Responsive homepage
Hero slider
Department navigation
Category navigation
Product catalogue
Product search
Product details
Product pricing
MRP and discount display
Product variants
Type-based products
Quantity/size selection
Shopping cart
Cart quantity management
Checkout
Delivery charge calculation
Order summary
Savings calculation
WhatsApp order submission
Customer Website

The customer-facing website allows users to browse the Daily Mart Super Market catalogue without requiring a customer account.

Customers can:

Open the website.
Browse departments.
Browse categories.
Search for products.
Open product details.
Select required product options.
Add products to cart.
Review the cart.
Enter delivery information.
View order total and delivery charges.
Submit the order through WhatsApp.

No customer registration or login is required.

Departments

The store catalogue supports the following main departments:

Grocery & Kitchen
Snacks & Drinks
Beauty & Personal Care
Household Essentials

Products can be organized into appropriate categories and departments through the catalogue management system.

Product Management

The admin panel allows authorized administrators to manage the product catalogue.

Administrators can:

Add products
Edit products
Activate products
Deactivate products
Update product names
Update prices
Update MRP
Update descriptions
Assign categories
Add barcodes
Upload product images
Configure product variants
Configure type-based pricing
Product Data

A standard product can contain information such as:

Product Name
Price
MRP
Category
Description
Barcode
Image
Variants
Status

The product price displayed to customers is based on the configured product pricing.

Product Variants

Standard products can have multiple variants/sizes.

Supported units:

g
kg
ml
l
pcs

Example:

Product: Sugar

500 g  → ₹30
1 kg   → ₹58
2 kg   → ₹112

The customer selects the required variant before adding the product to the cart.

Products that require a selection are shown with a Select options action instead of being directly added to the cart.

Type-Based Pricing

The platform supports products where different product types have their own sizes and prices.

Example:

Product
|
+-- Kolam Rice
|    |
|    +-- 250 g → ₹35
|    +-- 500 g → ₹70
|
+-- Basmati Rice
     |
     +-- 250 g → ₹45
     +-- 500 g → ₹85

Each type can contain multiple sizes.

The backend validates:

Type name
Size array
Unit
Amount
Selling price
MRP

Supported units:

g
kg
ml
l
pcs

Validation rules include:

Amount must be a positive number.
Selling price must be a valid non-negative number.
MRP is optional.
MRP must be a valid non-negative number when supplied.
MRP cannot be lower than the selling price.
Pricing and Discounts

The system supports:

Selling price
MRP
Discount percentage

Discount percentage is calculated using:

Discount % =
((MRP - Selling Price) / MRP) × 100

Discounts are displayed only when:

MRP > Selling Price

The checkout summary also calculates customer savings based on MRP versus selling price.

Delivery charges are not treated as customer savings.

Cart and Checkout

The cart supports:

Add to cart
Remove from cart
Increase quantity
Decrease quantity
Product variant information
Product type information
Subtotal calculation
MRP total
Discount calculation
Customer savings
Delivery charge
Final payable amount

The checkout collects:

Customer name
Indian mobile number
Delivery address

The mobile number is validated as an Indian 10-digit number.

Delivery Charges

Delivery charges are configurable through store settings.

Current business configuration:

Minimum Order Amount: ₹500

First Delivery Band:
₹500 – ₹750 → ₹20

Additional ₹500 bands:
+₹20 per band

Current intended delivery structure:

Order Amount	Delivery Charge
Below ₹500	Delivery not available under the configured minimum-order policy
₹500 – ₹750	₹20
₹751 – ₹1,250	₹40
₹1,251 – ₹1,750	₹60
₹1,751 – ₹2,250	₹80

The delivery system is configurable so that the business can modify the relevant settings from the admin panel.

Delivery Configuration

The system uses:

minimumOrderAmount
firstDeliveryBandAmount
chargePerAmount
chargePerAmountValue

Current values:

minimumOrderAmount = 500
firstDeliveryBandAmount = 750
chargePerAmount = 500
chargePerAmountValue = 20

The delivery calculation is based on the configured store settings.

WhatsApp Ordering

Orders are submitted through WhatsApp.

The customer:

Browse Products
      ↓
Add to Cart
      ↓
Checkout
      ↓
Enter Details
      ↓
Review Total
      ↓
Submit Order
      ↓
WhatsApp

The website prepares the order information and opens WhatsApp so the customer can submit the order.

The backend also records the order information according to the implemented order workflow.

Important Ordering Note

WhatsApp ordering is used instead of an integrated online payment gateway.

The website does not provide:

Online payment gateway
Customer account system
Advanced order tracking
Delivery staff application
Full order-status workflow

Payment and further order coordination are handled outside the website according to the store's business process.

Admin Panel

The admin panel is protected and intended only for authorized administrators.

Admin sections include:

Dashboard
Products
Categories
Hero Slider
Bulk Import
Store Settings
Change Password
Admin Dashboard

The dashboard provides an administrative overview of the system and provides access to catalogue and store management functions.

Product Administration

Administrators can:

Create products
Edit products
Activate products
Deactivate products
Update pricing
Update MRP
Manage categories
Manage descriptions
Manage barcodes
Upload images
Configure variants
Configure type-based products
Category Administration

Administrators can:

Add categories
Edit categories
Activate categories
Deactivate categories

Categories are used to organize products throughout the customer-facing catalogue.

Hero Slider

The admin panel supports management of homepage promotional sliders.

Administrators can:

Add slider/banner content
Edit slider content
Activate sliders
Deactivate sliders
Update promotional imagery
Store Settings

Store settings provide configuration for business-related behaviour.

Current supported delivery configuration includes:

Minimum order amount
First delivery band amount
Charge per additional amount
Charge value
Delivery enabled/disabled

These values can be changed through the admin panel when the business changes its delivery policy.

CSV Bulk Import

The platform supports bulk product catalogue import using CSV files.

This is useful for importing a large number of products from existing billing/catalogue software.

Supported product information can include:

Name
Barcode
Price
Category
Description

Additional product information can be configured through the admin panel where applicable.

Recommended CSV Workflow
Prepare CSV
    ↓
Verify column names
    ↓
Verify product data
    ↓
Import CSV
    ↓
Check imported products
    ↓
Verify prices/categories/images

Before a large import, always keep a copy of the original CSV file.

Image Management

Product images are stored and delivered using Cloudinary.

The system supports:

Product image uploads
Cloudinary-hosted images
Optimized image delivery
Image URLs stored with product records

Cloudinary credentials must be stored in environment variables and must never be committed to GitHub.

Authentication and Security

The admin panel is protected using backend authentication.

Security practices include:

Protected admin routes
Environment variables for secrets
No secrets committed to Git
HTTPS in production
Admin password management
Backend-side validation
Database validation
Secure credential handling

Passwords and secret keys are intentionally excluded from this README.

Admin Credentials

Admin credentials are not stored in this repository or README.

Admin credentials should be shared separately through a secure channel.

Current admin email:

dailymartsupermarket@gmail.com

After receiving access, the administrator should change the initial password.

SEO and Discoverability

The website includes SEO-related configuration and structured data.

Google Search Console has been configured for the production website.

The production website has:

Sitemap
Search engine metadata
Structured data
Search Console configuration
Responsive/mobile-friendly implementation

The homepage indexing status was verified during project deployment.

Search performance data may take time to accumulate after a new website is launched.

Deployment
Frontend

The React/Vite frontend is deployed using Vercel.

Production website:

https://www.dailymartsupermarket.in/

Vercel project:

https://vercel.com/suhaskarle1970-6895/karle-daily-mart

Backend

The Node.js/Express backend is deployed using Render.

Backend API:

https://karle-daily-mart-api.onrender.com

Health endpoint:

https://karle-daily-mart-api.onrender.com/health

Render project:

https://dashboard.render.com/project/prj-dafs7k2d0e5s73dpurn0

Database

MongoDB Atlas is used as the production database.

MongoDB Atlas:

https://cloud.mongodb.com/v2/6a993af70b6e90c88bd6092b#clusters

Database credentials are not stored in this README.

Image Storage

Cloudinary is used for product image storage and delivery.

Cloudinary dashboard:

https://console.cloudinary.com/app/c-648a9af20b95a75cb46636f9d48302/home/dashboard

Cloudinary secrets are not stored in this repository.

Domain

Production domain:

https://www.dailymartsupermarket.in/

Domain provider:

Hostinger

The domain is owned/controlled by the client according to the project handover arrangement.

Monitoring

Backend uptime monitoring is configured using UptimeRobot.

The backend health endpoint is used for monitoring:

/health

The monitor is configured to periodically check the backend service.

GitHub Repository

Source code repository:

https://github.com/suhaskarle1970-cmd/karle-daily-mart

The repository contains the project source code.

Secrets such as:

.env
API keys
Database credentials
JWT secrets
Cloudinary secrets
Passwords

must not be committed to the repository.

Environment Variables

Environment variables are required for production configuration.

Do not commit real values.

Example frontend configuration:

VITE_API_URL=https://karle-daily-mart-api.onrender.com

Example backend configuration:

PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

ADMIN_EMAIL=dailymartsupermarket@gmail.com
ADMIN_PASSWORD=your_secure_admin_password

The exact environment variables used by the source code should be checked against the backend/frontend configuration before deployment.

Never publish real environment variable values in:

GitHub
README
Screenshots
Documentation
Public chat
Client-facing public repositories
Local Development Setup
Prerequisites

Install:

Node.js
npm
Git
MongoDB access
Cloudinary account/configuration
Clone Repository
git clone https://github.com/suhaskarle1970-cmd/karle-daily-mart.git
cd karle-daily-mart
Backend Setup

Move into the backend directory:

cd backend

Install dependencies:

npm install

Create a .env file:

PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_admin_password

Start the backend:

npm run dev

or use the project's configured start command.

Backend will normally run locally on:

http://localhost:5000

Health check:

http://localhost:5000/health
Frontend Setup

Move into the frontend directory:

cd frontend

Install dependencies:

npm install

Create the frontend environment file if required:

VITE_API_URL=http://localhost:5000

Start the development server:

npm run dev

Vite will provide the local development URL in the terminal.

Production Build

Build the frontend:

npm run build

Preview the production build locally:

npm run preview

The exact scripts depend on the project's current package.json configuration.

Project Structure

The project follows a separate frontend/backend structure.

Typical structure:

karle-daily-mart/
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── config/
│   ├── uploads/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── assets/
│   │   └── ...
│   ├── index.html
│   └── package.json
│
├── .gitignore
└── README.md

The exact structure may differ slightly depending on the current source tree.

API Overview

The backend provides API functionality for the application.

Major functional areas include:

Authentication
Products
Categories
Orders
Store Settings
Hero Slider
Bulk Import

The backend also exposes a health endpoint:

GET /health

The health endpoint is used to verify that the production backend is running.

Data Validation

The backend validates important product and store data before saving or processing it.

For product types and sizes, validation includes:

Name required
Sizes must be an array
At least one size required
Valid unit required
Positive amount required
Valid selling price required
Valid MRP when supplied
MRP cannot be lower than selling price

Supported units:

g
kg
ml
l
pcs

This helps prevent invalid catalogue data from entering the production database.

Production QA Checklist

Before considering the project delivered, verify:

Website
 Homepage loads
 Domain works
 HTTPS works
 Navigation works
 Departments work
 Categories work
 Search works
 Product pages work
 Product images load
 Variants work
 Type-based products work
 Cart works
 Quantity changes work
 Checkout works
 Delivery calculation works
 Savings calculation works
 WhatsApp ordering works
 Mobile layout works
 Desktop layout works
Admin
 Admin login works
 Admin logout works
 Password change works
 Product creation works
 Product editing works
 Product activation/deactivation works
 Category management works
 Hero slider management works
 Store settings work
 CSV import works
 Product images upload correctly
Backend
 Backend is running
 /health works
 MongoDB connection works
 Cloudinary connection works
 Production environment variables are configured
 No secrets are committed to GitHub
Features Not Included

The following features are outside the delivered v1.0 scope:

Online payment gateway
Customer accounts
Customer login/registration
OTP authentication
Coupon/discount-code engine
Advanced order tracking
Advanced order-status workflow
Delivery staff application
POS/billing software integration
Advanced analytics
Native Android/iOS application
Other new modules or integrations not documented in the project scope

Any future feature can be evaluated and estimated separately.

Business Responsibilities

The client/business is responsible for:

Product information
Product prices
MRP values
Product descriptions
Product images
Categories
Barcode information
CSV data accuracy
Delivery policy
Business contact information
Legal/business content
Admin account security
Keeping service credentials secure
Maintaining access to client-owned services

The developer/agency is responsible for the delivered application functionality according to the agreed project scope and support arrangement.

Third-Party Services

The project depends on external services including:

Vercel
Render
MongoDB Atlas
Cloudinary
Hostinger
WhatsApp
UptimeRobot
GitHub

These services are operated by their respective providers.

The project developer is not responsible for:

Third-party service outages
Provider policy changes
Provider pricing changes
Provider quotas
Provider account suspension
Provider API changes
Domain provider issues
External service availability

Third-party service costs, where applicable, are separate from the website development cost unless otherwise agreed.

Maintenance and Support

A bug is considered an issue where a delivered feature does not work according to the agreed project scope.

Examples:

Delivered product functionality stops working
Delivered checkout functionality fails
Existing admin functionality stops working

A content change is different from a software bug.

Examples:

Change product price
Change product image
Change product description
Change banner content
Add/update catalogue information

A new feature or major change is separate scope.

Examples:

Add online payment
Add customer login
Add delivery tracking
Add mobile application
Integrate POS software
Add advanced analytics
Add new business workflow

New functionality may require a separate quotation or estimate.

Support and maintenance are subject to the arrangement agreed between the client and the developer/agency.

Security Guidelines
Never commit secrets

Do not commit:

.env
.env.local
.env.production
Database passwords
JWT secrets
Cloudinary API secrets
Admin passwords
Private API keys

Make sure .gitignore protects sensitive files.

Admin Password

The administrator should:

Use a strong password
Avoid sharing the password unnecessarily
Change the password if it becomes exposed
Never store the password in the GitHub repository
Database

MongoDB credentials should remain private.

Do not expose the MongoDB connection string publicly.

Cloudinary

Cloudinary API secrets must remain private.

Only the required public Cloudinary configuration should be exposed to the frontend where applicable.

Ownership and Handover

The production project is delivered to Daily Mart Super Market.

Client/business:

Daily Mart Super Market

Client contact:

Suhas Karle
Phone: 8668781633
Email: suhaskarle1970@gmail.com

Developer/Agency:

Veyora Studio

Primary Developer:

Vedant Shinde

Agency contact:

Phone: 8208664612
Email: vedantbaban.shinde@gmail.com
Service Ownership

The following services should be maintained according to the agreed client ownership arrangement:

Domain
Vercel
Render
MongoDB Atlas
Cloudinary
GitHub

The client should retain appropriate ownership/billing access to client-owned production services.

Credential Handover

Passwords and private credentials are intentionally not included in this README.

Credentials should be delivered separately through a secure channel.

After handover:

Client logs into the required services.
Client verifies access.
Client changes initial passwords where applicable.
Client keeps ownership/billing information secure.
Former developer/team access should be removed where it is no longer required.
Project Handover Process

The recommended final delivery process is:

Final Project Testing
        ↓
Final Payment
        ↓
Final Client Demonstration
        ↓
Admin Panel Training
        ↓
Handover Documentation
        ↓
Credential Handover
        ↓
Service Ownership / Access Verification
        ↓
Client Acceptance
        ↓
Post-Handover Support
Final Acceptance

The project should be considered handed over after:

Production website has been demonstrated.
Admin panel has been demonstrated.
Client has received required access.
Client has received handover documentation.
Client has verified the major delivered functionality.
Ownership/access arrangements have been clarified.
Client has accepted the delivered project.
Project Information
Project:
Daily Mart Super Market — E-Commerce Website

Version:
v1.0

Client:
Daily Mart Super Market

Client Contact:
Suhas Karle

Developer:
Vedant Shinde

Agency:
Veyora Studio

Frontend:
React + Vite

Backend:
Node.js + Express

Database:
MongoDB Atlas

Image Storage:
Cloudinary

Frontend Hosting:
Vercel

Backend Hosting:
Render

Domain:
Hostinger

Ordering:
WhatsApp

Monitoring:
UptimeRobot
Production URLs
Resource	URL
Website	https://www.dailymartsupermarket.in/
Admin Panel	https://www.dailymartsupermarket.in/admin
Backend API	https://karle-daily-mart-api.onrender.com
Backend Health	https://karle-daily-mart-api.onrender.com/health
GitHub	https://github.com/suhaskarle1970-cmd/karle-daily-mart
Vercel	https://vercel.com/suhaskarle1970-6895/karle-daily-mart
Render	https://dashboard.render.com/project/prj-dafs7k2d0e5s73dpurn0
MongoDB Atlas	https://cloud.mongodb.com/v2/6a993af70b6e90c88bd6092b#clusters
Cloudinary	https://console.cloudinary.com/app/c-648a9af20b95a75cb46636f9d48302/home/dashboard
Final Notes

This repository represents the source code for the Daily Mart Super Market production website and administration system.

The production application should be operated using the configured client-owned services and credentials.

Always:

Keep production secrets private.
Keep the database credentials private.
Keep Cloudinary secrets private.
Keep admin credentials private.
Maintain accurate product and pricing information.
Test major catalogue changes after bulk imports.
Keep backups of important catalogue CSV files.
Review third-party service status if a production service becomes unavailable.
License and Usage

This project is developed specifically for Daily Mart Super Market.

The source code, design, configuration, assets, and project materials are subject to the ownership and usage terms agreed between the client and the developer/agency.

Unauthorized redistribution, resale, or reuse of project-specific materials should not be assumed without the applicable agreement.

Credits
Daily Mart Super Market

E-Commerce Website & Administration System

Developed and delivered by:

Veyora Studio

Primary Developer:

Vedant Shinde

Contact:

8208664612

vedantbaban.shinde@gmail.com

