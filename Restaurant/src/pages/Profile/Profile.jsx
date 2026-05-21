import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import assets from '../../assets/assets';
import { useParams } from 'react-router-dom';
import './Profile.css';

const initialFormState = {
    restaurantName: '',
    email: '',
    phoneNumber: '',
    address: '',
    description: '',
    openingHours: '',
    password: ''
};

const Profile = ({ url }) => {
    const { restaurantId } = useParams();
    const [formData, setFormData] = useState(initialFormState);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(assets.tempLogo);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchProfile = async () => {
        try {
            setIsLoading(true);
            if (!restaurantId) {
                toast.error('No restaurant ID provided');
                setIsLoading(false);
                return;
            }
            const response = await axios.get(`${url}/api/restaurant-profile/${restaurantId}`);

            if (!response.data.success) {
                toast.error(response.data.message || 'Failed to load profile');
                return;
            }

            const data = response.data.data || {};
            setFormData({
                restaurantName: data.restaurantName || '',
                email: data.email || '',
                phoneNumber: data.phoneNumber || '',
                address: data.address || '',
                description: data.description || '',
                openingHours: data.openingHours || '',
                password: ''
            });

            if (data.logo) {
                setLogoPreview(`${url}/images/${data.logo}`);
            } else {
                setLogoPreview(assets.tempLogo);
            }

            setLogoFile(null);
        } catch (error) {
            console.error('Error loading restaurant profile:', error);
            toast.error('Error loading restaurant profile');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
        // eslint-disable-next-line
    }, [url, restaurantId]);

    useEffect(() => {
        return () => {
            if (logoPreview.startsWith('blob:')) {
                URL.revokeObjectURL(logoPreview);
            }
        };
    }, [logoPreview]);

    const onChangeHandler = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const onLogoChange = (event) => {
        const selectedFile = event.target.files?.[0];
        if (!selectedFile) {
            return;
        }

        if (logoPreview.startsWith('blob:')) {
            URL.revokeObjectURL(logoPreview);
        }

        setLogoFile(selectedFile);
        setLogoPreview(URL.createObjectURL(selectedFile));
    };

    const onSubmitHandler = async (event) => {
        event.preventDefault();

        if (!formData.restaurantName.trim()) {
            toast.error('Restaurant name is required');
            return;
        }

        const payload = new FormData();
        payload.append('restaurantId', restaurantId);
        payload.append('restaurantName', formData.restaurantName);
        payload.append('email', formData.email);
        payload.append('phoneNumber', formData.phoneNumber);
        payload.append('address', formData.address);
        payload.append('description', formData.description);
        payload.append('openingHours', formData.openingHours);
        if (formData.password.trim()) {
            payload.append('password', formData.password);
        }

        if (logoFile) {
            payload.append('logo', logoFile);
        }

        try {
            setIsSaving(true);
            const response = await axios.post(`${url}/api/restaurant-profile/update`, payload);

            if (response.data.success) {
                toast.success(response.data.message || 'Profile saved successfully');
                window.dispatchEvent(new Event('restaurant-logo-updated'));
                fetchProfile();
            } else {
                toast.error(response.data.message || 'Failed to save profile');
            }
        } catch (error) {
            console.error('Error saving restaurant profile:', error);
            toast.error(error.response?.data?.message || 'Error saving restaurant profile');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="profile-page">
                <div className="profile-card">
                    <h2>Restaurant Profile</h2>
                    <p className="profile-loading">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="profile-card">
                <h2>Restaurant Profile</h2>
                <p className="profile-subtitle">Update your restaurant details shown across the system.</p>

                <form className="profile-form" onSubmit={onSubmitHandler}>
                    <div className="profile-logo-field">
                        <label htmlFor="logo">Restaurant Logo</label>
                        <label htmlFor="logo" className="profile-logo-upload">
                            <img src={logoPreview} alt="Restaurant logo preview" />
                        </label>
                        <input id="logo" type="file" accept="image/*" onChange={onLogoChange} hidden />
                    </div>

                    <div className="profile-grid">
                        <div className="profile-field">
                            <label htmlFor="password">Change Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={onChangeHandler}
                                placeholder="Enter a new password"
                                autoComplete="new-password"
                            />
                        </div>
                        <div className="profile-field">
                            <label htmlFor="restaurantName">Restaurant Name</label>
                            <input
                                id="restaurantName"
                                name="restaurantName"
                                type="text"
                                value={formData.restaurantName}
                                onChange={onChangeHandler}
                                placeholder="Enter restaurant name"
                            />
                        </div>

                        <div className="profile-field">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={onChangeHandler}
                                placeholder="Enter email"
                            />
                        </div>

                        <div className="profile-field">
                            <label htmlFor="phoneNumber">Phone Number</label>
                            <input
                                id="phoneNumber"
                                name="phoneNumber"
                                type="text"
                                value={formData.phoneNumber}
                                onChange={onChangeHandler}
                                placeholder="Enter phone number"
                            />
                        </div>

                        <div className="profile-field">
                            <label htmlFor="openingHours">Opening Hours</label>
                            <input
                                id="openingHours"
                                name="openingHours"
                                type="text"
                                value={formData.openingHours}
                                onChange={onChangeHandler}
                                placeholder="e.g. Sun-Sat: 10:00 AM - 10:00 PM"
                            />
                        </div>
                    </div>

                    <div className="profile-field">
                        <label htmlFor="address">Address</label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={onChangeHandler}
                            placeholder="Enter restaurant address"
                            rows="3"
                        />
                    </div>

                    <div className="profile-field">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={onChangeHandler}
                            placeholder="Enter short restaurant description"
                            rows="4"
                        />
                    </div>

                    <button type="submit" disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Profile'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Profile;
