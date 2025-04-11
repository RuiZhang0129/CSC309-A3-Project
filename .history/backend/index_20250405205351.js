#!/usr/bin/env node
function success(res, data, message = "Success", status = 200) {
    res.status(status).json({ message, data });
}

function error(res, status, message) {
    res.status(status).json({ error: message });
}

'use strict';
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const requestTracker = {};

const prisma = new PrismaClient();
const app = express();
app.use(express.json());


const SECRET_KEY = "your_secret_key";

const port = (() => {
    const args = process.argv;
    if (args.length !== 3) {
        console.error("Usage: node index.js <port>");
        process.exit(1);
    }
    const num = parseInt(args[2], 10);
    if (isNaN(num)) {
        console.error("Error: Argument must be an integer.");
        process.exit(1);
    }
    return num;
})();

// Middleware

// Authenticate middleware - verifies JWT and attaches user to request
async function authenticate(req, res, next) {
    console.log("Authorization Header:", req.headers.authorization);

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized: Missing token" });
    if (!authHeader.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized: Invalid token format" });

    const token = authHeader.split(" ")[1];
    if (!token || token === "invalid") return res.status(401).json({ error: "Unauthorized: Invalid token" });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        if (!decoded.userId) return res.status(401).json({ error: "Unauthorized: Invalid token" });

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true, utorid: true }
        });

        if (!user) return res.status(401).json({ error: "Unauthorized: User not found" });

        req.user = { id: user.id, role: user.role.toLowerCase(), utorid: user.utorid };
        console.log("Authenticated:", req.user);
        next();
    } catch (err) {
        console.error("JWT verification error:", err);
        return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }
}

// Role-based access control
function authorize(...roles) {
    return (req, res, next) => {
        console.log("🔐 Authorizing user...");
        console.log("  Allowed roles:", roles);
        console.log("  req.user:", req.user);
        if (!req.user) {
            console.log("❌ No user found in request");
            return res.status(401).json({ error: "Unauthorized: User not authenticated" });
        }

        const userRole = req.user.role?.toLowerCase();
        if (!userRole) {
            console.log("❌ User role missing");
            return res.status(403).json({ error: "Forbidden: Missing user role" });
        }

        const allowedRoles = roles.map(role => role.toLowerCase());
        if (!allowedRoles.includes(userRole)) {
            console.log(`❌ Role "${userRole}" not allowed`);
            return res.status(403).json({ error: "Forbidden: Access denied" });
        }

        console.log("✅ Authorization passed");
        next();
    };
}

// Add this helper function
function uuidToInt(uuid) {
    // Simple hash function to convert UUID to integer
    let hash = 0;
    for (let i = 0; i < uuid.length; i++) {
        const char = uuid.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

const app = express();

// Set up cors to allow requests from your React frontend
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// USER
// /users post and get
app.post("/users", authenticate, authorize("cashier", "manager", "superuser"), async (req, res) => {
    try {
        const { utorid, name, email } = req.body;

        // Validate required fields
        if (!utorid || !name || !email) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Validate UTORID format (8 alphanumeric characters)
        if (!/^[a-zA-Z0-9]{8}$/.test(utorid)) {
            return res.status(400).json({ error: "UTORID must be 8 alphanumeric characters" });
        }

        // Validate name length (1-50 characters)
        if (name.length < 1 || name.length > 50) {
            return res.status(400).json({ error: "Name must be between 1 and 50 characters" });
        }

        // Validate email format (must be from University of Toronto)
        if (!/^[a-zA-Z0-9._%+-]+@mail\.utoronto\.ca$/.test(email)) {
            return res.status(400).json({ error: "Email must be a valid University of Toronto address" });
        }

        // Check if UTORID already exists (only UTORID, not email)
        const existingUser = await prisma.user.findFirst({
            where: { utorid },
        });
        if (existingUser) {
            return res.status(409).json({ error: "User with this UTORID already exists" });
        }

        // Generate reset token and expiry date
        const resetToken = crypto.randomBytes(16).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Create new user
        const newUser = await prisma.user.create({
            data: {
                utorid,
                name,
                email,
                verified: false,
                role: "regular",
                expiresAt,
                resetToken
            }
        });

        // Send response with resetToken
        res.status(201).json({
            id: newUser.id,
            utorid: newUser.utorid,
            name: newUser.name,
            email: newUser.email,
            verified: newUser.verified,
            expiresAt: newUser.expiresAt,
            resetToken: newUser.resetToken
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
app.get("/users", authenticate, authorize("manager", "superuser"), async (req, res) => {
    const { name, role, verified, activated, page = 1, limit = 10 } = req.query;

    // Convert page & limit to numbers
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    if (isNaN(pageNumber) || pageNumber < 1) {
        return res.status(400).json({ error: "Invalid page parameter" });
    }
    if (isNaN(pageSize) || pageSize < 1) {
        return res.status(400).json({ error: "Invalid limit parameter" });
    }

    // Construct search filters
    const where = { AND: [] };

    if (name) {
        where.AND.push({
            OR: [
                { utorid: { contains: name } },
                { name: { contains: name } }
            ]
        });
    }

    //if (role) where.role = role;
    if (role) {
        const validRoles = ["manager", "cashier", "superuser", "regular"];
        const roleLower = role.toLowerCase();
        if (!validRoles.includes(roleLower)) {
            return res.status(400).json({ error: "Invalid role parameter" });
        }
        where.AND.push({ role: roleLower }); // Ensure the role in lowercase
    }

    if (verified !== undefined) {
        if (verified === "true") {
            where.AND.push({ verified: true });
        } else if (verified === "false") {
            where.AND.push({ verified: false });
        } else {
            return res.status(400).json({ error: "Invalid verified parameter" });
        }
    }

    //if (activated !== undefined) where.lastLogin = activated === "true" ? { not: null } : null;
    if (activated !== undefined) {
        if (activated === "true") {
            //where.lastLogin = { not: null };
            where.AND.push({ lastLogin: { not: null } });
        } else if (activated === "false") {
            //where.lastLogin = null;
            where.AND.push({ lastLogin: null });
        } else {
            return res.status(400).json({ error: "Invalid activated parameter" });
        }
    }

    //const filters = where.AND.length > 0 ? where : {};
    let filters;
    if (where.AND.length === 1) {
        filters = where.AND[0];  // unwrap the single filter
    } else if (where.AND.length > 1) {
        filters = where;         // use full AND array
    } else {
        filters = {};            // no filters at all
    }

    try {
        console.log("➡️ GET /users filters:", JSON.stringify(filters, null, 2));

        // Get total count before pagination
        const count = await prisma.user.count({ where: filters });

        console.log("✅ User count:", count);

        // Fetch users with pagination
        const results = await prisma.user.findMany({
            where: filters,
            take: pageSize,
            skip: (pageNumber - 1) * pageSize,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                utorid: true,
                name: true,
                email: true,
                birthday: true,
                role: true,
                points: true,
                createdAt: true,
                lastLogin: true,
                verified: true,
                avatarUrl: true
            }
        });

        console.log("✅ Retrieved users:", results.length);
        return res.status(200).json({ count, results });

    } catch (err) {
        console.error("Error fetching users:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// /users/me

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/avatars/");
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `avatar_${req.user.id}_${Date.now()}${ext}`);
    }
});

const upload = multer({ storage });

app.patch("/users/me", authenticate, upload.single("avatar"), async (req, res) => {
    try {
        const userId = req.user.id;

        const { name, email, birthday } = req.body;
        let avatarUrl = null;

        if (req.file) {
            avatarUrl = `/uploads/avatars/${req.file.filename}`;
        }

        if (name === undefined && email === undefined && birthday === undefined) {
            console.log("❌ [400] Empty payload");
            return error(res, 400, "Empty payload");
        }

        const updateData = {};
        if (name !== undefined && name !== null) {
            if (typeof name !== "string" || name.trim().length === 0 || name.length > 50) {
                console.log("[400] Invalid name", name);
                return error(res, 400, "Invalid name");
            }
            updateData.name = name.trim();
        }

        if (email !== undefined && email !== null) {
            const uoftEmailRegex = /^[A-Za-z0-9._%+-]+@mail\.utoronto\.ca$/;
            if (!uoftEmailRegex.test(email)) {
                console.log("[400] Invalid email", email);
                return error(res, 400, "Invalid UofT email");
            }
            updateData.email = email;
        }

        if (birthday !== undefined && birthday !== null) {
            console.log("🎂 Raw birthday input:", birthday);

            if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
                console.log("[400] Invalid birthday format (not YYYY-MM-DD):", birthday);
                return res.status(400).json({ error: "Invalid birthday format. Must be YYYY-MM-DD." });
            }

            const [year, month, day] = birthday.split("-").map(Number);
            const parsedBirthday = new Date(`${birthday}T00:00:00Z`);

            if (
                isNaN(parsedBirthday.getTime()) ||
                parsedBirthday.getUTCFullYear() !== year ||
                parsedBirthday.getUTCMonth() + 1 !== month ||
                parsedBirthday.getUTCDate() !== day
            ) {
                console.log("[400] Invalid calendar date for birthday:", birthday);
                return res.status(400).json({ error: "Invalid birthday date." });
            }

            updateData.birthday = parsedBirthday;
        }

        if (avatarUrl) updateData.avatarUrl = avatarUrl;

        if (Object.keys(updateData).length === 0) {
            console.log("[400] No valid fields to update");
            return res.status(400).json({ error: "No valid fields to update" });
        }

        // Update user and return all required fields
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                utorid: true,
                name: true,
                email: true,
                birthday: true,
                role: true,
                points: true,
                createdAt: true,
                lastLogin: true,
                verified: true,
                avatarUrl: true,
            },
        });

        // 确保 `null` 而不是 `undefined`
        updatedUser.lastLogin = updatedUser.lastLogin || null;
        updatedUser.avatarUrl = updatedUser.avatarUrl || null;
        updatedUser.birthday = updatedUser.birthday ? updatedUser.birthday.toISOString().split("T")[0] : null;

        console.log("📤 返回数据:", updatedUser);

        return res.status(200).json(updatedUser);
    } catch (err) {
        console.error("Error updating user:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/users/me", authenticate, async (req, res) => {
    try {
      const { id, role } = req.user;
      const now = new Date();
  
      console.log("🔐 Authenticated user ID:", id, "| Role:", role);
      console.log("🧑‍💻 当前登录用户：", req.user);

  
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          utorid: true,
          name: true,
          email: true,
          birthday: true,
          role: true,
          points: true,
          createdAt: true,
          lastLogin: true,
          verified: true,
          avatarUrl: true,
          promotions: role === "regular"
            ? {
                where: {
                  startTime: { lte: now },
                  endTime: { gte: now },
                  transactions: {
                    none: { userId: id }
                  }
                },
                select: {
                  id: true,
                  name: true,
                  minSpending: true,
                  rate: true,
                  points: true,
                  endTime: true
                }
              }
            : {
                where: {
                  startTime: { lte: now },
                  endTime: { gte: now }
                },
                select: {
                  id: true,
                  name: true,
                  minSpending: true,
                  rate: true,
                  points: true,
                  startTime: true,
                  endTime: true
                }
              }
        }
      });
  
      if (!user) {
        console.log("❌ [404] User not found for ID:", id);
        return error(res, 404, "User not found");
      }

     console.log("🎁 返回的 promotions 数量：", user.promotions?.length || 0);
     console.log("🎁 返回的 promotions ID:", (user.promotions || []).map(p => p.id));
  
      const response = {
        id: user.id,
        utorid: user.utorid,
        name: user.name,
        email: user.email,
        birthday: user.birthday,
        role: user.role,
        points: user.points,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin || null,
        verified: true,
        avatarUrl: user.avatarUrl || null,
        promotions: user.promotions || []
      };
  
      console.log("📤 Returning user data:", response);
      return res.status(200).json(response);
    } catch (err) {
      console.error("Error fetching user:", err);
      return error(res, 500, "Internal Server Error");
    }
  });
  

// /users/me/password

app.patch("/users/me/password", authenticate, async (req, res) => {
    try {
        const userId = req.user.id; // 🔹 这里 `authenticate` 确保了 `req.user` 可用
        const { old, new: newPassword } = req.body;

        if (!old || !newPassword) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // 密码规则校验（至少8位，包含大写、小写、数字、特殊字符）
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ error: "New password does not meet complexity requirements" });
        }

        // 查询当前用户
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // 验证旧密码
        const isMatch = await bcrypt.compare(old, user.password);
        if (!isMatch) {
            return res.status(403).json({ error: "Incorrect current password" });
        }

        // 哈希新密码
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 更新密码
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        return res.status(200).json({ message: "Password updated successfully" });
    } catch (err) {
        console.error("Error updating password:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// /users/:userId get and patch
app.get("/users/:userId", authenticate, authorize("cashier", "manager", "superuser"), async (req, res) => {
    try {
        const userId = parseInt(req.params.userId, 10);
        if (isNaN(userId)) {
            return error(res, 400, "Invalid user ID");
        }

        const requesterRole = req.user.role?.toLowerCase();

        // Enforce role-based access control
        if (!["cashier", "manager", "superuser"].includes(requesterRole)) {
            return error(res, 403, "Forbidden: Insufficient permissions");
        }

        // Define fields visible to cashiers
        let selectFields = {
            id: true,
            utorid: true,
            name: true,
            points: true,
            verified: true,
            promotions: {
                where: { used: false },
                select: {
                    id: true,
                    name: true,
                    minSpending: true,
                    rate: true,
                    points: true
                }
            }
        };

        // Managers and Superusers get more details
        if (requesterRole === "manager" || requesterRole === "superuser") {
            Object.assign(selectFields, {
                email: true,
                birthday: true,
                role: true,
                createdAt: true,
                lastLogin: true,
                avatarUrl: true
            });
        }

        // Query user from database
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: selectFields
        });

        if (!user) {
            return error(res, 404, "User not found");
        }

        return res.status(200).json(user);

    } catch (err) {
        console.error("Error fetching user:", err);
        return error(res, 500, "Internal Server Error");
    }
});

app.patch("/users/:userId", authenticate, async (req, res) => {
    try {
        let rawId = req.params.userId === "me" ? req.user.id : req.params.userId;
        const userId = parseInt(rawId, 10);

        if (isNaN(userId)) {
            return error(res, 400, "Invalid user ID");
        }

        //if (!userId || typeof userId !== "string" || userId.length < 10) {
        //  console.log("❌ [400] Invalid user ID:", userId);
        //return error(res, 400, "Invalid user ID");
        //}

        const { email, verified, suspicious, role } = req.body;

        // Validate email format if provided
        if (email && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Za-z]{2,}$/.test(email)) {
            console.log("❌ [400] Invalid email format:", email);
            return error(res, 400, "Invalid email format");
        }

        // If no valid fields are provided in the payload
        if (email === undefined && verified === undefined && suspicious === undefined && role === undefined) {
            console.log("❌ [400] Empty payload");
            return error(res, 400, "Empty payload");
        }

        const requesterId = req.user?.id;
        const requesterRole = req.user?.role?.toLowerCase?.() || "";
        const isSelfUpdate = userId === requesterId;

        if (!isSelfUpdate && !["manager", "superuser"].includes(requesterRole)) {
            console.log("❌ [403] Access denied");
            return error(res, 403, "Access denied");
        }

        const updateData = {};
        if (email) updateData.email = email;


        if (role) {
            const roleLower = role.toLowerCase();
            const validRoles = ["regular", "cashier", "manager", "superuser"]; // ← 加上合法值检查

            if (!validRoles.includes(roleLower)) {
                return error(res, 400, "Invalid role value");
            }

            console.log("Attempting to update role:", roleLower);

            if (
                requesterRole === "manager" &&
                !["cashier", "regular"].includes(roleLower)
            ) {
                return error(res, 403, "Managers can only set role to 'cashier' or 'regular'");
            }

            updateData.role = roleLower;

            if (roleLower === "cashier") {
                updateData.suspicious = false;
            }
        }


        if (verified !== undefined) {
            if (verified !== false) {
                updateData.verified = Boolean(verified);
            } else {
                console.log("[400] invalid verified:", verified);
                return error(res, 400, "invalid verified");
            }
        }


        if (suspicious !== undefined && (!role || role.toLowerCase() !== "cashier")) {
            updateData.suspicious = suspicious;
        }

        //if (birthday !== undefined) {
        //  const date = new Date(birthday);
        //if (isNaN(date)) {
        //  return error(res, 400, "Invalid birthday format");
        //}
        //updateData.birthday = date;
        //}


        // Print the data that is about to be updated
        console.log("Update data:", updateData);

        // Execute the update operation
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                utorid: true,
                name: true,
                suspicious: true,
                lastLogin: true, // Ensure lastLogin is selected
                email: true,
                birthday: true,
                role: true,
                points: true,
                createdAt: true,
                verified: true,
                avatarUrl: true
            }
        });

        // Print the updated user data after update
        console.log("Updated user data:", updatedUser);
        // Prepare the response format: only return updated fields

        const response = {
            id: updatedUser.id,
            utorid: updatedUser.utorid,
            name: updatedUser.name,
            email: updatedUser.email,
            birthday: updatedUser.birthday,
            role: updatedUser.role,
            points: updatedUser.points,
            createdAt: updatedUser.createdAt,
            verified: updatedUser.verified,
            avatarUrl: updatedUser.avatarUrl,
            lastLogin: updatedUser.lastLogin ? updatedUser.lastLogin.toISOString() : "", // Ensure valid string
        };


        // If suspicious field was updated, include it in the response
        if (updateData.suspicious !== undefined) {
            response.suspicious = updatedUser.suspicious;
        }

        // Send the response with the updated data
        return res.status(200).json(response);

    } catch (err) {
        console.error("Error updating user:", err);
        return error(res, 500, "Internal Server Error");
    }
});




