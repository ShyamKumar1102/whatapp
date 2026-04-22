import jwt      from 'jsonwebtoken';
import bcrypt    from 'bcryptjs';
import { TABLES, dbPut, dbScan, generateId } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';
const JWT_EXPIRE = process.env.JWT_EXPIRE  || '7d';

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role, business_id: user.business_id }, JWT_SECRET, { expiresIn: JWT_EXPIRE });

export const register = async (req, res) => {
  try {
    const { name, email, password, role = 'agent', business_id = 'prasham' } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });

    const existing = await dbScan(TABLES.USERS, u => u.email === email);
    if (existing.length)
      return res.status(409).json({ success: false, message: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 10);
    const user = { id: generateId(), name, email, password_hash, role, business_id, is_active: true, created_at: new Date().toISOString() };
    await dbPut(TABLES.USERS, user);

    const token = signToken(user);
    const { password_hash: _, ...safeUser } = user;
    res.status(201).json({ success: true, token, user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });

    const users = await dbScan(TABLES.USERS, u => u.email === email);
    const user  = users[0];
    if (!user || !user.is_active)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = signToken(user);
    const { password_hash: _, ...safeUser } = user;
    res.json({ success: true, token, user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMe = (req, res) => {
  const { password_hash: _, ...safeUser } = req.user;
  res.json({ success: true, user: safeUser });
};

export const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
    const users   = await dbScan(TABLES.USERS, u => u.id === decoded.id);
    const user    = users[0];
    if (!user || !user.is_active)
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    req.user = user;
    req.business_id = user.business_id || 'prasham';
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Admin access required' });
  next();
};
