import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const angularApp = new AngularNodeAppEngine();

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import nodemailer from 'nodemailer';

app.use('/api', express.json());

// Prevent browser caching for API routes
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Handle socket.io requests through the Express app for dev server compatibility
app.use('/socket.io', (req, res) => {
  // Fix req.url for socket.io engine
  req.url = '/socket.io' + req.url;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  io.engine.handleRequest(req as any, res as any);
});

const JWT_SECRET = 'ptsp-secret-key-123';

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
  host: process.env['SMTP_HOST'] || 'smtp.ethereal.email',
  port: parseInt(process.env['SMTP_PORT'] || '587'),
  secure: process.env['SMTP_PORT'] === '465', // true for 465, false for other ports
  auth: {
    user: process.env['SMTP_USER'],
    pass: process.env['SMTP_PASS'],
  },
});

const sendEmailNotification = async (to: string, subject: string, html: string) => {
  if (!to) return;
  try {
    const info = await transporter.sendMail({
      from: process.env['SMTP_FROM'] || '"MTsN 2 Kotim" <noreply@mtsn2kotim.sch.id>',
      to,
      subject,
      html,
    });
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

interface UserPayload {
  id: number;
  role: string;
  name: string;
  nis?: string;
  kelas?: string;
}

interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('join', (userId: number) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined room user_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Mock Database
const users = [
  { id: 1, username: 'siswa1', password: 'password', role: 'Siswa', name: 'Budi Santoso', nis: '12345', kelas: 'X-A' },
  { id: 2, username: 'wali1', password: 'password', role: 'Wali Kelas', name: 'Pak Guru Andi' },
  { id: 3, username: 'tu1', password: 'password', role: 'Staff Tata Usaha', name: 'Bu TU Rini' },
  { id: 4, username: 'kepsek1', password: 'password', role: 'Kepala Madrasah', name: 'Pak Kepsek Budi' },
  { id: 5, username: 'wakahumas1', password: 'password', role: 'Waka Humas', name: 'Pak Waka Humas' },
  { id: 6, username: 'wakakurikulum1', password: 'password', role: 'Waka Kurikulum', name: 'Bu Waka Kurikulum' },
  { id: 7, username: 'wakakesiswaan1', password: 'password', role: 'Waka Kesiswaan', name: 'Pak Waka Kesiswaan' },
  { id: 8, username: 'wakasarpras1', password: 'password', role: 'Waka Sarpras', name: 'Bu Waka Sarpras' },
  { id: 9, username: 'gurupiket1', password: 'password', role: 'Guru Piket', name: 'Pak Guru Piket' },
  { id: 10, username: 'MTsN2Kotim', password: '47113291996', role: 'Admin', name: 'Super Admin' },
];
let userCounter = 11;

const services = [
  { id: 'surat-keterangan', name: 'Surat Keterangan Aktif', description: 'Pengajuan surat keterangan aktif sebagai siswa.', icon: 'description', targetRole: 'Staff Tata Usaha' },
  { id: 'legalisir', name: 'Legalisir Raport', description: 'Pengajuan legalisir raport atau ijazah.', icon: 'verified', targetRole: 'Staff Tata Usaha' },
  
  // Waka Sarpras
  { id: 'laporan-kerusakan', name: 'Laporan Fasilitas Rusak', description: 'Laporan meja rusak, fasilitas kelas, dll.', icon: 'build', targetRole: 'Waka Sarpras' },
  { id: 'peminjaman-barang', name: 'Peminjaman Barang', description: 'Peminjaman inventaris madrasah.', icon: 'inventory_2', targetRole: 'Waka Sarpras' },
  
  // Waka Humas
  { id: 'permohonan-mou', name: 'Permohonan Kerjasama (MoU)', description: 'Pengajuan kerjasama dengan pihak luar.', icon: 'handshake', targetRole: 'Waka Humas' },
  { id: 'kunjungan', name: 'Permohonan Kunjungan', description: 'Permohonan kunjungan ke Madrasah.', icon: 'tour', targetRole: 'Waka Humas' },
  
  // Waka Kurikulum & Guru Piket
  { id: 'izin-kbm', name: 'Izin Tidak Masuk KBM', description: 'Permohonan tidak masuk Kegiatan Belajar Mengajar.', icon: 'event_busy', targetRole: 'Waka Kurikulum' },
  { id: 'guru-absen', name: 'Laporan Guru Tidak Masuk', description: 'Laporan guru tidak masuk kelas pada jam mengajar.', icon: 'person_off', targetRole: 'Waka Kurikulum' },
  
  // Waka Kesiswaan
  { id: 'aduan-bolos', name: 'Aduan Siswa Bolos', description: 'Laporan siswa bolos di jam sekolah.', icon: 'directions_run', targetRole: 'Waka Kesiswaan' },
  { id: 'aduan-kenakalan', name: 'Aduan Kenakalan Siswa', description: 'Laporan kenakalan siswa/i.', icon: 'warning', targetRole: 'Waka Kesiswaan' },
];

const requests: Record<string, unknown>[] = [];
let requestCounter = 1;

// Middleware
const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401).json({ message: 'Unauthorized' }); return; }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Auth Routes
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) { res.status(401).json({ message: 'Invalid credentials' }); return; }
  
  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token, user: { id: user.id, role: user.role, name: user.name, nis: user.nis, kelas: user.kelas } });
});

