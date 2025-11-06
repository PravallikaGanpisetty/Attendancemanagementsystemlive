# Attendance Backend

Environment variables (create a .env file in backend):

```
MONGO_URI=mongodb+srv://PravallikaGanpisetty:section-15@cluster0.trhlawl.mongodb.net/Attendancemsd?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_change_this
PORT=5000
```

**Important:** Create a `.env` file in the `backend` folder with the above content.

Database: `Attendancemsd`

Run locally:
```
cd backend
npm install
npm run create-users   # creates two test users
npm run dev
```
