import { jest } from '@jest/globals';

// ------------------ MOCKS ------------------

// Mock customer model
const customerModel = {
  findOne: jest.fn(),
  find: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
};

// Mock constructor
const saveMock = jest.fn();
const CustomerConstructor = jest.fn(() => ({
  save: saveMock,
  _id: 'cust123',
  role: 'customer'
}));

// Mock bcrypt
const bcrypt = {
  compare: jest.fn(),
  genSalt: jest.fn(),
  hash: jest.fn()
};

// Mock jwt
const jwt = {
  sign: jest.fn()
};

// Mock validator
const validator = {
  isEmail: jest.fn()
};

// ------------------ MODULE MOCKING ------------------

jest.unstable_mockModule('../models/customerModel.js', () => ({
  default: Object.assign(CustomerConstructor, customerModel),
}));

jest.unstable_mockModule('bcryptjs', () => ({
  default: bcrypt
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: jwt
}));

jest.unstable_mockModule('validator', () => ({
  default: validator
}));

// Import controller AFTER mocks
const {
  loginCustomer,
  registerCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
} = await import('../controllers/customerController.js');

// ------------------ TESTS ------------------

describe('Customer Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockRes = { json: jest.fn() };
    jest.clearAllMocks();
  });

  // ------------------ loginCustomer ------------------

  test('loginCustomer fails if user not found', async () => {
    customerModel.findOne.mockResolvedValue(null);

    mockReq = {
      body: { email: 'test@mail.com', password: '12345678' },
      params: { restaurantId: 'rest1' }
    };

    await loginCustomer(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Customer does not exist"
    });
  });

  test('loginCustomer fails if password incorrect', async () => {
    customerModel.findOne.mockResolvedValue({ password: 'hashed' });
    bcrypt.compare.mockResolvedValue(false);

    mockReq = {
      body: { email: 'test@mail.com', password: 'wrong' },
      params: { restaurantId: 'rest1' }
    };

    await loginCustomer(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid credentials"
    });
  });

  test('loginCustomer success', async () => {
    const customer = { _id: 'cust1', password: 'hashed', role: 'customer' };

    customerModel.findOne.mockResolvedValue(customer);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('token123');

    mockReq = {
      body: { email: 'test@mail.com', password: '12345678' },
      params: { restaurantId: 'rest1' }
    };

    await loginCustomer(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      data: customer,
      token: 'token123',
      role: 'customer'
    });
  });

  // ------------------ registerCustomer ------------------

  test('registerCustomer fails if already exists', async () => {
    customerModel.findOne.mockResolvedValue(true);

    mockReq = {
      body: { email: 'test@mail.com', password: '12345678' },
      params: { restaurantId: 'rest1' }
    };

    await registerCustomer(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Customer already exists"
    });
  });

  test('registerCustomer fails if invalid email', async () => {
    customerModel.findOne.mockResolvedValue(null);
    validator.isEmail.mockReturnValue(false);

    mockReq = {
      body: { email: 'bademail', password: '12345678' },
      params: { restaurantId: 'rest1' }
    };

    await registerCustomer(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Please Enter Valid Email"
    });
  });

  test('registerCustomer fails if weak password', async () => {
    customerModel.findOne.mockResolvedValue(null);
    validator.isEmail.mockReturnValue(true);

    mockReq = {
      body: { email: 'test@mail.com', password: '123' },
      params: { restaurantId: 'rest1' }
    };

    await registerCustomer(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Password not strong enough"
    });
  });

  test('registerCustomer success', async () => {
    customerModel.findOne.mockResolvedValue(null);
    validator.isEmail.mockReturnValue(true);

    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockResolvedValue('hashed');

    saveMock.mockResolvedValue({ _id: 'cust1', role: 'customer' });
    jwt.sign.mockReturnValue('token123');

    mockReq = {
      body: {
        name: 'Test',
        email: 'test@mail.com',
        password: '12345678'
      },
      params: { restaurantId: 'rest1' }
    };

    await registerCustomer(mockReq, mockRes);

    expect(saveMock).toHaveBeenCalled();

    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      data: expect.any(Object),
      token: 'token123',
      role: 'customer'
    });
  });

  // ------------------ getAllCustomers ------------------

  test('getAllCustomers returns customers', async () => {
    const customers = [{ name: 'A' }];

    customerModel.find.mockReturnValue({
      select: jest.fn().mockResolvedValue(customers)
    });

    mockReq = {
      user: { restaurantId: 'rest1' }
    };

    await getAllCustomers(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      data: customers
    });
  });

  // ------------------ getCustomerById ------------------

  test('getCustomerById returns error if not found', async () => {
    customerModel.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    });

    mockReq = {
      params: { id: 'cust1' },
      user: { restaurantId: 'rest1' }
    };

    await getCustomerById(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Customer not found"
    });
  });

  // ------------------ updateCustomer ------------------

  test('updateCustomer success', async () => {
    const updated = { name: 'Updated' };

    customerModel.findOneAndUpdate.mockReturnValue({
      select: jest.fn().mockResolvedValue(updated)
    });

    mockReq = {
      params: { id: 'cust1' },
      user: { restaurantId: 'rest1' },
      body: { name: 'Updated' }
    };

    await updateCustomer(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      data: updated
    });
  });

  // ------------------ deleteCustomer ------------------

  test('deleteCustomer success', async () => {
    customerModel.findOneAndDelete.mockResolvedValue(true);

    mockReq = {
      params: { id: 'cust1' },
      user: { restaurantId: 'rest1' }
    };

    await deleteCustomer(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: "Customer deleted successfully"
    });
  });

  test('deleteCustomer fails if not found', async () => {
    customerModel.findOneAndDelete.mockResolvedValue(null);

    mockReq = {
      params: { id: 'cust1' },
      user: { restaurantId: 'rest1' }
    };

    await deleteCustomer(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Customer not found"
    });
  });

});