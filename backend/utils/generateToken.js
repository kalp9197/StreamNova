import jwt from "jsonwebtoken";
import { ENV_VARS } from "../config/envVars.js";

export const generateTokenAndSetCookie = (userId, res) => {
	const token = jwt.sign({ userId }, ENV_VARS.JWT_SECRET, { expiresIn: "15d" });

	res.cookie("jwt-netflix", token, {
<<<<<<< HEAD
		maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days in MS
		httpOnly: true, // prevent XSS attacks cross-site scripting attacks, make it not be accessed by JS
		sameSite: "strict", // CSRF attacks cross-site request forgery attacks
=======
		maxAge: 15 * 24 * 60 * 60 * 1000, 
		httpOnly: true,
		sameSite: "strict", 
>>>>>>> 5ce791b (finalizing project and ready for deployment)
		secure: ENV_VARS.NODE_ENV !== "development",
	});

	return token;
};
