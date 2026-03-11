# System Architecture - Driver Live Tracking

## Overall Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                          DRIVER SIDE                              │
│                                                                   │
│   ┌────────────────────────────────────────────────────────┐    │
│   │    Driver Admin Panel (React App)                       │    │
│   │                                                          │    │
│   │  ┌─────────────────────────────────────────────────┐   │    │
│   │  │ Navigation: Sidebar → "🚗 Driver Tracking"      │   │    │
│   │  └─────────────────────────────────────────────────┘   │    │
│   │                      ↓                                   │    │
│   │  ┌─────────────────────────────────────────────────┐   │    │
│   │  │ DriverTracking Component                         │   │    │
│   │  │                                                  │   │    │
│   │  │ ┌─────────────────┐  ┌──────────────────────┐  │   │    │
│   │  │ │ Orders Sidebar  │  │ Main Tracking Area   │  │   │    │
│   │  │ │                 │  │                      │  │   │    │
│   │  │ │ • Order 1 ✓     │  │ ┌────────────────┐  │  │   │    │
│   │  │ │ • Order 2 ⏳    │  │ │  Leaflet Map   │  │  │   │    │
│   │  │ │ • Order 3 →    │  │ │  (Real-time)   │  │  │   │    │
│   │  │ │                 │  │ └────────────────┘  │  │   │    │
│   │  │ └─────────────────┘  │                      │  │   │    │
│   │  │                      │ Order Details:       │  │   │    │
│   │  │                      │ ✓ Items & Price     │  │   │    │
│   │  │                      │ 📍 Delivery Address │  │   │    │
│   │  │                      │ 📞 Call Customer    │  │   │    │
│   │  │                      │ 📊 Status Buttons   │  │   │    │
│   │  │                      │ ⏱️  Distance & ETA  │  │   │    │
│   │  │                      └─────────────────────┘  │   │    │
│   │  └─────────────────────────────────────────────┘   │    │
│   │                                                      │    │
│   └────────────────────────────────────────────────────┘    │
│                         ↑     ↓                                │
│               ┌──────────┴─────┴─────────┐                    │
│               │                          │                    │
│            (GPS Input)        (Socket.io Client)              │
│               │                          │                    │
└───────────────┼──────────────────────────┼───────────────────┘
                │                          │
                │ Geolocation API          │ WebSocket
                │ (5sec updates)           │ Connection
                ↓                          ↓
        ┌──────────────────────────────────────────┐
        │     Backend Server (Node.js)             │
        │                                           │
        │  ┌─────────────────────────────────────┐ │
        │  │ Socket.io Server                    │ │
        │  │                                     │ │
        │  │ Events:                             │ │
        │  │ • driver-location (receive)         │ │
        │  │ • update-delivery-status (receive)  │ │
        │  │ • order-assigned (send)             │ │
        │  │ • order-cancelled (send)            │ │
        │  │ • receive-location (send)           │ │
        │  └─────────────────────────────────────┘ │
        │                  ↕                        │
        │  ┌─────────────────────────────────────┐ │
        │  │ REST API Endpoints                  │ │
        │  │                                     │ │
        │  │ • GET /api/order/active             │ │
        │  │ • POST /api/order/status            │ │
        │  │ • GET /api/order/:orderId           │ │
        │  └─────────────────────────────────────┘ │
        │                  ↕                        │
        │  ┌─────────────────────────────────────┐ │
        │  │ Database                            │ │
        │  │                                     │ │
        │  │ • Orders Collection                 │ │
        │  │ • Driver Locations (Real-time)      │ │
        │  │ • Delivery Status Updates           │ │
        │  │ • GPS Coordinates                   │ │
        │  └─────────────────────────────────────┘ │
        └──────────────────────────────────────────┘
                        ↕
        ┌──────────────────────────────────────────┐
        │    Other Systems (optional)              │
        │                                           │
        │ • Customer App (receive location)        │
        │ • Dispatch System (monitor drivers)      │
        │ • Notification Service (status updates)  │
        │ • Analytics Platform (reporting)         │
        └──────────────────────────────────────────┘
```

## Component Hierarchy

```
App.jsx
├── Route: "/driver-tracking"
│   └── DriverTracking Component
│       │
│       ├── State Management
│       │   ├── activeOrders
│       │   ├── selectedOrder
│       │   ├── driverLocation
│       │   ├── customerLocation
│       │   ├── deliveryStatus
│       │   └── isOnline
│       │
│       ├── Refs
│       │   ├── mapContainer (DOM reference)
│       │   ├── mapRef (Leaflet instance)
│       │   ├── socketRef (Socket.io instance)
│       │   ├── routeControl (Leaflet Routing)
│       │   └── markersRef (map markers)
│       │
│       ├── Effects
│       │   ├── Map initialization
│       │   ├── Socket.io connection
│       │   ├── Geolocation tracking
│       │   └── Route updates
│       │
│       └── UI Structure
│           ├── Header
│           │   ├── Back button
│           │   ├── Title
│           │   └── Online/Offline toggle
│           │
│           ├── Main Container
│           │   ├── Orders Sidebar
│           │   │   └── Order Cards (clickable)
│           │   │
│           │   └── Tracking Main
│           │       ├── Map Container (Leaflet)
│           │       └── Tracking Info
│           │           ├── Order Details
│           │           ├── Delivery Location
│           │           ├── Customer Contact
│           │           ├── Status Buttons
│           │           ├── Estimate Info
│           │           └── Driver Location
```

## Real-Time Event Flow

```
┌─────────────────────────────────────────────────────────┐
│                 SOCKET.IO EVENT FLOW                      │
└─────────────────────────────────────────────────────────┘

