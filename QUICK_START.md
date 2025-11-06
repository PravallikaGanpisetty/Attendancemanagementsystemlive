# 🚀 QUICK START - Fix ECONNREFUSED Error

## ⚠️ The Problem

If you see `ECONNREFUSED` or `proxy error`, it means:
- ✅ Frontend is running
- ❌ Backend is NOT running or not reachable

## ✅ Solution - Follow These Steps

### Step 1: Check Backend .env File

**Location:** `backend/.env`

Make sure it exists and contains:

```env
MONGO_URI=mongodb+srv://PravallikaGanpisetty:section-15@cluster0.trhlawl.mongodb.net/Attendancemsd?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
PORT=5000
```

### Step 2: Test MongoDB Connection

**Open Terminal 1:**

```bash
cd backend
npm run test-connection
```

**Expected Output:**
```
✅ MongoDB connected successfully!
✅ Database: Attendancemsd
```

**If you see an error:**
- Check MongoDB Atlas Network Access (allow your IP or 0.0.0.0/0)
- Verify username/password in connection string

### Step 3: Start Backend Server

**In Terminal 1 (same terminal):**

```bash
npm run dev
```

**Expected Output:**
```
✅ Mongo connected successfully
🚀 Server running on http://localhost:5000
📡 API endpoints available at http://localhost:5000/api
```

**⚠️ Keep this terminal open!** Backend must stay running.

### Step 4: Start Frontend Server

**Open NEW Terminal 2:**

```bash
cd frontend
npm run dev
```

**Expected Output:**
```
  VITE v7.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5177/
```

### Step 5: Test in Browser

1. Open: `http://localhost:5177`
2. Open Browser Console (F12)
3. Should see NO connection errors
4. Try login:
   - Student: `student@example.com` / `password123`
   - Faculty: `faculty@example.com` / `password123`

### Step 6: Verify Backend is Working

Open in browser: `http://localhost:5000/api/health`

**Should see:** `{"status":"ok"}`

If you see "Cannot GET" or timeout → Backend is not running!

## 🔧 Common Issues & Fixes

### Issue 1: Port 5000 Already in Use

**Fix:**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill it (replace <PID> with actual number)
taskkill /PID <PID> /F
```

Or change PORT in `.env` to 5001 and update `vite.config.js` proxy target.

### Issue 2: MongoDB Connection Error

**Fix:**
1. Go to MongoDB Atlas Dashboard
2. Click "Network Access"
3. Add IP Address: `0.0.0.0/0` (allows all IPs) OR your specific IP
4. Wait 1-2 minutes for changes to apply
5. Try again

### Issue 3: Backend Crashes on Startup

**Check:**
- `.env` file exists in `backend/` folder
- `MONGO_URI` is correct (no extra spaces)
- MongoDB credentials are correct

### Issue 4: Frontend Shows Proxy Error

**Fix:**
1. Make sure backend is running (Step 3)
2. Check `vite.config.js` has correct proxy target: `http://localhost:5000`
3. Restart frontend: Stop (Ctrl+C) and run `npm run dev` again

## ✅ Success Checklist

- [ ] Backend terminal shows: `✅ Mongo connected successfully`
- [ ] Backend terminal shows: `🚀 Server running on http://localhost:5000`
- [ ] Frontend terminal shows: Vite server running
- [ ] Browser `http://localhost:5000/api/health` shows `{"status":"ok"}`
- [ ] Browser console (F12) shows NO errors
- [ ] Can login successfully

## 🆘 Still Stuck?

Share these outputs:

1. **Backend terminal output** (from `npm run dev`)
2. **Frontend terminal output** (from `npm run dev`)
3. **Browser console errors** (F12 → Console tab)
4. **Result of:** `http://localhost:5000/api/health` in browser

