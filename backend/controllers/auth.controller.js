import { supabase } from "../config/supabase.js";
import bcryptjs from "bcryptjs";
import { generateTokenAndSetCookie } from "../utils/generateToken.js";

export async function signup(req, res) {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Password must be at least 6 characters",
        });
    }

    // Use Supabase Auth for user creation
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return res
          .status(400)
          .json({ success: false, message: "Email already exists" });
      }
      return res
        .status(400)
        .json({ success: false, message: authError.message });
    }

    if (!authData.user) {
      return res
        .status(400)
        .json({ success: false, message: "Failed to create user" });
    }

    // Check if username already exists in profiles table
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (existingProfile) {
      // If username exists, we need to delete the auth user we just created
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res
        .status(400)
        .json({ success: false, message: "Username already exists" });
    }

    const PROFILE_PICS = ["/avatar1.png", "/avatar2.png", "/avatar3.png"];
    const image = PROFILE_PICS[Math.floor(Math.random() * PROFILE_PICS.length)];

    // Create profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username,
        avatar_url: image,
        display_name: username,
      });

    if (profileError) {
      // If profile creation fails, delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res
        .status(500)
        .json({ success: false, message: "Failed to create user profile" });
    }

    // Create user metrics record
    await supabase
      .from('user_metrics')
      .insert({
        user_id: authData.user.id,
      });

    // Create notification preferences record
    await supabase
      .from('notification_preferences')
      .insert({
        user_id: authData.user.id,
      });

    generateTokenAndSetCookie(authData.user.id, res);

    res.status(201).json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username,
        image,
      },
    });
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // Use Supabase Auth for login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (!authData.user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, avatar_url, display_name')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      return res
        .status(404)
        .json({ success: false, message: "User profile not found" });
    }

    generateTokenAndSetCookie(authData.user.id, res);

    res.status(200).json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username: profile.username,
        image: profile.avatar_url,
        display_name: profile.display_name,
      },
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function logout(req, res) {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    res.clearCookie("jwt-netflix");
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function authCheck(req, res) {
  try {
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    console.log("Error in authCheck controller", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}