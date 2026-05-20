USE master;
GO

IF EXISTS (SELECT * FROM sys.databases WHERE name = 'QuanLyQuanCom')
BEGIN
    ALTER DATABASE QuanLyQuanCom SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE QuanLyQuanCom;
END
GO

CREATE DATABASE QuanLyQuanCom;
GO

USE QuanLyQuanCom;
GO

-- =========================
-- BẢNG DANH MỤC MÓN ĂN
-- =========================
CREATE TABLE DANHMUCMONAN (
    MaDanhMuc VARCHAR(10) PRIMARY KEY,
    TenDanhMuc NVARCHAR(100) NOT NULL
);

-- =========================
-- BẢNG MÓN ĂN
-- =========================
CREATE TABLE MONAN (
    MaMon VARCHAR(10) PRIMARY KEY,
    TenMon NVARCHAR(100) NOT NULL,
    DonGia DECIMAL(18,2) NOT NULL,
    MoTa NVARCHAR(255),
    TrangThaiMon NVARCHAR(20) NOT NULL,
    MaDanhMuc VARCHAR(10) NOT NULL,

    CONSTRAINT FK_MONAN_DANHMUC
        FOREIGN KEY (MaDanhMuc)
        REFERENCES DANHMUCMONAN(MaDanhMuc),

    CONSTRAINT CK_MONAN_TRANGTHAI
        CHECK (TrangThaiMon IN (N'Còn bán', N'Ngừng bán')),

    CONSTRAINT CK_MONAN_DONGIA
        CHECK (DonGia >= 0)
);

-- =========================
-- BẢNG BÀN ĂN
-- =========================
CREATE TABLE BANAN (
    MaBan VARCHAR(10) PRIMARY KEY,
    TenBan NVARCHAR(50) NOT NULL,
    SoChoNgoi INT NOT NULL,
    TrangThaiBan NVARCHAR(30) NOT NULL,

    CONSTRAINT CK_BANAN_SOCHONGOI
        CHECK (SoChoNgoi > 0),

    CONSTRAINT CK_BANAN_TRANGTHAI
        CHECK (TrangThaiBan IN (N'Trống', N'Đang phục vụ'))
);

-- =========================
-- BẢNG NHÂN VIÊN
-- =========================
CREATE TABLE NHANVIEN (
    MaNV VARCHAR(10) PRIMARY KEY,
    HoTen NVARCHAR(100) NOT NULL,
    SDT VARCHAR(15) NOT NULL,
    TenDangNhap VARCHAR(50) NOT NULL UNIQUE,
    MatKhau VARCHAR(100) NOT NULL,
    VaiTro NVARCHAR(30) NOT NULL,

    CONSTRAINT CK_NHANVIEN_VAITRO
        CHECK (VaiTro IN (N'Nhân viên', N'Quản lý'))
);

-- =========================
-- BẢNG PHIẾU GỌI MÓN
-- =========================
CREATE TABLE PHIEUGOIMON (
    MaPhieu VARCHAR(10) PRIMARY KEY,
    ThoiGianGoiMon DATETIME NOT NULL DEFAULT GETDATE(),
    TrangThaiPhieu NVARCHAR(30) NOT NULL,
    GhiChu NVARCHAR(255),

    MaBan VARCHAR(10) NOT NULL,
    MaNV VARCHAR(10) NOT NULL,

    CONSTRAINT FK_PHIEU_BANAN
        FOREIGN KEY (MaBan)
        REFERENCES BANAN(MaBan),

    CONSTRAINT FK_PHIEU_NHANVIEN
        FOREIGN KEY (MaNV)
        REFERENCES NHANVIEN(MaNV),

    CONSTRAINT CK_PHIEU_TRANGTHAI
        CHECK (TrangThaiPhieu IN (N'Đang xử lý', N'Đã phục vụ'))
);

-- =========================
-- BẢNG CHI TIẾT PHIẾU
-- =========================
CREATE TABLE CHITIETPHIEU (
    MaPhieu VARCHAR(10) NOT NULL,
    MaMon VARCHAR(10) NOT NULL,
    SoLuong INT NOT NULL,
    DonGia DECIMAL(18,2) NOT NULL,

    PRIMARY KEY (MaPhieu, MaMon),

    CONSTRAINT FK_CTPHIEU_PHIEU
        FOREIGN KEY (MaPhieu)
        REFERENCES PHIEUGOIMON(MaPhieu),

    CONSTRAINT FK_CTPHIEU_MONAN
        FOREIGN KEY (MaMon)
        REFERENCES MONAN(MaMon),

    CONSTRAINT CK_CTPHIEU_SOLUONG
        CHECK (SoLuong > 0),

    CONSTRAINT CK_CTPHIEU_DONGIA
        CHECK (DonGia >= 0)
);

-- =========================
-- BẢNG HÓA ĐƠN
-- =========================
CREATE TABLE HOADON (
    MaHD VARCHAR(10) PRIMARY KEY,
    ThoiGianThanhToan DATETIME NOT NULL DEFAULT GETDATE(),
    TongTien DECIMAL(18,2) NOT NULL,
    PhuongThucThanhToan NVARCHAR(30) NOT NULL,
    SoTienKhachDua DECIMAL(18,2) NOT NULL,
    TienThua DECIMAL(18,2) NOT NULL,
    TrangThaiHoaDon NVARCHAR(30) NOT NULL,

    MaPhieu VARCHAR(10) NOT NULL UNIQUE,
    MaNV VARCHAR(10) NOT NULL,

    CONSTRAINT FK_HOADON_PHIEU
        FOREIGN KEY (MaPhieu)
        REFERENCES PHIEUGOIMON(MaPhieu),

    CONSTRAINT FK_HOADON_NHANVIEN
        FOREIGN KEY (MaNV)
        REFERENCES NHANVIEN(MaNV),

    CONSTRAINT CK_HOADON_TONGTIEN
        CHECK (TongTien >= 0),

    CONSTRAINT CK_HOADON_TIENKHACHDUA
        CHECK (SoTienKhachDua >= 0),

    CONSTRAINT CK_HOADON_TIENTHUA
        CHECK (TienThua >= 0),

    CONSTRAINT CK_HOADON_PHUONGTHUC
        CHECK (PhuongThucThanhToan IN 
        (N'Tiền mặt', N'Chuyển khoản', N'Thẻ')),

    CONSTRAINT CK_HOADON_TRANGTHAI
        CHECK (TrangThaiHoaDon IN 
        (N'Chưa thanh toán', N'Đã thanh toán'))
);
-- =========================
-- THÊM DỮ LIỆU MẪU
-- =========================

-- DANH MỤC MÓN ĂN

INSERT INTO DANHMUCMONAN (MaDanhMuc, TenDanhMuc) VALUES
('DM01', N'Món chính'),
('DM02', N'Món gọi thêm'),
('DM03', N'Đồ uống');

-- MÓN ĂN

INSERT INTO MONAN (MaMon, TenMon, DonGia, MoTa, TrangThaiMon, MaDanhMuc) VALUES
('MA01', N'Cơm thố xá xíu', 50000, N'Cơm thố xá xíu', N'Còn bán', 'DM01'),
('MA02', N'Cơm thố bò', 55000, N'Cơm thố bò', N'Còn bán', 'DM01'),
('MA03', N'Cơm thố gà nướng', 50000, N'Cơm thố gà nướng', N'Còn bán', 'DM01'),
('MA04', N'Cơm thố sườn nướng', 55000, N'Cơm thố sườn nướng', N'Còn bán', 'DM01'),
('MA05', N'Cơm thố đùi gà quay', 50000, N'Cơm thố đùi gà quay', N'Còn bán', 'DM01'),
('MA06', N'Cơm thố gà truyền thống', 50000, N'Cơm thố gà truyền thống', N'Còn bán', 'DM01'),
('MA07', N'Cơm thố gà & xá xíu', 55000, N'Cơm thố gà và xá xíu', N'Còn bán', 'DM01'),
('MA08', N'Cơm thố bò & xá xíu', 60000, N'Cơm thố bò và xá xíu', N'Còn bán', 'DM01'),
('MA09', N'Cơm thố bò & gà', 60000, N'Cơm thố bò và gà', N'Còn bán', 'DM01'),
('MA10', N'Cơm thố đặc biệt', 70000, N'Cơm thố đặc biệt', N'Còn bán', 'DM01'),
('MA11', N'Cơm thố Dương Châu', 40000, N'Cơm chiên Dương Châu', N'Ngừng bán', 'DM01'),
('MA12', N'Cơm thố trứng', 35000, N'Cơm thố trứng', N'Còn bán', 'DM01'),

('MA13', N'Bò xào', 50000, N'Bò xào gọi thêm', N'Còn bán', 'DM02'),
('MA14', N'Gà nướng', 50000, N'Gà nướng gọi thêm', N'Còn bán', 'DM02'),
('MA15', N'Đùi gà quay', 25000, N'Đùi gà quay gọi thêm', N'Còn bán', 'DM02'),
('MA16', N'Xá xíu', 35000, N'Xá xíu gọi thêm', N'Còn bán', 'DM02'),
('MA17', N'Thố cơm thêm', 25000, N'Cơm thêm', N'Còn bán', 'DM02'),
('MA18', N'Trứng ốp la', 10000, N'Trứng ốp la', N'Còn bán', 'DM02'),
('MA19', N'Kim chi', 5000, N'Kim chi ăn kèm', N'Còn bán', 'DM02'),

('MA20', N'Trà chanh', 20000, N'Trà chanh', N'Còn bán', 'DM03'),
('MA21', N'Trà tắc', 20000, N'Trà tắc', N'Còn bán', 'DM03'),
('MA22', N'Bia Sài Gòn', 20000, N'Bia Sài Gòn lon', N'Ngừng bán', 'DM03'),
('MA23', N'Bia Hà Nội', 20000, N'Bia Hà Nội lon', N'Còn bán', 'DM03'),
('MA24', N'Red Bull', 20000, N'Nước tăng lực Red Bull', N'Còn bán', 'DM03'),
('MA25', N'Coca Cola', 18000, N'Coca Cola lon', N'Còn bán', 'DM03'),
('MA26', N'Nước suối', 12000, N'Nước suối', N'Còn bán', 'DM03'),
('MA27', N'Nước cam', 18000, N'Nước cam ép', N'Còn bán', 'DM03');

-- BÀN ĂN

INSERT INTO BANAN (MaBan, TenBan, SoChoNgoi, TrangThaiBan) VALUES
('B01', N'Bàn 1', 4, N'Trống'),
('B02', N'Bàn 2', 4, N'Trống'),
('B03', N'Bàn 3', 4, N'Trống'),
('B04', N'Bàn 4', 4, N'Trống'),
('B05', N'Bàn 5', 6, N'Trống'),
('B06', N'Bàn 6', 6, N'Đang phục vụ'),
('B07', N'Bàn 7', 6, N'Trống'),
('B08', N'Bàn 8', 8, N'Trống'),
('B09', N'Bàn 9', 8, N'Đang phục vụ'),
('B10', N'Bàn 10', 2, N'Trống'),
('B11', N'Bàn 11', 2, N'Trống'),
('B12', N'Bàn 12', 2, N'Đang phục vụ'),
('B13', N'Bàn 13', 4, N'Trống'),       
('B14', N'Bàn 14', 4, N'Đang phục vụ'),       
('B15', N'Bàn 15', 10, N'Trống');

-- NHÂN VIÊN

INSERT INTO NHANVIEN 
(MaNV, HoTen, SDT, TenDangNhap, MatKhau, VaiTro) 
VALUES
('NV01', N'Nguyễn Minh Anh', '0912345678', 'admin', '123456', N'Quản lý'),

('NV02', N'Trần Thu Hà', '0988888888', 'nhanvien01', '123456', N'Nhân viên'),

('NV03', N'Lê Quốc Bảo', '0977777777', 'nhanvien02', '123456', N'Nhân viên'),

('NV04', N'Phạm Gia Hưng', '0966666666', 'nhanvien03', '123456', N'Nhân viên'),

('NV05', N'Đỗ Khánh Linh', '0955555555', 'nhanvien04', '123456', N'Nhân viên'),

('NV06', N'Hoàng Đức Nam', '0944444444', 'nhanvien05', '123456', N'Nhân viên');



---PHIEUGOIMON---

INSERT INTO PHIEUGOIMON (MaPhieu, ThoiGianGoiMon, TrangThaiPhieu, GhiChu, MaBan, MaNV) VALUES
('PG01', '2026-05-01 11:00', N'Đã phục vụ', N'Ít cay', 'B02', 'NV02'),
('PG02', '2026-05-01 11:30', N'Đã phục vụ', NULL, 'B04', 'NV03'),
('PG03', '2026-05-01 12:00', N'Đang xử lý', N'Không hành', 'B06', 'NV04'),
('PG04', '2026-05-01 18:15', N'Đã phục vụ', NULL, 'B07', 'NV05'),
('PG05', '2026-05-01 19:00', N'Đang xử lý', N'Ít cơm', 'B09', 'NV06'),
('PG06', '2026-05-02 08:30', N'Đã phục vụ', NULL, 'B10', 'NV02'),
('PG07', '2026-05-02 09:00', N'Đang xử lý', N'Thêm đá', 'B12', 'NV03'),
('PG08', '2026-05-02 12:00', N'Đã phục vụ', N'Giao nhanh', 'B13', 'NV04'),
('PG09', '2026-05-02 12:15', N'Đang xử lý', NULL, 'B14', 'NV05');

-- CHI TIẾT PHIẾU GỌI MÓN (Logic với Phiếu gọi món)

INSERT INTO CHITIETPHIEU (MaPhieu, MaMon, SoLuong, DonGia) VALUES
('PG01', 'MA01', 2, 50000), 
('PG01', 'MA19', 1, 5000),  
('PG01', 'MA21', 2, 20000), 
('PG02', 'MA02', 2, 55000), 
('PG02', 'MA04', 1, 55000), 
('PG02', 'MA25', 3, 18000), 
('PG03', 'MA10', 4, 70000), 
('PG03', 'MA26', 4, 12000), 
('PG04', 'MA05', 3, 50000), 
('PG04', 'MA07', 2, 55000),
('PG04', 'MA20', 5, 20000), 
('PG05', 'MA08', 2, 60000), 
('PG05', 'MA18', 2, 10000), 
('PG05', 'MA27', 2, 18000), 
('PG06', 'MA12', 1, 35000), 
('PG06', 'MA20', 1, 20000), 
('PG07', 'MA01', 1, 50000), 
('PG07', 'MA21', 1, 20000), 
('PG08', 'MA03', 2, 50000), 
('PG08', 'MA15', 1, 25000), 
('PG08', 'MA25', 2, 18000), 
('PG09', 'MA04', 2, 55000), 
('PG09', 'MA24', 2, 20000); 

--  BẢNG HÓA ĐƠN

INSERT INTO HOADON (MaHD, ThoiGianThanhToan, TongTien, PhuongThucThanhToan, SoTienKhachDua, TienThua, TrangThaiHoaDon, MaPhieu, MaNV) VALUES
('HD01', '2026-05-01 12:00', 145000, N'Tiền mặt', 200000, 55000, N'Đã thanh toán', 'PG01', 'NV02'),
('HD02', '2026-05-01 12:45', 219000, N'Chuyển khoản', 219000, 0, N'Đã thanh toán', 'PG02', 'NV03'),
('HD03', '2026-05-01 19:30', 360000, N'Thẻ', 360000, 0, N'Đã thanh toán', 'PG04', 'NV05'),
('HD04', '2026-05-02 09:30', 55000, N'Tiền mặt', 100000, 45000, N'Đã thanh toán', 'PG06', 'NV02'),
('HD05', '2026-05-02 13:00', 161000, N'Chuyển khoản', 161000, 0, N'Đã thanh toán', 'PG08', 'NV04');