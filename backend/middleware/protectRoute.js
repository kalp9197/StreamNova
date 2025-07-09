import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase.js";
import { ENV_VARS } from "../config/envVars.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies["jwt-netflix"];

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - No Token Provided" });
    }

    const decoded = jwt.verify(token, ENV_VARS.JWT_SECRET);

    if (!decoded) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - Invalid Token" });
    }

    // Get user from Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(decoded.userId);

    if (authError || !authData.user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
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

    req.user = {
      id: authData.user.id,
      email: authData.user.email,
      username: profile.username,
      image: profile.avatar_url,
      display_name: profile.display_name,
    };

    next();
  } catch (error) {
    console.log("Error in protectRoute middleware: ", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};