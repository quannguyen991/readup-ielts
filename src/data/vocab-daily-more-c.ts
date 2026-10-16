import type { DailyRow } from './vocab-daily';

/** Phần bổ sung nốt (để mỗi chủ đề đủ 40 từ). */
export const DAILY_MORE_C: Record<string, DailyRow[]> = {
  "daily-greetings": [
    ["good night", "phrase", "/ɡʊd naɪt/", "chúc ngủ ngon, tạm biệt buổi tối", "a goodbye said at night", "Good night, sleep well!", "Lời chào khi chia tay vào buổi tối.", "say good night"],
  ],
  "daily-ordering": [
    ["split the bill", "phrase", "/splɪt ðə bɪl/", "chia đều hoá đơn", "to share the cost of a meal between people", "Shall we split the bill?", "Khi cả nhóm ăn chung và muốn chia tiền.", "split the bill evenly"],
  ],
  "daily-shopping": [
    ["cash register", "n", "/kæʃ ˈredʒɪstə(r)/", "máy tính tiền", "a machine that records payments in a shop", "Please pay at the cash register.", "Khi thanh toán ở cửa hàng.", "at the cash register"],
    ["half price", "phrase", "/hɑːf praɪs/", "nửa giá", "half of the usual cost", "These boots are half price today.", "Khi nói về giảm giá nhiều.", "half price sale"],
    ["window shopping", "phrase", "/ˈwɪndəʊ ˈʃɒpɪŋ/", "ngắm hàng cho vui", "looking at goods without buying", "We went window shopping on Sunday.", "Khi đi dạo xem đồ mà không mua.", "go window shopping"],
  ],
  "daily-directions": [
    ["intersection", "n", "/ˌɪntəˈsekʃn/", "giao lộ", "a place where roads cross", "Turn at the next intersection.", "Khi chỉ đường giao nhau.", "busy intersection"],
  ],
  "daily-hotel": [
    ["front desk", "n", "/frʌnt desk/", "quầy lễ tân", "the reception area of a hotel", "Please ask at the front desk.", "Khi hỏi thông tin ở khách sạn.", "at the front desk"],
    ["room number", "n", "/ruːm ˈnʌmbə(r)/", "số phòng", "the number that identifies a hotel room", "What is my room number?", "Khi cần nhớ phòng.", "room number 302"],
  ],
  "daily-work": [
    ["agenda", "n", "/əˈdʒendə/", "chương trình họp", "a list of items to discuss in a meeting", "Let's check the agenda first.", "Khi chuẩn bị cuộc họp.", "meeting agenda"],
  ],
  "daily-plans": [
    ["pencil in", "phr v", "/ˈpensl ɪn/", "tạm ghi lịch", "to plan something provisionally", "I'll pencil you in for Thursday.", "Khi hẹn tạm thời.", "pencil in a meeting"],
    ["book a slot", "phrase", "/bʊk ə slɒt/", "đặt một khung giờ", "to reserve a particular time", "Can I book a slot for Friday?", "Khi đặt lịch.", "book a slot online"],
  ],
  "daily-phone": [
    ["dial", "v", "/ˈdaɪəl/", "quay số", "to press numbers to call someone", "Dial zero to speak to a person.", "Khi hướng dẫn gọi điện.", "dial a number"],
    ["contact list", "n", "/ˈkɒntækt lɪst/", "danh bạ", "the list of saved phone numbers", "Save the number in your contact list.", "Khi lưu số.", "add to contact list"],
    ["text message", "n", "/tekst ˈmesɪdʒ/", "tin nhắn", "a short written message sent by phone", "I received a text message from the bank.", "Khi nói về tin nhắn.", "send a text message"],
  ],
  "daily-health": [
    ["sprain", "n", "/spreɪn/", "bong gân", "an injury to a joint from twisting", "I have a sprain in my ankle.", "Khi bị trật khớp.", "an ankle sprain"],
    ["bruise", "n", "/bruːz/", "vết bầm", "a mark on the skin after being hit", "I got a bruise on my arm.", "Khi bị va đập.", "a big bruise"],
    ["medical history", "n", "/ˈmedɪkl ˈhɪstəri/", "tiền sử bệnh", "a record of past illnesses", "Tell the doctor your medical history.", "Khi khám bác sĩ mới.", "update medical history"],
  ],
  "daily-small-talk": [
    ["sunshine", "n", "/ˈsʌnʃaɪn/", "ánh nắng", "the light and heat of the sun", "Enjoy the sunshine today!", "Khi nói về thời tiết đẹp.", "bright sunshine"],
    ["catch a cold", "phrase", "/kætʃ ə kəʊld/", "bị cảm lạnh", "to start having a cold", "I think I caught a cold.", "Khi nói về việc bị cảm.", "catch a cold"],
    ["stormy", "adj", "/ˈstɔːmi/", "có bão", "with strong winds and heavy rain", "The sea is stormy tonight.", "Khi nói về thời tiết xấu.", "stormy weather"],
    ["foggy", "adj", "/ˈfɒɡi/", "có sương mù", "covered with thick mist", "The road is foggy this morning.", "Khi nói về thời tiết buổi sáng.", "foggy weather"],
  ],
  "daily-feelings": [
    ["anxious", "adj", "/ˈæŋkʃəs/", "lo âu", "worried and nervous", "She feels anxious about the exam.", "Khi nói về sự lo lắng.", "anxious about"],
  ],
  "daily-polite": [
    ["thanks in advance", "phrase", "/θæŋks ɪn ədˈvɑːns/", "cảm ơn trước", "a polite way to thank someone before they help", "Thanks in advance for your help!", "Khi nhờ vả trong tin nhắn hoặc email.", "thanks in advance"],
    ["you shouldn't have", "phrase", "/juː ˈʃʊdnt həv/", "bạn không cần làm vậy đâu", "a polite reply when someone gives you a gift", "Oh, you shouldn't have!", "Khi nhận quà.", "you shouldn't have done that"],
    ["much obliged", "phrase", "/mʌtʃ əˈblaɪdʒd/", "rất biết ơn", "a formal way to say thank you", "I'm much obliged for your kindness.", "Khi cảm ơn trang trọng.", "much obliged to you"],
    ["pardon me", "phrase", "/ˈpɑːdn miː/", "xin lỗi, xin phép", "a polite way to ask someone to excuse you", "Pardon me, could I get past?", "Khi cần đi qua chỗ đông.", "pardon me for a moment"],
  ],
};
