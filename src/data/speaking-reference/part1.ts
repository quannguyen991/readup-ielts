import type { SpeakingRefPart1Topic } from './types';

/** Part 1: 34 chủ đề, 136 câu hỏi công khai + 3 câu hỏi thêm mỗi chủ đề. */
export const SPEAKING_REF_PART1: SpeakingRefPart1Topic[] = [
  {
    "no": 1,
    "topic": "Where You Live Now",
    "topicVi": "Nơi bạn đang sống",
    "section": "compulsory",
    "ideasVi": [
      "Nói tên thành phố trước, rồi thêm một chi tiết cảm xúc cụ thể.",
      "Với câu hỏi về điều không thích, nêu một vấn đề rõ ràng và tác động của nó."
    ],
    "questions": [
      {
        "n": 1,
        "q": "Which town or city do you live in now?",
        "qVi": "Bạn đang sống ở thị trấn hoặc thành phố nào?",
        "paraphrase": "Which city or town is your current place of residence?",
        "sampleAnswer": "I'm based in Hanoi at the moment. It's a hectic, noisy city, but I've lived here my whole life, so it feels like home. What I love most is how centuries-old streets sit side by side with modern cafés and office towers.",
        "vocab": [
          {
            "word": "hectic",
            "meaningVi": "bận rộn, náo nhiệt",
            "synonyms": [
              "bustling",
              "frantic"
            ],
            "collocation": "a hectic schedule"
          },
          {
            "word": "sit side by side",
            "meaningVi": "nằm cạnh nhau, cùng tồn tại",
            "synonyms": [
              "coexist",
              "exist alongside"
            ],
            "collocation": "sit side by side with"
          }
        ],
        "altDirectionVi": "Nếu sống ở quê hoặc thị trấn nhỏ: nói về sự yên tĩnh và cảm giác gắn bó với cộng đồng."
      },
      {
        "n": 2,
        "q": "Are there any things you don't like about your area?",
        "qVi": "Có điều gì bạn không thích ở khu vực bạn sống không?",
        "paraphrase": "What aspects of your neighbourhood do you find frustrating?",
        "sampleAnswer": "Honestly, the traffic is the biggest headache. Even a short journey can take ages during rush hour. The constant noise from motorbikes and horns is exhausting, and air quality has become a growing concern for me.",
        "vocab": [
          {
            "word": "headache",
            "meaningVi": "điều gây phiền toái",
            "synonyms": [
              "hassle",
              "nuisance"
            ],
            "collocation": "a real headache"
          },
          {
            "word": "take ages",
            "meaningVi": "mất rất lâu",
            "synonyms": [
              "take forever",
              "drag on"
            ],
            "collocation": "take ages to get somewhere"
          }
        ],
        "altDirectionVi": "Có thể chọn vấn đề khác như giá nhà hoặc rác thải, miễn là nêu rõ tác động cụ thể."
      },
      {
        "n": 3,
        "q": "Do you think you will continue to live there for a long time?",
        "qVi": "Bạn có nghĩ mình sẽ tiếp tục sống ở đó lâu dài không?",
        "paraphrase": "Is it likely that you will still be living there in the years ahead?",
        "sampleAnswer": "Probably, yes. I've built my life here, with my job, my friends and my routine all in place. I occasionally daydream about a quieter place by the sea, but there's so much on offer here that I can't see myself moving anytime soon.",
        "vocab": [
          {
            "word": "daydream about",
            "meaningVi": "mơ mộng về",
            "synonyms": [
              "fantasise about",
              "imagine"
            ],
            "collocation": "daydream about a better life"
          },
          {
            "word": "on offer",
            "meaningVi": "có sẵn để lựa chọn",
            "synonyms": [
              "available",
              "to choose from"
            ],
            "collocation": "so much on offer"
          }
        ],
        "altDirectionVi": "Trả lời 'No' và nêu lý do: công việc, học tập, hoặc muốn đổi không khí."
      },
      {
        "n": 4,
        "q": "What are some changes in the area recently?",
        "qVi": "Gần đây khu vực bạn có những thay đổi nào?",
        "paraphrase": "What kinds of transformation has your neighbourhood undergone lately?",
        "sampleAnswer": "There's been a surge in urban development. New apartment buildings are going up everywhere, and older streets have been given a facelift. The café scene has exploded too. It's exciting, though I think some of the old-town character is slipping away.",
        "vocab": [
          {
            "word": "surge",
            "meaningVi": "sự tăng mạnh",
            "synonyms": [
              "spike",
              "boom"
            ],
            "collocation": "a surge in demand"
          },
          {
            "word": "facelift",
            "meaningVi": "làm mới, nâng cấp diện mạo",
            "synonyms": [
              "makeover",
              "renovation"
            ],
            "collocation": "give something a facelift"
          }
        ],
        "altDirectionVi": "Có thể tập trung vào giao thông (đường mới, tàu điện) thay vì xây dựng nhà ở."
      },
      {
        "n": 5,
        "q": "Do you live in a house or an apartment?",
        "qVi": "Bạn sống trong nhà riêng hay căn hộ chung cư?",
        "paraphrase": "Which type of accommodation are you living in at the moment?",
        "sampleAnswer": "I live in an apartment. It isn't huge, but it's practical: a decent kitchen, a small balcony where I unwind in the evenings, and it's close to work, which saves a lot of time. One day I'd love a house with a garden, but for now the apartment suits me perfectly.",
        "vocab": [
          {
            "word": "practical",
            "meaningVi": "thiết thực, tiện dụng",
            "synonyms": [
              "functional",
              "convenient"
            ],
            "collocation": "a practical choice"
          },
          {
            "word": "unwind",
            "meaningVi": "thư giãn",
            "synonyms": [
              "relax",
              "chill out"
            ],
            "collocation": "unwind after work"
          }
        ],
        "altDirectionVi": "Nếu ở nhà riêng: nói về sân vườn; nếu ở chung cư: nói về tiện ích và an ninh."
      },
      {
        "n": 6,
        "q": "What is your favourite room in your home?",
        "qVi": "Căn phòng yêu thích của bạn trong nhà là phòng nào?",
        "paraphrase": "Which space in your home do you enjoy spending time in the most?",
        "sampleAnswer": "My bedroom, without a doubt. I've made it really cosy, with soft lighting, a stack of books and a comfy armchair in the corner. It's my personal retreat after a long day, and once I close the door, I can properly switch off.",
        "vocab": [
          {
            "word": "cosy",
            "meaningVi": "ấm cúng, dễ chịu",
            "synonyms": [
              "snug",
              "homely"
            ],
            "collocation": "a cosy corner"
          },
          {
            "word": "retreat",
            "meaningVi": "nơi trú ẩn yên tĩnh",
            "synonyms": [
              "sanctuary",
              "hideaway"
            ],
            "collocation": "a peaceful retreat"
          }
        ],
        "altDirectionVi": "Có thể chọn phòng bếp (nếu bạn thích nấu ăn) hoặc ban công (nếu thích ngắm cảnh)."
      },
      {
        "n": 7,
        "q": "Are the people in your neighbourhood nice and friendly?",
        "qVi": "Hàng xóm trong khu phố có thân thiện không?",
        "paraphrase": "Would you describe your neighbours as warm and approachable?",
        "sampleAnswer": "For the most part, yes. People say hello, look out for one another, and occasionally lend a hand. We aren't close friends, but there's a quiet sense of community, which I think is underrated. You don't need deep friendships with neighbours, just a bit of goodwill.",
        "vocab": [
          {
            "word": "lend a hand",
            "meaningVi": "giúp một tay",
            "synonyms": [
              "help out",
              "pitch in"
            ],
            "collocation": "lend a hand with"
          },
          {
            "word": "goodwill",
            "meaningVi": "thiện chí, sự tử tế",
            "synonyms": [
              "kindness",
              "friendliness"
            ],
            "collocation": "goodwill towards neighbours"
          }
        ],
        "altDirectionVi": "Có thể nói về một người hàng xóm cụ thể đã giúp bạn, hoặc nói rằng hàng xóm hơi kín đáo nhưng lịch sự."
      }
    ],
    "extraQuestions": [
      {
        "q": "What do you like most about the local food scene?",
        "hintVi": "Nêu một món đặc trưng và nơi bạn hay ăn, kèm lý do ngắn."
      },
      {
        "q": "Do you think it is important to know your neighbours?",
        "hintVi": "Trả lời có/không, nêu lợi ích hoặc rủi ro cụ thể."
      },
      {
        "q": "Would you prefer to live in the countryside or in a big city?",
        "hintVi": "Chọn một bên, so sánh hai ưu nhược điểm rồi kết luận."
      }
    ],
    "id": "p1-01"
  },
  {
    "no": 2,
    "topic": "Work / Study",
    "topicVi": "Công việc / Học tập",
    "section": "compulsory",
    "ideasVi": [
      "Nói rõ nghề và việc hằng ngày trước, rồi mới nêu cảm nhận.",
      "Với câu hỏi về học, nêu môn học và lý do chọn, không chỉ nói 'OK'."
    ],
    "questions": [
      {
        "n": 1,
        "q": "What kind of work do you do?",
        "qVi": "Bạn làm nghề gì?",
        "paraphrase": "What line of work are you in at the moment?",
        "sampleAnswer": "I work in education, mostly as an English teacher at a language centre. My day is a mix of teaching, giving feedback on students' written work and planning lessons. It's demanding, but I genuinely enjoy it.",
        "vocab": [
          {
            "word": "demanding",
            "meaningVi": "đòi hỏi nhiều công sức",
            "synonyms": [
              "challenging",
              "taxing"
            ],
            "collocation": "a demanding job"
          },
          {
            "word": "feedback",
            "meaningVi": "nhận xét, phản hồi",
            "synonyms": [
              "critique",
              "input"
            ],
            "collocation": "constructive feedback"
          }
        ],
        "altDirectionVi": "Nếu làm ngành khác (kỹ thuật, y tế), chỉ cần nêu nhiệm vụ chính và tính chất công việc."
      },
      {
        "n": 2,
        "q": "What do you find most interesting about your work?",
        "qVi": "Bạn thấy điều gì thú vị nhất trong công việc?",
        "paraphrase": "What aspect of your job gives you the greatest sense of satisfaction?",
        "sampleAnswer": "The variety, honestly. No two lessons are alike, because every student brings something different. I also enjoy the problem-solving side: figuring out why a learner is stuck and finding the right approach. When something finally clicks for them, it's incredibly rewarding.",
        "vocab": [
          {
            "word": "click",
            "meaningVi": "bỗng hiểu ra, thông suốt",
            "synonyms": [
              "fall into place",
              "sink in"
            ],
            "collocation": "it finally clicks"
          },
          {
            "word": "rewarding",
            "meaningVi": "đáng công, mang lại niềm vui",
            "synonyms": [
              "fulfilling",
              "satisfying"
            ],
            "collocation": "a rewarding experience"
          }
        ],
        "altDirectionVi": "Nếu không dạy học, có thể nói về đồng nghiệp hoặc việc học hỏi liên tục."
      },
      {
        "n": 3,
        "q": "Which is more important: the people you work with or the work you do?",
        "qVi": "Điều nào quan trọng hơn: người bạn làm việc cùng hay công việc bạn làm?",
        "paraphrase": "Do you value your colleagues more than the actual tasks you perform?",
        "sampleAnswer": "That's a tough one, but if I had to choose, I'd say the people. You can find meaning in almost any task when you're surrounded by a good team. Even exciting work can feel draining when colleagues are negative, so for me a supportive team makes all the difference.",
        "vocab": [
          {
            "word": "draining",
            "meaningVi": "làm kiệt sức",
            "synonyms": [
              "exhausting",
              "tiring"
            ],
            "collocation": "emotionally draining"
          },
          {
            "word": "make all the difference",
            "meaningVi": "tạo ra khác biệt lớn",
            "synonyms": [
              "change everything",
              "make a huge impact"
            ],
            "collocation": "a supportive team makes all the difference"
          }
        ],
        "altDirectionVi": "Chọn 'công việc' và giải thích rằng việc có ý nghĩa mới giữ bạn gắn bó với nghề."
      },
      {
        "n": 4,
        "q": "Do you work best in the morning or the afternoon?",
        "qVi": "Bạn làm việc hiệu quả hơn vào buổi sáng hay buổi chiều?",
        "paraphrase": "At what time of day are you most productive?",
        "sampleAnswer": "I'm definitely a morning person. My mind is at its sharpest before lunch, so I tackle the most demanding tasks first. By the afternoon my energy dips a bit, so I switch to lighter jobs like replying to emails.",
        "vocab": [
          {
            "word": "sharpest",
            "meaningVi": "minh mẫn, tỉnh táo nhất",
            "synonyms": [
              "most alert",
              "clearest"
            ],
            "collocation": "mind is at its sharpest"
          },
          {
            "word": "tackle",
            "meaningVi": "giải quyết, xử lý",
            "synonyms": [
              "deal with",
              "take on"
            ],
            "collocation": "tackle a task"
          }
        ],
        "altDirectionVi": "Nếu làm tốt hơn buổi chiều, nêu lý do như làm việc muộn hoặc nghe nhạc để tập trung."
      },
      {
        "n": 5,
        "q": "What do you study?",
        "qVi": "Bạn đang học ngành gì?",
        "paraphrase": "Which subject are you pursuing in your current studies?",
        "sampleAnswer": "I'm studying for a master's degree in applied linguistics. The programme combines theory with practical research, which I find really useful, especially since I'm already working in the field. I'm particularly interested in how learners acquire vocabulary.",
        "vocab": [
          {
            "word": "combine",
            "meaningVi": "kết hợp",
            "synonyms": [
              "blend",
              "merge"
            ],
            "collocation": "combine theory with practice"
          },
          {
            "word": "acquire",
            "meaningVi": "tiếp thu, đạt được",
            "synonyms": [
              "pick up",
              "gain"
            ],
            "collocation": "acquire a skill"
          }
        ],
        "altDirectionVi": "Nếu không đi học, có thể nói về khoá học ngắn hạn hoặc việc tự học một kỹ năng mới."
      },
      {
        "n": 6,
        "q": "What do you find most interesting about your studies?",
        "qVi": "Bạn thấy điều gì thú vị nhất khi học?",
        "paraphrase": "What part of your course excites you the most?",
        "sampleAnswer": "I love the research side of things. Instead of just memorising theories, we get to design small experiments and analyse real data. That hands-on approach makes the subject feel relevant rather than abstract.",
        "vocab": [
          {
            "word": "hands-on",
            "meaningVi": "thực hành trực tiếp",
            "synonyms": [
              "practical",
              "interactive"
            ],
            "collocation": "a hands-on approach"
          },
          {
            "word": "abstract",
            "meaningVi": "trừu tượng, xa rời thực tế",
            "synonyms": [
              "theoretical",
              "conceptual"
            ],
            "collocation": "remain abstract"
          }
        ],
        "altDirectionVi": "Có thể chọn phần thảo luận nhóm hoặc các buổi thực hành ngoài lớp."
      },
      {
        "n": 7,
        "q": "How much time do you spend studying every week?",
        "qVi": "Mỗi tuần bạn dành bao nhiêu thời gian để học?",
        "paraphrase": "How many hours a week do you typically devote to your studies?",
        "sampleAnswer": "It varies, but I'd say around ten to twelve hours. I spread it across the week rather than cramming, because short, regular sessions are far more effective for me. Weekends are often when I catch up on readings.",
        "vocab": [
          {
            "word": "cram",
            "meaningVi": "nhồi nhét, học dồn",
            "synonyms": [
              "swot",
              "last-minute revision"
            ],
            "collocation": "cram for an exam"
          },
          {
            "word": "catch up on",
            "meaningVi": "bù lại, theo kịp",
            "synonyms": [
              "make up for",
              "get through"
            ],
            "collocation": "catch up on reading"
          }
        ],
        "altDirectionVi": "Nếu học ít, nêu rõ lý do (bận việc) và kế hoạch để cải thiện."
      },
      {
        "n": 8,
        "q": "Have you always wanted to study this subject?",
        "qVi": "Bạn có luôn muốn học ngành này không?",
        "paraphrase": "Was this subject your first choice from the start?",
        "sampleAnswer": "Not really. I actually drifted into it. I started out considering something completely different, but after a few seminars on language, I realised it was exactly what I'd been looking for. Looking back, it was a lucky turn.",
        "vocab": [
          {
            "word": "drift into",
            "meaningVi": "vô tình bước vào",
            "synonyms": [
              "end up in",
              "stumble into"
            ],
            "collocation": "drift into a career"
          },
          {
            "word": "a lucky turn",
            "meaningVi": "một bước ngoặt may mắn",
            "synonyms": [
              "a fortunate change",
              "a happy accident"
            ],
            "collocation": "take a lucky turn"
          }
        ],
        "altDirectionVi": "Nói rằng bạn thích môn này từ nhỏ và kể một kỷ niệm cụ thể."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think it is better to work for a big company or a small one?",
        "hintVi": "Nêu một ưu điểm và một nhược điểm của mỗi loại, rồi chọn."
      },
      {
        "q": "Is it easy to balance work and free time?",
        "hintVi": "Trả lời có/không và kể một cách bạn cân bằng."
      },
      {
        "q": "Which skills do you think are most useful in your job?",
        "hintVi": "Nêu 2 kỹ năng và ví dụ thực tế đang dùng."
      }
    ],
    "id": "p1-02"
  },
  {
    "no": 3,
    "topic": "Food",
    "topicVi": "Món ăn",
    "section": "specific",
    "ideasVi": [
      "Kể một món gắn với ký ức (bà, mẹ, ngày Tết).",
      "Nói về thay đổi khẩu vị theo tuổi và theo mùa."
    ],
    "questions": [
      {
        "n": 1,
        "q": "What was your favourite food when you were a child?",
        "qVi": "Món ăn bạn thích nhất khi còn nhỏ là gì?",
        "paraphrase": "Which dish did you love eating most during your childhood?",
        "sampleAnswer": "When I was little, I was absolutely crazy about my grandmother's chicken soup. She'd simmer it for hours, and the whole house would smell amazing. Even now, whenever I'm feeling under the weather, that soup is what I crave.",
        "vocab": [
          {
            "word": "simmer",
            "meaningVi": "ninh liu riu",
            "synonyms": [
              "stew",
              "bubble gently"
            ],
            "collocation": "simmer for hours"
          },
          {
            "word": "under the weather",
            "meaningVi": "không khoẻ, hơi ốm",
            "synonyms": [
              "unwell",
              "off colour"
            ],
            "collocation": "feel under the weather"
          }
        ],
        "altDirectionVi": "Chọn một món ăn vặt hoặc bánh ngày Tết và kể về không khí gia đình."
      },
      {
        "n": 2,
        "q": "Has the kind of food you like changed as you've got older?",
        "qVi": "Khẩu vị của bạn có thay đổi khi lớn lên không?",
        "paraphrase": "How have your food preferences evolved since you were a child?",
        "sampleAnswer": "Definitely. As a kid I loved anything sweet and fried, but now I'm much more into fresh, lighter dishes. My tastes have matured, I suppose. I also appreciate spicy food far more than I did back then.",
        "vocab": [
          {
            "word": "matured",
            "meaningVi": "trưởng thành, chín chắn hơn",
            "synonyms": [
              "developed",
              "evolved"
            ],
            "collocation": "tastes have matured"
          },
          {
            "word": "into",
            "meaningVi": "thích, quan tâm đến",
            "synonyms": [
              "keen on",
              "drawn to"
            ],
            "collocation": "be into something"
          }
        ],
        "altDirectionVi": "Nói rằng vẫn thích món cũ nhưng ăn ít hơn để giữ sức khoẻ."
      },
      {
        "n": 3,
        "q": "Do you eat different food at different times of the year?",
        "qVi": "Bạn có ăn những món khác nhau vào các thời điểm khác nhau trong năm không?",
        "paraphrase": "Does the time of year influence what you choose to eat?",
        "sampleAnswer": "Yes, quite a lot, actually. In winter I gravitate towards warm, hearty soups and stews, while in summer I prefer cold noodles and fresh fruit. Seasonal produce also plays a big role, because it simply tastes better when it's in season.",
        "vocab": [
          {
            "word": "gravitate towards",
            "meaningVi": "bị thu hút bởi, hướng về",
            "synonyms": [
              "be drawn to",
              "lean towards"
            ],
            "collocation": "gravitate towards warm food"
          },
          {
            "word": "in season",
            "meaningVi": "đúng mùa, đang vào vụ",
            "synonyms": [
              "at its peak",
              "ripe"
            ],
            "collocation": "fruit in season"
          }
        ],
        "altDirectionVi": "Có thể nói về món ăn ngày Tết hoặc các món theo mùa ở quê."
      },
      {
        "n": 4,
        "q": "Do you like to eat with others?",
        "qVi": "Bạn có thích ăn cùng người khác không?",
        "paraphrase": "Do you enjoy sharing meals with other people more than eating alone?",
        "sampleAnswer": "I do, very much. Food is almost always better when it's shared. A long dinner with friends or family gives you a chance to catch up and talk, and I think the conversation matters as much as the meal itself.",
        "vocab": [
          {
            "word": "catch up",
            "meaningVi": "trò chuyện, cập nhật tin tức",
            "synonyms": [
              "reconnect",
              "touch base"
            ],
            "collocation": "catch up with friends"
          },
          {
            "word": "as much as",
            "meaningVi": "không kém, ngang bằng",
            "synonyms": [
              "just as important as",
              "equally"
            ],
            "collocation": "matters as much as the meal"
          }
        ],
        "altDirectionVi": "Nếu thích ăn một mình, nêu lý do như yên tĩnh hoặc tự do chọn món."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think people eat healthier food now than in the past?",
        "hintVi": "So sánh hiện tại và quá khứ, nêu một ví dụ."
      },
      {
        "q": "Is it common for families to cook together in your country?",
        "hintVi": "Nói về bữa cơm gia đình và dịp cùng nấu."
      },
      {
        "q": "What is a traditional dish from your country?",
        "hintVi": "Nêu tên món, nguyên liệu chính và dịp thường ăn."
      }
    ],
    "id": "p1-03"
  },
  {
    "no": 4,
    "topic": "Pets and Animals",
    "topicVi": "Thú cưng và động vật",
    "section": "specific",
    "ideasVi": [
      "Kể một mong ước thời thơ ấu, hoặc lý do chưa nuôi được.",
      "Nói về động vật quanh nhà và thói quen đi thăm vườn thú."
    ],
    "questions": [
      {
        "n": 1,
        "q": "Did you want to have a pet when you were a child?",
        "qVi": "Khi còn nhỏ bạn có muốn nuôi thú cưng không?",
        "paraphrase": "As a kid, were you keen on owning an animal?",
        "sampleAnswer": "Oh, absolutely. I begged my parents for a puppy for years. They were worried about the responsibility and the cost, so it never happened. Looking back, I understand why, but at the time I was heartbroken.",
        "vocab": [
          {
            "word": "beg",
            "meaningVi": "nài nỉ, van xin",
            "synonyms": [
              "plead",
              "implore"
            ],
            "collocation": "beg someone for something"
          },
          {
            "word": "heartbroken",
            "meaningVi": "đau lòng, tan nát",
            "synonyms": [
              "devastated",
              "crushed"
            ],
            "collocation": "be heartbroken about"
          }
        ],
        "altDirectionVi": "Kể rằng bạn từng muốn nuôi cá hoặc chim, và vì sao chưa thành."
      },
      {
        "n": 2,
        "q": "Would you like to have pets in the future?",
        "qVi": "Trong tương lai bạn có muốn nuôi thú cưng không?",
        "paraphrase": "Are you planning to adopt an animal at some point down the line?",
        "sampleAnswer": "Yes, I'd like to, once I have a more settled lifestyle. A dog would be ideal, because I'd enjoy taking it out for long walks. I'd need to make sure I have enough time, though, since pets are a real commitment.",
        "vocab": [
          {
            "word": "settled",
            "meaningVi": "ổn định",
            "synonyms": [
              "stable",
              "established"
            ],
            "collocation": "a more settled lifestyle"
          },
          {
            "word": "commitment",
            "meaningVi": "trách nhiệm, cam kết lâu dài",
            "synonyms": [
              "responsibility",
              "obligation"
            ],
            "collocation": "a long-term commitment"
          }
        ],
        "altDirectionVi": "Trả lời 'No' và nêu lý do: thời gian, không gian sống hoặc ưu tiên khác."
      },
      {
        "n": 3,
        "q": "Do you see many birds and animals where you live?",
        "qVi": "Nơi bạn sống có nhiều chim và động vật không?",
        "paraphrase": "What kinds of animals can you commonly come across in your area?",
        "sampleAnswer": "Not as many as I'd like. In the city you mostly see pigeons, stray cats and the occasional dog. Every now and then you'll spot sparrows in the trees, which always brightens my day.",
        "vocab": [
          {
            "word": "stray",
            "meaningVi": "đi lang thang, vô chủ",
            "synonyms": [
              "wandering",
              "homeless"
            ],
            "collocation": "stray cats"
          },
          {
            "word": "spot",
            "meaningVi": "nhìn thấy, phát hiện",
            "synonyms": [
              "notice",
              "catch sight of"
            ],
            "collocation": "spot wildlife"
          }
        ],
        "altDirectionVi": "Nếu sống ở quê, mô tả đàn gà, trâu bò, chim đồng và so sánh với thành phố."
      },
      {
        "n": 4,
        "q": "Have you ever been to a zoo?",
        "qVi": "Bạn đã bao giờ đến vườn thú chưa?",
        "paraphrase": "Have you visited a zoo before, and what was your experience like?",
        "sampleAnswer": "Yes, I went a few times as a child, and I loved it. Watching the big cats up close was a real thrill. These days I have mixed feelings about zoos, though, and I think sanctuaries are a better option for animals.",
        "vocab": [
          {
            "word": "thrill",
            "meaningVi": "cảm giác phấn khích",
            "synonyms": [
              "excitement",
              "buzz"
            ],
            "collocation": "a real thrill"
          },
          {
            "word": "mixed feelings",
            "meaningVi": "cảm xúc lẫn lộn",
            "synonyms": [
              "ambivalent",
              "conflicted"
            ],
            "collocation": "have mixed feelings about"
          }
        ],
        "altDirectionVi": "Nói rằng bạn chưa đi lần nào và giải thích lý do một cách lịch sự."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think it is cruel to keep animals in cages?",
        "hintVi": "Trả lời rõ quan điểm và nêu một lý do."
      },
      {
        "q": "Which wild animal would you most like to see?",
        "hintVi": "Chọn một loài, nêu lý do và nơi bạn muốn thấy."
      },
      {
        "q": "Are people in your country becoming more interested in pets?",
        "hintVi": "Nêu xu hướng và một dấu hiệu cụ thể như pet café."
      }
    ],
    "id": "p1-04"
  },
  {
    "no": 5,
    "topic": "Typing",
    "topicVi": "Gõ phím",
    "section": "specific",
    "ideasVi": [
      "Nêu tần suất gõ phím hằng ngày (công việc, học tập, nhắn tin).",
      "So sánh gõ và viết tay về tốc độ, độ rõ ràng và khả năng ghi nhớ."
    ],
    "questions": [
      {
        "n": 1,
        "q": "How often do you type on a keyboard?",
        "qVi": "Bạn gõ bàn phím thường xuyên đến mức nào?",
        "paraphrase": "What is your daily frequency of using a keyboard?",
        "sampleAnswer": "Almost every day, to be honest. Between emails, reports and messaging, I'd say I'm typing for several hours. It has become second nature, so I barely think about it anymore.",
        "vocab": [
          {
            "word": "second nature",
            "meaningVi": "trở thành thói quen tự nhiên",
            "synonyms": [
              "instinctive",
              "automatic"
            ],
            "collocation": "become second nature"
          },
          {
            "word": "barely",
            "meaningVi": "hầu như không",
            "synonyms": [
              "hardly",
              "scarcely"
            ],
            "collocation": "barely think about"
          }
        ],
        "altDirectionVi": "Nếu gõ ít, nói rằng bạn chủ yếu dùng điện thoại và cảm nhận về điều đó."
      },
      {
        "n": 2,
        "q": "Which do you find easier: typing on a keyboard or writing by hand?",
        "qVi": "Bạn thấy gõ bàn phím hay viết tay dễ hơn?",
        "paraphrase": "Which method feels more comfortable to you, keyboard input or handwriting?",
        "sampleAnswer": "Typing, without question. It's faster, and I can edit easily without crossing things out. Writing by hand has a certain charm, though, and I think I remember things better when I write them down.",
        "vocab": [
          {
            "word": "cross out",
            "meaningVi": "gạch bỏ",
            "synonyms": [
              "strike out",
              "delete"
            ],
            "collocation": "cross out a mistake"
          },
          {
            "word": "charm",
            "meaningVi": "sự duyên dáng, quyến rũ",
            "synonyms": [
              "appeal",
              "attraction"
            ],
            "collocation": "have a certain charm"
          }
        ],
        "altDirectionVi": "Chọn viết tay và nói về lợi ích ghi nhớ hoặc cảm giác thư giãn."
      },
      {
        "n": 3,
        "q": "Do you like to improve your typing skills?",
        "qVi": "Bạn có muốn cải thiện kỹ năng gõ phím không?",
        "paraphrase": "Are you interested in becoming a faster and more accurate typist?",
        "sampleAnswer": "Yes, I'd like to. I still hunt and peck on some keys, which slows me down. I've been practising with typing games, and I can already feel the improvement, although I've still got a long way to go.",
        "vocab": [
          {
            "word": "hunt and peck",
            "meaningVi": "gõ chậm bằng ngón tay trỏ",
            "synonyms": [
              "type slowly",
              "peck at keys"
            ],
            "collocation": "still hunt and peck"
          },
          {
            "word": "a long way to go",
            "meaningVi": "còn nhiều việc phải làm",
            "synonyms": [
              "still have a lot of progress to make"
            ],
            "collocation": "still have a long way to go"
          }
        ],
        "altDirectionVi": "Nói rằng bạn không cần thiết vì đã đủ dùng, nhưng vẫn muốn học thêm để tiết kiệm thời gian."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do children in your country learn to type at school?",
        "hintVi": "Trả lời có/không, nêu lớp học hoặc trải nghiệm của bạn."
      },
      {
        "q": "Do you think handwriting will disappear in the future?",
        "hintVi": "Nêu ý kiến và một lý do, có thể nhắc đến chữ ký điện tử."
      },
      {
        "q": "Do you use voice typing sometimes?",
        "hintVi": "Trả lời và nêu một tình huống dùng giọng nói."
      }
    ],
    "id": "p1-05"
  },
  {
    "no": 6,
    "topic": "Stage of Life",
    "topicVi": "Các giai đoạn của cuộc đời",
    "section": "specific",
    "ideasVi": [
      "Nói về hiện tại: hài lòng điều gì và muốn thay đổi điều gì.",
      "Kể kỷ niệm tuổi thơ cụ thể, rồi nói về tương lai."
    ],
    "questions": [
      {
        "n": 1,
        "q": "Are you satisfied with your age now?",
        "qVi": "Bạn có hài lòng với tuổi hiện tại của mình không?",
        "paraphrase": "Do you feel content with the stage of life you have reached?",
        "sampleAnswer": "Mostly, yes. I feel more confident and clear about what I want than I did as a teenager. Of course, there are days I wish I had more energy, but on balance I'm happy with where I am in life.",
        "vocab": [
          {
            "word": "on balance",
            "meaningVi": "nhìn chung, xét toàn diện",
            "synonyms": [
              "overall",
              "all things considered"
            ],
            "collocation": "on balance, I'm happy"
          },
          {
            "word": "clear about",
            "meaningVi": "rõ ràng về",
            "synonyms": [
              "certain",
              "decisive"
            ],
            "collocation": "be clear about one's goals"
          }
        ],
        "altDirectionVi": "Nói rằng bạn hài lòng nhưng mong có thêm sức khoẻ."
      },
      {
        "n": 2,
        "q": "What did you enjoy most about your childhood?",
        "qVi": "Điều bạn thích nhất khi còn nhỏ là gì?",
        "paraphrase": "What was the best part of growing up as a child?",
        "sampleAnswer": "The freedom, I think. We'd spend hours outside after school, playing games with kids from the neighbourhood, with hardly any responsibilities. Nobody worried about bills or deadlines, and I miss that carefree feeling.",
        "vocab": [
          {
            "word": "carefree",
            "meaningVi": "vô tư, không lo nghĩ",
            "synonyms": [
              "untroubled",
              "relaxed"
            ],
            "collocation": "a carefree childhood"
          },
          {
            "word": "hardly any",
            "meaningVi": "hầu như không có",
            "synonyms": [
              "very few",
              "barely any"
            ],
            "collocation": "with hardly any responsibilities"
          }
        ],
        "altDirectionVi": "Nói về bạn bè hoặc gia đình, ví dụ những bữa cơm tối đông đủ."
      },
      {
        "n": 3,
        "q": "At what age do you think people enjoy their lives most?",
        "qVi": "Theo bạn, người ta tận hưởng cuộc sống nhiều nhất ở độ tuổi nào?",
        "paraphrase": "Which period of a person's life do you think is the happiest?",
        "sampleAnswer": "I'd say somewhere in the thirties and forties. By then most people have a clearer sense of who they are, they're financially more stable, and they've learned not to sweat the small stuff.",
        "vocab": [
          {
            "word": "sweat the small stuff",
            "meaningVi": "bận tâm chuyện nhỏ nhặt",
            "synonyms": [
              "fuss over details",
              "stress over trivia"
            ],
            "collocation": "learn not to sweat the small stuff"
          },
          {
            "word": "financially stable",
            "meaningVi": "ổn định về tài chính",
            "synonyms": [
              "well off",
              "secure"
            ],
            "collocation": "become financially stable"
          }
        ],
        "altDirectionVi": "Chọn tuổi 20 và nói về năng lượng và cơ hội."
      },
      {
        "n": 4,
        "q": "What do you want to do five years later?",
        "qVi": "Bạn muốn làm gì sau năm năm nữa?",
        "paraphrase": "What are your plans for the next five years?",
        "sampleAnswer": "In five years I'd like to be running my own small business, ideally in education. I'm also hoping to travel more and pick up a new language, because that's something I've always put off.",
        "vocab": [
          {
            "word": "put off",
            "meaningVi": "trì hoãn",
            "synonyms": [
              "postpone",
              "delay"
            ],
            "collocation": "put off doing something"
          },
          {
            "word": "pick up",
            "meaningVi": "học được, tiếp thu",
            "synonyms": [
              "learn",
              "acquire"
            ],
            "collocation": "pick up a skill"
          }
        ],
        "altDirectionVi": "Nói về mục tiêu gia đình hoặc sức khoẻ thay vì sự nghiệp."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think older people are wiser than young people?",
        "hintVi": "Đồng ý hoặc không, nêu một ví dụ về sự khôn ngoan."
      },
      {
        "q": "What kinds of things make people feel young?",
        "hintVi": "Nêu 2 việc như thể thao hoặc bạn trẻ."
      },
      {
        "q": "How has your attitude to life changed over the years?",
        "hintVi": "So sánh quá khứ và hiện tại, nêu một thay đổi cụ thể."
      }
    ],
    "id": "p1-06"
  },
  {
    "no": 7,
    "topic": "Long Walk",
    "topicVi": "Đi bộ đường dài",
    "section": "specific",
    "ideasVi": [
      "Kể thói quen đi bộ khi còn nhỏ, dù ít hay nhiều.",
      "Nói về công viên gần nhà và cách người dân đi bộ."
    ],
    "questions": [
      {
        "n": 1,
        "q": "Did you go for long walks when you were a child?",
        "qVi": "Khi còn nhỏ bạn có hay đi bộ đường dài không?",
        "paraphrase": "Did you enjoy walking for a long time when you were growing up?",
        "sampleAnswer": "Not really, to be honest. We usually went everywhere by bicycle or on foot to school, which I suppose counts. Long walks for their own sake were more of an adult thing for me, something I came to enjoy later on.",
        "vocab": [
          {
            "word": "for their own sake",
            "meaningVi": "chỉ vì bản thân việc đó",
            "synonyms": [
              "purely for pleasure"
            ],
            "collocation": "do something for its own sake"
          },
          {
            "word": "come to enjoy",
            "meaningVi": "dần dần thích",
            "synonyms": [
              "grow to appreciate",
              "warm to"
            ],
            "collocation": "come to enjoy something"
          }
        ],
        "altDirectionVi": "Nói rằng bạn thường đi bộ dài cùng ông bà ở quê."
      },
      {
        "n": 2,
        "q": "Are there many parks near where you live?",
        "qVi": "Gần nhà bạn có nhiều công viên không?",
        "paraphrase": "Is there a green space within walking distance of your home?",
        "sampleAnswer": "There are a few, though not as many as I'd like. The nearest one is about ten minutes away, and it's usually busy in the early morning with people jogging or doing tai chi. It's a lovely spot to start the day.",
        "vocab": [
          {
            "word": "spot",
            "meaningVi": "địa điểm, chỗ",
            "synonyms": [
              "location",
              "place"
            ],
            "collocation": "a lovely spot to start the day"
          },
          {
            "word": "within walking distance",
            "meaningVi": "đi bộ được tới",
            "synonyms": [
              "nearby",
              "a short stroll away"
            ],
            "collocation": "within walking distance of home"
          }
        ],
        "altDirectionVi": "Nếu gần hồ hoặc con đường đi bộ lớn, nói về cảm giác khi đi dạo."
      },
      {
        "n": 3,
        "q": "Do people enjoy walking in parks in your country?",
        "qVi": "Người dân ở đất nước bạn có thích đi bộ trong công viên không?",
        "paraphrase": "Do locals in your country like to take walks in parks?",
        "sampleAnswer": "Yes, very much. Especially in the cooler months, you'll see families, couples and retirees out and about. It has become a popular way to unwind, and more people are realising how good it is for both mental and physical health.",
        "vocab": [
          {
            "word": "out and about",
            "meaningVi": "đi lại, hoạt động ngoài trời",
            "synonyms": [
              "on the move",
              "active"
            ],
            "collocation": "be out and about"
          },
          {
            "word": "unwind",
            "meaningVi": "thư giãn",
            "synonyms": [
              "relax",
              "decompress"
            ],
            "collocation": "a popular way to unwind"
          }
        ],
        "altDirectionVi": "Nói rằng ít người đi bộ vì nắng nóng và giải thích."
      },
      {
        "n": 4,
        "q": "Where would you want to go for a long walk if you have a chance?",
        "qVi": "Nếu có cơ hội, bạn muốn đi bộ đường dài ở đâu?",
        "paraphrase": "Which destination would you choose for a long hike or stroll?",
        "sampleAnswer": "I'd love to walk a coastal path somewhere along the central coast, where the sea breeze and the views would make the whole walk feel effortless. It would be a great way to clear my head.",
        "vocab": [
          {
            "word": "effortless",
            "meaningVi": "nhẹ nhàng, không tốn sức",
            "synonyms": [
              "easy",
              "smooth"
            ],
            "collocation": "feel effortless"
          },
          {
            "word": "clear one's head",
            "meaningVi": "làm đầu óc thoải mái",
            "synonyms": [
              "refresh",
              "recharge"
            ],
            "collocation": "clear my head"
          }
        ],
        "altDirectionVi": "Chọn đường mòn trên núi để nói về không khí trong lành."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think walking is a good form of exercise?",
        "hintVi": "Nêu một lợi ích thể chất và một lợi ích tinh thần."
      },
      {
        "q": "What do you usually think about while walking?",
        "hintVi": "Nêu 1-2 chủ đề và lý do chúng hiện lên."
      },
      {
        "q": "Is it safe to walk alone in your area at night?",
        "hintVi": "Trả lời rõ, nêu một lý do an toàn hoặc không an toàn."
      }
    ],
    "id": "p1-07"
  },
  {
    "no": 8,
    "topic": "Reading Carefully",
    "topicVi": "Đọc kỹ",
    "section": "specific",
    "ideasVi": [
      "Liệt kê vài loại văn bản cần đọc kỹ: hợp đồng, hướng dẫn thuốc, email công việc.",
      "So sánh đọc nhanh và đọc kỹ, rồi nói khi nào dùng cách nào."
    ],
    "questions": [
      {
        "n": 1,
        "q": "What kinds of things do you have to read carefully?",
        "qVi": "Bạn cần đọc kỹ những loại tài liệu nào?",
        "paraphrase": "Which types of documents require your full attention when you read them?",
        "sampleAnswer": "Mostly contracts, medical instructions and work emails with deadlines in them. A small mistake in any of those can cost you money or cause real problems, so I slow down and read every line.",
        "vocab": [
          {
            "word": "contract",
            "meaningVi": "hợp đồng",
            "synonyms": [
              "agreement",
              "legal document"
            ],
            "collocation": "sign a contract"
          },
          {
            "word": "cost someone",
            "meaningVi": "khiến ai đó mất (tiền, thời gian)",
            "synonyms": [
              "set someone back",
              "cause someone to lose"
            ],
            "collocation": "cost someone money"
          }
        ],
        "altDirectionVi": "Nêu tài liệu học thuật hoặc sách giáo khoa cần đọc kỹ."
      },
      {
        "n": 2,
        "q": "Do you like to read things carefully or quickly in daily life?",
        "qVi": "Trong cuộc sống hằng ngày bạn đọc kỹ hay đọc nhanh?",
        "paraphrase": "Do you tend to scan or study text thoroughly in your everyday life?",
        "sampleAnswer": "It really depends. For news headlines or social media posts, I skim, because I just want the gist. But for anything important, I read carefully, since skimming can lead to misunderstandings.",
        "vocab": [
          {
            "word": "skim",
            "meaningVi": "đọc lướt",
            "synonyms": [
              "scan",
              "glance through"
            ],
            "collocation": "skim the headlines"
          },
          {
            "word": "the gist",
            "meaningVi": "ý chính",
            "synonyms": [
              "the main point",
              "the essence"
            ],
            "collocation": "get the gist"
          }
        ],
        "altDirectionVi": "Có thể nói bạn đọc nhanh vì thói quen công việc, nhưng luôn đọc kỹ phần quan trọng."
      },
      {
        "n": 3,
        "q": "Do you read things more carefully on paper or on a screen?",
        "qVi": "Bạn đọc kỹ hơn trên giấy hay trên màn hình?",
        "paraphrase": "Is reading printed material more effective for you than reading digital text?",
        "sampleAnswer": "On paper, I'd say. I tend to focus better and retain more when I'm holding the page. On screens I'm more likely to get distracted by notifications and end up scrolling without really taking anything in.",
        "vocab": [
          {
            "word": "retain",
            "meaningVi": "ghi nhớ, giữ lại",
            "synonyms": [
              "remember",
              "keep"
            ],
            "collocation": "retain information"
          },
          {
            "word": "take in",
            "meaningVi": "tiếp thu, hấp thụ",
            "synonyms": [
              "absorb",
              "process"
            ],
            "collocation": "take something in"
          }
        ],
        "altDirectionVi": "Nói rằng bạn đọc trên màn hình vì tiện, nhưng luôn bật chế độ tập trung."
      },
      {
        "n": 4,
        "q": "Why do you think some people don't read messages very carefully?",
        "qVi": "Tại sao theo bạn một số người đọc tin nhắn không kỹ?",
        "paraphrase": "What are the reasons behind people's careless reading of text messages?",
        "sampleAnswer": "I think it's mostly because people are overloaded. We get so many messages every day that we start reading them on autopilot. Some people also assume they already know what the message says, which leads to careless mistakes.",
        "vocab": [
          {
            "word": "overloaded",
            "meaningVi": "quá tải",
            "synonyms": [
              "swamped",
              "overwhelmed"
            ],
            "collocation": "feel overloaded"
          },
          {
            "word": "on autopilot",
            "meaningVi": "làm theo thói quen, vô thức",
            "synonyms": [
              "mechanically",
              "without thinking"
            ],
            "collocation": "run on autopilot"
          }
        ],
        "altDirectionVi": "Nêu lý do về thói quen hoặc áp lực thời gian."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think schools teach students to read well?",
        "hintVi": "Trả lời có/không và nêu một điểm mạnh hoặc yếu."
      },
      {
        "q": "How do you feel when you have to read a long article?",
        "hintVi": "Nêu cảm xúc và một cách bạn làm cho dễ đọc hơn."
      },
      {
        "q": "Do you read the terms and conditions before accepting them?",
        "hintVi": "Trả lời thật và nêu lý do."
      }
    ],
    "id": "p1-08"
  },
  {
    "no": 9,
    "topic": "Morning Routine",
    "topicVi": "Buổi sáng",
    "section": "specific",
    "ideasVi": [
      "Trả lời trực tiếp (dậy sớm hay muộn), rồi nêu lý do.",
      "Kể một thói quen buổi sáng cụ thể và cảm nhận của bạn."
    ],
    "questions": [
      {
        "n": 1,
        "q": "Do you get up early in the morning?",
        "qVi": "Bạn có dậy sớm vào buổi sáng không?",
        "paraphrase": "Are you usually an early riser?",
        "sampleAnswer": "Yes, I usually do. My alarm goes off at about half past six, and I like having that quiet time before the day gets busy. It's the only part of the day when I can think clearly without interruptions.",
        "vocab": [
          {
            "word": "go off",
            "meaningVi": "reo (chuông báo thức)",
            "synonyms": [
              "ring",
              "sound"
            ],
            "collocation": "the alarm goes off"
          },
          {
            "word": "interruption",
            "meaningVi": "sự làm gián đoạn",
            "synonyms": [
              "distraction",
              "disruption"
            ],
            "collocation": "without interruptions"
          }
        ],
        "altDirectionVi": "Nếu dậy muộn, nêu lý do như làm việc đêm và cách bù lại."
      },
      {
        "n": 2,
        "q": "Did you get up early when you were younger?",
        "qVi": "Khi còn nhỏ bạn có dậy sớm không?",
        "paraphrase": "Were you a morning person when you were a teenager?",
        "sampleAnswer": "Not at all. As a teenager I was a real night owl, and my parents had to drag me out of bed for school. I've become much more of a morning person over the years, mostly because I'm more disciplined now.",
        "vocab": [
          {
            "word": "night owl",
            "meaningVi": "người thức khuya",
            "synonyms": [
              "late-night person"
            ],
            "collocation": "be a night owl"
          },
          {
            "word": "drag someone out of bed",
            "meaningVi": "lôi ai đó dậy",
            "synonyms": [
              "haul out of bed"
            ],
            "collocation": "had to drag me out of bed"
          }
        ],
        "altDirectionVi": "Nói rằng bạn đã dậy sớm từ nhỏ vì phải đi học."
      },
      {
        "n": 3,
        "q": "What do you do every morning?",
        "qVi": "Bạn làm gì mỗi buổi sáng?",
        "paraphrase": "Could you describe the activities you usually do at the start of your day?",
        "sampleAnswer": "I start with a glass of warm water and a few minutes of stretching. Then I make a simple breakfast and check my messages while I eat. It's a low-key routine, but it helps me feel ready for the day.",
        "vocab": [
          {
            "word": "low-key",
            "meaningVi": "giản dị, nhẹ nhàng",
            "synonyms": [
              "relaxed",
              "understated"
            ],
            "collocation": "a low-key routine"
          },
          {
            "word": "stretch",
            "meaningVi": "giãn cơ, vươn người",
            "synonyms": [
              "limber up",
              "warm up"
            ],
            "collocation": "a few minutes of stretching"
          }
        ],
        "altDirectionVi": "Nói về việc tập thể dục ngoài trời như chạy bộ hoặc đi bộ."
      },
      {
        "n": 4,
        "q": "What's your favourite morning of the week?",
        "qVi": "Buổi sáng nào trong tuần là bạn thích nhất?",
        "paraphrase": "Which day's morning do you enjoy most, and why?",
        "sampleAnswer": "Saturday, without a doubt. There's no alarm, so I can lie in for a bit, then make a leisurely brunch. It feels like the start of a proper weekend, and I can finally do the things I've been putting off.",
        "vocab": [
          {
            "word": "lie in",
            "meaningVi": "ngủ nướng",
            "synonyms": [
              "sleep in",
              "stay in bed"
            ],
            "collocation": "lie in on weekends"
          },
          {
            "word": "leisurely",
            "meaningVi": "thong thả, không vội",
            "synonyms": [
              "unhurried",
              "relaxed"
            ],
            "collocation": "a leisurely brunch"
          }
        ],
        "altDirectionVi": "Chọn sáng Chủ nhật và nói về bữa sáng cùng gia đình hoặc đi chợ."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think it is better to exercise in the morning or at night?",
        "hintVi": "Chọn một buổi, nêu một lợi ích và một nhược điểm."
      },
      {
        "q": "What would you change about your morning routine?",
        "hintVi": "Nêu một thay đổi cụ thể và lý do."
      },
      {
        "q": "Do people in your country usually have breakfast at home?",
        "hintVi": "Nêu thói quen phổ biến, ví dụ ăn phở hoặc bánh mì ngoài đường."
      }
    ],
    "id": "p1-09"
  },
  {
    "no": 10,
    "topic": "Gifts",
    "topicVi": "Quà tặng",
    "section": "specific",
    "ideasVi": [
      "Nói loại quà bạn thích, rồi so sánh với hồi nhỏ.",
      "Nêu quan điểm về mua quà online và lý do."
    ],
    "questions": [
      {
        "n": 1,
        "q": "What kinds of gifts do you like to receive?",
        "qVi": "Bạn thích nhận loại quà nào?",
        "paraphrase": "Which kinds of presents make you the happiest when you receive them?",
        "sampleAnswer": "I'm a sucker for thoughtful gifts, the kind that show someone has really paid attention to what I like. A handwritten card or a book I've been meaning to read means far more to me than something expensive.",
        "vocab": [
          {
            "word": "a sucker for",
            "meaningVi": "không cưỡng lại được",
            "synonyms": [
              "be fond of",
              "have a soft spot for"
            ],
            "collocation": "a sucker for thoughtful gifts"
          },
          {
            "word": "meaning to",
            "meaningVi": "định làm gì đó nhưng chưa làm",
            "synonyms": [
              "intend to",
              "plan to"
            ],
            "collocation": "a book I've been meaning to read"
          }
        ],
        "altDirectionVi": "Nói về món quà ăn được hoặc đồ handmade, kể một lần bất ngờ vui."
      },
      {
        "n": 2,
        "q": "What kinds of gifts did you like when you were younger?",
        "qVi": "Khi còn nhỏ bạn thích loại quà nào?",
        "paraphrase": "What sort of presents were you excited about as a child?",
        "sampleAnswer": "As a kid, I was obsessed with toys, especially anything that could be built or taken apart. Birthdays were the highlight, because I'd spend the whole afternoon playing with whatever I'd been given.",
        "vocab": [
          {
            "word": "obsessed with",
            "meaningVi": "say mê, bị ám ảnh bởi",
            "synonyms": [
              "crazy about",
              "fixated on"
            ],
            "collocation": "be obsessed with something"
          },
          {
            "word": "highlight",
            "meaningVi": "điểm nổi bật nhất",
            "synonyms": [
              "best part",
              "high point"
            ],
            "collocation": "the highlight of the year"
          }
        ],
        "altDirectionVi": "Kể về sách truyện hoặc đồ chơi sưu tầm thời thơ ấu."
      },
      {
        "n": 3,
        "q": "Do you enjoy giving people gifts?",
        "qVi": "Bạn có thích tặng quà cho người khác không?",
        "paraphrase": "Do you take pleasure in giving presents to people?",
        "sampleAnswer": "I really do. Seeing someone's face light up when they open a gift is a wonderful feeling. I also like making things myself, because it tells people I've put real time into thinking about them.",
        "vocab": [
          {
            "word": "light up",
            "meaningVi": "bừng sáng lên (vì vui)",
            "synonyms": [
              "brighten up",
              "beam"
            ],
            "collocation": "a face lights up"
          },
          {
            "word": "put time into",
            "meaningVi": "dành thời gian cho",
            "synonyms": [
              "invest time in",
              "spend effort on"
            ],
            "collocation": "put real time into something"
          }
        ],
        "altDirectionVi": "Nói rằng bạn thích tặng quà nhỏ hằng ngày hơn là dịp lớn."
      },
      {
        "n": 4,
        "q": "Do you think buying gifts online is a good idea?",
        "qVi": "Bạn nghĩ mua quà online có phải là ý hay không?",
        "paraphrase": "Is buying presents online a sensible option in your opinion?",
        "sampleAnswer": "I think it's a practical option, especially for people who live far away. You can compare prices and read reviews, which saves time. That said, I still prefer to choose something in person when I can, because you can really judge the quality.",
        "vocab": [
          {
            "word": "practical",
            "meaningVi": "thiết thực",
            "synonyms": [
              "convenient",
              "sensible"
            ],
            "collocation": "a practical option"
          },
          {
            "word": "judge the quality",
            "meaningVi": "đánh giá chất lượng",
            "synonyms": [
              "assess",
              "evaluate"
            ],
            "collocation": "you can really judge the quality"
          }
        ],
        "altDirectionVi": "Nói rằng bạn không thích mua online vì sợ hàng không đúng như hình."
      }
    ],
    "extraQuestions": [
      {
        "q": "Is it important to give a gift on special occasions?",
        "hintVi": "Nêu quan điểm và lý do ngắn gọn."
      },
      {
        "q": "What is the most unusual gift you have ever received?",
        "hintVi": "Kể món quà, người tặng và cảm xúc."
      },
      {
        "q": "Do you think people spend too much money on gifts?",
        "hintVi": "Trả lời có/không và nêu một ví dụ."
      }
    ],
    "id": "p1-10"
  },
  {
    "no": 11,
    "topic": "Team Sport",
    "topicVi": "Môn thể thao đồng đội",
    "section": "specific",
    "ideasVi": [
      "Kể bạn đã từng chơi đội nhóm chưa, và cảm giác ra sao.",
      "Nêu mức độ phổ biến của thể thao đồng đội ở nước bạn."
    ],
    "questions": [
      {
        "n": 1,
        "q": "Have you ever played a sport in a team?",
        "qVi": "Bạn đã bao giờ chơi một môn thể thao đồng đội chưa?",
        "paraphrase": "Have you ever been part of a sports team?",
        "sampleAnswer": "Yes, I played football in a local team when I was a teenager. We trained twice a week and played on weekends. It taught me a lot about communication, and I still keep in touch with a few of my old teammates.",
        "vocab": [
          {
            "word": "keep in touch",
            "meaningVi": "giữ liên lạc",
            "synonyms": [
              "stay in contact",
              "stay connected"
            ],
            "collocation": "keep in touch with old friends"
          },
          {
            "word": "teammate",
            "meaningVi": "đồng đội",
            "synonyms": [
              "squad member",
              "fellow player"
            ],
            "collocation": "a former teammate"
          }
        ],
        "altDirectionVi": "Nói rằng bạn chưa chơi chính thức nhưng từng đá bóng với bạn bè trong xóm."
      },
      {
        "n": 2,
        "q": "Are team sports popular in your country?",
        "qVi": "Môn thể thao đồng đội có phổ biến ở đất nước bạn không?",
        "paraphrase": "How popular are team sports where you come from?",
        "sampleAnswer": "They're very popular, especially football. On weekends, you'll see groups of friends playing on local pitches, and everyone seems to have an opinion about the national team. Volleyball and badminton are also common, though usually in a more casual form.",
        "vocab": [
          {
            "word": "pitch",
            "meaningVi": "sân thi đấu",
            "synonyms": [
              "field",
              "ground"
            ],
            "collocation": "a local pitch"
          },
          {
            "word": "casual",
            "meaningVi": "không chính thức, thoải mái",
            "synonyms": [
              "informal",
              "relaxed"
            ],
            "collocation": "a casual game"
          }
        ],
        "altDirectionVi": "Nói về bóng đá phong trào hoặc các giải bóng đá doanh nghiệp."
      },
      {
        "n": 3,
        "q": "Would you like to try a new team sport in the future?",
        "qVi": "Bạn có muốn thử một môn thể thao đồng đội mới trong tương lai không?",
        "paraphrase": "Would you be interested in joining a new team sport down the road?",
        "sampleAnswer": "I'd love to try basketball someday. It's fast-paced and requires a lot of coordination, which I think would be a good challenge. I'd also like the social side of it, meeting new people through the team.",
        "vocab": [
          {
            "word": "fast-paced",
            "meaningVi": "nhịp độ nhanh",
            "synonyms": [
              "high-energy",
              "dynamic"
            ],
            "collocation": "a fast-paced game"
          },
          {
            "word": "coordination",
            "meaningVi": "sự phối hợp",
            "synonyms": [
              "teamwork",
              "synchronisation"
            ],
            "collocation": "require coordination"
          }
        ],
        "altDirectionVi": "Nói về môn bơi lội hoặc bóng chuyền bãi biển."
      },
      {
        "n": 4,
        "q": "Do you enjoy watching team sports?",
        "qVi": "Bạn có thích xem các môn thể thao đồng đội không?",
        "paraphrase": "Do you get excited when you watch team sports?",
        "sampleAnswer": "Absolutely. There's nothing quite like watching a team come back from behind in the final minutes. I usually watch with friends, and the shared excitement makes it even more enjoyable.",
        "vocab": [
          {
            "word": "come back from behind",
            "meaningVi": "lội ngược dòng, gỡ bàn thua",
            "synonyms": [
              "stage a comeback",
              "turn it around"
            ],
            "collocation": "come back from behind to win"
          },
          {
            "word": "nothing quite like",
            "meaningVi": "không gì sánh bằng",
            "synonyms": [
              "nothing compares to",
              "there's nothing better than"
            ],
            "collocation": "nothing quite like watching a match live"
          }
        ],
        "altDirectionVi": "Nói rằng bạn thích xem qua truyền hình ở nhà hơn là đến sân vận động."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think team sports help children grow up?",
        "hintVi": "Nêu một kỹ năng sống mà trẻ học được."
      },
      {
        "q": "Why do you think some people prefer individual sports?",
        "hintVi": "Nêu 1-2 lý do như linh hoạt hoặc tự chủ."
      },
      {
        "q": "Do schools in your country encourage students to play team sports?",
        "hintVi": "Trả lời có/không và mô tả ngắn."
      }
    ],
    "id": "p1-11"
  },
  {
    "no": 12,
    "topic": "Building",
    "topicVi": "Toà nhà",
    "section": "specific",
    "ideasVi": [
      "Nêu tên toà nhà cao nhất, hoặc nói rằng bạn không biết chắc.",
      "Nói về loại nhà bạn muốn ở và lý do."
    ],
    "questions": [
      {
        "n": 1,
        "q": "What is the tallest building in your city?",
        "qVi": "Toà nhà cao nhất ở thành phố bạn là toà nào?",
        "paraphrase": "Which is the tallest building in your city, as far as you know?",
        "sampleAnswer": "Honestly, I'm not sure which one is officially the tallest, but the most eye-catching one is a skyscraper in the city centre. It's lit up at night, and you can see it from almost anywhere in the district.",
        "vocab": [
          {
            "word": "eye-catching",
            "meaningVi": "nổi bật, thu hút ánh nhìn",
            "synonyms": [
              "striking",
              "conspicuous"
            ],
            "collocation": "an eye-catching design"
          },
          {
            "word": "skyscraper",
            "meaningVi": "toà nhà chọc trời",
            "synonyms": [
              "high-rise",
              "tower block"
            ],
            "collocation": "a towering skyscraper"
          }
        ],
        "altDirectionVi": "Nếu không rõ tên, nói tên một toà nhà bạn quen và đặc điểm của nó."
      },
      {
        "n": 2,
        "q": "Are there many tall buildings where you live?",
        "qVi": "Nơi bạn sống có nhiều toà nhà cao không?",
        "paraphrase": "Is your area full of high-rise buildings?",
        "sampleAnswer": "Quite a few, yes. Over the last decade, new apartment blocks have been going up everywhere, and some of them are quite tall. It has changed the skyline quite dramatically.",
        "vocab": [
          {
            "word": "skyline",
            "meaningVi": "đường chân trời (của thành phố)",
            "synonyms": [
              "cityscape"
            ],
            "collocation": "change the skyline"
          },
          {
            "word": "go up",
            "meaningVi": "được xây lên",
            "synonyms": [
              "be built",
              "rise"
            ],
            "collocation": "buildings going up"
          }
        ],
        "altDirectionVi": "Nếu sống ở khu ít nhà cao, nói về nhà ống và cảm giác yên tĩnh."
      },
      {
        "n": 3,
        "q": "Have you ever taken a photo of a building?",
        "qVi": "Bạn đã bao giờ chụp ảnh một toà nhà chưa?",
        "paraphrase": "Have you ever snapped a picture of a building?",
        "sampleAnswer": "Yes, many times. I'm drawn to old colonial buildings with their tall windows and faded paint. I often take photos of them when I'm walking around, mostly for my own collection.",
        "vocab": [
          {
            "word": "be drawn to",
            "meaningVi": "bị thu hút bởi",
            "synonyms": [
              "be attracted to",
              "be fascinated by"
            ],
            "collocation": "be drawn to old architecture"
          },
          {
            "word": "faded",
            "meaningVi": "bạc màu, phai màu",
            "synonyms": [
              "worn",
              "weathered"
            ],
            "collocation": "faded paint"
          }
        ],
        "altDirectionVi": "Nói về việc chụp kiến trúc trong chuyến du lịch."
      },
      {
        "n": 4,
        "q": "What kind of building would you like to live in?",
        "qVi": "Bạn muốn sống trong loại toà nhà nào?",
        "paraphrase": "What type of building would you prefer to live in?",
        "sampleAnswer": "I'd like a low-rise house with a small garden, ideally somewhere a bit away from the busy centre. I think it would be calmer and healthier, and I'd love to grow a few plants in the yard.",
        "vocab": [
          {
            "word": "low-rise",
            "meaningVi": "thấp tầng",
            "synonyms": [
              "single-storey",
              "small-scale"
            ],
            "collocation": "a low-rise building"
          },
          {
            "word": "a bit away from",
            "meaningVi": "hơi xa khỏi",
            "synonyms": [
              "on the outskirts of",
              "removed from"
            ],
            "collocation": "a bit away from the busy centre"
          }
        ],
        "altDirectionVi": "Chọn căn hộ cao tầng để nói về tầm nhìn và tiện ích."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think it is good to build more tall buildings in cities?",
        "hintVi": "Nêu một lợi ích (tiết kiệm đất) và một bất lợi."
      },
      {
        "q": "What is the difference between old and new buildings in your city?",
        "hintVi": "So sánh vật liệu hoặc kiểu dáng."
      },
      {
        "q": "Do people in your country prefer living in houses or apartments?",
        "hintVi": "Nêu xu hướng chung và lý do."
      }
    ],
    "id": "p1-12"
  },
  {
    "no": 13,
    "topic": "Travelling",
    "topicVi": "Du lịch",
    "section": "specific",
    "ideasVi": [
      "Nói về cách bạn nhìn cảnh khi đi du lịch.",
      "Kể chuyến đi xa hồi nhỏ, hoặc sở thích về núi và biển."
    ],
    "questions": [
      {
        "n": 1,
        "q": "When you're travelling, do you usually look at the view?",
        "qVi": "Khi đi du lịch, bạn có thường ngắm cảnh không?",
        "paraphrase": "When you travel, do you pay much attention to the scenery?",
        "sampleAnswer": "Yes, I'm always looking out of the window, especially on long journeys. I think the landscape tells you a lot about a place, from the rice fields to the hills. Sometimes I'd rather watch the scenery than scroll through my phone.",
        "vocab": [
          {
            "word": "look out of",
            "meaningVi": "nhìn ra ngoài qua",
            "synonyms": [
              "gaze out of",
              "peer out of"
            ],
            "collocation": "look out of the window"
          },
          {
            "word": "landscape",
            "meaningVi": "phong cảnh",
            "synonyms": [
              "scenery",
              "terrain"
            ],
            "collocation": "a stunning landscape"
          }
        ],
        "altDirectionVi": "Nói rằng bạn thường ngủ trên xe nhưng luôn ngắm cảnh khi đến nơi."
      },
      {
        "n": 2,
        "q": "Did you ever travel to a faraway place when you were a child?",
        "qVi": "Khi còn nhỏ bạn có đi đến nơi xa không?",
        "paraphrase": "Did you travel to a faraway place when you were a child?",
        "sampleAnswer": "Not very far, to be honest. The furthest trip I remember was a family holiday to the coast, and it felt like an adventure at the time. It was the first time I'd seen the sea, and I still remember how huge it looked.",
        "vocab": [
          {
            "word": "adventure",
            "meaningVi": "cuộc phiêu lưu",
            "synonyms": [
              "expedition",
              "escapade"
            ],
            "collocation": "feel like an adventure"
          },
          {
            "word": "huge",
            "meaningVi": "rất lớn, khổng lồ",
            "synonyms": [
              "vast",
              "immense"
            ],
            "collocation": "look huge"
          }
        ],
        "altDirectionVi": "Nói về chuyến đi lên Sa Pa hoặc đi tới một thành phố khác."
      },
      {
        "n": 3,
        "q": "Do you prefer to look at mountain views or ocean views?",
        "qVi": "Bạn thích ngắm núi hay ngắm biển hơn?",
        "paraphrase": "Would you rather look at mountains or at the sea?",
        "sampleAnswer": "I'd go with the mountains. There's something calming about rolling hills and misty peaks, and the air up there feels fresher. The sea is lovely too, but mountains make me feel more grounded.",
        "vocab": [
          {
            "word": "misty",
            "meaningVi": "có sương mù",
            "synonyms": [
              "foggy",
              "hazy"
            ],
            "collocation": "misty peaks"
          },
          {
            "word": "grounded",
            "meaningVi": "vững vàng, gắn với thực tế",
            "synonyms": [
              "stable",
              "centred"
            ],
            "collocation": "feel grounded"
          }
        ],
        "altDirectionVi": "Chọn biển và nói về âm thanh sóng hoặc hoàng hôn."
      },
      {
        "n": 4,
        "q": "When you see a beautiful view, do you like to take a photo of it?",
        "qVi": "Khi thấy một cảnh đẹp, bạn có hay chụp ảnh không?",
        "paraphrase": "Do you usually take photos when you come across a beautiful view?",
        "sampleAnswer": "Almost always. I take a few photos, but I try not to spend the whole time behind the camera. Sometimes I put the phone away and just take in the view, because some moments are better remembered than recorded.",
        "vocab": [
          {
            "word": "come across",
            "meaningVi": "tình cờ gặp",
            "synonyms": [
              "stumble upon",
              "encounter"
            ],
            "collocation": "come across a beautiful view"
          },
          {
            "word": "take in",
            "meaningVi": "ngắm nhìn, tiếp nhận",
            "synonyms": [
              "soak up",
              "absorb"
            ],
            "collocation": "take in the view"
          }
        ],
        "altDirectionVi": "Nói rằng bạn ít khi chụp để giữ trải nghiệm trực tiếp."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think it is important to travel with a guide?",
        "hintVi": "Nêu lợi ích và tình huống cần thiết."
      },
      {
        "q": "What is the best way to travel in your country?",
        "hintVi": "Nêu phương tiện và lý do."
      },
      {
        "q": "Do you like to plan your trips in advance?",
        "hintVi": "Trả lời rõ và nêu một cách bạn chuẩn bị."
      }
    ],
    "id": "p1-13"
  },
  {
    "no": 14,
    "topic": "Free Time Activities",
    "topicVi": "Hoạt động giải trí",
    "section": "specific",
    "ideasVi": [
      "Kể hoạt động yêu thích khi còn nhỏ, rồi so với bây giờ.",
      "Nói về việc thích làm một mình hay cùng người khác."
    ],
    "questions": [
      {
        "n": 1,
        "q": "What was your favourite free-time activity when you were a child?",
        "qVi": "Khi còn nhỏ, hoạt động giải trí yêu thích của bạn là gì?",
        "paraphrase": "What did you like doing in your spare time when you were little?",
        "sampleAnswer": "I loved riding my bike around the neighbourhood with my friends. We'd make up routes and race each other to the corner shop. Looking back, it was the purest kind of fun, with no screens and no plans.",
        "vocab": [
          {
            "word": "make up",
            "meaningVi": "tự nghĩ ra, bịa ra",
            "synonyms": [
              "come up with",
              "devise"
            ],
            "collocation": "make up a route"
          },
          {
            "word": "purest",
            "meaningVi": "thuần khiết nhất",
            "synonyms": [
              "simplest",
              "most innocent"
            ],
            "collocation": "the purest kind of fun"
          }
        ],
        "altDirectionVi": "Nói về trò chơi dân gian hoặc đọc truyện tranh."
      },
      {
        "n": 2,
        "q": "What activities do you enjoy doing in your free time now?",
        "qVi": "Bây giờ bạn thích làm gì khi rảnh?",
        "paraphrase": "What do you enjoy doing with your free time these days?",
        "sampleAnswer": "These days I enjoy cooking, mainly because it forces me to slow down. I also like going to the cinema now and then, and lately I've started learning to play the guitar, which is more challenging than I expected.",
        "vocab": [
          {
            "word": "force someone to",
            "meaningVi": "buộc ai đó phải",
            "synonyms": [
              "compel",
              "make someone"
            ],
            "collocation": "force me to slow down"
          },
          {
            "word": "now and then",
            "meaningVi": "thỉnh thoảng",
            "synonyms": [
              "occasionally",
              "from time to time"
            ],
            "collocation": "go to the cinema now and then"
          }
        ],
        "altDirectionVi": "Nói về thể thao hoặc đi dạo cuối tuần."
      },
      {
        "n": 3,
        "q": "Do you prefer to do free-time activities alone or with other people?",
        "qVi": "Bạn thích làm những việc này một mình hay cùng người khác?",
        "paraphrase": "Do you prefer doing leisure activities solo or with company?",
        "sampleAnswer": "It depends on the activity. For reading or cooking, I like being on my own. But for sports or going out for a meal, I much prefer having company, because sharing the experience makes it more fun.",
        "vocab": [
          {
            "word": "on my own",
            "meaningVi": "một mình",
            "synonyms": [
              "solo",
              "alone"
            ],
            "collocation": "be on my own"
          },
          {
            "word": "company",
            "meaningVi": "bạn đồng hành",
            "synonyms": [
              "companionship",
              "other people"
            ],
            "collocation": "prefer having company"
          }
        ],
        "altDirectionVi": "Chọn một bên và nói về một lần làm cùng nhau đặc biệt."
      },
      {
        "n": 4,
        "q": "Is there an activity you would like to try in the future?",
        "qVi": "Có hoạt động nào bạn muốn thử trong tương lai không?",
        "paraphrase": "Is there anything you would like to take up in the future?",
        "sampleAnswer": "Yes, I'd really like to try rock climbing. It looks challenging and it's a great way to build strength and focus. I've watched a few videos, and I'm keen to try it at a proper indoor gym.",
        "vocab": [
          {
            "word": "take up",
            "meaningVi": "bắt đầu theo đuổi (một sở thích)",
            "synonyms": [
              "start",
              "pick up"
            ],
            "collocation": "take up a hobby"
          },
          {
            "word": "keen to",
            "meaningVi": "rất muốn",
            "synonyms": [
              "eager to",
              "itching to"
            ],
            "collocation": "be keen to try something"
          }
        ],
        "altDirectionVi": "Nói về việc học vẽ tranh hoặc đi làm vườn."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think people in your country have enough free time?",
        "hintVi": "Trả lời rõ, nêu lý do về công việc."
      },
      {
        "q": "Is it important to have a hobby?",
        "hintVi": "Nêu một lợi ích về sức khoẻ tinh thần."
      },
      {
        "q": "How has the way people spend their free time changed?",
        "hintVi": "So sánh điện thoại, mạng xã hội với trước đây."
      }
    ],
    "id": "p1-14"
  },
  {
    "no": 15,
    "topic": "Memory",
    "topicVi": "Trí nhớ",
    "section": "specific",
    "ideasVi": [
      "Nêu bạn có dễ nhớ tên người không, kèm ví dụ.",
      "Nói về cách bạn ghi nhớ khi học hoặc làm việc."
    ],
    "questions": [
      {
        "n": 1,
        "q": "Do you think it is easy to remember people's names?",
        "qVi": "Bạn có nghĩ việc nhớ tên người khác dễ không?",
        "paraphrase": "Do you find it straightforward to remember people's names?",
        "sampleAnswer": "Not really. I'm generally good with faces, but names slip my mind easily, especially when I'm introduced to several people at once. I've started repeating a name back in conversation, which helps it stick.",
        "vocab": [
          {
            "word": "slip my mind",
            "meaningVi": "quên mất",
            "synonyms": [
              "escape my memory",
              "go out of my head"
            ],
            "collocation": "a name slips my mind"
          },
          {
            "word": "stick",
            "meaningVi": "ghi nhớ lâu",
            "synonyms": [
              "sink in",
              "register"
            ],
            "collocation": "help it stick"
          }
        ],
        "altDirectionVi": "Nói rằng bạn nhớ tên tốt nhờ liên tưởng hình ảnh."
      },
      {
        "n": 2,
        "q": "Do you remember things easily when you're studying or working?",
        "qVi": "Khi học hoặc làm việc, bạn có nhớ thông tin dễ không?",
        "paraphrase": "How well do you retain information when you study or work?",
        "sampleAnswer": "It depends on how I learn it. If I actively practise or explain it to someone, I remember it well. If I just read it passively, it fades quickly, so I've learned to take short notes.",
        "vocab": [
          {
            "word": "actively",
            "meaningVi": "một cách chủ động",
            "synonyms": [
              "proactively",
              "hands-on"
            ],
            "collocation": "actively practise"
          },
          {
            "word": "fade",
            "meaningVi": "mờ đi, phai dần",
            "synonyms": [
              "wane",
              "dissipate"
            ],
            "collocation": "the memory fades"
          }
        ],
        "altDirectionVi": "Nói rằng bạn nhớ tốt nhờ đọc to hoặc nghe nhạc."
      },
      {
        "n": 3,
        "q": "Would you like to have a better memory?",
        "qVi": "Bạn có muốn có trí nhớ tốt hơn không?",
        "paraphrase": "Would you like to improve your memory?",
        "sampleAnswer": "Definitely. A sharper memory would make my life much easier, from remembering appointments to recalling things I've read. I'm trying to get more sleep and do puzzles, because I've read those habits really help.",
        "vocab": [
          {
            "word": "sharper",
            "meaningVi": "nhạy bén hơn",
            "synonyms": [
              "keener",
              "more alert"
            ],
            "collocation": "a sharper memory"
          },
          {
            "word": "recall",
            "meaningVi": "nhớ lại",
            "synonyms": [
              "remember",
              "retrieve"
            ],
            "collocation": "recall details"
          }
        ],
        "altDirectionVi": "Nói rằng trí nhớ bạn đã đủ tốt, và chỉ muốn cải thiện một chút."
      },
      {
        "n": 4,
        "q": "Have you forgotten something that was very important?",
        "qVi": "Bạn đã bao giờ quên điều gì rất quan trọng chưa?",
        "paraphrase": "Have you ever forgotten something that really mattered?",
        "sampleAnswer": "Yes, once I completely forgot an important deadline for a job application. I'd written it down but never checked my notes. It was embarrassing, but it taught me to set reminders on my phone.",
        "vocab": [
          {
            "word": "deadline",
            "meaningVi": "hạn chót",
            "synonyms": [
              "cut-off date",
              "due date"
            ],
            "collocation": "miss a deadline"
          },
          {
            "word": "embarrassing",
            "meaningVi": "xấu hổ, ngượng ngùng",
            "synonyms": [
              "awkward",
              "humiliating"
            ],
            "collocation": "an embarrassing mistake"
          }
        ],
        "altDirectionVi": "Kể về việc quên sinh nhật hoặc hẹn gặp bạn bè."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think older people have better memories than young people?",
        "hintVi": "Nêu quan điểm và một lý do."
      },
      {
        "q": "Are there any tricks you use to remember things?",
        "hintVi": "Nêu 1-2 mẹo như ghi chú hoặc liên tưởng."
      },
      {
        "q": "Do you think using a phone has made people's memories worse?",
        "hintVi": "Trả lời rõ và đưa một ví dụ."
      }
    ],
    "id": "p1-15"
  },
  {
    "no": 16,
    "topic": "Singing",
    "topicVi": "Hát",
    "section": "specific",
    "ideasVi": [
      "Kể việc hát khi nhỏ và bây giờ, dù có tự tin hay không.",
      "Nói về việc bạn hát trong xe và nghe người khác hát."
    ],
    "questions": [
      {
        "n": 1,
        "q": "Did you like singing when you were a child?",
        "qVi": "Khi còn nhỏ bạn có thích hát không?",
        "paraphrase": "Were you the type of child who loved singing?",
        "sampleAnswer": "I did, though I was more enthusiastic than talented. I sang along to every cartoon theme tune, and my family used to tease me about it. Looking back, it was a lot of fun, even if the notes weren't always right.",
        "vocab": [
          {
            "word": "enthusiastic",
            "meaningVi": "nhiệt tình",
            "synonyms": [
              "keen",
              "passionate"
            ],
            "collocation": "be enthusiastic about"
          },
          {
            "word": "sing along",
            "meaningVi": "hát theo",
            "synonyms": [
              "join in singing",
              "chime in"
            ],
            "collocation": "sing along to a song"
          }
        ],
        "altDirectionVi": "Nói rằng bạn từng ngại hát trước người khác vì sợ bị chê."
      },
      {
        "n": 2,
        "q": "Do you like singing now?",
        "qVi": "Bây giờ bạn có thích hát không?",
        "paraphrase": "Do you still enjoy singing these days?",
        "sampleAnswer": "I still enjoy it, but mostly in private. I sing in the shower and in the car, which is probably the only place I'm truly relaxed about it. Karaoke with close friends is fun too, though I'm not a natural performer.",
        "vocab": [
          {
            "word": "in private",
            "meaningVi": "riêng tư",
            "synonyms": [
              "in secret",
              "behind closed doors"
            ],
            "collocation": "sing in private"
          },
          {
            "word": "natural performer",
            "meaningVi": "người có năng khiếu biểu diễn",
            "synonyms": [
              "born entertainer",
              "show-off"
            ],
            "collocation": "not a natural performer"
          }
        ],
        "altDirectionVi": "Nói rằng bạn đã tham gia một ban nhạc hoặc hội hát."
      },
      {
        "n": 3,
        "q": "Will you sing in the car?",
        "qVi": "Bạn có hát khi đi xe không?",
        "paraphrase": "Do you sing while you're in a car?",
        "sampleAnswer": "Yes, all the time. It's one of my favourite ways to pass the time in traffic. I usually belt out whatever's on the radio, and luckily there's no audience to judge me.",
        "vocab": [
          {
            "word": "belt out",
            "meaningVi": "hát to, hát hết cỡ",
            "synonyms": [
              "sing loudly",
              "blast"
            ],
            "collocation": "belt out a song"
          },
          {
            "word": "pass the time",
            "meaningVi": "giết thời gian",
            "synonyms": [
              "kill time",
              "fill the time"
            ],
            "collocation": "pass the time in traffic"
          }
        ],
        "altDirectionVi": "Nói rằng bạn thích nghe nhạc hơn là hát khi đi xe."
      },
      {
        "n": 4,
        "q": "Do you like listening to other people sing?",
        "qVi": "Bạn có thích nghe người khác hát không?",
        "paraphrase": "Do you enjoy listening to other people sing?",
        "sampleAnswer": "Very much. A good live performance can give me goosebumps, especially when the singer puts real emotion into it. I think there's something special about hearing a voice that's completely unfiltered.",
        "vocab": [
          {
            "word": "give someone goosebumps",
            "meaningVi": "làm ai nổi da gà",
            "synonyms": [
              "give someone chills",
              "move someone deeply"
            ],
            "collocation": "give me goosebumps"
          },
          {
            "word": "unfiltered",
            "meaningVi": "không qua chỉnh sửa",
            "synonyms": [
              "raw",
              "natural"
            ],
            "collocation": "an unfiltered voice"
          }
        ],
        "altDirectionVi": "Nói về một ca sĩ yêu thích hoặc một buổi hoà nhạc đã xem."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think everyone can learn to sing well?",
        "hintVi": "Trả lời có/không và nêu một điều kiện."
      },
      {
        "q": "Is singing popular with young people in your country?",
        "hintVi": "Nêu xu hướng và một ví dụ như karaoke."
      },
      {
        "q": "Would you like to join a choir?",
        "hintVi": "Trả lời rõ và nêu lý do."
      }
    ],
    "id": "p1-16"
  },
  {
    "no": 17,
    "topic": "Music",
    "topicVi": "Âm nhạc",
    "section": "specific",
    "ideasVi": [
      "Nêu thể loại yêu thích và lý do.",
      "Nói về việc nghe nhạc buồn hay vui và học nhạc có khó không."
    ],
    "questions": [
      {
        "n": 1,
        "q": "Do you like music?",
        "qVi": "Bạn có thích nhạc không?",
        "paraphrase": "Are you a big fan of music?",
        "sampleAnswer": "Absolutely. Music is almost always playing in the background for me, whether I'm cooking, commuting or working. It sets the mood, and I'm lost without it for long periods.",
        "vocab": [
          {
            "word": "in the background",
            "meaningVi": "ở nền, phát nhẹ",
            "synonyms": [
              "in the backdrop",
              "playing softly"
            ],
            "collocation": "music playing in the background"
          },
          {
            "word": "set the mood",
            "meaningVi": "tạo không khí",
            "synonyms": [
              "create an atmosphere",
              "set the tone"
            ],
            "collocation": "music sets the mood"
          }
        ],
        "altDirectionVi": "Nói rằng bạn ít nghe nhạc vì thích sự yên tĩnh."
      },
      {
        "n": 2,
        "q": "What kinds of music do you listen to?",
        "qVi": "Bạn thường nghe thể loại nhạc nào?",
        "paraphrase": "Which genres of music do you usually listen to?",
        "sampleAnswer": "I listen to a bit of everything, but indie pop and acoustic folk are my favourites. I also enjoy some Vietnamese ballads, especially when I'm feeling nostalgic about home.",
        "vocab": [
          {
            "word": "a bit of everything",
            "meaningVi": "đủ thứ, nhiều thể loại",
            "synonyms": [
              "a mixed bag",
              "a range of styles"
            ],
            "collocation": "listen to a bit of everything"
          },
          {
            "word": "nostalgic",
            "meaningVi": "hoài niệm",
            "synonyms": [
              "wistful",
              "sentimental"
            ],
            "collocation": "feel nostalgic about"
          }
        ],
        "altDirectionVi": "Nói về nhạc trẻ hoặc nhạc cổ điển mà bạn thích."
      },
      {
        "n": 3,
        "q": "Do you prefer sad or happy music?",
        "qVi": "Bạn thích nhạc buồn hay nhạc vui hơn?",
        "paraphrase": "Do you lean towards melancholy songs or upbeat ones?",
        "sampleAnswer": "It depends on my mood. When I'm stressed, I prefer something upbeat to lift my spirits. But on a rainy evening, a sad song can be oddly comforting, because it makes me feel understood.",
        "vocab": [
          {
            "word": "upbeat",
            "meaningVi": "vui tươi, sôi động",
            "synonyms": [
              "cheerful",
              "lively"
            ],
            "collocation": "an upbeat song"
          },
          {
            "word": "oddly",
            "meaningVi": "một cách kỳ lạ",
            "synonyms": [
              "strangely",
              "surprisingly"
            ],
            "collocation": "oddly comforting"
          }
        ],
        "altDirectionVi": "Chọn nhạc sôi động và nói về việc tập thể dục cùng nhạc."
      },
      {
        "n": 4,
        "q": "Is it easy to learn music?",
        "qVi": "Học nhạc có dễ không?",
        "paraphrase": "Would you say learning music is an easy skill to pick up?",
        "sampleAnswer": "Not really, at least not at first. The basics take time, and you need a lot of patience to get your fingers and ears working together. But once you get past the early stages, it's incredibly rewarding.",
        "vocab": [
          {
            "word": "patience",
            "meaningVi": "sự kiên nhẫn",
            "synonyms": [
              "perseverance",
              "endurance"
            ],
            "collocation": "require patience"
          },
          {
            "word": "get past",
            "meaningVi": "vượt qua",
            "synonyms": [
              "overcome",
              "move beyond"
            ],
            "collocation": "get past the early stages"
          }
        ],
        "altDirectionVi": "Nói rằng bạn học nhạc từ nhỏ nên thấy dễ hơn người lớn."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think music can change people's mood?",
        "hintVi": "Trả lời rõ và đưa một ví dụ cá nhân."
      },
      {
        "q": "Do you think music is becoming less important to young people?",
        "hintVi": "Nêu quan điểm và một lý do."
      },
      {
        "q": "Would you like to learn to play an instrument?",
        "hintVi": "Chọn nhạc cụ và nêu lý do."
      }
    ],
    "id": "p1-17"
  },
  {
    "no": 18,
    "topic": "Watch",
    "topicVi": "Đồng hồ đeo tay",
    "section": "specific",
    "ideasVi": [
      "Nói bạn có đeo đồng hồ hằng ngày không, và đeo loại nào.",
      "Kể về món quà đồng hồ, hoặc người xung quanh có đeo không."
    ],
    "questions": [
      {
        "n": 1,
        "q": "Do you wear a watch in your daily life?",
        "qVi": "Bạn có đeo đồng hồ hằng ngày không?",
        "paraphrase": "Do you make a habit of wearing a watch every day?",
        "sampleAnswer": "Not anymore, to be honest. I used to wear one every day, but now my phone does the job. I still wear a watch on formal occasions, though, because it just looks more polished.",
        "vocab": [
          {
            "word": "does the job",
            "meaningVi": "làm được việc (thay thế)",
            "synonyms": [
              "serves the purpose",
              "gets the job done"
            ],
            "collocation": "my phone does the job"
          },
          {
            "word": "polished",
            "meaningVi": "chỉnh chu, bóng bẩy",
            "synonyms": [
              "refined",
              "sleek"
            ],
            "collocation": "look polished"
          }
        ],
        "altDirectionVi": "Nói rằng bạn đeo đồng hồ mỗi ngày vì thói quen và để xem giờ nhanh."
      },
      {
        "n": 2,
        "q": "What kind of watch do you have?",
        "qVi": "Bạn có loại đồng hồ nào?",
        "paraphrase": "What kind of watch do you own?",
        "sampleAnswer": "I have a simple leather-strapped watch with a silver face. It's not expensive, but I like its classic look, and it's comfortable enough to wear all day. I'd say it's more about style than function.",
        "vocab": [
          {
            "word": "strap",
            "meaningVi": "dây đeo",
            "synonyms": [
              "band",
              "wristband"
            ],
            "collocation": "a leather strap"
          },
          {
            "word": "classic",
            "meaningVi": "cổ điển, kinh điển",
            "synonyms": [
              "timeless",
              "traditional"
            ],
            "collocation": "a classic look"
          }
        ],
        "altDirectionVi": "Nói về đồng hồ thông minh và các tính năng bạn dùng."
      },
      {
        "n": 3,
        "q": "Has anyone ever given you a watch as a gift?",
        "qVi": "Đã có ai tặng bạn đồng hồ chưa?",
        "paraphrase": "Has anybody ever presented you with a watch as a gift?",
        "sampleAnswer": "Yes, my father gave me one when I graduated from university. It's still one of my most treasured possessions. Every time I look at it, I think about the pride he showed that day.",
        "vocab": [
          {
            "word": "treasured",
            "meaningVi": "được trân trọng",
            "synonyms": [
              "cherished",
              "prized"
            ],
            "collocation": "a treasured possession"
          },
          {
            "word": "graduate",
            "meaningVi": "tốt nghiệp",
            "synonyms": [
              "finish school",
              "complete a degree"
            ],
            "collocation": "graduate from university"
          }
        ],
        "altDirectionVi": "Nói rằng bạn chưa nhận đồng hồ làm quà nhưng đã từng tặng ai đó."
      },
      {
        "n": 4,
        "q": "Do people around you like wearing watches?",
        "qVi": "Những người xung quanh bạn có thích đeo đồng hồ không?",
        "paraphrase": "Are watches popular among the people around you?",
        "sampleAnswer": "Mixed, I'd say. My older relatives still wear them every day, while many of my friends have switched to smartwatches. Some of them like the fitness tracking, but others find them distracting.",
        "vocab": [
          {
            "word": "switch to",
            "meaningVi": "chuyển sang",
            "synonyms": [
              "move to",
              "change over to"
            ],
            "collocation": "switch to smartwatches"
          },
          {
            "word": "distracting",
            "meaningVi": "gây xao nhãng",
            "synonyms": [
              "disruptive",
              "off-putting"
            ],
            "collocation": "find something distracting"
          }
        ],
        "altDirectionVi": "Nói rằng bạn bè nhiều người không đeo nữa vì điện thoại đủ rồi."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think wearing a watch is becoming old-fashioned?",
        "hintVi": "Trả lời rõ và nêu một lý do."
      },
      {
        "q": "What is the most expensive thing you have ever bought?",
        "hintVi": "Kể món đồ và lý do bạn mua."
      },
      {
        "q": "Do you think people should be punctual?",
        "hintVi": "Nêu quan điểm và một ví dụ về đúng giờ."
      }
    ],
    "id": "p1-18"
  },
  {
    "no": 19,
    "topic": "Parks and Gardens",
    "topicVi": "Công viên và vườn hoa",
    "section": "specific",
    "ideasVi": [
      "Kể loại công viên bạn thích hồi nhỏ, rồi so với bây giờ.",
      "Nói về việc thành phố có nên có thêm công viên không."
    ],
    "questions": [
      {
        "n": 1,
        "q": "What kind of parks and gardens did you like when you were a child?",
        "qVi": "Khi còn nhỏ bạn thích loại công viên hay vườn hoa nào?",
        "paraphrase": "What kind of park or garden did you enjoy as a child?",
        "sampleAnswer": "I loved the small neighbourhood park with its old swings and a big banyan tree. It felt like our own private world. We'd spend whole afternoons there, climbing and hide-and-seeking until it got dark.",
        "vocab": [
          {
            "word": "hide-and-seek",
            "meaningVi": "trò trốn tìm",
            "synonyms": [
              "hide and seek"
            ],
            "collocation": "play hide-and-seek"
          },
          {
            "word": "private world",
            "meaningVi": "thế giới riêng",
            "synonyms": [
              "little haven",
              "own little space"
            ],
            "collocation": "feel like a private world"
          }
        ],
        "altDirectionVi": "Nói về vườn hoa ở quê hoặc vườn rau của ông bà."
      },
      {
        "n": 2,
        "q": "Do you enjoy visiting parks and gardens now?",
        "qVi": "Bây giờ bạn có thích đi công viên hoặc vườn hoa không?",
        "paraphrase": "Do you still enjoy going to parks and gardens?",
        "sampleAnswer": "Yes, though I go less often than I'd like. I tend to go early in the morning when it's quiet, and I enjoy watching people stretching or walking their dogs. It's a good reset before a busy day.",
        "vocab": [
          {
            "word": "reset",
            "meaningVi": "làm mới lại, tái tạo năng lượng",
            "synonyms": [
              "recharge",
              "refresh"
            ],
            "collocation": "a good reset"
          },
          {
            "word": "go less often",
            "meaningVi": "đi ít hơn",
            "synonyms": [
              "visit less frequently"
            ],
            "collocation": "go less often than I'd like"
          }
        ],
        "altDirectionVi": "Nói rằng bạn thích đi vào cuối tuần cùng gia đình."
      },
      {
        "n": 3,
        "q": "Do you think there should be more parks and gardens in your city?",
        "qVi": "Bạn có nghĩ thành phố nên có thêm công viên không?",
        "paraphrase": "Do you think cities need more green spaces?",
        "sampleAnswer": "Definitely. Green spaces improve air quality, reduce stress and give children a safe place to play. As cities keep growing, it's important that planners set aside land for parks before it's too late.",
        "vocab": [
          {
            "word": "set aside",
            "meaningVi": "dành riêng",
            "synonyms": [
              "allocate",
              "earmark"
            ],
            "collocation": "set aside land for parks"
          },
          {
            "word": "green space",
            "meaningVi": "không gian xanh",
            "synonyms": [
              "public greenery",
              "open space"
            ],
            "collocation": "improve green spaces"
          }
        ],
        "altDirectionVi": "Nói rằng thành phố đã có nhiều công viên nhưng cần giữ chúng sạch hơn."
      },
      {
        "n": 4,
        "q": "Is there a famous park or garden that you want to visit?",
        "qVi": "Có công viên hoặc vườn hoa nổi tiếng nào bạn muốn đến thăm không?",
        "paraphrase": "Is there a famous park or garden you would like to visit?",
        "sampleAnswer": "Yes, I'd really like to see the Butchart Gardens in Canada. I've seen photos of its sunken garden, and it looks like something out of a painting. It would be lovely to see the flowers in full bloom.",
        "vocab": [
          {
            "word": "something out of a painting",
            "meaningVi": "đẹp như tranh vẽ",
            "synonyms": [
              "picture-perfect",
              "like a postcard"
            ],
            "collocation": "look like something out of a painting"
          },
          {
            "word": "in full bloom",
            "meaningVi": "nở rộ hết cỡ",
            "synonyms": [
              "flourishing",
              "at its peak"
            ],
            "collocation": "flowers in full bloom"
          }
        ],
        "altDirectionVi": "Chọn công viên trong nước, ví dụ vườn hoa ở Đà Lạt, và nói vì sao bạn muốn tới."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think public parks are well looked after in your city?",
        "hintVi": "Trả lời và nêu một điểm tốt hoặc chưa tốt."
      },
      {
        "q": "Do old people in your country often visit parks?",
        "hintVi": "Nêu thói quen cụ thể như tập thể dục buổi sáng."
      },
      {
        "q": "What do people usually do in parks in your country?",
        "hintVi": "Nêu 2-3 hoạt động như tập thể dục, chụp ảnh."
      }
    ],
    "id": "p1-19"
  },
  {
    "no": 20,
    "topic": "Tidiness",
    "topicVi": "Ngăn nắp",
    "section": "specific",
    "ideasVi": [
      "Nói bạn hồi nhỏ và bây giờ có ngăn nắp không.",
      "Nêu quan điểm về người quá ngăn nắp và người bừa bộn."
    ],
    "questions": [
      {
        "n": 1,
        "q": "Were you a tidy person when you were a child?",
        "qVi": "Khi còn nhỏ bạn có phải người ngăn nắp không?",
        "paraphrase": "Were you a neat and orderly child?",
        "sampleAnswer": "Not really. My room was usually a mess, and my mum was always reminding me to put my toys away. I think I only started caring about tidiness when I moved out and had to look after my own space.",
        "vocab": [
          {
            "word": "a mess",
            "meaningVi": "bừa bộn",
            "synonyms": [
              "a disaster zone",
              "chaos"
            ],
            "collocation": "my room was a mess"
          },
          {
            "word": "look after",
            "meaningVi": "tự chăm sóc, lo cho",
            "synonyms": [
              "take care of",
              "manage"
            ],
            "collocation": "look after my own space"
          }
        ],
        "altDirectionVi": "Nói rằng bạn đã ngăn nắp từ nhỏ vì được dạy từ gia đình."
      },
      {
        "n": 2,
        "q": "Are you a tidy person now?",
        "qVi": "Bây giờ bạn có ngăn nắp không?",
        "paraphrase": "Would you describe yourself as a tidy person these days?",
        "sampleAnswer": "I'd say I'm reasonably tidy. I like things in their place, and I clean up before I go to bed. But I'm not obsessive about it, and I can live with a bit of clutter on the weekend.",
        "vocab": [
          {
            "word": "obsessive",
            "meaningVi": "ám ảnh, quá mức",
            "synonyms": [
              "fanatical",
              "compulsive"
            ],
            "collocation": "be obsessive about"
          },
          {
            "word": "clutter",
            "meaningVi": "đồ đạc bừa bãi",
            "synonyms": [
              "mess",
              "junk"
            ],
            "collocation": "a bit of clutter"
          }
        ],
        "altDirectionVi": "Nói rằng bạn bừa hơn trước nhưng đã học cách sắp xếp."
      },
      {
        "n": 3,
        "q": "What do you think of untidy people?",
        "qVi": "Bạn nghĩ gì về người bừa bộn?",
        "paraphrase": "What is your view of people who are untidy?",
        "sampleAnswer": "I don't judge them too harshly. Some people think clearly in a cluttered space, and everyone has different priorities. Still, I think a messy home can affect your mood, so it's worth a bit of effort.",
        "vocab": [
          {
            "word": "harshly",
            "meaningVi": "gay gắt, nghiêm khắc",
            "synonyms": [
              "severely",
              "sternly"
            ],
            "collocation": "judge harshly"
          },
          {
            "word": "priorities",
            "meaningVi": "ưu tiên",
            "synonyms": [
              "concerns",
              "values"
            ],
            "collocation": "different priorities"
          }
        ],
        "altDirectionVi": "Nói rằng bừa bộn chỉ là chuyện thói quen, không phải tính cách xấu."
      },
      {
        "n": 4,
        "q": "What do you think of people who are overly tidy?",
        "qVi": "Bạn nghĩ gì về người quá ngăn nắp?",
        "paraphrase": "What do you think of people who are extremely tidy?",
        "sampleAnswer": "I admire their discipline, but sometimes it can go too far. If someone can't relax until everything is perfectly aligned, that can be exhausting for them and for the people they live with. Balance is what matters.",
        "vocab": [
          {
            "word": "aligned",
            "meaningVi": "được sắp thẳng hàng",
            "synonyms": [
              "lined up",
              "arranged"
            ],
            "collocation": "perfectly aligned"
          },
          {
            "word": "go too far",
            "meaningVi": "đi quá xa",
            "synonyms": [
              "overdo it",
              "take it too far"
            ],
            "collocation": "it can go too far"
          }
        ],
        "altDirectionVi": "Nói rằng bạn thấy họ giúp nhà cửa gọn gàng và hiệu quả."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think it is important to keep your home clean?",
        "hintVi": "Nêu lợi ích cho sức khoẻ hoặc tinh thần."
      },
      {
        "q": "Who usually does the housework in your family?",
        "hintVi": "Nêu ai làm và cách chia việc."
      },
      {
        "q": "Do you find it hard to keep your workplace tidy?",
        "hintVi": "Trả lời rõ và nêu một mẹo."
      }
    ],
    "id": "p1-20"
  },
  {
    "no": 21,
    "topic": "Headphones",
    "topicVi": "Tai nghe",
    "section": "specific",
    "ideasVi": [
      "Nêu tần suất đeo tai nghe và loại bạn dùng.",
      "Nói về lúc nào không nên đeo và lý do."
    ],
    "questions": [
      {
        "n": 1,
        "q": "How often do you wear headphones?",
        "qVi": "Bạn đeo tai nghe thường xuyên đến mức nào?",
        "paraphrase": "How frequently do you have headphones on?",
        "sampleAnswer": "Pretty much every day, to be honest. I wear them on my commute, while I'm working out and when I need to focus on a task. Without them, I find the city noise really distracting.",
        "vocab": [
          {
            "word": "commute",
            "meaningVi": "đi lại hằng ngày (đi làm)",
            "synonyms": [
              "travel to work",
              "daily journey"
            ],
            "collocation": "on my commute"
          },
          {
            "word": "distracting",
            "meaningVi": "gây xao nhãng",
            "synonyms": [
              "disruptive",
              "annoying"
            ],
            "collocation": "find something distracting"
          }
        ],
        "altDirectionVi": "Nói rằng bạn chỉ đeo khi chạy bộ hoặc đi học."
      },
      {
        "n": 2,
        "q": "Do you think headphones are useful?",
        "qVi": "Bạn có nghĩ tai nghe hữu ích không?",
        "paraphrase": "Do you think headphones are a useful invention?",
        "sampleAnswer": "Very useful, yes. They let you enjoy music or podcasts without disturbing others, and noise-cancelling models are great for flights or noisy offices. I'd like to think they've made everyday life a little more comfortable.",
        "vocab": [
          {
            "word": "noise-cancelling",
            "meaningVi": "chống ồn",
            "synonyms": [
              "noise-reducing"
            ],
            "collocation": "noise-cancelling headphones"
          },
          {
            "word": "disturb",
            "meaningVi": "làm phiền",
            "synonyms": [
              "bother",
              "interrupt"
            ],
            "collocation": "without disturbing others"
          }
        ],
        "altDirectionVi": "Nói về nhược điểm như hại thính giác nếu nghe quá to."
      },
      {
        "n": 3,
        "q": "Are headphones popular in your country?",
        "qVi": "Tai nghe có phổ biến ở đất nước bạn không?",
        "paraphrase": "Are headphones widely used in your country?",
        "sampleAnswer": "Absolutely. You see them everywhere, from students on buses to people jogging by the lake. Wireless earbuds have become especially popular, partly because they're relatively affordable now.",
        "vocab": [
          {
            "word": "widely used",
            "meaningVi": "được dùng rộng rãi",
            "synonyms": [
              "commonplace",
              "ubiquitous"
            ],
            "collocation": "widely used across the country"
          },
          {
            "word": "affordable",
            "meaningVi": "giá cả phải chăng",
            "synonyms": [
              "budget-friendly",
              "reasonably priced"
            ],
            "collocation": "relatively affordable"
          }
        ],
        "altDirectionVi": "Nói rằng tai nghe có dây vẫn phổ biến hơn tai nghe không dây."
      },
      {
        "n": 4,
        "q": "In what situations should people not wear headphones?",
        "qVi": "Trong những tình huống nào người ta không nên đeo tai nghe?",
        "paraphrase": "When do you think it is inappropriate to wear headphones?",
        "sampleAnswer": "When you're crossing the road, for example, because you might not hear a horn or a warning. It's also rude to wear them during a conversation or in a meeting. And you should definitely take them off when you're driving.",
        "vocab": [
          {
            "word": "inappropriate",
            "meaningVi": "không phù hợp",
            "synonyms": [
              "unsuitable",
              "out of place"
            ],
            "collocation": "inappropriate behaviour"
          },
          {
            "word": "take off",
            "meaningVi": "tháo ra",
            "synonyms": [
              "remove",
              "pull off"
            ],
            "collocation": "take off your headphones"
          }
        ],
        "altDirectionVi": "Nêu thêm tình huống như trong thư viện hoặc khi đi xe máy."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think young people listen to music too loudly?",
        "hintVi": "Nêu quan điểm và một hệ quả như mất thính lực."
      },
      {
        "q": "Do you prefer wired or wireless headphones?",
        "hintVi": "Chọn một loại và nêu ưu điểm."
      },
      {
        "q": "Would you like to buy an expensive pair of headphones?",
        "hintVi": "Trả lời rõ và nêu lý do."
      }
    ],
    "id": "p1-21"
  },
  {
    "no": 22,
    "topic": "Websites",
    "topicVi": "Trang web",
    "section": "specific",
    "ideasVi": [
      "Nói bạn có dùng web thường xuyên không và dùng trang nào.",
      "So sánh tìm thông tin trên web và trong sách."
    ],
    "questions": [
      {
        "n": 1,
        "q": "Do you usually use websites?",
        "qVi": "Bạn có thường dùng các trang web không?",
        "paraphrase": "Do you spend much time on websites in your daily routine?",
        "sampleAnswer": "Yes, I use them constantly. I check news sites in the morning, read online articles during my lunch break, and I'm on learning platforms most evenings. For me they're part of everyday life, whether for work or for relaxing.",
        "vocab": [
          {
            "word": "constantly",
            "meaningVi": "liên tục",
            "synonyms": [
              "continually",
              "all the time"
            ],
            "collocation": "use constantly"
          },
          {
            "word": "part of everyday life",
            "meaningVi": "một phần của cuộc sống hằng ngày",
            "synonyms": [
              "a daily habit",
              "routine"
            ],
            "collocation": "become part of everyday life"
          }
        ],
        "altDirectionVi": "Nói rằng bạn chỉ dùng web cho công việc và hạn chế giải trí."
      },
      {
        "n": 2,
        "q": "Which website do you usually use?",
        "qVi": "Bạn thường dùng trang web nào?",
        "paraphrase": "Which websites do you visit most often?",
        "sampleAnswer": "I use a few, but the one I visit most is a news and learning platform for English. I also check a few online shops and social networks, but I try to limit the time on those.",
        "vocab": [
          {
            "word": "visit",
            "meaningVi": "truy cập",
            "synonyms": [
              "access",
              "go to"
            ],
            "collocation": "visit a website"
          },
          {
            "word": "limit",
            "meaningVi": "giới hạn",
            "synonyms": [
              "restrict",
              "cap"
            ],
            "collocation": "limit screen time"
          }
        ],
        "altDirectionVi": "Nêu tên một trang học tập cụ thể và lý do chọn nó."
      },
      {
        "n": 3,
        "q": "Do you prefer to search for information through websites or books?",
        "qVi": "Bạn tìm thông tin qua trang web hay sách hơn?",
        "paraphrase": "When you need information, do you turn to websites or books first?",
        "sampleAnswer": "Websites, usually, because they're quick and up to date. But for deeper topics, I still prefer books, because the content is usually more carefully researched and structured.",
        "vocab": [
          {
            "word": "up to date",
            "meaningVi": "cập nhật",
            "synonyms": [
              "current",
              "recent"
            ],
            "collocation": "keep information up to date"
          },
          {
            "word": "carefully researched",
            "meaningVi": "được nghiên cứu kỹ lưỡng",
            "synonyms": [
              "thoroughly investigated",
              "well-sourced"
            ],
            "collocation": "carefully researched content"
          }
        ],
        "altDirectionVi": "Nói rằng bạn chọn sách khi cần kiến thức nền tảng."
      },
      {
        "n": 4,
        "q": "Do you want to create your own website in the future?",
        "qVi": "Bạn có muốn tự tạo một trang web trong tương lai không?",
        "paraphrase": "Would you like to build your own website one day?",
        "sampleAnswer": "I'd like to, yes. I'm thinking of a small site to share my language-learning notes, nothing too ambitious. I'm still deciding whether to learn the basics of coding or use a website builder, because I don't want to spend too much time on the design.",
        "vocab": [
          {
            "word": "ambitious",
            "meaningVi": "đầy tham vọng",
            "synonyms": [
              "aspiring",
              "far-reaching"
            ],
            "collocation": "nothing too ambitious"
          },
          {
            "word": "website builder",
            "meaningVi": "công cụ tạo web không cần lập trình",
            "synonyms": [
              "site creator",
              "drag-and-drop tool"
            ],
            "collocation": "use a website builder"
          }
        ],
        "altDirectionVi": "Nói rằng bạn đã có một trang cá nhân nhỏ hoặc blog."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think websites are more useful than newspapers?",
        "hintVi": "So sánh tốc độ và độ tin cậy."
      },
      {
        "q": "Do older people in your country use websites often?",
        "hintVi": "Nêu xu hướng và một ví dụ."
      },
      {
        "q": "Have you ever had trouble finding reliable information online?",
        "hintVi": "Kể một trường hợp và cách bạn kiểm chứng."
      }
    ],
    "id": "p1-22"
  },
  {
    "no": 23,
    "topic": "Telling Jokes",
    "topicVi": "Kể chuyện cười",
    "section": "specific",
    "ideasVi": [
      "Nói bạn có thích kể chuyện cười không và kể một lần cụ thể.",
      "Nêu bạn có thích bị trêu không và giới hạn của bạn."
    ],
    "questions": [
      {
        "n": 1,
        "q": "Do you like to tell jokes?",
        "qVi": "Bạn có thích kể chuyện cười không?",
        "paraphrase": "Are you someone who enjoys cracking jokes?",
        "sampleAnswer": "I do, though I'm better at playing along than starting the jokes myself. I find I get the best laughs when I'm telling a short anecdote with a funny twist at the end, rather than a classic one-liner.",
        "vocab": [
          {
            "word": "play along",
            "meaningVi": "hùa theo, hưởng ứng",
            "synonyms": [
              "go along with",
              "join in"
            ],
            "collocation": "play along with the joke"
          },
          {
            "word": "anecdote",
            "meaningVi": "câu chuyện ngắn có thật",
            "synonyms": [
              "story",
              "tale"
            ],
            "collocation": "a short anecdote"
          }
        ],
        "altDirectionVi": "Nói rằng bạn là người kể chuyện cười rất hay trong nhóm."
      },
      {
        "n": 2,
        "q": "Do you often joke with your friends?",
        "qVi": "Bạn có hay đùa với bạn bè không?",
        "paraphrase": "Do you often tease your friends for fun?",
        "sampleAnswer": "All the time. My friends and I have a running joke about who forgets birthdays most often. We're pretty relentless with each other, but we all know it's affectionate, and nobody takes it personally.",
        "vocab": [
          {
            "word": "running joke",
            "meaningVi": "trò đùa lặp đi lặp lại trong nhóm",
            "synonyms": [
              "inside joke",
              "recurring gag"
            ],
            "collocation": "have a running joke"
          },
          {
            "word": "relentless",
            "meaningVi": "không ngừng nghỉ",
            "synonyms": [
              "unrelenting",
              "persistent"
            ],
            "collocation": "relentless teasing"
          }
        ],
        "altDirectionVi": "Nói rằng bạn thích đùa nhẹ nhàng, ít khi trêu quá đà."
      },
      {
        "n": 3,
        "q": "Do you have friends who love telling jokes?",
        "qVi": "Bạn có bạn bè nào thích kể chuyện cười không?",
        "paraphrase": "Do you know anyone who loves telling jokes?",
        "sampleAnswer": "Yes, my cousin is the family comedian. He has a joke for every occasion, and some of them are terrible, which makes them even funnier. Whenever we get together, he's the one who gets everyone laughing.",
        "vocab": [
          {
            "word": "comedian",
            "meaningVi": "người hài hước, diễn viên hài",
            "synonyms": [
              "entertainer",
              "wit"
            ],
            "collocation": "the family comedian"
          },
          {
            "word": "for every occasion",
            "meaningVi": "cho mọi dịp",
            "synonyms": [
              "for any situation",
              "at any time"
            ],
            "collocation": "a joke for every occasion"
          }
        ],
        "altDirectionVi": "Kể về một người bạn thích kể chuyện cười nhưng hay kể lại chuyện cũ."
      },
      {
        "n": 4,
        "q": "Do you like being joked about?",
        "qVi": "Bạn có thích bị trêu về bản thân không?",
        "paraphrase": "Do you like being the target of a joke?",
        "sampleAnswer": "Up to a point, yes. If it's light-hearted and my friends are the ones doing it, I'm happy to laugh at myself. But if the joke crosses a line or feels cruel, I'd rather they stopped, because the friendship matters more than the laugh.",
        "vocab": [
          {
            "word": "up to a point",
            "meaningVi": "đến một mức nào đó",
            "synonyms": [
              "to some extent",
              "within reason"
            ],
            "collocation": "up to a point"
          },
          {
            "word": "cross a line",
            "meaningVi": "vượt quá giới hạn",
            "synonyms": [
              "go too far",
              "overstep"
            ],
            "collocation": "the joke crosses a line"
          }
        ],
        "altDirectionVi": "Nói rằng bạn không thích bị trêu trước đông người."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think humour is important in a friendship?",
        "hintVi": "Nêu lợi ích và một ví dụ."
      },
      {
        "q": "Are there cultural differences in what people find funny?",
        "hintVi": "Nêu một khác biệt ví dụ như phong cách hài."
      },
      {
        "q": "Do you prefer watching comedy shows or reading jokes?",
        "hintVi": "Chọn một và nêu lý do."
      }
    ],
    "id": "p1-23"
  },
  {
    "no": 24,
    "topic": "Science",
    "topicVi": "Khoa học",
    "section": "specific",
    "ideasVi": [
      "Nói bạn có học khoa học hồi nhỏ không và thích môn nào.",
      "Nêu khoa học giúp gì trong đời sống và cách bạn tiếp cận."
    ],
    "questions": [
      {
        "n": 1,
        "q": "Did you study science when you were at primary school?",
        "qVi": "Khi học tiểu học bạn có học khoa học không?",
        "paraphrase": "Did you take any science lessons at primary school?",
        "sampleAnswer": "Yes, and I really enjoyed them. We did simple experiments with plants, magnets and water, and the teacher made everything feel like a game. Those early lessons sparked my curiosity about how things work.",
        "vocab": [
          {
            "word": "spark",
            "meaningVi": "khơi dậy",
            "synonyms": [
              "ignite",
              "trigger"
            ],
            "collocation": "spark curiosity"
          },
          {
            "word": "curiosity",
            "meaningVi": "sự tò mò",
            "synonyms": [
              "interest",
              "inquisitiveness"
            ],
            "collocation": "a natural curiosity"
          }
        ],
        "altDirectionVi": "Nói rằng khoa học ở trường bạn khá nhàm chán, nhưng bạn tự học về sau."
      },
      {
        "n": 2,
        "q": "Do you think everyone should study science at school?",
        "qVi": "Bạn có nghĩ mọi người nên học khoa học ở trường không?",
        "paraphrase": "Should everyone be required to study science at school?",
        "sampleAnswer": "I do, at least at a basic level. Science teaches you to ask questions and test ideas, which is useful whatever career you choose. Even people who never work in a lab benefit from understanding how the body and the environment work.",
        "vocab": [
          {
            "word": "at a basic level",
            "meaningVi": "ở mức cơ bản",
            "synonyms": [
              "at an elementary level",
              "in its simplest form"
            ],
            "collocation": "study at a basic level"
          },
          {
            "word": "benefit from",
            "meaningVi": "được hưởng lợi từ",
            "synonyms": [
              "gain from",
              "profit from"
            ],
            "collocation": "benefit from understanding"
          }
        ],
        "altDirectionVi": "Nói rằng học sinh nên chọn môn khoa học phù hợp với năng lực."
      },
      {
        "n": 3,
        "q": "How does knowing about science help you in everyday life?",
        "qVi": "Khoa học giúp ích gì cho cuộc sống hằng ngày?",
        "paraphrase": "In what ways does science make everyday life easier?",
        "sampleAnswer": "It's everywhere, honestly. Understanding basic chemistry helps you cook better, and knowing a bit of biology helps you make healthier choices. Even something like checking the weather relies on science, so we often don't notice how much it shapes our lives.",
        "vocab": [
          {
            "word": "rely on",
            "meaningVi": "dựa vào",
            "synonyms": [
              "depend on",
              "count on"
            ],
            "collocation": "rely on science"
          },
          {
            "word": "shape",
            "meaningVi": "định hình",
            "synonyms": [
              "influence",
              "mould"
            ],
            "collocation": "shape our lives"
          }
        ],
        "altDirectionVi": "Nêu ví dụ về y tế, như hiểu về vaccine, và tác động của nó."
      },
      {
        "n": 4,
        "q": "How do you learn about science in daily life?",
        "qVi": "Bạn tìm hiểu về khoa học trong đời sống hằng ngày bằng cách nào?",
        "paraphrase": "What are your main sources for learning about science in daily life?",
        "sampleAnswer": "Mostly through documentaries and science podcasts. I also follow a few accounts that explain research in simple terms. I try to read articles from reliable sources, because there's a lot of misinformation online.",
        "vocab": [
          {
            "word": "misinformation",
            "meaningVi": "thông tin sai lệch",
            "synonyms": [
              "fake news",
              "false information"
            ],
            "collocation": "spread misinformation"
          },
          {
            "word": "in simple terms",
            "meaningVi": "nói một cách đơn giản",
            "synonyms": [
              "plainly",
              "in layman's terms"
            ],
            "collocation": "explain in simple terms"
          }
        ],
        "altDirectionVi": "Nói về việc xem bảo tàng khoa học hoặc tham gia lớp học ngắn hạn."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think science is becoming more important than before?",
        "hintVi": "Nêu lý do liên quan công nghệ."
      },
      {
        "q": "Would you like to become a scientist?",
        "hintVi": "Trả lời rõ và nêu một lĩnh vực."
      },
      {
        "q": "Do children in your country have enough chance to do experiments?",
        "hintVi": "Nêu thực tế ở trường và gợi ý cải thiện."
      }
    ],
    "id": "p1-24"
  },
  {
    "no": 25,
    "topic": "Teachers",
    "topicVi": "Giáo viên",
    "section": "specific",
    "ideasVi": [
      "Nói về một giáo viên bạn quý nhất và lý do.",
      "So sánh giáo viên bây giờ với thế hệ bố mẹ bạn."
    ],
    "questions": [
      {
        "n": 1,
        "q": "Do you have a favourite teacher?",
        "qVi": "Bạn có giáo viên yêu thích nào không?",
        "paraphrase": "Is there a teacher you particularly admire?",
        "sampleAnswer": "Yes, my high school literature teacher. She didn't just teach the textbook. She made us argue about novels, and she always believed I could do better than I thought. She's probably the reason I ended up loving reading.",
        "vocab": [
          {
            "word": "particularly",
            "meaningVi": "đặc biệt",
            "synonyms": [
              "especially",
              "in particular"
            ],
            "collocation": "particularly admire"
          },
          {
            "word": "argue about",
            "meaningVi": "tranh luận về",
            "synonyms": [
              "debate",
              "discuss"
            ],
            "collocation": "argue about novels"
          }
        ],
        "altDirectionVi": "Nói về một giáo viên tiểu học đã khích lệ bạn."
      },
      {
        "n": 2,
        "q": "Do you still keep in touch with your former teachers?",
        "qVi": "Bạn có còn giữ liên lạc với thầy cô cũ không?",
        "paraphrase": "Are you still in touch with any of your former teachers?",
        "sampleAnswer": "A few of them, yes. I send my old maths teacher a message on Teachers' Day, and she always replies warmly. It's nice to be able to update them on what I'm doing now.",
        "vocab": [
          {
            "word": "in touch",
            "meaningVi": "giữ liên lạc",
            "synonyms": [
              "in contact",
              "connected"
            ],
            "collocation": "stay in touch with teachers"
          },
          {
            "word": "update",
            "meaningVi": "cập nhật tin tức",
            "synonyms": [
              "fill in",
              "bring up to speed"
            ],
            "collocation": "update someone on something"
          }
        ],
        "altDirectionVi": "Nói rằng bạn đã mất liên lạc nhưng vẫn nhớ thầy cô."
      },
      {
        "n": 3,
        "q": "Did you want to be a teacher when you were young?",
        "qVi": "Khi còn nhỏ bạn có muốn trở thành giáo viên không?",
        "paraphrase": "When you were young, did you ever dream of becoming a teacher?",
        "sampleAnswer": "For a short time, yes. I played teacher with my younger cousins and loved being in charge of the class. But as I got older I wanted to work in a different field, though teaching still appeals to me.",
        "vocab": [
          {
            "word": "in charge of",
            "meaningVi": "phụ trách",
            "synonyms": [
              "responsible for",
              "overseeing"
            ],
            "collocation": "be in charge of the class"
          },
          {
            "word": "appeal to",
            "meaningVi": "hấp dẫn, thu hút",
            "synonyms": [
              "attract",
              "interest"
            ],
            "collocation": "appeal to someone"
          }
        ],
        "altDirectionVi": "Nói rằng bạn từng muốn làm bác sĩ, nhưng sau đó nhận ra mình hợp với việc khác."
      },
      {
        "n": 4,
        "q": "Do you think teachers are different now than when your parents were at school?",
        "qVi": "Bạn có nghĩ giáo viên bây giờ khác với giáo viên thời bố mẹ bạn đi học không?",
        "paraphrase": "Do you think teachers today differ from the teachers your parents had?",
        "sampleAnswer": "I think they're very different. Teachers now use technology and encourage discussion, while in my parents' day, lessons were more about memorising. That said, the best teachers have always been the ones who care about their students.",
        "vocab": [
          {
            "word": "memorising",
            "meaningVi": "học thuộc lòng",
            "synonyms": [
              "rote learning",
              "committing to memory"
            ],
            "collocation": "lessons based on memorising"
          },
          {
            "word": "encourage",
            "meaningVi": "khuyến khích",
            "synonyms": [
              "motivate",
              "promote"
            ],
            "collocation": "encourage discussion"
          }
        ],
        "altDirectionVi": "Nói rằng về bản chất, giáo viên giỏi vẫn giống nhau qua các thế hệ."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think teachers should be paid more?",
        "hintVi": "Nêu quan điểm và một lý do về trách nhiệm."
      },
      {
        "q": "What makes a good teacher, in your opinion?",
        "hintVi": "Nêu 2 phẩm chất và một ví dụ."
      },
      {
        "q": "Would you prefer to learn from a teacher or from online videos?",
        "hintVi": "Chọn một và nêu ưu nhược điểm."
      }
    ],
    "id": "p1-25"
  },
  {
    "no": 26,
    "topic": "Social Media",
    "topicVi": "Mạng xã hội",
    "section": "specific",
    "ideasVi": [
      "Nói về việc bạn bè và gia đình có dùng mạng xã hội không.",
      "Nêu bạn có dùng quá nhiều không và bạn bắt đầu dùng từ khi nào."
    ],
    "questions": [
      {
        "n": 1,
        "q": "Do your friends and family use social media?",
        "qVi": "Bạn bè và gia đình bạn có dùng mạng xã hội không?",
        "paraphrase": "Are your friends and family active on social media?",
        "sampleAnswer": "Almost everyone I know is on it. My parents mainly use it to share family photos, while my friends use it to keep up with news and plans. It's become the main way we stay connected, especially with relatives living abroad.",
        "vocab": [
          {
            "word": "keep up with",
            "meaningVi": "theo dõi, cập nhật",
            "synonyms": [
              "follow",
              "stay updated on"
            ],
            "collocation": "keep up with news"
          },
          {
            "word": "relatives",
            "meaningVi": "người thân",
            "synonyms": [
              "family members",
              "kin"
            ],
            "collocation": "relatives living abroad"
          }
        ],
        "altDirectionVi": "Nói rằng gia đình bạn ít dùng và chủ yếu trò chuyện qua điện thoại."
      },
      {
        "n": 2,
        "q": "Do you spend too much time on social media?",
        "qVi": "Bạn có dành quá nhiều thời gian cho mạng xã hội không?",
        "paraphrase": "Would you say you spend too much time on social media?",
        "sampleAnswer": "Sometimes, yes. I'll open an app to check one thing and look up twenty minutes later. I've started setting screen-time limits, which has helped me notice how much I'm really using it.",
        "vocab": [
          {
            "word": "look up",
            "meaningVi": "bỗng nhìn lên, phát hiện thời gian đã trôi qua",
            "synonyms": [
              "realise",
              "notice"
            ],
            "collocation": "look up twenty minutes later"
          },
          {
            "word": "screen-time limit",
            "meaningVi": "giới hạn thời gian dùng màn hình",
            "synonyms": [
              "usage cap",
              "digital limit"
            ],
            "collocation": "set screen-time limits"
          }
        ],
        "altDirectionVi": "Nói rằng bạn dùng vừa phải và ít khi lướt lâu."
      },
      {
        "n": 3,
        "q": "When did you start using social media?",
        "qVi": "Bạn bắt đầu dùng mạng xã hội từ khi nào?",
        "paraphrase": "At what age did you first start using social media?",
        "sampleAnswer": "I joined my first platform when I was around fifteen, mostly because my classmates were all on it. At first it was just a way to chat, but over time it became a daily habit that I'm still trying to manage.",
        "vocab": [
          {
            "word": "platform",
            "meaningVi": "nền tảng",
            "synonyms": [
              "app",
              "network"
            ],
            "collocation": "join a platform"
          },
          {
            "word": "manage",
            "meaningVi": "kiểm soát, quản lý",
            "synonyms": [
              "control",
              "regulate"
            ],
            "collocation": "manage a habit"
          }
        ],
        "altDirectionVi": "Nói rằng bạn bắt đầu muộn, khi đi làm."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think social media has a positive effect on young people?",
        "hintVi": "Nêu một mặt tích cực và một mặt tiêu cực."
      },
      {
        "q": "Have you ever taken a break from social media?",
        "hintVi": "Kể một lần nghỉ và kết quả."
      },
      {
        "q": "Do you think social media has changed how friends communicate?",
        "hintVi": "So sánh gặp mặt với nhắn tin."
      }
    ],
    "id": "p1-26"
  },
  {
    "no": 27,
    "topic": "Cars",
    "topicVi": "Ô tô",
    "section": "specific",
    "ideasVi": [
      "Nói bạn thích làm tài xế hay hành khách và lý do.",
      "Nêu tình trạng giao thông ở thành phố và quan điểm về xe đắt tiền."
    ],
    "questions": [
      {
        "n": 1,
        "q": "Would you like to be the driver or the passenger?",
        "qVi": "Bạn thích làm tài xế hay hành khách hơn?",
        "paraphrase": "Do you prefer driving or being driven?",
        "sampleAnswer": "I'd rather be the passenger, honestly. I can relax, look out of the window and listen to music. Driving in heavy traffic can be stressful, so I'm happy to let someone else take the wheel.",
        "vocab": [
          {
            "word": "take the wheel",
            "meaningVi": "cầm lái",
            "synonyms": [
              "get behind the wheel",
              "drive"
            ],
            "collocation": "let someone take the wheel"
          },
          {
            "word": "stressful",
            "meaningVi": "căng thẳng",
            "synonyms": [
              "nerve-racking",
              "tense"
            ],
            "collocation": "stressful traffic"
          }
        ],
        "altDirectionVi": "Nói rằng bạn thích lái xe vì thấy tự do và chủ động."
      },
      {
        "n": 2,
        "q": "Is there a lot of traffic on the roads in your city?",
        "qVi": "Giao thông trong thành phố bạn có đông không?",
        "paraphrase": "Would you describe traffic in your city as heavy?",
        "sampleAnswer": "Very heavy, especially during rush hour. The roads are packed with motorbikes and cars, and a short trip can take forty minutes. The city is working on new routes, but it's still a daily frustration for most people.",
        "vocab": [
          {
            "word": "packed",
            "meaningVi": "đông nghịt",
            "synonyms": [
              "crowded",
              "congested"
            ],
            "collocation": "packed with traffic"
          },
          {
            "word": "rush hour",
            "meaningVi": "giờ cao điểm",
            "synonyms": [
              "peak hours",
              "the commute"
            ],
            "collocation": "during rush hour"
          }
        ],
        "altDirectionVi": "Nói về giao thông ở thị trấn nhỏ, ít xe hơn nhưng đường xấu."
      },
      {
        "n": 3,
        "q": "Do you want to own a very expensive car?",
        "qVi": "Bạn có muốn sở hữu một chiếc xe rất đắt tiền không?",
        "paraphrase": "Would you like to own an expensive luxury car?",
        "sampleAnswer": "Not really. I'd appreciate it, but I don't think it's a good use of money, especially when you consider maintenance and insurance. I'd rather spend on experiences, like travel, than on something that loses value every year.",
        "vocab": [
          {
            "word": "maintenance",
            "meaningVi": "chi phí bảo dưỡng",
            "synonyms": [
              "upkeep",
              "servicing"
            ],
            "collocation": "maintenance costs"
          },
          {
            "word": "lose value",
            "meaningVi": "mất giá trị",
            "synonyms": [
              "depreciate",
              "decline in worth"
            ],
            "collocation": "lose value every year"
          }
        ],
        "altDirectionVi": "Nói rằng bạn sẽ muốn một chiếc xe đắt tiền nếu có đủ điều kiện."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think people in your country rely too much on cars?",
        "hintVi": "Nêu quan điểm và một lựa chọn thay thế như xe buýt."
      },
      {
        "q": "Would you like to learn to drive?",
        "hintVi": "Trả lời rõ và nêu lý do."
      },
      {
        "q": "What is the most popular type of vehicle in your country?",
        "hintVi": "Nêu loại xe và lý do phổ biến."
      }
    ],
    "id": "p1-27"
  },
  {
    "no": 28,
    "topic": "Clothes",
    "topicVi": "Quần áo",
    "section": "specific",
    "ideasVi": [
      "Nói loại quần áo bạn hay mặc và vì sao.",
      "So sánh trang phục ngày thường và cuối tuần."
    ],
    "questions": [
      {
        "n": 1,
        "q": "What kind of clothes do you like to wear?",
        "qVi": "Bạn thích mặc loại quần áo nào?",
        "paraphrase": "What style of clothing tends to be your go-to?",
        "sampleAnswer": "I lean towards simple, comfortable clothes, like plain T-shirts, jeans and a light jacket. I like neutral colours because they're easy to mix and match, and I'd rather invest in a few good pieces than buy lots of cheap ones.",
        "vocab": [
          {
            "word": "lean towards",
            "meaningVi": "nghiêng về, ưa chuộng",
            "synonyms": [
              "gravitate towards",
              "prefer"
            ],
            "collocation": "lean towards simple styles"
          },
          {
            "word": "mix and match",
            "meaningVi": "phối đồ linh hoạt",
            "synonyms": [
              "coordinate",
              "pair together"
            ],
            "collocation": "easy to mix and match"
          }
        ],
        "altDirectionVi": "Nói rằng bạn thích phong cách sáng màu, nổi bật."
      },
      {
        "n": 2,
        "q": "Do you wear different clothes on the weekend?",
        "qVi": "Bạn có mặc quần áo khác vào cuối tuần không?",
        "paraphrase": "Do you dress differently on weekends compared to weekdays?",
        "sampleAnswer": "Yes, quite a bit. On weekdays I dress smartly for work, but at the weekend I'm much more relaxed. I'll wear something casual, like a hoodie and sneakers, especially if I'm meeting friends for coffee or going out.",
        "vocab": [
          {
            "word": "dress smartly",
            "meaningVi": "ăn mặc chỉn chu",
            "synonyms": [
              "dress neatly",
              "look presentable"
            ],
            "collocation": "dress smartly for work"
          },
          {
            "word": "casual",
            "meaningVi": "thoải mái, không trang trọng",
            "synonyms": [
              "laid-back",
              "relaxed"
            ],
            "collocation": "casual clothing"
          }
        ],
        "altDirectionVi": "Nói rằng bạn ăn mặc giống nhau mọi ngày vì tiện."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think people spend too much money on clothes?",
        "hintVi": "Nêu quan điểm và một ví dụ về thời trang nhanh."
      },
      {
        "q": "Do young people in your country follow fashion trends?",
        "hintVi": "Nêu một xu hướng cụ thể."
      },
      {
        "q": "Is there any clothing item you cannot live without?",
        "hintVi": "Kể món đồ và lý do bạn yêu thích."
      }
    ],
    "id": "p1-28"
  },
  {
    "no": 29,
    "topic": "Shopping",
    "topicVi": "Mua sắm",
    "section": "specific",
    "ideasVi": [
      "Nói bạn có hay đi mua sắm không, và bạn thường mua gì.",
      "So sánh mua online và mua trực tiếp, cùng cách bạn so giá."
    ],
    "questions": [
      {
        "n": 1,
        "q": "Do you often go shopping?",
        "qVi": "Bạn có thường đi mua sắm không?",
        "paraphrase": "How often do you make trips to the shops?",
        "sampleAnswer": "Not very often, to be honest. I usually shop once a week for groceries and household items, and I only buy clothes when I really need them. I find long shopping trips quite tiring.",
        "vocab": [
          {
            "word": "grocery",
            "meaningVi": "thực phẩm, đồ tạp hoá",
            "synonyms": [
              "provisions",
              "food shopping"
            ],
            "collocation": "buy groceries"
          },
          {
            "word": "tiring",
            "meaningVi": "mệt mỏi",
            "synonyms": [
              "exhausting",
              "draining"
            ],
            "collocation": "find something tiring"
          }
        ],
        "altDirectionVi": "Nói rằng bạn thích đi mua sắm cùng bạn bè như một hoạt động thư giãn."
      },
      {
        "n": 2,
        "q": "Do you prefer online or offline shopping?",
        "qVi": "Bạn thích mua sắm trực tuyến hay trực tiếp?",
        "paraphrase": "Do you lean more towards online shopping or in-store shopping?",
        "sampleAnswer": "I mostly shop online now, because it's convenient and I can compare options quickly. But for clothes and shoes, I prefer going to a shop, because I like trying things on before I buy them.",
        "vocab": [
          {
            "word": "try on",
            "meaningVi": "thử (quần áo)",
            "synonyms": [
              "fit",
              "test out"
            ],
            "collocation": "try something on"
          },
          {
            "word": "compare options",
            "meaningVi": "so sánh các lựa chọn",
            "synonyms": [
              "weigh up options",
              "evaluate choices"
            ],
            "collocation": "compare options quickly"
          }
        ],
        "altDirectionVi": "Nói rằng bạn thích mua trực tiếp để cảm nhận chất liệu và tránh hàng giả."
      },
      {
        "n": 3,
        "q": "Do you compare prices before making a purchase?",
        "qVi": "Trước khi mua, bạn có so sánh giá không?",
        "paraphrase": "Do you usually check prices before you purchase something?",
        "sampleAnswer": "Always, for anything over a certain amount. I'll check two or three sites and look for discount codes. It's not always worth the effort, but over time it adds up to a real saving.",
        "vocab": [
          {
            "word": "discount code",
            "meaningVi": "mã giảm giá",
            "synonyms": [
              "voucher",
              "promo code"
            ],
            "collocation": "look for discount codes"
          },
          {
            "word": "adds up",
            "meaningVi": "cộng dồn lại thành",
            "synonyms": [
              "accumulates",
              "mounts up"
            ],
            "collocation": "it adds up to a saving"
          }
        ],
        "altDirectionVi": "Nói rằng bạn ít khi so giá vì thích mua nhanh món mình cần."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think shopping malls will disappear in the future?",
        "hintVi": "Nêu quan điểm và một lý do về trải nghiệm trực tiếp."
      },
      {
        "q": "Do you think people buy things they don't need?",
        "hintVi": "Nêu quan điểm và một ví dụ."
      },
      {
        "q": "What is the last thing you bought online?",
        "hintVi": "Kể món đồ và cảm nhận."
      }
    ],
    "id": "p1-29"
  },
  {
    "no": 30,
    "topic": "Space Travel",
    "topicVi": "Du hành vũ trụ",
    "section": "specific",
    "ideasVi": [
      "Nói bạn có học về vũ trụ ở trường không và có hứng thú không.",
      "Nêu bạn có muốn đi vào không gian không, và vì sao."
    ],
    "questions": [
      {
        "n": 1,
        "q": "Have you ever learnt anything about space and the stars at school?",
        "qVi": "Bạn đã từng học về không gian và các vì sao ở trường chưa?",
        "paraphrase": "Did your school lessons cover space and the stars?",
        "sampleAnswer": "Yes, briefly. We learned about the planets and the solar system, and I remember being fascinated by the idea that the sun is a star. The lessons were short, but they made me want to learn more on my own.",
        "vocab": [
          {
            "word": "fascinated by",
            "meaningVi": "bị cuốn hút bởi",
            "synonyms": [
              "captivated by",
              "intrigued by"
            ],
            "collocation": "be fascinated by space"
          },
          {
            "word": "on my own",
            "meaningVi": "tự mình",
            "synonyms": [
              "independently",
              "by myself"
            ],
            "collocation": "learn on my own"
          }
        ],
        "altDirectionVi": "Nói rằng bạn học rất sâu về thiên văn ở trường chuyên."
      },
      {
        "n": 2,
        "q": "Would you like to know more about space and the stars?",
        "qVi": "Bạn có muốn tìm hiểu thêm về không gian và các vì sao không?",
        "paraphrase": "Are you keen to learn more about outer space and the stars?",
        "sampleAnswer": "Yes, very much. I'm especially interested in how telescopes have changed what we know about the universe. I've been watching documentaries and reading about recent discoveries, and I find it humbling.",
        "vocab": [
          {
            "word": "humbling",
            "meaningVi": "khiến người ta khiêm tốn",
            "synonyms": [
              "eye-opening",
              "sobering"
            ],
            "collocation": "find it humbling"
          },
          {
            "word": "recent discoveries",
            "meaningVi": "những khám phá gần đây",
            "synonyms": [
              "new findings",
              "latest breakthroughs"
            ],
            "collocation": "read about recent discoveries"
          }
        ],
        "altDirectionVi": "Nói rằng bạn thích tìm hiểu qua câu chuyện về các nhà du hành."
      },
      {
        "n": 3,
        "q": "Do you like science-fiction movies set in space?",
        "qVi": "Bạn có thích phim khoa học viễn tưởng lấy bối cảnh trong vũ trụ không?",
        "paraphrase": "Are you a fan of sci-fi films set in space?",
        "sampleAnswer": "I am, though I know they're often more fiction than fact. I enjoy the sense of wonder they create, and the visual effects are often stunning. Some of them even make me think about the future of human exploration.",
        "vocab": [
          {
            "word": "sense of wonder",
            "meaningVi": "cảm giác kinh ngạc, thán phục",
            "synonyms": [
              "awe",
              "amazement"
            ],
            "collocation": "create a sense of wonder"
          },
          {
            "word": "stunning",
            "meaningVi": "tuyệt đẹp, gây choáng ngợp",
            "synonyms": [
              "breathtaking",
              "spectacular"
            ],
            "collocation": "visually stunning"
          }
        ],
        "altDirectionVi": "Nói rằng bạn không thích phim viễn tưởng vì thấy thiếu thực tế."
      },
      {
        "n": 4,
        "q": "Do you want to go into outer space in the future?",
        "qVi": "Bạn có muốn bay vào không gian trong tương lai không?",
        "paraphrase": "Would you ever want to travel into outer space one day?",
        "sampleAnswer": "If I had the chance, absolutely. Even a short trip would be an incredible experience, especially seeing the Earth from above. I know it's expensive and risky, though, so I'd need to be sure it was safe.",
        "vocab": [
          {
            "word": "from above",
            "meaningVi": "nhìn từ trên cao",
            "synonyms": [
              "from orbit",
              "from a height"
            ],
            "collocation": "see the Earth from above"
          },
          {
            "word": "risky",
            "meaningVi": "rủi ro",
            "synonyms": [
              "dangerous",
              "hazardous"
            ],
            "collocation": "expensive and risky"
          }
        ],
        "altDirectionVi": "Nói rằng bạn không muốn đi vì sợ độ cao hoặc không gian kín."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think space exploration is worth the money?",
        "hintVi": "Nêu lợi ích khoa học và một chi phí cần cân nhắc."
      },
      {
        "q": "Should governments invest more in space research?",
        "hintVi": "Trả lời rõ và nêu một ưu tiên khác."
      },
      {
        "q": "Do you think aliens exist?",
        "hintVi": "Nêu ý kiến thận trọng và lý do."
      }
    ],
    "id": "p1-30"
  },
  {
    "no": 31,
    "topic": "Feeling Bored",
    "topicVi": "Cảm giác buồn chán",
    "section": "specific",
    "ideasVi": [
      "Nói bạn có hay buồn chán không và khi nào.",
      "Nêu những việc bạn làm để không buồn chán."
    ],
    "questions": [
      {
        "n": 1,
        "q": "Do you often feel bored?",
        "qVi": "Bạn có hay cảm thấy buồn chán không?",
        "paraphrase": "Do you find yourself getting bored quite often?",
        "sampleAnswer": "Now and then, yes, especially on slow weekday evenings. Usually it happens when my routine feels a bit predictable. I don't mind it too much, though, because boredom often pushes me to try something new.",
        "vocab": [
          {
            "word": "predictable",
            "meaningVi": "dễ đoán, lặp lại",
            "synonyms": [
              "routine",
              "monotonous"
            ],
            "collocation": "feel predictable"
          },
          {
            "word": "push someone to",
            "meaningVi": "thúc đẩy ai làm gì",
            "synonyms": [
              "motivate someone to",
              "spur someone on"
            ],
            "collocation": "boredom pushes me to try something new"
          }
        ],
        "altDirectionVi": "Nói rằng bạn hiếm khi buồn chán vì luôn có việc để làm."
      },
      {
        "n": 2,
        "q": "Did you ever find school boring when you were a child?",
        "qVi": "Khi còn đi học bạn có thấy trường học nhàm chán không?",
        "paraphrase": "Did you ever find school dull when you were growing up?",
        "sampleAnswer": "Some subjects, definitely. Maths lessons could feel endless if I didn't understand the topic. But the subjects I enjoyed, like history and drama, made the days fly by, so it really depended on the teacher.",
        "vocab": [
          {
            "word": "endless",
            "meaningVi": "dài dằng dặc, không có hồi kết",
            "synonyms": [
              "interminable",
              "never-ending"
            ],
            "collocation": "feel endless"
          },
          {
            "word": "fly by",
            "meaningVi": "trôi nhanh",
            "synonyms": [
              "pass quickly",
              "speed by"
            ],
            "collocation": "the days flew by"
          }
        ],
        "altDirectionVi": "Nói rằng trường học thú vị với bạn vì có nhiều hoạt động ngoại khoá."
      },
      {
        "n": 3,
        "q": "What sort of things do you find most boring now?",
        "qVi": "Bây giờ bạn thấy việc gì nhàm chán nhất?",
        "paraphrase": "Which activities do you find the dullest these days?",
        "sampleAnswer": "Long meetings that could have been emails, honestly. I also find waiting in queues really tedious. Anything where I'm not actively involved or learning something tends to drain my patience quickly.",
        "vocab": [
          {
            "word": "tedious",
            "meaningVi": "tẻ nhạt, mệt mỏi",
            "synonyms": [
              "monotonous",
              "mind-numbing"
            ],
            "collocation": "a tedious task"
          },
          {
            "word": "drain patience",
            "meaningVi": "làm mất kiên nhẫn",
            "synonyms": [
              "try someone's patience",
              "wear thin"
            ],
            "collocation": "drain my patience"
          }
        ],
        "altDirectionVi": "Nói về việc đi làm việc nhà hoặc trả lời quá nhiều tin nhắn."
      },
      {
        "n": 4,
        "q": "What do you do to stop yourself feeling bored?",
        "qVi": "Bạn làm gì để không cảm thấy buồn chán?",
        "paraphrase": "What do you do to keep boredom at bay?",
        "sampleAnswer": "I usually pick up a book, go for a walk or try a new recipe. If I'm really restless, I'll call a friend. Keeping a short list of things I want to try has been really helpful, because I always have an option ready.",
        "vocab": [
          {
            "word": "keep at bay",
            "meaningVi": "ngăn chặn, giữ cho không xảy ra",
            "synonyms": [
              "hold off",
              "fend off"
            ],
            "collocation": "keep boredom at bay"
          },
          {
            "word": "restless",
            "meaningVi": "bồn chồn, không yên",
            "synonyms": [
              "fidgety",
              "uneasy"
            ],
            "collocation": "feel restless"
          }
        ],
        "altDirectionVi": "Nói về một sở thích cụ thể như đọc sách hoặc học ngoại ngữ."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think boredom can be good for people?",
        "hintVi": "Nêu lợi ích như gợi sáng tạo."
      },
      {
        "q": "How do children in your country spend their time when they are bored?",
        "hintVi": "Nêu 2 hoạt động phổ biến."
      },
      {
        "q": "Do you think people use their phones too much when they are bored?",
        "hintVi": "Trả lời và nêu một ví dụ."
      }
    ],
    "id": "p1-31"
  },
  {
    "no": 32,
    "topic": "Dream and Ambition",
    "topicVi": "Ước mơ và tham vọng",
    "section": "specific",
    "ideasVi": [
      "Kể nghề mơ ước khi còn nhỏ, rồi nói về hiện tại.",
      "Nêu bạn có tham vọng không và mục tiêu sống của bạn."
    ],
    "questions": [
      {
        "n": 1,
        "q": "When you were a child, what job did you dream of doing?",
        "qVi": "Khi còn nhỏ bạn mơ ước làm nghề gì?",
        "paraphrase": "What profession did you fantasise about when you were a child?",
        "sampleAnswer": "I wanted to be an astronaut, mostly because I was obsessed with space documentaries. I'd make a cardboard helmet and pretend to explore the garden. I think I was drawn to the idea of discovering something nobody had seen before.",
        "vocab": [
          {
            "word": "fantasise about",
            "meaningVi": "mơ mộng về",
            "synonyms": [
              "dream about",
              "imagine"
            ],
            "collocation": "fantasise about a career"
          },
          {
            "word": "be drawn to",
            "meaningVi": "bị thu hút bởi",
            "synonyms": [
              "be attracted to",
              "be fascinated by"
            ],
            "collocation": "be drawn to exploration"
          }
        ],
        "altDirectionVi": "Nói về nghề bác sĩ hoặc cảnh sát vì muốn giúp người."
      },
      {
        "n": 2,
        "q": "Do you think you are an ambitious person?",
        "qVi": "Bạn có phải là người có nhiều tham vọng không?",
        "paraphrase": "Would you describe yourself as an ambitious person?",
        "sampleAnswer": "I'd say I'm ambitious in a quiet way. I like setting goals and working steadily towards them, but I'm not interested in status for its own sake. I'd rather be good at what I do than be famous for it.",
        "vocab": [
          {
            "word": "ambitious in a quiet way",
            "meaningVi": "có tham vọng một cách lặng lẽ",
            "synonyms": [
              "low-key ambitious",
              "understated"
            ],
            "collocation": "ambitious in a quiet way"
          },
          {
            "word": "status",
            "meaningVi": "địa vị, uy tín",
            "synonyms": [
              "prestige",
              "standing"
            ],
            "collocation": "care about status"
          }
        ],
        "altDirectionVi": "Nói rằng bạn có tham vọng lớn và luôn đặt mục tiêu cao."
      },
      {
        "n": 3,
        "q": "What kind of job do you want to do in the future?",
        "qVi": "Bạn muốn làm nghề gì trong tương lai?",
        "paraphrase": "What line of work are you hoping to get into in the future?",
        "sampleAnswer": "I'd like to work in education, perhaps designing learning materials or running my own training programme. I want a job where I can see people grow, and I think that would give me a real sense of purpose.",
        "vocab": [
          {
            "word": "sense of purpose",
            "meaningVi": "cảm giác có mục đích",
            "synonyms": [
              "direction",
              "meaning"
            ],
            "collocation": "give a sense of purpose"
          },
          {
            "word": "training programme",
            "meaningVi": "chương trình đào tạo",
            "synonyms": [
              "course",
              "development scheme"
            ],
            "collocation": "run a training programme"
          }
        ],
        "altDirectionVi": "Nói về công việc kinh doanh hoặc công nghệ nếu phù hợp hơn."
      },
      {
        "n": 4,
        "q": "Do you have any dreams or hopes for your life?",
        "qVi": "Bạn có ước mơ hay hy vọng nào cho cuộc đời mình không?",
        "paraphrase": "Do you have any long-term dreams or hopes for your life?",
        "sampleAnswer": "Yes, I hope to build a stable life with a family, and to travel to places I've only read about. Professionally, I want to be someone whom people trust. I think a life that's both meaningful and balanced would be enough for me.",
        "vocab": [
          {
            "word": "stable",
            "meaningVi": "ổn định",
            "synonyms": [
              "secure",
              "steady"
            ],
            "collocation": "a stable life"
          },
          {
            "word": "balanced",
            "meaningVi": "cân bằng",
            "synonyms": [
              "harmonious",
              "well-rounded"
            ],
            "collocation": "a balanced life"
          }
        ],
        "altDirectionVi": "Nói về việc giúp đỡ cộng đồng hoặc đóng góp cho xã hội."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think it is important to have a dream?",
        "hintVi": "Nêu quan điểm và lợi ích của mục tiêu dài hạn."
      },
      {
        "q": "Do you think young people today are more ambitious than before?",
        "hintVi": "So sánh và đưa ra lý do."
      },
      {
        "q": "What would you do if you didn't have to work?",
        "hintVi": "Nêu 2 việc bạn muốn làm và lý do."
      }
    ],
    "id": "p1-32"
  },
  {
    "no": 33,
    "topic": "Talking to Elderly People",
    "topicVi": "Nói chuyện với người lớn tuổi",
    "section": "specific",
    "ideasVi": [
      "Nói bạn có hay trò chuyện với người lớn tuổi không.",
      "Nêu cảm nhận của bạn về việc già đi."
    ],
    "questions": [
      {
        "n": 1,
        "q": "Do you often talk to elderly people?",
        "qVi": "Bạn có hay nói chuyện với người lớn tuổi không?",
        "paraphrase": "How often do you have conversations with senior citizens?",
        "sampleAnswer": "Quite often, actually. My grandparents live nearby, so I visit them every week, and I also chat with older neighbours when I'm out walking. I've learned a lot from those conversations, especially about how life used to be.",
        "vocab": [
          {
            "word": "senior citizen",
            "meaningVi": "người cao tuổi",
            "synonyms": [
              "elderly person",
              "older adult"
            ],
            "collocation": "senior citizens in the community"
          },
          {
            "word": "used to be",
            "meaningVi": "ngày xưa là",
            "synonyms": [
              "in the past",
              "back then"
            ],
            "collocation": "how life used to be"
          }
        ],
        "altDirectionVi": "Nói rằng bạn ít gặp người lớn tuổi vì họ sống xa."
      },
      {
        "n": 2,
        "q": "Do you enjoy spending time with elderly people?",
        "qVi": "Bạn có thích dành thời gian với người lớn tuổi không?",
        "paraphrase": "Do you enjoy spending time in the company of older people?",
        "sampleAnswer": "I do, very much. They often have a calm perspective and wonderful stories. Sometimes they remind me to slow down and appreciate small things, which I find really valuable.",
        "vocab": [
          {
            "word": "perspective",
            "meaningVi": "góc nhìn, quan điểm",
            "synonyms": [
              "viewpoint",
              "outlook"
            ],
            "collocation": "a calm perspective"
          },
          {
            "word": "appreciate",
            "meaningVi": "trân trọng",
            "synonyms": [
              "value",
              "cherish"
            ],
            "collocation": "appreciate small things"
          }
        ],
        "altDirectionVi": "Nói về việc trò chuyện với ông bà qua điện thoại khi đi làm xa."
      },
      {
        "n": 3,
        "q": "How do you feel about getting old?",
        "qVi": "Bạn cảm thấy thế nào về việc già đi?",
        "paraphrase": "What are your feelings about growing older?",
        "sampleAnswer": "Mixed, to be honest. I worry about my health and losing some of my energy, but I also look forward to having more wisdom and time for the things I care about. I think it's all about how you approach it.",
        "vocab": [
          {
            "word": "look forward to",
            "meaningVi": "mong chờ",
            "synonyms": [
              "anticipate",
              "be excited about"
            ],
            "collocation": "look forward to retirement"
          },
          {
            "word": "approach",
            "meaningVi": "cách tiếp cận",
            "synonyms": [
              "attitude",
              "mindset"
            ],
            "collocation": "approach ageing positively"
          }
        ],
        "altDirectionVi": "Nói rằng bạn thấy tích cực và muốn sống khoẻ để già đi tốt."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think young people should look after their elderly parents?",
        "hintVi": "Nêu quan điểm về trách nhiệm gia đình."
      },
      {
        "q": "What can young people learn from older people?",
        "hintVi": "Nêu 1-2 bài học cụ thể."
      },
      {
        "q": "How are elderly people treated in your country?",
        "hintVi": "Nêu nhận xét chung và một ví dụ."
      }
    ],
    "id": "p1-33"
  },
  {
    "no": 34,
    "topic": "Mirrors",
    "topicVi": "Gương",
    "section": "specific",
    "ideasVi": [
      "Nói bạn có hay soi gương không và trong hoàn cảnh nào.",
      "Nêu cách bạn dùng gương ở nhà hoặc khi đi ra ngoài."
    ],
    "questions": [
      {
        "n": 1,
        "q": "Do you like looking at yourself in the mirror?",
        "qVi": "Bạn có thích nhìn mình trong gương không?",
        "paraphrase": "Do you tend to check yourself in the mirror often?",
        "sampleAnswer": "Only in passing, to be honest. I'll glance in the mirror before going out to make sure I look presentable, but I don't linger. I'm more comfortable focusing on how I feel than how I look.",
        "vocab": [
          {
            "word": "in passing",
            "meaningVi": "thoáng qua",
            "synonyms": [
              "briefly",
              "momentarily"
            ],
            "collocation": "only in passing"
          },
          {
            "word": "linger",
            "meaningVi": "lưu lại lâu, lâu không rời",
            "synonyms": [
              "dwell",
              "stay"
            ],
            "collocation": "don't linger"
          }
        ],
        "altDirectionVi": "Nói rằng bạn hay soi gương khi chuẩn bị đi làm hoặc đi gặp người quan trọng."
      },
      {
        "n": 2,
        "q": "Have you ever bought mirrors?",
        "qVi": "Bạn đã bao giờ mua gương chưa?",
        "paraphrase": "Have you ever purchased a mirror for your home?",
        "sampleAnswer": "Yes, I bought a large round mirror for my hallway a while ago. It makes the space look brighter and more open, and it's also handy when I'm getting ready in the morning.",
        "vocab": [
          {
            "word": "handy",
            "meaningVi": "tiện lợi",
            "synonyms": [
              "useful",
              "convenient"
            ],
            "collocation": "come in handy"
          },
          {
            "word": "make the space look",
            "meaningVi": "làm không gian trông",
            "synonyms": [
              "make the room appear",
              "give the impression of"
            ],
            "collocation": "make the space look bigger"
          }
        ],
        "altDirectionVi": "Nói rằng bạn được tặng một chiếc gương và giữ gìn nó cẩn thận."
      },
      {
        "n": 3,
        "q": "Do you usually take a mirror with you?",
        "qVi": "Bạn có thường mang theo gương bên người không?",
        "paraphrase": "Do you carry a small mirror with you when you go out?",
        "sampleAnswer": "Not usually, but my phone has a camera, so I use the screen as a mirror when I need to check something. I think a compact mirror is handy for some people, though, especially those who wear a lot of makeup.",
        "vocab": [
          {
            "word": "compact",
            "meaningVi": "gọn nhẹ",
            "synonyms": [
              "pocket-sized",
              "portable"
            ],
            "collocation": "a compact mirror"
          },
          {
            "word": "wear makeup",
            "meaningVi": "trang điểm",
            "synonyms": [
              "apply makeup",
              "put on makeup"
            ],
            "collocation": "wear a lot of makeup"
          }
        ],
        "altDirectionVi": "Nói rằng bạn thường mang gương bỏ túi vì tiện khi đi ra ngoài."
      },
      {
        "n": 4,
        "q": "Would you use mirrors to decorate your room?",
        "qVi": "Bạn có muốn dùng gương để trang trí phòng không?",
        "paraphrase": "Would you consider using mirrors as decoration in your room?",
        "sampleAnswer": "Yes, I think they can be really effective. A mirror opposite a window reflects light and makes a small room feel larger. I'd choose a frame that matches the furniture so it looks like part of the design.",
        "vocab": [
          {
            "word": "reflect",
            "meaningVi": "phản chiếu",
            "synonyms": [
              "bounce back",
              "mirror"
            ],
            "collocation": "reflect light"
          },
          {
            "word": "match",
            "meaningVi": "hợp với, đồng bộ với",
            "synonyms": [
              "complement",
              "coordinate with"
            ],
            "collocation": "match the furniture"
          }
        ],
        "altDirectionVi": "Nói rằng bạn thích trang trí bằng tranh hoặc cây xanh hơn gương."
      }
    ],
    "extraQuestions": [
      {
        "q": "Do you think people spend too much time looking at themselves?",
        "hintVi": "Nêu quan điểm và một lý do về mạng xã hội."
      },
      {
        "q": "Do you think it is important to have a good self-image?",
        "hintVi": "Trả lời và nêu một lợi ích về tự tin."
      },
      {
        "q": "Are selfies popular in your country?",
        "hintVi": "Nêu xu hướng và một ví dụ cụ thể."
      }
    ],
    "id": "p1-34"
  }
];
