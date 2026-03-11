# Driver-Side Live Delivery Tracking

## Overview
The Driver-Side Live Delivery Tracking feature is a comprehensive real-time tracking system for delivery drivers. It allows drivers to manage their active deliveries, track real-time locations, and update delivery statuses.

## Features

### 1. **Dashboard with Active Orders**
- View all active deliveries assigned to the driver
- See order details at a glance (Order ID, Customer name, Address, Item count)
- Click on an order to view detailed tracking information
- Color-coded status badges (Pending, Picked Up, Delivered)

### 2. **Real-Time Location Tracking**
- Interactive map showing:
  - Driver's current location (Red marker)
  - Customer's delivery location (Green marker)
  - Restaurant location (Orange marker)
  - Route between driver and customer
- Real-time GPS tracking with high-accuracy positioning
- Map automatically updates as driver moves

### 3. **Order Management**
- **Order Details Section**: Shows all items in the order with quantities and total price
- **Delivery Location**: Complete address and GPS coordinates
- **Customer Contact**: Direct call button to contact customer
- **Location Coordinates**: Real-time latitude and longitude display

### 4. **Delivery Status Updates**
Three status steps for each delivery:
- ✓ **Picked Up**: Order picked up from restaurant
- 🚗 **On the Way**: Currently delivering to customer
- ✓ **Delivered**: Order successfully delivered

Status updates are sent in real-time to the backend via Socket.io

### 5. **Routing & Navigation**
- Leaflet Routing Machine integration for optimal route display
- Distance and estimated time calculation
- Turn-by-turn navigation hints
- Automatic map fitting to show both driver and customer locations

### 6. **Online/Offline Status**
- Toggle button to show driver availability
- When offline, location tracking pauses
- Other drivers and dispatch can see online status
- Prevents orders from being assigned to offline drivers

### 7. **Real-Time Communication**
- Socket.io integration for:
  - Location updates every 5 seconds
  - Status change notifications
  - Order assignment notifications
  - Customer location data

### 8. **Responsive Design**
- Works on desktop, tablet, and mobile devices
- Sidebar collapses on smaller screens
- Touch-friendly buttons and interface
- Optimized for in-vehicle use

## Technical Stack

- **Frontend Framework**: React.js
- **Real-Time Communication**: Socket.io
- **Mapping**: Leaflet.js with Leaflet Routing Machine
- **Routing**: React Router v6
- **HTTP Client**: Axios

## File Structure

```
admin/src/pages/DriverTracking/
├── DriverTracking.jsx      # Main component
└── DriverTracking.css      # Styling
```

## Installation & Setup

### 1. Dependencies Required
Make sure these packages are installed in the admin project:
```bash
npm install socket.io-client leaflet leaflet-routing-machine axios
npm install --save-dev @types/leaflet @types/leaflet-routing-machine
```

### 2. Import in App
Already added to `App.jsx`:
```jsx
import DriverTracking from './pages/DriverTracking/DriverTracking'
```

### 3. Route Setup
Already added to App routes:
```jsx
<Route path="/driver-tracking" element={<DriverTracking url={url} />} />
```

### 4. Navigation
Click "🚗 Driver Tracking" in the admin sidebar to access the feature.

## Usage

### For Drivers

1. **Login & Access**
   - Log in to the admin panel
   - Click "Driver Tracking" in the sidebar

2. **Go Online**
   - Click the "🟢 Online" button to activate location sharing
   - System starts tracking your location

3. **Manage Orders**
   - View all assigned deliveries in the left sidebar
   - Click on an order to see detailed information
   - Map displays your location and customer location

4. **Update Status**
   - When picking up order: Click "✓ Picked Up"
   - When leaving restaurant: Click "🚗 On the Way"
   - When reaching customer: Click "✓ Delivered"
   - Status changes are sent to backend automatically

5. **Contact Customer**
   - Click the "📞 Call" button to directly call the customer
   - Customer phone number is pre-filled

6. **Go Offline**
   - Click the "🔴 Offline" button to stop location sharing
   - No new orders will be assigned

### For Dispatch/Admin

