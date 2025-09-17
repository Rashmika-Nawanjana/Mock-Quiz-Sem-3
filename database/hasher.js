import bcrypt from 'bcrypt';
import { pathToFileURL } from 'url';

// Hash a password
export async function hashPassword(plainPassword) {
    const saltRounds = 12;
    return bcrypt.hash(plainPassword, saltRounds);
}

// Verify a password
export async function verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
}

