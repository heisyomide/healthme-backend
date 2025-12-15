const User = require('../models/User');
const Patient = require('../models/Patient');
const Practitioner = require('../models/Practitioner');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');

exports.registerUser = async (payload) => {
  const { fullName, email, password, role } = payload;

  if (await User.findOne({ email })) {
    throw new Error('Email already exists');
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    fullName,
    email,
    password: hashed,
    role
  });

  return user;
};

exports.loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    throw new Error('Invalid credentials');
  }

  const token = generateToken({
    id: user._id,
    role: user.role
  });

  return { user, token };
};