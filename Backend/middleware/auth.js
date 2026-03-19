import jwt from 'jsonwebtoken'

const authMiddleware = (req, res, next) => {
    const { token } = req.headers;
    if (!token) {
        return res.json({ success: false, message: "No Authorized Login again" });
    }
    try {
        const token_decode = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = token_decode.id;
        req.body = req.body || {};
        req.body.userId = req.body.userId || token_decode.id;
        next();
    } catch (error) {
        console.log("Auth Error:", error.message);
        if (error.name === 'TokenExpiredError') {
            return res.json({ success: false, message: "Session expired. Please login again." })
        }
        return res.json({ success: false, message: "Invalid or expired token. Please login." })
    }

}
export default authMiddleware;