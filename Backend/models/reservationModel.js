import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
  restaurantId: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  guests: { type: Number, required: true, min: 1 },
  seating: { type: String, required: true },
  notes: { type: String, default: "" },
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now }
});

const reservationModel =
  mongoose.models.reservation || mongoose.model("reservation", reservationSchema);

export default reservationModel;
