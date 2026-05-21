import { jest } from "@jest/globals";

/* ---------------- MOCK MODEL ---------------- */
const walkInSessionModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    prototype: {
        save: jest.fn()
    }
};

jest.unstable_mockModule("../models/walkInSessionModel.js", () => ({
    default: walkInSessionModel,
}));

/* ---------------- IMPORT CONTROLLER AFTER MOCK ---------------- */
const {
    createWalkInSession,
    getSessionDetails,
    initiateWalkInPayment,
    verifyWalkInPayment,
    handleWalkInPaymentFailure,
    listWalkInSessions,
    updateWalkInSessionStatus
} = await import("../controllers/walkInController.js");

/* ---------------- TEST SUITE ---------------- */
describe("Walk-In Controller", () => {
    let mockReq, mockRes;

    beforeEach(() => {
        mockRes = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
        jest.clearAllMocks();
    });

    /* ================= CREATE SESSION ================= */

    test("create session fails if missing data", async () => {
        mockReq = { body: {} };

        await createWalkInSession(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test("create session success", async () => {
        mockReq = {
            body: {
                restaurantId: "r1",
                tableNumber: 1,
                totalBillAmount: 500,
                items: [{ name: "Pizza", price: 500, quantity: 1 }]
            }
        };

        walkInSessionModel.prototype.save.mockResolvedValue(true);

        await createWalkInSession(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalled();
    });

    /* ================= GET SESSION ================= */

    test("get session returns error if not found", async () => {
        mockReq = { params: { sessionId: "abc" } };

        walkInSessionModel.findOne.mockResolvedValue(null);

        await getSessionDetails(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test("get session success", async () => {
        mockReq = { params: { sessionId: "abc" } };

        walkInSessionModel.findOne.mockResolvedValue({
            sessionId: "abc",
            tableNumber: 1,
            restaurantId: "r1",
            totalBillAmount: 500,
            totalPaidAmount: 100,
            payments: [],
            items: [],
            status: "active"
        });

        await getSessionDetails(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true })
        );
    });

    /* ================= INITIATE PAYMENT ================= */

    test("initiate payment fails if session not found", async () => {
        mockReq = {
            body: { sessionId: "abc", amount: 100 }
        };

        walkInSessionModel.findOne.mockResolvedValue(null);

        await initiateWalkInPayment(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test("initiate payment success", async () => {
        mockReq = {
            body: { sessionId: "abc", amount: 100 }
        };

        walkInSessionModel.findOne.mockResolvedValue({
            sessionId: "abc",
            totalBillAmount: 500,
            totalPaidAmount: 100,
            payments: [],
            save: jest.fn().mockResolvedValue(true)
        });

        await initiateWalkInPayment(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalled();
    });

    /* ================= VERIFY PAYMENT ================= */

    test("verify payment fails if missing params", async () => {
        mockReq = { query: {} };

        await verifyWalkInPayment(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    /* ================= PAYMENT FAILURE ================= */

    test("payment failure handled", async () => {
        mockReq = {
            query: { sessionId: "abc", transactionUuid: "tx1" }
        };

        walkInSessionModel.findOne.mockResolvedValue({
            payments: [{ transactionUuid: "tx1", status: "pending" }],
            save: jest.fn()
        });

        await handleWalkInPaymentFailure(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: false })
        );
    });

    /* ================= LIST ================= */

    test("list sessions returns data", async () => {
        mockReq = { query: {} };

        walkInSessionModel.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue([
                { sessionId: "abc", totalBillAmount: 500 }
            ])
        });

        await listWalkInSessions(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalled();
    });

    /* ================= UPDATE STATUS ================= */

    test("update status fails if invalid", async () => {
        mockReq = {
            body: { sessionId: "abc", status: "invalid" }
        };

        await updateWalkInSessionStatus(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
    });

});