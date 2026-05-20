const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// ==================== CẤU HÌNH DATABASE ====================
const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '123456',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'QuanLyQuanCom',
    options: { 
        encrypt: false, 
        trustServerCertificate: true 
    }
};

let pool;

async function connectDB() {
    try {
        pool = await sql.connect(dbConfig);
        console.log("✅ SQL Server connected successfully!");
        return true;
    } catch (err) {
        console.error("❌ SQL connection error:", err);
        return false;
    }
}

// ==================== ROUTE HTML ====================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'login.html')));
app.get('/nhanvien', (req, res) => res.sendFile(path.join(__dirname, '..', 'nhanvien.html')));
app.get('/quantri', (req, res) => res.sendFile(path.join(__dirname, '..', 'quantri.html')));

// ==================== API KIỂM TRA ====================
app.get('/api/test', (req, res) => res.json({ message: 'Backend OK', timestamp: new Date() }));

// ==================== API BÀN ĂN ====================
app.get('/api/banan', async (req, res) => {
    try {
        if (!pool) await connectDB();
        const result = await pool.request().query('SELECT * FROM BANAN ORDER BY MaBan');
        res.json(result.recordset);
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: err.message }); 
    }
});

app.put('/api/ban/:maBan/status', async (req, res) => {
    const { maBan } = req.params;
    const { trangThai } = req.body;
    try {
        if (!pool) await connectDB();
        await pool.request()
            .input('maBan', sql.NVarChar, maBan)
            .input('trangThai', sql.NVarChar, trangThai)
            .query(`UPDATE BANAN SET TrangThaiBan = @trangThai WHERE MaBan = @maBan`);
        res.json({ success: true });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: err.message }); 
    }
});

