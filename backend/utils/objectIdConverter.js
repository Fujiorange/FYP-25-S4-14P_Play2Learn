// backend/utils/objectIdConverter.js
// Utility functions for converting String IDs to MongoDB ObjectIds

const mongoose = require('mongoose');

/**
 * Convert a string schoolId to MongoDB ObjectId
 * @param {string} schoolId - The school ID to convert
 * @returns {mongoose.Types.ObjectId} - The converted ObjectId
 * @throws {Error} - If the schoolId format is invalid
 */
function convertSchoolIdToObjectId(schoolId) {
  if (!schoolId) {
    throw new Error('School ID is required');
  }
  
  try {
    return new mongoose.Types.ObjectId(schoolId);
  } catch (err) {
    throw new Error(`Invalid school ID format: ${schoolId}`);
  }
}

/**
 * Convert an array of string schoolIds to MongoDB ObjectIds
 * @param {string[]} schoolIds - Array of school IDs to convert
 * @returns {mongoose.Types.ObjectId[]} - Array of converted ObjectIds
 * @throws {Error} - If any schoolId format is invalid (includes which ID failed)
 */
function convertSchoolIdsToObjectIds(schoolIds) {
  if (!Array.isArray(schoolIds)) {
    throw new Error('School IDs must be an array');
  }
  
  if (schoolIds.length === 0) {
    return [];
  }
  
  try {
    return schoolIds.map((id, index) => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (err) {
        throw new Error(`Invalid school ID at index ${index}: ${id}`);
      }
    });
  } catch (err) {
    throw err;
  }
}

module.exports = {
  convertSchoolIdToObjectId,
  convertSchoolIdsToObjectIds
};
