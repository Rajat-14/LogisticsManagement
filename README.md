# Logistics Management System

This project is a multi-layered logistics management system based on the provided High-Level Design (HLD).

## Architecture

The system follows a layered architecture:

### 1. Client Layer (Frontend)
Located in the `frontend/` directory. Each portal is containerized separately.
- `customer-portal`: Shipment booking and tracking.
- `driver-portal`: Route management and delivery verification.
- `manager-portal`: Order and route management.
- `support-portal`: Support staff interface to interact with customers.

### 2. API Layer
Managed by the `api-gateway` in `backend/api-gateway`. It routes requests to the appropriate business services.

### 3. Business Service Layer
Located in `backend/services/`. Each service handles specific business logic:
- `auth-service`: User authentication and account management.
- `order-service`: Order creation and status management.
- `tracking-service`: Real-time shipment tracking.
- `route-service`: Route optimization and management.
- `delivery-verification`: OTP-based delivery confirmation.
- `support-chat`: Messaging service for customer support.

### 4. Data Layer
A PostgreSQL database managed via Docker Compose. Configuration is in `data-layer/postgres`.

## Docker Usage

The entire system can be managed using Docker Compose.

### Build and Start
```bash
docker-compose up --build
```

### Stop
```bash
docker-compose down
```

## External Integrations
- **Google Maps API**: Used by the `route-service` for route management.
- **Payment Gateway**: Integration point for processing customer payments.
