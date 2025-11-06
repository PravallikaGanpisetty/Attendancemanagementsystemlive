# 🚀 Quick Start Guide - Attendance Management System

## ⚠️ IMPORTANT: Start Backend FIRST, then Frontend

### Step 1: Start Backend Server

Open **Terminal 1** (PowerShell or Command Prompt):

```bash
cd C:\Users\gutup\OneDrive\Documents\projects\Attendance\backend
npm install
npm run dev
```

**Expected Output:**
```
Mongo connected
Server running on 5000
```

**If you see errors:**
- **MongoDB connection error** → Check your `.env` file has correct `MONGO_URI`
- **Port already in use** → Kill the process using port 5000 or change PORT in `.env`

### Step 2: Start Frontend Server

Open **Terminal 2** (NEW terminal window):

```bash
cd C:\Users\gutup\OneDrive\Documents\projects\Attendance\frontend
npm install
npm run dev
```

**Expected Output:**
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5177/
  ➜  Network: use --host to expose
```

### Step 3: Test Connection

1. Open browser: `http://localhost:5177`
2. Check browser console (F12) - should see no errors
3. Try logging in:
   - **Student**: `student@example.com` / `password123`
   - **Faculty**: `faculty@example.com` / `password123`

## 🔧 Troubleshooting

### Error: `ECONNREFUSED` or `proxy error`

**Solution:** Backend is not running!
1. Make sure backend is running in Terminal 1
2. Check backend shows: `Server running on 5000`
3. Test backend directly: Open `http://localhost:5000/api/health` in browser
   - Should show: `{"status":"ok"}`

### Error: MongoDB connection failed

**Solution:** Check your `.env` file in `backend/` folder:

```env
MONGO_URI=mongodb+srv://PravallikaGanpisetty:section-15@cluster0.trhlawl.mongodb.net/Attendancemsd?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
PORT=5000
```

### Error: Port 5000 already in use

**Solution:** Kill the process or use different port:

**Windows PowerShell:**
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

Or change PORT in `.env` to 5001 and update `vite.config.js` proxy target.

## 📝 Configuration Files

### Backend `.env` (create if doesn't exist)
Location: `backend/.env`
```env
MONGO_URI=mongodb+srv://PravallikaGanpisetty:section-15@cluster0.trhlawl.mongodb.net/Attendancemsd?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
PORT=5000
```

### Frontend `.env` (optional - proxy handles it)
Location: `frontend/.env`
```env
VITE_API_BASE=/api
```

## ✅ Verification Checklist

- [ ] Backend terminal shows "Mongo connected" and "Server running on 5000"
- [ ] Frontend terminal shows Vite server running on port 5177
- [ ] Browser can access `http://localhost:5177`
- [ ] Browser console (F12) shows no connection errors
- [ ] Can login with test credentials
- [ ] Faculty can create classes
- [ ] Students can see classes after being added

## 🆘 Still Having Issues?

Share the **exact error message** from:
1. Backend terminal output
2. Frontend terminal output  
3. Browser console (F12 → Console tab)