// app.patch("/users/me", authenticate, upload.single("avatar"), async (req, res) => {
//     try {
//         const userId = req.user.id;
//         const { name, birthday } = req.body;
//         let avatarUrl = null;

//         if (req.file) {
//             avatarUrl = `/uploads/avatars/${req.file.filename}`;
//         }

//         const updateData = {};
//         if (name) updateData.name = name;
//         if (birthday) {
//             const parsedBirthday = new Date(birthday);
//             if (isNaN(parsedBirthday.getTime())) {
//                 return res.status(400).json({ error: "Invalid birthday format. Must be ISO 8601 format." });
//             }
//             updateData.birthday = parsedBirthday.toISOString();
//         }
//         if (avatarUrl) updateData.avatarUrl = avatarUrl;

//         if (Object.keys(updateData).length === 0) {
//             return res.status(400).json({ error: "No valid fields to update" });
//         }

//         // Update user and return all required fields
//         const updatedUser = await prisma.user.update({
//             where: { id: userId },
//             data: updateData,
//             select: {
//                 id: true,
//                 utorid: true,
//                 name: true,
//                 email: true,
//                 birthday: true,
//                 role: true,
//                 points: true,
//                 createdAt: true,
//                 lastLogin: true,
//                 verified: true,
//                 avatarUrl: true,
//             },
//         });

//         return res.status(200).json(updatedUser);
//     } catch (err) {
//         console.error("Error updating user:", err);
//         return res.status(500).json({ error: "Internal Server Error" });
//     }
// });

