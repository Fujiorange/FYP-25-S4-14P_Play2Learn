#!/usr/bin/env node
// Test script for sentiment analysis improvements

const { analyzeSentiment } = require('./utils/sentimentAnalyzer');

console.log('=== Testing Improved Sentiment Analysis ===\n');

// Test cases based on the issue description
const testCases = [
  {
    message: "Bad learning experience and website is being not helpful",
    rating: 5,
    expected: "negative",
    description: "High rating with negative keywords (issue case)"
  },
  {
    message: "Great learning platform! Very helpful and easy to use.",
    rating: 5,
    expected: "positive",
    description: "High rating with positive keywords"
  },
  {
    message: "Terrible experience, very difficult to navigate and not useful at all",
    rating: 1,
    expected: "negative",
    description: "Low rating with negative keywords"
  },
  {
    message: "Amazing platform! My child loves learning with this. Highly recommend!",
    rating: 5,
    expected: "positive",
    description: "Genuinely positive review"
  },
  {
    message: "It's okay, nothing special but works fine",
    rating: 3,
    expected: "neutral",
    description: "Neutral review with neutral rating"
  },
  {
    message: "Worst website ever, broken and buggy, total waste of time",
    rating: 5,
    expected: "negative",
    description: "High rating but very negative text"
  },
  {
    message: "Love it! Best educational platform for kids.",
    rating: 5,
    expected: "positive",
    description: "Positive review matching rating"
  },
  {
    message: "Poor quality, disappointing and frustrating to use",
    rating: 2,
    expected: "negative",
    description: "Low rating with negative text"
  },
  {
    message: "Not bad, could be better but decent overall",
    rating: 3,
    expected: "neutral",
    description: "Mixed review with neutral rating"
  },
  {
    message: "Excellent work! The platform is fantastic and very effective for learning.",
    rating: 5,
    expected: "positive",
    description: "Strong positive alignment"
  }
];

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = analyzeSentiment(testCase.message, testCase.rating);
  const status = result.label === testCase.expected ? '✅ PASS' : '❌ FAIL';
  
  if (result.label === testCase.expected) {
    passed++;
  } else {
    failed++;
  }
  
  console.log(`Test ${index + 1}: ${status}`);
  console.log(`  Description: ${testCase.description}`);
  console.log(`  Message: "${testCase.message}"`);
  console.log(`  Rating: ${testCase.rating}/5`);
  console.log(`  Expected: ${testCase.expected}`);
  console.log(`  Got: ${result.label}`);
  console.log(`  Score: ${result.score}`);
  console.log(`  Details:`, result.details);
  console.log('');
});

console.log('=== Test Summary ===');
console.log(`Passed: ${passed}/${testCases.length}`);
console.log(`Failed: ${failed}/${testCases.length}`);
console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Review the logic if needed.');
  process.exit(1);
}
