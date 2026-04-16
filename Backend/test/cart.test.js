import { jest } from '@jest/globals';

const customerModel = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
};

jest.unstable_mockModule('../models/customerModel.js', () => ({
    default: customerModel,
}));

const { addToCart, removeFromCart, getCart } = await import('../controllers/cartController.js');

describe('Cart Controller', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        mockRes = { json: jest.fn() };
        jest.clearAllMocks();
    });

    test('addToCart returns error if no userId', async () => {
        mockReq = { body: {} };
        await addToCart(mockReq, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: "User ID not provided" });
    });

    test('addToCart adds item to cart', async () => {
        const userId = 'user123';
        mockReq = { body: { userId, itemId: 'item1' } };
        const userData = { cartData: {} };
        customerModel.findById.mockResolvedValue(userData);
        customerModel.findByIdAndUpdate.mockResolvedValue(true);

        await addToCart(mockReq, mockRes);
        expect(customerModel.findByIdAndUpdate).toHaveBeenCalledWith(userId, { cartData: { item1: 1 } });
        expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: "Item added to cart" });
    });

    test('removeFromCart decreases item count', async () => {
        const userId = 'user123';
        mockReq = { body: { userId, itemId: 'item1' } };
        const userData = { cartData: { item1: 2 } };
        customerModel.findById.mockResolvedValue(userData);
        customerModel.findByIdAndUpdate.mockResolvedValue(true);

        await removeFromCart(mockReq, mockRes);
        expect(customerModel.findByIdAndUpdate).toHaveBeenCalledWith(userId, { cartData: { item1: 1 } });
        expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: "Item removed from cart" });
    });

    test('getCart returns cart data', async () => {
        const userId = 'user123';
        mockReq = { body: { userId } };
        const userData = { cartData: { item1: 3 } };
        customerModel.findById.mockResolvedValue(userData);

        await getCart(mockReq, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith({ success: true, cartData: { item1: 3 } });
    });
});