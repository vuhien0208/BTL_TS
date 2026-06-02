# BTL2 Dự án chẩn đoán lỗi bạc đạn

Kho lưu trữ này chứa dự án chẩn đoán lỗi bạc đạn sử dụng PyTorch, với dữ liệu tín hiệu rung từ các file `.mat`. Thực nghiệm chính được thực hiện trong notebook `model/SA.ipynb`.
## Nguồn data https://zenodo.org/records/15845309
## Cấu trúc dự án

- `Data/`: chứa các file `.mat` thô được tổ chức theo thư mục lớp lỗi:
  - `K001/` bình thường
  - `KA04/` lỗi vành ngoài
  - `KI04/` lỗi vành trong
- `model/SA.ipynb`: notebook chính dùng để tải dữ liệu, huấn luyện mô hình thích ứng miền, đánh giá và dự đoán mẫu.

## Tính năng chính

- Trích xuất tín hiệu rung từ file `.mat`
- Tạo cửa sổ trượt (sliding windows) cho dữ liệu chuỗi thời gian
- Huấn luyện mô hình CNN 1D với dạng domain adaptation và gradient reversal
- Đánh giá bằng độ chính xác, báo cáo phân loại, ma trận nhầm lẫn và các chỉ số theo lớp
- Dự đoán mẫu trên file `.mat` mới bằng phương pháp bình chọn trên các cửa sổ

## Yêu cầu

- Python 3.8 trở lên
- `numpy`
- `scipy`
- `matplotlib`
- `scikit-learn`
- `torch`
- `tqdm`

## Cách chạy

1. Mở `model/SA.ipynb` trong Jupyter Notebook hoặc JupyterLab.
2. Kiểm tra lại biến `DATA_DIR` để đảm bảo trỏ đúng vào thư mục `Data/`.
3. Chạy các ô lệnh theo thứ tự từ trên xuống dưới.

## Ghi chú

- Notebook hiện tại xác định miền nguồn và miền đích cho domain adaptation.
- Điều chỉnh `WINDOW_SIZE`, `STRIDE`, `BATCH_SIZE` và `EPOCHS` trong notebook để hiệu chỉnh thí nghiệm.
- Mô hình được xây dựng cho 3 lớp: `K001`, `KA04`, và `KI04`.
