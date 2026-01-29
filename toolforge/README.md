# ToolForge

A production-grade schema-driven internal tool builder built with the MERN stack (MongoDB, Express, React, Node.js) using TypeScript.

## Features

- **Schema-Driven Tools**: Define tools using JSON schemas that automatically generate:
  - List pages with tables, filters, pagination, and sorting
  - Create/Edit forms with validation and conditional fields
  - Detail views
  - Bulk actions

- **Role-Based Access Control (RBAC)**:
  - Tool-level: `canAccessTool`
  - Resource-level: `canCreate`, `canRead`, `canUpdate`, `canDelete`
  - Field-level: `canView`, `canEdit`
  - Action-level: `canRunAction`
  - Roles: `admin`, `manager`, `agent`, `viewer`

- **Audit Logging**: Track all changes with detailed diff records including:
  - Actor information
  - Before/after values
  - Timestamps, IP, and user agent

- **Real-time Updates**: WebSocket-powered live updates when records change

- **JWT Authentication**: Secure auth with access + refresh token rotation

## Tech Stack

- **Backend**: Express.js, MongoDB with Mongoose, Socket.IO
- **Frontend**: React 18, Vite, Tailwind CSS, React Router
- **Validation**: Zod for both backend and frontend
- **Testing**: Mocha + Chai (backend), Vitest + React Testing Library (frontend)
- **Language**: TypeScript throughout

## Project Structure

```
/toolforge
  /apps
    /api                # Express API server
      /src
        /config         # Configuration
        /controllers    # Route controllers
        /middleware     # Auth, RBAC, error handling
        /models         # Mongoose models
        /repositories   # Data access layer
        /routes         # API routes
        /services       # Business logic
        /socket         # Socket.IO setup
        /scripts        # Seed scripts
    /web                # React frontend
      /src
        /components     # UI components
        /context        # React contexts (Auth, Toast)
        /pages          # Page components
        /services       # API client
        /styles         # Tailwind CSS
  /packages
    /shared             # Shared types, validation, utilities
  docker-compose.yml    # MongoDB setup
  package.json          # Monorepo root
```

## Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- npm 9+

### Setup

1. **Clone and install dependencies:**
```bash
cd toolforge
npm install
```

2. **Start MongoDB:**
```bash
npm run docker:up
```

3. **Configure environment:**
```bash
cp apps/api/.env.example apps/api/.env
```

4. **Build shared package:**
```bash
npm run build:shared
```

5. **Seed the database:**
```bash
npm run seed
```

6. **Start development servers:**
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- API: http://localhost:3001
- MongoDB Express UI: http://localhost:8081

### Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | password | Admin |
| manager@example.com | password | Manager |
| agent@example.com | password | Agent |
| viewer@example.com | password | Viewer |

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh tokens
- `GET /api/auth/me` - Get current user

### Schemas (Admin only)
- `GET /api/schemas` - List all schemas
- `POST /api/schemas` - Create schema
- `GET /api/schemas/:id` - Get schema by ID
- `GET /api/schemas/tool/:toolId` - Get schema by tool ID
- `PUT /api/schemas/:id` - Update schema
- `POST /api/schemas/:id/publish` - Publish schema
- `POST /api/schemas/:id/unpublish` - Unpublish schema
- `DELETE /api/schemas/:id` - Delete schema
- `POST /api/schemas/validate` - Validate schema JSON

### Tools/Records
- `GET /api/tools/:toolId/records` - Query records
- `POST /api/tools/:toolId/records` - Create record
- `GET /api/tools/:toolId/records/:recordId` - Get record
- `PUT /api/tools/:toolId/records/:recordId` - Update record
- `DELETE /api/tools/:toolId/records/:recordId` - Delete record
- `POST /api/tools/:toolId/records/bulk` - Bulk update records
- `POST /api/tools/:toolId/actions/:actionId` - Execute action

### Audit Logs
- `GET /api/tools/:toolId/audit` - Query audit logs
- `GET /api/tools/:toolId/records/:recordId/audit` - Get audit logs for record

### Users (Admin only)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Schema Definition

A tool schema defines everything about a tool:

```typescript
{
  toolId: string;           // Unique identifier (lowercase, hyphens)
  name: string;             // Display name
  description?: string;     // Description
  resource: string;         // MongoDB collection name
  fields: FieldDefinition[];
  listView: ListView;
  formView: FormView;
  actions?: ToolAction[];
  permissions: ToolPermissions;
  audit: AuditConfig;
}
```

### Field Types

| Type | Description |
|------|-------------|
| `text` | Single-line text input |
| `textarea` | Multi-line text input |
| `number` | Numeric input |
| `boolean` | Checkbox |
| `select` | Dropdown selection |
| `multiselect` | Multiple selection |
| `date` | Date picker |
| `datetime` | Date and time picker |
| `relation` | Reference to another collection |
| `json` | JSON viewer (readonly) |
| `computed` | Derived field (readonly) |

### Field Definition

```typescript
{
  key: string;              // Field key (camelCase)
  label: string;            // Display label
  type: FieldType;
  required?: boolean;
  default?: unknown;
  validation?: {
    min?: number;           // For number type
    max?: number;
    minLength?: number;     // For text types
    maxLength?: number;
    pattern?: string;       // Regex pattern
    patternMessage?: string;
  };
  visibility?: string;      // JS expression for conditional visibility
  permissions?: {
    canView: Role[];
    canEdit: Role[];
  };
  options?: { value: string; label: string }[];  // For select/multiselect
  relationTo?: string;      // For relation type
  helpText?: string;
  placeholder?: string;
  readonly?: boolean;
}
```

## Environment Variables

### API (.env)

```env
# Server
PORT=3001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://toolforge:toolforge123@localhost:27017/toolforge?authSource=admin

# JWT
JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Cookie
COOKIE_DOMAIN=localhost
COOKIE_SECURE=false
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both API and web in development mode |
| `npm run dev:api` | Start API server only |
| `npm run dev:web` | Start web frontend only |
| `npm run build` | Build all packages |
| `npm run test` | Run all tests |
| `npm run test:api` | Run API tests only |
| `npm run test:web` | Run web tests only |
| `npm run seed` | Seed database with demo data |
| `npm run docker:up` | Start MongoDB containers |
| `npm run docker:down` | Stop MongoDB containers |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Testing

### Backend (Mocha + Chai)
```bash
npm run test:api
```

### Frontend (Vitest + React Testing Library)
```bash
npm run test:web
```

## WebSocket Events

### Client → Server
- `subscribe:tool` - Subscribe to tool updates
- `unsubscribe:tool` - Unsubscribe from tool updates

### Server → Client
- `records:updated` - Record was created/updated/deleted
  ```typescript
  {
    toolId: string;
    recordId: string;
    actionType: 'created' | 'updated' | 'deleted';
    actorId: string;
  }
  ```

## Demo Tool: Support Tickets

The seed script creates a "Support Tickets" tool demonstrating:

- Multiple field types (text, textarea, select, multiselect, relation)
- Validation rules
- Filters and search
- Bulk actions (change status)
- Row actions (assign to me)
- RBAC permissions per role
- Audit logging

## License

MIT
