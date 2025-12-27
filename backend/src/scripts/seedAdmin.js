import mongoose from "mongoose";
import SystemSetting from "../models/SystemSetting.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const seedAdminData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to database");

    // Create default admin user if not exists
    const adminEmail = process.env.ADMIN_EMAIL || "admin@zashly.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";
    
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const admin = new User({
        fullName: "System Administrator",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        isOnboarded: true,
      });
      await admin.save();
      console.log("Default admin user created");
    }

    // Create default system settings
    const defaultSettings = [
      {
        key: "system_status",
        value: "healthy",
        description: "Overall system health status",
        category: "GENERAL",
        type: "STRING",
        isPublic: true
      },
      {
        key: "maintenance_mode",
        value: false,
        description: "Enable maintenance mode",
        category: "GENERAL",
        type: "BOOLEAN",
        isPublic: true
      },
      {
        key: "max_upload_size",
        value: 10,
        description: "Maximum file upload size in MB",
        category: "LIMITS",
        type: "NUMBER",
        isPublic: false
      },
      {
        key: "enable_registration",
        value: true,
        description: "Allow new user registration",
        category: "FEATURES",
        type: "BOOLEAN",
        isPublic: true
      },
      {
        key: "enable_moments",
        value: true,
        description: "Enable moments feature",
        category: "FEATURES",
        type: "BOOLEAN",
        isPublic: true
      },
      {
        key: "enable_chat",
        value: true,
        description: "Enable chat feature",
        category: "FEATURES",
        type: "BOOLEAN",
        isPublic: true
      },
      {
        key: "session_timeout",
        value: 24,
        description: "User session timeout in hours",
        category: "SECURITY",
        type: "NUMBER",
        isPublic: false
      },
      {
        key: "max_login_attempts",
        value: 5,
        description: "Maximum failed login attempts before lockout",
        category: "SECURITY",
        type: "NUMBER",
        isPublic: false
      },
      {
        key: "content_moderation",
        value: true,
        description: "Enable content moderation",
        category: "CONTENT",
        type: "BOOLEAN",
        isPublic: false
      },
      {
        key: "auto_approve_content",
        value: false,
        description: "Auto-approve new content",
        category: "CONTENT",
        type: "BOOLEAN",
        isPublic: false
      }
    ];

    for (const setting of defaultSettings) {
      const existingSetting = await SystemSetting.findOne({ key: setting.key });
      if (!existingSetting) {
        await SystemSetting.create(setting);
      }
    }

    console.log("System settings seeded successfully");
    console.log(`Default admin credentials:`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    
  } catch (error) {
    console.error("Error seeding admin data:", error);
  } finally {
    await mongoose.disconnect();
  }
};

seedAdminData();
