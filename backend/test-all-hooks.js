// Check all pre-save hooks
delete require.cache[require.resolve('./models/Announcement.js')];
const Announcement = require('./models/Announcement.js');

const schema = Announcement.schema;
const preSaveHooks = schema.s.hooks._pres.get('save');

console.log(`Total pre-save hooks: ${preSaveHooks.length}\n`);

preSaveHooks.forEach((hook, index) => {
  console.log(`Hook ${index + 1}:`);
  console.log(`  Function length (parameters): ${hook.fn.length}`);
  console.log(`  Function name: ${hook.fn.name || '(anonymous)'}`);
  console.log(`  Function source preview:`, hook.fn.toString().substring(0, 100).replace(/\n/g, ' '));
  console.log('');
});
