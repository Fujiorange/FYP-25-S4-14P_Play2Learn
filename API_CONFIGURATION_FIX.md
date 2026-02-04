# API Configuration Fix for Production Deployment

## Problem
The live site was showing a "Failed to fetch" error when parents tried to access their dashboard. The error indicated that the frontend was trying to connect to `http://localhost:5000` instead of the production API endpoint.

## Root Cause
The original API URL configuration logic was using a simple ternary operator that checked `window.location.hostname === 'localhost'`. While this worked in development, it wasn't robust enough for all deployment scenarios.

## Solution
Updated all service files to use a more robust API URL detection function with the following priority:

1. **Environment Variable (Highest Priority)**: Use `REACT_APP_API_URL` if set
2. **Localhost Detection**: Check if hostname is 'localhost', '127.0.0.1', or empty string
3. **Production Fallback**: Use `window.location.origin` with appropriate API path

## Changes Made

### Files Updated:
- `/frontend/src/services/parentService.js`
- `/frontend/src/services/authService.js`
- `/frontend/src/services/studentService.js`
- `/frontend/src/services/schoolAdminService.js`
- `/frontend/src/services/p2lAdminService.js`

### New Files:
- `/frontend/.env.example` - Template for environment configuration

## Configuration for Deployment

### Option 1: Using Environment Variables (Recommended)
1. Create a `.env` file in the `frontend` directory (or set environment variables in your deployment platform)
2. Add: `REACT_APP_API_URL=https://your-backend-url.com`
3. The system will automatically use this URL for all API calls

### Option 2: Automatic Detection (Default)
If no environment variable is set:
- **Local Development**: Automatically uses `http://localhost:5000`
- **Production**: Automatically uses `${window.location.origin}/api`

## Deployment Examples

### Vercel/Netlify
Add environment variable in dashboard:
```
REACT_APP_API_URL=https://your-backend.onrender.com
```

### Render
Add environment variable in dashboard:
```
REACT_APP_API_URL=https://your-backend.onrender.com
```

### Docker
Add to docker-compose.yml:
```yaml
environment:
  - REACT_APP_API_URL=https://your-backend-url.com
```

### Manual Deployment
Add to `.env` file:
```
REACT_APP_API_URL=https://your-backend-url.com
```

## Testing

### Local Testing
1. Start backend: `cd backend && npm start` (runs on port 5000)
2. Start frontend: `cd frontend && npm start` (runs on port 3000)
3. Login as a parent user
4. Verify dashboard loads children without errors

### Production Testing
1. Deploy frontend and backend to your hosting platform
2. Set `REACT_APP_API_URL` environment variable (if using separate domains)
3. Build frontend: `npm run build`
4. Deploy the build folder
5. Test parent login and dashboard

## Verification
Check browser console for:
```
🌐 Parent Service API_BASE_URL: <correct-url>
```

The URL should be:
- `http://localhost:5000/api/mongo/parent` in development
- Your production URL in production (e.g., `https://yourapp.com/api/mongo/parent`)

## Notes
- The fix maintains backward compatibility with existing deployments
- No database changes required
- Works with any hosting platform (Vercel, Netlify, Render, AWS, etc.)
- Frontend build automatically includes the correct API URL
