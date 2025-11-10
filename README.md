# JB Lifestyles — Redesign (Flipkart-style)

This repository is an initial scaffold for a Flipkart-style redesign of jblifestyles.com.

Structure
- frontend/ (Next.js + React)
- backend/ (Express server with supplier CSV generation endpoint)

Quick start (local)
1. Clone the repo
   git clone https://github.com/jagadeesh4ck/jblifestyles.git
   cd jblifestyles

2. Start Postgres (Docker)
   docker run --name pg-dropship -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=dropship -p 5432:5432 -d postgres:15

3. Backend
   cd backend
   npm install
   cp .env.example .env   # update DATABASE_URL and SMTP_ values
   npm run dev

4. Frontend
   cd ../frontend
   npm install
   npm run dev

Notes
- This scaffold includes a Flipkart-like header component and an admin endpoint to generate supplier CSVs (semi-automated). It is a starting point; integrate with your existing product/order DB and auth.

Acceptance
- Frontend runs on http://localhost:3000 and shows header and sample home page.
- Backend runs on http://localhost:4000 with endpoint POST /admin/orders/:orderId/generate-supplier-csv returning CSV base64 + mailto link.