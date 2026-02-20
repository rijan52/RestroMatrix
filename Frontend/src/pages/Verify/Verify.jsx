import React from 'react'
import './Verify.css'
import { useNavigate, useSearchParams } from 'react-router';
import { useContext } from 'react';
import { StoreContext } from '../../context/StoreContext';
import { useEffect } from 'react';
import axios from 'axios';

const Verify = () => {

  const [searchParams] = useSearchParams();
  const encodedData = searchParams.get("data")
  let status = searchParams.get("status")
  let transaction_uuid = searchParams.get("transaction_uuid")
  let total_amount = searchParams.get("total_amount")

  if (encodedData) {
    try {
      const decoded = JSON.parse(atob(encodedData))
      status = decoded.status || status
      transaction_uuid = decoded.transaction_uuid || transaction_uuid
      total_amount = decoded.total_amount || total_amount
    } catch (error) {
      console.error("Failed to decode eSewa response data", error)
    }
  }

  const { url } = useContext(StoreContext);
  const navigate = useNavigate();

  const verifyPayment = async () => {
    const response = await axios.post(url + "/api/order/verify", {
      status,
      transaction_uuid,
      total_amount
    })
    if (response.data.success) {
      navigate("/myorders")
    } else {
      navigate("/")
    }
  }

  useEffect(() => {
    verifyPayment();
  }, [])

  return (
    <div className='verify'>
      <div className="spinner">

      </div>

    </div>

  )
}

export default Verify