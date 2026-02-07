// Shared constants for license plans
// Used by both backend and frontend to ensure consistency

// Constant for unlimited classes in paid plans
export const UNLIMITED_CLASSES = 999;

export const LICENSE_PLANS = {
  free: {
    teacher_limit: 1,
    student_limit: 5,
    class_limit: 1,
    price: 0,
    name: 'Free'
  },
  starter: { 
    teacher_limit: 50, 
    student_limit: 500, 
    class_limit: UNLIMITED_CLASSES,
    price: 250,
    name: 'Starter'
  },
  professional: { 
    teacher_limit: 100, 
    student_limit: 1000, 
    class_limit: UNLIMITED_CLASSES,
    price: 500,
    name: 'Professional'
  },
  enterprise: { 
    teacher_limit: 250, 
    student_limit: 2500, 
    class_limit: UNLIMITED_CLASSES,
    price: 1000,
    name: 'Enterprise'
  }
};

export default LICENSE_PLANS;
