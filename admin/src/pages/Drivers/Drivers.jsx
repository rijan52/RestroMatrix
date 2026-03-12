import React, { useState, useEffect } from 'react';
import './Drivers.css';
import { toast } from 'react-toastify';
import axios from 'axios';

const Drivers = ({ url }) => {
    const [drivers, setDrivers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        vehicle: "",
        vehicleNumber: ""
    });

    const fetchDrivers = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${url}/api/driver/all`);
            if (response.data.success) {
                setDrivers(response.data.data || []);
            } else {
                toast.error(response.data.message || "Failed to fetch drivers");
                setDrivers([]);
            }
        } catch (error) {
            console.error('Error fetching drivers:', error);
            toast.error(error.response?.data?.message || "Failed to fetch drivers");
            setDrivers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (url) {
            fetchDrivers();
        }
    }, [url]);

    const onChangeHandler = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
            const submitData = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password.trim(),
                phone: formData.phone.trim(),
                vehicle: formData.vehicle.trim(),
                vehicleNumber: formData.vehicleNumber.trim()
            };

            // Debug: log the data being sent
            console.log("Submitting driver data:", submitData);

            const response = await axios.post(`${url}/api/driver/register`, submitData);

            if (response.data.success) {
                toast.success("Driver account created successfully!");
                setFormData({
                    name: "",
                    email: "",
                    password: "",
                    phone: "",
                    vehicle: "",
                    vehicleNumber: ""
                });
                setShowForm(false);
                fetchDrivers();
            } else {
                toast.error(response.data.message || "Failed to create driver");
            }
        } catch (error) {
            console.error("Error details:", error.response?.data);
            console.error("Error:", error);
            toast.error(error.response?.data?.message || "Server error");
        } finally {
            setLoading(false);
        }
    }

    const deleteDriver = async (driverId) => {
        if (!window.confirm("Are you sure you want to delete this driver?")) return;

        try {
            const response = await axios.delete(`${url}/api/driver/${driverId}`);

            if (response.data.success) {
                toast.success("Driver deleted successfully!");
                fetchDrivers();
            } else {
                toast.error(response.data.message || "Failed to delete driver");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete driver");
        }
    };

    return (
        <div className='drivers-container'>
            <div className='drivers-header'>
                <h1>Driver Management</h1>
                <button
                    className='add-driver-btn'
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? "Cancel" : "+ Add New Driver"}
                </button>
            </div>

            {showForm && (
                <div className='driver-form-wrapper'>
                    <form className='driver-form' onSubmit={onSubmitHandler}>
                        <h2>Create New Driver Account</h2>

                        <div className='form-group'>
                            <label>Name</label>
                            <input
                                type='text'
                                name='name'
                                value={formData.name}
                                onChange={onChangeHandler}
                                placeholder='Driver name'
                                required
                            />
                        </div>

                        <div className='form-group'>
                            <label>Email</label>
                            <input
                                type='email'
                                name='email'
                                value={formData.email}
                                onChange={onChangeHandler}
                                placeholder='Driver email'
                                required
                            />
                        </div>

                        <div className='form-group'>
                            <label>Password</label>
                            <input
                                type='password'
                                name='password'
                                value={formData.password}
                                onChange={onChangeHandler}
                                placeholder='Set password'
                                required
                            />
                        </div>

                        <div className='form-group'>
                            <label>Phone Number</label>
                            <input
                                type='tel'
                                name='phone'
                                value={formData.phone}
                                onChange={onChangeHandler}
                                placeholder='Phone number'
                                required
                            />
                        </div>

                        <div className='form-group'>
                            <label>Vehicle Type</label>
                            <input
                                type='text'
                                name='vehicle'
                                value={formData.vehicle}
                                onChange={onChangeHandler}
                                placeholder='e.g., Bike, Car, Scooter'
                                required
                            />
                        </div>

                        <div className='form-group'>
                            <label>Vehicle Number</label>
                            <input
                                type='text'
                                name='vehicleNumber'
                                value={formData.vehicleNumber}
                                onChange={onChangeHandler}
                                placeholder='Vehicle registration number'
                                required
                            />
                        </div>

                        <button
                            type='submit'
                            className='submit-btn'
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Driver Account'}
                        </button>
                    </form>
                </div>
            )}

            <div className='drivers-list'>
                <h2>All Drivers ({drivers.length})</h2>
                {drivers.length === 0 ? (
                    <p className='no-drivers'>No drivers found. Create one to get started!</p>
                ) : (
                    <table className='drivers-table'>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Vehicle</th>
                                <th>Vehicle Number</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drivers.map((driver) => (
                                <tr key={driver._id}>
                                    <td>{driver.name}</td>
                                    <td>{driver.email}</td>
                                    <td>{driver.phone || '-'}</td>
                                    <td>{driver.vehicle || '-'}</td>
                                    <td>{driver.vehicleNumber || '-'}</td>
                                    <td>
                                        <button
                                            className='delete-btn'
                                            onClick={() => deleteDriver(driver._id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Drivers;
