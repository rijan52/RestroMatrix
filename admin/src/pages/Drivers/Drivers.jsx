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
        driverPhone: "",
        driverVehicle: ""
    });

    const fetchDrivers = async () => {
        try {
            const response = await axios.get(`${url}/api/user/drivers`);
            if (response.data.success) {
                setDrivers(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching drivers:', error);
            toast.error("Failed to fetch drivers");
        }
    };

    useEffect(() => {
        fetchDrivers();
    }, []);

    const onChangeHandler = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
            const submitData = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: "driver",
                driverPhone: formData.driverPhone,
                driverVehicle: formData.driverVehicle
            };

            const response = await axios.post(`${url}/api/user/register`, submitData);

            if (response.data.success) {
                toast.success("Driver account created successfully!");
                setFormData({
                    name: "",
                    email: "",
                    password: "",
                    driverPhone: "",
                    driverVehicle: ""
                });
                setShowForm(false);
                fetchDrivers();
            } else {
                toast.error(response.data.message || "Failed to create driver");
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Server error");
        } finally {
            setLoading(false);
        }
    };

    const deleteDriver = async (driverId) => {
        if (!window.confirm("Are you sure you want to delete this driver?")) return;

        try {
            const response = await axios.delete(`${url}/api/user/driver/${driverId}`);

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
                                name='driverPhone'
                                value={formData.driverPhone}
                                onChange={onChangeHandler}
                                placeholder='Phone number'
                                required
                            />
                        </div>

                        <div className='form-group'>
                            <label>Vehicle Info</label>
                            <input
                                type='text'
                                name='driverVehicle'
                                value={formData.driverVehicle}
                                onChange={onChangeHandler}
                                placeholder='e.g., Bike, Car, Scooter'
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
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drivers.map((driver) => (
                                <tr key={driver._id}>
                                    <td>{driver.name}</td>
                                    <td>{driver.email}</td>
                                    <td>{driver.driverPhone || '-'}</td>
                                    <td>{driver.driverVehicle || '-'}</td>
                                    <td>
                                        <span className={`status ${driver.isOnline ? 'online' : 'offline'}`}>
                                            {driver.isOnline ? 'Online' : 'Offline'}
                                        </span>
                                    </td>
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