- View all driver locations in real-time
- See delivery status for each order
- Monitor estimated delivery times
- Reassign orders if needed

## Backend Integration

The feature requires the following backend endpoints and Socket.io events:

### Socket.io Events (Real-Time)

**Emit (Driver → Server):**
- `driver-location`: Send driver's location and status
  ```json
  {
    "orderId": "ORD-001",
    "driverId": "driver-id",
    "latitude": 27.7172,
    "longitude": 85.3240,
    "status": "on-the-way"
  }
  ```
- `update-delivery-status`: Update order status
  ```json
  {
    "orderId": "ORD-001",
    "status": "delivered"
  }
  ```

**Listen (Server → Driver):**
- `receive-location`: Receive customer location
  ```json
  {
    "latitude": 27.7149,
    "longitude": 85.3265
  }
  ```
- `order-assigned`: New order assigned
- `order-cancelled`: Order cancelled

### REST API Endpoints

The feature works with these endpoints:
- `GET /api/order/active` - Get active orders for driver
- `POST /api/order/status` - Update order status
- `GET /api/order/[orderId]` - Get order details

## Customization

### Change Socket Server URL
In `DriverTracking.jsx`, line ~72:
```jsx
socketRef.current = io('http://localhost:3000', {
```
Change `http://localhost:3000` to your backend server URL.

### Change Default Map Center
In `DriverTracking.jsx`, line ~62:
```jsx
mapRef.current = L.map(mapContainer.current).setView([27.7172, 85.3240], 13)
```
Change coordinates to your city/region.

### Adjust GPS Tracking Frequency
In `DriverTracking.jsx`, line ~128:
```jsx
{ enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
```
- `timeout`: Maximum time to wait for location (ms)
- `maximumAge`: Cache freshness requirement (ms)
- `enableHighAccuracy`: Use high-precision GPS

### Customize Marker Icons
Replace the marker icons in `DriverTracking.jsx` lines 29-38 with custom images.

## Data Flow

```
Driver App
    ↓
Real-time Location (GPS) → Socket.io → Backend
                                         ↓
                                    Database
                                         ↓
                         Visible to other drivers
                         & dispatch system
```

## Performance Considerations

1. **Location Updates**: Every 5 seconds via Socket.io
2. **Map Refresh**: Automatic on each location update
3. **Memory**: Markers are reused, old orders cleared
4. **Battery**: GPS location tracking uses significant battery
5. **Network**: Requires stable internet connection

## Browser Compatibility

- Chrome 90+ ✓
- Firefox 88+ ✓
- Safari 14+ ✓
- Edge 90+ ✓

## Known Limitations

1. Requires HTTPS for production (GPS location API requirement)
2. Requires user permission for geolocation access
3. Accuracy depends on GPS signal strength
4. Routing requires internet connection
5. Map tiles require OpenStreetMap/internet access

## Troubleshooting

### Location Not Updating
- Check if browser has geolocation permission
- Verify GPS is enabled on device
- Check internet connection
- Verify Socket.io connection to backend

### Map Not Loading
- Check if Leaflet CSS is properly imported
- Verify OpenStreetMap is accessible
- Clear browser cache and reload

### Routing Not Working
- Install Leaflet Routing Machine: `npm install leaflet-routing-machine`
- Import CSS: `import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'`
- Check if coordinates are valid

### Socket.io Connection Failed
- Verify backend Socket.io server is running
- Check server URL in component
- Check firewall/network settings
- Ensure CORS is enabled on backend

## Future Enhancements

1. **Offline Maps**: Download maps for offline use
2. **Voice Navigation**: Turn-by-turn voice directions
3. **Proof of Delivery**: Photo capture at delivery location
4. **Payment Integration**: In-app payment settlement
5. **Performance Analytics**: Trip time, distance, fuel tracking
6. **Multi-Order Optimization**: Route optimization for multiple deliveries
7. **Customer Rating**: Real-time feedback system
8. **Emergency SOS**: Quick help button

## Support

For issues or feature requests, contact the development team.

## License

Part of RestroMatrix - Food Delivery System
