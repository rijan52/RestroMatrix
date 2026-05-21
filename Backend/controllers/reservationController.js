import reservationModel from "../models/reservationModel.js";

const createReservation = async (req, res) => {
  const { restaurantId, name, phone, email, date, time, guests, seating, notes } = req.body;

  if (!restaurantId || !name || !phone || !email || !date || !time || !guests || !seating) {
    return res.json({ success: false, message: "Missing required fields" });
  }

  try {
    const reservation = new reservationModel({
      restaurantId,
      name,
      phone,
      email,
      date,
      time,
      guests: Number(guests),
      seating,
      notes: notes || ""
    });

    await reservation.save();
    res.json({ success: true, data: reservation });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error?.message || "Error" });
  }
};

const listReservations = async (req, res) => {
  try {
    const { restaurantId } = req.query;
    const filter = restaurantId ? { restaurantId } : {};
    const reservations = await reservationModel.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: reservations });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

const updateReservationStatus = async (req, res) => {
  const { reservationId, status } = req.body;

  try {
    const updated = await reservationModel.findByIdAndUpdate(
      reservationId,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.json({ success: false, message: "Reservation not found" });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

const deleteReservation = async (req, res) => {
  const { reservationId } = req.body;

  try {
    const deleted = await reservationModel.findByIdAndDelete(reservationId);
    if (!deleted) {
      return res.json({ success: false, message: "Reservation not found" });
    }

    res.json({ success: true, message: "Reservation deleted" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export { createReservation, listReservations, updateReservationStatus, deleteReservation };
