import jwt from "jsonwebtoken";
import user from "../models/user.js";

export const protect = async (req, res, next) => {
  let token;

  // Check if Authorization header exists and starts with "Bearer"
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Extract token
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by ID (excluding password field)
      const existingUser = await user.findById(decoded.id).select("-password");

      if (!existingUser) {
        return res.status(401).json({ success: false, message: "Not authorized, user not found" });
      }

      req.user = existingUser; // attach user to request
      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, no token" });
  }
};