DRIVER → SERVER (Emit):
         ↓
    ┌────────────────────────────┐
    │  driver-location           │
    │  • orderId                 │
    │  • driverId                │
    │  • latitude                │
    │  • longitude               │
    │  • status                  │
    └────────────────────────────┘
         ↓ (every 5 seconds)
    Database stores location
    Broadcasts to:
    • Customer app (live tracking)
    • Other drivers (if needed)
    • Dispatch system


DRIVER → SERVER (Emit):
         ↓
    ┌────────────────────────────┐
    │  update-delivery-status    │
    │  • orderId                 │
    │  • status                  │
    │    - picked-up             │
    │    - on-the-way            │
    │    - delivered             │
    └────────────────────────────┘
         ↓ (on button click)
    Updates order in database
    Notifies customer
    Updates dispatch system


SERVER → DRIVER (Listen):
         ↓
    ┌────────────────────────────┐
    │  order-assigned            │
    │  • Full order details      │
    │  • Customer info           │
    │  • Delivery address        │
    │  • GPS coordinates         │
    └────────────────────────────┘
         ↓
    Adds to active orders list


SERVER → DRIVER (Listen):
         ↓
    ┌────────────────────────────┐
    │  order-cancelled           │
    │  • orderId                 │
    └────────────────────────────┘
         ↓
    Removes from active orders


SERVER → DRIVER (Listen):
         ↓
    ┌────────────────────────────┐
    │  receive-location          │
    │  • Customer's latitude     │
    │  • Customer's longitude    │
    └────────────────────────────┘
         ↓
    Updates map marker
    Calculates route
```

## State Management Flow

```
Initial Load
    ↓
Mock Orders Loaded
(in real: API call)
    ↓
Set Active Orders
    ↓
Display Orders List
    ↓
User Clicks Order
    ↓
Set Selected Order
    ↓
Update Map with
Delivery Location
    ↓
User Clicks "🟢 Online"
    ↓
Set isOnline = true
    ↓
Start Geolocation Watch
    ↓
Every 5 seconds:
    ├─ Get GPS coordinates
    ├─ Update driverLocation state
    ├─ Update driver marker on map
    ├─ Emit to server
    └─ Calculate route
         ↓
User Updates Status
    ├─ Set new status
    ├─ Emit to server
    ├─ Server updates DB
    └─ Server notifies others
         ↓
User Clicks "🔴 Offline"
    ↓
Set isOnline = false
    ↓
Clear watch ID
    ↓
Stop location tracking
```

## Map Display Structure

```
LEAFLET MAP
    │
    ├─ Base Layer: OpenStreetMap tiles
    │
    ├─ Markers Layer
    │   ├─ Driver Marker (🔴 Red)
    │   │   └─ Updates: Every location update
    │   │
    │   ├─ Customer Marker (🟢 Green)
    │   │   └─ Updates: When customer shares location
    │   │
    │   └─ Restaurant Marker (🟠 Orange)
    │       └─ Static: from order data
    │
    ├─ Route Layer
    │   └─ Leaflet Routing Machine
    │       ├─ From: Driver location
    │       ├─ To: Customer location
    │       └─ Updates: When locations change
    │
    └─ Controls
        ├─ Zoom controls
        ├─ Pan controls
        └─ Attribution
```

## File Organization

```
admin/
├── src/
│   ├── App.jsx (updated - added route)
│   │
│   ├── components/
│   │   └── sidebar/
│   │       └── sidebar.jsx (updated - added link)
│   │
│   └── pages/
│       └── DriverTracking/
│           ├── DriverTracking.jsx      (main component)
│           ├── DriverTracking.css      (styling)
│           ├── README.md               (full docs)
│           ├── QUICKSTART.md           (setup guide)
│           └── IMPLEMENTATION.md       (technical details)
```

## Technology Stack

```
FRONTEND
├── React 18+
├── React Router 6+
├── Socket.io Client 4.5+
├── Leaflet 1.9+
├── Leaflet Routing Machine 3.2+
└── Axios

BACKEND (To be implemented)
├── Node.js / Express
├── Socket.io Server
├── MongoDB / PostgreSQL
├── JWT Authentication
└── REST API

APIs USED
├── Browser Geolocation API
├── OpenStreetMap (tiles)
├── Leaflet Routing API
└── Web Sockets (Socket.io)
```

## Feature Comparison Matrix

```
                    Customer    Driver
Location Tracking      View       Track
Delivery Address       View       View + Navigate
Customer Location      -          View
Driver Location        View       View + Share
Order Items            View       View
Order Status          View       Update
Call Customer         Yes        Yes
Multiple Orders       No         Yes
Online Toggle         -          Yes
Route Display         Yes        Yes
Distance/ETA          View       View
Real-time Updates     Yes (recv) Yes (send+recv)
GPS Permission        Required   Required
Map Interaction       View-only  Interactive
```

---

**This architecture ensures:**
- ✅ Real-time location sharing
- ✅ Reliable order management
- ✅ Responsive user interface
- ✅ Scalable backend integration
- ✅ Mobile-optimized experience
