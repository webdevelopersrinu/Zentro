import mongoose from "mongoose";

/**
 * One row per refresh token ever issued.
 *
 * We store only a SHA-256 hash: a dump of this collection must not let anyone
 * authenticate, exactly as with password hashes.
 *
 * A `family` is the chain of tokens descended from a single login. Rotating
 * issues a child in the same family; replaying a token already marked `used`
 * means the chain leaked, so the whole family is deleted.
 *
 * Rotated tokens are KEPT (used: true) rather than deleted — that is what makes
 * reuse detection possible. The TTL index reaps them once they expire.
 */
const refreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    family: { type: String, required: true, index: true },
    used: { type: Boolean, default: false },

    // MongoDB deletes the document once this timestamp passes.
    expiresAt: { type: Date, required: true },

    // Audit trail — what a "your active devices" screen would render.
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

// TTL index: expireAfterSeconds 0 means "delete when expiresAt is in the past".
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
