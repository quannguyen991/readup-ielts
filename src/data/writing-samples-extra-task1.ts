import type { WritingSample } from '@/data/writing-samples';

type ParagraphSeed = Pick<WritingSample['paragraphs'][number], 'en' | 'vi' | 'focusVi'>;
type Task1Seed = Omit<WritingSample, 'task' | 'paragraphs'> & {
  paragraphs: [ParagraphSeed, ParagraphSeed, ParagraphSeed, ParagraphSeed];
};

const sections = ['introduction', 'overview', 'body1', 'body2'] as const;

function task1(seed: Task1Seed): WritingSample {
  return {
    ...seed,
    task: 'ielts_task1',
    paragraphs: seed.paragraphs.map((paragraph, index) => ({
      id: `${seed.id}-p${index + 1}`,
      section: sections[index]!,
      ...paragraph,
    })),
  };
}

export const WRITING_SAMPLES_EXTRA_TASK1: WritingSample[] = [
  task1({
    id: 'sample-t1-extra-internet-access', topicSlug: 'technology', topicEn: 'Technology', topicVi: 'Công nghệ',
    title: 'Household internet access', promptId: 'w-t1-line-internet-access', chartKind: 'line', band: 8.0,
    promptText: 'The line graph below shows the percentage of households with internet access in three countries, 2005–2020.',
    paragraphs: [
      { en: 'The line graph compares the proportions of households with internet access in Japan, Brazil and Kenya at four points between 2005 and 2020.', vi: 'Biểu đồ đường so sánh tỷ lệ hộ gia đình có kết nối internet tại Nhật Bản, Brazil và Kenya ở bốn mốc từ năm 2005 đến năm 2020.', focusVi: 'Mở bài nêu đối tượng, địa điểm, đơn vị và giai đoạn.' },
      { en: 'Overall, access rose sharply in Japan but fell by a similar extent in Brazil, so the two countries exchanged positions. Kenya, by contrast, remained close to the mid-forties throughout. Japan finished with the highest figure, while Brazil had the lowest.', vi: 'Nhìn chung, tỷ lệ tiếp cận tăng mạnh ở Nhật Bản nhưng giảm với mức độ tương tự tại Brazil, khiến hai nước đổi vị trí. Ngược lại, Kenya duy trì quanh mức giữa 40% trong toàn kỳ. Nhật Bản kết thúc với số liệu cao nhất, còn Brazil thấp nhất.', focusVi: 'Overview tóm tắt hai xu hướng trái chiều, nhóm ổn định và thứ hạng cuối.' },
      { en: 'In 2005, Brazil led at 80%, whereas the figure for Japan was only 14%. Japan then climbed steadily, reaching 34% in 2010 and 58% in 2015 before ending at 79%. Brazil moved in the opposite direction: its rate dropped to 58% and then 36% at those two intermediate points, before falling further to 13% in 2020.', vi: 'Năm 2005, Brazil dẫn đầu với 80%, trong khi tỷ lệ tại Nhật Bản chỉ là 14%. Sau đó, Nhật Bản tăng đều, đạt 34% năm 2010 và 58% năm 2015 trước khi kết thúc ở mức 79%. Brazil diễn biến theo chiều ngược lại: tỷ lệ giảm xuống 58% rồi 36% ở hai mốc giữa, trước khi tiếp tục xuống 13% vào năm 2020.', focusVi: 'Thân bài 1 trình bày đầy đủ các mốc của hai đường biến động mạnh.' },
      { en: 'Kenya recorded 46% in 2005 and edged up to 47% five years later. The share then slipped slightly to 45% in 2015 and stayed at that level in 2020. Thus, Japan moved from well below Kenya to a position above it by 2015, while Brazil also crossed below the Kenyan figure during the period. The graph shows changes in access, but not their causes.', vi: 'Kenya ghi nhận 46% vào năm 2005 và nhích lên 47% sau đó năm năm. Tỷ lệ này giảm nhẹ còn 45% vào năm 2015 và giữ nguyên mức đó vào năm 2020. Vì vậy, Nhật Bản chuyển từ vị trí thấp hơn nhiều so với Kenya sang cao hơn vào năm 2015, còn Brazil cũng giảm xuống dưới mức của Kenya trong kỳ. Biểu đồ cho thấy thay đổi về khả năng tiếp cận nhưng không nêu nguyên nhân.', focusVi: 'Thân bài 2 mô tả đường ổn định và các lần vượt nhau, tránh suy đoán nguyên nhân.' },
    ],
    vocabulary: [
      { phrase: 'exchanged positions', meaningVi: 'đổi vị trí/thứ hạng cho nhau', noteVi: 'Dùng khi thứ hạng đầu và cuối kỳ đảo ngược.' },
      { phrase: 'climbed steadily', meaningVi: 'tăng đều đặn', noteVi: 'Cụm động từ tự nhiên cho xu hướng tăng liên tục.' },
      { phrase: 'edged up', meaningVi: 'nhích lên', noteVi: 'Diễn tả một mức tăng nhỏ.' },
    ],
  }),
  task1({
    id: 'sample-t1-extra-renewable-share', topicSlug: 'environment', topicEn: 'Environment', topicVi: 'Môi trường',
    title: 'Renewable electricity shares', promptId: 'w-t1-line-renewable-share', chartKind: 'line', band: 8.0,
    promptText: 'The line graph below shows the share of renewable energy in electricity generation in three countries, 2000–2020.',
    paragraphs: [
      { en: 'The line graph illustrates the proportion of electricity generated from renewable energy in Denmark, Germany and Chile over the period from 2000 to 2020.', vi: 'Biểu đồ đường minh hoạ tỷ trọng điện được sản xuất từ năng lượng tái tạo tại Đan Mạch, Đức và Chile trong giai đoạn 2000–2020.', focusVi: 'Mở bài diễn đạt lại biểu đồ, các quốc gia và mốc thời gian.' },
      { en: 'Overall, Denmark experienced a substantial rise, whereas Germany saw a comparably steep decline. Chile’s share changed very little. The Danish and German figures met at 28% in 2010, before Denmark pulled ahead; by 2020, Germany had the smallest proportion.', vi: 'Nhìn chung, Đan Mạch tăng đáng kể, trong khi Đức giảm mạnh ở mức tương đương. Tỷ trọng của Chile thay đổi rất ít. Số liệu của Đan Mạch và Đức gặp nhau ở mức 28% vào năm 2010, trước khi Đan Mạch vượt lên; đến năm 2020, Đức có tỷ trọng thấp nhất.', focusVi: 'Overview chọn xu hướng chính, điểm giao nhau và vị trí cuối kỳ.' },
      { en: 'Denmark began with just 8% in 2000, the lowest starting value, but rose at each subsequent point: 19% in 2005, 28% in 2010, 39% in 2015 and 48% in 2020. Germany followed the reverse pattern. Its share fell from 50% initially to 40% in 2005, then reached 28% in 2010 and continued down to 19% and 8% in the final two years shown.', vi: 'Đan Mạch bắt đầu ở mức chỉ 8% năm 2000, thấp nhất lúc đầu, nhưng tăng tại từng mốc tiếp theo: 19% năm 2005, 28% năm 2010, 39% năm 2015 và 48% năm 2020. Đức đi theo quy luật ngược lại. Tỷ trọng giảm từ 50% ban đầu xuống 40% năm 2005, rồi đạt 28% vào năm 2010 và tiếp tục giảm còn 19% và 8% ở hai mốc cuối.', focusVi: 'Thân bài 1 đối chiếu hai đường biến động lớn bằng các số liệu chính.' },
      { en: 'Chile, in contrast, remained near 30% throughout. Its figure was 29% in 2000, reached 30% in 2005, returned to 29% in 2010, and rose to 30% in 2015 before ending at 28%. Consequently, it started between Germany and Denmark and occupied the middle position at the end as well, despite the wide gap that had opened between the other two countries.', vi: 'Ngược lại, Chile duy trì quanh mức 30% trong toàn kỳ. Số liệu là 29% năm 2000, đạt 30% năm 2005, trở lại 29% năm 2010, tăng lên 30% năm 2015 rồi kết thúc ở mức 28%. Do đó, Chile bắt đầu ở giữa Đức và Đan Mạch và vẫn ở vị trí trung gian khi kết thúc, dù khoảng cách giữa hai nước còn lại đã nới rộng đáng kể.', focusVi: 'Thân bài 2 nêu dao động nhỏ và vị trí tương đối của Chile.' },
    ],
    vocabulary: [
      { phrase: 'the reverse pattern', meaningVi: 'quy luật ngược lại', noteVi: 'Dùng để tránh lặp lại toàn bộ phần mô tả xu hướng.' },
      { phrase: 'at each subsequent point', meaningVi: 'ở mỗi mốc tiếp theo', noteVi: 'Cụm chỉ xu hướng nhất quán qua các mốc.' },
      { phrase: 'occupied the middle position', meaningVi: 'giữ vị trí ở giữa', noteVi: 'Mô tả thứ hạng tương đối trong nhóm.' },
    ],
  }),
  task1({
    id: 'sample-t1-extra-tourist-arrivals', topicSlug: 'society', topicEn: 'Society', topicVi: 'Xã hội',
    title: 'International tourist arrivals', promptId: 'w-t1-line-tourist-arrivals', chartKind: 'line', band: 8.0,
    promptText: 'The line graph below shows the number of international tourist arrivals in three cities, 2010–2019.',
    paragraphs: [
      { en: 'The line graph compares international tourist arrivals in Lisbon, Bangkok and Nairobi from 2010 to 2019, in millions.', vi: 'Biểu đồ đường so sánh lượng khách du lịch quốc tế đến Lisbon, Bangkok và Nairobi từ năm 2010 đến năm 2019, tính bằng triệu lượt.', focusVi: 'Mở bài nêu các thành phố, đối tượng đo, đơn vị và giai đoạn.' },
      { en: 'Overall, Lisbon’s arrivals rose strongly, while Bangkok moved in the opposite direction and ended at the lowest level. Nairobi’s total was comparatively stable, fluctuating around 15–16 million. Lisbon therefore went from the least visited of the three cities to the most popular by the final year shown.', vi: 'Nhìn chung, lượng khách đến Lisbon tăng mạnh, trong khi Bangkok đi theo chiều ngược lại và kết thúc ở mức thấp nhất. Tổng lượng khách của Nairobi tương đối ổn định, dao động quanh 15–16 triệu. Vì vậy, Lisbon chuyển từ thành phố ít khách nhất trong ba nơi thành nơi đông khách nhất vào năm cuối được thể hiện.', focusVi: 'Overview nêu hai xu hướng trái chiều, đường ổn định và sự đảo hạng.' },
      { en: 'Lisbon received 5 million visitors in 2010, against Bangkok’s 27 million. Its figure rose to 13 million in 2013, 18 million in 2016 and 27 million in 2019. Bangkok fell at each point, to 19 million in 2013, 13 million in 2016 and just 5 million in 2019.', vi: 'Lisbon đón 5 triệu lượt khách năm 2010, so với 27 triệu ở Bangkok. Số liệu của Lisbon tăng lên 13 triệu năm 2013, 18 triệu năm 2016 và 27 triệu năm 2019. Bangkok giảm ở từng mốc, xuống 19 triệu năm 2013, 13 triệu năm 2016 và chỉ còn 5 triệu vào năm 2019.', focusVi: 'Thân bài 1 theo dõi hai đường tăng và giảm qua từng mốc.' },
      { en: 'Nairobi attracted 16 million tourists in 2010, between Bangkok and Lisbon. Its total slipped to 15 million in 2013, returned to 16 million in 2016 and ended at 15 million. The range across the period was only one million. By 2019, Lisbon led Nairobi by 12 million, and Bangkok had fallen 22 million from its initial figure.', vi: 'Nairobi thu hút 16 triệu khách du lịch năm 2010, ở giữa Bangkok và Lisbon. Tổng lượng khách giảm xuống 15 triệu năm 2013, trở lại 16 triệu năm 2016 và kết thúc ở mức 15 triệu. Biên độ trong toàn kỳ chỉ là một triệu. Đến năm 2019, Lisbon dẫn trước Nairobi 12 triệu, còn Bangkok giảm 22 triệu so với mức ban đầu.', focusVi: 'Thân bài 2 mô tả biến động nhỏ của Nairobi và tổng hợp chênh lệch cuối kỳ.' },
    ],
    vocabulary: [
      { phrase: 'at every observation', meaningVi: 'ở mọi mốc quan sát', noteVi: 'Dùng khi xu hướng nhất quán tại toàn bộ điểm dữ liệu.' },
      { phrase: 'continued climbing', meaningVi: 'tiếp tục tăng', noteVi: 'Cụm động từ gọn cho đà tăng kéo dài.' },
      { phrase: 'widened to', meaningVi: 'nới rộng thành/mức', noteVi: 'Diễn tả khoảng cách giữa hai số liệu tăng lên.' },
    ],
  }),
  task1({
    id: 'sample-t1-extra-subject-choice', topicSlug: 'education', topicEn: 'Education', topicVi: 'Giáo dục',
    title: 'Subject choices at two universities', promptId: 'w-t1-bar-subject-choice', chartKind: 'bar', band: 8.0,
    promptText: 'The bar chart below shows the percentage of students choosing four subjects at two universities.',
    paragraphs: [
      { en: 'The bar chart compares the percentages of students choosing Science, Arts, Business and Engineering at University A and University B.', vi: 'Biểu đồ cột so sánh tỷ lệ sinh viên chọn Khoa học, Nghệ thuật, Kinh doanh và Kỹ thuật tại Đại học A và Đại học B.', focusVi: 'Mở bài nêu hai trường và bốn ngành được so sánh.' },
      { en: 'Overall, the universities showed contrasting subject preferences. University A had its smallest proportion in Science and its largest in Engineering, while University B displayed the reverse pattern. The figures for the two institutions were closest in Arts, whereas the greatest gap appeared in Engineering.', vi: 'Nhìn chung, hai trường có lựa chọn ngành học trái ngược. Đại học A có tỷ lệ thấp nhất ở Khoa học và cao nhất ở Kỹ thuật, còn Đại học B thể hiện quy luật ngược lại. Số liệu của hai trường gần nhau nhất ở Nghệ thuật, trong khi chênh lệch lớn nhất xuất hiện ở Kỹ thuật.', focusVi: 'Overview tổng hợp thứ hạng nổi bật, xu hướng đối lập và khoảng cách lớn/nhỏ.' },
      { en: 'At University A, 7% of students chose Science, compared with 18% for Arts and 33% for Business. Engineering was the most popular subject there, at 48%. This represents a steady progression across the four categories, with the proportion increasing by 41 percentage points from Science to Engineering.', vi: 'Tại Đại học A, 7% sinh viên chọn Khoa học, so với 18% ở Nghệ thuật và 33% ở Kinh doanh. Kỹ thuật là ngành phổ biến nhất tại trường này, ở mức 48%. Đây là mức tăng dần qua bốn nhóm, với tỷ lệ tăng 41 điểm phần trăm từ Khoa học đến Kỹ thuật.', focusVi: 'Thân bài 1 trình bày các số liệu của Đại học A theo thứ tự ngành.' },
      { en: 'The pattern at University B ran in the opposite direction: Science led at 45%, followed by Arts at 30% and Business at 20%, while Engineering accounted for only 7%. The gap between the universities was widest for Engineering, at 41 percentage points, and narrowest for Arts, at 12 points. Science followed closely, with a 38-point difference in favour of University B.', vi: 'Quy luật tại Đại học B đi theo chiều ngược lại: Khoa học dẫn đầu ở mức 45%, tiếp đến là Nghệ thuật ở 30% và Kinh doanh ở 20%, còn Kỹ thuật chỉ chiếm 7%. Chênh lệch giữa hai trường lớn nhất ở Kỹ thuật, với 41 điểm phần trăm, và nhỏ nhất ở Nghệ thuật, với 12 điểm. Khoa học đứng kế tiếp, chênh 38 điểm nghiêng về Đại học B.', focusVi: 'Thân bài 2 đối chiếu trường B và nêu độ lớn các khoảng cách.' },
    ],
    vocabulary: [
      { phrase: 'displayed the reverse pattern', meaningVi: 'thể hiện quy luật ngược lại', noteVi: 'Dùng để tóm tắt một dãy số đối lập.' },
      { phrase: 'accounted for', meaningVi: 'chiếm', noteVi: 'Động từ hữu ích khi báo cáo tỷ trọng.' },
      { phrase: 'narrowest for', meaningVi: 'nhỏ nhất ở', noteVi: 'Cách so sánh nhanh độ rộng chênh lệch.' },
    ],
  }),
  task1({
    id: 'sample-t1-extra-food-intake', topicSlug: 'health', topicEn: 'Health', topicVi: 'Sức khỏe',
    title: 'Daily intake by food group', promptId: 'w-t1-bar-food-intake', chartKind: 'bar', band: 8.0,
    promptText: 'The bar chart below shows the average daily intake of four food groups by men and women.',
    paragraphs: [
      { en: 'The bar chart compares men’s and women’s average daily consumption of vegetables, fruit, meat and dairy, measured in grams.', vi: 'Biểu đồ cột so sánh lượng tiêu thụ trung bình mỗi ngày của nam và nữ đối với rau củ, trái cây, thịt và sản phẩm từ sữa, tính bằng gam.', focusVi: 'Mở bài nêu hai nhóm, bốn loại thực phẩm và đơn vị.' },
      { en: 'Overall, men recorded higher figures for meat and dairy, whereas women consumed more vegetables and fruit. The largest gender difference was in dairy intake, while the gap for meat was smaller. The highest values for each sex occurred in different food groups.', vi: 'Nhìn chung, nam giới có số liệu cao hơn ở thịt và sản phẩm từ sữa, trong khi nữ giới tiêu thụ nhiều rau củ và trái cây hơn. Chênh lệch giới tính lớn nhất nằm ở lượng sữa, còn khoảng cách ở thịt nhỏ hơn. Mức cao nhất của mỗi giới thuộc về những nhóm thực phẩm khác nhau.', focusVi: 'Overview nhóm các hạng mục theo giới và nhấn khác biệt lớn, nhỏ.' },
      { en: 'Women consumed 474 grams of vegetables per day, far above the 76 grams recorded for men. Their fruit intake was also higher, at 323 grams compared with 187 grams. Together, these two categories show a clear female lead, particularly for vegetables, where the difference amounted to 398 grams daily.', vi: 'Nữ giới tiêu thụ 474 gam rau củ mỗi ngày, cao hơn nhiều so với 76 gam ở nam giới. Lượng trái cây của họ cũng cao hơn, ở mức 323 gam so với 187 gam. Hai nhóm này cho thấy nữ giới dẫn trước rõ rệt, đặc biệt là ở rau củ, nơi chênh lệch lên tới 398 gam mỗi ngày.', focusVi: 'Thân bài 1 nêu hai nhóm mà nữ giới có lượng tiêu thụ cao hơn.' },
      { en: 'For meat, men consumed noticeably more: 299 grams per day compared with 188 grams for women, a difference of 111 grams. Dairy showed the sharpest contrast in the opposite direction. Men’s intake reached 475 grams, the highest value on the chart, while women’s was only 70 grams, the lowest. The gap between these dairy figures was 405 grams.', vi: 'Đối với thịt, nam giới tiêu thụ nhiều hơn rõ rệt: 299 gam mỗi ngày so với 188 gam ở nữ giới, chênh lệch 111 gam. Sản phẩm từ sữa cho thấy tương phản lớn nhất theo chiều ngược lại. Lượng tiêu thụ của nam đạt 475 gam, cao nhất biểu đồ, trong khi nữ chỉ ở mức 70 gam, thấp nhất. Khoảng cách giữa hai số liệu này là 405 gam.', focusVi: 'Thân bài 2 trình bày thịt và làm nổi bật chênh lệch lớn ở sữa.' },
    ],
    vocabulary: [
      { phrase: 'far above', meaningVi: 'cao hơn nhiều so với', noteVi: 'Cụm nhấn mạnh khoảng cách rõ rệt.' },
      { phrase: 'amounted to', meaningVi: 'lên tới/tương đương', noteVi: 'Dùng để nêu độ lớn của chênh lệch.' },
      { phrase: 'the sharpest contrast', meaningVi: 'sự tương phản rõ nhất', noteVi: 'Cụm danh từ hữu ích trong overview.' },
    ],
  }),
  task1({
    id: 'sample-t1-extra-monthly-spending', topicSlug: 'business', topicEn: 'Business', topicVi: 'Kinh doanh',
    title: 'Household spending in two cities', promptId: 'w-t1-bar-monthly-spending', chartKind: 'bar', band: 8.0,
    promptText: 'The bar chart below shows average monthly household spending on four categories in two cities.',
    paragraphs: [
      { en: 'The bar chart compares average monthly household expenditure on housing, food, transport and leisure in City A and City B, in US dollars.', vi: 'Biểu đồ cột so sánh chi tiêu trung bình hằng tháng của hộ gia đình cho nhà ở, thực phẩm, giao thông và giải trí tại Thành phố A và Thành phố B, tính bằng đô la Mỹ.', focusVi: 'Mở bài nêu hai địa điểm, bốn hạng mục và đơn vị tiền tệ.' },
      { en: 'Overall, City A spent progressively more across the four categories, from housing to leisure, whereas City B showed the opposite ranking. Housing was the largest expense in City B but the smallest in City A; leisure displayed the reverse. The two cities were closest in transport spending.', vi: 'Nhìn chung, chi tiêu ở Thành phố A tăng dần qua bốn hạng mục, từ nhà ở đến giải trí, trong khi Thành phố B có thứ hạng ngược lại. Nhà ở là khoản lớn nhất tại Thành phố B nhưng nhỏ nhất ở Thành phố A; giải trí có chiều ngược lại. Hai thành phố gần nhau nhất về chi tiêu giao thông.', focusVi: 'Overview khái quát thứ tự đối lập và hạng mục có mức tương đồng nhất.' },
      { en: 'In City A, households spent just $136 per month on housing and $353 on food. Transport accounted for a higher $594, while leisure was the largest item at $1,012. The difference between the lowest and highest categories in this city was therefore $876 per month.', vi: 'Tại Thành phố A, các hộ gia đình chỉ chi 136 đô la mỗi tháng cho nhà ở và 353 đô la cho thực phẩm. Giao thông chiếm mức cao hơn là 594 đô la, trong khi giải trí là khoản lớn nhất với 1.012 đô la. Vì vậy, chênh lệch giữa hạng mục thấp nhất và cao nhất ở thành phố này là 876 đô la mỗi tháng.', focusVi: 'Thân bài 1 mô tả mức chi tại Thành phố A và khoảng cách nội bộ.' },
      { en: 'City B allocated the most to housing, at $974, followed by food at $634. Its transport figure was $375, which was $219 lower than City A’s, while leisure spending stood at only $150. In contrast to City A, housing exceeded leisure by $824 in City B. Thus, the most pronounced cross-city gaps were in leisure and housing.', vi: 'Thành phố B dành nhiều nhất cho nhà ở, ở mức 974 đô la, tiếp theo là thực phẩm với 634 đô la. Chi tiêu giao thông là 375 đô la, thấp hơn Thành phố A 219 đô la, còn giải trí chỉ ở mức 150 đô la. Trái với Thành phố A, khoản nhà ở tại Thành phố B cao hơn giải trí 824 đô la. Do đó, chênh lệch giữa hai thành phố rõ nhất nằm ở giải trí và nhà ở.', focusVi: 'Thân bài 2 trình bày Thành phố B rồi so sánh trực tiếp các khoản.' },
    ],
    vocabulary: [
      { phrase: 'expenditure on', meaningVi: 'chi tiêu cho', noteVi: 'Danh từ trang trọng phù hợp với biểu đồ chi phí.' },
      { phrase: 'allocated the most to', meaningVi: 'dành phần lớn nhất cho', noteVi: 'Cấu trúc mô tả phân bổ ngân sách.' },
      { phrase: 'pronounced gap', meaningVi: 'khoảng cách rõ rệt', noteVi: 'Cách mô tả sự chênh lệch lớn.' },
    ],
  }),
  task1({
    id: 'sample-t1-extra-household-pie', topicSlug: 'business', topicEn: 'Business', topicVi: 'Kinh doanh',
    title: 'Household budget shares', promptId: 'w-t1-pie-household-spending', chartKind: 'pie', band: 8.0,
    promptText: 'The pie charts below show how an average household spent its money in 2000 and in 2020.',
    paragraphs: [
      { en: 'The pie charts compare the percentage distribution of an average household’s spending across food, housing, transport and leisure in 2000 and 2020.', vi: 'Hai biểu đồ tròn so sánh tỷ lệ phân bổ chi tiêu của một hộ gia đình trung bình cho thực phẩm, nhà ở, giao thông và giải trí vào năm 2000 và 2020.', focusVi: 'Mở bài nêu đối tượng, các khoản chi và hai năm so sánh.' },
      { en: 'Overall, the spending pattern shifted away from food and housing towards transport and leisure. Food was the largest item in 2000, whereas leisure took that position in 2020. Leisure also rose from the smallest share to the largest, while food moved in the opposite direction.', vi: 'Nhìn chung, cơ cấu chi tiêu chuyển khỏi thực phẩm và nhà ở sang giao thông và giải trí. Thực phẩm là khoản lớn nhất năm 2000, còn giải trí giữ vị trí đó vào năm 2020. Giải trí cũng tăng từ tỷ trọng nhỏ nhất lên lớn nhất, trong khi thực phẩm đi theo chiều ngược lại.', focusVi: 'Overview nêu chuyển dịch chung và sự đổi chỗ giữa hai hạng mục cực trị.' },
      { en: 'In 2000, food accounted for 38% of household spending, followed by housing at 30% and transport at 21%. Leisure received the smallest allocation, at 11%. By 2020, the food share had fallen by 27 percentage points to 11%, and housing had also declined, from 30% to 21%.', vi: 'Năm 2000, thực phẩm chiếm 38% chi tiêu hộ gia đình, tiếp theo là nhà ở ở mức 30% và giao thông 21%. Giải trí nhận phần phân bổ nhỏ nhất, là 11%. Đến năm 2020, tỷ trọng thực phẩm giảm 27 điểm phần trăm còn 11%, và nhà ở cũng giảm từ 30% xuống 21%.', focusVi: 'Thân bài 1 trình bày thứ hạng ban đầu và hai khoản có tỷ trọng giảm.' },
      { en: 'The other categories grew over the same period. Transport rose from 21% to 30%, an increase of nine points, while leisure climbed by 27 points to reach 38%. Consequently, leisure replaced food as the leading expense, and food became the smallest category. The charts indicate how the budget shares changed, although they provide no information about the total amount spent by households.', vi: 'Các hạng mục còn lại tăng trong cùng giai đoạn. Giao thông tăng từ 21% lên 30%, thêm chín điểm, còn giải trí tăng 27 điểm để đạt 38%. Do đó, giải trí thay thế thực phẩm làm khoản chi đứng đầu, còn thực phẩm trở thành hạng mục nhỏ nhất. Biểu đồ cho biết tỷ trọng ngân sách thay đổi ra sao, nhưng không cung cấp thông tin về tổng số tiền các hộ gia đình đã chi.', focusVi: 'Thân bài 2 mô tả các khoản tăng và lưu ý biểu đồ chỉ cho biết tỷ trọng.' },
    ],
    vocabulary: [
      { phrase: 'percentage distribution', meaningVi: 'phân bổ theo tỷ lệ phần trăm', noteVi: 'Cụm danh từ phù hợp để giới thiệu biểu đồ tròn.' },
      { phrase: 'accounted for', meaningVi: 'chiếm', noteVi: 'Cách diễn đạt gọn khi mô tả tỷ trọng.' },
      { phrase: 'points to reach', meaningVi: 'điểm để đạt mức', noteVi: 'Nêu mức thay đổi theo điểm phần trăm.' },
    ],
  }),
  task1({
    id: 'sample-t1-extra-waste-pie', topicSlug: 'environment', topicEn: 'Environment', topicVi: 'Môi trường',
    title: 'Household waste composition', promptId: 'w-t1-pie-waste-composition', chartKind: 'pie', band: 8.0,
    promptText: 'The pie charts below show the composition of household waste in a city in 2005 and in 2020.',
    paragraphs: [
      { en: 'The pie charts show how household waste in one city was divided among paper, plastic, food waste and glass in 2005 and 2020.', vi: 'Hai biểu đồ tròn cho thấy rác thải hộ gia đình tại một thành phố được chia thành giấy, nhựa, rác thực phẩm và thuỷ tinh như thế nào vào năm 2005 và 2020.', focusVi: 'Mở bài nêu bốn thành phần rác và các mốc thời gian.' },
      { en: 'Overall, the composition changed considerably: paper and plastic made up smaller shares in 2020, while food waste and glass became more prominent. Paper was the largest component initially, but glass ranked first at the end. The relative positions of paper and glass therefore reversed.', vi: 'Nhìn chung, cơ cấu thay đổi đáng kể: giấy và nhựa chiếm tỷ trọng nhỏ hơn vào năm 2020, trong khi rác thực phẩm và thuỷ tinh trở nên đáng kể hơn. Giấy là thành phần lớn nhất ban đầu, nhưng thuỷ tinh đứng đầu vào cuối kỳ. Vì vậy, vị trí tương đối của giấy và thuỷ tinh đã đảo ngược.', focusVi: 'Overview nêu các nhóm tăng giảm và sự đổi hạng giữa hai cực.' },
      { en: 'Paper accounted for 37% of household waste in 2005, ahead of plastic at 31%. Food waste made up a further 20%, and glass had the smallest share, at 12%. By 2020, the paper figure had fallen by 25 percentage points to 12%, while plastic declined by 11 points to 20%.', vi: 'Giấy chiếm 37% rác thải hộ gia đình năm 2005, cao hơn nhựa ở mức 31%. Rác thực phẩm chiếm thêm 20%, còn thuỷ tinh có tỷ trọng nhỏ nhất, là 12%. Đến năm 2020, tỷ lệ giấy giảm 25 điểm phần trăm còn 12%, trong khi nhựa giảm 11 điểm xuống 20%.', focusVi: 'Thân bài 1 nêu tỷ trọng ban đầu và mức giảm của giấy, nhựa.' },
      { en: 'The two remaining categories moved upwards. Food waste rose from 20% to 31%, an increase of 11 points, whereas glass grew by 25 points to 37%. As a result, glass became the largest component and food waste ranked second. Each category changed by the same number of points as its counterpart in the opposite direction, leaving the total share at 100% in both years.', vi: 'Hai nhóm còn lại tăng lên. Rác thực phẩm tăng từ 20% lên 31%, thêm 11 điểm, còn thuỷ tinh tăng 25 điểm để đạt 37%. Kết quả là thuỷ tinh trở thành thành phần lớn nhất và rác thực phẩm đứng thứ hai. Mỗi nhóm thay đổi số điểm bằng với một nhóm đối ứng theo chiều ngược lại, giữ tổng tỷ trọng ở mức 100% trong cả hai năm.', focusVi: 'Thân bài 2 trình bày hai nhóm tăng và tổng hợp thứ hạng cuối.' },
    ],
    vocabulary: [
      { phrase: 'made up smaller shares', meaningVi: 'chiếm tỷ trọng nhỏ hơn', noteVi: 'Cụm mô tả phần đóng góp giảm.' },
      { phrase: 'accounted for', meaningVi: 'chiếm', noteVi: 'Động từ thường dùng để báo cáo phần trăm.' },
      { phrase: 'counterpart in the opposite direction', meaningVi: 'nhóm đối ứng theo chiều ngược lại', noteVi: 'Cách tổng hợp các thay đổi bù trừ.' },
    ],
  }),
  task1({
    id: 'sample-t1-extra-moving-reasons', topicSlug: 'society', topicEn: 'Society', topicVi: 'Xã hội',
    title: 'Reasons for moving home', promptId: 'w-t1-pie-moving-reasons', chartKind: 'pie', band: 8.0,
    promptText: 'The pie charts below show the reasons people gave for moving home in 2000 and in 2020.',
    paragraphs: [
      { en: 'The pie charts compare reasons people gave for moving home in 2000 and 2020: work, study, family and cost of living.', vi: 'Hai biểu đồ tròn so sánh lý do mọi người đưa ra khi chuyển nhà vào năm 2000 và 2020: công việc, học tập, gia đình và chi phí sinh hoạt.', focusVi: 'Mở bài diễn đạt lại đề và liệt kê bốn lý do.' },
      { en: 'Overall, work became much less prominent, while the cost of living rose to become the leading reason. Family-related moves also gained importance, whereas study declined moderately. The largest category thus changed from work in 2000 to living costs in 2020, reversing the ranking of the two extremes.', vi: 'Nhìn chung, công việc giảm tầm quan trọng đáng kể, trong khi chi phí sinh hoạt tăng lên thành lý do hàng đầu. Việc chuyển nhà liên quan đến gia đình cũng tăng, còn học tập giảm ở mức vừa phải. Do đó, hạng mục lớn nhất chuyển từ công việc năm 2000 sang chi phí sinh hoạt năm 2020, đồng thời đảo ngược thứ hạng của hai cực trị.', focusVi: 'Overview tóm tắt các nhóm tăng giảm và sự đảo hạng.' },
      { en: 'In 2000, work was cited by 40% of movers, making it the most common reason; study followed at 29%. Family accounted for 19%, and the cost of living was least frequent at 12%. Twenty years later, the work figure had dropped by 28 percentage points to 12%. Study also fell, though by a smaller margin, from 29% to 19%.', vi: 'Năm 2000, 40% người chuyển nhà nêu công việc, đây là lý do phổ biến nhất; học tập đứng sau với 29%. Gia đình chiếm 19%, còn chi phí sinh hoạt ít được nêu nhất ở mức 12%. Hai mươi năm sau, tỷ lệ công việc giảm 28 điểm phần trăm còn 12%. Học tập cũng giảm, dù mức giảm nhỏ hơn, từ 29% xuống 19%.', focusVi: 'Thân bài 1 trình bày cơ cấu ban đầu và hai lý do có tỷ lệ giảm.' },
      { en: 'Family rose by ten points to 29% in 2020, while the cost-of-living share more than tripled, reaching 40%. The latter therefore replaced work at the top of the chart, and work became the smallest category. Family moved into second place, ahead of study. These percentages describe stated reasons only; the charts do not indicate how many people moved in either year.', vi: 'Tỷ trọng gia đình tăng mười điểm lên 29% vào năm 2020, còn chi phí sinh hoạt tăng hơn gấp ba, đạt 40%. Vì vậy, hạng mục này thay thế công việc ở vị trí đầu biểu đồ, còn công việc trở thành nhóm nhỏ nhất. Gia đình lên vị trí thứ hai, cao hơn học tập. Các tỷ lệ này chỉ mô tả lý do được nêu; biểu đồ không cho biết số người đã chuyển nhà trong từng năm.', focusVi: 'Thân bài 2 mô tả hai lý do tăng và phân biệt tỷ lệ với số lượng người.' },
    ],
    vocabulary: [
      { phrase: 'was cited by', meaningVi: 'được ... nêu ra bởi', noteVi: 'Cấu trúc bị động phù hợp với lý do khảo sát.' },
      { phrase: 'more than tripled', meaningVi: 'tăng hơn gấp ba', noteVi: 'Diễn tả mức tăng lớn theo tỷ lệ.' },
      { phrase: 'moved into second place', meaningVi: 'vươn lên vị trí thứ hai', noteVi: 'Cụm mô tả thay đổi thứ hạng.' },
    ],
  }),
  task1({
    id: 'sample-t1-extra-transport-table', topicSlug: 'society', topicEn: 'Society', topicVi: 'Xã hội',
    title: 'Commuting transport modes', promptId: 'w-t1-table-transport-modes', chartKind: 'table', band: 8.0,
    promptText: 'The table below shows the percentage of people using four modes of transport to travel to work, 2000–2020.',
    paragraphs: [
      { en: 'The table presents the percentages of commuters using a private car, bus, train or bicycle to travel to work in 2000, 2010 and 2020.', vi: 'Bảng trình bày tỷ lệ người đi làm bằng ô tô cá nhân, xe buýt, tàu hoả hoặc xe đạp vào các năm 2000, 2010 và 2020.', focusVi: 'Mở bài nêu đối tượng, bốn phương tiện và ba mốc thời gian.' },
      { en: 'Overall, private-car and train use increased over the period, whereas the figures for buses and bicycles declined. The car recorded the greatest rise and became the most commonly used mode by 2020. Bus use showed the sharpest fall, ending with the lowest percentage.', vi: 'Nhìn chung, tỷ lệ đi ô tô cá nhân và tàu hoả tăng trong kỳ, trong khi số liệu xe buýt và xe đạp giảm. Ô tô ghi nhận mức tăng lớn nhất và trở thành phương tiện được sử dụng phổ biến nhất vào năm 2020. Xe buýt giảm mạnh nhất, kết thúc với tỷ lệ thấp nhất.', focusVi: 'Overview nhóm các phương tiện theo chiều biến động và thứ hạng cuối.' },
      { en: 'In 2000, buses led at 57%, followed by cycling at 42%. Train use stood at 23%, while private cars were least common, at only 7%. By 2010, the car figure had risen to 34%, matching the train percentage. Both buses and bicycles had fallen to 33%, so the four modes were clustered within a single percentage point at that stage.', vi: 'Năm 2000, xe buýt dẫn đầu ở mức 57%, tiếp theo là xe đạp với 42%. Tỷ lệ đi tàu là 23%, còn ô tô cá nhân ít phổ biến nhất, chỉ 7%. Đến năm 2010, số liệu ô tô tăng lên 34%, bằng với tỷ lệ tàu hoả. Cả xe buýt và xe đạp đều giảm xuống 33%, khiến bốn phương tiện tập trung trong phạm vi một điểm phần trăm ở mốc đó.', focusVi: 'Thân bài 1 mô tả thứ hạng ban đầu và sự hội tụ vào năm 2010.' },
      { en: 'The figures diverged again by 2020. Private-car use climbed to 58%, while train use rose more moderately to 42%. In contrast, cycling fell to 24% and bus use dropped sharply to 7%. The car therefore moved from last place to first, while buses shifted from first to last. The table reports use of each mode and does not show whether commuters combined them.', vi: 'Đến năm 2020, các số liệu lại phân tách. Tỷ lệ đi ô tô cá nhân tăng lên 58%, còn tàu hoả tăng vừa phải hơn, đạt 42%. Ngược lại, đi xe đạp giảm còn 24% và xe buýt giảm mạnh xuống 7%. Vì vậy, ô tô chuyển từ cuối bảng lên đầu bảng, còn xe buýt từ đầu xuống cuối. Bảng báo cáo mức sử dụng từng phương tiện nhưng không cho biết người đi làm có kết hợp chúng hay không.', focusVi: 'Thân bài 2 so sánh số liệu cuối kỳ và tránh giả định các lựa chọn loại trừ nhau.' },
    ],
    vocabulary: [
      { phrase: 'stood at', meaningVi: 'ở mức', noteVi: 'Cấu trúc ngắn gọn để dẫn số liệu.' },
      { phrase: 'were clustered within', meaningVi: 'nằm gọn trong phạm vi', noteVi: 'Mô tả các giá trị gần nhau.' },
      { phrase: 'diverged again', meaningVi: 'lại phân tách', noteVi: 'Dùng khi số liệu từng hội tụ sau đó giãn cách.' },
    ],
  }),
  task1({
    id: 'sample-t1-extra-company-revenue', topicSlug: 'business', topicEn: 'Business', topicVi: 'Kinh doanh',
    title: 'Revenue at four companies', promptId: 'w-t1-table-company-revenue', chartKind: 'table', band: 8.0,
    promptText: 'The table below shows the annual revenue of four companies, 2016–2022.',
    paragraphs: [
      { en: 'The table compares annual revenues at Alpha, Beta, Gamma and Delta in 2016, 2018, 2020 and 2022, with amounts measured in millions of US dollars.', vi: 'Bảng so sánh doanh thu hằng năm của Alpha, Beta, Gamma và Delta vào các năm 2016, 2018, 2020 và 2022, với số tiền tính bằng triệu đô la Mỹ.', focusVi: 'Mở bài nêu các công ty, đơn vị và các mốc báo cáo.' },
      { en: 'Overall, Alpha and Gamma increased their revenue, while Beta and Delta declined. Alpha recorded the strongest growth and finished with the highest revenue; Beta experienced the sharpest fall and ended last. Gamma rose steadily, whereas Delta’s reduction was more moderate.', vi: 'Nhìn chung, Alpha và Gamma tăng doanh thu, còn Beta và Delta giảm. Alpha ghi nhận mức tăng mạnh nhất và kết thúc với doanh thu cao nhất; Beta giảm mạnh nhất và đứng cuối. Gamma tăng đều, trong khi mức giảm của Delta vừa phải hơn.', focusVi: 'Overview nhóm các công ty theo hướng biến động và so sánh thứ hạng cuối.' },
      { en: 'Alpha’s revenue rose from $103 million in 2016 to $331 million in 2018, then reached $527 million in 2020 and $736 million in 2022. Gamma also grew at each reported point, from $323 million initially to $379 million and $477 million, before ending at $540 million. Alpha was the smallest company by revenue at the start but the largest at the end.', vi: 'Doanh thu của Alpha tăng từ 103 triệu đô la năm 2016 lên 331 triệu năm 2018, sau đó đạt 527 triệu năm 2020 và 736 triệu năm 2022. Gamma cũng tăng tại từng mốc được báo cáo, từ 323 triệu ban đầu lên 379 triệu và 477 triệu, trước khi kết thúc ở mức 540 triệu. Alpha có doanh thu nhỏ nhất lúc đầu nhưng lớn nhất vào cuối kỳ.', focusVi: 'Thân bài 1 theo dõi doanh thu của hai công ty tăng.' },
      { en: 'Beta followed the opposite course, falling from $786 million in 2016 to $537 million in 2018 and $317 million in 2020, before dropping to $102 million. Delta’s revenue declined more gradually, from $526 million to $480 million, $404 million and finally $311 million. By 2022, Gamma had overtaken Delta, while Beta’s figure was lower than all three competitors.', vi: 'Beta đi theo chiều ngược lại, giảm từ 786 triệu đô la năm 2016 xuống 537 triệu năm 2018 và 317 triệu năm 2020, trước khi còn 102 triệu. Doanh thu của Delta giảm từ từ hơn, từ 526 triệu xuống 480 triệu, 404 triệu và cuối cùng là 311 triệu. Đến năm 2022, Gamma đã vượt Delta, còn số liệu của Beta thấp hơn cả ba đối thủ.', focusVi: 'Thân bài 2 mô tả hai công ty giảm và nêu thứ hạng cuối kỳ.' },
    ],
    vocabulary: [
      { phrase: 'at each reported point', meaningVi: 'tại từng mốc được báo cáo', noteVi: 'Cụm mô tả xu hướng tăng nhất quán.' },
      { phrase: 'followed the opposite course', meaningVi: 'đi theo chiều ngược lại', noteVi: 'Dùng để đối chiếu nhóm có xu hướng trái chiều.' },
      { phrase: 'more gradually', meaningVi: 'từ từ hơn/ít dốc hơn', noteVi: 'So sánh tốc độ giảm hoặc tăng.' },
    ],
  }),
  task1({
    id: 'sample-t1-extra-plastic-recycling', topicSlug: 'environment', topicEn: 'Environment', topicVi: 'Môi trường',
    title: 'Recycling household plastic', promptId: 'w-t1-process-plastic-recycling', chartKind: 'process', band: 8.0,
    promptText: 'The diagram below shows how household plastic is recycled into new products.',
    paragraphs: [
      { en: 'The diagram illustrates the stages by which household plastic is processed and made into new products.', vi: 'Sơ đồ minh hoạ các giai đoạn xử lý nhựa sinh hoạt để tạo thành sản phẩm mới.', focusVi: 'Mở bài diễn đạt lại đầu vào và mục đích của quy trình.' },
      { en: 'Overall, it is a linear process with six stages, beginning with the collection of plastic and ending when the resulting pellets are moulded into new items. Before this final stage, the material is sorted, cleaned, shredded and converted into pellets. No return loop is shown.', vi: 'Nhìn chung, đây là quy trình tuyến tính gồm sáu giai đoạn, bắt đầu bằng việc thu gom nhựa và kết thúc khi các hạt nhựa tạo thành được đúc thành đồ dùng mới. Trước bước cuối này, vật liệu được phân loại, làm sạch, nghiền nhỏ và chuyển thành hạt. Sơ đồ không thể hiện vòng quay trở lại.', focusVi: 'Overview nêu dạng, số giai đoạn, đầu cuối và các xử lý chính.' },
      { en: 'First, household plastic is collected and the items are sorted according to type. Labels and caps are then removed from the selected objects. The plastic is washed to clean it and subsequently shredded into smaller pieces. These steps prepare the material for further processing, while also separating it by type and removing the attached parts shown in the diagram.', vi: 'Trước tiên, nhựa sinh hoạt được thu gom và các món đồ được phân loại theo chủng loại. Sau đó, nhãn và nắp được gỡ khỏi những vật dụng đã chọn. Nhựa được rửa sạch rồi nghiền thành các mảnh nhỏ hơn. Các bước này chuẩn bị vật liệu cho công đoạn xử lý tiếp theo, đồng thời phân tách theo loại và loại bỏ những bộ phận gắn kèm được thể hiện trong sơ đồ.', focusVi: 'Thân bài 1 kể các công đoạn đầu theo đúng thứ tự.' },
      { en: 'Next, the shredded flakes are melted and formed into pellets. These pellets provide the material for the final stage, in which they are moulded into new products. Thus, the diagram traces a change in form from collected household items, through flakes and pellets, to finished goods. It does not specify what products are made or how the recycled items are used after manufacture.', vi: 'Tiếp theo, các mảnh nhựa đã nghiền được nung chảy và tạo thành hạt. Những hạt này cung cấp vật liệu cho giai đoạn cuối, khi chúng được đúc thành sản phẩm mới. Như vậy, sơ đồ mô tả sự thay đổi hình dạng từ đồ nhựa sinh hoạt được thu gom, qua mảnh vụn và hạt nhựa, đến hàng hoá hoàn chỉnh. Sơ đồ không nêu cụ thể sản phẩm nào được làm ra hoặc đồ tái chế được sử dụng ra sao sau khi sản xuất.', focusVi: 'Thân bài 2 mô tả các bước cuối và giới hạn điều sơ đồ thể hiện.' },
    ],
    vocabulary: [
      { phrase: 'according to type', meaningVi: 'theo chủng loại', noteVi: 'Cụm ngắn mô tả cách phân loại.' },
      { phrase: 'are formed into pellets', meaningVi: 'được tạo thành hạt', noteVi: 'Cấu trúc bị động cho sản phẩm trung gian.' },
      { phrase: 'traces a change in form', meaningVi: 'mô tả sự thay đổi hình dạng', noteVi: 'Cách tổng kết các bước xử lý vật liệu.' },
    ],
  }),
  task1({
    id: 'sample-t1-extra-coffee-cycle', topicSlug: 'business', topicEn: 'Business', topicVi: 'Kinh doanh',
    title: 'Coffee production and use', promptId: 'w-t1-process-coffee-cycle', chartKind: 'process', band: 8.0,
    promptText: 'The diagram below shows the production of coffee from growing beans to serving a cup.',
    paragraphs: [
      { en: 'The diagram shows how coffee is grown, harvested, prepared and brewed, with spent grounds composted at the end.', vi: 'Sơ đồ cho thấy cà phê được trồng, thu hoạch, chế biến và pha như thế nào, với bã đã dùng được ủ làm phân ở cuối quy trình.', focusVi: 'Mở bài tóm lược quy trình và nêu bước cuối đặc biệt.' },
      { en: 'Overall, six stages are shown, from planting seeds and moving young plants to fields through picking, drying, roasting, grinding and brewing. The final stage composts the used grounds, so the diagram also includes waste treatment.', vi: 'Nhìn chung, sơ đồ thể hiện sáu giai đoạn, từ gieo hạt và chuyển cây non ra đồng, qua thu hái, phơi khô, rang, xay và pha. Giai đoạn cuối là ủ bã đã dùng làm phân, vì vậy sơ đồ cũng bao gồm việc xử lý chất thải.', focusVi: 'Overview nêu số bước và trình tự lớn, bao gồm xử lý phần bã.' },
      { en: 'Initially, coffee seeds are planted, and the young plants are later moved to fields. Once the cherries are ripe, they are picked. The beans are then dried and roasted, a pair of preparation stages that transforms the harvested crop into roasted coffee. This material is next ground, ready for brewing. The sequence therefore shifts from cultivation and harvesting to processing the beans.', vi: 'Ban đầu, hạt cà phê được gieo, rồi cây non được chuyển ra đồng. Khi quả cà phê chín, chúng được thu hái. Sau đó, hạt được phơi khô và rang, hai công đoạn chuẩn bị biến cây trồng thu hoạch được thành cà phê rang. Nguyên liệu này tiếp theo được xay để sẵn sàng pha. Vì vậy, trình tự chuyển từ trồng trọt và thu hoạch sang chế biến hạt.', focusVi: 'Thân bài 1 thuật lại quá trình từ trồng cây đến xay hạt.' },
      { en: 'In the later stages, the ground coffee is brewed to produce a cup for serving. The spent coffee grounds are then composted, which is the last action shown. Unlike a diagram that stops at the finished drink, this one continues beyond brewing to include the used material. It does not indicate further detail about the compost or depict a separate route for any other by-products.', vi: 'Ở các giai đoạn sau, cà phê xay được pha để tạo thành một tách đem phục vụ. Bã cà phê đã dùng sau đó được ủ làm phân, đây là thao tác cuối cùng được thể hiện. Khác với sơ đồ dừng ở đồ uống hoàn chỉnh, sơ đồ này tiếp tục sau bước pha để bao gồm phần nguyên liệu đã qua sử dụng. Sơ đồ không cho biết thêm chi tiết về phân ủ hoặc mô tả tuyến riêng cho phụ phẩm nào khác.', focusVi: 'Thân bài 2 hoàn tất thứ tự và nhấn bước xử lý bã được thể hiện.' },
    ],
    vocabulary: [
      { phrase: 'once the cherries are ripe', meaningVi: 'khi quả cà phê chín', noteVi: 'Mệnh đề thời gian nối các bước trong quy trình.' },
      { phrase: 'the harvested crop', meaningVi: 'nông sản đã thu hoạch', noteVi: 'Cụm danh từ giúp tránh lặp tên nguyên liệu.' },
      { phrase: 'spent coffee grounds', meaningVi: 'bã cà phê đã qua sử dụng', noteVi: 'Thuật ngữ tự nhiên cho phần còn lại sau khi pha.' },
    ],
  }),
  task1({
    id: 'sample-t1-extra-campus-map', topicSlug: 'education', topicEn: 'Education', topicVi: 'Giáo dục',
    title: 'University campus development', promptId: 'w-t1-map-university-campus', chartKind: 'map', band: 8.0,
    promptText: 'The maps below show the development of a university campus between 2000 and the present.',
    paragraphs: [
      { en: 'The maps compare the layout of a university campus in 2000 with its present-day arrangement.', vi: 'Hai bản đồ so sánh bố cục khuôn viên một trường đại học vào năm 2000 với hiện trạng ngày nay.', focusVi: 'Mở bài nêu địa điểm và hai mốc so sánh.' },
      { en: 'Overall, the campus has gained a science centre and an expanded library, while its main hall and central road remain unchanged. The science centre now occupies the former sports field, and the lower part of the site has been adapted for parking and landscaped green space.', vi: 'Nhìn chung, khuôn viên có thêm trung tâm khoa học và thư viện mở rộng, trong khi hội trường chính và con đường trung tâm vẫn giữ nguyên. Trung tâm khoa học hiện nằm trên khu vực sân thể thao trước đây, còn phần phía dưới khu đất được điều chỉnh thành bãi đỗ xe và không gian xanh có cảnh quan.', focusVi: 'Overview nêu các công trình mới, yếu tố giữ nguyên và thay đổi tổng thể.' },
      { en: 'In 2000, the main hall stood in the upper-left area, with the library immediately to its east. A sports field occupied the upper-right section. The campus road crossed the site horizontally below these buildings. In the lower part, a car park lay to the west, while an open lawn covered the eastern side.', vi: 'Năm 2000, hội trường chính nằm ở phía trên bên trái, còn thư viện ở ngay phía đông. Sân thể thao chiếm khu vực trên bên phải. Đường khuôn viên chạy ngang qua địa điểm bên dưới các toà nhà này. Ở phần dưới, bãi đỗ xe nằm phía tây, còn bãi cỏ mở rộng ở phía đông.', focusVi: 'Thân bài 1 mô tả sơ đồ ban đầu theo các hướng chính.' },
      { en: 'At present, the main hall and road retain their positions. The library has been enlarged, and a science centre now occupies the area formerly used for sports. The car park remains in the same lower-left location but is underground, while the former lawn has become a central garden. The campus has therefore added teaching space and altered its outdoor areas without changing its central route.', vi: 'Hiện nay, hội trường chính và con đường vẫn ở vị trí cũ. Thư viện được mở rộng, còn trung tâm khoa học hiện chiếm khu vực trước đây dùng cho thể thao. Bãi đỗ xe vẫn nằm ở vị trí phía dưới bên trái nhưng được chuyển xuống ngầm, trong khi bãi cỏ cũ trở thành vườn trung tâm. Vì vậy, khuôn viên có thêm không gian giảng dạy và thay đổi khu vực ngoài trời mà không đổi tuyến đường trung tâm.', focusVi: 'Thân bài 2 nhóm các thay đổi hiện tại và nhắc yếu tố giữ nguyên.' },
    ],
    vocabulary: [
      { phrase: 'immediately to its east', meaningVi: 'ngay phía đông của nó', noteVi: 'Cụm chỉ vị trí tương đối trên bản đồ.' },
      { phrase: 'formerly used for', meaningVi: 'trước đây được dùng làm', noteVi: 'Cấu trúc bị động hữu ích để nêu công năng cũ.' },
      { phrase: 'retain their positions', meaningVi: 'giữ nguyên vị trí', noteVi: 'Dùng khi một địa điểm không thay đổi.' },
    ],
  }),
  task1({
    id: 'sample-t1-extra-island-map', topicSlug: 'tourism', topicEn: 'Tourism', topicVi: 'Du lịch',
    title: 'Proposed island tourism development', promptId: 'w-t1-map-island-resort', chartKind: 'map', band: 8.0,
    promptText: 'The maps below show the proposed development of an island for tourism.',
    paragraphs: [
      { en: 'The maps illustrate an island before and after a proposed tourism development, showing the existing natural features and the planned additions.', vi: 'Hai bản đồ minh hoạ hòn đảo trước và sau dự án phát triển du lịch được đề xuất, cho thấy các đặc điểm tự nhiên hiện có và những hạng mục dự kiến bổ sung.', focusVi: 'Mở bài xác định đây là đề án phát triển và nêu phạm vi bản đồ.' },
      { en: 'Overall, the proposal would add a hotel and a footpath while retaining the sea and beach. The forest would remain in the western part of the island, but be labelled as protected and occupy a slightly smaller area. The hill would no longer appear as a natural feature, as a hotel is planned in its place.', vi: 'Nhìn chung, đề án sẽ bổ sung khách sạn và lối đi bộ, đồng thời giữ lại biển và bãi biển. Rừng vẫn nằm ở phần phía tây hòn đảo nhưng được ghi là khu bảo tồn và chiếm diện tích nhỏ hơn đôi chút. Ngọn đồi sẽ không còn xuất hiện như một đặc điểm tự nhiên, vì khách sạn được dự kiến xây ở vị trí đó.', focusVi: 'Overview tóm tắt công trình mới, yếu tố giữ lại và thay đổi của cảnh quan.' },
      { en: 'Before development, the island contained a forest on its western side, a beach to the north-east and a hill farther south-east. No buildings or paths are shown. The surrounding area is sea, so these three features form the complete landscape represented on the first map.', vi: 'Trước khi phát triển, hòn đảo có một khu rừng ở phía tây, bãi biển ở phía đông bắc và ngọn đồi xa hơn về phía đông nam. Không có toà nhà hay lối đi nào được thể hiện. Khu vực xung quanh là biển, vì vậy ba đặc điểm này tạo nên toàn bộ cảnh quan trên bản đồ thứ nhất.', focusVi: 'Thân bài 1 mô tả hiện trạng ban đầu và vị trí tương đối.' },
      { en: 'After the plan is carried out, the forest is marked as protected and the beach remains in its former position. A hotel is added on the site of the hill. A footpath also crosses the southern part of the island, running from the western area towards the east. The development therefore introduces visitor accommodation and access while preserving the beach and most of the forest.', vi: 'Sau khi kế hoạch được thực hiện, khu rừng được đánh dấu là khu bảo tồn và bãi biển vẫn ở vị trí cũ. Một khách sạn được xây trên khu vực ngọn đồi. Lối đi bộ cũng băng qua phần phía nam hòn đảo, chạy từ khu vực phía tây về phía đông. Vì vậy, dự án bổ sung chỗ lưu trú và lối tiếp cận cho du khách trong khi giữ lại bãi biển và phần lớn khu rừng.', focusVi: 'Thân bài 2 trình bày đề xuất và nêu những đặc điểm tự nhiên được giữ lại.' },
    ],
    vocabulary: [
      { phrase: 'in its former position', meaningVi: 'ở vị trí cũ', noteVi: 'Dùng khi đặc điểm địa lý được giữ nguyên.' },
      { phrase: 'is marked as protected', meaningVi: 'được đánh dấu là khu bảo tồn', noteVi: 'Cấu trúc bị động khi mô tả ký hiệu trên bản đồ.' },
      { phrase: 'on the site of', meaningVi: 'trên khu vực của', noteVi: 'Diễn tả công trình mới thay thế vị trí cũ.' },
    ],
  }),
];
