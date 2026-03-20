import React, { useEffect, useState } from 'react'
import './List.css'
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const List = ({ url }) => {

  const [list, setList] = useState([]);
  const navigate = useNavigate();

  const fetchList = async () => {
    const response = await axios.get(`${url}/api/food/list`);
    if (response.data.success) {
      setList(response.data.data);
    }
    else {
      toast.error("Error");
    }
  }

  const removeFood = async (foodId) => {
    const response = await axios.post(`${url}/api/food/remove`, { id: foodId })
    await fetchList();
    if (response.data.success) {
      toast.success(response.data.message)
    }
    else {
      toast.error("Error");
    }
  }

  const handleEditFood = (foodItem) => {
    // Store food data in local storage for the edit form
    localStorage.setItem('editFood', JSON.stringify(foodItem));
    navigate('/add');
  }

  useEffect(() => {
    fetchList();
  }, [])

  return (
    <div className='list add flex-col'>
      <div className="list-header">
        <h2>All Food Items</h2>
        <p className="list-subtitle">Manage your food items</p>
      </div>
      <div className="list-table">
        <div className="list-table-format title">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Actions</b>
        </div>
        {list.map((item, index) => {
          return (
            <div key={index} className="list-table-format data">
              <img src={`${url}/images/` + item.image} alt={item.name} />
              <p className="item-name">{item.name}</p>
              <p className="item-category">{item.category}</p>
              <p className="item-price">Rs{item.price}</p>
              <div className="actions">
                <button className="btn-edit" onClick={() => handleEditFood(item)} title="Edit food item">
                  ✎
                </button>
                <button className="btn-delete" onClick={() => removeFood(item._id)} title="Delete food item">
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default List