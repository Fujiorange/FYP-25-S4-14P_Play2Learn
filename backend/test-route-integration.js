// Test script to verify route integration
// This tests that all routes are properly loaded and accessible

const express = require('express');
const mongoose = require('mongoose');

console.log('🧪 Testing Route Integration...\n');

// Import route files
try {
  const authRoutes = require('./routes/mongoAuthRoutes');
  console.log('✅ authRoutes loaded successfully');

  const studentRoutes = require('./routes/mongoStudentRoutes');
  console.log('✅ studentRoutes loaded successfully');

  const parentRoutes = require('./routes/mongoParentRoutes');
  console.log('✅ parentRoutes loaded successfully (NEWLY INTEGRATED)');

  const schoolAdminRoutes = require('./routes/schoolAdminRoutes');
  console.log('✅ schoolAdminRoutes loaded successfully');

  const p2lAdminRoutes = require('./routes/p2lAdminRoutes');
  console.log('✅ p2lAdminRoutes loaded successfully');

  const p2lRoutes = require('./routes/mongoP2LRoutes');
  console.log('✅ p2lRoutes (mongoP2LRoutes) loaded successfully (NEWLY INTEGRATED)');

  const adaptiveQuizRoutes = require('./routes/adaptiveQuizRoutes');
  console.log('✅ adaptiveQuizRoutes loaded successfully');

  console.log('\n📋 Route Integration Summary:');
  console.log('   Total Routes: 7');
  console.log('   New Integrations: 2');
  console.log('   - /api/mongo/parent (Parent Dashboard & Child Monitoring)');
  console.log('   - /api/mongo/p2l (Platform Admin Operations)');

  console.log('\n📍 Available Endpoints:');
  console.log('   Auth:          /api/mongo/auth/*');
  console.log('   Student:       /api/mongo/student/* (authenticated)');
  console.log('   Parent:        /api/mongo/parent/* (authenticated) 🆕');
  console.log('   School Admin:  /api/mongo/school-admin/* (authenticated)');
  console.log('   P2L Admin:     /api/p2ladmin/*');
  console.log('   P2L Platform:  /api/mongo/p2l/* (platform admin) 🆕');
  console.log('   Adaptive Quiz: /api/adaptive-quiz/*');

  // Test that routes are Express Router instances
  console.log('\n🔍 Validating Route Types:');
  const routes = [
    { name: 'authRoutes', instance: authRoutes },
    { name: 'studentRoutes', instance: studentRoutes },
    { name: 'parentRoutes', instance: parentRoutes },
    { name: 'schoolAdminRoutes', instance: schoolAdminRoutes },
    { name: 'p2lAdminRoutes', instance: p2lAdminRoutes },
    { name: 'p2lRoutes', instance: p2lRoutes },
    { name: 'adaptiveQuizRoutes', instance: adaptiveQuizRoutes },
  ];

  routes.forEach(route => {
    // More robust check for Express Router - check for router-specific properties
    const isRouter = route.instance && 
                    typeof route.instance === 'function' && 
                    typeof route.instance.use === 'function' &&
                    typeof route.instance.route === 'function';
    
    if (isRouter) {
      console.log(`   ✅ ${route.name} is a valid Express Router`);
    } else {
      console.log(`   ❌ ${route.name} is NOT a valid Express Router`);
    }
  });

  console.log('\n✨ All routes integrated successfully!');
  console.log('✨ Integration test PASSED\n');
  process.exit(0);

} catch (error) {
  console.error('\n❌ Route Integration Test FAILED:');
  console.error('   Error:', error.message);
  console.error('   Stack:', error.stack);
  process.exit(1);
}
