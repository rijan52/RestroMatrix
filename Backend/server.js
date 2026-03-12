import "dotenv/config"
import express from "express"
import cors from "cors"
import { createServer } from 'http'
import { Server } from 'socket.io'
import { connectDB } from "./config/db.js"
import foodRouter from "./routes/foodRoute.js"
import customerRouter from "./routes/customerRoute.js"
import driverRouter from "./routes/driverRoute.js"
import cartRouter from "./routes/cartRoute.js"
import orderRouter from "./routes/orderRoute.js"
import reservationRouter from "./routes/reservationRoute.js"


const app = express()
const httpServer = createServer(app)

// Define allowed origins
const allowedOrigins = [
  // Local development
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  // Render deployment
  "https://restromatrix-1.onrender.com",
  // Vercel deployments
  "https://restro-matrix-te9i.vercel.app",
  "https://restro-matrix-admin.vercel.app",
  // Environment variables
  process.env.FRONTEND_URL,
  process.env.DRIVER_URL,
  process.env.ADMIN_URL
].filter(Boolean)

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
})
const port = process.env.PORT || 4000

// Store active driver-customer relationships
const activeDeliveries = new Map()
const userSockets = new Map()


//middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//db connection

connectDB();

// Validate environment variables
if (!process.env.JWT_SECRET) {
  console.error("ERROR: JWT_SECRET is not defined in environment variables");
  console.error("Please set JWT_SECRET in your .env file or Render environment settings");
}

//api endpoints
app.use('/api/food', foodRouter)
app.use("/images", express.static("uploads"))
app.use('/api/customer', customerRouter)
app.use('/api/driver', driverRouter)
app.use('/api/cart', cartRouter)
app.use('/api/order', orderRouter)
app.use('/api/reservation', reservationRouter)



app.get('/', (req, res) => {
  res.send('Server is working!')
})

// Socket.io connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id)

  // Register user socket
  userSockets.set(socket.id, { socketId: socket.id, type: null, orderId: null })

  // Customer watches an order for live tracking
  socket.on('watch-order', (data) => {
    const { orderId } = data

    if (orderId) {
      // Store customer socket info for this order
      if (!activeDeliveries.has(orderId)) {
        activeDeliveries.set(orderId, {
          orderId,
          customerSocketId: socket.id,
          status: 'watching',
          createdAt: new Date(),
          driverLocation: null,
          customerLocation: null
        })
      } else {
        const delivery = activeDeliveries.get(orderId)
        delivery.customerSocketId = socket.id
      }

      // Join socket to a room for this order
      socket.join(`order-${orderId}`)
      console.log(`Customer ${socket.id} is now watching order ${orderId}`)
    }
  })

  // Driver sends his location
  socket.on('driver-location', (data) => {
    const { latitude, longitude } = data

    // Broadcast to all customers watching any order
    // We'll broadcast to all orders this driver might be delivering
    socket.broadcast.emit('driver-location', { latitude, longitude })
  })

  // Driver updates location with order ID (more specific)
  socket.on('driver-location-update', (data) => {
    const { orderId, latitude, longitude, driverId } = data

    if (orderId) {
      // Update delivery tracking info
      if (!activeDeliveries.has(orderId)) {
        activeDeliveries.set(orderId, {
          orderId,
          driverSocketId: socket.id,
          driverId,
          status: 'delivering',
          createdAt: new Date(),
          driverLocation: { latitude, longitude },
          lastUpdate: new Date()
        })
      } else {
        const delivery = activeDeliveries.get(orderId)
        delivery.driverLocation = { latitude, longitude }
        delivery.driverSocketId = socket.id
        delivery.driverId = driverId
        delivery.lastUpdate = new Date()
      }

      // Broadcast driver location to customers watching this specific order
      io.to(`order-${orderId}`).emit('driver-location', {
        latitude,
        longitude,
        driverId,
        orderId,
        timestamp: new Date().toISOString()
      })

      console.log(`Driver location updated for order ${orderId}: ${latitude}, ${longitude}`)
    }
  })

  // Customer sends his location
  socket.on('customer-location', (data) => {
    const { customerId, orderId, latitude, longitude } = data

    // Update delivery tracking info
    if (orderId && activeDeliveries.has(orderId)) {
      const delivery = activeDeliveries.get(orderId)
      delivery.customerLocation = { latitude, longitude }
      delivery.lastUpdate = new Date()
    }
  })

  // Driver starts delivery
  socket.on('delivery-started', (data) => {
    const { orderId, status } = data

    if (orderId) {
      if (!activeDeliveries.has(orderId)) {
        activeDeliveries.set(orderId, {
          orderId,
          driverSocketId: socket.id,
          status: 'on-way',
          startedAt: new Date(),
          driverLocation: null,
          customerLocation: null
        })
      } else {
        const delivery = activeDeliveries.get(orderId)
        delivery.driverSocketId = socket.id
        delivery.status = status
      }

      // Notify customers watching this order
      io.to(`order-${orderId}`).emit('delivery-status-update', { status: 'on-way' })
      console.log(`Delivery ${orderId} started by driver ${socket.id}`)
    }
  })

  // Driver completes delivery
  socket.on('delivery-completed', (data) => {
    const { orderId, status } = data

    if (orderId && activeDeliveries.has(orderId)) {
      const delivery = activeDeliveries.get(orderId)
      delivery.status = 'delivered'
      delivery.completedAt = new Date()

      // Notify customers watching this order
      io.to(`order-${orderId}`).emit('delivery-completed', {
        orderId,
        status: 'delivered',
        completedAt: new Date().toISOString()
      })

      console.log(`Delivery ${orderId} completed`)

      // Remove after 5 minutes
      setTimeout(() => {
        activeDeliveries.delete(orderId)
      }, 5 * 60 * 1000)
    }
  })

  // Get active deliveries
  socket.on('get-active-deliveries', (callback) => {
    const deliveries = Array.from(activeDeliveries.values())
    if (callback) {
      callback(deliveries)
    }
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)

    // Remove user from socket map
    userSockets.delete(socket.id)

    // Clean up driver-customer relationships
    for (const [orderId, delivery] of activeDeliveries.entries()) {
      if (delivery.driverSocketId === socket.id || delivery.customerSocketId === socket.id) {
        delivery.status = 'disconnected'
      }
    }
  })
})

httpServer.listen(port, () => {
  console.log(`Server Started on http://localhost:${port}`)
})


