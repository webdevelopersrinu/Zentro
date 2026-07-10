/**
 * Unit tests touch no infrastructure. They only need the few env vars that
 * modules read at import time.
 */
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "unit_test_secret";
process.env.SESSION_SECRET = "unit_test_session_secret";