app.post('/api/banan', async (req, res) => {
    const { TenBan, SoChoNgoi, TrangThaiBan } = req.body;
    try {
        if (!pool) await connectDB();
        const maxResult = await pool.request().query(`
            SELECT TOP 1 MaBan FROM BANAN WHERE MaBan LIKE 'B%' ORDER BY CAST(REPLACE(MaBan, 'B', '') AS INT) DESC
        `);
        let newNumber = 1;
        if (maxResult.recordset.length > 0) {
            const lastNumber = parseInt(maxResult.recordset[0].MaBan.replace('B', ''));
            if (!isNaN(lastNumber)) newNumber = lastNumber + 1;
        }
        const maBan = 'B' + String(newNumber).padStart(2, '0');
        
        await pool.request()
            .input('maBan', sql.NVarChar, maBan)
            .input('tenBan', sql.NVarChar, TenBan)
            .input('soChoNgoi', sql.Int, SoChoNgoi)
            .input('trangThai', sql.NVarChar, TrangThaiBan || 'Trống')
            .query(`
                INSERT INTO BANAN (MaBan, TenBan, SoChoNgoi, TrangThaiBan)
                VALUES (@maBan, @tenBan, @soChoNgoi, @trangThai)
            `);
        res.json({ success: true, maBan: maBan });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/banan/:maBan', async (req, res) => {
    const { maBan } = req.params;
    const { TenBan, SoChoNgoi, TrangThaiBan } = req.body;
    try {
        if (!pool) await connectDB();
        await pool.request()
            .input('maBan', sql.NVarChar, maBan)
            .input('tenBan', sql.NVarChar, TenBan)
            .input('soChoNgoi', sql.Int, SoChoNgoi)
            .input('trangThai', sql.NVarChar, TrangThaiBan)
            .query(`
                UPDATE BANAN 
                SET TenBan = @tenBan, SoChoNgoi = @soChoNgoi, TrangThaiBan = @trangThai
                WHERE MaBan = @maBan
            `);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/banan/:maBan', async (req, res) => {
    const { maBan } = req.params;
    try {
        if (!pool) await connectDB();
        const checkResult = await pool.request()
            .input('maBan', sql.NVarChar, maBan)
            .query(`SELECT COUNT(*) as count FROM PHIEUGOIMON WHERE MaBan = @maBan`);
        if (checkResult.recordset[0].count > 0) {
            return res.status(400).json({ success: false, message: 'Bàn đã có phiếu, không thể xóa!' });
        }
        await pool.request()
            .input('maBan', sql.NVarChar, maBan)
            .query(`DELETE FROM BANAN WHERE MaBan = @maBan`);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ==================== API DANH MỤC MÓN ĂN ====================
app.get('/api/danhmuc', async (req, res) => {
    try {
        if (!pool) await connectDB();
        const result = await pool.request().query('SELECT * FROM DANHMUCMONAN');
        res.json(result.recordset);
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: err.message }); 
    }
});

// ==================== API MÓN ĂN ====================
app.get('/api/monan', async (req, res) => {
    try {
        if (!pool) await connectDB();
        const result = await pool.request().query(`
            SELECT 
                m.MaMon,
                m.TenMon,
                m.DonGia,
                m.TrangThaiMon,
                m.MaDanhMuc,
                m.MoTa,
                d.TenDanhMuc
            FROM MONAN m
            LEFT JOIN DANHMUCMONAN d ON m.MaDanhMuc = d.MaDanhMuc
            ORDER BY m.MaMon
        `);
        res.json(result.recordset);
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: err.message }); 
    }
});

app.post('/api/monan', async (req, res) => {
    const { TenMon, DonGia, MaDanhMuc, TrangThaiMon, MoTa } = req.body;
    try {
        if (!pool) await connectDB();
        const maxResult = await pool.request().query(`
            SELECT TOP 1 MaMon FROM MONAN WHERE MaMon LIKE 'MA%' ORDER BY CAST(REPLACE(MaMon, 'MA', '') AS INT) DESC
        `);
        let newNumber = 1;
        if (maxResult.recordset.length > 0) {
            const lastNumber = parseInt(maxResult.recordset[0].MaMon.replace('MA', ''));
            if (!isNaN(lastNumber)) newNumber = lastNumber + 1;
        }
        const maMon = 'MA' + String(newNumber).padStart(3, '0');
        
        await pool.request()
            .input('maMon', sql.NVarChar, maMon)
            .input('tenMon', sql.NVarChar, TenMon)
            .input('donGia', sql.Decimal(18,2), DonGia)
            .input('maDanhMuc', sql.NVarChar, MaDanhMuc)
            .input('trangThai', sql.NVarChar, TrangThaiMon || 'Còn bán')
            .input('moTa', sql.NVarChar, MoTa || '')
            .query(`
                INSERT INTO MONAN (MaMon, TenMon, DonGia, MaDanhMuc, TrangThaiMon, MoTa)
                VALUES (@maMon, @tenMon, @donGia, @maDanhMuc, @trangThai, @moTa)
            `);
        res.json({ success: true, maMon: maMon });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/monan/:maMon', async (req, res) => {
    const { maMon } = req.params;
    const { TenMon, DonGia, MaDanhMuc, TrangThaiMon, MoTa } = req.body;
    try {
        if (!pool) await connectDB();
        await pool.request()
            .input('maMon', sql.NVarChar, maMon)
            .input('tenMon', sql.NVarChar, TenMon)
            .input('donGia', sql.Decimal(18,2), DonGia)
            .input('maDanhMuc', sql.NVarChar, MaDanhMuc)
            .input('trangThai', sql.NVarChar, TrangThaiMon)
            .input('moTa', sql.NVarChar, MoTa || '')
            .query(`
                UPDATE MONAN 
                SET TenMon = @tenMon, DonGia = @donGia, MaDanhMuc = @maDanhMuc, TrangThaiMon = @trangThai, MoTa = @moTa
                WHERE MaMon = @maMon
            `);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/monan/:maMon', async (req, res) => {
    const { maMon } = req.params;
    try {
        if (!pool) await connectDB();
        const checkResult = await pool.request()
            .input('maMon', sql.NVarChar, maMon)
            .query(`SELECT COUNT(*) as count FROM CHITIETPHIEU WHERE MaMon = @maMon`);
        if (checkResult.recordset[0].count > 0) {
            return res.status(400).json({ success: false, message: 'Món đã có trong phiếu, không thể xóa!' });
        }
        await pool.request()
            .input('maMon', sql.NVarChar, maMon)
            .query(`DELETE FROM MONAN WHERE MaMon = @maMon`);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ==================== API NHÂN VIÊN ====================
app.get('/api/nhanvien', async (req, res) => {
    try {
        if (!pool) await connectDB();
        const result = await pool.request().query(`
            SELECT MaNV, HoTen, SDT, TenDangNhap, VaiTro 
            FROM NHANVIEN
            ORDER BY MaNV
        `);
        res.json(result.recordset);
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: err.message }); 
    }
});

app.post('/api/nhanvien', async (req, res) => {
    const { HoTen, SDT, TenDangNhap, MatKhau, VaiTro } = req.body;
    try {
        if (!pool) await connectDB();
        const maxResult = await pool.request().query(`
            SELECT TOP 1 MaNV FROM NHANVIEN WHERE MaNV LIKE 'NV%' ORDER BY CAST(REPLACE(MaNV, 'NV', '') AS INT) DESC
        `);
        let newNumber = 1;
        if (maxResult.recordset.length > 0) {
            const lastNumber = parseInt(maxResult.recordset[0].MaNV.replace('NV', ''));
            if (!isNaN(lastNumber)) newNumber = lastNumber + 1;
        }
        const maNV = 'NV' + String(newNumber).padStart(2, '0');
        
        await pool.request()
            .input('maNV', sql.NVarChar, maNV)
            .input('hoTen', sql.NVarChar, HoTen)
            .input('sdt', sql.NVarChar, SDT)
            .input('tenDangNhap', sql.NVarChar, TenDangNhap)
            .input('matKhau', sql.NVarChar, MatKhau || '123456')
            .input('vaiTro', sql.NVarChar, VaiTro || 'Nhân viên')
            .query(`
                INSERT INTO NHANVIEN (MaNV, HoTen, SDT, TenDangNhap, MatKhau, VaiTro)
                VALUES (@maNV, @hoTen, @sdt, @tenDangNhap, @matKhau, @vaiTro)
            `);
        res.json({ success: true, maNV: maNV });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/nhanvien/:maNV', async (req, res) => {
    const { maNV } = req.params;
    try {
        if (!pool) await connectDB();
        await pool.request()
            .input('maNV', sql.NVarChar, maNV)
            .query(`DELETE FROM NHANVIEN WHERE MaNV = @maNV`);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/nhanvien/:maNV/username', async (req, res) => {
    const { maNV } = req.params;
    const { TenDangNhap } = req.body;
    try {
        if (!pool) await connectDB();
        await pool.request()
            .input('maNV', sql.NVarChar, maNV)
            .input('tenDangNhap', sql.NVarChar, TenDangNhap)
            .query(`UPDATE NHANVIEN SET TenDangNhap = @tenDangNhap WHERE MaNV = @maNV`);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/nhanvien/:maNV/password', async (req, res) => {
    const { maNV } = req.params;
    const { MatKhau } = req.body;
    try {
        if (!pool) await connectDB();
        await pool.request()
            .input('maNV', sql.NVarChar, maNV)
            .input('matKhau', sql.NVarChar, MatKhau)
            .query(`UPDATE NHANVIEN SET MatKhau = @matKhau WHERE MaNV = @maNV`);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ==================== API ĐĂNG NHẬP ====================
app.post('/api/login', async (req, res) => {
    const { username, password, role } = req.body;
    try {
        if (!pool) await connectDB();
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .input('password', sql.NVarChar, password)
            .input('role', sql.NVarChar, role === 'quantri' ? 'Quản lý' : 'Nhân viên')
            .query(`
                SELECT MaNV, HoTen, VaiTro 
                FROM NHANVIEN 
                WHERE TenDangNhap = @username AND MatKhau = @password AND VaiTro = @role
            `);
        
        if (result.recordset.length > 0) {
            res.json({ success: true, user: result.recordset[0] });
        } else {
            res.json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' });
        }
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: err.message }); 
    }
});

// ==================== API PHIẾU GỌI MÓN ====================
app.get('/api/phieu/:maBan', async (req, res) => {
    const { maBan } = req.params;
    try {
        if (!pool) await connectDB();
        
        const phieuResult = await pool.request()
            .input('maBan', sql.NVarChar, maBan)
            .query(`
                SELECT MaPhieu, TrangThaiPhieu, ISNULL(GhiChu, '') as GhiChu 
                FROM PHIEUGOIMON 
                WHERE MaBan = @maBan 
                AND TrangThaiPhieu IN (N'Đang xử lý', N'Đã phục vụ')
                AND NOT EXISTS (SELECT 1 FROM HOADON WHERE MaPhieu = PHIEUGOIMON.MaPhieu)
                ORDER BY ThoiGianGoiMon DESC
            `);
        
        if (phieuResult.recordset.length === 0) {
            return res.json({ hasPhieu: false });
        }
        
        const maPhieu = phieuResult.recordset[0].MaPhieu;
        const ghiChu = phieuResult.recordset[0].GhiChu || '';
        const trangThai = phieuResult.recordset[0].TrangThaiPhieu;
        
        const ctResult = await pool.request()
            .input('maPhieu', sql.NVarChar, maPhieu)
            .query(`
                SELECT ct.MaMon, ct.SoLuong, ct.DonGia, m.TenMon
                FROM CHITIETPHIEU ct
                JOIN MONAN m ON ct.MaMon = m.MaMon
                WHERE ct.MaPhieu = @maPhieu
            `);
        
        res.json({
            hasPhieu: true,
            maPhieu: maPhieu,
            trangThai: trangThai,
            ghiChu: ghiChu,
            items: ctResult.recordset
        });
    } catch (err) { 
        console.error('Lỗi GET /api/phieu:', err);
        res.status(500).json({ error: err.message }); 
    }
});

app.post('/api/phieu', async (req, res) => {
    const { maBan, maNV } = req.body;
    console.log('📝 Tạo phiếu mới:', { maBan, maNV });
    
    try {
        if (!pool) await connectDB();
        
        const banCheck = await pool.request()
            .input('maBan', sql.NVarChar, maBan)
            .query(`SELECT MaBan, TenBan FROM BANAN WHERE MaBan = @maBan`);
        
        if (banCheck.recordset.length === 0) {
            return res.status(400).json({ success: false, error: 'Bàn không tồn tại!' });
        }
        
        const checkResult = await pool.request()
            .input('maBan', sql.NVarChar, maBan)
            .query(`
                SELECT pg.MaPhieu, pg.TrangThaiPhieu 
                FROM PHIEUGOIMON pg
                WHERE pg.MaBan = @maBan 
                AND pg.TrangThaiPhieu IN (N'Đang xử lý', N'Đã phục vụ')
                AND NOT EXISTS (SELECT 1 FROM HOADON WHERE MaPhieu = pg.MaPhieu)
            `);
        
        if (checkResult.recordset.length > 0) {
            return res.json({ success: true, maPhieu: checkResult.recordset[0].MaPhieu, existed: true });
        }
        
        const maxResult = await pool.request().query(`
            SELECT TOP 1 MaPhieu FROM PHIEUGOIMON 
            WHERE MaPhieu LIKE 'PG%' 
            ORDER BY CAST(REPLACE(MaPhieu, 'PG', '') AS INT) DESC
        `);
        
        let newNumber = 1;
        if (maxResult.recordset.length > 0) {
            const lastNumber = parseInt(maxResult.recordset[0].MaPhieu.replace('PG', ''));
            if (!isNaN(lastNumber)) newNumber = lastNumber + 1;
        }
        const maPhieu = 'PG' + String(newNumber).padStart(2, '0');
        
        await pool.request()
            .input('maPhieu', sql.NVarChar, maPhieu)
            .input('maBan', sql.NVarChar, maBan)
            .input('maNV', sql.NVarChar, maNV || 'NV02')
            .query(`
                INSERT INTO PHIEUGOIMON (MaPhieu, MaBan, MaNV, TrangThaiPhieu, ThoiGianGoiMon, GhiChu)
                VALUES (@maPhieu, @maBan, @maNV, N'Đang xử lý', GETDATE(), N'')
            `);
        
        res.json({ success: true, maPhieu: maPhieu, existed: false });
        
    } catch (err) { 
        console.error('❌ Lỗi tạo phiếu:', err);
        res.status(500).json({ success: false, error: err.message }); 
    }
});

app.post('/api/chitietphieu', async (req, res) => {
    const { maPhieu, maMon, soLuong, donGia } = req.body;
    try {
        if (!pool) await connectDB();
        
        const check = await pool.request()
            .input('maPhieu', sql.NVarChar, maPhieu)
            .input('maMon', sql.NVarChar, maMon)
            .query(`SELECT SoLuong FROM CHITIETPHIEU WHERE MaPhieu = @maPhieu AND MaMon = @maMon`);
        
        if (check.recordset.length > 0) {
            const newSL = check.recordset[0].SoLuong + soLuong;
            await pool.request()
                .input('maPhieu', sql.NVarChar, maPhieu)
                .input('maMon', sql.NVarChar, maMon)
                .input('soLuong', sql.Int, newSL)
                .query(`UPDATE CHITIETPHIEU SET SoLuong = @soLuong WHERE MaPhieu = @maPhieu AND MaMon = @maMon`);
        } else {
            await pool.request()
                .input('maPhieu', sql.NVarChar, maPhieu)
                .input('maMon', sql.NVarChar, maMon)
                .input('soLuong', sql.Int, soLuong)
                .input('donGia', sql.Decimal(18,2), donGia)
                .query(`INSERT INTO CHITIETPHIEU (MaPhieu, MaMon, SoLuong, DonGia) VALUES (@maPhieu, @maMon, @soLuong, @donGia)`);
        }
        res.json({ success: true });
    } catch (err) { 
        console.error('❌ Lỗi thêm món:', err);
        res.status(500).json({ error: err.message }); 
    }
});

app.put('/api/phieu/:maPhieu/status', async (req, res) => {
    const { maPhieu } = req.params;
    const { trangThai } = req.body;
    try {
        if (!pool) await connectDB();
        const trangThaiText = trangThai === 'served' ? 'Đã phục vụ' : (trangThai === 'closed' ? 'Đã đóng' : 'Đang xử lý');
        await pool.request()
            .input('maPhieu', sql.NVarChar, maPhieu)
            .input('trangThai', sql.NVarChar, trangThaiText)
            .query(`UPDATE PHIEUGOIMON SET TrangThaiPhieu = @trangThai WHERE MaPhieu = @maPhieu`);
        res.json({ success: true });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: err.message }); 
    }
});

app.put('/api/phieu/:maPhieu/ghichu', async (req, res) => {
    const { maPhieu } = req.params;
    const { ghiChu } = req.body;
    try {
        if (!pool) await connectDB();
        await pool.request()
            .input('maPhieu', sql.NVarChar, maPhieu)
            .input('ghiChu', sql.NVarChar, ghiChu || '')
            .query(`UPDATE PHIEUGOIMON SET GhiChu = @ghiChu WHERE MaPhieu = @maPhieu`);
        res.json({ success: true });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: err.message }); 
    }
});

app.delete('/api/phieu/:maPhieu', async (req, res) => {
    const { maPhieu } = req.params;
    try {
        if (!pool) await connectDB();
        await pool.request()
            .input('maPhieu', sql.NVarChar, maPhieu)
            .query(`DELETE FROM CHITIETPHIEU WHERE MaPhieu = @maPhieu`);
        await pool.request()
            .input('maPhieu', sql.NVarChar, maPhieu)
            .query(`DELETE FROM PHIEUGOIMON WHERE MaPhieu = @maPhieu`);
        res.json({ success: true });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: err.message }); 
    }
});

app.get('/api/chitietphieu/:maPhieu', async (req, res) => {
    const { maPhieu } = req.params;
    try {
        if (!pool) await connectDB();
        const result = await pool.request()
            .input('maPhieu', sql.NVarChar, maPhieu)
            .query(`
                SELECT ct.MaMon, ct.SoLuong, ct.DonGia, m.TenMon
                FROM CHITIETPHIEU ct
                JOIN MONAN m ON ct.MaMon = m.MaMon
                WHERE ct.MaPhieu = @maPhieu
            `);
        res.json(result.recordset);
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: err.message }); 
    }
});

