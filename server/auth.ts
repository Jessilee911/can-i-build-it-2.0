import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import { storage } from "./storage";

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Email service setup
let emailTransporter: nodemailer.Transporter | null = null;

function getEmailTransporter() {
  if (!emailTransporter) {
    // Check for email configuration
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      console.warn("Email configuration not found. Please set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables for email functionality.");
    }
  }
  return emailTransporter;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function registerUser(data: RegisterData): Promise<{ success: boolean; message: string; user?: any }> {
  try {
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(data.email);
    if (existingUser) {
      return { success: false, message: "An account with this email already exists" };
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);
    
    // Generate verification token
    const emailVerificationToken = uuidv4();

    // Create user
    const userId = uuidv4();
    const user = await storage.upsertUser({
      id: userId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      passwordHash,
      emailVerificationToken,
      authProvider: "email",
      emailVerified: false,
    });

    // Send verification email
    await sendVerificationEmail(data.email, data.firstName, emailVerificationToken);

    return { 
      success: true, 
      message: "Account created successfully. Please check your email to verify your account.",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified
      }
    };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, message: "Failed to create account. Please try again." };
  }
}

export async function loginUser(data: LoginData): Promise<{ success: boolean; message: string; user?: any }> {
  try {
    // Find user by email
    const user = await storage.getUserByEmail(data.email);
    if (!user) {
      return { success: false, message: "Invalid email or password" };
    }

    // Check if user has a password (email auth)
    if (!user.passwordHash) {
      return { success: false, message: "Please use the social login method you originally signed up with" };
    }

    // Verify password
    const isValidPassword = await verifyPassword(data.password, user.passwordHash);
    if (!isValidPassword) {
      return { success: false, message: "Invalid email or password" };
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return { success: false, message: "Please verify your email address before logging in" };
    }

    // Check if account is active
    if (!user.isActive) {
      return { success: false, message: "Your account has been deactivated. Please contact support." };
    }

    // Update last login
    await storage.updateUser(user.id, { lastLoginAt: new Date() });

    return {
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
        profileImageUrl: user.profileImageUrl
      }
    };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "Login failed. Please try again." };
  }
}

export async function verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
  try {
    const user = await storage.getUserByVerificationToken(token);
    if (!user) {
      return { success: false, message: "Invalid or expired verification token" };
    }

    await storage.updateUser(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
    });

    return { success: true, message: "Email verified successfully. You can now log in." };
  } catch (error) {
    console.error("Email verification error:", error);
    return { success: false, message: "Email verification failed. Please try again." };
  }
}

export async function sendVerificationEmail(email: string, firstName: string, token: string): Promise<void> {
  const transporter = getEmailTransporter();
  if (!transporter) {
    console.warn("Email transporter not configured. Verification email not sent.");
    return;
  }

  const baseUrl = process.env.BASE_URL || `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}`;
  const verificationUrl = `https://${baseUrl}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Verify your Can I Build It? account",
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb;">Can I Build It?</h1>
        </div>
        
        <h2>Welcome ${firstName}!</h2>
        
        <p>Thank you for creating an account with Can I Build It? To complete your registration and start accessing your personalized chat history, please verify your email address.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <p style="color: #6b7280; font-size: 14px;">
          If you didn't create this account, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const user = await storage.getUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return { success: true, message: "If an account with this email exists, a password reset link has been sent." };
    }

    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await storage.updateUser(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    await sendPasswordResetEmail(user.email, user.firstName || "", resetToken);

    return { success: true, message: "If an account with this email exists, a password reset link has been sent." };
  } catch (error) {
    console.error("Password reset request error:", error);
    return { success: false, message: "Failed to process password reset request. Please try again." };
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  try {
    const user = await storage.getUserByResetToken(token);
    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      return { success: false, message: "Invalid or expired reset token" };
    }

    const passwordHash = await hashPassword(newPassword);

    await storage.updateUser(user.id, {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    return { success: true, message: "Password reset successfully. You can now log in with your new password." };
  } catch (error) {
    console.error("Password reset error:", error);
    return { success: false, message: "Password reset failed. Please try again." };
  }
}

async function sendPasswordResetEmail(email: string, firstName: string, token: string): Promise<void> {
  const transporter = getEmailTransporter();
  if (!transporter) {
    console.warn("Email transporter not configured. Password reset email not sent.");
    return;
  }

  const baseUrl = process.env.BASE_URL || `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}`;
  const resetUrl = `https://${baseUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Reset your Can I Build It? password",
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb;">Can I Build It?</h1>
        </div>
        
        <h2>Password Reset Request</h2>
        
        <p>Hi ${firstName},</p>
        
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #dc2626;">${resetUrl}</p>
        
        <p>This link will expire in 1 hour for security reasons.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <p style="color: #6b7280; font-size: 14px;">
          If you didn't request this password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
}