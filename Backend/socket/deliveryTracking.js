// Mapping to track active orders: orderId -> { driverId, customerId, driverSocketId, customerSocketId }
const activeOrderRooms = new Map();

export const initializeSocketHandlers = (io) => {
    io.on("connection", (socket) => {
        console.log(`Client connected: ${socket.id}`);

        // Driver joins order room with location
        socket.on("join-order-room", (data) => {
            const { orderId, driverId, role } = data;

            socket.join(`order-${orderId}`);
            console.log(`${role} joined order room: order-${orderId}`);

            // Store socket mapping
            if (!activeOrderRooms.has(orderId)) {
                activeOrderRooms.set(orderId, {});
            }

            const room = activeOrderRooms.get(orderId);
            if (role === "driver") {
                room.driverId = driverId;
                room.driverSocketId = socket.id;
            } else if (role === "customer") {
                room.customerId = data.customerId;
                room.customerSocketId = socket.id;
            }
        });

        // Driver sends location update
        socket.on("driver-location-update", (data) => {
            const { orderId, latitude, longitude, driverId } = data;

            // Emit only to customers in this order room
            io.to(`order-${orderId}`).emit("driver-location-updated", {
                orderId,
                driverId,
                latitude,
                longitude,
                timestamp: new Date().toISOString(),
            });

            console.log(`Driver location updated for order ${orderId}`);
        });

        // Customer sends location update
        socket.on("customer-location-update", (data) => {
            const { orderId, latitude, longitude } = data;

            // Emit only to drivers in this order room
            io.to(`order-${orderId}`).emit("customer-location-updated", {
                orderId,
                latitude,
                longitude,
                timestamp: new Date().toISOString(),
            });

            console.log(`Customer location updated for order ${orderId}`);
        });

        // Admin/system updates delivery status
        socket.on("delivery-status-update", (data) => {
            const { orderId, status, driverId } = data;

            // Broadcast to all users in order room
            io.to(`order-${orderId}`).emit("delivery-status-updated", {
                orderId,
                status,
                driverId,
                timestamp: new Date().toISOString(),
            });

            console.log(`Delivery status updated for order ${orderId}: ${status}`);
        });

        // User leaves order room (delivery completed or cancelled)
        socket.on("leave-order-room", (data) => {
            const { orderId, role } = data;
            socket.leave(`order-${orderId}`);
            console.log(`${role} left order room: order-${orderId}`);

            // Clean up mapping if room is empty
            const room = activeOrderRooms.get(orderId);
            if (room) {
                if (role === "driver") {
                    delete room.driverId;
                    delete room.driverSocketId;
                } else if (role === "customer") {
                    delete room.customerId;
                    delete room.customerSocketId;
                }

                if (Object.keys(room).length === 0) {
                    activeOrderRooms.delete(orderId);
                }
            }
        });

        socket.on("disconnect", () => {
            console.log(`Client disconnected: ${socket.id}`);

            // Clean up any rooms this socket was in
            for (const [orderId, room] of activeOrderRooms.entries()) {
                if (room.driverSocketId === socket.id) {
                    delete room.driverId;
                    delete room.driverSocketId;
                }
                if (room.customerSocketId === socket.id) {
                    delete room.customerId;
                    delete room.customerSocketId;
                }

                if (Object.keys(room).length === 0) {
                    activeOrderRooms.delete(orderId);
                }
            }
        });
    });
};