// ==================== API THANH TOÁN ====================
app.post('/api/thanhtoan', async (req, res) => {
    const { maPhieu, maNV, tongTien, phuongThuc, soTienKhachDua, tienThua } = req.body;
    try {
        if (!pool) await connectDB();
        
        const maxResult = await pool.request().query(`
            SELECT TOP 1 MaHD FROM HOADON 
            WHERE MaHD LIKE 'HD%' 
            ORDER BY CAST(REPLACE(MaHD, 'HD', '') AS INT) DESC
        `);
        let newNumber = 1;
        if (maxResult.recordset.length > 0) {
            const lastNumber = parseInt(maxResult.recordset[0].MaHD.replace('HD', ''));
            if (!isNaN(lastNumber)) newNumber = lastNumber + 1;
        }
        const maHD = 'HD' + String(newNumber).padStart(2, '0');
        
        await pool.request()
            .input('maHD', sql.NVarChar, maHD)
            .input('maPhieu', sql.NVarChar, maPhieu)
            .input('maNV', sql.NVarChar, maNV || 'NV02')
            .input('tongTien', sql.Decimal(18,2), tongTien)
            .input('phuongThuc', sql.NVarChar, phuongThuc)
            .input('soTienKhachDua', sql.Decimal(18,2), soTienKhachDua || 0)
            .input('tienThua', sql.Decimal(18,2), tienThua || 0)
            .query(`
                INSERT INTO HOADON (MaHD, MaPhieu, MaNV, TongTien, PhuongThucThanhToan, SoTienKhachDua, TienThua, TrangThaiHoaDon, ThoiGianThanhToan)
                VALUES (@maHD, @maPhieu, @maNV, @tongTien, @phuongThuc, @soTienKhachDua, @tienThua, N'Đã thanh toán', GETDATE())
            `);
        
        res.json({ success: true, maHD: maHD });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: err.message }); 
    }
});

