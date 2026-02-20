import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./Reservations.css";

const Reservations = ({ url }) => {
  const [reservations, setReservations] = useState([]);

  const fetchReservations = async () => {
    try {
      const response = await axios.get(`${url}/api/reservation/list`);
      if (response.data.success) {
        setReservations(response.data.data);
      } else {
        toast.error(response.data.message || "Error");
      }
    } catch (error) {
      console.log(error);
      toast.error("Server error");
    }
  };

  const statusHandler = async (event, reservationId) => {
    try {
      const response = await axios.post(`${url}/api/reservation/status`, {
        reservationId,
        status: event.target.value
      });

      if (response.data.success) {
        await fetchReservations();
      } else {
        toast.error(response.data.message || "Error");
      }
    } catch (error) {
      console.log(error);
      toast.error("Server error");
    }
  };

  const deleteHandler = async (reservationId) => {
    try {
      const response = await axios.post(`${url}/api/reservation/delete`, {
        reservationId
      });

      if (response.data.success) {
        toast.success(response.data.message || "Deleted");
        await fetchReservations();
      } else {
        toast.error(response.data.message || "Error");
      }
    } catch (error) {
      console.log(error);
      toast.error("Server error");
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  return (
    <div className="reservations">
      <div className="reservations-header">
        <div>
          <h3>Table Reservations</h3>
          <p>Manage incoming reservations and update their status.</p>
        </div>
        <button className="reservations-refresh" type="button" onClick={fetchReservations}>
          Refresh
        </button>
      </div>

      {reservations.length === 0 ? (
        <div className="reservations-empty">No reservations yet.</div>
      ) : (
        <div className="reservations-list">
          {reservations.map((reservation) => (
            <div key={reservation._id} className="reservation-item">
              <div>
                <p className="reservation-name">{reservation.name}</p>
                <p className="reservation-meta">{reservation.email} • {reservation.phone}</p>
                {reservation.notes ? (
                  <p className="reservation-notes">{reservation.notes}</p>
                ) : (
                  <p className="reservation-notes muted">No special requests</p>
                )}
              </div>
              <div>
                <p className="reservation-label">Date</p>
                <p className="reservation-value">{reservation.date}</p>
                <p className="reservation-subvalue">{reservation.time}</p>
              </div>
              <div>
                <p className="reservation-label">Guests</p>
                <p className="reservation-value">{reservation.guests}</p>
              </div>
              <div>
                <p className="reservation-label">Seating</p>
                <p className="reservation-value">{reservation.seating}</p>
              </div>
              <div className="reservation-actions">
                <select
                  value={reservation.status}
                  onChange={(event) => statusHandler(event, reservation._id)}
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Seated">Seated</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <button
                  className="reservation-delete"
                  type="button"
                  onClick={() => deleteHandler(reservation._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reservations;
