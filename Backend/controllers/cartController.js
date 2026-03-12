import customerModel from "../models/customerModel.js";

// add items to user cart

const addToCart = async (req, res) => {

    try {
        const userId = req.userId || req.body.userId;
        if (!userId) {
            return res.json({ success: false, message: "User ID not provided" });
        }
        let userData = await customerModel.findById(userId);
        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }
        let cartData = userData.cartData;
        if (!cartData[req.body.itemId]) {
            cartData[req.body.itemId] = 1;
        } else {
            cartData[req.body.itemId] += 1;
        }
        await customerModel.findByIdAndUpdate(userId, { cartData });
        res.json({ success: true, message: "Item added to cart" });
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })

    }
}




//remove items from user cart
const removeFromCart = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        if (!userId) {
            return res.json({ success: false, message: "User ID not provided" });
        }
        let userData = await customerModel.findById(userId);
        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }
        let cartData = userData.cartData;
        if (cartData[req.body.itemId] > 0) {
            cartData[req.body.itemId] -= 1;

        }
        await customerModel.findByIdAndUpdate(userId, { cartData });
        res.json({ success: true, message: "Item removed from cart" })
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}


// fetch user cart items
const getCart = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        if (!userId) {
            return res.json({ success: false, message: "User ID not provided" });
        }
        let userData = await customerModel.findById(userId);
        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }
        let cartData = userData.cartData;
        res.json({ success: true, cartData });
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}
export { addToCart, removeFromCart, getCart }