app.get('/api/auth/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
  const user = users.find(u => u.id === req.user!.id);
  if (!user) { res.status(404).json({ message: 'User not found' }); return; }
  res.json({ user: { id: user.id, role: user.role, name: user.name, nis: user.nis, kelas: user.kelas } });
});

// Services Route
app.get('/api/services', (req: Request, res: Response) => {
  res.json(services);
});

// User Management Routes (Admin Only)
app.get('/api/users', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'Admin') { res.status(403).json({ message: 'Forbidden' }); return; }
  // Return users without passwords
  const safeUsers = users.map(u => {
    const safeUser = { ...u } as Record<string, unknown>;
    delete safeUser['password'];
    return safeUser;
  });
  res.json(safeUsers);
});

app.post('/api/users', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'Admin') { res.status(403).json({ message: 'Forbidden' }); return; }
  const { username, password, role, name, nis, kelas, email } = req.body;
  
  if (users.some(u => u.username === username)) {
    res.status(400).json({ message: 'Username already exists' });
    return;
  }
  
  const newUser = { id: userCounter++, username, password, role, name, nis, kelas, email };
  users.push(newUser);
  
  const safeUser = { ...newUser } as Record<string, unknown>;
  delete safeUser['password'];
  
  if (email) {
    sendEmailNotification(
      email,
      'Akun Baru MTsN 2 Kotim',
      `
      <h3>Halo ${name},</h3>
      <p>Akun Anda telah berhasil dibuat oleh Admin.</p>
      <p>Berikut adalah detail akun Anda:</p>
      <ul>
        <li><strong>Username:</strong> ${username}</li>
        <li><strong>Password:</strong> ${password}</li>
        <li><strong>Role:</strong> ${role}</li>
      </ul>
      <p>Silakan login ke sistem menggunakan kredensial di atas.</p>
      <br>
      <p>Terima kasih,</p>
      <p>Admin MTsN 2 Kotim</p>
      `
    );
  }

  res.status(201).json(safeUser);
});

app.put('/api/users/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'Admin') { res.status(403).json({ message: 'Forbidden' }); return; }
  const { id } = req.params;
  const { username, password, role, name, nis, kelas, email } = req.body;
  
  const userIndex = users.findIndex(u => u.id === parseInt(id as string));
  if (userIndex === -1) { res.status(404).json({ message: 'User not found' }); return; }
  
  if (username !== users[userIndex].username && users.some(u => u.username === username)) {
    res.status(400).json({ message: 'Username already exists' });
    return;
  }
  
  const updatedUser = { ...users[userIndex], username, role, name, nis, kelas, email };
  if (password) {
    updatedUser.password = password;
  }
  
  users[userIndex] = updatedUser;
  const safeUser = { ...updatedUser } as Record<string, unknown>;
  delete safeUser['password'];

  if (email) {
    sendEmailNotification(
      email,
      'Pembaruan Akun MTsN 2 Kotim',
      `
      <h3>Halo ${name},</h3>
      <p>Detail akun Anda telah diperbarui oleh Admin.</p>
      <p>Berikut adalah detail akun Anda yang terbaru:</p>
      <ul>
        <li><strong>Username:</strong> ${username}</li>
        ${password ? `<li><strong>Password:</strong> ${password}</li>` : ''}
        <li><strong>Role:</strong> ${role}</li>
      </ul>
      <p>Jika Anda tidak merasa melakukan perubahan ini, silakan hubungi Admin.</p>
      <br>
      <p>Terima kasih,</p>
      <p>Admin MTsN 2 Kotim</p>
      `
    );
  }

  res.json(safeUser);
});

app.delete('/api/users/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'Admin') { res.status(403).json({ message: 'Forbidden' }); return; }
  const { id } = req.params;
  
  const userIndex = users.findIndex(u => String(u.id) === id);
  if (userIndex === -1) { res.status(404).json({ message: 'User not found' }); return; }
  
  if (users[userIndex].role === 'Admin' && users.filter(u => u.role === 'Admin').length === 1) {
    res.status(400).json({ message: 'Cannot delete the last admin' });
    return;
  }
  
  users.splice(userIndex, 1);
  res.status(204).send();
});

