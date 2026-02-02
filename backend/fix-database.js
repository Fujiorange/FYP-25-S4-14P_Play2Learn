// Run with: node scripts/fix-database.js
const mongoose = require('mongoose');
require('dotenv').config();

async function fixDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // 1. Fix classes collection - drop bad index
    console.log('\n=== Fixing classes collection ===');
    try {
      const classIndexes = await db.collection('classes').indexes();
      console.log('Current class indexes:', classIndexes.map(i => i.name));
      
      // Drop the problematic name_1 index if it exists
      if (classIndexes.some(i => i.name === 'name_1')) {
        await db.collection('classes').dropIndex('name_1');
        console.log('✅ Dropped problematic "name_1" index');
      }
      
      // Delete any documents with null class_name
      const deleted = await db.collection('classes').deleteMany({ class_name: null });
      if (deleted.deletedCount > 0) {
        console.log(`✅ Deleted ${deleted.deletedCount} documents with null class_name`);
      }
    } catch (e) {
      console.log('Classes fix:', e.message);
    }
    
    // 2. Verify school admin has schoolId
    console.log('\n=== Checking admin user ===');
    const admin = await db.collection('users').findOne({ email: 'admin@nps.com' });
    if (admin) {
      console.log('Admin found:', {
        email: admin.email,
        role: admin.role,
        schoolId: admin.schoolId,
        _id: admin._id
      });
      
      if (!admin.schoolId) {
        console.log('⚠️ Admin has no schoolId! Looking for school...');
        const school = await db.collection('schools').findOne({ name: /nps/i });
        if (school) {
          await db.collection('users').updateOne(
            { email: 'admin@nps.com' },
            { $set: { schoolId: school._id.toString() } }
          );
          console.log('✅ Updated admin schoolId to:', school._id.toString());
        }
      }
    } else {
      console.log('❌ Admin not found');
    }
    
    // 3. Check all users have correct schoolId
    console.log('\n=== Checking users schoolId ===');
    const usersWithoutSchool = await db.collection('users').countDocuments({ 
      schoolId: { $in: [null, ''] },
      role: { $in: ['Student', 'Teacher', 'Parent'] }
    });
    console.log('Users without schoolId:', usersWithoutSchool);
    
    // 4. Count users by school
    console.log('\n=== Users by schoolId ===');
    const usersBySchool = await db.collection('users').aggregate([
      { $group: { _id: '$schoolId', count: { $sum: 1 } } }
    ]).toArray();
    console.log(usersBySchool);
    
    console.log('\n✅ Database fixes complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixDatabase();
