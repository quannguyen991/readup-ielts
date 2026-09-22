import { LinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';

/**
 * Cho NativeWind biết `LinearGradient` nhận `className`.
 *
 * NativeWind chỉ tự hiểu component lõi của React Native. Component bên thứ ba
 * như `LinearGradient` nhận `className` rồi LẶNG LẼ BỎ QUA: không lỗi, không
 * cảnh báo. Hậu quả đã gặp ở Quest: lớp phủ tối `className="absolute inset-0"`
 * cao 0px nên không bao giờ hiện, chữ trắng nằm thẳng trên ảnh nền sáng; thẻ
 * kết quả mất cả bo góc lẫn đệm.
 *
 * Đăng ký một lần ở đây, nạp từ `app/_layout.tsx` trước mọi màn.
 */
cssInterop(LinearGradient, { className: 'style' });
