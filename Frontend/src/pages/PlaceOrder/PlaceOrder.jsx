import React, { useContext } from 'react'
import './PlaceOrder.css'
import { StoreContext } from '../../context/StoreContext'
import { useState } from 'react'
import axios from 'axios'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { initiateOrderPayment } from '../../services/orderService'

const PlaceOrder = () => {

  const { getTotalCartAmount, token, food_list, cartItems, url } = useContext(StoreContext)

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    phone: ""

  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }))
  }

  const submitEsewaForm = (paymentData) => {
    console.log('📝 Creating and submitting eSewa form...');
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = paymentData.paymentEndpoint;

    const fields = {
      amount: paymentData.amount,
      tax_amount: paymentData.tax_amount,
      total_amount: paymentData.total_amount,
      transaction_uuid: paymentData.transaction_uuid,
      product_code: paymentData.product_code,
      product_name: paymentData.product_name,
      product_service_charge: paymentData.product_service_charge,
      product_delivery_charge: paymentData.product_delivery_charge,
      success_url: paymentData.success_url,
      failure_url: paymentData.failure_url,
      signed_field_names: paymentData.signed_field_names,
      signature: paymentData.signature
    };

    for (const [key, value] of Object.entries(fields)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    }

    document.body.appendChild(form);
    console.log('✅ Submitting form to eSewa...');
    form.submit();
  }

  const placeOrder = async (event) => {
    event.preventDefault();
    setLoading(true)
    setError("")

    try {
      let orderItems = [];
      food_list.map((item) => {
        if (cartItems[item._id] > 0) {
          let itemInfo = item;
          itemInfo["quantity"] = cartItems[item._id];
          orderItems.push(itemInfo);
        }
      })

      const totalAmount = getTotalCartAmount() + 2;

      let orderData = {
        address: data,
        items: orderItems,
        amount: totalAmount,
      }

      console.log('📦 Placing order with data:', orderData);

      let response = await axios.post(url + "/api/order/place", orderData, { headers: { token } });

      if (response.data.success) {
        console.log('✅ Order placed successfully:', response.data.orderId);

        // Order placed successfully, now initiate eSewa payment
        const orderId = response.data.orderId;

        try {
          console.log('💳 Initiating eSewa payment for order:', orderId);
          const paymentData = await initiateOrderPayment(orderId, totalAmount, token);

          console.log('✅ Payment initiated successfully');

          // Submit eSewa form
          submitEsewaForm(paymentData);

        } catch (paymentError) {
          console.error('❌ Payment initiation failed:', paymentError);
          setError(paymentError.message || "Error initiating payment. Please try again.");
          setLoading(false)
          alert("Order placed but payment initiation failed. Error: " + (paymentError.message || "Unknown error"))
        }
      }
      else {
        setError(response.data.message || "Error placing order. Please try again.")
        setLoading(false)
        alert(response.data.message || "Error placing order. Please try again.")
      }
    } catch (error) {
      const errorMsg = error?.response?.data?.message || error.message || "Error placing order. Please try again."
      setError(errorMsg)
      setLoading(false)
      alert(errorMsg)
    }
  }
  const navigate = useNavigate();
  useEffect(() => {
    if (!token) {
      navigate("/cart");
    }
    else if (getTotalCartAmount() === 0) {
      navigate("/cart");
    }
  }, [token])

  return (
    <form onSubmit={placeOrder} className='place-order'>
      <div className="place-order-left">
        <p className="title"> Delivery Information</p>
        <div className="multi-fields">
          <input required name='firstName' onChange={onChangeHandler} value={data.firstName} type="text" placeholder='First name' />
          <input required name='lastName' onChange={onChangeHandler} value={data.lastName} type="text" placeholder='Last name' />
        </div>
        <input required name='email' onChange={onChangeHandler} value={data.email} type="email" placeholder='Email address' />
        <input required name='street' onChange={onChangeHandler} value={data.street} type="text" placeholder='Street' />
        <div className="multi-fields">
          <input required name='city' onChange={onChangeHandler} value={data.city} type="text" placeholder='City' />
          <input required name='state' onChange={onChangeHandler} value={data.state} type="text" placeholder='State' />
        </div>
        <div className="multi-fields">
          <input required name='zip' onChange={onChangeHandler} value={data.zip} type="text" placeholder='Zip Code' />
          <input required name='country' onChange={onChangeHandler} value={data.country} type="text" placeholder='Country' />
        </div>
        <input required name='phone' onChange={onChangeHandler} value={data.phone} type="text" placeholder='Phone Number' />
      </div>
      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>{getTotalCartAmount()}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>Rs{getTotalCartAmount() === 0 ? 0 : 2}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>{getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 2}</b>

            </div>
          </div>
          {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
          <button type='submit' disabled={loading}>
            {loading ? 'PROCESSING...' : 'PROCEED TO PAYMENT'}
          </button>

        </div>


      </div>
    </form>
  )
}

export default PlaceOrder