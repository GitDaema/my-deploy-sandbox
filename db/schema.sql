-- Database schema setup for sandbox_db

CREATE DATABASE IF NOT EXISTS sandbox_db;
USE sandbox_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  professor VARCHAR(100),
  credits INT NOT NULL
);

-- User-Item relation table
CREATE TABLE IF NOT EXISTS user_items (
  student_id VARCHAR(50),
  course_id VARCHAR(50),
  PRIMARY KEY (student_id, course_id),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Records table
CREATE TABLE IF NOT EXISTS records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(50),
  course_id VARCHAR(50),
  grade VARCHAR(10) NOT NULL,
  score DECIMAL(3, 2),
  semester VARCHAR(20),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES items(id) ON DELETE CASCADE
);