// Public Requests Route
app.post('/api/public/requests', (req: Request, res: Response) => {
  const service = services.find(s => s.id === req.body.serviceId);
  if (!service) { res.status(400).json({ message: 'Invalid service' }); return; }
  
  const data = req.body.data || {};
  const studentName = data.namaPemohon || data.namaPelapor || data.nama || 'Anonim';
  
  const newRequest = {
    id: requestCounter++,
    studentId: 0, // 0 for public
    studentName: studentName,
    serviceId: req.body.serviceId,
    serviceName: service.name,
    data: data,
    status: 'Menunggu Verifikasi',
    currentTier: 'Admin',
    createdAt: new Date().toISOString(),
    history: [{ action: 'Pengajuan Dibuat', by: studentName, role: 'Publik', date: new Date().toISOString() }]
  };
  requests.push(newRequest);
  res.status(201).json(newRequest);
});

// Requests Routes
app.post('/api/requests', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
  
  const service = services.find(s => s.id === req.body.serviceId);
  if (!service) { res.status(400).json({ message: 'Invalid service' }); return; }
  
  const newRequest = {
    id: requestCounter++,
    studentId: req.user.id,
    studentName: req.user.name,
    serviceId: req.body.serviceId,
    serviceName: service.name,
    data: req.body.data,
    status: 'Menunggu Verifikasi',
    currentTier: 'Admin',
    createdAt: new Date().toISOString(),
    history: [{ action: 'Pengajuan Dibuat', by: req.user.name, role: req.user.role, date: new Date().toISOString() }]
  };
  requests.push(newRequest);
  res.status(201).json(newRequest);
});

app.get('/api/requests', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
  const role = req.user.role;
  let filteredRequests = [];
  
  if (role === 'Admin') {
    filteredRequests = requests;
  } else if (role === 'Siswa') {
    filteredRequests = requests.filter(r => r['studentId'] === req.user!.id);
  } else {
    filteredRequests = requests.filter(r => {
      let isCurrentTier = r['currentTier'] === role;
      if (role === 'Guru Piket' && r['currentTier'] === 'Waka Kurikulum') {
         isCurrentTier = true;
      }
      const hasInteracted = (r['history'] as Record<string, unknown>[]).some((h: Record<string, unknown>) => h['role'] === role);
      return isCurrentTier || hasInteracted;
    });
  }
  
  res.json(filteredRequests.sort((a, b) => new Date(b['createdAt'] as string).getTime() - new Date(a['createdAt'] as string).getTime()));
});

app.delete('/api/requests/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'Admin') { res.status(403).json({ message: 'Forbidden' }); return; }
  const { id } = req.params;
  
  const requestIndex = requests.findIndex(r => String(r['id']) === id);
  if (requestIndex === -1) { res.status(404).json({ message: 'Request not found' }); return; }
  
  requests.splice(requestIndex, 1);
  res.status(204).send();
});

app.post('/api/requests/:id/verify', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ message: 'Unauthorized' }); return; }
  const { id } = req.params;
  const { action, reason } = req.body;
  const request = requests.find(r => r['id'] === parseInt(id as string));
  
  if (!request) { res.status(404).json({ message: 'Request not found' }); return; }
  
  const role = req.user.role;
  const isAdmin = role === 'Admin';
  
  if (!isAdmin) { res.status(403).json({ message: 'Only Admin can verify requests' }); return; }
  
  if (action === 'reject') {
    request['status'] = 'Ditolak';
    (request['history'] as Record<string, unknown>[]).push({ action: 'Ditolak', reason, by: req.user.name, role: req.user.role, date: new Date().toISOString() });
  } else if (action === 'approve') {
    request['currentTier'] = 'Selesai';
    request['status'] = 'Selesai';
    (request['history'] as Record<string, unknown>[]).push({ action: 'Disetujui Final', by: req.user.name, role: req.user.role, date: new Date().toISOString() });
  }
  
  // Send to Google Sheets
  try {
    const sheetData = {
      sheetName: request['serviceName'],
      status: request['status'],
      keterangan: reason || 'Disetujui',
      admin: req.user.name,
      tanggalVerifikasi: new Date().toISOString(),
      ...(request['data'] as Record<string, unknown>)
    };

    fetch('https://script.google.com/macros/s/AKfycbyTSsMUqc-k69_wb8OKS-8xGl_YCBckUBoHtDb6cUJf2Z4miswg2QqTOVSgDQcPSySotw/exec', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sheetData)
    }).catch(err => console.error('Failed to send to Google Sheets:', err));
  } catch (e) {
    console.error('Error preparing Google Sheets payload', e);
  }
  
  // Emit notification to the student
  if (request['studentId'] !== 0) {
    io.to(`user_${request['studentId']}`).emit('request_status_changed', {
      requestId: request['id'],
      serviceName: request['serviceName'],
      status: request['status'],
      action: action === 'approve' ? 'Disetujui' : 'Ditolak',
      by: req.user.name,
      role: req.user.role
    });
  }
  
  res.json(request);
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id'] || process.env['PORT']) {
  const port = process.env['PORT'] || 3000;
  httpServer.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
