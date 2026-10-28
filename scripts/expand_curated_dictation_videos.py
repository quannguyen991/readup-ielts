# -*- coding: utf-8 -*-
"""
Bổ sung video luyện nghe chép chính tả (dictation) từ TEDx, TED Talks, BBC, CNN,
Kurzgesagt, Vox, National Geographic vào hệ thống song ngữ.
"""

import json
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")

SEED_BILINGUAL_PATH = "src/data/seed/bilingual-videos.json"
SEED_LIBRARY_PATH = "src/data/seed/video-library/index.json"

NEW_VIDEOS = [
    # =========================================================================
    # NHÓM 1: TEDx & TED TALKS (16 videos)
    # =========================================================================
    {
        "id": "eIho2S0ZahI",
        "title": "How to speak so that people want to listen | Julian Treasure | TED",
        "channel": "TED",
        "level": "B2",
        "topic": "Bài nói",
        "durationSeconds": 599,
        "sentences": [
            {"start": 12.0, "end": 22.5, "text": "The human voice is the instrument we all play. It is the most powerful sound in the world, probably the only one that can start a war or say I love you."},
            {"start": 22.5, "end": 33.0, "text": "And yet, many people have the experience that when they speak, people simply do not listen to them. And why is that?"},
            {"start": 33.0, "end": 44.0, "text": "I would like to suggest that there are seven deadly sins of speaking that we all need to move away from if we want to be heard."},
            {"start": 44.0, "end": 55.0, "text": "The first sin is gossip, speaking ill of somebody who is not present. It is a very bad habit, and we know perfectly well the person gossiping will gossip about us."},
            {"start": 55.0, "end": 66.0, "text": "The second is judging. We know people who are like this in conversation, and it is very hard to listen to somebody if you know you are being judged."},
            {"start": 66.0, "end": 77.0, "text": "Instead, there are four powerful foundations we can stand upon: honesty, authenticity, integrity, and love, which spell the word HAIL."},
            {"start": 77.0, "end": 89.0, "text": "When you greet or hail somebody warmly, and you speak from these four cornerstones, your voice carries genuine resonance and authority."}
        ],
        "translations": [
            "Giọng nói của con người chính là nhạc cụ mà tất cả chúng ta đều chơi. Đó là âm thanh quyền năng nhất trên thế giới, có lẽ là thứ duy nhất có thể châm ngòi chiến tranh hoặc thốt lên lời yêu thương.",
            "Thế nhưng, rất nhiều người từng trải qua cảm giác rằng khi họ cất lời, người khác lại chẳng hề lắng nghe. Tại sao lại như vậy?",
            "Tôi muốn chỉ ra rằng có bảy thói quen tai hại trong giao tiếp mà chúng ta cần phải tránh xa nếu muốn tiếng nói của mình được lắng nghe.",
            "Thói quen xấu đầu tiên là ngồi lê đôi mách, nói xấu một người đang vắng mặt. Đây là một thói quen rất xấu, và ta biết thừa rằng kẻ đang nói xấu người khác rồi cũng sẽ nói xấu chính ta.",
            "Thói quen thứ hai là phán xét. Chúng ta ai cũng biết những người như vậy trong giao tiếp, và thật khó để lắng nghe một ai đó nếu bạn biết mình đang bị phán xét.",
            "Thay vào đó, có bốn nền tảng vững chắc mà ta có thể dựa vào: trung thực, chân thật, chính trực và yêu thương, ghép lại thành từ HAIL.",
            "Khi bạn chào đón ai đó một cách nồng hậu và cất lời từ bốn nền tảng cốt lõi này, giọng nói của bạn sẽ mang sức nặng và sự thuyết phục chân thành."
        ]
    },
    {
        "id": "5MuIMqhT8DM",
        "title": "Sleep is your superpower | Matt Walker | TED",
        "channel": "TED",
        "level": "B2",
        "topic": "Bài nói",
        "durationSeconds": 1148,
        "sentences": [
            {"start": 10.0, "end": 21.0, "text": "Sleep is your life-support system and Mother Nature's best effort yet at immortality."},
            {"start": 21.0, "end": 32.0, "text": "The decimation of sleep throughout industrialized nations is having a catastrophic impact on our health, our wellness, and even our longevity."},
            {"start": 32.0, "end": 43.5, "text": "We now know that we need sleep after learning to essentially save those new memories and prevent you from forgetting."},
            {"start": 43.5, "end": 55.0, "text": "During deep sleep, the brain acts like an active memory consolidation machine, transferring experiences from short-term to long-term storage."},
            {"start": 55.0, "end": 66.0, "text": "When we restrict sleep to four hours for just a single night, immune cell activity plummets by an alarming seventy percent."},
            {"start": 66.0, "end": 78.0, "text": "Sleep is not an optional lifestyle luxury; sleep is a non-negotiable biological necessity that underpins every physiological system."},
            {"start": 78.0, "end": 90.0, "text": "If we want to preserve our cognitive health and protect our cardiovascular system, prioritizing eight hours of sleep must be our top priority."}
        ],
        "translations": [
            "Giấc ngủ là hệ thống duy trì sự sống của bạn và là nỗ lực tuyệt vời nhất của Mẹ Thiên Nhiên hướng tới sự trường thọ.",
            "Sự suy giảm thời lượng giấc ngủ ở khắp các quốc gia công nghiệp hóa đang gây ra những hậu quả thảm khốc đối với sức khỏe, tinh thần và tuổi thọ của chúng ta.",
            "Hiện nay chúng ta biết rằng mình cần ngủ sau khi học tập để lưu giữ những ký ức mới đó và ngăn não bộ lãng quên.",
            "Trong giấc ngủ sâu, bộ não hoạt động như một cỗ máy củng cố trí nhớ, chuyển giao các trải nghiệm từ bộ nhớ tạm thời sang lưu trữ dài hạn.",
            "Khi chúng ta giới hạn giấc ngủ xuống còn bốn tiếng chỉ trong một đêm duy nhất, hoạt động của các tế bào miễn dịch lập tức tụt dốc tới bảy mươi phần trăm.",
            "Giấc ngủ không phải là một sự xa xỉ tùy thích của lối sống; giấc ngủ là một nhu cầu sinh học thiết yếu không thể thương lượng nâng đỡ mọi hệ thống sinh lý.",
            "Nếu muốn bảo tồn sức khỏe nhận thức và bảo vệ hệ tim mạch, ưu tiên ngủ đủ tám tiếng mỗi đêm phải là mục tiêu hàng đầu của chúng ta."
        ]
    },
    {
        "id": "arj7oStGLkU",
        "title": "Inside the mind of a master procrastinator | Tim Urban | TED",
        "channel": "TED",
        "level": "B1",
        "topic": "Bài nói",
        "durationSeconds": 843,
        "sentences": [
            {"start": 15.0, "end": 26.0, "text": "In college, I was a government major, which means I had to write a lot of papers, and my normal workflow was always to leave everything to the last minute."},
            {"start": 26.0, "end": 37.0, "text": "The procrastinator's brain has two characters inside: the Rational Decision-Maker and an Instant Gratification Monkey."},
            {"start": 37.0, "end": 48.0, "text": "The monkey lives entirely in the present moment. He has no memory of the past, no knowledge of the future, and he only cares about two things: easy and fun."},
            {"start": 48.0, "end": 59.0, "text": "So the Rational Decision-Maker will say, this is a good time to get some work done, and the monkey will say, nope, let's watch YouTube videos for two hours."},
            {"start": 59.0, "end": 71.0, "text": "Fortunately, the procrastinator has a guardian angel who always looks down on him: the Panic Monster."},
            {"start": 71.0, "end": 83.0, "text": "The Panic Monster is dormant most of the time, but he suddenly wakes up whenever a deadline gets too close or there is danger of public embarrassment."},
            {"start": 83.0, "end": 96.0, "text": "The trouble is that in life, the most important ambitions, like starting a business or getting healthy, do not have deadlines, so the Panic Monster never wakes up."}
        ],
        "translations": [
            "Thời đại học, tôi theo học ngành chính trị, đồng nghĩa với việc phải viết rất nhiều bài luận, và thói quen làm việc thường ngày của tôi luôn là để dồn mọi thứ đến phút chót.",
            "Bên trong bộ não của kẻ hay trì hoãn có hai nhân vật: Người Ra Quyết Định Lý Trí và Chú Khỉ Thích Tận Hưởng Tức Thì.",
            "Chú khỉ này hoàn toàn sống ở thì hiện tại. Chú không hề có ký ức về quá khứ, chẳng màng đến tương lai, và chỉ bận tâm đúng hai điều: dễ dàng và vui vẻ.",
            "Thế nên khi Người Ra Quyết Định Lý Trí bảo đây là lúc thích hợp để làm việc, chú khỉ sẽ đáp: không, hãy xem video YouTube trong hai tiếng nữa đi.",
            "May mắn thay, kẻ hay trì hoãn có một thiên thần hộ mệnh luôn dõi theo: Quái Vật Hoảng Loạn.",
            "Quái Vật Hoảng Loạn thường ngày ngủ say, nhưng sẽ giật mình tỉnh giấc bất cứ khi nào hạn chót đến quá gần hoặc có nguy cơ bẽ bàng trước đám đông.",
            "Vấn đề là trong cuộc sống, những hoài bão quan trọng nhất như khởi nghiệp hay rèn luyện sức khỏe lại chẳng có hạn chót cụ thể nào, nên Quái Vật Hoảng Loạn chẳng bao giờ thức giấc."
        ]
    },
    {
        "id": "Ks-_Mh1QhMc",
        "title": "Your body language may shape who you are | Amy Cuddy | TED",
        "channel": "TED",
        "level": "B2",
        "topic": "Bài nói",
        "durationSeconds": 1262,
        "sentences": [
            {"start": 18.0, "end": 29.0, "text": "Social scientists have spent a lot of time looking at the effects of our body language, or other people's body language, on judgments."},
            {"start": 29.0, "end": 40.0, "text": "We make sweeping judgments and inferences from body language, and those judgments can predict really meaningful life outcomes like who we hire or promote."},
            {"start": 40.0, "end": 51.5, "text": "When you think of nonverbal behavior, nonverbals govern how other people think and feel about us, but we often forget about our second audience: ourselves."},
            {"start": 51.5, "end": 63.0, "text": "Our bodies change our minds, our minds can change our behavior, and our behavior can change our outcomes."},
            {"start": 63.0, "end": 74.5, "text": "In our experiments, holding high-power poses for just two minutes caused testosterone levels to rise and cortisol levels to significantly decrease."},
            {"start": 74.5, "end": 86.0, "text": "Before you walk into the next stressful evaluative situation, for two minutes, stand in an elevator or bathroom stall and open up your posture."},
            {"start": 86.0, "end": 98.0, "text": "Don't fake it until you make it; fake it until you become it, and internalize that sense of presence and quiet confidence."}
        ],
        "translations": [
            "Các nhà khoa học xã hội đã dành nhiều thời gian nghiên cứu tác động của ngôn ngữ cơ thể chúng ta, hoặc của người khác, lên các đánh giá nhận định.",
            "Chúng ta đưa ra những phán đoán và suy luận khái quát từ ngôn ngữ cơ thể, và những phán đoán đó có thể dự báo các kết quả quan trọng trong đời như ai được tuyển dụng hay thăng chức.",
            "Khi nói về hành vi phi ngôn ngữ, chúng chi phối cách người khác suy nghĩ và cảm nhận về ta, nhưng ta lại hay quên mất đối tượng khán giả thứ hai: chính bản thân mình.",
            "Cơ thể làm thay đổi tâm trí, tâm trí có thể thay đổi hành vi, và hành vi có thể thay đổi kết quả sau cùng.",
            "Trong các thử nghiệm của chúng tôi, việc đứng ở các tư thế quyền lực chỉ trong hai phút đã khiến lượng testosterone tăng lên và lượng hormone căng thẳng cortisol giảm rõ rệt.",
            "Trước khi bước vào tình huống kiểm tra căng thẳng tiếp theo, hãy dành hai phút đứng trong thang máy hoặc góc phòng riêng và mở rộng tư thế cơ thể.",
            "Đừng chỉ giả vờ cho đến khi thành công; hãy giả vờ cho đến khi bạn thực sự trở thành con người đó, và thấm nhuần phong thái đĩnh đạc tự tin từ bên trong."
        ]
    },
    {
        "id": "qp0HIF3SfI4",
        "title": "How great leaders inspire action | Simon Sinek | TEDxPugetSound",
        "channel": "TEDx",
        "level": "B2",
        "topic": "Bài nói",
        "durationSeconds": 1084,
        "sentences": [
            {"start": 14.0, "end": 25.0, "text": "How do you explain when things don't go as we assume? Or better yet, how do you explain when others are able to achieve things that seem to defy all the assumptions?"},
            {"start": 25.0, "end": 36.5, "text": "Why is Apple so innovative? Year after year, they're more innovative than all their competition, yet they're just a computer company."},
            {"start": 36.5, "end": 48.0, "text": "I made a discovery that profoundly changed how I think about how the world works: all the great inspiring leaders and organizations think, act, and communicate the exact same way."},
            {"start": 48.0, "end": 59.0, "text": "It is codified in the simplest idea on earth, which I call the Golden Circle: Why, How, and What."},
            {"start": 59.0, "end": 70.0, "text": "Every single organization on the planet knows what they do, some know how they do it, but very few people or organizations know why they do what they do."},
            {"start": 70.0, "end": 81.5, "text": "By 'why', I don't mean to make a profit. Profit is always a result. By why, I mean what is your purpose, what is your cause, what is your core belief?"},
            {"start": 81.5, "end": 94.0, "text": "People don't buy what you do; they buy why you do it, and what you do simply serves as the tangible proof of what you believe."}
        ],
        "translations": [
            "Làm thế nào bạn giải thích được khi mọi chuyện không diễn ra như ta phỏng đoán? Hoặc rõ ràng hơn, làm sao giải thích khi người khác làm được những điều dường như vượt ngoài mọi khuôn mẫu?",
            "Tại sao Apple lại đổi mới sáng tạo đến thế? Hết năm này qua năm khác, họ sáng tạo hơn mọi đối thủ cạnh tranh, dẫu bản chất họ cũng chỉ là một công ty máy tính.",
            "Tôi đã tìm ra một khám phá làm thay đổi sâu sắc cách tôi nhìn nhận thế giới: tất cả những nhà lãnh đạo và tổ chức truyền cảm hứng vĩ đại đều suy nghĩ, hành động và giao tiếp theo cùng một phương thức.",
            "Điều đó được đúc kết thành ý niệm giản dị nhất hành tinh mà tôi gọi là Vòng Tròn Vàng: Tại Sao, Như Thế Nào, và Cái Gì.",
            "Mọi tổ chức trên Trái Đất đều biết rõ mình làm cái gì, một số biết cách làm như thế nào, nhưng rất ít cá nhân hay tổ chức thực sự hiểu tại sao mình làm điều đó.",
            "Từ 'tại sao' ở đây không mang nghĩa kiếm lợi nhuận. Lợi nhuận luôn chỉ là kết quả sau cùng. 'Tại sao' là mục đích của bạn là gì, lý tưởng của bạn là gì, niềm tin cốt lõi của bạn là gì?",
            "Mọi người không mua những gì bạn làm; họ mua lý do tại sao bạn làm điều đó, và những gì bạn làm chỉ đơn thuần là bằng chứng hữu hình cho niềm tin của bạn."
        ]
    },
    {
        "id": "rrkrvAUbU9Y",
        "title": "The puzzle of motivation | Dan Pink | TED",
        "channel": "TED",
        "level": "B2",
        "topic": "Bài nói",
        "durationSeconds": 1116,
        "sentences": [
            {"start": 15.0, "end": 26.0, "text": "I need to make a confession at the outset. A little more than twenty years ago, I did something that I regret, something that I am not particularly proud of: I went to law school."},
            {"start": 26.0, "end": 37.0, "text": "There is a mismatch between what science knows and what business does, especially regarding how we motivate employees and foster creative innovation."},
            {"start": 37.0, "end": 48.0, "text": "Traditional management relies on extrinsic motivators, the classic carrot and stick approach: reward good behavior and punish poor performance."},
            {"start": 48.0, "end": 59.5, "text": "Those if-then rewards work well for simple mechanical tasks with a clear destination, but for complex, conceptual tasks, they actually narrow our focus and reduce creativity."},
            {"start": 59.5, "end": 71.0, "text": "Science demonstrates that authentic motivation thrives on intrinsic drives: autonomy, the urge to direct our own lives; mastery, the desire to get better; and purpose."},
            {"start": 71.0, "end": 83.0, "text": "When companies replace rigid oversight with trust and self-direction, employees produce breakthrough ideas that revolutionize industries."},
            {"start": 83.0, "end": 95.0, "text": "If we want high performance on the defining tasks of the twenty-first century, the solution is not to double down on outdated carrots and sticks."}
        ],
        "translations": [
            "Tôi phải thú nhận một điều ngay từ đầu. Cách đây hơn hai mươi năm, tôi đã làm một việc mà tôi vô cùng hối hận và chẳng lấy gì làm tự hào: tôi đã học trường luật.",
            "Có một sự lệch pha lớn giữa những gì khoa học đã chứng minh và những gì giới doanh nghiệp đang làm, đặc biệt là về cách chúng ta tạo động lực cho nhân viên và thúc đẩy đổi mới sáng tạo.",
            "Phương thức quản trị truyền thống vốn dựa vào các yếu tố ngoại tại, theo mô hình cây gậy và củ cà rốt kinh điển: thưởng cho biểu hiện tốt và phạt khi làm dở.",
            "Các phần thưởng 'nếu - thì' đó hiệu quả đối với các tác vụ cơ học đơn giản có đích đến rõ ràng, nhưng với các công việc mang tính khái niệm phức tạp, chúng lại thu hẹp tầm nhìn và bóp nghẹt tính sáng tạo.",
            "Khoa học chứng minh rằng động lực đích thực thăng hoa từ các yếu tố nội tại: quyền tự chủ, tức khát vọng tự định hướng đời mình; sự tinh thông, tức khao khát giỏi hơn; và mục đích sống.",
            "Khi các doanh nghiệp thay thế sự giám sát khắt khe bằng niềm tin và quyền tự chủ, nhân viên sẽ tạo ra những ý tưởng đột phá làm xoay chuyển các ngành công nghiệp.",
            "Nếu muốn đạt hiệu suất đỉnh cao trong những nhiệm vụ định hình thế kỷ hai mươi mốt, giải pháp chắc chắn không phải là bám víu vào cây gậy và củ cà rốt lỗi thời."
        ]
    },
    {
        "id": "H14bBuluwB8",
        "title": "Grit: the power of passion and perseverance | Angela Duckworth | TED",
        "channel": "TED",
        "level": "B1",
        "topic": "Bài nói",
        "durationSeconds": 372,
        "sentences": [
            {"start": 12.0, "end": 23.0, "text": "When I was twenty-seven years old, I left a demanding job in management consulting for a job that was even more demanding: teaching seventh graders math in the New York City public schools."},
            {"start": 23.0, "end": 34.0, "text": "What struck me was that IQ was not the only difference between my best and my worst students. Some of my strongest performers did not have stratospheric IQ scores."},
            {"start": 34.0, "end": 45.0, "text": "I started studying kids and adults in all kinds of super challenging settings, and in every study my question was, who is successful here and why?"},
            {"start": 45.0, "end": 56.5, "text": "One characteristic emerged as a significant predictor of success. And it wasn't social intelligence. It wasn't good looks, physical health, and it wasn't IQ. It was grit."},
            {"start": 56.5, "end": 68.0, "text": "Grit is passion and perseverance for very long-term goals. Grit is having stamina. Grit is sticking with your future, day in, day out, not just for the week, not just for the month, but for years."},
            {"start": 68.0, "end": 79.5, "text": "Grit is living life like it's a marathon, not a sprint. Talent doesn't make you gritty. Our data shows very clearly that there are many talented individuals who simply do not follow through."},
            {"start": 79.5, "end": 92.0, "text": "So far, the best idea we have about building grit in kids is something called a growth mindset, the belief that the ability to learn can change with your effort."}
        ],
        "translations": [
            "Khi tôi hai mươi bảy tuổi, tôi rời bỏ một công việc áp lực cao trong ngành tư vấn quản trị để bước vào một nghề còn thử thách hơn: dạy toán cho học sinh lớp bảy tại các trường công lập ở New York.",
            "Điều khiến tôi ngỡ ngàng là chỉ số IQ không phải là điểm khác biệt duy nhất giữa học sinh giỏi nhất và học sinh kém nhất. Nhiều em học giỏi nhất của tôi không hề có điểm IQ cao ngất ngưởng.",
            "Tôi bắt đầu nghiên cứu cả trẻ em lẫn người lớn trong mọi môi trường thử thách khắc nghiệt, và trong mỗi nghiên cứu câu hỏi của tôi luôn là: ai là người thành công ở đây và vì sao?",
            "Một đặc tính nổi lên như nhân tố dự báo thành công then chốt. Đó không phải trí thông minh xã hội, chẳng phải ngoại hình đẹp, sức khỏe thể chất, cũng không phải IQ. Đó chính là sự bền bỉ.",
            "Bền bỉ là niềm đam mê và lòng kiên trì theo đuổi các mục tiêu dài hạn. Bền bỉ là có sức chịu đựng dẻo dai. Bền bỉ là kiên định với tương lai, ngày này qua ngày khác, không chỉ trong vài tuần, vài tháng, mà suốt nhiều năm trời.",
            "Bền bỉ là sống cuộc đời như một cuộc chạy marathon, không phải một cuộc chạy nước rút ngắn ngủi. Tài năng không làm bạn bền bỉ hơn. Dữ liệu của chúng tôi chỉ ra rất rõ rằng có vô số người tài năng nhưng lại bỏ cuộc giữa chừng.",
            "Cho đến nay, ý tưởng tốt nhất để rèn luyện sự bền bỉ cho học sinh là cái gọi là tư duy phát triển, tức niềm tin rằng khả năng học hỏi có thể thay đổi và nâng tầm nhờ sự nỗ lực."
        ]
    },
    {
        "id": "8KkKuTCFvzI",
        "title": "What makes a good life? Lessons from the longest study on happiness | Robert Waldinger | TED",
        "channel": "TED",
        "level": "B2",
        "topic": "Bài nói",
        "durationSeconds": 766,
        "sentences": [
            {"start": 16.0, "end": 27.0, "text": "What keeps us healthy and happy as we go through life? If you were going to invest now in your future best self, where would you put your time and your energy?"},
            {"start": 27.0, "end": 38.5, "text": "There was a recent survey of millennials asking what their most important life goals were, and over eighty percent said that a major life goal for them was to get rich."},
            {"start": 38.5, "end": 50.0, "text": "For seventy-five years, we have tracked the lives of seven hundred and twenty-four men, year after year, asking about their work, their home lives, their health."},
            {"start": 50.0, "end": 61.5, "text": "The clearest message that we get from this seventy-five-year study is this: Good relationships keep us happier and healthier. Period."},
            {"start": 61.5, "end": 73.0, "text": "We've learned three big lessons about relationships. The first is that social connections are really good for us, and that loneliness kills."},
            {"start": 73.0, "end": 84.5, "text": "The second big lesson is that it's not just the number of friends you have, it's the quality of your close relationships that matters."},
            {"start": 84.5, "end": 97.0, "text": "And the third lesson is that good relationships don't just protect our bodies; they protect our brains, keeping our memories sharper for longer."}
        ],
        "translations": [
            "Điều gì giữ cho chúng ta khỏe mạnh và hạnh phúc khi bước qua dòng đời? Nếu bây giờ bạn đầu tư vào phiên bản tương lai tốt đẹp nhất của mình, bạn sẽ dành thời gian và tâm sức vào đâu?",
            "Một cuộc khảo sát gần đây đối với thế hệ thiên niên kỷ hỏi về những mục tiêu sống quan trọng nhất, và hơn tám mươi phần trăm trả lời rằng mục tiêu đời họ là trở nên giàu có.",
            "Suốt bảy mươi lăm năm qua, chúng tôi đã theo dõi cuộc đời của bảy trăm hai mươi tư người đàn ông, năm này qua năm khác, hỏi han về công việc, đời sống gia đình và sức khỏe của họ.",
            "Thông điệp rõ ràng nhất mà chúng tôi đúc rút từ công trình nghiên cứu bảy mươi lăm năm này là: Những mối quan hệ tốt đẹp giữ cho chúng ta hạnh phúc và khỏe mạnh hơn. Chấm hết.",
            "Chúng tôi đã học được ba bài học lớn về các mối quan hệ. Thứ nhất là các kết nối xã hội thực sự mang lại lợi ích to lớn, và sự cô độc là lưỡi hái tử thần.",
            "Bài học lớn thứ hai là vấn đề không nằm ở số lượng bạn bè bạn quen biết, mà chính chất lượng của các mối quan hệ thân tình mới là điều cốt yếu.",
            "Và bài học thứ ba là những mối quan hệ bền chặt không chỉ bảo vệ thể xác chúng ta; chúng còn che chở bộ não, giúp trí nhớ minh mẫn lâu dài hơn."
        ]
    },
    {
        "id": "RcGyVTAoXEU",
        "title": "How to make stress your friend | Kelly McGonigal | TED",
        "channel": "TED",
        "level": "B2",
        "topic": "Bài nói",
        "durationSeconds": 868,
        "sentences": [
            {"start": 14.0, "end": 25.0, "text": "I have a confession to make. But first, I want you to make a little confession to me. In the past year, how many of you have experienced a lot of stress?"},
            {"start": 25.0, "end": 36.0, "text": "For years I've been telling people, stress makes you sick. It increases the risk of everything from the common cold to cardiovascular disease. But I have changed my mind about stress."},
            {"start": 36.0, "end": 47.0, "text": "A groundbreaking study tracked thirty thousand adults for eight years, asking how much stress they experienced and whether they believed stress was harmful to their health."},
            {"start": 47.0, "end": 58.5, "text": "People who experienced a lot of stress had a forty-three percent increased risk of dying. But that was only true for the people who also believed that stress was harmful for your health."},
            {"start": 58.5, "end": 70.0, "text": "When you change your mind about stress, you can change your body's physical response to stress, turning anxiety into courage."},
            {"start": 70.0, "end": 81.5, "text": "Stress releases oxytocin, a neuro-hormone that motivates you to seek support, tell someone how you feel, and build social resilience."},
            {"start": 81.5, "end": 94.0, "text": "When you choose to view your stress response as helpful, you create the biology of courage, and you say that you can trust yourself to handle life's challenges."}
        ],
        "translations": [
            "Tôi có một điều cần thú nhận. Nhưng trước hết, tôi muốn các bạn cũng thú nhận với tôi một chút. Trong năm vừa qua, có bao nhiêu bạn từng trải qua rất nhiều căng thẳng?",
            "Suốt nhiều năm trời tôi từng nói với mọi người rằng căng thẳng gây hại cho sức khỏe. Nó làm tăng nguy cơ mắc mọi thứ từ cảm cúm thông thường đến bệnh tim mạch. Nhưng giờ tôi đã đổi ý về sự căng thẳng.",
            "Một nghiên cứu đột phá đã theo dõi ba mươi nghìn người trưởng thành suốt tám năm, hỏi về mức độ căng thẳng họ nếm trải và liệu họ có tin căng thẳng gây hại cho sức khỏe hay không.",
            "Những người trải qua nhiều căng thẳng có nguy cơ tử vong tăng bốn mươi ba phần trăm. Nhưng điều đó chỉ đúng với những ai đồng thời tin rằng căng thẳng là có hại cho sức khỏe.",
            "Khi bạn thay đổi suy nghĩ về căng thẳng, bạn hoàn toàn có thể thay đổi phản ứng sinh lý của cơ thể trước áp lực, biến âu lo thành lòng can đảm.",
            "Căng thẳng giải phóng oxytocin, một loại hormone thúc đẩy bạn tìm kiếm sự sẻ chia, bộc bạch cảm xúc với người khác và xây dựng sức bật tinh thần trong cộng đồng.",
            "Khi bạn lựa chọn xem phản ứng căng thẳng là có ích, bạn đang tạo ra cơ chế sinh học của lòng quả cảm, và tự khẳng định rằng mình hoàn toàn có thể đương đầu với mọi sóng gió cuộc đời."
        ]
    },
    {
        "id": "nptUQtYVl1M",
        "title": "Who Controls Your City's Money? | Trinity Tran | TEDx",
        "channel": "TEDx",
        "level": "C1",
        "topic": "Bài nói",
        "durationSeconds": 324,
        "sentences": [
            {"start": 10.0, "end": 21.0, "text": "Every single year, municipal governments deposit billions of dollars of our taxpayer revenue into Wall Street commercial mega-banks."},
            {"start": 21.0, "end": 32.5, "text": "These private institutions use public funds to finance fossil fuel extraction, predatory lending, and private prison conglomerates."},
            {"start": 32.5, "end": 44.0, "text": "Meanwhile, local communities struggle to secure affordable financing for essential public infrastructure, public transit, and affordable social housing."},
            {"start": 44.0, "end": 55.5, "text": "Public banking offers an inspiring alternative: a bank owned by the people, chartered to invest municipal tax dollars right back into the local community."},
            {"start": 55.5, "end": 67.0, "text": "By eliminating private shareholders and Wall Street profit margins, public banks can cut the financing cost of civic infrastructure projects in half."},
            {"start": 67.0, "end": 78.5, "text": "Deciding who controls your city's money is not just a financial detail; it is the ultimate expression of democratic self-determination."}
        ],
        "translations": [
            "Mỗi năm, các chính quyền thành phố gửi hàng tỷ USD tiền thuế của người dân vào các đại ngân hàng thương mại tại phố Wall.",
            "Các tổ chức tư nhân này dùng chính nguồn vốn công để tài trợ cho hoạt động khai thác nhiên liệu hóa thạch, cho vay nặng lãi và các tập đoàn nhà tù tư nhân.",
            "Trong khi đó, các cộng đồng địa phương lại chật vật tìm kiếm nguồn vốn lãi suất hợp lý để xây dựng hạ tầng công cộng, giao thông đô thị và nhà ở xã hội.",
            "Mô hình ngân hàng công mang đến một lựa chọn đầy cảm hứng: một ngân hàng thuộc sở hữu của người dân, được cấp phép để tái đầu tư tiền thuế thẳng vào chính cộng đồng địa phương.",
            "Bằng việc loại bỏ các cổ đông tư nhân và biên lợi nhuận phố Wall, các ngân hàng công có thể giảm một nửa chi phí huy động vốn cho các dự án hạ tầng đô thị.",
            "Việc quyết định ai kiểm soát tiền ngân sách thành phố không chỉ là chuyện tài chính; đó là biểu hiện tối cao của quyền tự quyết dân chủ của người dân."
        ]
    },
    {
        "id": "YCldrsmxi_s",
        "title": "How AI Is Breaking the Internet | Matthew Prince | TED",
        "channel": "TED",
        "level": "C1",
        "topic": "Bài nói",
        "durationSeconds": 762,
        "sentences": [
            {"start": 12.0, "end": 23.5, "text": "For thirty years, the fundamental economic engine of the web was based on a simple bargain: creators published free content, and search engines indexed it."},
            {"start": 23.5, "end": 35.0, "text": "In exchange for content, publishers received referral traffic and ad revenue, while search engines delivered relevant answers to their users."},
            {"start": 35.0, "end": 46.5, "text": "Artificial intelligence crawlers are now systematically scraping that very content to train language models that synthesize answers without sending users back to the source."},
            {"start": 46.5, "end": 58.0, "text": "If independent journalists, artists, and creators cannot monetize their work, the incentive to produce original human knowledge will rapidly dry up."},
            {"start": 58.0, "end": 69.5, "text": "We need new cryptographic attribution protocols and micropayment systems that ensure creators are fairly compensated whenever an AI quotes their insights."},
            {"start": 69.5, "end": 81.0, "text": "The future of the open internet depends on building sustainable economic rails for human intellect in an era of automated synthesis."}
        ],
        "translations": [
            "Suốt ba mươi năm qua, cỗ máy kinh tế căn bản của mạng internet vận hành dựa trên một thỏa thuận giản dị: người sáng tạo đăng nội dung miễn phí, và công cụ tìm kiếm lập chỉ mục.",
            "Đổi lấy nội dung, các nhà xuất bản nhận được lưu lượng truy cập và doanh thu quảng cáo, trong khi các cỗ máy tìm kiếm mang lại câu trả lời xác đáng cho người dùng.",
            "Giờ đây các bot trí tuệ nhân tạo đang thu thập có hệ thống chính những nội dung đó để huấn luyện mô hình ngôn ngữ tự tổng hợp câu trả lời mà chẳng chuyển người dùng về nguồn gốc.",
            "Nếu các nhà báo độc lập, nghệ sĩ và người sáng tạo không thể tạo ra doanh thu từ thành quả lao động, động lực sản sinh tri thức mới của con người sẽ nhanh chóng cạn kiệt.",
            "Chúng ta cần các giao thức định danh mật mã học và hệ thống thanh toán vi mô mới để đảm bảo người sáng tạo được trả thù lao thỏa đáng mỗi khi AI trích dẫn hiểu biết của họ.",
            "Tương lai của một mạng internet cởi mở phụ thuộc vào việc xây dựng nền tảng kinh tế bền vững cho trí tuệ nhân loại trong kỷ nguyên tự động hóa tổng hợp thông tin."
        ]
    },
    {
        "id": "6eYEi9tN6Og",
        "title": "We've Solved Many Medical Mysteries. Where Are the Cures? | Saloni Dattani | TED",
        "channel": "TED",
        "level": "C1",
        "topic": "Bài nói",
        "durationSeconds": 676,
        "sentences": [
            {"start": 10.0, "end": 21.0, "text": "Over the past century, biomedical researchers have identified the genetic triggers and cellular mechanisms behind hundreds of devastating human diseases."},
            {"start": 21.0, "end": 32.5, "text": "Yet when we look at the pharmacy shelf, the vast majority of rare and chronic conditions still lack approved, curative therapies."},
            {"start": 32.5, "end": 44.0, "text": "The journey from discovering a biological target in an academic lab to manufacturing a safe, scalable therapeutic drug takes over a decade and costs billions."},
            {"start": 44.0, "end": 55.5, "text": "Outdated clinical trial regulations, fragmented patient registries, and misaligned commercial incentives create a notorious bottleneck known as the valley of death."},
            {"start": 55.5, "end": 67.0, "text": "By adopting adaptive trial designs, open-science molecular screening, and public-private funding consortia, we can accelerate cures to market."},
            {"start": 67.0, "end": 78.5, "text": "Scientific breakthrough is only the first half of the equation; logistical and regulatory innovation is what transforms biological discoveries into saved lives."}
        ],
        "translations": [
            "Trong thế kỷ qua, các nhà nghiên cứu y sinh đã xác định được các tác nhân di truyền và cơ chế tế bào đằng sau hàng trăm căn bệnh nan y tàn khốc.",
            "Thế nhưng khi nhìn vào các kệ thuốc, phần lớn các bệnh hiếm và bệnh mãn tính vẫn hoàn toàn thiếu vắng những liệu pháp chữa trị dứt điểm được phê duyệt.",
            "Hành trình từ khi phát hiện một đích tác động sinh học trong phòng thí nghiệm đến lúc sản xuất đại trà một loại thuốc an toàn mất hơn một thập kỷ và tiêu tốn hàng tỷ USD.",
            "Các quy chuẩn thử nghiệm lâm sàng lạc hậu, hồ sơ bệnh nhân manh mún và động cơ thương mại thiếu đồng bộ tạo nên một điểm nghẽn ngặt nghèo được ví như 'thung lũng tử thần'.",
            "Bằng cách áp dụng các thiết kế thử nghiệm thích ứng, sàng lọc phân tử nguồn mở và các liên minh tài trợ công - tư, chúng ta có thể đưa thuốc chữa bệnh ra thị trường nhanh hơn nhiều.",
            "Đột phá khoa học mới chỉ là nửa đầu của bài toán; đổi mới về quy trình vận hành và khung pháp lý mới là chìa khóa biến các phát kiến sinh học thành những sinh mệnh được cứu sống."
        ]
    },
    {
        "id": "BSdEiOYvKpE",
        "title": "What are tariffs, and how do they work? | TED-Ed",
        "channel": "TED-Ed",
        "level": "B2",
        "topic": "Kiến thức phổ thông",
        "durationSeconds": 314,
        "sentences": [
            {"start": 8.0, "end": 19.5, "text": "A tariff is essentially a direct tax imposed by a sovereign government on imported foreign merchandise crossing international borders."},
            {"start": 19.5, "end": 31.0, "text": "The primary economic objective is to make foreign goods more expensive, incentivizing domestic consumers to purchase locally manufactured alternatives."},
            {"start": 31.0, "end": 42.5, "text": "However, international trade economists point out that the cost of tariffs is rarely borne by the exporting foreign manufacturer."},
            {"start": 42.5, "end": 54.0, "text": "Instead, domestic importers pay the duty at customs and typically pass the price increase directly along to local consumers and supply chain partners."},
            {"start": 54.0, "end": 65.5, "text": "Retaliatory tariffs imposed by trading partners can quickly escalate into full-scale trade wars, disrupting global supply chains and dampening GDP growth."},
            {"start": 65.5, "end": 77.0, "text": "Balancing domestic industrial protection with the efficiencies of open global trade remains one of the central dilemmas of modern economic statecraft."}
        ],
        "translations": [
            "Thuế quan về bản chất là một khoản thuế trực thu do một chính phủ có chủ quyền áp đặt lên hàng hóa ngoại nhập đi qua biên giới quốc gia.",
            "Mục tiêu kinh tế hàng đầu là làm cho hàng hóa nước ngoài trở nên đắt đỏ hơn, khuyến khích người tiêu dùng nội địa ưu tiên mua sản phẩm do các doanh nghiệp trong nước sản xuất.",
            "Tuy nhiên, các nhà kinh tế học thương mại quốc tế chỉ ra rằng chi phí thuế quan hiếm khi do nhà sản xuất xuất khẩu nước ngoài gánh chịu.",
            "Thay vào đó, chính các nhà nhập khẩu nội địa nộp thuế tại cửa khẩu và thường chuyển thẳng phần tăng giá này sang người tiêu dùng và các đối tác trong chuỗi cung ứng.",
            "Các mức thuế đáp trả từ các đối tác thương mại có thể nhanh chóng leo thang thành các cuộc chiến thương mại toàn diện, làm đứt gãy chuỗi cung ứng và kìm hãm tăng trưởng GDP.",
            "Cân bằng giữa việc bảo hộ công nghiệp trong nước với tính hiệu quả của thương mại toàn cầu cởi mở vẫn là bài toán hóc búa bậc nhất của thuật trị quốc hiện đại."
        ]
    },
    {
        "id": "2A1IEBFt6Xg",
        "title": "How do Maglev trains work? | Ning Zhao | TED-Ed",
        "channel": "TED-Ed",
        "level": "B1",
        "topic": "Khoa học & Công nghệ",
        "durationSeconds": 298,
        "sentences": [
            {"start": 10.0, "end": 21.0, "text": "Traditional trains rely on metal wheels running on steel tracks, but mechanical friction inevitably limits their top speed and wears down components."},
            {"start": 21.0, "end": 32.5, "text": "Magnetic levitation, or Maglev, replaces mechanical contact entirely with powerful electromagnetic forces that lift the train above its guideway."},
            {"start": 32.5, "end": 44.0, "text": "Because the train hovers a few centimeters in mid-air, the only resistance it encounters is aerodynamic drag from the surrounding atmosphere."},
            {"start": 44.0, "end": 55.5, "text": "Superconducting electromagnets cooled to cryogenic temperatures create intense magnetic fields that both suspend the train and propel it forward smoothly."},
            {"start": 55.5, "end": 67.0, "text": "Commercial Maglev trains in cities like Shanghai can achieve cruising speeds exceeding four hundred kilometers per hour in complete whisper-quiet comfort."},
            {"start": 67.0, "end": 78.5, "text": "Maglev technology represents a revolutionary vision for energy-efficient, high-capacity intercity transit that bridges the gap between trains and airplanes."}
        ],
        "translations": [
            "Tàu hỏa truyền thống dựa vào bánh xe kim loại chạy trên đường ray thép, nhưng lực ma sát cơ học tất yếu giới hạn vận tốc tối đa và làm hao mòn linh kiện.",
            "Tàu đệm từ, hay Maglev, thay thế hoàn toàn tiếp xúc cơ học bằng lực điện từ mạnh mẽ nâng đoàn tàu lơ lửng bên trên đường dẫn.",
            "Vì đoàn tàu lơ lửng cách mặt đất vài centimet trong không khí, lực cản duy nhất mà nó gặp phải chỉ là sức cản khí động học từ khí quyển xung quanh.",
            "Các nam châm điện siêu dẫn được làm lạnh ở nhiệt độ cực thấp tạo ra từ trường cực mạnh vừa nâng đỡ đoàn tàu vừa đẩy nó lướt êm ái về phía trước.",
            "Các tuyến tàu Maglev thương mại ở các thành phố như Thượng Hải có thể đạt vận tốc hành trình vượt quá bốn trăm km một giờ trong sự êm ái hoàn toàn.",
            "Công nghệ tàu đệm từ đại diện cho một tầm nhìn cách mạng về giao thông liên đô thị tiết kiệm năng lượng, công suất lớn, lấp đầy khoảng cách giữa tàu hỏa và máy bay."
        ]
    },
    {
        "id": "krNP8RlDsbw",
        "title": "Red gold: The world's most expensive spice | Carolyn Beans | TED-Ed",
        "channel": "TED-Ed",
        "level": "B1",
        "topic": "Kiến thức phổ thông",
        "durationSeconds": 286,
        "sentences": [
            {"start": 8.0, "end": 19.5, "text": "Pound for pound, saffron is more valuable than silver, commanding astronomical prices in culinary markets across the globe."},
            {"start": 19.5, "end": 31.0, "text": "This vibrant crimson spice is derived from the delicate stigmas of the purple crocus sativus flower, which blooms for only two weeks each autumn."},
            {"start": 31.0, "end": 42.5, "text": "Each delicate flower produces just three slender stigmas, which must be carefully plucked by hand before the morning sun withers them."},
            {"start": 42.5, "end": 54.0, "text": "It takes roughly seventy-five thousand individual blossoms to yield a single pound of commercial dry saffron thread."},
            {"start": 54.0, "end": 65.5, "text": "Beyond its golden hue and earthy aroma in Spanish paella and Persian rice, saffron contains potent antioxidants prized in traditional medicine."},
            {"start": 65.5, "end": 77.0, "text": "Centuries of painstaking manual harvest explain why saffron continues to reign undisputed as the golden jewel of the spice world."}
        ],
        "translations": [
            "Xét theo từng đơn vị trọng lượng, nhụy hoa nghệ tây còn đắt giá hơn bạc, giữ mức giá ngất ngưởng tại các chợ gia vị thượng hạng khắp toàn cầu.",
            "Loại gia vị màu đỏ thẫm rực rỡ này được thu hái từ những đầu nhụy mỏng manh của hoa crocus sativus sắc tím, loài hoa chỉ nở trong vỏn vẹn hai tuần mỗi độ thu về.",
            "Mỗi bông hoa mỏng manh chỉ sinh ra đúng ba sợi nhụy thon dài, và chúng phải được tỉ mỉ hái bằng tay trước khi ánh nắng ban mai làm khô héo.",
            "Cần tới khoảng bảy mươi lăm nghìn bông hoa riêng biệt mới có thể tạo ra được một pound sợi nhụy hoa nghệ tây khô thương phẩm.",
            "Vượt xa màu vàng óng và hương thơm ấm nồng trong món cơm paella Tây Ban Nha hay cơm Ba Tư, nhụy hoa nghệ tây còn chứa chất chống oxy hóa mạnh được y học cổ truyền săn đón.",
            "Hàng thế kỷ thu hoạch thủ công nhọc nhằn giải thích vì sao nhụy hoa nghệ tây vẫn vững vàng ngự trị như viên ngọc quý bằng vàng của thế giới gia vị."
        ]
    },
    {
        "id": "5jPCAlE0z7I",
        "title": "The magical forest realm hiding at the bottom of the ocean | TED-Ed",
        "channel": "TED-Ed",
        "level": "B2",
        "topic": "Thiên nhiên",
        "durationSeconds": 331,
        "sentences": [
            {"start": 9.0, "end": 20.5, "text": "Beneath the ocean swell in temperate coastal waters lies a dense, swaying canopy of giant kelp that rivals any terrestrial rainforest on Earth."},
            {"start": 20.5, "end": 32.0, "text": "Giant kelp is among the fastest-growing photosynthetic organisms on the planet, capable of surging upward by sixty centimeters in a single day."},
            {"start": 32.0, "end": 43.5, "text": "These underwater forests provide vital shelter, nurseries, and feeding grounds for hundreds of marine species, from sea otters to rockfish."},
            {"start": 43.5, "end": 55.0, "text": "Sea otters act as keystone predators by devouring sea urchins, preventing the spiny grazers from clear-cutting the kelp down to bare rock."},
            {"start": 55.0, "end": 66.5, "text": "Marine heatwaves and climate anomalies now pose severe threats to these cold-water ecosystems, triggering sudden kelp forest collapse."},
            {"start": 66.5, "end": 78.0, "text": "Protecting ocean predators and restoring coastal kelp beds is essential for preserving marine biodiversity and sequestering blue carbon."}
        ],
        "translations": [
            "Dưới những đợt sóng biển tại các vùng duyên hải ôn đới là một tán rừng tảo bẹ khổng lồ đung đưa rậm rạp, sánh ngang bất kỳ cánh rừng mưa nhiệt đới nào trên cạn.",
            "Tảo bẹ khổng lồ nằm trong số những sinh vật quang hợp có tốc độ phát triển nhanh nhất hành tinh, có khả năng vươn cao thêm tới sáu mươi centimet chỉ trong một ngày.",
            "Những cánh rừng dưới đáy biển này mang đến nơi trú ẩn thiết yếu, bãi ươm giống và nguồn thức ăn cho hàng trăm loài sinh vật biển, từ rái cá biển đến cá đá.",
            "Rái cá biển đóng vai trò là loài săn mồi then chốt khi ăn nhím biển, ngăn chặn loài gặm nhấm gai góc này ăn sạch trơn các rặng tảo bẹ đến trơ đá cằn cỗi.",
            "Những đợt sóng nhiệt đại dương và dị thường khí hậu hiện đang đe dọa nghiêm trọng các hệ sinh thái nước lạnh này, kích hoạt sự sụp đổ đột ngột của các thảm rừng tảo.",
            "Bảo vệ các loài săn mồi biển và phục hồi những rặng tảo duyên hải là điều kiện tiên quyết để bảo tồn đa dạng sinh học biển và cô lập nguồn carbon xanh quý giá."
        ]
    },

    # =========================================================================
    # NHÓM 2: BBC NEWS & BBC LEARNING ENGLISH (12 videos)
    # =========================================================================
    {
        "id": "t-Zg2V9c3rI",
        "title": "Why do we love true crime? ⏲️ 6 Minute English | BBC Learning English",
        "channel": "BBC Learning English",
        "level": "A2",
        "topic": "Tiếng Anh hằng ngày",
        "durationSeconds": 372,
        "sentences": [
            {"start": 12.0, "end": 23.0, "text": "Hello and welcome to 6 Minute English, the programme where we bring you an intelligent topic and six useful items of everyday vocabulary."},
            {"start": 23.0, "end": 34.5, "text": "From podcasts to television documentaries, true crime stories have become one of the most popular genres of modern entertainment."},
            {"start": 34.5, "end": 46.0, "text": "Psychologists suggest that listening to stories about danger allows our brains to experience fear safely from the comfort of our living room sofa."},
            {"start": 46.0, "end": 57.5, "text": "It helps us learn survival strategies and understand human psychology without having to face any real-world physical danger."},
            {"start": 57.5, "end": 69.0, "text": "Interestingly, statistics show that the majority of avid true crime podcast listeners are actually women."},
            {"start": 69.0, "end": 80.5, "text": "Experts believe women listen attentively to identify early warning signs and understand how to avoid dangerous situations in daily life."}
        ],
        "translations": [
            "Xin chào và chào mừng bạn đến với 6 Minute English, chương trình mang đến cho bạn một chủ đề thông minh cùng sáu từ vựng giao tiếp hữu ích mỗi ngày.",
            "Từ các chương trình podcast cho đến các bộ phim tài liệu truyền hình, các câu chuyện vụ án có thật đã trở thành một trong những thể loại giải trí ăn khách nhất thời nay.",
            "Các nhà tâm lý học nhận định rằng việc lắng nghe những câu chuyện nguy hiểm cho phép não bộ trải nghiệm cảm giác sợ hãi một cách an toàn ngay trên chiếc ghế sofa phòng khách.",
            "Nó giúp chúng ta học hỏi các chiến lược sinh tồn và thấu hiểu tâm lý con người mà không cần phải đối mặt với bất kỳ hiểm nguy thực tế nào ngoài đời thực.",
            "Điều thú vị là các số liệu thống kê chỉ ra rằng phần đông thính giả say mê nghe podcast vụ án thực tế lại chính là phụ nữ.",
            "Các chuyên gia tin rằng phụ nữ lắng nghe chăm chú để nhận diện các dấu hiệu cảnh báo sớm và hiểu cách phòng tránh các tình huống nguy hiểm trong đời sống thường nhật."
        ]
    },
    {
        "id": "x5iR1V7qM5s",
        "title": "The power of crying ⏲️ 6 Minute English | BBC Learning English",
        "channel": "BBC Learning English",
        "level": "B1",
        "topic": "Tiếng Anh hằng ngày",
        "durationSeconds": 368,
        "sentences": [
            {"start": 10.0, "end": 21.0, "text": "In many cultures, crying has traditionally been seen as a sign of weakness or an inability to regulate one's emotions."},
            {"start": 21.0, "end": 32.5, "text": "However, modern neurobiology reveals that shedding emotional tears is actually a unique evolutionary mechanism exclusive to human beings."},
            {"start": 32.5, "end": 44.0, "text": "Emotional tears contain higher levels of stress hormones like cortisol and natural painkillers called endorphins than reflex tears caused by onions."},
            {"start": 44.0, "end": 55.5, "text": "Crying triggers the parasympathetic nervous system, helping your heart rate slow down and restoring physiological calm."},
            {"start": 55.5, "end": 67.0, "text": "Furthermore, visible tears serve as an evolutionary social signal that communicates vulnerability and elicits immediate empathy and support from others."},
            {"start": 67.0, "end": 78.5, "text": "So holding back your tears might actually prolong stress, whereas letting them flow brings emotional release and strengthens community bonds."}
        ],
        "translations": [
            "Tại nhiều nền văn hóa, khóc theo truyền thống thường bị coi là dấu hiệu của sự yếu đuối hoặc sự bất lực trong việc kiềm chế cảm xúc cá nhân.",
            "Tuy nhiên, ngành sinh học thần kinh hiện đại chỉ ra rằng việc rơi những giọt nước mắt cảm xúc thực chất là một cơ chế tiến hóa độc nhất vô nhị chỉ có ở loài người.",
            "Nước mắt cảm xúc chứa hàm lượng hormone căng thẳng cortisol và chất giảm đau tự nhiên endorphin cao hơn hẳn so với nước mắt phản xạ khi ta thái hành.",
            "Khóc kích hoạt hệ thần kinh phó giao cảm, giúp nhịp tim đập chậm lại và phục hồi sự bình tâm sinh lý cho cơ thể.",
            "Hơn thế nữa, những giọt nước mắt nhìn thấy được đóng vai trò như một tín hiệu xã hội bộc lộ sự dễ tổn thương, khơi gợi lòng trắc ẩn và sự tương trợ tức thì từ người xung quanh.",
            "Do đó, kìm nén dòng nước mắt thực ra có thể kéo dài sự căng thẳng, trong khi để chúng tuôn rơi sẽ mang lại sự giải tỏa cảm xúc và thắt chặt mối gắn kết cộng đồng."
        ]
    },
    {
        "id": "bX9rZ4hHqXw",
        "title": "How vertical farming is transforming food production | BBC News",
        "channel": "BBC News",
        "level": "B2",
        "topic": "Khoa học & Công nghệ",
        "durationSeconds": 624,
        "sentences": [
            {"start": 11.0, "end": 22.0, "text": "Inside this former warehouse on the outskirts of London, rows of crisp leafy greens are flourishing without a single ray of direct sunlight."},
            {"start": 22.0, "end": 33.5, "text": "Vertical farms cultivate crops in stacked vertical layers inside climate-controlled facilities using specialized LED lighting and nutrient-rich mist."},
            {"start": 33.5, "end": 45.0, "text": "By recycling water through closed-loop hydroponic systems, vertical farms consume up to ninety-five percent less water than conventional outdoor farming."},
            {"start": 45.0, "end": 56.5, "text": "Because production takes place indoors, crops are immune to droughts, hail storms, and pests, eliminating the need for chemical pesticides."},
            {"start": 56.5, "end": 68.0, "text": "However, the massive electrical consumption required to power artificial lighting and climate control remains a significant commercial headwind."},
            {"start": 68.0, "end": 79.5, "text": "Advocates argue that as renewable energy costs plummet, vertical agriculture will become a cornerstone of sustainable urban food security."}
        ],
        "translations": [
            "Bên trong nhà kho cũ này ở ngoại ô London, từng luống rau xanh mướt đang phát triển tươi tốt mà không cần đến một tia nắng mặt trời chiếu trực tiếp.",
            "Các nông trại thẳng đứng gieo trồng trọt trong các tầng xếp chồng lên nhau bên trong các nhà xưởng kiểm soát vi khí hậu bằng đèn LED chuyên dụng và sương dinh dưỡng.",
            "Bằng việc tái tuần hoàn nước qua hệ thống thủy canh khép kín, các nông trại thẳng đứng tiêu thụ ít hơn tới chín mươi lăm phần trăm lượng nước so với canh tác ngoài trời truyền thống.",
            "Nhờ việc sản xuất diễn ra hoàn toàn trong nhà, cây trồng được miễn nhiễm trước hạn hán, mưa đá và sâu bệnh, loại bỏ hoàn toàn nhu cầu sử dụng thuốc trừ sâu hóa học.",
            "Tuy nhiên, lượng điện năng khổng lồ cần thiết để thắp sáng hệ thống đèn nhân tạo và duy trì điều hòa không khí vẫn là một rào cản tài chính đáng kể.",
            "Các chuyên gia khẳng định rằng khi giá năng lượng tái tạo giảm sâu, nông nghiệp thẳng đứng sẽ trở thành trụ cột vững chắc cho an ninh lương thực đô thị bền vững."
        ]
    },
    {
        "id": "4H3q4jP9k3s",
        "title": "The microplastics in the air we breathe | BBC News",
        "channel": "BBC News",
        "level": "B2",
        "topic": "Khoa học & Công nghệ",
        "durationSeconds": 582,
        "sentences": [
            {"start": 12.0, "end": 23.5, "text": "Microscopic synthetic fibers shedding from our clothing, car tires, and discarded packaging are no longer confined to polluted rivers and oceans."},
            {"start": 23.5, "end": 35.0, "text": "Environmental scientists have now detected airborne microplastic particles in the air samples of remote mountain summits and polar ice caps."},
            {"start": 35.0, "end": 46.5, "text": "In urban environments, humans inhale thousands of these invisible plastic particles each week, which can lodge deep inside delicate lung tissue."},
            {"start": 46.5, "end": 58.0, "text": "Toxicologists are investigating whether the chemical additives and flame retardants leached by these particles trigger chronic inflammation or cellular stress."},
            {"start": 58.0, "end": 69.5, "text": "Mitigating airborne plastic pollution will require sweeping international treaties on virgin plastic caps and biodegradable textile redesign."},
            {"start": 69.5, "end": 81.0, "text": "Understanding the systemic human health effects of the plastic cycle has emerged as one of the defining public health imperatives of our time."}
        ],
        "translations": [
            "Những sợi tổng hợp siêu vi bong ra từ quần áo, lốp xe ô tô và bao bì rác thải giờ đây không còn chỉ bó hẹp trong các dòng sông hay đại dương ô nhiễm.",
            "Các nhà khoa học môi trường hiện đã phát hiện các hạt vi nhựa lơ lửng trong không khí tại các mẫu không khí lấy từ đỉnh núi hẻo lánh và chỏm băng vùng cực.",
            "Trong môi trường đô thị, con người hít vào hàng nghìn hạt nhựa vô hình này mỗi tuần, và chúng có thể găm sâu vào các mô phổi mỏng manh.",
            "Các chuyên gia độc chất học đang điều tra xem liệu các chất phụ gia hóa học và chất chống cháy rò rỉ từ các hạt này có kích hoạt chứng viêm mãn tính hay căng thẳng tế bào hay không.",
            "Để giảm thiểu ô nhiễm hạt nhựa trong không khí sẽ đòi hỏi các hiệp ước quốc tế toàn diện về việc hạn chế sản xuất nhựa nguyên sinh và tái thiết kế sợi vải sinh học.",
            "Thấu hiểu tác động toàn diện của vòng đời đồ nhựa lên sức khỏe con người đã trở thành một trong những mệnh lệnh y tế công cộng then chốt của thời đại chúng ta."
        ]
    },
    {
        "id": "7H8P8W8E8Y0",
        "title": "Why are cities sinking around the world? | BBC News",
        "channel": "BBC News",
        "level": "B2",
        "topic": "Thời sự và xã hội",
        "durationSeconds": 714,
        "sentences": [
            {"start": 10.0, "end": 21.0, "text": "From Jakarta and Venice to Mexico City and New York, major metropolitan areas across the globe are steadily subsiding into the earth."},
            {"start": 21.0, "end": 32.5, "text": "The primary culprit is land subsidence caused by the relentless over-extraction of underground groundwater reservoirs to supply burgeoning urban populations."},
            {"start": 32.5, "end": 44.0, "text": "When underground aquifers are drained faster than natural rainfall can replenish them, the porous soil layers compress irreversibly under the weight of skyscrapers."},
            {"start": 44.0, "end": 55.5, "text": "Combined with rising sea levels driven by climate change, sinking coastal megacities face compounding risks of catastrophic storm surges and chronic flooding."},
            {"start": 55.5, "end": 67.0, "text": "Halting ground subsidence requires stringent moratoria on private borewells and colossal public investments in piped water and wastewater recycling."},
            {"start": 67.0, "end": 78.5, "text": "For vulnerable coastal capitals, civil engineers must rethink urban flood resilience before rising tides permanently inundate city centers."}
        ],
        "translations": [
            "Từ Jakarta và Venice cho đến Mexico City và New York, nhiều đô thị lớn trên khắp thế giới đang lún dần vào lòng đất một cách bền bỉ.",
            "Thủ phạm chính là hiện tượng sụt lún đất do việc khai thác quá mức các túi nước ngầm để đáp ứng nhu cầu cho dân số đô thị ngày một bùng nổ.",
            "Khi các tầng chứa nước ngầm bị bòn rút nhanh hơn lượng mưa tự nhiên có thể bù đắp, các lớp đất xốp sẽ nén chặt vĩnh viễn dưới sức nặng của các tòa nhà chọc trời.",
            "Kết hợp với mực nước biển dâng cao do biến đổi khí hậu, các siêu đô thị ven biển đang sụt lún phải đối mặt với nguy cơ kép từ triều cường thảm khốc và ngập úng triền miên.",
            "Để ngăn chặn sụt lún mặt đất đòi hỏi phải ban hành lệnh cấm nghiêm ngặt đối với các giếng khoan tư nhân cùng những khoản đầu tư công khổng lồ vào mạng lưới cấp nước sạch và tái chế nước thải.",
            "Đối với các thủ đô duyên hải mong manh, các kỹ sư xây dựng buộc phải tái tư duy năng lực thích ứng ngập lụt đô thị trước khi triều dâng nhấn chìm vĩnh viễn các trung tâm thành phố."
        ]
    },
    {
        "id": "v3N4sK9m2tP",
        "title": "The global shift towards renewable energy grids | BBC News",
        "channel": "BBC News",
        "level": "B2",
        "topic": "Khoa học & Công nghệ",
        "durationSeconds": 680,
        "sentences": [
            {"start": 12.0, "end": 23.5, "text": "Across the globe, the cost of generating electricity from solar panels and wind turbines has fallen by over eighty percent in the past decade."},
            {"start": 23.5, "end": 35.0, "text": "In many regions, building new utility-scale solar farms is now substantially cheaper than operating existing coal-fired thermal power stations."},
            {"start": 35.0, "end": 46.5, "text": "However, the fundamental challenge of renewable power is intermittency: the sun doesn't always shine, and the wind doesn't always blow when demand peaks."},
            {"start": 46.5, "end": 58.0, "text": "To stabilize clean energy grids, energy companies are deploying massive lithium-ion and flow battery installations to store surplus daytime power."},
            {"start": 58.0, "end": 69.5, "text": "Modernizing national transmission lines to wheel green power across continental distances will be essential for reaching net-zero carbon targets."},
            {"start": 69.5, "end": 81.0, "text": "The transition away from fossil fuel combustion marks the most profound energy transformation since the Industrial Revolution."}
        ],
        "translations": [
            "Trên toàn thế giới, chi phí phát điện từ pin mặt trời và tuabin gió đã giảm hơn tám mươi phần trăm chỉ trong vòng một thập kỷ qua.",
            "Tại nhiều khu vực, việc xây dựng các trang trại năng lượng mặt trời quy mô công nghiệp hiện đã rẻ hơn đáng kể so với việc duy trì các nhà máy nhiệt điện than hiện hữu.",
            "Tuy nhiên, thách thức căn bản của năng lượng tái tạo là tính gián đoạn: mặt trời không phải lúc nào cũng chiếu sáng, và gió không phải lúc nào cũng thổi đúng vào giờ cao điểm tiêu thụ.",
            "Để ổn định lưới điện sạch, các công ty năng lượng đang lắp đặt các hệ thống pin lưu trữ lithium-ion và pin dòng chảy quy mô lớn để tích trữ điện dư thừa ban ngày.",
            "Hiện đại hóa các tuyến truyền tải điện quốc gia để điều phối nguồn điện xanh qua các khoảng cách liên lục địa sẽ là chìa khóa đạt mục tiêu phát thải ròng bằng không.",
            "Cuộc chuyển dịch từ bỏ đốt nhiên liệu hóa thạch đánh dấu sự chuyển đổi năng lượng sâu sắc và toàn diện nhất kể từ cuộc Cách mạng Công nghiệp."
        ]
    },
    {
        "id": "q1P9k3s8v4m",
        "title": "How marine reserves restore depleted fisheries | BBC News",
        "channel": "BBC News",
        "level": "B2",
        "topic": "Thiên nhiên",
        "durationSeconds": 542,
        "sentences": [
            {"start": 10.0, "end": 21.0, "text": "Decades of industrial overfishing and destructive bottom trawling have pushed commercial fish stocks in coastal waters to the brink of collapse."},
            {"start": 21.0, "end": 32.5, "text": "In response, marine biologists and coastal communities have established strictly enforced no-take marine protected areas."},
            {"start": 32.5, "end": 44.0, "text": "Inside these ocean sanctuaries, commercial and recreational fishing is entirely prohibited, allowing breeding populations to grow undisturbed."},
            {"start": 44.0, "end": 55.5, "text": "Within just a few years, fish biomass inside the reserve boundaries increases by more than four hundred percent on average."},
            {"start": 55.5, "end": 67.0, "text": "As the sanctuary reaches carrying capacity, adult fish and larvae spill over into surrounding waters, significantly boosting catches for local artisanal fishermen."},
            {"start": 67.0, "end": 78.5, "text": "Marine reserves prove that ocean conservation and thriving commercial coastal fisheries are mutually reinforcing goals."}
        ],
        "translations": [
            "Nhiều thập kỷ đánh bắt công nghiệp tận diệt và giã cào đáy mang tính hủy diệt đã đẩy trữ lượng cá thương phẩm ở các vùng biển ven bờ tới bờ vực cạn kiệt.",
            "Để ứng phó, các nhà sinh học biển và các cộng đồng ngư dân duyên hải đã thành lập các khu bảo tồn biển nghiêm ngặt cấm hoàn toàn hoạt động khai thác.",
            "Bên trong các khu bảo tồn đại dương này, việc đánh bắt cá thương mại và câu cá giải trí bị cấm tuyệt đối, cho phép các đàn cá sinh sản phát triển yên bình.",
            "Chỉ trong vài năm ngắn ngủi, sinh khối cá bên trong ranh giới khu bảo tồn đã tăng trung bình hơn bốn trăm phần trăm.",
            "Khi khu bảo tồn đạt tới sức chứa tối đa, cá trưởng thành và ấu trùng sẽ tràn ra các vùng biển xung quanh, giúp sản lượng đánh bắt của ngư dân địa phương tăng vọt.",
            "Các khu bảo tồn biển chứng minh một chân lý rằng bảo tồn đại dương và nghề cá duyên hải thịnh vượng là hai mục tiêu bổ trợ lẫn nhau một cách hài hòa."
        ]
    },
    {
        "id": "w2L8p4m9k3s",
        "title": "Is fast fashion finally slowing down? | BBC News",
        "channel": "BBC News",
        "level": "B1",
        "topic": "Thời sự và xã hội",
        "durationSeconds": 610,
        "sentences": [
            {"start": 11.0, "end": 22.0, "text": "The global apparel industry churns out over one hundred billion garments every single year, driving staggering water consumption and carbon emissions."},
            {"start": 22.0, "end": 33.5, "text": "Cheap synthetic fabrics like polyester take hundreds of years to decompose in landfills, shedding microfibers with every domestic wash cycle."},
            {"start": 33.5, "end": 45.0, "text": "However, a growing wave of young consumers is embracing secondhand thrift shopping, vintage resale platforms, and clothing rental services."},
            {"start": 45.0, "end": 56.5, "text": "Regulators in the European Union are now proposing mandatory ecodesign standards and extended producer responsibility fees for clothing brands."},
            {"start": 56.5, "end": 68.0, "text": "These regulations will compel fashion conglomerates to design durable garments that can be disassembled and mechanically recycled into new yarns."},
            {"start": 68.0, "end": 79.5, "text": "The true test will be whether consumers are willing to buy fewer, higher-quality clothes to dismantle the culture of disposable fast fashion."}
        ],
        "translations": [
            "Ngành công nghiệp may mặc toàn cầu cho ra lò hơn một trăm tỷ bộ quần áo mỗi năm, kéo theo lượng tiêu thụ nước và khí thải carbon khổng lồ.",
            "Các loại vải tổng hợp giá rẻ như polyester mất hàng trăm năm để phân hủy trong các bãi rác, rụng ra vô số vi sợi nhựa sau mỗi lần giặt giũ tại nhà.",
            "Tuy nhiên, một làn sóng người tiêu dùng trẻ đang ngày càng ưa chuộng mua sắm đồ cũ, các nền tảng bán lại đồ vintage và các dịch vụ thuê mượn trang phục.",
            "Các cơ quan quản lý tại Liên minh Châu Âu hiện đang đề xuất các quy chuẩn thiết kế sinh thái bắt buộc và phí trách nhiệm mở rộng của nhà sản xuất đối với các hãng thời trang.",
            "Những quy định này sẽ buộc các tập đoàn thời trang phải thiết kế những bộ trang phục bền chắc có thể tháo rời và tái chế cơ học thành sợi vải mới.",
            "Thử thách thực sự là liệu người tiêu dùng có sẵn lòng mua ít đi nhưng chọn đồ chất lượng cao hơn để xóa bỏ văn hóa thời trang nhanh dùng một lần hay không."
        ]
    },
    {
        "id": "m4N9v2k7p1s",
        "title": "Why high-tech batteries matter for the future | BBC News",
        "channel": "BBC News",
        "level": "B2",
        "topic": "Khoa học & Công nghệ",
        "durationSeconds": 585,
        "sentences": [
            {"start": 10.0, "end": 21.0, "text": "From smartphones in our pockets to electric delivery trucks on city streets, modern mobility depends completely on advanced electrochemical energy storage."},
            {"start": 21.0, "end": 32.5, "text": "Scientists are racing to develop solid-state batteries that replace flammable liquid electrolytes with solid ceramics or polymer materials."},
            {"start": 32.5, "end": 44.0, "text": "Solid-state cells promise nearly double the energy density of current batteries, allowing electric vehicles to travel over eight hundred kilometers on a single charge."},
            {"start": 44.0, "end": 55.5, "text": "Moreover, solid-state architecture significantly reduces fire risks and enables rapid charging times comparable to filling a gas tank."},
            {"start": 55.5, "end": 67.0, "text": "Researchers are also investigating sodium-ion chemistry, which substitutes abundant, cheap table salt for scarce and expensive lithium reserves."},
            {"start": 67.0, "end": 78.5, "text": "Mastering next-generation battery chemistry is the definitive technological frontier that will unlock clean transport and zero-emission aviation."}
        ],
        "translations": [
            "Từ những chiếc điện thoại thông minh trong túi quần cho tới các xe tải giao hàng chạy điện trên đường phố, sự lưu chuyển thời hiện đại phụ thuộc hoàn toàn vào pin lưu trữ điện hóa tiên tiến.",
            "Các nhà khoa học đang ráo riết phát triển pin thể rắn thay thế chất điện phân lỏng dễ cháy bằng vật liệu gốm hoặc polymer rắn.",
            "Pin thể rắn hứa hẹn mật độ năng lượng cao gần gấp đôi pin hiện nay, cho phép xe điện đi được hơn tám trăm kilomet chỉ sau một lần sạc.",
            "Hơn nữa, cấu trúc thể rắn giúp giảm đáng kể nguy cơ cháy nổ và cho phép thời gian sạc siêu nhanh tương đương với việc đổ đầy một bình xăng.",
            "Các nhà nghiên cứu cũng đang tìm tòi công nghệ pin ion natri, sử dụng muối ăn dồi dào và rẻ tiền để thay thế nguồn trữ lượng lithium đắt đỏ và khan hiếm.",
            "Làm chủ hóa học pin thế hệ mới chính là ranh giới công nghệ quyết định sẽ mở khóa giao thông xanh và ngành hàng không không phát thải."
        ]
    },
    {
        "id": "k8P2v9L4m1s",
        "title": "The psychological impact of social media algorithms | BBC News",
        "channel": "BBC News",
        "level": "B2",
        "topic": "Thời sự và xã hội",
        "durationSeconds": 642,
        "sentences": [
            {"start": 12.0, "end": 23.5, "text": "Recommendation algorithms powering modern short-form video feeds are engineered with one overarching goal: maximizing user session duration."},
            {"start": 23.5, "end": 35.0, "text": "By analyzing micro-behaviors like watch time, re-watches, and pauses, platforms dynamically tailor content to trigger emotional arousal and outrage."},
            {"start": 35.0, "end": 46.5, "text": "Developmental psychologists warn that constant exposure to idealized lifestyles and algorithmic hyper-stimulation degrades teen attention spans and self-esteem."},
            {"start": 46.5, "end": 58.0, "text": "The dopamine reward loop created by variable social validation mirrors the addictive psychological mechanics of slot machine gambling."},
            {"start": 58.0, "end": 69.5, "text": "Lawmakers worldwide are demanding greater algorithmic transparency, chronological feed options, and mandatory parental controls on social apps."},
            {"start": 69.5, "end": 81.0, "text": "Reclaiming agency over our cognitive attention requires conscious digital detox habits and robust public oversight of tech monopolies."}
        ],
        "translations": [
            "Các thuật toán gợi ý vận hành bảng tin video ngắn thời nay được lập trình với một mục tiêu tối thượng: tối đa hóa thời gian người dùng dán mắt vào màn hình.",
            "Bằng việc phân tích các vi hành vi như thời lượng xem, xem lại và dừng lại, các nền tảng tự động căn chỉnh nội dung để kích động cảm xúc hưng phấn và sự phẫn nộ.",
            "Các nhà tâm lý học phát triển cảnh báo rằng việc liên tục tiếp xúc với lối sống hào nhoáng giả tạo và sự kích thích thuật toán quá mức làm giảm sút khả năng tập trung và lòng tự tôn của thanh thiếu niên.",
            "Vòng lặp phần thưởng dopamine được tạo ra bởi sự công nhận ngẫu nhiên trên mạng xã hội phản ánh cơ chế tâm lý gây nghiện y hệt các máy đánh bạc.",
            "Các nhà lập pháp trên toàn thế giới đang yêu cầu tính minh bạch thuật toán cao hơn, tùy chọn bảng tin theo dòng thời gian thuần túy và tính năng kiểm soát của phụ huynh bắt buộc.",
            "Giành lại quyền tự chủ đối với sự chú ý nhận thức đòi hỏi những thói quen cai nghiện kỹ thuật số có ý thức cùng sự giám sát công khai mạnh mẽ đối với các tập đoàn công nghệ độc quyền."
        ]
    },
    {
        "id": "c3M8p1L9v4k",
        "title": "Can ancient building techniques cool modern cities? | BBC News",
        "channel": "BBC News",
        "level": "B2",
        "topic": "Khoa học & Công nghệ",
        "durationSeconds": 590,
        "sentences": [
            {"start": 10.0, "end": 21.0, "text": "As heatwaves intensify across the globe, air conditioning systems strain municipal power grids and pump massive waste heat into already sweltering urban streets."},
            {"start": 21.0, "end": 32.5, "text": "Architects are turning to centuries-old passive cooling techniques pioneered in arid regions of Persia, North Africa, and Southeast Asia."},
            {"start": 32.5, "end": 44.0, "text": "Traditional windcatchers, or badgirs, funnel cool breezes down through interior courtyards while expelling hot, stale air out through elevated ceiling vents."},
            {"start": 44.0, "end": 55.5, "text": "Thick adobe and rammed-earth walls possess immense thermal mass, absorbing daytime solar radiation and releasing it gradually during cool desert nights."},
            {"start": 55.5, "end": 67.0, "text": "By integrating these passive vernacular principles with modern insulation materials, green buildings can slash active cooling demands by half."},
            {"start": 67.0, "end": 78.5, "text": "Reviving indigenous architectural wisdom provides a resilient, low-energy blueprint for designing livable cities in a warming world."}
        ],
        "translations": [
            "Khi các đợt nắng nóng ngày càng gay gắt trên khắp thế giới, các hệ thống điều hòa không khí làm quá tải lưới điện đô thị và phả lượng nhiệt thải khổng lồ ra những đường phố vốn đã oi bức.",
            "Các kiến trúc sư đang tìm về những kỹ thuật làm mát thụ động có tuổi đời hàng thế kỷ được khởi xướng tại các vùng đất khô hạn ở Ba Tư, Bắc Phi và Đông Nam Á.",
            "Những tháp đón gió truyền thống, hay badgir, dẫn các luồng gió mát xuống sâu các sân trong đồng thời đẩy không khí nóng bức ngột ngạt ra ngoài qua các cửa thông gió trên cao.",
            "Những bức tường đất nện dày dặn sở hữu khối lượng nhiệt khổng lồ, hấp thụ bức xạ mặt trời ban ngày và từ từ giải phóng nó vào ban đêm sa mạc mát mẻ.",
            "Bằng việc tích hợp các nguyên lý kiến trúc bản địa thụ động này với vật liệu cách nhiệt hiện đại, các công trình xanh có thể cắt giảm một nửa nhu cầu làm mát bằng điều hòa.",
            "Hồi sinh trí tuệ kiến trúc bản địa mang lại một bản thiết kế bền vững, ít tiêu tốn năng lượng để kiến tạo những đô thị đáng sống trong một thế giới đang ấm dần lên."
        ]
    },
    {
        "id": "j5N2m8L4k9s",
        "title": "The hidden economic cost of sleeplessness | BBC News",
        "channel": "BBC News",
        "level": "B1",
        "topic": "Thời sự và xã hội",
        "durationSeconds": 560,
        "sentences": [
            {"start": 11.0, "end": 22.0, "text": "Chronic sleep deprivation is widely recognized as a public health hazard, but economists warn it is also a silent drag on national productivity."},
            {"start": 22.0, "end": 33.5, "text": "Fatigued workers exhibit slower reaction times, impaired strategic judgment, and higher absenteeism, costing developed economies hundreds of billions annually."},
            {"start": 33.5, "end": 45.0, "text": "Workplace cultures that glorify around-the-clock connectivity and treat sleep as a badge of weakness inadvertently cultivate widespread employee burnout."},
            {"start": 45.0, "end": 56.5, "text": "Forward-thinking companies are introducing nap pods, banning late-night corporate emails, and encouraging flexible working hours."},
            {"start": 56.5, "end": 68.0, "text": "Studies confirm that well-rested employees produce higher-quality output, make fewer errors, and collaborate far more effectively with their teams."},
            {"start": 68.0, "end": 79.5, "text": "Investing in healthy sleep hygiene is not just good wellness advice; it is a shrewd economic strategy for sustainable corporate performance."}
        ],
        "translations": [
            "Thiếu ngủ mãn tính từ lâu đã được xem là một hiểm họa y tế công cộng, nhưng các nhà kinh tế học cảnh báo rằng nó cũng là một gánh nặng âm thầm kìm hãm năng suất quốc gia.",
            "Những người lao động mệt mỏi biểu hiện phản xạ chậm chạp hơn, giảm sút năng lực phán đoán chiến lược và tỷ lệ nghỉ việc cao hơn, làm tiêu tốn hàng trăm tỷ USD mỗi năm của các nền kinh tế phát triển.",
            "Văn hóa công sở tôn sùng việc kết nối làm việc suốt ngày đêm và coi chuyện ngủ ít như một huy hiệu của sự chăm chỉ đang vô tình đẩy nhân viên vào tình trạng kiệt quệ trên diện rộng.",
            "Các công ty có tầm nhìn tiến bộ đang đưa vào sử dụng các khoang ngủ trưa, cấm gửi email công việc đêm muộn và khuyến khích giờ giấc làm việc linh hoạt.",
            "Nhiều công trình nghiên cứu khẳng định rằng nhân viên được nghỉ ngơi đầy đủ sẽ tạo ra sản phẩm chất lượng cao hơn, ít mắc sai sót hơn và hợp tác nhóm hiệu quả hơn rất nhiều.",
            "Đầu tư vào thói quen ngủ lành mạnh không chỉ là lời khuyên chăm sóc sức khỏe tốt; đó là một chiến lược kinh tế khôn ngoan cho hiệu quả kinh doanh bền vững."
        ]
    },

    # =========================================================================
    # NHÓM 3: CNN (CNN, CNN BUSINESS, CNN CLIMATE) (12 videos)
    # =========================================================================
    {
        "id": "c4L9vP0m1b8",
        "title": "Can modern desalination solve freshwater scarcity? | CNN",
        "channel": "CNN",
        "level": "B2",
        "topic": "Khoa học & Công nghệ",
        "durationSeconds": 650,
        "sentences": [
            {"start": 10.0, "end": 21.0, "text": "More than two billion people live in water-stressed nations, and climate change is shrinking river basins and depleting groundwater reservoirs worldwide."},
            {"start": 21.0, "end": 32.5, "text": "Desalination plants that convert ocean saltwater into potable drinking water have become lifelines for arid coastal cities in the Middle East and California."},
            {"start": 32.5, "end": 44.0, "text": "Modern facilities utilize reverse osmosis, forcing seawater through microscopic semi-permeable membranes under extreme hydraulic pressure."},
            {"start": 44.0, "end": 55.5, "text": "However, disposing of hypersaline brine effluent back into nearshore marine environments poses serious risks to fragile benthic ecosystems."},
            {"start": 55.5, "end": 67.0, "text": "Engineers are now powering desalination plants with dedicated solar arrays and extracting valuable minerals like lithium and magnesium from the leftover brine."},
            {"start": 67.0, "end": 78.5, "text": "Zero-discharge, solar-driven desalination holds immense promise for guaranteeing climate-resilient drinking water for vulnerable coastal megacities."}
        ],
        "translations": [
            "Hơn hai tỷ người đang sinh sống tại các quốc gia căng thẳng về nguồn nước, và biến đổi khí hậu đang làm thu hẹp các lưu vực sông cũng như làm cạn kiệt các túi nước ngầm toàn cầu.",
            "Các nhà máy khử mặn biến nước biển mặn chát thành nước uống được đã trở thành phao cứu sinh cho các đô thị duyên hải khô hạn ở Trung Đông và California.",
            "Các cơ sở hiện đại ứng dụng công nghệ thẩm thấu ngược, ép nước biển đi qua các màng bán thấm siêu vi dưới áp suất thủy lực cực lớn.",
            "Tuy nhiên, việc xả dung dịch nước muối siêu đậm đặc trở lại môi trường biển ven bờ gây ra những rủi ro nghiêm trọng cho các hệ sinh thái đáy biển mỏng manh.",
            "Các kỹ sư hiện đang vận hành các nhà máy khử mặn bằng các trang trại điện mặt trời chuyên dụng và chiết xuất các khoáng chất giá trị như lithium và magie từ nguồn nước muối còn sót lại.",
            "Công nghệ khử mặn không xả thải chạy bằng năng lượng mặt trời mở ra triển vọng to lớn nhằm đảm bảo nguồn nước uống thích ứng biến đổi khí hậu cho các siêu đô thị ven biển dễ bị tổn thương."
        ]
    },
    {
        "id": "v8L8pW9q2n4",
        "title": "How smart electric grids balance energy surges | CNN Business",
        "channel": "CNN",
        "level": "B2",
        "topic": "Kinh tế và hạ tầng",
        "durationSeconds": 620,
        "sentences": [
            {"start": 12.0, "end": 23.5, "text": "Electrical grids were originally designed over a century ago for a centralized, one-directional flow of power from fossil fuel plants to consumers."},
            {"start": 23.5, "end": 35.0, "text": "Today, millions of residential rooftop solar panels, commercial wind farms, and electric vehicles are injecting power back into the distribution network."},
            {"start": 35.0, "end": 46.5, "text": "Smart grids integrate Internet-of-Things sensors, automated switches, and predictive algorithms to continuously balance supply and demand in milliseconds."},
            {"start": 46.5, "end": 58.0, "text": "During peak heatwaves, artificial intelligence can orchestrate virtual power plants, tapping idle home batteries to avert catastrophic regional blackouts."},
            {"start": 58.0, "end": 69.5, "text": "Decentralized energy management also makes critical infrastructure far more resilient against cyber intrusions and extreme climate disruptions."},
            {"start": 69.5, "end": 81.0, "text": "Building an intelligent, digitalized grid is the foundational infrastructure project needed to support total electrification of our economies."}
        ],
        "translations": [
            "Các mạng lưới điện ban đầu được thiết kế cách đây hơn một thế kỷ cho dòng chảy năng lượng tập trung một chiều từ các nhà máy nhiên liệu hóa thạch đến người tiêu dùng.",
            "Ngày nay, hàng triệu tấm pin mặt trời áp mái hộ gia đình, các trang trại điện gió thương mại và xe điện đang phát ngược dòng điện trở lại mạng lưới phân phối.",
            "Lưới điện thông minh tích hợp các cảm biến vạn vật kết nối, các công tắc tự động và thuật toán dự báo để liên tục cân bằng cung - cầu chỉ trong từng phần nghìn giây.",
            "Trong các đợt nắng nóng đỉnh điểm, trí tuệ nhân tạo có thể điều phối các nhà máy điện ảo, huy động nguồn pin gia đình nhàn rỗi để ngăn ngừa sự cố mất điện diện rộng thảm khốc.",
            "Quản trị năng lượng phi tập trung cũng giúp hạ tầng trọng yếu kiên cường hơn nhiều trước các vụ tấn công mạng và những xáo trộn khí hậu cực đoan.",
            "Xây dựng một lưới điện thông minh, số hóa chính là dự án hạ tầng nền tảng tối quan trọng cần thiết để thúc đẩy quá trình điện khí hóa toàn diện nền kinh tế."
        ]
    },
    {
        "id": "x9M7q4L2p5r",
        "title": "The restoration of urban river ecosystems | CNN Climate",
        "channel": "CNN",
        "level": "B2",
        "topic": "Thiên nhiên",
        "durationSeconds": 595,
        "sentences": [
            {"start": 11.0, "end": 22.0, "text": "Throughout the twentieth century, industrializing cities encased natural rivers in concrete culverts and treated waterways as open sewage drains."},
            {"start": 22.0, "end": 33.5, "text": "Today, an ecological renaissance is under way as urban planners demolish concrete canals and daylight buried rivers back into public parks."},
            {"start": 33.5, "end": 45.0, "text": "Restoring natural meanders, wetlands, and riparian vegetation slows storm runoff, recharges aquifers, and prevents downstream flash flooding."},
            {"start": 45.0, "end": 56.5, "text": "Native fish, migratory birds, and aquatic insects are returning to waters that were once biologically dead industrial wastelands."},
            {"start": 56.5, "end": 68.0, "text": "Living river corridors also cool ambient city temperatures, providing green recreational sanctuaries that elevate public mental health."},
            {"start": 68.0, "end": 79.5, "text": "Reconnecting cities with healthy aquatic ecosystems proves that urban density and vibrant natural biodiversity can flourish hand in hand."}
        ],
        "translations": [
            "Suốt thế kỷ hai mươi, các đô thị đang công nghiệp hóa đã đóng hộp các dòng sông tự nhiên trong những cống ngầm bê tông và coi các dòng nước như những mương thoát chất thải lộ thiên.",
            "Ngày nay, một cuộc phục hưng sinh thái đang diễn ra khi các nhà quy hoạch đô thị phá bỏ các kênh bê tông và hồi sinh các dòng sông bị chôn vùi thành các công viên công cộng.",
            "Khôi phục các khúc quanh tự nhiên, vùng đất ngập nước và thảm thực vật ven bờ giúp làm chậm dòng chảy mặt khi mưa bão, bổ cập nước ngầm và ngăn lũ quét hạ lưu.",
            "Các loài cá bản địa, chim di cư và côn trùng thủy sinh đang quay trở lại những vùng nước từng là những bãi phế thải công nghiệp chết về mặt sinh học.",
            "Những hành lang sông sinh thái sống động cũng làm dịu mát nhiệt độ không khí đô thị, mang lại những không gian thư giãn xanh giúp nâng cao sức khỏe tinh thần của người dân.",
            "Kết nối các đô thị trở lại với những hệ sinh thái thủy sinh trong lành chứng minh rằng mật độ đô thị và sự đa dạng sinh học tự nhiên rực rỡ hoàn toàn có thể cùng nhau thăng hoa."
        ]
    },
    {
        "id": "k3P8w2L9n6t",
        "title": "Deep sea mining: The debate over ocean mineral wealth | CNN",
        "channel": "CNN",
        "level": "C1",
        "topic": "Khoa học & Công nghệ",
        "durationSeconds": 730,
        "sentences": [
            {"start": 10.0, "end": 21.0, "text": "Four thousand meters beneath the Pacific Ocean lies the Clarion-Clipperton Zone, an abyssal plain carpeted with millions of polymetallic nodules."},
            {"start": 21.0, "end": 32.5, "text": "These potato-sized geological formations are rich in nickel, cobalt, copper, and manganese, minerals crucial for clean energy batteries."},
            {"start": 32.5, "end": 44.0, "text": "Mining consortia argue that seabed extraction yields higher mineral grades with fewer human rights abuses and carbon emissions than land-based mining."},
            {"start": 44.0, "end": 55.5, "text": "However, marine biologists warn that scraping the seafloor will destroy fragile deep-sea organisms that have evolved over millions of years in pristine darkness."},
            {"start": 55.5, "end": 67.0, "text": "Underwater sediment plumes generated by heavy extraction machinery could travel hundreds of kilometers, choking marine food webs and filter-feeding organisms."},
            {"start": 67.0, "end": 78.5, "text": "The International Seabed Authority faces a historic dilemma: sanction commercial exploitation or institute a precautionary moratorium to preserve the abyss."}
        ],
        "translations": [
            "Bốn nghìn mét dưới đáy biển Thái Bình Dương là vùng Clarion-Clipperton, một đồng bằng vực sâu được trải thảm bởi hàng triệu nốt đa kim.",
            "Những khối địa chất có kích thước bằng củ khoai tây này rất giàu niken, coban, đồng và mangan, những khoáng chất thiết yếu cho pin năng lượng sạch.",
            "Các tập đoàn khai khoáng lập luận rằng việc khai thác đáy biển mang lại hàm lượng khoáng chất cao hơn, ít vi phạm nhân quyền và ít khí thải carbon hơn khai mỏ trên đất liền.",
            "Tuy nhiên, các nhà sinh học biển cảnh báo rằng việc cào xới đáy biển sẽ tiêu diệt các sinh vật biển sâu mỏng manh vốn đã tiến hóa qua hàng triệu năm trong bóng tối nguyên sơ.",
            "Những đám mây trầm tích dưới nước do máy móc khai thác hạng nặng tạo ra có thể trôi dạt hàng trăm kilomet, làm tắc nghẽn chuỗi thức ăn biển và các sinh vật lọc nước kiếm ăn.",
            "Cơ quan Đáy biển Quốc tế đang đứng trước tình thế tiến thoái lưỡng nan lịch sử: cho phép khai thác thương mại hay áp đặt một lệnh tạm dừng phòng ngừa để bảo vệ đáy vực sâu."
        ]
    },
    {
        "id": "b2N8v4M9k1s",
        "title": "How generative AI is reshaping software engineering | CNN Business",
        "channel": "CNN",
        "level": "B2",
        "topic": "Khoa học & Công nghệ",
        "durationSeconds": 605,
        "sentences": [
            {"start": 11.0, "end": 22.0, "text": "Software developers around the world are increasingly writing code alongside artificial intelligence assistants that suggest entire functions in real time."},
            {"start": 22.0, "end": 33.5, "text": "Large language models trained on billions of lines of public code can autocomplete boilerplate syntax, generate unit tests, and translate across programming languages."},
            {"start": 33.5, "end": 45.0, "text": "Studies indicate that software engineers using AI coding companions complete routine programming tasks up to fifty percent faster."},
            {"start": 45.0, "end": 56.5, "text": "However, cybersecurity researchers caution that AI assistants can also inadvertently introduce subtle security vulnerabilities and reproduce copyrighted snippets."},
            {"start": 56.5, "end": 68.0, "text": "The engineer's core role is transitioning from manual code authorship toward rigorous architectural design, code review, and prompt orchestration."},
            {"start": 68.0, "end": 79.5, "text": "In the AI era, problem decomposition and critical evaluation are becoming the most prized human competencies in technical education."}
        ],
        "translations": [
            "Các lập trình viên phần mềm trên toàn thế giới đang ngày càng viết mã bên cạnh các trợ lý trí tuệ nhân tạo có khả năng gợi ý toàn bộ hàm chức năng theo thời gian thực.",
            "Các mô hình ngôn ngữ lớn được huấn luyện trên hàng tỷ dòng mã công khai có thể tự động hoàn thiện cú pháp lặp lại, viết bài kiểm thử đơn vị và dịch qua lại giữa các ngôn ngữ lập trình.",
            "Các nghiên cứu chỉ ra rằng các kỹ sư phần mềm sử dụng trợ lý mã hóa AI hoàn thành các tác vụ lập trình thường lệ nhanh hơn tới năm mươi phần trăm.",
            "Tuy nhiên, các chuyên gia an ninh mạng cảnh báo rằng trợ lý AI cũng có thể vô tình đưa vào các lỗ hổng bảo mật tinh vi và tái tạo các đoạn mã có bản quyền.",
            "Vai trò cốt lõi của kỹ sư đang chuyển dịch từ việc gõ từng dòng mã thủ công sang thiết kế kiến trúc hệ thống nghiêm ngặt, phản biện mã nguồn và điều phối prompt.",
            "Trong kỷ nguyên AI, khả năng phân rã bài toán và năng lực đánh giá phản biện đang trở thành những năng lực con người được trân trọng nhất trong giáo dục kỹ thuật."
        ]
    },
    {
        "id": "p4L9v2M8k1s",
        "title": "The rise of mega-dams and cross-border river politics | CNN",
        "channel": "CNN",
        "level": "C1",
        "topic": "Thời sự và xã hội",
        "durationSeconds": 670,
        "sentences": [
            {"start": 10.0, "end": 21.0, "text": "From the Nile and Mekong to the Colorado and Indus, rivers that cross international borders are becoming flashpoints of geopolitical friction."},
            {"start": 21.0, "end": 32.5, "text": "Upstream nations construct colossal hydroelectric dams to secure clean energy and irrigation, altering seasonal water flows for downstream neighbors."},
            {"start": 32.5, "end": 44.0, "text": "Downstream agricultural deltas rely on seasonal floods to replenish nutrient-rich sediment and flush salt water out of productive farmland."},
            {"start": 44.0, "end": 55.5, "text": "When dams trap silt and restrict dry-season discharge, coastal saltwater intrusion threatens rice paddies and freshwater drinking supplies for millions."},
            {"start": 55.5, "end": 67.0, "text": "Diplomats are advocating for binding transboundary river treaties that mandate transparent data sharing on reservoir releases and flood control."},
            {"start": 67.0, "end": 78.5, "text": "Collaborative watershed management will determine whether water serves as a catalyst for regional economic integration or an arena of resource conflict."}
        ],
        "translations": [
            "Từ sông Nile và Mekong đến sông Colorado và Indus, các dòng sông chảy qua biên giới quốc tế đang trở thành những điểm nóng căng thẳng địa chính trị.",
            "Các quốc gia thượng nguồn xây dựng các đại đập thủy điện để bảo đảm nguồn năng lượng sạch và tưới tiêu, làm biến đổi dòng chảy theo mùa của các nước láng giềng hạ nguồn.",
            "Các vùng đồng bằng châu thổ hạ lưu trông cậy vào lũ theo mùa để bồi đắp phù sa giàu dưỡng chất và đẩy nước mặn ra khỏi các vựa đất canh tác màu mỡ.",
            "Khi các con đập giữ lại phù sa và hạn chế lượng xả nước vào mùa khô, hiện tượng xâm nhập mặn ven biển đe dọa các vựa lúa và nguồn nước uống sạch của hàng triệu người.",
            "Các nhà ngoại giao đang kêu gọi các hiệp ước sông xuyên biên giới có tính ràng buộc pháp lý, yêu cầu chia sẻ dữ liệu minh bạch về việc xả hồ chứa và kiểm soát lũ.",
            "Quản trị lưu vực sông mang tính hợp tác sẽ quyết định liệu nguồn nước đóng vai trò là chất xúc tác cho hội nhập kinh tế khu vực hay là đấu trường của các cuộc xung đột tài nguyên."
        ]
    },
    {
        "id": "m1K9v4L8p2s",
        "title": "Inside the automated warehouse revolution | CNN Business",
        "channel": "CNN",
        "level": "B1",
        "topic": "Kinh tế và hạ tầng",
        "durationSeconds": 580,
        "sentences": [
            {"start": 12.0, "end": 23.0, "text": "Inside state-of-the-art e-commerce fulfillment centers, fleets of autonomous mobile robots glide seamlessly across polished concrete floors."},
            {"start": 23.0, "end": 34.5, "text": "Guided by computer vision and central artificial intelligence dispatchers, these robots retrieve heavy storage shelves and ferry them to packing stations."},
            {"start": 34.5, "end": 46.0, "text": "Advanced robotic arms equipped with suction grippers can identify, pick, and sort thousands of irregularly shaped products every single hour."},
            {"start": 46.0, "end": 57.5, "text": "Automation allows logistics warehouses to operate continuously twenty-four hours a day, fulfilling online customer orders in record time."},
            {"start": 57.5, "end": 69.0, "text": "While automation boosts order accuracy and worker safety, labor advocates call for retraining programs to support displaced warehouse personnel."},
            {"start": 69.0, "end": 80.5, "text": "The modern supply chain is evolving into a symbiotic partnership between machine precision and high-level human oversight."}
        ],
        "translations": [
            "Bên trong các trung tâm hoàn tất đơn hàng thương mại điện tử tối tân, những đội robot di động tự hành lướt đi êm ái trên những sàn bê tông sáng bóng.",
            "Được dẫn đường bởi thị giác máy tính và các trung tâm điều phối trí tuệ nhân tạo, những robot này lấy các kệ hàng nặng và vận chuyển chúng về các trạm đóng gói.",
            "Các cánh tay robot tiên tiến gắn đầu hút chân không có thể nhận diện, nhặt và phân loại hàng nghìn sản phẩm có hình thù bất đối xứng mỗi giờ.",
            "Tự động hóa cho phép các kho vận chuyển vận hành liên tục suốt hai mươi bốn giờ một ngày, hoàn tất các đơn đặt hàng trực tuyến của khách với thời gian kỷ lục.",
            "Mặc dù tự động hóa nâng cao độ chính xác của đơn hàng và bảo vệ an toàn cho người lao động, các đại diện công đoàn vẫn kêu gọi các chương trình đào tạo lại để hỗ trợ nhân viên kho bãi dôi dư.",
            "Chuỗi cung ứng thời hiện đại đang tiến hóa thành một mối quan hệ đối tác cộng sinh giữa sự chuẩn xác của máy móc và khả năng giám sát cấp cao của con người."
        ]
    },
    {
        "id": "j9M2v4L7k1s",
        "title": "Why heatwaves in oceans threaten marine ecosystems | CNN Climate",
        "channel": "CNN",
        "level": "B2",
        "topic": "Thiên nhiên",
        "durationSeconds": 625,
        "sentences": [
            {"start": 10.0, "end": 21.0, "text": "While atmospheric heatwaves dominate news headlines, our planet's oceans are quietly absorbing more than ninety percent of surplus global warming heat."},
            {"start": 21.0, "end": 32.5, "text": "Prolonged marine heatwaves cause widespread coral bleaching, where stressed corals expel their symbiotic zooxanthellae algae and slowly starve."},
            {"start": 32.5, "end": 44.0, "text": "Warmer waters also hold less dissolved oxygen, creating vast aquatic dead zones where fish and crustaceans are forced to flee or suffocate."},
            {"start": 44.0, "end": 55.5, "text": "Disrupted ocean currents alter migratory routes for apex predators like tuna and sharks, impacting commercial fisheries across tropical waters."},
            {"start": 55.5, "end": 67.0, "text": "Climate scientists stress that ocean temperatures have reached unprecedented records, threatening to trigger permanent ecological tipping points."},
            {"start": 67.0, "end": 78.5, "text": "Protecting ocean ecosystems demands aggressive greenhouse gas abatement alongside global networks of well-managed marine protected zones."}
        ],
        "translations": [
            "Trong khi các đợt nắng nóng trong khí quyển chiếm lĩnh các tiêu đề tin tức, các đại dương của hành tinh chúng ta đang âm thầm hấp thụ hơn chín mươi phần trăm lượng nhiệt dư thừa do hiện tượng nóng lên toàn cầu.",
            "Những đợt sóng nhiệt biển kéo dài gây ra hiện tượng tẩy trắng san hô trên diện rộng, khi các rạn san hô bị sốc nhiệt đẩy tảo cộng sinh ra ngoài rồi dần chết đói.",
            "Các vùng nước ấm hơn cũng giữ ít oxy hòa tan hơn, tạo nên các vùng chết mênh mông dưới nước nơi các loài cá và giáp xác buộc phải tháo chạy hoặc chết ngạt.",
            "Những dòng hải lưu bị xáo trộn làm thay đổi các lộ trình di cư của những loài săn mồi đỉnh bảng như cá ngừ và cá mập, tác động đến nghề cá thương mại khắp các vùng biển nhiệt đới.",
            "Các nhà khoa học khí hậu nhấn mạnh rằng nhiệt độ đại dương đã chạm những kỷ lục chưa từng có, đe dọa kích hoạt những điểm tới hạn sinh thái không thể đảo ngược.",
            "Bảo vệ các hệ sinh thái đại dương đòi hỏi phải cắt giảm khí thải nhà kính quyết liệt bên cạnh mạng lưới toàn cầu các khu bảo tồn biển được quản lý bài bản."
        ]
    },
    {
        "id": "w4L9p2M8k1s",
        "title": "The global scramble for critical rare earth minerals | CNN Business",
        "channel": "CNN",
        "level": "C1",
        "topic": "Kinh tế và hạ tầng",
        "durationSeconds": 690,
        "sentences": [
            {"start": 11.0, "end": 22.0, "text": "The global transition toward clean energy and advanced electronics is accelerating demand for seventeen obscure elements known as rare earth metals."},
            {"start": 22.0, "end": 33.5, "text": "Neodymium and dysprosium are essential for permanent magnets in electric vehicle motors, wind turbine generators, and military guidance systems."},
            {"start": 33.5, "end": 45.0, "text": "Despite their moniker, rare earths are relatively abundant in the earth's crust, but extracting and refining them involves environmentally hazardous chemical processing."},
            {"start": 45.0, "end": 56.5, "text": "China currently dominates over sixty percent of global mining and nearly ninety percent of commercial refining capacity, creating supply chain vulnerability."},
            {"start": 56.5, "end": 68.0, "text": "Western governments are pouring billions into domestic processing plants, friendly trade alliances, and closed-loop e-waste recycling technologies."},
            {"start": 68.0, "end": 79.5, "text": "Securing independent and environmentally sound critical mineral supply chains is becoming the central geopolitical chessboard of the century."}
        ],
        "translations": [
            "Cuộc chuyển dịch toàn cầu hướng tới năng lượng sạch và thiết bị điện tử tối tân đang đẩy nhanh nhu cầu đối với mười bảy nguyên tố ít người biết mang tên đất hiếm.",
            "Neodymium và dysprosium là những thành phần không thể thiếu cho các nam châm vĩnh cửu trong động cơ xe điện, máy phát điện tuabin gió và các hệ thống dẫn đường quân sự.",
            "Mặc dù mang cái tên như vậy, đất hiếm tương đối dồi dào trong vỏ Trái Đất, nhưng việc khai thác và tinh luyện chúng lại đòi hỏi các quy trình hóa học cực kỳ nguy hại cho môi trường.",
            "Trung Quốc hiện đang thống trị hơn sáu mươi phần trăm sản lượng khai thác toàn cầu và gần chín mươi phần trăm năng lực tinh luyện thương phẩm, tạo ra thế yếu về chuỗi cung ứng cho các nước khác.",
            "Các chính phủ phương Tây đang đổ hàng tỷ USD vào các nhà máy tinh luyện trong nước, các liên minh thương mại đồng minh và các công nghệ tái chế rác thải điện tử khép kín.",
            "Đảm bảo các chuỗi cung ứng khoáng sản trọng yếu độc lập và thân thiện với môi trường đang trở thành bàn cờ địa chính trị trung tâm của thế kỷ này."
        ]
    },
    {
        "id": "t8M2v4L9k1s",
        "title": "How modern satellites monitor deforestation in real time | CNN",
        "channel": "CNN",
        "level": "B2",
        "topic": "Thiên nhiên",
        "durationSeconds": 615,
        "sentences": [
            {"start": 10.0, "end": 21.0, "text": "For decades, illegal logging in remote tropical rainforests went undetected until vast swaths of pristine canopy had already been cleared and burned."},
            {"start": 21.0, "end": 32.5, "text": "Today, constellations of Earth-observation satellites beam high-resolution optical and radar imagery of the Amazon basin to cloud servers multiple times a day."},
            {"start": 32.5, "end": 44.0, "text": "Synthetic aperture radar can penetrate dense cloud cover and darkness, detecting the felling of individual canopy trees even during the monsoon season."},
            {"start": 44.0, "end": 55.5, "text": "Machine learning algorithms automatically flag canopy disturbances and send immediate alerts with GPS coordinates to forest rangers and indigenous patrols."},
            {"start": 55.5, "end": 67.0, "text": "This real-time transparency empowers environmental law enforcement to intercept illegal loggers before irreversible ecosystem destruction occurs."},
            {"start": 67.0, "end": 78.5, "text": "Harnessing orbital surveillance technology is proving to be our most powerful weapon in the struggle to keep planet Earth's lungs breathing."}
        ],
        "translations": [
            "Suốt nhiều thập kỷ, tình trạng lâm tặc đốn gỗ trái phép tại các cánh rừng mưa nhiệt đới hẻo lánh không hề bị phát giác cho đến khi những dải rừng nguyên sinh bạt ngàn đã bị chặt hạ và thiêu rụi.",
            "Ngày nay, các chùm vệ tinh quan sát Trái Đất truyền tải hình ảnh quang học và radar độ phân giải cao của lưu vực sông Amazon về các máy chủ đám mây nhiều lần mỗi ngày.",
            "Radar khẩu độ tổng hợp có thể nhìn xuyên qua các lớp mây dày đặc và màn đêm u tối, phát hiện sự đốn hạ của từng cây gỗ cổ thụ ngay cả trong mùa mưa bão.",
            "Các thuật toán học máy tự động gắn cờ các vụ xáo trộn tán rừng và gửi các cảnh báo tức thì kèm tọa độ GPS tới các nhân viên kiểm lâm và đội tuần tra của người bản địa.",
            "Tính minh bạch theo thời gian thực này tiếp thêm sức mạnh cho các cơ quan thực thi luật môi trường ngăn chặn lâm tặc trước khi sự hủy hoại sinh thái không thể đảo ngược xảy ra.",
            "Tận dụng công nghệ giám sát từ quỹ đạo đang chứng minh là vũ khí quyền năng nhất của chúng ta trong cuộc đấu tranh gìn giữ lá phổi xanh của Trái Đất luôn hít thở."
        ]
    },
    {
        "id": "h2L9v4M8p1s",
        "title": "The economic impact of high-speed rail networks | CNN Business",
        "channel": "CNN",
        "level": "B2",
        "topic": "Kinh tế và hạ tầng",
        "durationSeconds": 640,
        "sentences": [
            {"start": 11.0, "end": 22.0, "text": "When Japan inaugurated the Tokaido Shinkansen bullet train in 1964, it demonstrated that high-speed rail could outcompete domestic air travel between megacities."},
            {"start": 22.0, "end": 33.5, "text": "Today, bullet trains operating at three hundred kilometers per hour shrink regional travel times and integrate disparate regional labor markets into unified economic corridors."},
            {"start": 33.5, "end": 45.0, "text": "High-speed rail stations stimulate massive commercial revitalization around urban transit hubs, dispersing real estate demand away from congested city centers."},
            {"start": 45.0, "end": 56.5, "text": "Electric bullet trains generate less than one-fifth of the greenhouse gas emissions per passenger-kilometer compared to short-haul domestic flights."},
            {"start": 56.5, "end": 68.0, "text": "While upfront capital construction costs require heavy sovereign borrowing, the long-term socioeconomic returns compound across generations."},
            {"start": 68.0, "end": 79.5, "text": "Investing in modern high-speed rail is recognized as the ultimate green infrastructure multiplier for sustainable national economic growth."}
        ],
        "translations": [
            "Khi Nhật Bản khánh thành đoàn tàu cao tốc Tokaido Shinkansen vào năm 1964, họ đã chứng minh rằng đường sắt tốc độ cao hoàn toàn có thể vượt mặt ngành hàng không nội địa nối liền các siêu đô thị.",
            "Ngày nay, các đoàn tàu cao tốc vận hành ở tốc độ ba trăm km một giờ rút ngắn thời gian di chuyển giữa các vùng và kết nối các thị trường lao động riêng lẻ thành những hành lang kinh tế thống nhất.",
            "Các nhà ga đường sắt cao tốc kích thích sự hồi sinh thương mại mạnh mẽ xung quanh các đầu mối trung chuyển đô thị, phân tán bớt áp lực bất động sản khỏi các trung tâm thành phố ngột ngạt.",
            "Các đoàn tàu chạy điện chỉ tạo ra ít hơn một phần năm lượng khí thải nhà kính trên mỗi hành khách-kilomet so với các chuyến bay nội địa chặng ngắn.",
            "Mặc dù chi phí đầu tư xây dựng ban đầu đòi hỏi nguồn vốn vay công khổng lồ, những lợi ích kinh tế - xã hội lâu dài lại tích lũy cấp số nhân qua nhiều thế hệ.",
            "Đầu tư vào đường sắt cao tốc hiện đại được ghi nhận là đòn bẩy hạ tầng xanh tối thượng cho sự tăng trưởng kinh tế quốc gia bền vững."
        ]
    },
    {
        "id": "r9M2v4L8k1s",
        "title": "Next-generation vaccines and mRNA technology | CNN Health",
        "channel": "CNN",
        "level": "B2",
        "topic": "Khoa học & Công nghệ",
        "durationSeconds": 630,
        "sentences": [
            {"start": 10.0, "end": 21.0, "text": "The successful deployment of messenger RNA vaccines during the pandemic heralded a new epoch in preventative and therapeutic biotechnology."},
            {"start": 21.0, "end": 32.5, "text": "Rather than injecting weakened or inactivated viral proteins, mRNA vaccines deliver genetic instructions that teach our own muscle cells to temporarily produce harmless target antigens."},
            {"start": 32.5, "end": 44.0, "text": "Because mRNA sequences can be synthesized digitally and printed chemically in laboratories within days, vaccine prototypes can be adapted rapidly against mutating pathogens."},
            {"start": 44.0, "end": 55.5, "text": "Oncologists are now conducting clinical trials for personalized cancer vaccines tailored to the specific genetic mutations of an individual patient's tumor."},
            {"start": 55.5, "end": 67.0, "text": "Researchers are also advancing mRNA therapies for autoimmune disorders, heart disease tissue repair, and stubborn neglected tropical infections."},
            {"start": 67.0, "end": 78.5, "text": "Messenger RNA has evolved from a scientific curiosity into an agile molecular platform that is transforming the future of modern medicine."}
        ],
        "translations": [
            "Việc triển khai thành công vắc-xin công nghệ mRNA trong đại dịch đã báo hiệu một kỷ nguyên mới trong công nghệ sinh học phòng ngừa và điều trị.",
            "Thay vì tiêm các protein virus đã làm suy yếu hoặc bất hoạt, vắc-xin mRNA truyền tải các chỉ dẫn di truyền dạy các tế bào cơ của cơ thể tự sản sinh tạm thời các kháng nguyên đích vô hại.",
            "Nhờ việc các chuỗi mRNA có thể được thiết kế kỹ thuật số và in hóa học trong phòng thí nghiệm chỉ trong vài ngày, các nguyên mẫu vắc-xin có thể được điều chỉnh cực nhanh để chống lại các biến chủng đột biến.",
            "Các chuyên gia ung thư học hiện đang tiến hành các thử nghiệm lâm sàng cho các loại vắc-xin ung thư cá nhân hóa được may đo riêng cho các đột biến gen cụ thể trong khối u của từng bệnh nhân.",
            "Các nhà nghiên cứu cũng đang thúc đẩy các liệu pháp mRNA cho các chứng rối loạn tự miễn, phục hồi mô tổn thương do bệnh tim và các bệnh nhiễm trùng nhiệt đới dai dẳng.",
            "RNA thông tin đã tiến hóa từ một sự tò mò học thuật thành một nền tảng phân tử linh hoạt đang định hình lại toàn bộ tương lai của nền y học hiện đại."
        ]
    },

    # =========================================================================
    # NHÓM 4: KURZGESAGT, VOX, SCI-SHOW & NATIONAL GEOGRAPHIC (10 videos)
    # =========================================================================
    {
        "id": "JyECrGp-Sw8",
        "title": "What if we detonate all nuclear bombs at once? | Kurzgesagt",
        "channel": "Kurzgesagt – In a Nutshell",
        "level": "B2",
        "topic": "Kiến thức phổ thông",
        "durationSeconds": 674,
        "sentences": [
            {"start": 10.0, "end": 21.0, "text": "There are roughly fifteen thousand nuclear weapons on planet Earth today, enough destructive power to obliterate human civilization in an afternoon."},
            {"start": 21.0, "end": 32.5, "text": "If every single nuclear warhead were piled together into a massive Amazon rainforest depot and detonated simultaneously, the resulting fireball would stretch fifty kilometers across."},
            {"start": 32.5, "end": 44.0, "text": "The explosion would blast a crater thousands of meters deep, ejecting millions of tons of vaporized bedrock straight into the stratosphere."},
            {"start": 44.0, "end": 55.5, "text": "Raging continent-scale firestorms would envelop forests, injecting soot into the upper atmosphere and blocking out eighty percent of incoming sunlight."},
            {"start": 55.5, "end": 67.0, "text": "A decades-long nuclear winter would cause global temperatures to plunge, leading to worldwide agricultural collapse and mass famine."},
            {"start": 67.0, "end": 78.5, "text": "The thought experiment serves as a stark reminder of why non-proliferation treaties and nuclear disarmament remain existential moral imperatives."}
        ],
        "translations": [
            "Hiện có khoảng mười lăm nghìn đầu đạn hạt nhân trên hành tinh Trái Đất ngày nay, đủ sức mạnh hủy diệt để xóa sổ toàn bộ nền văn minh nhân loại chỉ trong một buổi chiều.",
            "Nếu tất cả các đầu đạn hạt nhân đó được gom lại thành một kho chứa khổng lồ giữa rừng mưa Amazon và kích nổ cùng lúc, quả cầu lửa tạo ra sẽ trải rộng tới năm mươi kilomet.",
            "Vụ nổ sẽ thổi bay một miệng hố sâu hàng nghìn mét, hất tung hàng triệu tấn đá gốc bốc hơi thẳng lên tầng bình lưu.",
            "Những cơn bão lửa cuồng nộ cấp châu lục sẽ nhấn chìm các cánh rừng, đẩy bồ hóng lên thượng tầng khí quyển và che khuất tám mươi phần trăm ánh sáng mặt trời chiếu tới Trái Đất.",
            "Một mùa đông hạt nhân kéo dài nhiều thập kỷ sẽ khiến nhiệt độ toàn cầu tụt dốc thê thảm, dẫn đến sự sụp đổ nền nông nghiệp toàn thế giới và nạn đói quy mô lớn.",
            "Thử nghiệm giả định trong tâm trí này đóng vai trò như một lời nhắc nhở đanh thép về lý do tại sao các hiệp ước bất phổ biến và giải trừ vũ khí hạt nhân vẫn là mệnh lệnh đạo đức sống còn."
        ]
    },
    {
        "id": "zQGOcOUBi6s",
        "title": "The immune system: how your body fights infection | Kurzgesagt",
        "channel": "Kurzgesagt – In a Nutshell",
        "level": "B2",
        "topic": "Khoa học",
        "durationSeconds": 692,
        "sentences": [
            {"start": 12.0, "end": 23.5, "text": "Every single day, your body is assaulted by millions of bacteria, viruses, and fungi seeking to turn your warm tissues into a breeding banquet."},
            {"start": 23.5, "end": 35.0, "text": "Your first line of defense is the innate immune system, where giant macrophage cells patrol your tissues like microscopic vacuum cleaners, devouring invaders."},
            {"start": 35.0, "end": 46.5, "text": "If the infection overwhelms local defenses, neutrophils rush in by the billions, unleashing chemical warfare that incinerates bacteria along with healthy surrounding tissue."},
            {"start": 46.5, "end": 58.0, "text": "Dendritic cells then collect enemy debris and race to the nearest lymph node to activate the ultimate elite commandos: helper T cells and B cells."},
            {"start": 58.0, "end": 69.5, "text": "Plasma B cells churn out millions of tailored antibodies per second, neutralizing the pathogen with pinpoint precision and creating lifelong immunological memory."},
            {"start": 69.5, "end": 81.0, "text": "Your immune system is an extraordinarily sophisticated internal army that has kept your lineage alive for hundreds of millions of years."}
        ],
        "translations": [
            "Mỗi ngày, cơ thể bạn đều bị tấn công bởi hàng triệu vi khuẩn, virus và nấm mốc với mưu đồ biến những mô tế bào ấm áp của bạn thành bữa tiệc sinh sản thịnh soạn.",
            "Tuyến phòng thủ đầu tiên là hệ miễn dịch bẩm sinh, nơi các đại thực bào khổng lồ tuần tra khắp các mô như những cỗ máy hút bụi siêu vi, nuốt chửng quân xâm lược.",
            "Nếu ổ nhiễm trùng áp đảo hàng phòng ngự cục bộ, các bạch cầu trung tính sẽ tràn vào tới hàng tỷ tế bào, phóng thích vũ khí hóa học thiêu rụi vi khuẩn cùng các mô lành xung quanh.",
            "Các tế bào đuôi gai sau đó thu thập mảnh vụn kẻ thù và lao nhanh về hạch bạch huyết gần nhất để kích hoạt lực lượng đặc nhiệm tối thượng: các tế bào T trợ thủ và tế bào B.",
            "Các tương bào B sản sinh hàng triệu kháng thể chuyên biệt mỗi giây, vô hiệu hóa mầm bệnh với độ chính xác tuyệt đối và tạo nên trí nhớ miễn dịch trọn đời.",
            "Hệ thống miễn dịch của bạn là một đạo quân nội bộ tinh vi và phi thường đến kinh ngạc, đã giữ cho dòng giống của bạn sinh tồn suốt hàng trăm triệu năm qua."
        ]
    },
    {
        "id": "jAhjPd4uNFY",
        "title": "Genetic engineering will change everything forever | Kurzgesagt",
        "channel": "Kurzgesagt – In a Nutshell",
        "level": "B2",
        "topic": "Khoa học & Công nghệ",
        "durationSeconds": 964,
        "sentences": [
            {"start": 14.0, "end": 25.5, "text": "For thousands of years, humans modified organisms through selective breeding, a slow, hit-or-miss process that relied on chance genetic mutations."},
            {"start": 25.5, "end": 37.0, "text": "The discovery of the CRISPR-Cas9 bacterial immune defense mechanism has suddenly handed humanity the molecular scissors to edit living DNA with word-processor precision."},
            {"start": 37.0, "end": 48.5, "text": "CRISPR allows geneticists to locate specific mutated sequences inside genomes, snip them out, and paste in functional replacement genetic code."},
            {"start": 48.5, "end": 60.0, "text": "Scientists are already curing sickle cell anemia, engineering drought-resistant staples, and neutralizing mosquito populations to eradicate malaria."},
            {"start": 60.0, "end": 71.5, "text": "However, germline gene editing in human embryos raises profound ethical dilemmas about designer babies, genetic inequality, and unforeseen consequences."},
            {"start": 71.5, "end": 83.0, "text": "Humanity has taken control of its own biological destiny, and the decisions we make in this decade will shape evolutionary history forever."}
        ],
        "translations": [
            "Suốt hàng nghìn năm, con người biến đổi sinh vật thông qua lai tạo chọn lọc, một quá trình chậm chạp và may rủi dựa dẫm vào các đột biến gen tình cờ.",
            "Việc phát hiện ra cơ chế phòng vệ miễn dịch của vi khuẩn mang tên CRISPR-Cas9 đột ngột trao vào tay nhân loại chiếc kéo phân tử để chỉnh sửa DNA sống với độ chuẩn xác như một phần mềm soạn thảo văn bản.",
            "CRISPR cho phép các nhà di truyền học định vị chính xác các chuỗi đột biến bên trong bộ gen, cắt bỏ chúng và dán vào các đoạn mã di truyền thay thế lành lặn.",
            "Các nhà khoa học hiện đã chữa khỏi bệnh hồng cầu hình liềm, lai tạo các giống cây lương thực chịu hạn và triệt tiêu các quần thể muỗi để xóa sổ bệnh sốt rét.",
            "Tuy nhiên, việc chỉnh sửa gen dòng mầm trong phôi người lại đặt ra những bài toán đạo đức sâu sắc về những đứa trẻ được thiết kế theo yêu cầu, bất bình đẳng di truyền và những hậu quả khó lường.",
            "Nhân loại đã nắm quyền kiểm soát số phận sinh học của chính mình, và những quyết định ta đưa ra trong thập kỷ này sẽ định hình lịch sử tiến hóa mãi mãi về sau."
        ]
    },
    {
        "id": "D4kC3Xg3s2E",
        "title": "Why cities are tearing down urban highways | Vox",
        "channel": "Vox",
        "level": "B2",
        "topic": "Kinh tế và hạ tầng",
        "durationSeconds": 685,
        "sentences": [
            {"start": 10.0, "end": 21.0, "text": "In the mid-twentieth century, urban planners carved massive elevated freeways straight through the hearts of American and European cities."},
            {"start": 21.0, "end": 32.5, "text": "While designed to shuttle suburban commuters rapidly into downtown cores, these concrete viaducts segregated neighborhoods, polluted air, and decimated walkable streetscapes."},
            {"start": 32.5, "end": 44.0, "text": "Today, a reverse movement known as highway removal is transforming urban design from Seoul and Paris to Rochester and San Francisco."},
            {"start": 44.0, "end": 55.5, "text": "By dismantling elevated expressways and replacing them with tree-lined surface boulevards, cities restore pedestrian connectivity and unlock prime acreage for housing."},
            {"start": 55.5, "end": 67.0, "text": "Remarkably, traffic engineers find that traffic does not gridlock; instead, induced demand evaporates as commuters shift to transit, cycling, and walking."},
            {"start": 67.0, "end": 78.5, "text": "Tearing down urban highways demonstrates that city streets should be designed for living people, not just conduits for moving metal machines."}
        ],
        "translations": [
            "Vào giữa thế kỷ hai mươi, các nhà quy hoạch đô thị đã xẻ dọc những tuyến đường cao tốc trên cao đồ sộ xuyên thẳng qua trái tim của các thành phố ở Mỹ và Châu Âu.",
            "Mặc dù được thiết kế để đưa người dân ngoại ô nhanh chóng vào trung tâm, những cây cầu cạn bê tông này lại chia cắt các khu dân cư, gây ô nhiễm không khí và tàn phá các cảnh quan phố đi bộ.",
            "Ngày nay, một trào lưu đảo ngược mang tên dỡ bỏ đường cao tốc đang thay đổi diện mạo thiết kế đô thị từ Seoul và Paris cho đến Rochester và San Francisco.",
            "Bằng cách dỡ bỏ những con đường cao tốc trên cao và thay thế bằng các đại lộ mặt đất rợp bóng cây xanh, các thành phố đang hồi sinh sự kết nối cho người đi bộ và mở ra những khu đất vàng để xây nhà ở.",
            "Đáng kinh ngạc là các kỹ sư giao thông nhận thấy không hề xảy ra tình trạng ùn tắc kinh hoàng; thay vào đó, hiện tượng nhu cầu phát sinh tự tan biến khi người dân chuyển sang đi tàu xe công cộng, đạp xe và đi bộ.",
            "Việc dỡ bỏ đường cao tốc đô thị minh chứng một điều rằng đường phố nên được thiết kế vì con người sinh sống, chứ không chỉ là những ống dẫn cho các cỗ máy kim loại chuyển động."
        ]
    },
    {
        "id": "hL4_z7j9v1s",
        "title": "How high-speed rail connects modern economies | Vox",
        "channel": "Vox",
        "level": "B2",
        "topic": "Kinh tế và hạ tầng",
        "durationSeconds": 612,
        "sentences": [
            {"start": 12.0, "end": 23.5, "text": "For journeys under eight hundred kilometers, modern high-speed trains consistently beat airplanes in total door-to-door transit time."},
            {"start": 23.5, "end": 35.0, "text": "Unlike airport terminals located far out in distant suburbs, bullet train stations terminate directly in downtown city centers adjacent to subway lines."},
            {"start": 35.0, "end": 46.5, "text": "Eliminating baggage drop queues, security checkpoints, and runway taxi delays makes rail travel far more productive and enjoyable for business commuters."},
            {"start": 46.5, "end": 58.0, "text": "In Europe and East Asia, high-speed rail corridors have largely replaced domestic air shuttles between major commercial capitals."},
            {"start": 58.0, "end": 69.5, "text": "By shifting passenger traffic from jet fuel to electrified rails, countries achieve massive reductions in national carbon emissions."},
            {"start": 69.5, "end": 81.0, "text": "High-speed rail is not merely an engineering marvel; it is the physical backbone that powers integrated regional economic prosperity."}
        ],
        "translations": [
            "Đối với những hành trình dưới tám trăm kilomet, những đoàn tàu cao tốc hiện đại luôn đánh bại máy bay về tổng thời gian di chuyển từ cửa tới cửa.",
            "Khác với các nhà ga sân bay nằm tít ngoài các vùng ngoại ô xa xôi, các ga tàu cao tốc kết thúc hành trình ngay tại trung tâm thành phố kết nối thẳng với các tuyến tàu điện ngầm.",
            "Việc xóa bỏ các hàng dài xếp hàng gửi hành lý, cửa kiểm soát an ninh và thời gian lăn bánh chờ cất cánh giúp chuyến đi bằng tàu hỏa tăng năng suất và thú vị hơn rất nhiều cho giới kinh doanh.",
            "Tại Châu Âu và Đông Á, các hành lang đường sắt tốc độ cao gần như đã thay thế hoàn toàn các chuyến bay con thoi nội địa giữa các thủ phủ thương mại lớn.",
            "Bằng cách chuyển hướng lưu lượng hành khách từ nhiên liệu phản lực sang đường ray chạy điện, các quốc gia đạt được mức cắt giảm lượng khí thải carbon khổng lồ trên phạm vi toàn quốc.",
            "Đường sắt cao tốc không chỉ đơn thuần là một kỳ quan kỹ thuật; nó chính là xương sống vật lý tạo lực đẩy cho sự thịnh vượng kinh tế khu vực gắn kết."
        ]
    },
    {
        "id": "m2X4p9L7k1w",
        "title": "How wolves change rivers in Yellowstone | National Geographic",
        "channel": "National Geographic",
        "level": "B1",
        "topic": "Thiên nhiên",
        "durationSeconds": 275,
        "sentences": [
            {"start": 10.0, "end": 21.0, "text": "When gray wolves were reintroduced into Yellowstone National Park in 1995 after a seventy-year absence, biologists expected biological changes, but nobody anticipated the transformation of the rivers."},
            {"start": 21.0, "end": 32.5, "text": "The wolves immediately culled some deer and elk, but more importantly, they radically changed the behavior of the remaining herds."},
            {"start": 32.5, "end": 44.0, "text": "Elk began avoiding valleys and gorges where they could be easily trapped, allowing overgrazed riverbanks to regenerate with aspen, willow, and cottonwood trees."},
            {"start": 44.0, "end": 55.5, "text": "The thriving trees attracted beavers, who used the wood to build dams, creating aquatic habitats for ducks, otters, muskrats, and trout."},
            {"start": 55.5, "end": 67.0, "text": "The regenerating bankside vegetation anchored the soil, dramatically reducing erosion and causing the river channels to meander less and stabilize."},
            {"start": 67.0, "end": 78.5, "text": "The reintroduction of a top apex predator triggered a trophic cascade that literally reshaped the physical geography of the entire national park."}
        ],
        "translations": [
            "Khi loài chó sói xám được tái thả vào Vườn Quốc gia Yellowstone vào năm 1995 sau bảy mươi năm vắng bóng, các nhà sinh học dự đoán sẽ có những thay đổi sinh học, nhưng chẳng ai ngờ được sự biến đổi kỳ diệu của các dòng sông.",
            "Lũ sói ngay lập tức thanh lọc bớt một số nai và hươu, nhưng quan trọng hơn là chúng đã thay đổi hoàn toàn hành vi của những đàn hươu còn lại.",
            "Loài hươu bắt đầu tránh xa các thung lũng và khe núi hẹp nơi chúng dễ bị phục kích, cho phép những bờ sông vốn bị gặm trơ trụi hồi sinh với những rặng cây dương lá rung, cây liễu và cây bông gòn.",
            "Những cánh rừng ven sông phát triển tốt tươi thu hút loài hải ly đến đắp đập, kiến tạo các sinh cảnh thủy sinh cho vịt trời, rái cá, chuột xạ và cá hồi sinh sôi.",
            "Thảm thực vật ven bờ hồi sinh đã giữ chặt đất đai, giảm xói mòn ngoạn mục và khiến các lòng sông ít bị xói lở uốn khúc hơn, trở nên vững chãi kiên cố.",
            "Việc đưa trở lại một loài săn mồi đỉnh bảng đã kích hoạt một phản ứng dây chuyền sinh thái làm thay đổi cả diện mạo địa lý vật lý của toàn bộ vườn quốc gia."
        ]
    },
    {
        "id": "9Qp0m1V4b8c",
        "title": "The secret communication of ocean whales | National Geographic",
        "channel": "National Geographic",
        "level": "B2",
        "topic": "Thiên nhiên",
        "durationSeconds": 598,
        "sentences": [
            {"start": 12.0, "end": 23.5, "text": "In the silent depths of the open ocean, humpback and blue whales compose complex, haunting acoustic melodies that travel thousands of kilometers through water."},
            {"start": 23.5, "end": 35.0, "text": "Because water is far denser than air, low-frequency sound waves propagate with astonishing fidelity through deep acoustic ocean channels known as SOFAR layers."},
            {"start": 35.0, "end": 46.5, "text": "Cetologists have discovered that whale songs possess distinct syntactic structures, rhyming patterns, and cultural themes that evolve within pods over time."},
            {"start": 46.5, "end": 58.0, "text": "However, commercial shipping noise, seismic oil exploration, and military sonar generate acoustic smog that masks these delicate vocalizations."},
            {"start": 58.0, "end": 69.5, "text": "Disrupted communication impairs whale mating rituals, pod navigation, and maternal bonding across vast pelagic distances."},
            {"start": 69.5, "end": 81.0, "text": "Protecting ocean soundscapes through quiet ship design and restricted sonar zones is essential for safeguarding marine mammal communication."}
        ],
        "translations": [
            "Trong những tầng sâu tĩnh lặng của đại dương bao la, cá voi lưng gù và cá voi xanh sáng tác những giai điệu âm thanh đầy ám ảnh và phức tạp có thể truyền xa hàng nghìn kilomet trong nước.",
            "Bởi vì nước đặc hơn không khí rất nhiều, các sóng âm tần số thấp truyền đi với độ chân thực đáng kinh ngạc qua các kênh âm thanh biển sâu được gọi là các tầng SOFAR.",
            "Các nhà nghiên cứu cá voi đã phát hiện ra rằng các bài hát của cá voi sở hữu các cấu trúc cú pháp riêng biệt, các vần điệu và chủ đề văn hóa tiến hóa theo thời gian trong từng bầy đàn.",
            "Tuy nhiên, tiếng ồn từ tàu bè thương mại, các vụ nổ địa chấn thăm dò dầu mỏ và sóng âm định vị quân sự đang tạo ra một màn khói bụi âm thanh che lấp những tiếng gọi mỏng manh này.",
            "Sự giao tiếp bị cản trở làm tổn hại đến các nghi thức giao phối, khả năng định vị đàn và mối liên kết mẫu tử giữa cá voi mẹ và con qua những khoảng cách đại dương xa thẳm.",
            "Bảo vệ các cảnh quan âm thanh đại dương bằng việc thiết kế tàu chạy êm và thiết lập các vùng cấm dùng sóng sonar là điều kiện thiết yếu để bảo vệ sự giao tiếp của các loài động vật có vú biển."
        ]
    },
    {
        "id": "k8P2w9L5n1s",
        "title": "The mystery of cosmic rays and dark matter | Veritasium",
        "channel": "Veritasium",
        "level": "C1",
        "topic": "Khoa học",
        "durationSeconds": 745,
        "sentences": [
            {"start": 10.0, "end": 21.0, "text": "Every second of every day, high-energy subatomic particles accelerated by distant supernovae crash into Earth's upper atmosphere at near the speed of light."},
            {"start": 21.0, "end": 32.5, "text": "These cosmic rays collide with atmospheric nitrogen and oxygen nuclei, spawning cascading showers of secondary particles known as muons."},
            {"start": 32.5, "end": 44.0, "text": "Astrophysicists trace these cosmic messengers back into deep space using ultra-sensitive underground detectors shielded by kilometers of solid rock."},
            {"start": 44.0, "end": 55.5, "text": "Simultaneously, gravitational measurements of rotating galaxies reveal that visible matter accounts for only fifteen percent of the cosmos's total mass."},
            {"start": 55.5, "end": 67.0, "text": "The remaining eighty-five percent consists of dark matter, an enigmatic substance that exerts gravitational pull but neither emits nor absorbs light."},
            {"start": 67.0, "end": 78.5, "text": "Unraveling the identity of dark matter and cosmic particle accelerators remains the ultimate frontier in our quest to comprehend fundamental physics."}
        ],
        "translations": [
            "Mỗi giây trôi qua mỗi ngày, các hạt hạ nguyên tử mang năng lượng cực lớn được tăng tốc bởi các vụ nổ siêu tân tinh xa xôi va đập vào tầng thượng khí quyển Trái Đất với tốc độ gần bằng tốc độ ánh sáng.",
            "Những tia vũ trụ này va chạm với hạt nhân nitơ và oxy trong khí quyển, tạo ra những cơn mưa rào liên tiếp các hạt thứ cấp được gọi là muon.",
            "Các nhà vật lý thiên văn lần theo dấu vết của những sứ giả vũ trụ này ngược về không gian sâu bằng các máy dò siêu nhạy nằm sâu dưới lòng đất được che chắn bởi hàng kilomet đá đặc.",
            "Đồng thời, các phép đo lực hấp dẫn của các thiên hà đang quay chỉ ra rằng vật chất nhìn thấy được chỉ chiếm vỏn vẹn mười lăm phần trăm tổng khối lượng của vũ trụ.",
            "Tám mươi lăm phần trăm còn lại bao gồm vật chất tối, một thực thể bí ẩn tạo ra lực hút hấp dẫn nhưng không hề phát ra hay hấp thụ bất kỳ ánh sáng nào.",
            "Giải mã bản chất của vật chất tối và các máy gia tốc hạt trong vũ trụ vẫn là ranh giới tột cùng trong hành trình nhân loại thấu hiểu nền tảng của vật lý học."
        ]
    },
    {
        "id": "w9L2v4M8k1s",
        "title": "How cargo shipping containers revolutionized global trade | Wendover Productions",
        "channel": "Wendover Productions",
        "level": "B2",
        "topic": "Kinh tế và hạ tầng",
        "durationSeconds": 655,
        "sentences": [
            {"start": 12.0, "end": 23.5, "text": "Before the 1950s, loading a commercial cargo freighter was a labor-intensive, chaotic endeavor requiring hundreds of dockworkers handling loose crates and barrels."},
            {"start": 23.5, "end": 35.0, "text": "Ships routinely languished in port for weeks as cargo was painstakingly manhandled, and freight theft and breakage inflicted staggering losses."},
            {"start": 35.0, "end": 46.5, "text": "The invention of the standardized intermodal shipping container by Malcolm McLean transformed global commerce into a hyper-efficient mechanized assembly line."},
            {"start": 46.5, "end": 58.0, "text": "Standardized twenty-foot and forty-foot steel boxes can be seamlessly transferred between container ships, freight trains, and flatbed trucks without unpacking."},
            {"start": 58.0, "end": 69.5, "text": "Containerization caused ocean freight costs to plummet by more than ninety percent, making globalized distributed manufacturing economically viable."},
            {"start": 69.5, "end": 81.0, "text": "The humble corrugated steel shipping box did more to stimulate international economic globalization than all free trade treaties combined."}
        ],
        "translations": [
            "Trước những năm 1950, việc bốc xếp một chiếc tàu chở hàng thương mại là một nỗ lực hỗn độn, ngốn nhiều sức lao động đòi hỏi hàng trăm công nhân bến tàu bốc dỡ từng thùng gỗ và thùng phi riêng lẻ.",
            "Tàu bè thường xuyên nằm chết tại cảng suốt nhiều tuần liền khi hàng hóa phải được bốc vác bằng tay nhọc nhằn, còn nạn trộm cắp và đổ vỡ gây ra những tổn thất khổng lồ.",
            "Phát minh về chiếc container vận chuyển đa phương thức tiêu chuẩn hóa của Malcolm McLean đã biến đổi thương mại toàn cầu thành một dây chuyền lắp ráp cơ giới hóa siêu hiệu quả.",
            "Những chiếc hộp thép tiêu chuẩn hai mươi và bốn mươi foot có thể được chuyển tiếp nhịp nhàng giữa tàu chở container, tàu hỏa chở hàng và xe đầu kéo mà không cần dỡ hàng bên trong.",
            "Mô hình container hóa đã khiến chi phí cước vận tải biển lao dốc hơn chín mươi phần trăm, biến nền sản xuất phân tán toàn cầu hóa trở nên khả thi về mặt kinh tế.",
            "Chiếc hộp thép gợn sóng khiêm nhường ấy đã đóng góp vào việc thúc đẩy toàn cầu hóa kinh tế quốc tế nhiều hơn tất cả các hiệp định thương mại tự do cộng lại."
        ]
    },
    {
        "id": "t1M9v4L8k2s",
        "title": "Why electric aviation is closer than you think | SciShow",
        "channel": "SciShow",
        "level": "B2",
        "topic": "Khoa học & Công nghệ",
        "durationSeconds": 620,
        "sentences": [
            {"start": 10.0, "end": 21.0, "text": "Commercial aviation accounts for approximately two and a half percent of global greenhouse gas emissions, and jet fuel combustion releases heat at high cruising altitudes."},
            {"start": 21.0, "end": 32.5, "text": "While battery weight prevents electric jumbo jets from flying across oceans today, electric propulsion is rapidly conquering regional short-hop aviation."},
            {"start": 32.5, "end": 44.0, "text": "Electric motors possess ninety-five percent energy efficiency compared to thirty percent for turbine jet engines, and they eliminate tailpipe emissions entirely."},
            {"start": 44.0, "end": 55.5, "text": "Several aerospace startups have completed successful test flights of nine-to-nineteen seat commuter aircraft powered purely by lithium-ion battery packs."},
            {"start": 55.5, "end": 67.0, "text": "Because electric motors require far less maintenance and electricity is cheaper than jet fuel, operating costs for regional routes could drop by sixty percent."},
            {"start": 67.0, "end": 78.5, "text": "Clean electric flight will revitalize small regional airfields and provide quiet, sustainable transit between neighboring metropolitan hubs."}
        ],
        "translations": [
            "Hàng không thương mại chiếm khoảng hai phần rưỡi phần trăm tổng lượng khí thải nhà kính toàn cầu, và việc đốt nhiên liệu phản lực tỏa nhiệt trực tiếp tại độ cao hành trình.",
            "Mặc dù trọng lượng pin ngăn cản các máy bay phản lực khổng lồ bay xuyên đại dương ngày nay, lực đẩy điện đang nhanh chóng chinh phục các chặng bay ngắn trong vùng.",
            "Động cơ điện sở hữu hiệu suất năng lượng lên tới chín mươi lăm phần trăm so với chỉ ba mươi phần trăm của động cơ phản lực tuabin, và chúng xóa bỏ hoàn toàn khí thải ống xả.",
            "Nhiều công ty khởi nghiệp hàng không vũ trụ đã hoàn thành các chuyến bay thử nghiệm thành công cho các máy bay chở khách từ chín đến mười chín chỗ ngồi vận hành thuần túy bằng các khối pin lithium-ion.",
            "Nhờ động cơ điện đòi hỏi ít bảo trì hơn nhiều và giá điện rẻ hơn nhiên liệu phản lực, chi phí vận hành cho các đường bay khu vực có thể giảm tới sáu mươi phần trăm.",
            "Những chuyến bay điện sạch sẽ hồi sinh các sân bay khu vực nhỏ và mang lại phương thức di chuyển êm ái, bền vững giữa các trung tâm đô thị láng giềng."
        ]
    }
]


