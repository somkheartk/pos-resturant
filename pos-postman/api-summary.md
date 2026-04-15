# POS API Summary by Page

## 1. Login page

### Main API
- POST `/api/v1/auth/login`

### Sample request
```json
{
  "email": "admin@pos.local",
  "password": "123456"
}
```

### Sample response
```json
{
  "accessToken": "eyJhbGciOi...",
  "tokenType": "Bearer",
  "expiresIn": "1d",
  "user": {
    "id": "661234abcd1234",
    "name": "System Admin",
    "email": "admin@pos.local",
    "role": "admin",
    "permissions": ["dashboard:view", "orders:view", "products:view"]
  }
}
```

---

## 2. Dashboard page

### Page API
- GET `/api/dashboard/counts`

### Backend sources used behind the summary cards
- GET `/api/v1/users`
- GET `/api/v1/products`
- GET `/api/v1/inventory`
- GET `/api/v1/orders`

### Sample response
```json
{
  "users": 12,
  "branches": 24,
  "products": 40,
  "category": 86
}
```

---

## 3. Orders page

### Page APIs
- GET `/api/orders`
- POST `/api/orders`
- PATCH `/api/orders/:id`
- DELETE `/api/orders/:id`
- GET `/api/products` for menu selection in the order form

### Backend APIs
- GET `/api/v1/orders`
- POST `/api/v1/orders`
- PATCH `/api/v1/orders/:id`
- DELETE `/api/v1/orders/:id`

### Sample create order payload
```json
{
  "orderNo": "SO-250415-0001",
  "customerName": "Table 8",
  "branchName": "Dining Hall A",
  "totalAmount": 387,
  "paymentMethod": "cash",
  "itemCount": 3,
  "items": [
    {
      "productId": "menu-001",
      "productName": "Pad Thai Shrimp",
      "quantity": 1,
      "unitPrice": 129
    },
    {
      "productId": "menu-002",
      "productName": "Thai Milk Tea",
      "quantity": 2,
      "unitPrice": 59
    }
  ],
  "note": "โต๊ะ 8 ไม่เผ็ด",
  "status": "pending"
}
```

### Sample order response
```json
{
  "_id": "661111aaaa2222",
  "orderNo": "SO-250415-0001",
  "customerName": "Table 8",
  "branchName": "Dining Hall A",
  "totalAmount": 387,
  "paymentMethod": "cash",
  "itemCount": 3,
  "items": [
    {
      "productName": "Pad Thai Shrimp",
      "quantity": 1,
      "unitPrice": 129,
      "lineTotal": 129
    }
  ],
  "note": "โต๊ะ 8 ไม่เผ็ด",
  "status": "pending",
  "createdAt": "2026-04-15T10:30:00.000Z",
  "updatedAt": "2026-04-15T10:30:00.000Z"
}
```

---

## 4. Food Menu page

### Page API
- GET `/api/products`

### Backend APIs
- GET `/api/v1/products`
- POST `/api/v1/products`
- PATCH `/api/v1/products/:id`
- DELETE `/api/v1/products/:id`

### Sample create menu payload
```json
{
  "name": "Tom Yum Soup",
  "price": 149,
  "isActive": true
}
```

### Sample response
```json
{
  "_id": "662222bbbb3333",
  "name": "Tom Yum Soup",
  "price": 149,
  "isActive": true,
  "createdAt": "2026-04-15T10:40:00.000Z",
  "updatedAt": "2026-04-15T10:40:00.000Z"
}
```

---

## 5. Users page

### Page APIs
- GET `/api/users?page=1&pageSize=10&search=`
- POST `/api/users`
- PATCH `/api/users/:id`
- DELETE `/api/users/:id`

### Backend APIs
- GET `/api/v1/users`
- POST `/api/v1/users`
- PATCH `/api/v1/users/:id`
- DELETE `/api/v1/users/:id`

### Sample create user payload
```json
{
  "name": "Cashier A",
  "email": "cashier.a@pos.local",
  "password": "123456",
  "role": "staff",
  "isActive": true,
  "permissions": ["dashboard:view", "orders:view"]
}
```

---

## 6. Reports page

### Page API
- GET `/api/orders`

### Usage
- Reports page aggregates sales, payment mix, and trends from the orders list.
- There is no dedicated report endpoint yet.

---

## 7. Tables page

### Page API
- GET `/api/orders`

### Usage
- Used for selecting active food orders to assign to tables.
- Table assignments are currently stored in browser local storage.
- There is no dedicated backend table endpoint yet.

---

## 8. Inventory page

### Backend APIs available
- GET `/api/v1/inventory`
- POST `/api/v1/inventory`
- PATCH `/api/v1/inventory/:id`
- DELETE `/api/v1/inventory/:id`

### Sample create inventory payload
```json
{
  "sku": "ING-001",
  "quantity": 45,
  "location": "Cold Storage"
}
```

---

## 9. Branches / Categories / PO pages

### Current status
- These pages are mainly UI/demo structure right now.
- No dedicated web API routes were found yet for them in the current project state.

---

## 10. Health check

### Backend API
- GET `/api/v1/health/db`

### Sample response
```json
{
  "status": "ok"
}
```