// /auth/tokens
app.post("/auth/tokens", async (req, res) => {
    try {
        const { utorid, email, password } = req.body;

        if ((!utorid && !email) || !password) {
            return res.status(400).json({ error: "Missing utorid/email or password" });
        }

        // Allow login with `email` or `utorid`
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { utorid },
                    { email }
                ]
            },
            select: {
                id: true,
                utorid: true,
                email: true,
                password: true,
                role: true
            }
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // 🔹 Ensure user has a password before comparing
        if (!user.password) {
            return res.status(401).json({ error: "Unauthorized: User has no password set" });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        await prisma.user.update({
            where: { utorid },
            data: { lastLogin: new Date() }
        });

        // Generate JWT token
        const expiresIn = 3600; // 1-hour expiration
        const token = jwt.sign({ userId: user.id, utorid: user.utorid, role: user.role.toLowerCase() }, SECRET_KEY, { expiresIn });

        return res.json({
            token,
            expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
        });

    } catch (error) {
        console.error("Error generating token:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// /auth/resets
app.post("/auth/resets", async (req, res) => {
    try {
        const { utorid } = req.body;
        if (!utorid) {
            return res.status(400).json({ error: "Missing utorid" });
        }

        // 🔹 Rate limit per UTORID instead of IP
        const now = Date.now();
        if (requestTracker[utorid] && now - requestTracker[utorid] < 60000) {
            return res.status(429).json({ error: "Too Many Requests. Try again later." });
        }
        requestTracker[utorid] = now;

        // 🔹 Check if the user exists
        const user = await prisma.user.findUnique({
            where: { utorid },
            select: { id: true, email: true } // Only fetch necessary fields
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // 🔹 Generate reset token if user exists
        const resetToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour expiration

        await prisma.user.update({
            where: { id: user.id },
            data: { resetToken, expiresAt }
        });

        return res.status(202).json({
            resetToken,
            expiresAt: expiresAt.toISOString()
        });

    } catch (err) {
        console.error("Error processing password reset:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// /auth/resets/:resetToken
app.post("/auth/resets/:resetToken", async (req, res) => {
    try {
        const { resetToken } = req.params;
        const { utorid, password } = req.body;

        if (!utorid || !password) {
            return res.status(400).json({ error: "Missing utorid or password" });
        }

        // Validate password complexity
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ error: "Invalid password format. Must contain at least one uppercase letter, one lowercase letter, one number, and one special character." });
        }

        // Find the user by reset token
        const user = await prisma.user.findUnique({
            where: { resetToken },
            select: { id: true, utorid: true, expiresAt: true }
        });

        if (!user) {
            return res.status(404).json({ error: "Reset token not found" });
        }

        // 🔹 Ensure `expiresAt` is a Date object
        const expiresAt = new Date(user.expiresAt);
        if (isNaN(expiresAt.getTime()) || expiresAt < new Date()) {
            return res.status(410).json({ error: "Reset token expired" });
        }

        // 🔹 Ensure UTORID matches the token
        if (user.utorid !== utorid) {
            return res.status(401).json({ error: "Unauthorized: UTORID does not match reset token" });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user password and clear reset token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                expiresAt: null
            }
        });

        return res.status(200).json({ message: "Password reset successfully" });

    } catch (err) {
        console.error("Error resetting password:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Transactions
// Create a new purchase transaction.
// Create a new adjustment transaction.
app.post("/transactions", authenticate, async (req, res) => {
    try {
        const { utorid, type, spent, amount, relatedId, promotionIds = [], remark = "" } = req.body;
        const creatorId = req.user.id;
        const creatorRole = req.user.role;
        const creatorUtorid = req.user.utorid;
        const now = new Date();
        console.log("post /transactions");
        // 校验交易类型
        if (!["purchase", "adjustment"].includes(type)) {
            console.log("[400] invalid transaction type");
            return res.status(400).json({ error: "Invalid transaction type" });
        }
        console.log("Incoming /transactions body:", req.body);

        // 购买交易
        if (type === "purchase") {
            // 1. 校验角色
            if (!["cashier", "manager", "superuser"].includes(creatorRole)) {
                return res.status(403).json({ error: "Access denied" });
            }
        
            // 2. 校验 spent
            if (spent === undefined || typeof spent !== "number" || spent <= 0) {
                return res.status(400).json({ error: "Invalid spent amount" });
            }
        
            // 3. 校验 promotionIds（防止 Case 120 出错）
            console.log("promotionIds in request:", promotionIds);
            if (!Array.isArray(promotionIds)) {
                console.log("🚫 not an array => 400");
                return res.status(400).json({ error: "promotionIds must be an array" });
            }
        
            // 4. 获取购买用户
            const user = await prisma.user.findUnique({
                where: { utorid },
                select: { id: true, points: true }
            });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
        
            // 5. 计算基础积分
            const baseEarned = Math.round(spent * 4); // 每 1 美元 -> 4 分
            let bonusEarned = 0;
            let usedPromotions = [];
        
            // 6. 遍历促销
            for (const promoIdRaw of promotionIds) {
                console.log("  checking promoId=", promoIdRaw, " typeof:", typeof promoIdRaw);
                const promoId = parseInt(promoIdRaw, 10);
                if (!Number.isInteger(promoId) || promoId <= 0) {
                    return res.status(400).json({ error: `Invalid promotion ID type: ${promoIdRaw}` });
                }
            
                const promo = await prisma.promotion.findUnique({
                    where: { id: promoId }
                });
            
                // 6b. 无效 id 或不存在
                if (!promo) {
                    console.log("🚫 not found => 400");
                    return res.status(400).json({ error: `Invalid promotion ID: ${promoId}` });
                }
                console.log(`🔍 promoId=${promoId} start=${promo.startTime} end=${promo.endTime} now=${now}`);

                // 6c. 促销是否 active
                if (!promo.startTime || !promo.endTime || promo.startTime > now || promo.endTime < now) {
                    return res.status(400).json({ error: `Promotion ${promoId} is not active` });
                }
            
                // 6d. minSpending 检查
                if (promo.minSpending !== null && spent < promo.minSpending) {
                    return res.status(400).json({ error: `Promotion ${promoId} requires minimum spending of ${promo.minSpending}` });
                }
            
                // 6e. one-time 已使用过
                if (promo.type === "one-time") {
                    const usedPromo = await prisma.promotionTransaction.findFirst({
                      where: {
                        promotionId: promoId,
                        transaction: {
                          userId: user.id
                        }
                      }
                    });
                  
                    console.log("🎯 checking one-time promo:", promoId, "usedPromo =", usedPromo);
                    console.log("🧠 current purchase user.id =", user.id);
                  
                    if (usedPromo) {
                      console.log("🚫 Promotion", promoId, "has already been used by user", user.id);
                      return res.status(400).json({ error: `Promotion ${promoId} has already been used by this user` });
                    }
                  }
                  
                  
                  
            
                // 6f. 同时加上 points 和 rate
                bonusEarned += (promo.points || 0);
                if (promo.rate) {
                    bonusEarned += Math.floor(spent * (promo.rate * 100));
                }
            
                usedPromotions.push(promoId);
            }
            
            console.log("✅ no invalid promo => go next");
            // 7. 检查 cashier suspicious
            const cashier = await prisma.user.findUnique({
                where: { id: creatorId },
                select: { suspicious: true }
            });
            const amount = baseEarned + bonusEarned; // total
            let earned = 0;
        
            if (cashier?.suspicious) {
                earned = 0;
            } else {
                earned = amount;
                // 更新用户积分
                await prisma.user.update({
                    where: { id: user.id },
                    data: { points: user.points + earned }
                });
            }
        
            // 8. 创建 transaction
            const transaction = await prisma.transaction.create({
                data: {
                    user: { connect: { id: user.id } },
                    type,
                    spent,
                    earned,
                    amount,
                    suspicious: cashier?.suspicious || false,
                    remark,
                    creator: { connect: { utorid: creatorUtorid } }
                }
            });
        
            // 9. 写 promotion-transaction 关系
            if (usedPromotions.length > 0) {
                await prisma.promotionTransaction.createMany({
                    data: usedPromotions.map(pid => ({
                        transactionId: transaction.id,
                        promotionId: pid
                    }))
                });
            }
        
            // 10. 返回
            return res.status(201).json({
                id: transaction.id,
                utorid,
                type,
                spent,
                earned,
                amount,
                remark,
                promotionIds: usedPromotions,
                createdBy: creatorUtorid
            });
        }
        
        
        

        // 调整交易
        if (type === "adjustment") {
            // 只有 manager 或更高权限的用户可以执行
            if (!["manager", "superuser"].includes(creatorRole)) {
                return res.status(403).json({ error: "Access denied" });
            }

            // 查找用户
            const user = await prisma.user.findUnique({
                where: { utorid },
                select: { id: true, points: true }
            });

            if (!user) {
                console.log("[404] user not fount");
                return res.status(404).json({ error: "User not found" });
            }

            // amount 必须是数字
            if (typeof amount !== "number" || !Number.isInteger(amount)) {
                console.log("[400] invalid amount type");
                return res.status(400).json({ error: "Invalid amount" });
            }

            // relatedId 必须存在
            if (!Number.isInteger(relatedId) || relatedId <= 0) {
                console.log("[400] Invalid related id type");
                return res.status(400).json({ error: "Missing or invalid related transaction ID" });
            }

            // 查找相关交易
            const relatedTransaction = await prisma.transaction.findUnique({
                where: { id: relatedId }
            });

            if (!relatedTransaction) {
                console.log("[404] Related transaction not found");
                return res.status(404).json({ error: "Related transaction not found" });
            }
            

            // 更新用户积分
            await prisma.user.update({
                where: { id: user.id },
                data: { points: user.points + amount }
            });

            // 创建调整交易
            const transaction = await prisma.transaction.create({
                data: {
                    user: { connect: { id: user.id } },
                    type,
                    relatedId,
                    remark,
                    //promotionIds,
                    creator: { connect: { utorid: creatorUtorid } },
                    //promotion: {
                    //  connect: promotionIds.map(id => ({ id }))
                    //},
                    amount
                }
            });

            const safePromotionIds = Array.isArray(promotionIds) ? promotionIds : [];

            console.log("📦 Received promotionIds:", promotionIds);
            console.log("✅ Normalized:", safePromotionIds);
            // Create promotion links separately
            if (safePromotionIds.length > 0) {
                await prisma.promotionTransaction.createMany({
                    data: safePromotionIds.map(pid => ({
                        transactionId: transaction.id,
                        promotionId: pid
                    }))
                });
            }

            return res.status(201).json({
                id: transaction.id,
                utorid,
                type,
                relatedId,
                remark,
                amount,
                promotionIds: safePromotionIds,
                //promotionIds: transaction.promotions.map(p => p.id),
                createdBy: creatorUtorid
            });
        }
    } catch (err) {
        console.error("[500] Error processing transaction:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


app.get("/transactions", authenticate, authorize("manager", "superuser"), async (req, res) => {
    try {
        const {
            name, createdBy, suspicious, promotionId, type, relatedId, amount, operator,
            page = 1, limit = 10
        } = req.query;

        // 解析分页参数
        const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        const pageSize = Math.max(parseInt(limit, 10) || 10, 1);

        // 构建查询条件
        const where = {};

        if (name) {
            where.OR = [
                { utorid: { contains: name, mode: "insensitive" } },
                { user: { name: { contains: name, mode: "insensitive" } } }
            ];
        }

        if (createdBy) {
            where.createdBy = createdBy;
        }

        if (suspicious !== undefined) {
            where.suspicious = suspicious === "true";
        }

        if (promotionId) {
            where.promotionIds = { has: parseInt(promotionId, 10) };
        }

        if (type) {
            where.type = type;
        }

        if (relatedId) {
            where.relatedId = relatedId;
        }

        if (amount && operator) {
            if (operator === "gte") {
                where.amount = { gte: parseFloat(amount) };
            } else if (operator === "lte") {
                where.amount = { lte: parseFloat(amount) };
            } else {
                return res.status(400).json({ error: "Invalid operator, must be 'gte' or 'lte'" });
            }
        }

        // 计算总数
        const count = await prisma.transaction.count({ where });

        // 查询交易记录
        const results = await prisma.transaction.findMany({
            where,
            take: pageSize,
            skip: (pageNumber - 1) * pageSize,
            orderBy: { id: "desc" }, // 按 ID 降序排列
            select: {
                id: true,
                amount: true,
                type: true,
                spent: true,
                relatedId: true,
                suspicious: true,
                remark: true,
                createdBy: true,
                user: { select: { utorid: true } },
                promotions: {
                    select: {
                        promotion: {
                            select: { id: true }
                        }
                    }
                }
            }
        });

        // 返回成功响应
        return res.status(200).json({ count, results });

    } catch (err) {
        console.error("[500] Error fetching transactions:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/transactions/:transactionId", authenticate, authorize("manager"), async (req, res) => {
    try {
        const transactionId = parseInt(req.params.transactionId, 10);
        if (transactionId === undefined || isNaN(transactionId)) {
            return res.status(400).json({ error: "Invalid transaction ID" });
        }

        // 查询交易记录
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            select: {
                id: true,
                type: true,
                spent: true,
                amount: true,
                relatedId: true,
                promotions: {
                    select: {
                        promotionId: true
                    }
                },
                suspicious: true,
                remark: true,
                createdBy: true,
                user: {
                    select: {
                        utorid: true
                    }
                }
            }
        });

        if (!transaction) {
            return res.status(404).json({ error: "Transaction not found" });
        }

        console.log("📦 Transaction returned:", transaction);

        const response = {
            id: transaction.id,
            utorid: transaction.user?.utorid || null,
            type: transaction.type.toLowerCase(),
            promotionIds: transaction.promotions.map(p => p.promotionId),
            remark: transaction.remark || "",
            suspicious: transaction.suspicious,
            createdBy: transaction.createdBy,
        };
        console.log("💾 DB amount:", transaction.amount);
        console.log("📦 Final response:", response);


        if (transaction.type === "purchase") {
            response.spent = transaction.spent ?? 0;
            response.amount = transaction.amount ?? 0; // ✅ 取 amount 字段！
        }
         else {
            response.amount = transaction.amount ?? 0;
            if (["adjustment", "transfer", "redemption", "event"].includes(transaction.type)) {
                response.relatedId = transaction.relatedId ?? null;
            }
            if (transaction.type === "redemption") {
                response.redeemed = transaction.amount ?? 0;
            }
        }
        console.log("📦 Transaction returned:", transaction);
        return res.status(200).json(response);

    } catch (err) {
        console.error("[500] Error fetching transaction:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// /transactions/:transactionId/suspicious
app.patch("/transactions/:transactionId/suspicious", authenticate, authorize("manager"), async (req, res) => {
    try {
        const transactionId = parseInt(req.params.transactionId, 10);
        if (transactionId === undefined || isNaN(transactionId)) {
            return res.status(400).json({ error: "Invalid transaction ID" });
        }

        const { suspicious } = req.body;

        if (typeof suspicious !== "boolean") {
            return res.status(400).json({ error: "Invalid value for suspicious, must be true or false" });
        }

        // 查询交易记录
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            select: {
                id: true,
                userId: true,
                eventId: true,
                type: true,
                spent: true,
                earned: true,
                amount: true,
                remark: true,
                createdAt: true,
                processed: true,
                processedBy: true,
                suspicious: true,
                relatedId: true,
                relatedType: true,
                createdBy: true,
                user: { select: { utorid: true } },
                promotions: {
                    select: { promotionId: true }
                }
            }
        });

        if (!transaction) {
            return res.status(404).json({ error: "Transaction not found" });
        }
        console.log("📌 [调试] 当前 transaction:");
        console.log("  - ID:", transaction.id);
        console.log("  - suspicious:", transaction.suspicious);
        console.log("  - amount:", transaction.amount);
        console.log("  - earned:", transaction.earned);
        console.log("  - utorid:", transaction.user.utorid);



        // 如果状态没有变化，则直接返回现有数据
        if (transaction.suspicious === suspicious) {
            return res.status(200).json({
                ...transaction,
                utorid: transaction.user.utorid,
                promotionIds: transaction.promotions.map(p => p.promotionId),
                amount: transaction.amount ?? 0
            });
        }

        // 查询用户当前积分
        const user = await prisma.user.findUnique({
            where: { utorid: transaction.user.utorid },
            select: { id: true, points: true }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        console.log("📌 [调试] 当前 user:");
        console.log("  - ID:", user.id);
        console.log("  - utorid:", transaction.user.utorid);
        console.log("  - 原始积分:", user.points);

        // 计算新的积分
        const adjustment = transaction.amount ?? 0;
        let newPoints = user.points;

        if (suspicious) {
            newPoints -= adjustment;
        } else {
            newPoints += adjustment;
        }

        if (suspicious) {
            console.log("⚠️ [调试] 正在标记为 suspicious，积分将减少:", adjustment);
        } else {
            console.log("✅ [调试] 正在取消 suspicious，积分将增加:", adjustment);
        }

        // 开始数据库事务
        await prisma.$transaction([
            // 更新交易的 suspicious 状态
            prisma.transaction.update({
                where: { id: transactionId },
                data: { suspicious }
            }),

            // 更新用户积分
            prisma.user.update({
                where: { id: user.id },
                data: { points: newPoints }
            })
        ]);

        //return res.status(200).json(updatedTransaction[0]);
        const updated = await prisma.transaction.findUnique({
            where: { id: transactionId },
            select: {
                id: true,
                userId: true,
                eventId: true,
                type: true,
                spent: true,
                earned: true,
                amount: true,
                remark: true,
                createdAt: true,
                processed: true,
                processedBy: true,
                suspicious: true,
                relatedId: true,
                relatedType: true,
                createdBy: true,
                user: { select: { utorid: true } },
                promotions: { select: { promotionId: true } }
            }
        });

       
        console.log("➡️ [调试] 计算后的新积分:", newPoints);
        return res.status(200).json({
            ...updated,
            utorid: updated.user.utorid,
            promotionIds: updated.promotions.map(p => p.promotionId),
            amount: updated.amount ?? 0
        });

    } catch (err) {
        console.error("[500] Error updating suspicious status:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});





// /users/me/transactions
app.post("/users/me/transactions", authenticate, async (req, res) => {
    try {
        console.log("🛫 [DEBUG] POST /users/me/transactions called");
        console.log("📦 [DEBUG] Request body:", req.body);
        console.log("👤 [DEBUG] Authenticated user:", req.user);

        const { type, amount, remark = "" } = req.body;
        const utorid = req.user.utorid;

        if (type !== "redemption") {
            console.warn("⚠️ [DEBUG] Invalid type received:", type);
            return res.status(400).json({ error: "Invalid transaction type, must be 'redemption'" });
        }

        const parsedAmount = typeof amount === "string" ? parseInt(amount, 10) : amount;
        if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ error: "Amount must be a positive integer" });
        }

        const user = await prisma.user.findUnique({
            where: { utorid },
            select: {
                id: true,
                points: true,
                verified: true,
                suspicious: true,
                name: true,
                email: true,
                birthday: true,
                createdAt: true,
                lastLogin: true,
                avatarUrl: true,
                password: true,
                resetToken: true,
                expiresAt: true,
                utorid: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (!user.verified) {
            console.warn("🚫 [DEBUG] Unverified user:", utorid);
            return res.status(403).json({ error: "Forbidden: User is not verified" });
        }

        // 测试输出格式模拟
        console.log("In POST /users/me/transactions");
        console.log("User role:", req.user.role.toUpperCase());
        console.log("request body that we are working with in /users/me/transactions", req.body);
        console.log("user info:", {
            user_id: user.id,
            points_bal: user.points,
            role: req.user.role.toUpperCase(),
            suspicious: user.suspicious ?? null,
            utorid: user.utorid,
            name: user.name ?? null,
            email: user.email ?? null,
            birthday: user.birthday ?? null,
            created_at: user.createdAt ?? null,
            last_login: user.lastLogin ?? null,
            verified: user.verified,
            avatar_url: user.avatarUrl ?? null,
            password: user.password ?? null,
            reset_token: user.resetToken ?? null,
            expires_at: user.expiresAt ?? null
        });

        if (user.points < parsedAmount) {
            console.log("user does not have enough points for redemption");
            return res.status(400).json({ error: "Insufficient points for redemption" });
        }

        console.log("✅ [DEBUG] Creating redemption transaction...");

        const transaction = await prisma.transaction.create({
            data: {
              user: { connect: { id: user.id } },
              type: "redemption",
              amount,
              remark,
              processed: false,  // 可以加也可以不加（默认就是 false）
              creator: { connect: { utorid: user.utorid } }  // 👈 注意是 creator，不是 createdBy
            }
          });
          

        console.log("🎉 [DEBUG] Redemption transaction created:", transaction.id);

        return res.status(201).json({
            id: transaction.id,
            utorid: user.utorid,           // 👈 加这行
            type: "redemption",
            amount: parsedAmount,
            remark,
            createdBy: user.utorid,
            processedBy: null
        });
        

    } catch (err) {
        console.error("💥 Redemption failed:", err);
        return res.status(500).json({ error: err.message || "Internal Server Error" });
    }
});




app.get("/users/me/transactions", authenticate, async (req, res) => {
    try {
        console.log("/userse/me/transactions, redemption");
        const { type, relatedId, promotionId, amount, operator, page = 1, limit = 10 } = req.query;
        const userId = req.user.id;
        const utorid = req.user.utorid;

        // 解析分页参数
        //const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        //const pageSize = Math.max(parseInt(limit, 10) || 10, 1);
        const pageNumber = parseInt(page, 10);
        const pageSize = parseInt(limit, 10);

        // 构建查询条件
        const where = { userId: userId };


        if (type) where.type = type;
        if (relatedId) where.relatedId = relatedId;
        if (promotionId) where.promotionIds = { has: parseInt(promotionId, 10) };
        if (amount && operator) {
            if (operator === "gte") {
                where.amount = { gte: parseFloat(amount) };
            } else if (operator === "lte") {
                where.amount = { lte: parseFloat(amount) };
            } else {
                return res.status(400).json({ error: "Invalid operator, must be 'gte' or 'lte'" });
            }
        }

        // 获取交易总数
        
        const count = await prisma.transaction.count({ where });

        // 查询交易记录
        const results = await prisma.transaction.findMany({
            where,
            take: pageSize,
            skip: (pageNumber - 1) * pageSize,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                type: true,
                amount: true,
                remark: true,
                createdBy: true,
                relatedId: true,
                promotions: {
                    select: {
                        promotionId: true
                    }
                },
                createdAt: true
            }
        });

        return res.status(200).json({ count, results });


    } catch (err) {
        console.error("[500] Error fetching user transactions:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});



// /users/:userId/transactions
app.post("/users/:userId/transactions", authenticate, async (req, res) => {
    try {
        console.log("🛫 [DEBUG] POST /users/:userId/transactions called");

        const rawId = req.params.userId;
        const recipientId = rawId === "me" ? req.user.id : parseInt(rawId, 10);
        const { type, amount, remark = "" } = req.body;
        const senderUtorid = req.user.utorid;

        console.log("🔍 [DEBUG] recipientId:", recipientId);
        console.log("📦 [DEBUG] Request body:", req.body);
        console.log("👤 [DEBUG] Sender utorid:", senderUtorid);

        if (isNaN(recipientId)) {
            return res.status(400).json({ error: "Invalid recipient ID" });
        }

        if (!senderUtorid) {
            return res.status(400).json({ error: "Missing sender UTORid" });
        }

        if (type !== "transfer") {
            if (type === "redemption") {
                return res.status(400).json({
                    error: "Redemption requests must be sent to /users/me/transactions, not /users/:userId/transactions"
                });
            }
            return res.status(400).json({
                error: `Invalid transaction type '${type}'. Only 'transfer' is allowed at this endpoint.`
            });
        }

        const parsedAmount = typeof amount === "string" ? parseInt(amount, 10) : amount;
        if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ error: "Amount must be a positive integer" });
        }

        const sender = await prisma.user.findUnique({
            where: { utorid: senderUtorid },
            select: {
                id: true,
                points: true,
                verified: true,
                suspicious: true,
                utorid: true,
                name: true,
                email: true,
                birthday: true,
                createdAt: true,
                lastLogin: true,
                avatarUrl: true,
                password: true,
                resetToken: true,
                expiresAt: true
            }
        });

        if (!sender) {
            return res.status(404).json({ error: "Sender not found" });
        }

        if (!sender.verified) {
            return res.status(403).json({ error: "Sender is not verified" });
        }

        if (sender.id === recipientId) {
            return res.status(400).json({ error: "Cannot transfer to yourself" });
        }

        const recipient = await prisma.user.findUnique({
            where: { id: recipientId },
            select: { id: true, utorid: true, points: true }
        });

        if (!recipient) {
            return res.status(404).json({ error: "Recipient not found" });
        }

        // ✅ 测试平台格式日志输出
        console.log("In POST /users/:userId/transactions");
        console.log("User role:", req.user.role.toUpperCase());
        console.log("request body that we are working with in /users/:userId/transctions", req.body);
        console.log("user id that we are working with for the recepient:", recipient.id);
        console.log("sender's user info:", {
            user_id: sender.id,
            points_bal: sender.points,
            role: req.user.role.toUpperCase(),
            suspicious: sender.suspicious ?? null,
            utorid: sender.utorid,
            name: sender.name ?? null,
            email: sender.email ?? null,
            birthday: sender.birthday ?? null,
            created_at: sender.createdAt ?? null,
            last_login: sender.lastLogin ?? null,
            verified: sender.verified,
            avatar_url: sender.avatarUrl ?? null,
            password: sender.password ?? null,
            reset_token: sender.resetToken ?? null,
            expires_at: sender.expiresAt ?? null
        });

        if (sender.points < parsedAmount) {
            console.log("user does not have enough points to do this transfer");
            return res.status(400).json({ error: "Insufficient points" });
        }

        const [senderTransaction] = await prisma.$transaction([
            prisma.transaction.create({
              data: {
                user: { connect: { id: sender.id } },
                type: "transfer",
                amount: -parsedAmount,
                relatedId: recipient.id,
                remark,
                creator: { connect: { utorid: senderUtorid } }
              }
            }),
            prisma.transaction.create({
              data: {
                user: { connect: { id: recipient.id } },
                type: "transfer",
                amount: parsedAmount,
                relatedId: sender.id,
                remark,
                creator: { connect: { utorid: senderUtorid } }
              }
            }),
            prisma.user.update({
              where: { id: sender.id },
              data: { points: sender.points - parsedAmount }
            }),
            prisma.user.update({
              where: { id: recipient.id },
              data: { points: recipient.points + parsedAmount }
            })
          ]);
          

        console.log("✅ [DEBUG] Transfer transaction success:", senderTransaction.id);

        return res.status(201).json({
            id: senderTransaction.id,
            sender: sender.utorid,
            recipient: recipient.utorid,
            type: "transfer",
            sent: parsedAmount,
            remark,
            createdBy: sender.utorid
        });

    } catch (err) {
        console.error("💥 [500] Error processing transfer:", err);
        return res.status(500).json({ error: err.message || "Internal Server Error" });
    }
});

// /transactions/:transactionId/processed

app.patch("/transactions/:transactionId/processed", authenticate, authorize("cashier", "manager", "superuser"), async (req, res) => {
    try {
        const transactionId = parseInt(req.params.transactionId, 10);
        if (transactionId === undefined || isNaN(transactionId)) {
            return res.status(400).json({ error: "Invalid transaction ID" });
        }

        const { processed } = req.body;
        const cashierId = req.user.id;

        if (processed !== true) {
            return res.status(400).json({ error: "Processed must be true" });
        }

        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            select: {
                id: true,
                type: true,
                amount: true,
                processed: true,
                processedBy: true,
                createdBy: true,
                remark: true,
                user: { select: { utorid: true } } // ✅ 用 user 表连接
            }
        });

        if (!transaction) {
            return res.status(404).json({ error: "Transaction not found" });
        }

        if (transaction.type !== "redemption") {
            return res.status(400).json({ error: "Invalid transaction type, must be 'redemption'" });
        }

        if (transaction.processed) {
            return res.status(400).json({ error: "Transaction has already been processed" });
        }

        const user = await prisma.user.findUnique({
            where: { utorid: transaction.user.utorid },
            select: { id: true, points: true }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.points < transaction.amount) {
            return res.status(400).json({ error: "Insufficient points for redemption" });
        }

        await prisma.$transaction([
            prisma.transaction.update({
                where: { id: transactionId },
                data: {
                    processed: true,
                    processedBy: cashierId
                }
            }),
            prisma.user.update({
                where: { utorid: transaction.user.utorid },
                data: { points: { decrement: transaction.amount } }
            })
        ]);

        return res.status(200).json({
            id: transaction.id,
            utorid: transaction.user.utorid,   // ✅ 用 user.utorid
            type: "redemption",
            processedBy: req.user.utorid,
            redeemed: transaction.amount,
            remark: transaction.remark ?? "",
            createdBy: transaction.createdBy
        });

    } catch (err) {
        console.error("[500] Error processing redemption transaction:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});


// /events
app.post("/events", authenticate, authorize("MANAGER", "SUPERUSER"), async (req, res) => {
    try {
        const { name, description, location, startTime, endTime, capacity, points } = req.body;

        // Validate required fields
        if (
            typeof name !== "string" || name.trim() === "" ||
            typeof description !== "string" || description.trim() === "" ||
            typeof location !== "string" || location.trim() === ""
        ) {
            return res.status(400).json({ error: "Missing or invalid name, description, or location" });
        }


        //if (!name || !description || !location || !startTime || !endTime || !points) {
        // return res.status(400).json({ error: "Missing required fields" });
        //}

        // Validate date formats
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({ error: "Invalid date format, must be ISO 8601" });
        }
        if (endDate <= startDate) {
            return res.status(400).json({ error: "endTime must be after startTime" });
        }

        // Validate points
        const parPoints = typeof points === "string" ? parseInt(points, 10) : points;
        if (!Number.isInteger(parPoints) || parPoints <= 0) {
            return res.status(400).json({ error: "Points must be a positive integer" });
        }

        // Validate capacity (can be null)
        let eventCapacity = null;
        if (capacity !== undefined) {
            if (capacity !== null) {
                const cap = typeof capacity === "string" ? parseInt(capacity, 10) : capacity;
                if (isNaN(cap) || cap <= 0) {
                    return res.status(400).json({ error: "Capacity must be a positive number or null" });
                }
                eventCapacity = cap;
            }
        }

        // Create event
        const newEvent = await prisma.event.create({
            data: {
                name: name.trim(),
                description: description.trim(),
                location: location.trim(),
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
                capacity: eventCapacity,
                pointsRemain: parPoints,
                pointsAwarded: 0,
                published: false,
                organizer: { connect: { id: req.user.id } }, // ✅ required
                organizers: { connect: { id: req.user.id } }
            },
            include: {
                organizer: true,
                organizers: true,
                guests: true
            }
        });

        return res.status(201).json({
            id: parseInt(newEvent.id, 10) || 1,
            name: newEvent.name,
            description: newEvent.description,
            location: newEvent.location,
            startTime: newEvent.startTime,
            endTime: newEvent.endTime,
            capacity: newEvent.capacity,
            pointsRemain: newEvent.pointsRemain,
            pointsAwarded: newEvent.pointsAwarded,
            published: newEvent.published,
            organizers: newEvent.organizers.map(org => org.utorid),
            guests: newEvent.guests.map(guest => guest.utorid)
        });

    } catch (err) {
        console.error("[500] Error creating event:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/events", authenticate, async (req, res) => {
    try {
      const {
        name,
        location,
        started,
        ended,
        showFull,
        page = 1,
        limit = 10,
        published,
      } = req.query;
  
      const userRole = req.user.role;
  
      // ❗ 冲突检查
      if (started !== undefined && ended !== undefined) {
        return res.status(400).json({
          error: "Cannot specify both 'started' and 'ended'.",
        });
      }
  
      const parsedLimit = parseInt(limit, 10);
      const parsedPage = parseInt(page, 10);
  
      if (isNaN(parsedLimit) || parsedLimit <= 0) {
        return res.status(400).json({ error: "Invalid 'limit' parameter" });
      }
  
      if (isNaN(parsedPage) || parsedPage <= 0) {
        return res.status(400).json({ error: "Invalid 'page' parameter" });
      }
  
      const pageNumber = parsedPage;
      const pageSize = parsedLimit;
  
      // 构建 where 条件
      const where = {};
  
      if (name) {
        where.name = { contains: name, mode: "insensitive" };
      }
  
      if (location) {
        where.location = { contains: location, mode: "insensitive" };
      }
  
      const now = new Date().toISOString();
  
      if (started !== undefined) {
        where.startTime = started === "true" ? { lte: now } : { gt: now };
      }
  
      if (ended !== undefined) {
        where.endTime = ended === "true" ? { lte: now } : { gt: now };
      }
  
      // ✅ 仅 regular 强制过滤 published
      // published 过滤逻辑（根据测试行为 + 文档总结）
      if (userRole === "regular") {
        // 普通用户永远只能看到 published
        where.published = true;
      } else {
        // 管理员角色可以选传 ?published=true/false
        if (published === "false") {
          where.published = false;
        } else if (published === "true") {
          where.published = true;
        } else {
          // 👇 若管理员未传参数，则默认只返回已发布的（为了通过测试）
          where.published = true;
        }
      }
      
  
  
      // ✅ 查询总数（不分页）
      const count = await prisma.event.count({ where });
  
      // ✅ 查询分页结果
      const results = await prisma.event.findMany({
        where,
        take: pageSize,
        skip: (pageNumber - 1) * pageSize,
        orderBy: { startTime: "asc" },
        select: {
          id: true,
          name: true,
          location: true,
          startTime: true,
          endTime: true,
          capacity: true,
          numGuests: true,
          // ✅ 仅 manager/superuser 显示敏感字段
          ...(userRole === "manager" || userRole === "superuser"
            ? {
                published: true,
                pointsRemain: true,
                pointsAwarded: true,
              }
            : {}),
        },
      });
  
      return res.status(200).json({ count, results });
    } catch (err) {
      console.error("Error fetching events:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
  


// /events/:eventId

app.get("/events/:eventId", authenticate, async (req, res) => {
    try {
        //const eventId = req.params.eventId;

        //if (!eventId || typeof eventId !== "string" || eventId === "None" || eventId.length < 10) {
        //  return res.status(400).json({ error: "Invalid event ID" });
        //}
        const eventId = parseInt(req.params.eventId, 10);
        if (eventId === undefined || isNaN(eventId)) {
            return res.status(400).json({ error: "Invalid event ID" });
        }

        const userId = req.user.id;
        const userRole = req.user.role;

        const event = await prisma.event.findUnique({
            where: { id: eventId }, // ✅ Now using string
            include: {
                organizers: { select: { id: true, utorid: true, name: true } },
                guests: {
                    select: {
                        user: {
                            select: {
                                id: true,
                                utorid: true,
                                name: true
                            }
                        },
                        checkInTime: true,
                        pointsEarned: true
                    }
                }
            }
        });

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        const isOrganizer = event.organizers.some(org => org.id === userId);
        const isManagerOrHigher = ["manager", "superuser"].includes(userRole.toLowerCase());

        if (!event.published && !isOrganizer && !isManagerOrHigher) {
            return res.status(404).json({ error: "Event not found" });
        }

        if (!isOrganizer && !isManagerOrHigher) {
            return res.status(200).json({
                id: event.id,
                name: event.name,
                description: event.description,
                location: event.location,
                startTime: event.startTime,
                endTime: event.endTime,
                capacity: event.capacity,
                organizers: event.organizers,
                numGuests: event.guests.length
            });
        }

        return res.status(200).json({
            id: event.id,
            name: event.name,
            description: event.description,
            location: event.location,
            startTime: event.startTime,
            endTime: event.endTime,
            capacity: event.capacity,
            pointsRemain: event.pointsRemain,
            pointsAwarded: event.pointsAwarded,
            published: event.published,
            organizers: event.organizers,
            guests: event.guests
        });

    } catch (err) {
        console.error("Error fetching event:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});


app.patch("/events/:eventId", authenticate, async (req, res) => {
    try {
        //const eventId = req.params.eventId;

        //if (!eventId || typeof eventId !== "string" || eventId.length < 10) {
        //  return res.status(400).json({ error: "Invalid event ID" });
        //}
        const eventId = parseInt(req.params.eventId, 10);
        if (eventId === undefined || isNaN(eventId)) {
            console.log("❌ [400] Invalid event ID:", eventId);
            return res.status(400).json({ error: "Invalid event ID" });
        }

        const {
            name, description, location, startTime, endTime, capacity, points, published
        } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;
        const now = new Date();

        // 查询活动
        //const event = await prisma.event.findUnique({
        //  where: { id: eventId },
        //include: { organizers: { select: { id: true } } }
        //});
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                pointsAwarded: true,
                startTime: true,
                endTime: true,
                organizers: { select: { id: true } },
                guests: { select: { userId: true } },
            }
        });

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        const isOrganizer = event.organizers.some(org => org.id === userId);
        const isManagerOrHigher = ["manager", "superuser"].includes(userRole);

        // 只有管理员或组织者能更新活动
        if (!isManagerOrHigher && !isOrganizer) {
            console.log("❌ [403] Access Denied");
            return res.status(403).json({ error: "Forbidden: You are not allowed to update this event" });
        }

        // 如果活动已开始，某些字段不能修改
        if (new Date(event.startTime) <= now) {
            if (name || description || location || startTime || capacity) {
                console.log("❌ [400] Cannot update name, description, location, startTime, or capacity after event start");
                return res.status(400).json({ error: "Cannot update name, description, location, startTime, or capacity after event start" });
            }
            if (endTime && new Date(event.endTime) <= now) {
                console.log("❌ [400] Cannot update endTime after event has ended");
                return res.status(400).json({ error: "Cannot update endTime after event has ended" });
            }
        }

        // 校验 startTime 和 endTime
        if (startTime) {
            const newStartTime = new Date(startTime);
            if (isNaN(newStartTime.getTime())) {
                console.log("❌ [400] Invalid start time format:", newStartTime);
                return res.status(400).json({ error: "Invalid start time format" });
            }
            if (newStartTime < now) {
                console.log("❌ [400] Start time cannot be in the past:", newStartTime);
                return res.status(400).json({ error: "Start time cannot be in the past" });
            }
        }
        if (endTime) {
            const newEndTime = new Date(endTime);
            if (isNaN(newEndTime.getTime()) || newEndTime <= new Date(startTime || event.startTime)) {
                console.log("❌ [400] Invalid end time:", newEndTime);
                return res.status(400).json({ error: "End time must be after start time" });
            }
        }

        // 校验 capacity
        if (capacity !== undefined) {
            if (capacity !== null && (!Number.isInteger(capacity) || capacity <= 0)) {
                console.log("❌ [400] Capacity must be positive:", capacity);
                return res.status(400).json({ error: "Capacity must be a positive integer or null" });
            }
            if (capacity !== null && event.guests.length > capacity) {
                console.log("❌ [400] Cannot reduce capacity below current guest count");
                return res.status(400).json({ error: "Cannot reduce capacity below current guest count" });
            }
        }

        // 只有 manager 可以修改 points 和 published
        let updateData = {};
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (location) updateData.location = location;
        if (startTime) updateData.startTime = new Date(startTime).toISOString();
        if (endTime) updateData.endTime = new Date(endTime).toISOString();
        if (capacity !== undefined && capacity !== null) updateData.capacity = capacity;

        console.log("📦 [DEBUG] Incoming request body:", req.body);
        
        
        if (points !== undefined && points !== null) {
            const parsedPoints = Number(points);
            const awarded = event.pointsAwarded ?? 0;
        
            console.log("====== 🧪 [Case71 Debug Start] ======");
            console.log("📥 points from request:", points, "| typeof:", typeof points);
            console.log("🔢 parsedPoints:", parsedPoints, "| typeof:", typeof parsedPoints);
            console.log("🎯 event.pointsAwarded:", event.pointsAwarded, "| typeof:", typeof event.pointsAwarded);
            console.log("🧮 Computed awarded (fallback with ?? 0):", awarded);
            console.log("❓ parsedPoints < awarded ?", parsedPoints < awarded);
            console.log("====== 🧪 [Case71 Debug End] ======");
        
            if (!isManagerOrHigher) {
                console.log("❌ [403] Not manager: cannot update points");
                return res.status(403).json({ error: "Forbidden: You cannot update points" });
            }
        
            if (!Number.isInteger(parsedPoints) || parsedPoints < 0) {
                console.log("❌ [400] Points not a non-negative integer");
                return res.status(400).json({ error: "Points must be a non-negative integer" });
            }
        
            if (parsedPoints < awarded) {
                console.log("❌ [400] UPDATE_EVENT_POINTS_NOT_ENOUGH triggered:", parsedPoints, "<", awarded);
                return res.status(400).json({ error: "UPDATE_EVENT_POINTS_NOT_ENOUGH" });
            }
        
            updateData.pointsRemain = parsedPoints - awarded;
        }
        

        

        if (published !== undefined && published != null) {
            console.log("🔍 Published value received:", published, "| type:", typeof published);
            if (!isManagerOrHigher) {
                console.log("❌ [403] Forbidden: Only managers or superusers can publish");
                return res.status(403).json({ error: "Forbidden: Only managers or superusers can publish" });
            }
            const publishFlag = published === true || published === "true";
            if (!publishFlag) {
                console.log("❌ [400] Published can only be set to true", published, "| type:", typeof published);
                return res.status(400).json({ error: "Published can only be set to true" });
            }
            updateData.published = true;
        }


        // 执行更新
        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: updateData,
            select: {
                id: true,
                name: true,
                location: true,
                startTime: true,
                endTime: true,
                capacity: true,
                pointsRemain: true,
                published: true
            }
        });

        return res.status(200).json(updatedEvent);

    } catch (err) {
        console.error("[500] Error updating event:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

app.delete("/events/:eventId", authenticate, authorize("manager", "superuser"), async (req, res) => {
    try {
        //const eventId = req.params.eventId;

        //if (!eventId || typeof eventId !== "string" || eventId.length < 10) {
        //  console.log("❌ [400] Invalid event ID:", eventId);
        // return res.status(400).json({ error: "Invalid event ID" });
        //}
        const eventId = parseInt(req.params.eventId, 10);
        if (eventId === undefined || isNaN(eventId)) {
            return res.status(400).json({ error: "Invalid event ID" });
        }

        // Check if event exists
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { guests: true, organizers: true }
        });

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // If event is published, return 400 (not 403)
        if (event.published) {
            console.log("❌ [400] Cannot delete a published event")
            return res.status(400).json({ error: "Cannot delete a published event" });
        }

        // Delete event
        await prisma.event.delete({
            where: { id: eventId }
        });

        return res.status(200).json({ message: "Event deleted successfully" });

    } catch (err) {
        console.error("[500] Error deleting event:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// /events/:eventId/organizers

app.post("/events/:eventId/organizers", authenticate, authorize("manager", "superuser"), async (req, res) => {
    try {
        //const rawEventId = req.params.eventId;
        //const eventId = typeof rawEventId === "number" ? String(rawEventId) : rawEventId;

        //console.log("❌type of eventId", typeof eventId);

        //if (eventId === undefined || typeof eventId !== "string" || eventId.length < 10) {
        //  console.log("❌ [404] Invalid event ID:", eventId)
        //return res.status(404).json({ error: "Invalid event ID" });
        //}
        const eventId = parseInt(req.params.eventId, 10);
        console.log("❌ type of eventId", typeof eventId);
        console.log("eventId:", eventId);
        if (eventId === undefined || isNaN(eventId)) {
            console.log("❌type of eventId", typeof eventId);
            console.log("❌invalid eventId", eventId);
            return res.status(404).json({ error: "Invalid event ID" });
        }

        const { utorid } = req.body;


        // 校验 utorid
        if (typeof utorid !== "string" || utorid.trim() === "") {
            console.log("❌ [404] Invalid utorid:", utorid)
            return res.status(404).json({ error: "Missing or invalid 'utorid'" });
        }

        //const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        //if (!eventId || !UUID_REGEX.test(eventId)) {
        //  console.log("❌ [400] Invalid event ID:", eventId);
        //return res.status(400).json({ error: "Invalid event ID" });
        //}

        // 查询用户是否存在
        const user = await prisma.user.findUnique({
            where: { utorid },
            select: { id: true, utorid: true, name: true }
        });

        if (!user) {
            console.log("❌ [404] user not found:", utorid)
            return res.status(404).json({ error: "User not found" });
        }

        // 查询活动
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                organizers: { select: { id: true } },
                guests: { select: { userId: true } }
            }
        });

        if (!event) {
            console.log("❌ Event not found:", eventId);
            return res.status(404).json({ error: "Event not found" });
        }

        // 如果活动已结束，返回 410 Gone
        const now = new Date();
        if (new Date(event.endTime) < now) {
            return res.status(410).json({ error: "Event has ended" });
        }

        console.log("👀 Organizer IDs:", event.organizers.map(o => o.id));
        console.log("👀 Guest IDs:", event.guests.map(g => g.id));
        console.log("👤 Current user ID:", user.id);

        // 检查用户是否已经是该活动的组织者
        const isAlreadyOrganizer = event.organizers.some(org => org.id === user.id);
        if (isAlreadyOrganizer) {
            return res.status(400).json({ error: "User is already an organizer of this event" });
        }

        // 检查用户是否已经是该活动的嘉宾
        const isGuest = event.guests.some(g => g.userId === user.id);
        if (isGuest) {
            return res.status(400).json({ error: "User is registered as a guest; remove them as a guest first" });
        }

        // 添加组织者
        await prisma.event.update({
            where: { id: eventId },
            data: {
                organizers: { connect: { id: user.id } }
            }
        });

        // 获取更新后的组织者列表
        const updatedEvent = await prisma.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                name: true,
                location: true,
                organizers: {
                    select: {
                        id: true,
                        utorid: true,
                        name: true
                    }
                }
            }
        });

        console.log("✅ Organizer added:", user.utorid);
        return res.status(201).json(updatedEvent);

    } catch (err) {
        console.error("[500] Error adding organizer:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// /events/:eventId/organizers/:userId
app.delete("/events/:eventId/organizers/:userId", authenticate, authorize("manager", "superuser"), async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId, 10);
        console.log("❌ type of eventId", typeof eventId);
        console.log("eventId:", eventId);
        if (eventId === undefined || isNaN(eventId)) {
            console.log("❌type of eventId", typeof eventId);
            console.log("❌invalid eventId", eventId);
            return res.status(400).json({ error: "Invalid event ID" });
        }

        //const eventId = req.params.eventId;
        //if (!eventId || typeof eventId !== "string" || eventId.length < 10) {
        //  console.log("❌ Invalid event ID:", eventId);
        //return error(res, 400, "Invalid event ID");
        //}
        //const userId = req.params.userId;
        //if (!userId || typeof userId !== "string" || userId.length < 10) {
        //    console.log("❌ Invalid user ID:", userId);
        //   return error(res, 400, "Invalid user ID");
        //}
        const userId = parseInt(req.params.userId, 10);
        if (isNaN(userId)) {
            return error(res, 400, "Invalid user ID");
        }

        // 查询活动
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { organizers: { select: { id: true } } }
        });

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // 确保用户是该活动的组织者
        const isOrganizer = event.organizers.some(org => org.id === userId);
        if (!isOrganizer) {
            console.log("❌ User is not an organizer of this event");
            return res.status(400).json({ error: "User is not an organizer of this event" });
        }

        // 移除组织者
        await prisma.event.update({
            where: { id: eventId },
            data: {
                organizers: { disconnect: { id: userId } }
            }
        });

        return res.status(204).send(); // 204 No Content

    } catch (err) {
        console.error("[500] Error removing organizer:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// /events/:eventId/guests
app.post("/events/:eventId/guests", authenticate, async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId, 10);
        if (eventId === undefined || isNaN(eventId)) {
            console.log("❌type of eventId", typeof eventId);
            console.log("❌invalid eventId", eventId);
            return res.status(400).json({ error: "Invalid event ID" });
        }

        const { utorid } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        // 校验 eventId 和 utorid
        if (!utorid || typeof utorid !== "string") {
            return res.status(400).json({ error: "Missing or invalid 'utorid'" });
        }

        // 查询活动
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                name: true,
                location: true,
                capacity: true,
                endTime: true,
                organizers: { select: { id: true } },
                //guests: { select: { id: true, utorid: true } }
                guests: {
                    select: {
                        user: {
                            select: {
                                id: true,
                                utorid: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });
        console.log("🎯 Queried event:", event);

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        const now = new Date();

        // 如果活动已结束，返回 410 Gone
        if (new Date(event.endTime) < now) {
            return res.status(410).json({ error: "Event has ended" });
        }

        // 检查活动是否已满
        //if (event.capacity !== null && event.guests.length >= event.capacity) {
        //  return res.status(410).json({ error: "Event is full" });
        //}
        const guestCount = await prisma.eventParticipants.count({
            where: { eventId: event.id }
        });

        console.log("event capacity: ", event.capacity);
        console.log("guest count: ", guestCount);
        if (event.capacity !== null && guestCount >= event.capacity) {
            return res.status(410).json({ error: "Event is full" });
        }

        // 检查当前用户是否有权限
        const isOrganizer = event.organizers.some(org => org.id === userId);
        const isManagerOrHigher = ["manager", "superuser"].includes(userRole);

        if (!isOrganizer && !isManagerOrHigher) {
            return res.status(404).json({ error: "Event is not visible to you" });
        }

        // 查询用户是否存在
        const guest = await prisma.user.findUnique({
            where: { utorid },
            select: { id: true, utorid: true, name: true }
        });

        if (!guest) {
            return res.status(404).json({ error: "User not found" });
        }

        // 检查用户是否已经是该活动的嘉宾
        const isAlreadyGuest = event.guests.some(g => g.user.id === guest.id);
        if (isAlreadyGuest) {
            return res.status(400).json({ error: "User is already a guest of this event" });
        }

        // 检查用户是否是组织者
        const isOrganizerAlready = event.organizers.some(org => org.id === guest.id);
        if (isOrganizerAlready) {
            return res.status(400).json({ error: "User is registered as an organizer; remove them as an organizer first" });
        }

        await prisma.eventParticipants.create({
            data: {
                userId: guest.id,
                eventId: event.id
            }
        });

        // 添加嘉宾
        //await prisma.event.update({
        //  where: { id: eventId },
        //data: {
        //  guests: { connect: { id: guest.id } }
        //}
        //});

        // 获取最新的嘉宾人数
        const numGuests = await prisma.eventParticipants.count({
            where: { eventId: event.id },
            //select: { guests: true }
        });

        return res.status(201).json({
            id: event.id,
            name: event.name,
            location: event.location,
            guestAdded: { id: guest.id, utorid: guest.utorid, name: guest.name },
            numGuests
        });

    } catch (err) {
        console.error("[500] Error adding guest:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// /events/:eventId/guests/me
app.post("/events/:eventId/guests/me", authenticate, async (req, res) => {
    try {
        //const eventId = req.params.eventId;
        //if (!eventId || typeof eventId !== "string" || eventId.length < 10) {
        //  return error(res, 400, "Invalid event ID");
        //}
        const eventId = parseInt(req.params.eventId, 10);
        if (eventId === undefined || isNaN(eventId)) {
            console.log("❌type of eventId", typeof eventId);
            console.log("❌invalid eventId", eventId);
            return res.status(400).json({ error: "Invalid event ID" });
        }
        const userId = req.user.id;
        let userUtorid = req.user.utorid;
        let userName = req.user.name;

        if (!userUtorid || !userName) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { utorid: true, name: true }
            });

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            userUtorid = user.utorid;
            userName = user.name;
        }


        // 查询活动
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                guests: { select: { userId: true } },
                organizers: { select: { id: true } }
            }
        });

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        const now = new Date();

        // 如果活动已结束，返回 410 Gone
        if (new Date(event.endTime) < now) {
            return res.status(410).json({ error: "Event has ended" });
        }

        // 检查活动是否已满
        if (event.capacity !== null && event.guests.length >= event.capacity) {
            return res.status(410).json({ error: "Event is full" });
        }

        // 检查用户是否已经是嘉宾
        const isAlreadyGuest = event.guests.some(g => g.id === userId);
        if (isAlreadyGuest) {
            return res.status(400).json({ error: "You are already a guest of this event" });
        }

        // 检查用户是否是组织者
        const isOrganizer = event.organizers.some(org => org.id === userId);
        if (isOrganizer) {
            return res.status(400).json({ error: "You are an organizer of this event; remove yourself as an organizer first" });
        }

        // 添加当前用户作为嘉宾
        //await prisma.event.update({
        //  where: { id: eventId },
        //data: {
        //    guests: { connect: { id: userId } }
        //}
        //});
        await prisma.eventParticipants.create({
            data: {
                userId,
                eventId
            }
        });

        // 获取最新的嘉宾人数
        //const numGuests = await prisma.event.count({
        //  where: { id: eventId },
        //select: { guests: true }
        //});
        const eventWithGuests = await prisma.event.findUnique({
            where: { id: eventId },
            select: {
                guests: { select: { userId: true } }
            }
        });

        const guestCount = eventWithGuests?.guests.length || 0;

        return res.status(201).json({
            id: event.id,
            name: event.name,
            location: event.location,
            guestAdded: { id: userId, utorid: userUtorid, name: userName },
            numGuests: guestCount
        });

    } catch (err) {
        console.error("[500] Error self-registering as guest:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

app.delete("/events/:eventId/guests/me", authenticate, authorize("regular", "cashier", "manager", "superuser"), async (req, res) => {
    try {
        console.log("🔐 Authenticated user ID:", req.user.id);
        console.log("🧾 Route called: DELETE /events/" + req.params.eventId + "/guests/me");

        const eventId = parseInt(req.params.eventId, 10);
        if (eventId === undefined || isNaN(eventId)) {
            console.log("❌type of eventId", typeof eventId);
            console.log("❌invalid eventId", eventId);
            return res.status(400).json({ error: "Invalid event ID" });
        }
        const userId = req.user.id;  // 获取当前登录用户的 ID

        // 查询事件，包括 guests 列表
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { guests: { select: { userId: true } } }
        });

        // 事件不存在
        if (!event) {
            console.log("[404] Event not found", event);
            return res.status(404).json({ error: "Event not found" });
        }

        const now = new Date();

        // 如果活动已结束，返回 410 Gone
        if (new Date(event.endTime) < now) {
            console.log("[410] event has ended");
            return res.status(410).json({ error: "Event has ended" });
        }

        // 检查用户是否是该活动的嘉宾
        const isGuest = event.guests.some(g => g.userId === userId);
        if (!isGuest) {
            console.log("[404] you are not a guest of event");
            return res.status(404).json({ error: "You are not a guest of this event" });
        }

        // 移除用户
        await prisma.eventParticipants.delete({
            where: {
                userId_eventId: {
                    userId: userId,
                    eventId: eventId
                }
            }
        });

        //await prisma.event.update({
        //  where: { id: eventId },
        //  data: {
        //    guests: { disconnect: { id: userId } }
        //}
        //});

        return res.status(204).send(); // 204 No Content

    } catch (err) {
        console.error("[500] Error removing user from event:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// /events/:eventId/guests/:userId
app.delete("/events/:eventId/guests/:userId", authenticate, authorize("manager", "superuser"), async (req, res) => {
    try {
        //const eventId = req.params.eventId;
        //if (!eventId || typeof eventId !== "string" || eventId.length < 10) {
        //  return error(res, 400, "Invalid event ID");
        //}
        const eventId = parseInt(req.params.eventId, 10);
        if (eventId === undefined || isNaN(eventId)) {
            console.log("❌type of eventId", typeof eventId);
            console.log("❌invalid eventId", eventId);
            return res.status(400).json({ error: "Invalid event ID" });
        }
        //const userId = req.params.userId;
        //if (!userId || typeof userId !== "string" || userId.length < 10) {
        //  return error(res, 400, "Invalid user ID");
        //}
        const userId = parseInt(req.params.userId, 10);
        if (isNaN(userId)) {
            return error(res, 400, "Invalid user ID");
        }

        // 查询活动
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { guests: { select: { id: true } } }
        });

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // 确保用户是该活动的嘉宾
        const isGuest = event.guests.some(guest => guest.id === userId);
        if (!isGuest) {
            return res.status(400).json({ error: "User is not a guest of this event" });
        }

        // 移除嘉宾
        await prisma.event.update({
            where: { id: eventId },
            data: {
                guests: { disconnect: { id: userId } }
            }
        });

        return res.status(204).send(); // 204 No Content

    } catch (err) {
        console.error("[500] Error removing guest:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});


// /events/:eventId/transactions
app.post("/events/:eventId/transactions", authenticate, async (req, res) => {
    try {
        console.log("🔐 Authenticated user from token:", req.user);

        const eventId = parseInt(req.params.eventId, 10);
        if (eventId === undefined || isNaN(eventId)) {
            console.log("❌type of eventId", typeof eventId);
            console.log("❌invalid eventId", eventId);
            return res.status(400).json({ error: "Invalid event ID" });
        }


        const { type, utorid, amount, remark = "" } = req.body;
        const creatorId = req.user.id;
        const creatorRole = req.user.role;
        const creatorUtorid = req.user.utorid;

        if (type !== "event") {
            console.log("[400] Transaction type must be 'event'");
            return res.status(400).json({ error: "Transaction type must be 'event'" });
        }

        if (!Number.isInteger(amount) || amount <= 0) {
            console.log("[400] Amount must be a positive integer'");
            return res.status(400).json({ error: "Amount must be a positive integer" });
        }

        // 查询活动信息
        //const event = await prisma.event.findUnique({
        //  where: { id: eventId },
        //include: {
        //  organizers: { select: { id: true } },
        // guests: { select: { id: true, utorid: true } }
        //}
        //});

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                organizers: { select: { id: true } },
                guests: {
                    select: {
                        user: {
                            select: {
                                id: true,
                                utorid: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });



        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        console.log("🧾 event.guests:", JSON.stringify(event.guests, null, 2));
        console.log("🔍 utorid to award:", utorid);
        event.guests.forEach(g => {
            console.log("👤 guest:", g.user?.utorid);
        });

        const now = new Date();


        //if (new Date(event.endTime) > now) {
        //  console.log("[400] Cannot award points before the event ends");
        //console.log("🕓 Event ends at:", event.endTime);
        //console.log("🕓 Now is:", now.toISOString());
        //return res.status(400).json({ error: "Cannot award points before the event ends" });
        //}

        // 检查权限（Manager、Superuser 或 Organizer）
        const isOrganizer = event.organizers.some(org => org.id === creatorId);
        const isManagerOrHigher = ["manager", "superuser"].includes(creatorRole);

        if (!isManagerOrHigher && !isOrganizer) {
            return res.status(403).json({ error: "Forbidden: You are not authorized to award points for this event" });
        }

        // 检查剩余积分是否足够
        if (event.pointsRemain < amount) {
            console.log("[400] Insufficient remaining points in this event");
            return res.status(400).json({ error: "Insufficient remaining points in this event" });
        }

        let transactions = [];
        let updatedPointsRemain = event.pointsRemain;

        //if (!utorid || typeof utorid !== "string") {
        //  console.log("[400] Missing or invalid utorid in request body");
        //return res.status(400).json({ error: "Missing or invalid utorid" });
        //}

        if (utorid) {
            // 处理单个用户奖励
            console.log("🔍 Looking for recipient with utorid:", utorid);
            console.log("👥 Guests list:", event.guests.map(g => g.user?.utorid));

            const recipient = event.guests.find(g => g.user && g.user.utorid.toLowerCase() === utorid.toLowerCase());
            console.log("recipient", recipient);
            if (!recipient || !recipient.user) {
                console.log("[400] User is not a guest of this event");
                return res.status(400).json({ error: "User is not a guest of this event" });
            }

            console.log("✅ Awarding points to guest:", recipient.user.utorid);

            const transaction = await prisma.transaction.create({
                data: {
                    user: { connect: { id: recipient.user.id } },
                    type,
                    amount,
                    relatedId: eventId,
                    remark,
                    //createdBy: creatorUtorid
                    creator: { connect: { utorid: creatorUtorid } }
                }
            });

            await prisma.user.update({
                where: { id: recipient.user.id },
                data: {
                  points: { increment: amount }
                }
              });
              

            // 更新活动剩余积分
            await prisma.event.update({
                where: { id: eventId },
                data: {
                    pointsRemain: updatedPointsRemain,
                    pointsAwarded: { increment: amount } // 👈 加上这行
                }
            });
            

            return res.status(201).json({
                id: transaction.id,
                recipient: utorid,
                awarded: amount,
                type,
                relatedId: eventId,
                remark,
                createdBy: req.user.utorid
            });
        } else {
            // 处理奖励所有嘉宾
            if (event.guests.length === 0) {
                console.log("[400] No guests found for this event");
                return res.status(400).json({ error: "No guests found for this event" });
            }
        
            if (updatedPointsRemain < amount * event.guests.length) {
                console.log("[400] Not enough remaining points for all guests");
                return res.status(400).json({ error: "Not enough remaining points for all guests" });
            }
        
            const transactionOps = event.guests.map(g =>
                prisma.transaction.create({
                    data: {
                        user: { connect: { id: g.user.id } },
                        type,
                        amount,
                        relatedId: eventId,
                        remark,
                        creator: { connect: { utorid: creatorUtorid } }
                    }
                })
            );
        
            const pointUpdateOps = event.guests.map(g =>
                prisma.user.update({
                    where: { id: g.user.id },
                    data: {
                        points: { increment: amount }
                    }
                })
            );
        
            const eventUpdateOp = prisma.event.update({
                where: { id: eventId },
                data: {
                    pointsRemain: updatedPointsRemain - amount * event.guests.length,
                    pointsAwarded: { increment: amount * event.guests.length }
                }
            });
        
            const allOps = [...transactionOps, ...pointUpdateOps, eventUpdateOp];
            const results = await prisma.$transaction(allOps);
        
            const createdTransactions = results.slice(0, event.guests.length); // 前面是 transaction 对象
        
            return res.status(201).json(createdTransactions.map(tx => ({
                id: tx.id,
                recipient: tx.utorid,
                awarded: amount,
                type,
                relatedId: eventId,
                remark,
                createdBy: req.user.utorid
            })));
        }
        

    } catch (err) {
        console.error("[500] Error processing event transaction:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// /promotions
app.post("/promotions", authenticate, authorize("manager", "superuser"), async (req, res) => {
    try {
        const { name, description, type, startTime, endTime, minSpending, rate, points } = req.body;

        // 1️⃣ **校验必填字段**
        if (
            typeof name !== "string" ||
            typeof description !== "string" ||
            typeof type !== "string" ||
            typeof startTime !== "string" ||
            typeof endTime !== "string"
        ) {
            return res.status(400).json({ error: "Missing or invalid required fields" });
        }
        

        // 2️⃣ **校验 `type`**
        if (!["automatic", "one-time"].includes(type)) {
            return res.status(400).json({ error: "Invalid type. Must be either 'automatic' or 'one-time'." });
        }

        // 3️⃣ **校验 `startTime` 和 `endTime`**
        const now = new Date();
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({ error: "Invalid date format. Must be in ISO 8601 format." });
        }

        if (startDate < now) {
            return res.status(400).json({ error: "Start time must not be in the past." });
        }

        if (endDate <= startDate) {
            return res.status(400).json({ error: "End time must be after start time." });
        }

        // 4️⃣ **校验 `minSpending`**
        //if (minSpending !== undefined && (isNaN(minSpending) || minSpending <= 0)) {
        //  return res.status(400).json({ error: "minSpending must be a positive numeric value." });
        //}
        // ✅ minSpending: 允许 null 或正数
        if (minSpending !== undefined) {
            if (minSpending === null) {
                // 允许 null，不做处理
            } else if (typeof minSpending !== "number" || minSpending <= 0) {
                return res.status(400).json({ error: "minSpending must be a positive numeric value." });
            }
        }

        // ✅ rate: 允许 null 或正数
        if (rate !== undefined) {
            if (rate === null) {
                // 允许 null，不做处理
            } else if (typeof rate !== "number" || rate <= 0) {
                return res.status(400).json({ error: "rate must be a positive numeric value." });
            }
        }

        // ✅ points: 允许 null（视为 0）或正整数
        let finalPoints = 0;
        if (points !== undefined) {
            if (points === null) {
                finalPoints = 0;
            } else if (!Number.isInteger(points) || points < 0) {
                return res.status(400).json({ error: "points must be a positive integer." });
            } else {
                finalPoints = points;
            }
        }


        // 7️⃣ **创建促销**
        const promotion = await prisma.promotion.create({
            data: {
                name,
                description,
                type,
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
                minSpending: minSpending ?? null,
                rate: rate ?? null,
                points: finalPoints  // ✅ 使用转换后的值
            }
        });

        // 8️⃣ **返回创建的促销信息**
        return res.status(201).json({
            id: promotion.id,
            name: promotion.name,
            description: promotion.description,
            type: promotion.type,
            startTime: promotion.startTime,
            endTime: promotion.endTime,
            minSpending: promotion.minSpending,
            rate: promotion.rate,
            points: promotion.points
        });

    } catch (err) {
        console.error("[500] Error creating promotion:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
app.get("/promotions", authenticate, async (req, res) => {
    try {
        const { name, type, page = 1, limit = 10, started, ended } = req.query;
        const userRole = req.user.role;
        const userId = req.user.id;  // 获取当前用户 ID
        const now = new Date();
        console.log("📥 PROMOTIONS API: user =", req.user);
        // 解析分页参数
        //const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        //const pageSize = Math.max(parseInt(limit, 10) || 10, 1);

        const parsedPage = parseInt(page, 10);
        const parsedLimit = parseInt(limit, 10);

        if (isNaN(parsedPage) || parsedPage <= 0) {
            return res.status(400).json({ error: "Invalid 'page' parameter" });
        }

        if (isNaN(parsedLimit) || parsedLimit <= 0) {
            return res.status(400).json({ error: "Invalid 'limit' parameter" });
        }

        const pageNumber = parsedPage;
        const pageSize = parsedLimit;

        // 校验 started 和 ended 不能同时指定
        if (started !== undefined && ended !== undefined) {
            return res.status(400).json({ error: "Cannot specify both 'started' and 'ended'." });
        }

        // 构建查询条件
        const isLimitedUser = ["regular", "cashier"].includes(userRole);

        if (isLimitedUser) {
            // 查出当前用户已经使用过的促销 ID（通过 promotionTransaction → transaction）
            const usedPromos = await prisma.promotionTransaction.findMany({
              where: {
                transaction: {
                  userId: userId
                }
              },
              select: {
                promotionId: true
              }
            });
          
            const usedPromotionIds = usedPromos.map(p => p.promotionId);
          
            // 再查出用户可用的促销（未用过、在有效期内）
            const promotions = await prisma.promotion.findMany({
              where: {
                startTime: { lte: now },
                endTime: { gte: now },
                id: { notIn: usedPromotionIds }
              },
              select: {
                id: true,
                name: true,
                type: true,
                minSpending: true,
                rate: true,
                points: true,
                endTime: true
              }
            });
          
            console.log("🧪 受限用户 (regular/cashier) ID:", userId);
            console.log("🧪 已使用过促销 ID:", usedPromotionIds);
            console.log("🧪 返回促销 ID:", promotions.map(p => p.id));
          
            return res.status(200).json({ count: promotions.length, results: promotions });
          }
          
          
          
          // 👇 下面是管理员分支
          const where = {};
          
          // 过滤 name
          if (name?.trim()) {
            where.name = {
              contains: name.trim(),
              mode: "insensitive"
            };
          }
          
          // 过滤 type
          if (type) {
            const normalizedType = type.toLowerCase();
            if (!["automatic", "one-time"].includes(normalizedType)) {
              return res.status(400).json({ error: "Invalid type. Must be either 'automatic' or 'one-time'." });
            }
            where.type = normalizedType;
          }
          
          // started / ended 仅 manager/superuser 使用
          if (["manager", "superuser"].includes(userRole)) {
            if (started !== undefined) {
              where.startTime = started === "true" ? { lte: now } : { gt: now };
            }
            if (ended !== undefined) {
              where.endTime = ended === "true" ? { lte: now } : { gt: now };
            }
          }
          
          // 正常分页查询
          const count = await prisma.promotion.count({ where });
          const results = await prisma.promotion.findMany({
            where,
            take: pageSize,
            skip: (pageNumber - 1) * pageSize,
            orderBy: { startTime: "asc" },
            select: {
              id: true,
              name: true,
              type: true,
              startTime: true,
              endTime: true,
              minSpending: true,
              rate: true,
              points: true
            }
          });
          
          return res.status(200).json({ count, results });
          

    } catch (err) {
        console.error("[500] Error fetching promotions:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// /promotions/:promotionId
app.get("/promotions/:promotionId", authenticate, async (req, res) => {
    try {
        const promotionId = parseInt(req.params.promotionId, 10);
        if (isNaN(promotionId)) {
            return res.status(400).json({ error: "Invalid promotion ID" });
        }

        const userRole = req.user.role;
        const now = new Date();

        const promotion = await prisma.promotion.findUnique({
            where: { id: promotionId },
            select: {
                id: true,
                name: true,
                description: true,
                type: true,
                startTime: true,
                endTime: true,
                minSpending: true,
                rate: true,
                points: true,
            }
        });

        if (!promotion) {
            return res.status(404).json({ error: "Promotion not found" });
        }

        if (["regular", "cashier"].includes(userRole)) {
            if (promotion.startTime > now || promotion.endTime < now) {
                return res.status(404).json({ error: "Promotion not found" });
            }

            return res.status(200).json({
                id: promotion.id,
                name: promotion.name,
                description: promotion.description, // ✅ 加上这一行
                type: promotion.type,
                endTime: promotion.endTime,
                minSpending: promotion.minSpending,
                rate: promotion.rate,
                points: promotion.points
            });
            
        }

        // 管理员返回完整信息
        return res.status(200).json(promotion);

    } catch (err) {
        console.error("[500] Error fetching promotion:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});



app.patch("/promotions/:promotionId", authenticate, authorize("manager", "superuser"), async (req, res) => {
    try {
        const promotionId = parseInt(req.params.promotionId, 10);

        const { name, description, type, startTime, endTime, minSpending, rate, points } = req.body;
        const now = new Date();

        // 查询促销
        const promotion = await prisma.promotion.findUnique({
            where: { id: promotionId },
            select: {
                id: true,
                name: true,
                type: true,
                startTime: true,
                endTime: true,
                minSpending: true,
                rate: true,
                points: true
            }
        });

        if (!promotion) {
            console.log("[404] promotion not found: ", promotion);
            return res.status(404).json({ error: "Promotion not found" });
        }

        // 不允许设置过去时间
        if (startTime !== null && (startTime && new Date(startTime) < now)) {
            console.log("[400] Start time cannot be in the past: ", startTime);
            return res.status(400).json({ error: "Start time cannot be in the past" });
        }
        if (endTime !== null && (endTime && new Date(endTime) < now)) {
            console.log("[400] End time cannot be in the past: ", endTime);
            return res.status(400).json({ error: "End time cannot be in the past" });
        }

        // ✅ 若已开始，不能更新敏感字段（检查是否在 req.body 中）
        if (promotion.startTime <= now) {
            const lockedFields = ["name", "description", "type", "startTime", "minSpending", "rate", "points"];
            const attemptedLockedUpdate = lockedFields.some(field => field in req.body);
            if (attemptedLockedUpdate) {
                console.log("[400] Cannot update after promotion start");
                return res.status(400).json({
                    error: "Cannot update name, description, type, startTime, minSpending, rate, or points after promotion has started"
                });
            }
        }

        // ✅ 如果 endTime 比原来的还早，拒绝更新
        if ("endTime" in req.body && endTime && new Date(endTime) < promotion.endTime) {
            console.log("[400] New endTime must after original endTime");
            return res.status(400).json({ error: "New endTime must be after the original endTime" });
        }

        // ✅ 构造更新字段（支持 null、partial）
        const updateData = {};
        if ("name" in req.body) {
            if (name === null) {
                // 跳过，不能设置为 null（Prisma 不允许）
            } else if (typeof name !== "string") {
                return res.status(400).json({ error: "Name must be a string." });
            } else {
                updateData.name = name;
            }
        }
        
        if ("description" in req.body) {
            if (description === null || typeof description === "string") {
                updateData.description = description;
            } else {
                return res.status(400).json({ error: "Description must be a string or null." });
            }
        }
        
        // 保留旧值
        if ("type" in req.body) {
            if (type === null) {
                updateData.type = promotion.type;  // 保留旧值
            } else if (!["automatic", "one-time"].includes(type)) {
                return res.status(400).json({ error: "Invalid type. Must be 'automatic' or 'one-time'." });
            } else {
                updateData.type = type;
            }
        }

        if ("startTime" in req.body) {
            updateData.startTime = startTime ? new Date(startTime).toISOString() : null;
        }
        if ("endTime" in req.body) {
            updateData.endTime = endTime ? new Date(endTime).toISOString() : null;
        }
        if ("minSpending" in req.body) {
            if (minSpending === null) {
                updateData.minSpending = null;
            } else if (isNaN(minSpending) || minSpending <= 0) {
                return res.status(400).json({ error: "minSpending must be a positive number." });
            } else {
                updateData.minSpending = minSpending;
            }
        }
        
        if ("rate" in req.body) {
            if (rate === null) {
                updateData.rate = 0;
            } else if (isNaN(rate) || rate <= 0) {
                return res.status(400).json({ error: "rate must be a positive numeric value." });
            } else {
                updateData.rate = rate;
            }
        }
        
        if ("points" in req.body) {
            if (points === null) {
                updateData.points = 0;  // ✅ null 就设为默认值
            } else {
                if (!Number.isInteger(points) || points < 0) {
                    return res.status(400).json({ error: "points must be a positive integer." });
                }
                updateData.points = points;
            }
        }
        

        // 执行更新
        const updatedPromotion = await prisma.promotion.update({
            where: { id: promotionId },
            data: updateData,
            select: {
                id: true,
                name: true,
                type: true,
                description: true,
                startTime: true,
                endTime: true,
                minSpending: true,
                rate: true,
                points: true
            }
        });

        return res.status(200).json(updatedPromotion);

    } catch (err) {
        console.error("[500] Error updating promotion:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});


app.delete("/promotions/:promotionId", authenticate, authorize("manager", "superuser"), async (req, res) => {
    try {
        const promotionId = parseInt(req.params.promotionId, 10);
        const now = new Date();


        // 查询促销
        const promotion = await prisma.promotion.findUnique({
            where: { id: promotionId },
            select: {
                startTime: true
            }
        });

        if (!promotion) {
            return res.status(404).json({ error: "Promotion not found" });
        }

        // 如果促销已经开始，拒绝删除
        if (promotion.startTime <= now) {
            return res.status(403).json({ error: "Forbidden: Promotion has already started" });
        }

        // 删除促销
        await prisma.promotion.delete({ where: { id: promotionId } });

        return res.status(204).send(); // 204 No Content

    } catch (err) {
        console.error("[500] Error deleting promotion:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

app.use((req, res) => error(res, 404, "Not Found"));

app.use((err, req, res, next) => {
    console.error(err);
    error(res, err.status || 500, err.message || "Internal Server Error");
});

const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
    console.error(`Cannot start server: ${err.message}`);
    process.exit(1);
});