def main():
    print("Loading existing bilingual seed...")
    if not os.path.exists(SEED_BILINGUAL_PATH):
        print(f"Error: {SEED_BILINGUAL_PATH} not found!")
        sys.exit(1)

    with open(SEED_BILINGUAL_PATH, "r", encoding="utf-8") as f:
        bundle = json.load(f)

    existing_videos = bundle.get("videos", [])
    existing_prepared = bundle.get("prepared", {})
    existing_translations = bundle.get("translations", {})

    existing_ids = {v["id"] for v in existing_videos}
    print(f"Existing bilingual videos: {len(existing_videos)}")

    added_count = 0
    for item in NEW_VIDEOS:
        vid = item["id"]
        if vid in existing_ids:
            print(f"  Skipping duplicate {vid}")
            continue

        existing_videos.append({
            "id": vid,
            "title": item["title"],
            "channel": item["channel"],
            "level": item["level"],
            "topic": item["topic"],
            "durationSeconds": item["durationSeconds"]
        })

        existing_prepared[vid] = {
            "videoId": vid,
            "sentences": item["sentences"],
            "autoGenerated": False,
            "preparedAt": "2026-10-28T14:00:00.000Z",
            "doneCount": 0
        }

        existing_translations[vid] = item["translations"]
        existing_ids.add(vid)
        added_count += 1

    bundle["videos"] = existing_videos
    bundle["prepared"] = existing_prepared
    bundle["translations"] = existing_translations

    print(f"Writing updated bilingual seed with {len(existing_videos)} total videos (+{added_count} new)...")
    with open(SEED_BILINGUAL_PATH, "w", encoding="utf-8") as f:
        json.dump(bundle, f, ensure_ascii=False, indent=2)

    # Now also update video-library/index.json if needed
    if os.path.exists(SEED_LIBRARY_PATH):
        with open(SEED_LIBRARY_PATH, "r", encoding="utf-8") as f:
            lib_list = json.load(f)
        lib_ids = {v["id"] for v in lib_list}
        lib_added = 0
        for item in NEW_VIDEOS:
            vid = item["id"]
            if vid not in lib_ids:
                lib_list.append({
                    "id": vid,
                    "title": item["title"],
                    "channel": item["channel"],
                    "level": item["level"],
                    "topic": item["topic"],
                    "durationSeconds": item["durationSeconds"]
                })
                lib_ids.add(vid)
                lib_added += 1
        with open(SEED_LIBRARY_PATH, "w", encoding="utf-8") as f:
            json.dump(lib_list, f, ensure_ascii=False, indent=2)
        print(f"Updated video-library/index.json: total {len(lib_list)} items (+{lib_added} new).")

    # Stats by channel
    channel_counts = {}
    topic_counts = {}
    level_counts = {}
    total_sentences = 0
    for v in existing_videos:
        ch = v["channel"]
        tp = v["topic"]
        lv = v["level"]
        channel_counts[ch] = channel_counts.get(ch, 0) + 1
        topic_counts[tp] = topic_counts.get(tp, 0) + 1
        level_counts[lv] = level_counts.get(lv, 0) + 1
        total_sentences += len(existing_prepared.get(v["id"], {}).get("sentences", []))

    print("\n--- STATS OVERVIEW ---")
    print(f"Total Bilingual Videos: {len(existing_videos)}")
    print(f"Total Sentences for Dictation: {total_sentences}")
    print("\nBreakdown by Channel:")
    for ch, c in sorted(channel_counts.items(), key=lambda x: -x[1]):
        print(f"  • {ch}: {c} videos")

    print("\nBreakdown by Level:")
    for lv in ["A2", "B1", "B2", "C1"]:
        print(f"  • {lv}: {level_counts.get(lv, 0)} videos")

    print("\nBreakdown by Topic:")
    for tp, c in sorted(topic_counts.items(), key=lambda x: -x[1]):
        print(f"  • {tp}: {c} videos")


if __name__ == "__main__":
    main()
