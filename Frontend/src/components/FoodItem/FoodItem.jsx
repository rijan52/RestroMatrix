import React, { useContext } from 'react'
import './FoodItem.css'
import assets from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext'

const FoodItem = ({ id, name, price, description, image }) => {

    const { cartItems, addToCart, removeFromCart, url } = useContext(StoreContext);
    return (
        <div className='food-item'>
            <div className='food-item-img-container'>
                <img className='food-item-image' src={url + "/images/" + image} alt="" />
                {!cartItems[id]
                    ? <img className='add' onClick={() => addToCart(id)} src={assets.addIcon} alt=" " />
                    : <div className='food-item-counter'>
                        <img onClick={() => removeFromCart(id)} src={assets.removeIcon} alt="" />
                        <p>{cartItems[id]}</p>
                        <img onClick={() => addToCart(id)} src={assets.addIcon} alt="" />
                    </div>
                }

            </div>
            <div className='food-item-info'>
                <div className='food-item-name'>
                    <p>{name}</p>
                </div>
                <p className='food-item-desc'>{description}</p>
                <p className='food-item-price'>${price}</p>



            </div>
        </div>
    )
}

export default FoodItem