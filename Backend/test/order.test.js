import { jest } from '@jest/globals';

// Mock models
const orderModel = {
  findById: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

const customerModel = {
  findByIdAndUpdate: jest.fn(),
};

const driverModel = {
  findById: jest.fn(),
  findOne: jest.fn(),
};

// Mock constructor (for new order)
const saveMock = jest.fn();
const OrderConstructor = jest.fn(() => ({
  save: saveMock,
  _id: 'order123',
  items: [],
  address: 'test address'
}));

// Mock modules
jest.unstable_mockModule('../models/orderModel.js', () => ({
  default: Object.assign(OrderConstructor, orderModel),
}));

jest.unstable_mockModule('../models/customerModel.js', () => ({
  default: customerModel,
}));

jest.unstable_mockModule('../models/driverModel.js', () => ({
  default: driverModel,
}));

// Import controller AFTER mocking
const {
  placeOrder,
  verifyOrder,
  userOrders,
  listOrders,
  updateOrderStatus,
  getOrderById,
  getDriverAssignedOrders,
  paymentFailure,
  initiateEsewaPaymentOrder
} = await import('../controllers/orderController.js');

describe('Order Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockRes = { json: jest.fn(), redirect: jest.fn() };
    jest.clearAllMocks();
  });

  // ------------------ placeOrder ------------------

  test('placeOrder returns error if cart is empty', async () => {
    mockReq = { body: { items: [] } };

    await placeOrder(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Cart is empty"
    });
  });

  test('placeOrder returns error if no address', async () => {
    mockReq = { body: { items: [{ price: 100, quantity: 1 }] } };

    await placeOrder(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Delivery address is required"
    });
  });

  test('placeOrder creates order successfully', async () => {
    mockReq = {
      userId: 'user1',
      body: {
        items: [{ price: 100, quantity: 1 }],
        address: 'test address',
        restaurantId: 'rest1'
      }
    };

    await placeOrder(mockReq, mockRes);

    expect(saveMock).toHaveBeenCalled();
    expect(customerModel.findByIdAndUpdate).toHaveBeenCalledWith('user1', { cartData: {} });

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Order placed successfully!"
      })
    );
  });

  // ------------------ verifyOrder ------------------

  test('verifyOrder fails if missing data', async () => {
    mockReq = { body: {} };

    await verifyOrder(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Missing transaction data"
    });
  });

  test('verifyOrder deletes order if payment not complete', async () => {
    mockReq = {
      body: { status: "FAILED", transaction_uuid: "tx1", total_amount: 100 }
    };

    await verifyOrder(mockReq, mockRes);

    expect(orderModel.findOneAndDelete).toHaveBeenCalledWith({
      esewaTransactionId: "tx1"
    });

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Payment not completed"
    });
  });

  // ------------------ userOrders ------------------

  test('userOrders returns orders', async () => {
    const orders = [{ id: 1 }];
    orderModel.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(orders)
    });

    mockReq = { body: { userId: 'user1' } };

    await userOrders(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      data: orders
    });
  });

  // ------------------ listOrders ------------------

  test('listOrders returns all orders', async () => {
    const orders = [{ id: 1 }];
    orderModel.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(orders)
    });

    mockReq = { query: {} };

    await listOrders(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      data: orders
    });
  });

  // ------------------ updateOrderStatus ------------------

  test('updateOrderStatus updates status', async () => {
    orderModel.findByIdAndUpdate.mockResolvedValue(true);

    mockReq = {
      body: { orderId: 'order1', status: 'Delivered' }
    };

    await updateOrderStatus(mockReq, mockRes);

    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'order1',
      { status: 'Delivered' }
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: "Order Status Updated"
    });
  });

  test('updateOrderStatus returns error if not found', async () => {
    orderModel.findByIdAndUpdate.mockResolvedValue(null);

    mockReq = {
      body: { orderId: 'order1', status: 'Delivered' }
    };

    await updateOrderStatus(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Order not found"
    });
  });

  // ------------------ getOrderById ------------------

  test('getOrderById returns order', async () => {
    const order = { id: 1 };
    orderModel.findById.mockResolvedValue(order);

    mockReq = { params: { orderId: 'order1' } };

    await getOrderById(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      data: order
    });
  });

  test('getOrderById returns error if not found', async () => {
    orderModel.findById.mockResolvedValue(null);

    mockReq = { params: { orderId: 'order1' } };

    await getOrderById(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Order not found"
    });
  });

  // ------------------ getDriverAssignedOrders ------------------

  test('getDriverAssignedOrders returns error if driver not found', async () => {
    driverModel.findById.mockResolvedValue(null);

    mockReq = { userId: 'driver1' };

    await getDriverAssignedOrders(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Driver not found"
    });
  });

  // ------------------ paymentFailure ------------------

  test('paymentFailure returns error if no transaction id', async () => {
    mockReq = { query: {} };

    await paymentFailure(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Transaction ID not found"
    });
  });

  // ------------------ initiateEsewaPaymentOrder ------------------

  test('initiateEsewaPaymentOrder fails if missing fields', async () => {
    mockReq = { body: {} };

    await initiateEsewaPaymentOrder(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Order ID and amount are required"
    });
  });

  test('initiateEsewaPaymentOrder fails if order not found', async () => {
    orderModel.findById.mockResolvedValue(null);

    mockReq = {
      body: { orderId: 'order1', amount: 100 }
    };

    await initiateEsewaPaymentOrder(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Order not found"
    });
  });
});