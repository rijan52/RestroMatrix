import React, { useContext, useMemo, useState } from "react";
import axios from "axios";
import "./TableReservation.css";
import { StoreContext } from "../../context/StoreContext";
import { useParams } from "react-router-dom";

const defaultForm = {
    name: "",
    phone: "",
    email: "",
    date: "",
    time: "",
    guests: "2",
    seating: "Indoor",
    notes: "",
};

const TableReservation = () => {
    const { url } = useContext(StoreContext);
    const { restaurantId } = useParams();
    const [form, setForm] = useState(defaultForm);
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const minDate = useMemo(() => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    }, []);

    const onChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const onSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await axios.post(`${url}/api/reservation/create`, {
                restaurantId,
                ...form,
                guests: Number(form.guests)
            });

            if (response.data.success) {
                setSubmitted(true);
            } else {
                alert(response.data.message || "Reservation failed");
            }
        } catch (error) {
            console.log(error);
            alert("Server error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const onReset = () => {
        setForm(defaultForm);
        setSubmitted(false);
    };

    return (
        <section className="reservation">
            <div className="reservation-hero">
                <div className="reservation-title">
                    <p className="reservation-kicker">Plan your evening</p>
                    <h2>Reserve a table in seconds</h2>
                    <p className="reservation-lead">
                        Choose the perfect time, tell us your preferences, and we will have everything ready for your arrival.
                    </p>
                </div>
                <div className="reservation-card">
                    <form className="reservation-form" onSubmit={onSubmit}>
                        <div className="reservation-grid">
                            <div className="field">
                                <label htmlFor="name">Full name</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={form.name}
                                    onChange={onChange}
                                    placeholder="Your name"
                                    required
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="phone">Phone</label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={onChange}
                                    placeholder="+977 98XXXXXXXX"
                                    required
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={onChange}
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="date">Date</label>
                                <input
                                    id="date"
                                    name="date"
                                    type="date"
                                    min={minDate}
                                    value={form.date}
                                    onChange={onChange}
                                    required
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="time">Time</label>
                                <input
                                    id="time"
                                    name="time"
                                    type="time"
                                    value={form.time}
                                    onChange={onChange}
                                    required
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="guests">Guests</label>
                                <select id="guests" name="guests" value={form.guests} onChange={onChange}>
                                    <option value="1">1 guest</option>
                                    <option value="2">2 guests</option>
                                    <option value="3">3 guests</option>
                                    <option value="4">4 guests</option>
                                    <option value="5">5 guests</option>
                                    <option value="6">6 guests</option>
                                    <option value="7">7 guests</option>
                                    <option value="8">8 guests</option>
                                </select>
                            </div>
                            <div className="field">
                                <label htmlFor="seating">Seating</label>
                                <select id="seating" name="seating" value={form.seating} onChange={onChange}>
                                    <option value="Indoor">Indoor</option>
                                    <option value="Outdoor">Outdoor</option>
                                    <option value="Window">Window</option>
                                    <option value="Private">Private dining</option>
                                </select>
                            </div>
                            <div className="field field-full">
                                <label htmlFor="notes">Special requests</label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={form.notes}
                                    onChange={onChange}
                                    placeholder="Allergies, celebrations, seating preferences"
                                    rows="3"
                                />
                            </div>
                        </div>
                        <div className="reservation-actions">
                            <button className="primary" type="submit" disabled={isSubmitting}>
                                Confirm reservation
                            </button>
                            <button className="ghost" type="button" onClick={onReset} disabled={isSubmitting}>
                                Reset
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className={`reservation-summary ${submitted ? "show" : ""}`}>
                <div>
                    <h3>Reservation received</h3>
                    <p>We will message you within 15 minutes to confirm the table.</p>
                </div>
                <div className="summary-grid">
                    <div>
                        <span>Name</span>
                        <strong>{form.name || "Guest"}</strong>
                    </div>
                    <div>
                        <span>Guests</span>
                        <strong>{form.guests}</strong>
                    </div>
                    <div>
                        <span>Date</span>
                        <strong>{form.date || "-"}</strong>
                    </div>
                    <div>
                        <span>Time</span>
                        <strong>{form.time || "-"}</strong>
                    </div>
                    <div>
                        <span>Seating</span>
                        <strong>{form.seating}</strong>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TableReservation;
