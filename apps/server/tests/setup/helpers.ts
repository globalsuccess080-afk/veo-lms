import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../../src/modules/user/user.model';
import { Course } from '../../src/modules/course/course.model';
import app from '../../src/app';
import request from 'supertest';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

export const generateToken = (userId: string, role: string) => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '1h' });
};

export const createStudent = async (email = 'student@test.com', password = 'password123') => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: 'Test Student',
    email,
    password: hashedPassword,
    role: 'student',
  });
  return user;
};

export const createAdmin = async (email = 'admin@test.com', password = 'password123') => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: 'Test Admin',
    email,
    password: hashedPassword,
    role: 'admin',
  });
  return user;
};

export const login = async (email = 'student@test.com', password = 'password123', isAdmin = false) => {
  const endpoint = isAdmin ? '/api/auth/admin/login' : '/api/auth/login';
  const response = await request(app)
    .post(endpoint)
    .send({ email, password });
  
  return {
    token: response.body.data?.accessToken || response.body.accessToken,
    user: response.body.data?.user || response.body.user,
    cookie: response.headers['set-cookie']
  };
};

export const createCourse = async (adminId: string, overrides = {}) => {
  const course = await Course.create({
    title: 'Test Course',
    slug: `test-course-${Date.now()}`,
    description: 'This is a test course',
    shortDescription: 'Short test course description',
    price: 100,
    category: 'Development',
    instructor: { name: 'Admin Instructor' },
    isPublished: true,
    thumbnail: 'test-thumbnail.jpg',
    ...overrides
  });
  return course;
};
