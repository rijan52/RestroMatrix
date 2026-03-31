import express from 'express';
import {
    loginCustomer,
    registerCustomer,
    getAllCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer
} from '../controllers/customerController.js';

const customerRouter = express.Router()

customerRouter.post("/:restaurantId/register", registerCustomer)
customerRouter.post("/:restaurantId/login", loginCustomer)
customerRouter.get("/", getAllCustomers)
customerRouter.get("/:id", getCustomerById)
customerRouter.put("/:id", updateCustomer)
customerRouter.delete("/:id", deleteCustomer)

export default customerRouter;