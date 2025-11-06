# 🔐 Authentication Debug Guide - 401/403 Errors

## 📁 File Locations

### Frontend API Files
- **`frontend/src/api/auth.js`** - Login/Register API calls
- **`frontend/src/api/attendance.js`** - All attendance-related API calls

### Backend Route Files
- **`backend/routes/auth.js`** - Login/Register endpoints (`/api/auth/login`, `/api/auth/register`)
- **`backend/routes/attendance.js`** - All attendance endpoints (`/api/attendance/*`)

### Backend Server File
- **`backend/index.js`** - Main server file with CORS configuration

---

## 🔍 How Authentication Works

### 1. Login Flow

**Frontend (`frontend/src/pages/Login.jsx`):**
```javascript
const res = await login({ role, email, password });
localStorage.setItem("token", res.token);  // ✅ Token stored here
localStorage.setItem("user", JSON.stringify(res.user));
```

**Backend (`backend/routes/auth.js`):**
```javascript
const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
res.json({ token, user: {...} });
```

### 2. API Request Flow

**Frontend (`frontend/src/api/attendance.js`):**
```javascript
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found. Please log in again.");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,  // ✅ Token sent here
  };
}
```

**Backend (`backend/routes/attendance.js`):**
```javascript
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
```

---

## 🐛 Debugging 401/403 Errors

### Error Code Meanings

| Code | Meaning | Common Causes |
|------|---------|---------------|
| **401** | Unauthorized - Not logged in or invalid token | • No token in localStorage<br>• Token expired<br>• Token format incorrect<br>• CORS blocking Authorization header |
| **403** | Forbidden - Logged in but wrong role | • Student trying to access faculty-only endpoint<br>• Token has wrong role |

### Step-by-Step Debugging

#### Step 1: Check if Token Exists
Open browser console and run:
```javascript
localStorage.getItem("token")
```
- ✅ **If token exists**: Copy it and check if it's valid
- ❌ **If null/undefined**: User needs to log in again

#### Step 2: Check Token Format
The token should be sent as:
```
Authorization: Bearer <token>
```

Check Network tab in browser DevTools:
1. Open DevTools (F12)
2. Go to Network tab
3. Click on a failed request
4. Check Request Headers → Authorization
5. Should see: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### Step 3: Check User Role
Open browser console:
```javascript
JSON.parse(localStorage.getItem("user"))
```
Check the `role` field:
- For `/api/attendance/classes` → Must be `"faculty"`
- For `/api/attendance/student/:id` → Can be `"student"` or `"faculty"`

#### Step 4: Verify Backend CORS
Check `backend/index.js`:
```javascript
app.use(cors({
  origin: true, // ✅ Should allow all origins
  credentials: true, // ✅ Required for Authorization header
}));
```

#### Step 5: Test Backend Directly
Test the backend endpoint directly:
```bash
curl -X GET https://attendancemanagementbackend.onrender.com/api/attendance/classes \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔧 Common Fixes

### Fix 1: Token Not Being Sent
**Problem**: Token is null when making API calls

**Solution**: Check if user is logged in before calling API:
```javascript
const token = localStorage.getItem("token");
if (!token) {
  navigate("/login");
  return;
}
```

### Fix 2: CORS Blocking Authorization Header
**Problem**: Browser blocks the Authorization header due to CORS

**Solution**: Already fixed! ✅
- Frontend: All fetch calls have `credentials: 'include'`
- Backend: CORS allows all origins with `credentials: true`

### Fix 3: Wrong Role Accessing Endpoint
**Problem**: Student trying to access `/api/attendance/classes` (faculty-only)

**Solution**: This is correct behavior! Students should use:
- `/api/attendance/student/:studentId` - View own attendance
- `/api/attendance/student/:studentId/classes` - View own classes

### Fix 4: Token Expired
**Problem**: Token expired after 7 days

**Solution**: User needs to log in again. The frontend should handle 401 errors:
```javascript
if (res.status === 401) {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  navigate("/login");
}
```

---

## 📋 Testing Checklist

- [ ] User can log in successfully
- [ ] Token is stored in localStorage after login
- [ ] Token is sent in Authorization header (check Network tab)
- [ ] Backend receives token (check backend logs)
- [ ] Faculty can access `/api/attendance/classes`
- [ ] Student can access `/api/attendance/student/:id`
- [ ] Student gets 403 when trying to access faculty endpoints
- [ ] 401 error redirects to login page

---

## 🚨 Still Having Issues?

1. **Check Browser Console** - Look for JavaScript errors
2. **Check Network Tab** - See the actual request/response
3. **Check Backend Logs** - See what the backend receives
4. **Test with Postman/curl** - Bypass frontend to test backend directly

### Quick Test Commands

**Test Login:**
```bash
curl -X POST https://attendancemanagementbackend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"role":"faculty","email":"faculty@example.com","password":"password123"}'
```

**Test Protected Endpoint:**
```bash
curl -X GET https://attendancemanagementbackend.onrender.com/api/attendance/classes \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📝 Summary

**API Files:**
- Frontend: `frontend/src/api/auth.js`, `frontend/src/api/attendance.js`
- Backend: `backend/routes/auth.js`, `backend/routes/attendance.js`

**Authentication Flow:**
1. User logs in → Backend returns JWT token
2. Frontend stores token in localStorage
3. Frontend sends token in `Authorization: Bearer <token>` header
4. Backend verifies token and extracts user role
5. Backend checks role permissions before allowing access

**Current Status:**
- ✅ CORS configured correctly
- ✅ Credentials included in all fetch calls
- ✅ Token validation in place
- ✅ Role-based access control working

