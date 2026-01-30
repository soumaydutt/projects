# Excalibur Web Access

Enterprise-grade Customer Care & Billing platform for telecom and ISP service providers.

## Tech Stack

### Backend
- .NET 8 Web API
- Entity Framework Core 8
- PostgreSQL
- JWT Authentication with refresh tokens
- Clean Architecture (Domain, Application, Infrastructure, API layers)

### Frontend
- React 18 with TypeScript
- Vite
- TailwindCSS
- TanStack Query (React Query)
- Zustand for state management
- React Router DOM
- Recharts for data visualization
- Lucide React icons
- Sonner for toast notifications

## Features

- **Dashboard**: KPIs, AR aging chart, payments trend, recent activities
- **Customer 360**: Complete account view with services, invoices, payments, notes, audit trail
- **Accounts Management**: CRUD operations, search, filter, export
- **Invoices**: View, filter, export invoices
- **Payments**: Record payments, auto-allocation, refunds
- **Collections**: Case management, status workflow, notes, activities
- **Price Plans**: Service pricing management
- **Audit Logs**: Complete system activity tracking
- **Role-Based Access Control**: Admin, BillingAgent, CareAgent, Collector, ReadOnlyAuditor

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local frontend development)
- .NET 8 SDK (for local backend development)

### Quick Start with Docker

1. Clone the repository:
```bash
cd excalibur-web-access
```

2. Start all services:
```bash
docker-compose up -d
```

3. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- pgAdmin: http://localhost:5050 (admin@excalibur.com / admin)

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@excalibur.com | Admin123! |
| Billing Agent | billing@excalibur.com | Billing123! |
| Care Agent | care@excalibur.com | Care123! |
| Collector | collector@excalibur.com | Collector123! |

### Local Development

#### Backend
```bash
cd backend/src/Excalibur.Api
dotnet restore
dotnet run
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
excalibur-web-access/
├── backend/
│   ├── src/
│   │   ├── Excalibur.Domain/        # Entities, Enums, Value Objects
│   │   ├── Excalibur.Application/   # Interfaces, Models, DTOs
│   │   ├── Excalibur.Infrastructure/# EF Core, Services, Data
│   │   └── Excalibur.Api/           # Controllers, Middleware
│   └── Excalibur.sln
├── frontend/
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   ├── pages/                   # Page components
│   │   ├── services/                # API services
│   │   └── stores/                  # Zustand stores
│   └── package.json
├── docker-compose.yml
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Dashboard
- `GET /api/dashboard/kpis` - Get KPIs
- `GET /api/dashboard/ar-aging` - Get AR aging data
- `GET /api/dashboard/payments-trend` - Get payments trend
- `GET /api/dashboard/recent-activities` - Get recent activities

### Accounts
- `GET /api/accounts` - List accounts (with search, filter, pagination)
- `GET /api/accounts/{id}` - Get account by ID
- `GET /api/accounts/{id}/360` - Get account 360 view
- `POST /api/accounts` - Create account
- `PUT /api/accounts/{id}` - Update account
- `POST /api/accounts/{id}/notes` - Add note

### Invoices
- `GET /api/invoices` - List invoices
- `GET /api/invoices/{id}` - Get invoice details
- `POST /api/invoices/{id}/void` - Void invoice

### Payments
- `GET /api/payments` - List payments
- `GET /api/payments/{id}` - Get payment details
- `POST /api/payments` - Record payment
- `POST /api/payments/{id}/refund` - Refund payment

### Collections
- `GET /api/collections` - List collection cases
- `GET /api/collections/{id}` - Get case details
- `PUT /api/collections/{id}/status` - Update status
- `POST /api/collections/{id}/notes` - Add note
- `PUT /api/collections/{id}/assign` - Assign case
- `PUT /api/collections/{id}/promise-to-pay` - Record promise to pay

### Price Plans
- `GET /api/price-plans` - List price plans
- `GET /api/price-plans/{id}` - Get plan details
- `POST /api/price-plans` - Create plan
- `PUT /api/price-plans/{id}` - Update plan
- `DELETE /api/price-plans/{id}` - Delete plan
- `POST /api/price-plans/{id}/activate` - Activate plan
- `POST /api/price-plans/{id}/deactivate` - Deactivate plan

### Audit Logs
- `GET /api/audit-logs` - List audit logs
- `GET /api/audit-logs/{id}` - Get log details
- `GET /api/audit-logs/entity/{type}/{id}` - Get logs for entity
- `GET /api/audit-logs/user/{userId}` - Get logs for user
- `GET /api/audit-logs/statistics` - Get audit statistics

## Environment Variables

### Backend
```
ConnectionStrings__DefaultConnection=Host=postgres;Database=excalibur;Username=postgres;Password=postgres
Jwt__Secret=your-secret-key
Jwt__Issuer=excalibur
Jwt__Audience=excalibur-web
```

### Frontend
```
VITE_API_URL=/api
```

## License

MIT
