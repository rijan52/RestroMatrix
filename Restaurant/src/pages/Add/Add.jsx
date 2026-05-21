import React, { useState, useEffect } from 'react';
import './Add.css';
import assets from '../../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';

const Add = ({ url }) => {

    const [image, setImage] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [originalImage, setOriginalImage] = useState(null);
    const [categories, setCategories] = useState([]);

    const [data, setData] = useState({
        name: "",
        description: "",
        price: "",
        category: ""
    });

    const navigate = useNavigate();
    const { restaurantId } = useParams();

    useEffect(() => {
        // Check if there's food data in localStorage for editing
        const editFood = localStorage.getItem('editFood');
        if (editFood) {
            const foodData = JSON.parse(editFood);
            setData({
                name: foodData.name,
                description: foodData.description,
                price: foodData.price,
                category: foodData.category
            });
            setEditId(foodData._id);
            setEditMode(true);
            setOriginalImage(foodData.image);
            localStorage.removeItem('editFood');
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [url]);

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${url}/api/category/list?restaurantId=${restaurantId}`);
            if (response.data.success) {
                const fetchedCategories = response.data.data || [];
                setCategories(fetchedCategories);

                setData(prev => {
                    if (fetchedCategories.length === 0) {
                        return { ...prev, category: "" };
                    }

                    const hasValidCategory = fetchedCategories.some(cat => cat.name === prev.category);
                    if (!prev.category || !hasValidCategory) {
                        return { ...prev, category: fetchedCategories[0].name };
                    }

                    return prev;
                });
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            // Fallback to empty array
            setCategories([]);
        }
    };


    const onChangeHandler = (event) => {
        const { name, value } = event.target;
        setData(prev => ({ ...prev, [name]: value }));
    };

    const onSubmitHandler = async (event) => {
        event.preventDefault();

        if (!data.category) {
            toast.error("No category available. Please create a category first.");
            return;
        }

        if (editMode) {
            // Edit existing food
            await editFood();
        } else {
            // Add new food
            await addFood();
        }
    };

    const addFood = async () => {
        const formData = new FormData();
        formData.append("image", image);
        formData.append("name", data.name);
        formData.append("description", data.description);
        formData.append("price", Number(data.price));
        formData.append("category", data.category);
        formData.append("restaurantId", restaurantId); // Ensure restaurantId is sent

        try {
            const response = await axios.post(
                `${url}/api/food/add`,
                formData
            );

            if (response.data.success) {
                setData({
                    name: "",
                    description: "",
                    price: "",
                    category: categories.length > 0 ? categories[0].name : ""
                });
                setImage(false);
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Server error");
        }
    };

    const editFood = async () => {
        const formData = new FormData();

        // Only append image if a new one was selected
        if (image) {
            formData.append("image", image);
        }
        formData.append("name", data.name);
        formData.append("description", data.description);
        formData.append("price", Number(data.price));
        formData.append("category", data.category);
        formData.append("id", editId);

        try {
            const response = await axios.post(
                `${url}/api/food/update`,
                formData
            );

            if (response.data.success) {
                toast.success("Food item updated successfully!");
                setData({
                    name: "",
                    description: "",
                    price: "",
                    category: categories.length > 0 ? categories[0].name : ""
                });
                setImage(false);
                setEditMode(false);
                setEditId(null);
                setOriginalImage(null);
                navigate(`/restaurant/${restaurantId}/list`);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error updating food item");
        }
    };

    const handleCancel = () => {
        setData({
            name: "",
            description: "",
            price: "",
            category: categories.length > 0 ? categories[0].name : ""
        });
        setImage(false);
        setEditMode(false);
        setEditId(null);
        setOriginalImage(null);
        if (editMode) {
            navigate(`/restaurant/${restaurantId}/list`);
        }
    };

    return (
        <div className='add'>
            <div className="add-container">
                <div className="add-header">
                    <h2>{editMode ? 'Edit Food Item' : 'Add New Food Item'}</h2>
                    <p className="add-subtitle">{editMode ? 'Update the food details' : 'Add a new item to your menu'}</p>
                </div>

                <form className='add-form' onSubmit={onSubmitHandler}>
                    {/* All your existing form fields remain the same */}
                    <div className="add-img-upload">
                        <p>Upload Image</p>
                        <label htmlFor="image">
                            <img
                                src={image ? URL.createObjectURL(image) : (editMode && originalImage ? `${url}/images/${originalImage}` : assets.addIcon)}
                                alt="Food item"
                            />
                        </label>
                        <input
                            onChange={(e) => setImage(e.target.files[0])}
                            type="file"
                            id="image"
                            hidden
                            required={!editMode}
                        />
                    </div>

                    <div className="add-product-name">
                        <p>Product name</p>
                        <input
                            onChange={onChangeHandler}
                            value={data.name}
                            type="text"
                            name="name"
                            placeholder="Type here"
                            required
                        />
                    </div>

                    <div className="add-product-description">
                        <p>Product description</p>
                        <textarea
                            onChange={onChangeHandler}
                            value={data.description}
                            name="description"
                            rows="6"
                            placeholder="Write content here"
                            required
                        />
                    </div>

                    <div className="add-category-price">
                        <div className="add-category">
                            <p>Product category</p>
                            <select
                                name="category"
                                value={data.category}
                                onChange={onChangeHandler}
                                disabled={categories.length === 0}
                                required
                            >
                                <option value="" disabled>
                                    {categories.length === 0 ? 'No category' : 'Select category'}
                                </option>
                                {categories.map((cat, index) => (
                                    <option key={cat._id || index} value={cat.name}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="add-price">
                            <p>Product price</p>
                            <input
                                onChange={onChangeHandler}
                                value={data.price}
                                type="number"
                                name="price"
                                placeholder="Rs20"
                                required
                            />
                        </div>
                    </div>

                    <div className="add-buttons">
                        <button type="submit" className="add-btn">
                            {editMode ? 'Update' : 'Add'}
                        </button>
                        <button type="button" className="cancel-btn" onClick={handleCancel}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Add;
