import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user.js"; // ← Changed to uppercase User
import Chat from "../models/chat.js";

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// API to register user
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email }); // ← User (uppercase)

    if (userExists) {
      return res.json({ success: false, message: "User already exists" });
    }

    const newUser = await User.create({ name, email, password }); // ← User (uppercase)

    const token = generateToken(newUser._id);
    res.json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        credits: newUser.credits,
      },
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// API to login user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email }); // ← Already correct

    if (existingUser && (await bcrypt.compare(password, existingUser.password))) {
      const token = generateToken(existingUser._id);
      return res.json({
        success: true,
        token,
        user: {
          id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          credits: existingUser.credits,
        },
      });
    }

    return res.json({ success: false, message: "Invalid email or password" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// API to get user data (requires protect middleware)
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password'); // ← Already correct

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        credits: user.credits,
      }
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};


// api  to get published images

export const getPublishedImages = async (req, res) => {
  try {
    const publishedImageMessages = await Chat.aggregate([
      { $unwind: "$messages" },
      {
        $match: {
          "messages.isImage": true,
          "messages.isPublished": true
        }
      },
      {
        $project:
        {
          "_id": 0,
          imageUrl:"$messages.content",
          userName:"$userName"
        }
      }
    ])
    res.json({ success: true, images: publishedImageMessages })

  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}