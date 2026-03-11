import "dotenv/config"
import express from "express"
import cors from "cors"
import { createServer } from 'http'
import { Server } from 'socket.io'
import { connectDB } from "./config/db.js"
import foodRouter from "./routes/foodRoute.js"
import userRouter from "./routes/userRoute.js"
import cartRouter from "./routes/cartRoute.js"
import orderRouter from "./routes/orderRoute.js"
import reservationRouter from "./routes/reservationRoute.js"


const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    credentials: true
  }
})
const port = 4000

// Store active driver-customer relationships
const activeDeliveries = new Map()
const userSockets = new Map()


//middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    credentials: true
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//db connection

connectDB();


//api endpoints
app.use('/api/food', foodRouter)
app.use("/images", express.static("uploads"))
app.use('/api/user', userRouter)
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

  // Driver sends his location
  socket.on('driver-location', (data) => {
    const { driverId, orderId, latitude, longitude } = data

    // Update delivery tracking info
    if (orderId && activeDeliveries.has(orderId)) {
      const delivery = activeDeliveries.get(orderId)
      delivery.driverLocation = { latitude, longitude }
      delivery.lastUpdate = new Date()

      // Broadcast driver location to customer
      if (delivery.customerSocketId) {
        io.to(delivery.customerSocketId).emit('driver-location-update', {
          driverId,
          latitude,
          longitude,
          timestamp: new Date().toISOString()
        })
      }
    }

    // Also broadcast to all connected clients (for general tracking)
    socket.broadcast.emit('receive-location', { driverId, latitude, longitude })
  })

  // Customer sends his location
  socket.on('customer-location', (data) => {
    const { customerId, orderId, latitude, longitude } = data

    // Update delivery tracking info
    if (orderId && activeDeliveries.has(orderId)) {
      const delivery = activeDeliveries.get(orderId)
      delivery.customerLocation = { latitude, longitude }
      delivery.lastUpdate = new Date()

      // Broadcast customer location to driver
      if (delivery.driverSocketId) {
        io.to(delivery.driverSocketId).emit('customer-location', {
          customerId,
          latitude,
          longitude,
          timestamp: new Date().toISOString()
        })
      }
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

      console.log(`Delivery ${orderId} started by driver ${socket.id}`)

      // Notify the driver
      socket.emit('delivery-status-update', { status: 'on-way' })
    }
  })

  // Driver completes delivery
  socket.on('delivery-completed', (data) => {
    const { orderId, status } = data

    if (orderId && activeDeliveries.has(orderId)) {
      const delivery = activeDeliveries.get(orderId)
      delivery.status = 'delivered'
      delivery.completedAt = new Date()

      // Notify customer
      if (delivery.customerSocketId) {
        io.to(delivery.customerSocketId).emit('delivery-completed', {
          orderId,
          status: 'delivered',
          completedAt: new Date().toISOString()
        })
      }

      console.log(`Delivery ${orderId} completed`)

      // Remove after 5 minutes
      setTimeout(() => {
        activeDeliveries.delete(orderId)
      }, 5 * 60 * 1000)
    }
  })

  // Link driver to customer for an order
  socket.on('assign-order-to-driver', (data) => {
    const { orderId, driverSocketId, customerSocketId } = data

    if (driverSocketId && customerSocketId) {
      activeDeliveries.set(orderId, {
        orderId,
        driverSocketId,
        customerSocketId,
        status: 'ready',
        createdAt: new Date(),
        driverLocation: null,
        customerLocation: null
      })

      // Notify both driver and customer
      io.to(driverSocketId).emit('order-assigned', { orderId })
      io.to(customerSocketId).emit('driver-assigned', { orderId, driverSocketId })
    }
  })

  // Listen for location updates from drivers (backward compatibility)
  socket.on('send-location', (data) => {
    // Broadcast to all connected clients
    io.emit('receive-location', data)
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


