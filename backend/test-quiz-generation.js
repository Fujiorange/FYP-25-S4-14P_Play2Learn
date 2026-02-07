/**
 * Test script for automated quiz generation system
 * Run with: node backend/test-quiz-generation.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Question = require('./models/Question');
const Quiz = require('./models/Quiz');
const { autoGenerateAllQuizzes, generateQuizForLevel, getQuizGenerationStats } = require('./utils/quizGenerator');

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/play2learn';

async function createSampleQuestions() {
  console.log('\n=== Creating Sample Questions ===');
  
  const sampleQuestions = [];
  
  // Create questions for levels 0-2 with difficulties 1-10
  for (let level = 0; level <= 2; level++) {
    for (let difficulty = 1; difficulty <= 10; difficulty++) {
      // Create 5 questions per difficulty per level
      for (let i = 0; i < 5; i++) {
        const num1 = Math.floor(Math.random() * 20) + 1;
        const num2 = Math.floor(Math.random() * 20) + 1;
        const answer = num1 + num2;
        
        sampleQuestions.push({
          text: `What is ${num1} + ${num2}?`,
          choices: [
            answer.toString(),
            (answer + 1).toString(),
            (answer - 1).toString(),
            (answer + 2).toString()
          ],
          answer: answer.toString(),
          difficulty: difficulty,
          quiz_level: level,
          subject: 'Mathematics',
          topic: 'Addition',
          grade: 'Primary 1',
          is_active: true
        });
      }
    }
  }
  
  console.log(`Creating ${sampleQuestions.length} sample questions...`);
  
  // Clear existing questions
  await Question.deleteMany({});
  
  // Insert sample questions
  const inserted = await Question.insertMany(sampleQuestions);
  console.log(`✓ Created ${inserted.length} sample questions`);
  
  return inserted;
}

async function testQuizGeneration() {
  try {
    console.log('\n=== Testing Quiz Generation System ===\n');
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');
    
    // Step 1: Create sample questions
    await createSampleQuestions();
    
    // Step 2: Get statistics before generation
    console.log('\n=== Quiz Generation Statistics (Before) ===');
    const statsBefore = await getQuizGenerationStats();
    console.log(`Total questions: ${statsBefore.totalQuestions}`);
    console.log(`Ready levels (40+ questions): ${statsBefore.readyLevels}`);
    console.log(`Insufficient levels (<20 questions): ${statsBefore.insufficientLevels}`);
    
    statsBefore.levels.forEach(level => {
      if (level.questionCount > 0) {
        console.log(`  Level ${level.level}: ${level.questionCount} questions (${level.ready ? 'READY' : level.canGenerate ? 'CAN GENERATE' : 'INSUFFICIENT'})`);
      }
    });
    
    // Step 3: Clear existing quizzes
    console.log('\n=== Clearing Existing Quizzes ===');
    const deleted = await Quiz.deleteMany({ auto_generated: true });
    console.log(`✓ Deleted ${deleted.deletedCount} existing auto-generated quizzes\n`);
    
    // Step 4: Generate all quizzes
    console.log('=== Generating All Quizzes ===');
    const results = await autoGenerateAllQuizzes();
    
    console.log('\n=== Generation Results ===');
    console.log(`✓ Successfully generated: ${results.success.length} quizzes`);
    console.log(`⚠ Warnings: ${results.warnings.length}`);
    console.log(`✗ Errors: ${results.errors.length}\n`);
    
    if (results.success.length > 0) {
      console.log('Successfully generated quizzes:');
      results.success.forEach(r => {
        console.log(`  - Level ${r.level}: ${r.questionCount} questions (Quiz ID: ${r.quizId})`);
      });
    }
    
    if (results.warnings.length > 0) {
      console.log('\nWarnings:');
      results.warnings.forEach(w => {
        console.log(`  - Level ${w.level}: ${w.message}`);
      });
    }
    
    if (results.errors.length > 0) {
      console.log('\nErrors:');
      results.errors.forEach(e => {
        console.log(`  - Level ${e.level}: ${e.error}`);
      });
    }
    
    // Step 5: Verify generated quizzes
    console.log('\n=== Verifying Generated Quizzes ===');
    const generatedQuizzes = await Quiz.find({ auto_generated: true }).lean();
    console.log(`Found ${generatedQuizzes.length} auto-generated quizzes in database`);
    
    if (generatedQuizzes.length > 0) {
      console.log('\nQuiz details:');
      generatedQuizzes.forEach(quiz => {
        const diffDist = quiz.questions.reduce((acc, q) => {
          acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
          return acc;
        }, {});
        
        console.log(`  - ${quiz.title}:`);
        console.log(`    Level: ${quiz.quiz_level}`);
        console.log(`    Questions: ${quiz.questions.length}`);
        console.log(`    Difficulty distribution: ${JSON.stringify(diffDist)}`);
        console.log(`    Config: Target=${quiz.adaptive_config.target_correct_answers}, Progression=${quiz.adaptive_config.difficulty_progression}`);
      });
    }
    
    // Step 6: Test single level regeneration
    console.log('\n=== Testing Single Level Regeneration ===');
    const level0Result = await generateQuizForLevel(0);
    console.log(`Level 0 regeneration: ${level0Result.success ? '✓ SUCCESS' : '✗ FAILED'}`);
    if (level0Result.success) {
      console.log(`  Questions: ${level0Result.questionCount}`);
      console.log(`  Updated: ${level0Result.updated}`);
    }
    
    console.log('\n=== Test Complete ===\n');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the test
testQuizGeneration();
