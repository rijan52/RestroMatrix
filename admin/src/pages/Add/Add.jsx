import React, { useState } from 'react';
import './Add.css';
import assets from '../../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';

const Add = ({ url }) => {

    const [image, setImage] = useState(false);
    const [data, setData] = useState({
        name: "",
        description: "",
        price: "",
        category: "Salad"
    });

    const onChangeHandler = (event) => {
        const { name, value } = event.target;
        setData(prev => ({ ...prev, [name]: value }));
    };

    const onSubmitHandler = async (event) => {
        event.preventDefault();

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
            alert("Server error");
        }
    };

    return (
        <div className='add'>
            <form className='add-form flex-col' onSubmit={onSubmitHandler}>

                <div className="add-img-upload flex-col">
                    <p>Upload Image</p>
                    <label htmlFor="image">
                        <img
                            src={image ? URL.createObjectURL(image) : assets.addIcon}
                            alt=""
                        />
                    </label>
                    <input
                        onChange={(e) => setImage(e.target.files[0])}
                        type="file"
                        id="image"
                        hidden
                        required
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
                            <option value="Appetizer">Appetizer</option>
                            <option value="Fried Items">Fried Items</option>
                            <option value="Noodles">Noodles</option>
                            <option value="Chilly Items">Chilly Items</option>
                            <option value="Cheesy">Cheesy</option>
                            <option value="Main Course">Main Course</option>
                            <option value="Salad">Salad</option>
                            <option value="Desert">Desert</option>
                        </select>
                    </div>

                    <div className="add-price flex-col">
                        <p>Product price</p>
                        <input
                            onChange={onChangeHandler}
                            value={data.price}
                            type="number"
                            name="price"
                            placeholder="$20"
                            required
                        />
                    </div>
                </div>

                <button type="submit" className="add-btn">Add</button>
            </form>
        </div>
    );
};

export default Add;
