import React, { useState, useEffect } from 'react';
import './Category.css';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import assets from '../../assets/assets';

const Category = ({ url }) => {
    const { restaurantId } = useParams();
    const [image, setImage] = useState(false);
    const [categories, setCategories] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [originalImage, setOriginalImage] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryItems, setCategoryItems] = useState([]);
    const [showItemsModal, setShowItemsModal] = useState(false);

    const [data, setData] = useState({
        name: "",
        description: ""
    });

    useEffect(() => {
        if (url) {
            fetchCategories();
        }
    }, [url]);

    useEffect(() => {
        if (!showItemsModal) {
            return;
        }

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                closeItemsModal();
            }
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleEscape);
        };
    }, [showItemsModal]);

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${url}/api/category/list`, {
                params: { restaurantId }
            });
            if (response.data.success) {
                setCategories(response.data.data);
            } else {
                toast.error("Failed to fetch categories");
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            toast.error("Error fetching categories");
        }
    };

    const onChangeHandler = (event) => {
        const { name, value } = event.target;
        setData(prev => ({ ...prev, [name]: value }));
    };

    const onImageChange = (event) => {
        if (event.target.files[0]) {
            setImage(event.target.files[0]);
        }
    };

    const onSubmitHandler = async (event) => {
        event.preventDefault();

        if (!data.name.trim()) {
            toast.error("Category name is required");
            return;
        }

        if (!editMode && !image) {
            toast.error("Please select an image");
            return;
        }


        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("description", data.description);
        formData.append("restaurantId", restaurantId); // Ensure restaurantId is sent

        if (image) {
            formData.append("image", image);
        }

        try {
            let response;
            if (editMode) {
                formData.append("id", editId);
                response = await axios.post(`${url}/api/category/update`, formData);
            } else {
                response = await axios.post(`${url}/api/category/add`, formData);
            }

            if (response.data.success) {
                toast.success(response.data.message);
                resetForm();
                fetchCategories();
            } else {
                toast.error(response.data.message || "Failed to save category");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error(error.response?.data?.message || "Error saving category");
        }
    };

    const resetForm = () => {
        setData({
            name: "",
            description: ""
        });
        setImage(false);
        setEditMode(false);
        setEditId(null);
        setOriginalImage(null);
    };

    const handleEdit = (category) => {
        setData({
            name: category.name,
            description: category.description
        });
        setEditId(category._id);
        setEditMode(true);
        setOriginalImage(category.image);
        setImage(false);
    };

    const handleDelete = async (categoryId) => {
        if (window.confirm("Are you sure you want to delete this category?")) {
            try {
                const response = await axios.post(`${url}/api/category/remove`, { id: categoryId });
                if (response.data.success) {
                    toast.success(response.data.message);
                    fetchCategories();
                } else {
                    toast.error("Failed to delete category");
                }
            } catch (error) {
                console.error("Error:", error);
                toast.error("Error deleting category");
            }
        }
    };

    const handleViewItems = async (category) => {
        setSelectedCategory(category);
        try {
            const response = await axios.get(`${url}/api/food/list`, {
                params: { restaurantId }
            });
            if (response.data.success) {
                const items = response.data.data.filter(item => item.category === category.name);
                setCategoryItems(items);
                setShowItemsModal(true);
            } else {
                toast.error("Failed to fetch items");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Error fetching items");
        }
    };

    const closeItemsModal = () => {
        setShowItemsModal(false);
        setSelectedCategory(null);
        setCategoryItems([]);
    };

    return (
        <div className="category-container">
            {/* Add/Edit Category Form */}
            <div className="category-form-section">
                <h2>{editMode ? "Edit Category" : "Add Category"}</h2>
                <form onSubmit={onSubmitHandler} className="category-form">
                    {/* Image Upload */}
                    <div className="category-form-group">
                        <label htmlFor="image">Upload Image</label>
                        <label htmlFor="image" className="category-image-upload">
                            <img
                                src={image ? URL.createObjectURL(image) : (editMode && originalImage ? `${url}/images/${originalImage}` : assets.upload_area)}
                                alt="Upload"
                            />
                        </label>
                        <input
                            onChange={onImageChange}
                            type="file"
                            id="image"
                            hidden
                            accept="image/*"
                        />
                    </div>

                    {/* Category Name */}
                    <div className="category-form-group">
                        <label htmlFor="name">Category Name</label>
                        <input
                            onChange={onChangeHandler}
                            type="text"
                            id="name"
                            name="name"
                            placeholder="Enter category name"
                            value={data.name}
                        />
                    </div>

                    {/* Description */}
                    <div className="category-form-group">
                        <label htmlFor="description">Description (Optional)</label>
                        <textarea
                            onChange={onChangeHandler}
                            id="description"
                            name="description"
                            placeholder="Enter category description"
                            value={data.description}
                            rows="3"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="category-form-buttons">
                        <button type="submit" className="btn-submit">
                            {editMode ? "Update Category" : "Add Category"}
                        </button>
                        {editMode && (
                            <button type="button" className="btn-cancel" onClick={resetForm}>
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Categories List */}
            <div className="category-list-section">
                <div className="category-list-header">
                    <h2>Categories</h2>
                    <span className="category-count">
                        {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
                    </span>
                </div>
                <div className="category-grid">
                    {categories.length > 0 ? (
                        categories.map((category) => (
                            <div key={category._id} className="category-card">
                                <div className="category-image-container">
                                    <img
                                        src={`${url}/images/${category.image}`}
                                        alt={category.name}
                                    />
                                </div>
                                <div className="category-info">
                                    <h3>{category.name}</h3>
                                    <p className="category-description">
                                        {category.description?.trim() || 'No description available.'}
                                    </p>
                                </div>
                                <div className="category-actions">
                                    <button
                                        type="button"
                                        className="btn-view"
                                        onClick={() => handleViewItems(category)}
                                    >
                                        View Items
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-edit"
                                        onClick={() => handleEdit(category)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-delete"
                                        onClick={() => handleDelete(category._id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="no-categories">No categories found. Add a new one!</p>
                    )}
                </div>
            </div>

            {/* Items Modal */}
            {showItemsModal && (
                <div className="modal-overlay" onClick={closeItemsModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>{selectedCategory?.name} Items</h2>
                                <p className="modal-subtitle">{categoryItems.length} item{categoryItems.length !== 1 ? 's' : ''} found</p>
                            </div>
                            <button type="button" className="modal-close" onClick={closeItemsModal}>×</button>
                        </div>
                        <div className="modal-body">
                            {categoryItems.length > 0 ? (
                                <div className="items-grid">
                                    {categoryItems.map((item) => (
                                        <div key={item._id} className="item-card">
                                            <img className="item-card-image" src={`${url}/images/${item.image}`} alt={item.name} />
                                            <div className="item-card-content">
                                                <h4>{item.name}</h4>
                                                <p>{item.description || 'No description available.'}</p>
                                            </div>
                                            <div className="item-card-footer">
                                                <span className="item-price">₹{item.price}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-items">No items in this category</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Category;