app.get('/api/hoadon', async (req, res) => {
    try {
        if (!pool) await connectDB();
        const result = await pool.request().query(`
            SELECT 
                hd.MaHD,
                hd.MaPhieu,
                hd.MaNV,
                hd.ThoiGianThanhToan,
                hd.TongTien,
                hd.PhuongThucThanhToan,
                b.TenBan
            FROM HOADON hd
            JOIN PHIEUGOIMON pg ON hd.MaPhieu = pg.MaPhieu
            JOIN BANAN b ON pg.MaBan = b.MaBan
            ORDER BY hd.ThoiGianThanhToan DESC
        `);
        res.json(result.recordset);
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: err.message }); 
    }
});

// ==================== API TRA CỨU PHIẾU ====================
app.get('/api/tracuu/phieu/:maPhieu', async (req, res) => {
    const { maPhieu } = req.params;
    console.log('🔍 Tra cứu phiếu:', maPhieu);
    
    try {
        if (!pool) await connectDB();
        
        const phieuResult = await pool.request()
            .input('maPhieu', sql.NVarChar, maPhieu)
            .query(`
                SELECT 
                    pg.MaPhieu,
                    pg.ThoiGianGoiMon,
                    pg.TrangThaiPhieu,
                    ISNULL(pg.GhiChu, '') as GhiChu,
                    b.TenBan,
                    nv.HoTen as TenNV
                FROM PHIEUGOIMON pg
                JOIN BANAN b ON pg.MaBan = b.MaBan
                JOIN NHANVIEN nv ON pg.MaNV = nv.MaNV
                WHERE pg.MaPhieu = @maPhieu
            `);
        
        if (phieuResult.recordset.length === 0) {
            return res.json({ success: false, message: 'Không tìm thấy phiếu' });
        }
        
        const ctResult = await pool.request()
            .input('maPhieu', sql.NVarChar, maPhieu)
            .query(`
                SELECT ct.MaMon, ct.SoLuong, ct.DonGia, m.TenMon
                FROM CHITIETPHIEU ct
                JOIN MONAN m ON ct.MaMon = m.MaMon
                WHERE ct.MaPhieu = @maPhieu
            `);
        
        res.json({
            success: true,
            phieu: phieuResult.recordset[0],
            items: ctResult.recordset
        });
    } catch (err) {
        console.error('❌ Lỗi tra cứu phiếu:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==================== API TRA CỨU HÓA ĐƠN ====================
app.get('/api/tracuu/hoadon/:maHD', async (req, res) => {
    const { maHD } = req.params;
    console.log('🔍 Tra cứu hóa đơn:', maHD);
    
    try {
        if (!pool) await connectDB();
        
        const hdResult = await pool.request()
            .input('maHD', sql.NVarChar, maHD)
            .query(`
                SELECT 
                    hd.MaHD,
                    hd.ThoiGianThanhToan,
                    hd.TongTien,
                    hd.PhuongThucThanhToan,
                    hd.SoTienKhachDua,
                    hd.TienThua,
                    b.TenBan,
                    nv.HoTen as TenNV,
                    hd.MaPhieu
                FROM HOADON hd
                JOIN PHIEUGOIMON pg ON hd.MaPhieu = pg.MaPhieu
                JOIN BANAN b ON pg.MaBan = b.MaBan
                JOIN NHANVIEN nv ON hd.MaNV = nv.MaNV
                WHERE hd.MaHD = @maHD
            `);
        
        if (hdResult.recordset.length === 0) {
            return res.json({ success: false, message: 'Không tìm thấy hóa đơn' });
        }
        
        const maPhieu = hdResult.recordset[0].MaPhieu;
        const ctResult = await pool.request()
            .input('maPhieu', sql.NVarChar, maPhieu)
            .query(`
                SELECT ct.MaMon, ct.SoLuong, ct.DonGia, m.TenMon
                FROM CHITIETPHIEU ct
                JOIN MONAN m ON ct.MaMon = m.MaMon
                WHERE ct.MaPhieu = @maPhieu
            `);
        
        res.json({
            success: true,
            hoadon: hdResult.recordset[0],
            items: ctResult.recordset
        });
    } catch (err) {
        console.error('❌ Lỗi tra cứu hóa đơn:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==================== API LẤY TẤT CẢ PHIẾU (CHO QUẢN LÝ) ====================
app.get('/api/phieuall', async (req, res) => {
    try {
        if (!pool) await connectDB();
        const result = await pool.request().query(`
            SELECT 
                pg.MaPhieu,
                pg.ThoiGianGoiMon,
                pg.TrangThaiPhieu,
                ISNULL(pg.GhiChu, '') as GhiChu,
                pg.MaBan,
                pg.MaNV,
                b.TenBan,
                nv.HoTen as TenNV
            FROM PHIEUGOIMON pg
            LEFT JOIN BANAN b ON pg.MaBan = b.MaBan
            LEFT JOIN NHANVIEN nv ON pg.MaNV = nv.MaNV
            ORDER BY pg.ThoiGianGoiMon DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Lỗi GET /api/phieuall:', err);
        res.status(500).json({ error: err.message });
    }
});

// ==================== API ĐỔI MẬT KHẨU ====================
app.put('/api/change-password', async (req, res) => {
    const { maNV, oldPassword, newPassword } = req.body;
    try {
        if (!pool) await connectDB();
        
        const checkResult = await pool.request()
            .input('maNV', sql.NVarChar, maNV)
            .input('oldPassword', sql.NVarChar, oldPassword)
            .query(`SELECT MaNV FROM NHANVIEN WHERE MaNV = @maNV AND MatKhau = @oldPassword`);
        
        if (checkResult.recordset.length === 0) {
            return res.json({ success: false, message: 'Mật khẩu cũ không đúng!' });
        }
        
        await pool.request()
            .input('maNV', sql.NVarChar, maNV)
            .input('newPassword', sql.NVarChar, newPassword)
            .query(`UPDATE NHANVIEN SET MatKhau = @newPassword WHERE MaNV = @maNV`);
        
        res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ==================== KHỞI ĐỘNG SERVER ====================
async function startServer() {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`\n🚀 Server chạy tại: http://localhost:${PORT}`);
        console.log(`📋 API Test: http://localhost:${PORT}/api/test`);
        console.log(`🔍 API Tra cứu phiếu: http://localhost:${PORT}/api/tracuu/phieu/PG01`);
        console.log(`🧾 API Tra cứu hóa đơn: http://localhost:${PORT}/api/tracuu/hoadon/HD01`);
        console.log(`📊 API Món ăn: http://localhost:${PORT}/api/monan`);
        console.log(`🪑 API Bàn ăn: http://localhost:${PORT}/api/banan`);
        console.log(`👥 API Nhân viên: http://localhost:${PORT}/api/nhanvien`);
        console.log(`📝 API Tạo phiếu: POST http://localhost:${PORT}/api/phieu`);
        console.log(`📋 API Tất cả phiếu: http://localhost:${PORT}/api/phieuall\n`);
    });
}

startServer();