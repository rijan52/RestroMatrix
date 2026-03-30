import { useParams } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './HeaderCustomization.css';

const initialHeaderState = {
    headerTitle: '',
    headerContent: '',
    headerButtonText: 'View Menu',
    exploreMenuTitle: 'Explore Our Menu',
    exploreMenuDescription:
        'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Sequi dignissimos quasi, mollitia recusandae at magnam iste, inventore debitis perferendis vel magni in? Rerum aliquam modi maxime vitae cupiditate sapiente commodi?'
};

const HeaderCustomization = ({ url }) => {
    const { restaurantId } = useParams();
    const [formData, setFormData] = useState(initialHeaderState);
    const [headerImageFile, setHeaderImageFile] = useState(null);
    const [headerImagePreview, setHeaderImagePreview] = useState('/header.png');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchHeaderSettings = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`${url}/api/restaurant-profile`);

            if (!response.data.success) {
                toast.error(response.data.message || 'Failed to load header settings');
                return;
            }

            const data = response.data.data || {};
            setFormData({
                headerTitle: data.headerTitle || 'Order your favourite food here',
                headerContent:
                    data.headerContent ||
                    'Lorem ipsum dolor sit amet consectetur adipisicing elit. Possimus saepe neque, maxime consequatur obcaecati, sequi doloribus autem aperiam consectetur ratione facilis! Debitis dolore omnis eligendi laboriosam inventore explicabo assumenda magnam.',
                headerButtonText: data.headerButtonText || 'View Menu',
                exploreMenuTitle: data.exploreMenuTitle || 'Explore Our Menu',
                exploreMenuDescription:
                    data.exploreMenuDescription ||
                    'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Sequi dignissimos quasi, mollitia recusandae at magnam iste, inventore debitis perferendis vel magni in? Rerum aliquam modi maxime vitae cupiditate sapiente commodi?'
            });

            if (data.headerBackgroundImage) {
                setHeaderImagePreview(`${url}/images/${data.headerBackgroundImage}?t=${Date.now()}`);
            } else {
                setHeaderImagePreview('/header.png');
            }

            setHeaderImageFile(null);
        } catch (error) {
            console.error('Error loading header settings:', error);
            toast.error('Error loading header settings');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHeaderSettings();
    }, [url]);

    useEffect(() => {
        return () => {
            if (headerImagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(headerImagePreview);
            }
        };
    }, [headerImagePreview]);

    const onChangeHandler = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const onHeaderImageChange = (event) => {
        const selectedFile = event.target.files?.[0];
        if (!selectedFile) {
            return;
        }

        if (headerImagePreview.startsWith('blob:')) {
            URL.revokeObjectURL(headerImagePreview);
        }

        setHeaderImageFile(selectedFile);
        setHeaderImagePreview(URL.createObjectURL(selectedFile));
    };

    const onSubmitHandler = async (event) => {
        event.preventDefault();

        if (!formData.headerTitle.trim()) {
            toast.error('Header title is required');
            return;
        }

        const payload = new FormData();
        payload.append('headerTitle', formData.headerTitle);
        payload.append('headerContent', formData.headerContent);
        payload.append('headerButtonText', formData.headerButtonText);
        payload.append('exploreMenuTitle', formData.exploreMenuTitle);
        payload.append('exploreMenuDescription', formData.exploreMenuDescription);

        if (headerImageFile) {
            payload.append('headerBackgroundImage', headerImageFile);
        }

        try {
            setIsSaving(true);
            const response = await axios.post(`${url}/api/restaurant-profile/update`, payload);

            if (response.data.success) {
                toast.success(response.data.message || 'Header settings saved successfully');
                window.dispatchEvent(new Event('restaurant-header-updated'));
                fetchHeaderSettings();
            } else {
                toast.error(response.data.message || 'Failed to save header settings');
            }
        } catch (error) {
            console.error('Error saving header settings:', error);
            toast.error(error.response?.data?.message || 'Error saving header settings');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="header-customization-page">
                <div className="header-customization-card">
                    <h2>Header Customization</h2>
                    <p className="header-customization-loading">Loading header settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="header-customization-page">
            <div className="header-customization-card">
                <h2>Header Customization</h2>
                <p className="header-customization-subtitle">Edit the website header content and image.</p>

                <form className="header-customization-form" onSubmit={onSubmitHandler}>
                    <div className="header-image-field">
                        <label htmlFor="headerBackgroundImage">Header Background Image</label>
                        <label htmlFor="headerBackgroundImage" className="header-image-upload">
                            <img src={headerImagePreview} alt="Header background preview" />
                        </label>
                        <input
                            id="headerBackgroundImage"
                            type="file"
                            accept="image/*"
                            onChange={onHeaderImageChange}
                            hidden
                        />
                    </div>

                    <div className="header-customization-field">
                        <label htmlFor="headerTitle">Header Title</label>
                        <input
                            id="headerTitle"
                            name="headerTitle"
                            type="text"
                            value={formData.headerTitle}
                            onChange={onChangeHandler}
                            placeholder="Enter header title"
                        />
                    </div>

                    <div className="header-customization-field">
                        <label htmlFor="headerContent">Header Content</label>
                        <textarea
                            id="headerContent"
                            name="headerContent"
                            value={formData.headerContent}
                            onChange={onChangeHandler}
                            placeholder="Enter header description"
                            rows="4"
                        />
                    </div>

                    <div className="header-customization-field">
                        <label htmlFor="headerButtonText">Explore Menu Button Text</label>
                        <input
                            id="headerButtonText"
                            name="headerButtonText"
                            type="text"
                            value={formData.headerButtonText}
                            onChange={onChangeHandler}
                            placeholder="Enter button text"
                        />
                    </div>

                    <div className="header-customization-field">
                        <label htmlFor="exploreMenuTitle">Explore Menu Section Title</label>
                        <input
                            id="exploreMenuTitle"
                            name="exploreMenuTitle"
                            type="text"
                            value={formData.exploreMenuTitle}
                            onChange={onChangeHandler}
                            placeholder="Enter section title"
                        />
                    </div>

                    <div className="header-customization-field">
                        <label htmlFor="exploreMenuDescription">Explore Menu Description</label>
                        <textarea
                            id="exploreMenuDescription"
                            name="exploreMenuDescription"
                            value={formData.exploreMenuDescription}
                            onChange={onChangeHandler}
                            placeholder="Enter section description"
                            rows="4"
                        />
                    </div>

                    <button type="submit" disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Header'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default HeaderCustomization;
