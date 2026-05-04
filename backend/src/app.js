const dotenv = require('dotenv');
dotenv.config();

const http        = require('http');
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const session     = require('express-session');
const passport    = require('./config/passport');
const connectDB   = require('./config/db');
const { initSocket } = require('./config/socket');

const authRoutes       = require('./routes/authRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const menuRoutes       = require('./routes/menuRoutes');
const aiRoutes         = require('./routes/aiRoutes');
const imageRoutes      = require('./routes/imageRoutes');
const tableRoutes      = require('./routes/tableRoutes');
const customerRoutes   = require('./routes/customerRoutes');
const orderRoutes      = require('./routes/orderRoutes');
const inventoryRoutes  = require('./routes/inventoryRoutes');
const analyticsRoutes  = require('./routes/analyticsRoutes');
const errorHandler     = require('./middleware/errorHandler');

connectDB();

const app    = express();
const server = http.createServer(app);
initSocket(server);

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(session({
  secret:            process.env.SESSION_SECRET || 'qrunch_secret',
  resave:            false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth',        authRoutes);
app.use('/api/superadmin',  superAdminRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu',        menuRoutes);
app.use('/api/ai',          aiRoutes);
app.use('/api/images',      imageRoutes);
app.use('/api/tables',      tableRoutes);
app.use('/api/customer',    customerRoutes);
app.use('/api/orders',      orderRoutes);
app.use('/api/inventory',   inventoryRoutes);
app.use('/api/analytics',   analyticsRoutes);
app.use('/api/staff', require('./routes/staffRoutes'));

app.use('/api/sessions', require('./routes/sessionRoutes'));

app.use('/api/feedback', require('./routes/feedbackRoutes'));

app.use('/api/expenses', require('./routes/expenseRoutes'));

app.use('/api/restaurants', require('./routes/restaurantRoutes'));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`QRunch server running on port ${PORT}`));