import React, { useContext, useEffect, useState } from 'react'
import { StoreContext } from '../../context/StoreContext';
import './Cart.css'
import { useNavigate, useParams } from 'react-router-dom';


const Cart = () => {
  const { cartItems, food_list, addToCart, removeFromCart, getTotalCartAmount, token } = useContext(StoreContext);
  const navigate = useNavigate();
  const { restaurantId } = useParams();
  const [checkoutError, setCheckoutError] = useState('');

  // Save last visited restaurant path for redirect logic
  useEffect(() => {
    if (restaurantId) {
      window.localStorage.setItem('lastRestaurantPath', window.location.pathname);
    }
  }, [restaurantId]);

  const handleProceedToCheckout = () => {
    if (getTotalCartAmount() === 0) {
      setCheckoutError('Your cart is empty. Please add items before checkout.');
      return;
    }

    setCheckoutError('');
    const orderPath = restaurantId ? `/restaurant/${restaurantId}/order` : '/order';
    if (!token) {
      localStorage.setItem('postLoginRedirect', orderPath)
      navigate('/login', { state: { redirectTo: orderPath } })
      return
    }
    navigate(orderPath)
  }

  // Save last visited restaurant path for redirect logic
  useEffect(() => {
    if (restaurantId) {
      window.localStorage.setItem('lastRestaurantPath', window.location.pathname);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (getTotalCartAmount() > 0 && checkoutError) {
      setCheckoutError('');
    }
  }, [cartItems, checkoutError, getTotalCartAmount]);

  return (
    <div className='cart'>
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Title</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Remove</p>
        </div>
        <br />
        <hr />
        {food_list.map((item) => {
          if (cartItems[item._id] > 0) {
            return (
              <div key={item._id}>
                <div className="cart-items-title cart-items-item">
                  <p>{item.name}</p>
                  <p>Rs {item.price}</p>
                  <div className="cart-qty-controls">
                    <button type="button" onClick={() => removeFromCart(item._id)}>-</button>
                    <span>{cartItems[item._id]}</span>
                    <button type="button" onClick={() => addToCart(item._id)}>+</button>
                  </div>
                  <p>Rs {item.price * cartItems[item._id]}</p>
                  <p onClick={() => removeFromCart(item._id)} className="cross">x</p>
                </div>
                <hr />
              </div>
            )
          }
          return null
        })}

      </div>
      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>Rs {getTotalCartAmount()}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>Rs {getTotalCartAmount() === 0 ? 0 : 150}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>{getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 150}</b>

            </div>
          </div>
          <button onClick={handleProceedToCheckout}>PROCEED TO CHECKOUT</button>
          {checkoutError && <p className="cart-checkout-error">{checkoutError}</p>}

        </div>
        <div className="cart-promocode">
          <div>
            <p>If you have promo code, Enter here</p>
            <div className="cart-promocode-input">
              <input type="text" placeholder='promo code' />
              <button>Submit</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart