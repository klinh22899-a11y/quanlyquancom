USE QuanLyQuanCom 
GO
CREATE PROCEDURE sp_ThemMonAn
    @MaMon VARCHAR(10),
    @TenMon NVARCHAR(100),
    @DonGia DECIMAL(18,2),
    @MoTa NVARCHAR(255),
    @TrangThaiMon NVARCHAR(20),
    @MaDanhMuc VARCHAR(10)
AS
BEGIN
    IF NOT EXISTS (SELECT 1 FROM DANHMUCMONAN WHERE MaDanhMuc = @MaDanhMuc)
    BEGIN
        PRINT N'Lỗi: Mã danh mục không tồn tại!';
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM MONAN WHERE MaMon = @MaMon)
    BEGIN
        PRINT N'Lỗi: Mã món ăn đã tồn tại!';
        RETURN;
    END

    INSERT INTO MONAN (MaMon, TenMon, DonGia, MoTa, TrangThaiMon, MaDanhMuc)
    VALUES (@MaMon, @TenMon, @DonGia, @MoTa, @TrangThaiMon, @MaDanhMuc);

	SELECT MaMon, TenMon, DonGia, MoTa, TrangThaiMon, MaDanhMuc
	FROM MONAN
	WHERE MaMon = @MaMon

    PRINT N'Thêm món ăn thành công!';
END;
GO

EXEC sp_ThemMonAn 
    @MaMon = 'MA28', 
    @TenMon = N'Cơm thố sườn bì chả', 
    @DonGia = 65000, 
    @MoTa = N'Cơm thố sườn bì chả đặc biệt', 
    @TrangThaiMon = N'Còn bán', 
    @MaDanhMuc = 'DM01';

-- Tạo thủ tục lập bảng  báo cáo các món ăn được sử dụng được trong ngày 
-- với ngày được nhập vào từ bàn phím. 
	ALTER PROCEDURE sp_BaoCaoMonAnTrongNgay
    @NgayBaoCao DATE = NULL -- Nếu để trống, thủ tục sẽ tự lấy ngày hôm nay
AS
BEGIN
    IF @NgayBaoCao IS NULL
    BEGIN
        SET @NgayBaoCao = CAST(GETDATE() AS DATE);
    END
    -- Truy vấn thống kê số lượng món ăn và doanh thu chi tiết từng món
    SELECT 
        m.MaMon AS [Mã Món],
        m.TenMon AS [Tên Món ĂN],
        dm.TenDanhMuc AS [Danh Mục],
        SUM(ct.SoLuong) AS [Tổng Số Lượng Đã Bán],
        m.DonGia AS [Đơn Giá Hiện Tại],
        SUM(ct.SoLuong * ct.DonGia) AS [Tổng Doanh Thu Món]
    FROM HOADON hd
    INNER JOIN CHITIETPHIEU ct ON hd.MaPhieu = ct.MaPhieu
    INNER JOIN MONAN m ON ct.MaMon = m.MaMon
    INNER JOIN DANHMUCMONAN dm ON m.MaDanhMuc = dm.MaDanhMuc
    WHERE CAST(hd.ThoiGianThanhToan AS DATE) = @NgayBaoCao
      AND hd.TrangThaiHoaDon = N'Đã thanh toán'
    GROUP BY m.MaMon, m.TenMon, dm.TenDanhMuc, m.DonGia
    ORDER BY [Tổng Số Lượng Đã Bán] DESC;
    DECLARE @TongDoanhThuTrongNgay DECIMAL(18,2);
    DECLARE @TongSoLuongMon INT;

    SELECT 
        @TongDoanhThuTrongNgay = SUM(ct.SoLuong * ct.DonGia),
        @TongSoLuongMon = SUM(ct.SoLuong)
    FROM HOADON hd
    INNER JOIN CHITIETPHIEU ct ON hd.MaPhieu = ct.MaPhieu
    WHERE CAST(hd.ThoiGianThanhToan AS DATE) = @NgayBaoCao
      AND hd.TrangThaiHoaDon = N'Đã thanh toán';
END;
GO
EXEC sp_BaoCaoMonAnTrongNgay @NgayBaoCao = '2026-05-01';