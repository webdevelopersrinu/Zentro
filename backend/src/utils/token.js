import jwt from "jsonwebtoken";

// Creates a login token holding the user's id + username.
export function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Verifies a token and returns its payload, or throws if invalid/expired.
export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
