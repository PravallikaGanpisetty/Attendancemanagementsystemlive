# Attendance Management System

## 🚀 Quick Start

### ⚠️ IMPORTANT: Start Backend FIRST!

### Step 1: Start Backend (Terminal 1)

```bash
cd backend
npm install

# Create .env file with:
# MONGO_URI=mongodb+srv://PravallikaGanpisetty:section-15@cluster0.trhlawl.mongodb.net/Attendancemsd?retryWrites=true&w=majority
# JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
# PORT=5000

npm run create-users   # creates test users
npm run dev            # Start backend server
```

**Expected:** `✅ Mongo connected successfully` and `🚀 Server running on http://localhost:5000`

### Step 2: Start Frontend (Terminal 2 - NEW TERMINAL)

```bash
cd frontend
npm install
npm run dev
```

**Expected:** Frontend runs on `http://localhost:5177`

### Step 3: Open Browser

Go to: `http://localhost:5177`

**Test Credentials:**
- **Student**: `student@example.com` / `password123`
- **Faculty**: `faculty@example.com` / `password123`

## 🔧 Troubleshooting

### Error: `ECONNREFUSED` or proxy error

**Backend is not running!**
1. Check Terminal 1 shows backend is running
2. Test: Open `http://localhost:5000/api/health` in browser
3. Should see: `{"status":"ok"}`

### MongoDB Connection Error

1. Check `backend/.env` has correct `MONGO_URI`
2. Make sure MongoDB Atlas allows your IP (or use `0.0.0.0/0` for all IPs)
3. Verify database name is `Attendancemsd`

See `START_HERE.md` for detailed troubleshooting guide.

## 📁 Project Structure

- `frontend/` - React + Vite (Port 5177)
- `backend/` - Express + Mongoose (Port 5000)
- Database: MongoDB Atlas (`Attendancemsd`)
