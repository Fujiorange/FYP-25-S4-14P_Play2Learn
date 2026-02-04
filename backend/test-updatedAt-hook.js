// Test to verify the updatedAt pre-save hook works correctly
delete require.cache[require.resolve('./models/Announcement.js')];
const mongoose = require('mongoose');

async function testPreSaveHook() {
  console.log('🧪 Testing Announcement updatedAt pre-save hook...\n');
  
  try {
    const Announcement = require('./models/Announcement.js');
    
    // Get the pre-save hooks
    const schema = Announcement.schema;
    const preSaveHooks = schema.s.hooks._pres.get('save');
    
    console.log(`Total pre-save hooks found: ${preSaveHooks.length}`);
    
    // Find the updatedAt hook (it's the only anonymous hook that updates updatedAt)
    let updatedAtHook = null;
    for (const hook of preSaveHooks) {
      const src = hook.fn.toString();
      if (src.includes('this.updatedAt')) {
        updatedAtHook = hook;
        break;
      }
    }
    
    if (!updatedAtHook) {
      throw new Error('updatedAt hook not found');
    }
    
    console.log('✅ Found updatedAt hook');
    
    // Check if the hook uses callback style
    const hookFn = updatedAtHook.fn;
    const paramCount = hookFn.length;
    
    console.log(`Hook parameter count: ${paramCount}`);
    
    if (paramCount > 0) {
      console.log('❌ ERROR: Hook uses old callback style!');
      console.log('   This will cause "next is not a function" error!');
      console.log('   Hook source:', hookFn.toString());
      throw new Error('Hook must not use callback style (should have 0 parameters)');
    }
    
    console.log('✅ Hook uses modern style (no callback parameter)');
    
    // Test that the hook actually works
    const testDoc = {
      title: 'Test Announcement',
      content: 'Test content',
      author: 'Test Author',
      schoolId: new mongoose.Types.ObjectId(),
      updatedAt: new Date('2020-01-01')
    };
    
    const announcement = new Announcement(testDoc);
    const originalUpdatedAt = announcement.updatedAt.getTime();
    
    console.log('Original updatedAt:', announcement.updatedAt);
    
    // Call the hook
    hookFn.call(announcement);
    
    console.log('New updatedAt:', announcement.updatedAt);
    
    // Verify updatedAt was updated
    if (announcement.updatedAt.getTime() > originalUpdatedAt) {
      console.log('✅ updatedAt was successfully updated by the hook');
    } else {
      throw new Error('updatedAt was not updated by the hook');
    }
    
    console.log('\n🎉 All tests passed! The updatedAt hook is correctly implemented.\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testPreSaveHook();
