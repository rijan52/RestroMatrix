import React, { useState, useEffect } from 'react';
import './Add.css';
import assets from '../../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

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
        category: "Salad"
    });

    const navigate = useNavigate();

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
            const response = await axios.get(`${url}/api/food/category/list`);
            if (response.data.success) {
                setCategories(response.data.data);
                // If no data.category is set, use the first category
                if (!data.category && response.data.data.length > 0) {
                    setData(prev => ({ ...prev, category: response.data.data[0].name }));
                }
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };


    const onChangeHandler = (event) => {
        const { name, value } = event.target;
        setData(prev => ({ ...prev, [name]: value }));
    };

    const onSubmitHandler = async (event) => {
        event.preventDefault();

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
                    category: "Salad"
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
                    category: "Salad"
                });
                setImage(false);
                setEditMode(false);
                setEditId(null);
                setOriginalImage(null);
                navigate('/list');
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
            category: "Salad"
        });
        setImage(false);
        setEditMode(false);
        setEditId(null);
        setOriginalImage(null);
        if (editMode) {
            navigate('/list');
        }
    };

    return (
        <div className='add'>
            <div className="add-header">
                <h2>{editMode ? 'Edit Food Item' : 'Add New Food Item'}</h2>
                <p className="add-subtitle">{editMode ? 'Update the food details' : 'Add a new item to your menu'}</p>
            </div>

            <form className='add-form flex-col' onSubmit={onSubmitHandler}>

                <div className="add-img-upload flex-col">
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

                <div className="add-product-name flex-col">
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

                <div className="add-product-description flex-col">
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
                    <div className="add-category flex-col">
                        <p>Product category</p>
                        <select
                            name="category"
                            value={data.category}
                            onChange={onChangeHandler}
                        >
                            {categories.length > 0 ? (
                                categories.map((cat, index) => (
                                    <option key={cat._id || index} value={cat.name}>
                                        {cat.name}
                                    </option>
                                ))
                            ) : (
                                <>
                                    <option value="Appetizer">Appetizer</option>
                                    <option value="Fried Items">Fried Items</option>
                                    <option value="Noodles">Noodles</option>
                                    <option value="Chilly Items">Chilly Items</option>
                                    <option value="Cheesy">Cheesy</option>
                                    <option value="Main Course">Main Course</option>
                                    <option value="Salad">Salad</option>
                                    <option value="Desert">Desert</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div className="add-price flex-col">
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
    );
};

export default Add;
