# SPOREKART IN-APP NOTIFICATION API CONTRACT
**Document ID:** `DOC-NOTIF-004`  
**Status:** SPECIFICATION  
**Author:** Backend Architecture Lead  
**Date:** October 12, 2026  

---

## 1. CUSTOMER & TRAINEE API ENDPOINTS (`/api/v1/notifications`)

All customer endpoints require `Authorization: Bearer <JWT>` containing valid authenticated identity.

### 1.1 List Customer Notifications
`GET /api/v1/notifications`

#### Query Parameters
- `page` (int, default: 0) — Zero-indexed page number.
- `size` (int, default: 20, max: 50) — Page size.
- `unreadOnly` (boolean, optional) — Filter to unread notifications only.

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "7fa85a55-1234-4567-89ab-cdef01234567",
        "eventType": "ORDER_CONFIRMED",
        "category": "ORDER",
        "title": "Sporekart Order Confirmation #SK-1004 🍄",
        "message": "Your order for 2 items totaling ₹850.00 has been received.",
        "isRead": false,
        "readAt": null,
        "actionUrl": "/dashboard?tab=orders&id=c4a85a55-...",
        "createdAt": "2026-10-12T09:15:00Z"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1,
    "last": true
  },
  "requestId": "8f2a91b4-..."
}
```

---

### 1.2 Get Unread Notification Count
`GET /api/v1/notifications/unread-count`

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "unreadCount": 3
  },
  "requestId": "9c12b7f3-..."
}
```

---

### 1.3 Mark Single Notification as Read
`PATCH /api/v1/notifications/{id}/read`

#### Path Variables
- `id` (UUID) — The notification record ID.

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "7fa85a55-1234-4567-89ab-cdef01234567",
    "isRead": true,
    "readAt": "2026-10-12T09:20:15Z"
  },
  "requestId": "4a18e9c2-..."
}
```

#### Error Responses
- `401 Unauthorized` — Missing or invalid token.
- `403 Forbidden` — Notification belongs to another account.
- `404 Not Found` — Notification does not exist.

---

### 1.4 Mark All Notifications as Read
`PATCH /api/v1/notifications/read-all`

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "markedCount": 3
  },
  "requestId": "3b29c118-..."
}
```

---

## 2. ADMINISTRATOR OPERATIONAL ENDPOINTS (`/api/v1/admin/notifications`)

All admin endpoints require `ROLE_ADMIN` authorization.

### 2.1 Get Admin Operational Notification Feed
`GET /api/v1/admin/notifications/in-app`

#### Query Parameters
- `page` (int, default: 0)
- `size` (int, default: 20)
- `unreadOnly` (boolean, optional)

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "3bb821a0-...",
        "eventType": "ADMIN_NEW_ORDER",
        "category": "ADMIN",
        "title": "New Order #SK-1005 Received",
        "message": "Order value ₹1,299.00 placed by Rohan Sharma.",
        "isRead": false,
        "readAt": null,
        "actionUrl": "/admin?tab=orders&id=3bb821a0-...",
        "createdAt": "2026-10-12T09:25:00Z"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1
  }
}
```

---

### 2.2 Get Admin Unread Operational Count
`GET /api/v1/admin/notifications/in-app/unread-count`

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "unreadCount": 1
  }
}
```

---

### 2.3 Mark Admin Notification as Read
`PATCH /api/v1/admin/notifications/in-app/{id}/read`

---

### 2.4 Mark All Admin Notifications as Read
`PATCH /api/v1/admin/notifications/in-app/read-all`
