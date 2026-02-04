// Test to verify the pre-save hook works correctly
// Force fresh module load by deleting from cache
delete require.cache[require.resolve('./models/Announcement.js')];

const mongoose = require('mongoose');

// Mock mongoose to test the hook in isolation
async function testPreSaveHook() {
  console.log('🧪 Testing Announcement pre-save hook (fresh load)...\n');
  
  try {
    const Announcement = require('./models/Announcement.js');
    
    // Create a mock document with minimal required fields
    const testDoc = {
      title: 'Test Announcement',
      content: 'Test content',
      author: 'Test Author',
      schoolId: new mongoose.Types.ObjectId(),
      updatedAt: new Date('2020-01-01')
    };
    
    console.log('Initial updatedAt:', testDoc.updatedAt);
    
    // Create an instance (this doesn't trigger hooks)
    const announcement = new Announcement(testDoc);
    
    // Get the pre-save hooks
    const schema = Announcement.schema;
    const preSaveHooks = schema.s.hooks._pres.get('save');
    
    if (!preSaveHooks || preSaveHooks.length === 0) {
      throw new Error('No pre-save hooks found');
    }
    
    console.log(`✅ Found ${preSaveHooks.length} pre-save hook(s)`);
    
    // Manually call the first pre-save hook (the updatedAt one)
    const hook = preSaveHooks[0];
    
    // Check if the hook expects a callback (old style) or not (new style)
    const hookFn = hook.fn;
    const hookLength = hookFn.length;
    
    console.log('Hook function parameter count:', hookLength);
    
    if (hookLength === 0) {
      console.log('✅ Hook uses modern style (no callback parameter)');
      
      // Call the hook synchronously
      const originalUpdatedAt = announcement.updatedAt;
      hookFn.call(announcement);
      
      // Verify updatedAt was updated
      if (announcement.updatedAt.getTime() > originalUpdatedAt.getTime()) {
        console.log('✅ updatedAt was successfully updated by the hook');
        console.log('New updatedAt:', announcement.updatedAt);
      } else {
        throw new Error('updatedAt was not updated by the hook');
      }
    } else if (hookLength === 1) {
      console.log('❌ Hook uses old callback style (has next parameter)');
      console.log('   This will cause "next is not a function" error in production!');
      throw new Error('Hook must not use callback style');
    }
    
    console.log('\n🎉 Pre-save hook test passed!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testPreSaveHook();
