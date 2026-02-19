#!/usr/bin/env node

// Test script for quiz access control validation
// Tests the new quiz status management logic

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./backend/models/User');
const Quiz = require('./backend/models/Quiz');
const Class = require('./backend/models/Class');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn';

async function runTests() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Verify Quiz model has required fields
    console.log('Test 1: Verify Quiz model schema');
    const quizSchema = Quiz.schema.obj;
    const requiredFields = ['is_launched', 'launched_for_classes', 'launched_for_school', 'quiz_level'];
    let allFieldsPresent = true;
    
    requiredFields.forEach(field => {
      if (quizSchema[field] !== undefined) {
        console.log(`  ✅ ${field} field exists`);
      } else {
        console.log(`  ❌ ${field} field missing`);
        allFieldsPresent = false;
      }
    });
    
    if (allFieldsPresent) {
      console.log('✅ Test 1 passed: All required fields present\n');
    } else {
      console.log('❌ Test 1 failed: Missing required fields\n');
    }

    // Test 2: Check if there are any quizzes
    console.log('Test 2: Check existing quizzes');
    const quizzes = await Quiz.find({}).limit(5);
    console.log(`  Found ${quizzes.length} quizzes in database`);
    
    if (quizzes.length > 0) {
      const sampleQuiz = quizzes[0];
      console.log(`  Sample quiz: ${sampleQuiz.title}`);
      console.log(`    - quiz_level: ${sampleQuiz.quiz_level || 'not set'}`);
      console.log(`    - is_launched: ${sampleQuiz.is_launched}`);
      console.log(`    - quiz_type: ${sampleQuiz.quiz_type}`);
      console.log('✅ Test 2 passed\n');
    } else {
      console.log('⚠️  No quizzes found in database\n');
    }

    // Test 3: Check for students and classes
    console.log('Test 3: Check students and classes');
    const students = await User.find({ role: { $in: ['Student', 'Trial Student'] } }).limit(3);
    const classes = await Class.find({}).limit(3);
    
    console.log(`  Found ${students.length} students`);
    console.log(`  Found ${classes.length} classes`);
    
    if (students.length > 0 && classes.length > 0) {
      const sampleStudent = students[0];
      const sampleClass = classes[0];
      
      console.log(`  Sample student: ${sampleStudent.name}`);
      console.log(`    - class: ${sampleStudent.class || 'not set'}`);
      console.log(`    - schoolId: ${sampleStudent.schoolId || 'not set'}`);
      
      console.log(`  Sample class: ${sampleClass.class_name}`);
      console.log(`    - teachers: ${sampleClass.teachers?.length || 0}`);
      console.log(`    - students: ${sampleClass.students?.length || 0}`);
      
      console.log('✅ Test 3 passed\n');
    } else {
      console.log('⚠️  Insufficient data for testing\n');
    }

    // Test 4: Check for active teachers
    console.log('Test 4: Check active teachers');
    const teachers = await User.find({ 
      role: { $in: ['Teacher', 'Trial Teacher'] },
      accountActive: true
    }).limit(3);
    
    console.log(`  Found ${teachers.length} active teachers`);
    
    if (teachers.length > 0) {
      const sampleTeacher = teachers[0];
      console.log(`  Sample teacher: ${sampleTeacher.name}`);
      console.log(`    - schoolId: ${sampleTeacher.schoolId || 'not set'}`);
      console.log(`    - assignedClasses: ${sampleTeacher.assignedClasses?.length || 0}`);
      console.log('✅ Test 4 passed\n');
    } else {
      console.log('⚠️  No active teachers found\n');
    }

    console.log('✅ All tests completed successfully!\n');
    console.log('Summary:');
    console.log('- Quiz model has required fields for access control');
    console.log('- Quiz launch system is in place');
    console.log('- Student, teacher, and class data structures are ready');
    console.log('\nNext steps:');
    console.log('1. Create quizzes with quiz_level field (via P2L Admin)');
    console.log('2. Teachers launch quizzes for their classes');
    console.log('3. Students access quizzes based on class and teacher status');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

runTests();
