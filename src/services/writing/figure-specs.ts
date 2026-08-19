import type { Task1Chart } from '@/lib/writing/types';

/**
 * Mô tả từng hình minh hoạ của đề Task 1.
 *
 * Trước đây một chủ đề dùng chung một tiêu đề cho cả bốn loại hình, và kết quả
 * là những đề vô nghĩa kiểu "biểu đồ tròn chia phần trăm của giá xăng". Mỗi
 * loại hình kể một câu chuyện khác nhau, nên mỗi hình phải có mô tả riêng.
 *
 * `range` là biên giá trị hợp lệ của đơn vị. Không có nó thì bộ sinh sẽ đẩy
 * trục "% hộ gia đình" lên 125% — con số không tồn tại, mà người học lại phải
 * chép đúng số liệu vào bài.
 */
export type FigureSpec = {
  /** Định danh duy nhất, dùng làm phần đuôi của id đề. */
  slug: string;
  kind: Task1Chart;
  topicSlug: string;
  /**
   * Cụm đứng ngay sau "The line graph below shows …" — viết thường và có sẵn
   * mạo từ, để câu lệnh đề ghép vào là đọc trôi.
   */
  subject: string;
  unit: string;
  range: [number, number];
  /** Tên các chuỗi / cột / lát. */
  subjects: string[];
  /** Mốc trục X. Với pie là nhãn của hai hình tròn. */
  labels: string[];
  /** Tên hai nhóm cột, chỉ dùng cho bar không có trục thời gian. */
  groups?: [string, string];
};

export const FIGURE_SPECS: FigureSpec[] = [
  // ------------------------------------------------------------------ line
  {
    slug: 'petrol-price',
    kind: 'line',
    topicSlug: 'environment',
    subject: 'the average price of petrol in three countries',
    unit: 'US cents per litre',
    range: [20, 200],
    subjects: ['Country A', 'Country B', 'Country C'],
    labels: ['2000', '2005', '2010', '2015', '2020'],
  },
  {
    slug: 'internet-access',
    kind: 'line',
    topicSlug: 'technology',
    subject: 'the percentage of households with internet access in three countries',
    unit: '% of households',
    range: [0, 100],
    subjects: ['Japan', 'Brazil', 'Kenya'],
    labels: ['2005', '2010', '2015', '2020'],
  },
  {
    slug: 'university-enrolment',
    kind: 'line',
    topicSlug: 'education',
    subject: 'the number of students enrolled at three universities',
    unit: 'thousands of students',
    range: [1, 40],
    subjects: ['Northgate', 'Riverside', 'Hilltop'],
    labels: ['2010', '2014', '2018', '2022'],
  },
  {
    slug: 'water-use',
    kind: 'line',
    topicSlug: 'health',
    subject: 'the average amount of water used per person each day in three countries',
    unit: 'litres per person',
    range: [10, 450],
    subjects: ['Australia', 'China', 'Ethiopia'],
    labels: ['2000', '2005', '2010', '2015', '2020'],
  },
  {
    slug: 'beverage-sales',
    kind: 'line',
    topicSlug: 'business',
    subject: 'sales of three types of beverage in a supermarket chain',
    unit: 'million litres',
    range: [10, 150],
    subjects: ['Bottled water', 'Fruit juice', 'Soft drinks'],
    labels: ['2015', '2017', '2019', '2021'],
  },
  {
    slug: 'leisure-use',
    kind: 'line',
    topicSlug: 'society',
    subject: 'the percentage of residents using three leisure facilities in a city',
    unit: '% of residents',
    range: [0, 100],
    subjects: ['Gyms', 'Libraries', 'Parks'],
    labels: ['2010', '2015', '2020'],
  },

  // ------------------------------------------------------------------- bar
  {
    slug: 'weekly-hours',
    kind: 'bar',
    topicSlug: 'society',
    subject: 'the average number of hours per week spent on four activities by two age groups',
    unit: 'hours per week',
    range: [0, 70],
    subjects: ['Working', 'Housework', 'Leisure', 'Sleeping'],
    labels: ['Working', 'Housework', 'Leisure', 'Sleeping'],
    groups: ['Aged 20–35', 'Aged 55–70'],
  },
  {
    slug: 'subject-choice',
    kind: 'bar',
    topicSlug: 'education',
    subject: 'the percentage of students choosing four subjects at two universities',
    unit: '% of students',
    range: [0, 60],
    subjects: ['Science', 'Arts', 'Business', 'Engineering'],
    labels: ['Science', 'Arts', 'Business', 'Engineering'],
    groups: ['University A', 'University B'],
  },
  {
    slug: 'food-intake',
    kind: 'bar',
    topicSlug: 'health',
    subject: 'the average daily intake of four food groups by men and women',
    unit: 'grams per day',
    range: [0, 600],
    subjects: ['Vegetables', 'Fruit', 'Meat', 'Dairy'],
    labels: ['Vegetables', 'Fruit', 'Meat', 'Dairy'],
    groups: ['Men', 'Women'],
  },
  {
    slug: 'monthly-spending',
    kind: 'bar',
    topicSlug: 'business',
    subject: 'average monthly household spending on four categories in two cities',
    unit: 'USD per month',
    range: [0, 1200],
    subjects: ['Housing', 'Food', 'Transport', 'Leisure'],
    labels: ['Housing', 'Food', 'Transport', 'Leisure'],
    groups: ['City A', 'City B'],
  },
  {
    slug: 'device-use',
    kind: 'bar',
    topicSlug: 'technology',
    subject: 'the percentage of people using four types of device in two countries',
    unit: '% of people',
    range: [0, 100],
    subjects: ['Smartphone', 'Laptop', 'Tablet', 'Smart TV'],
    labels: ['Smartphone', 'Laptop', 'Tablet', 'Smart TV'],
    groups: ['Country A', 'Country B'],
  },
  {
    slug: 'waste-by-town',
    kind: 'bar',
    topicSlug: 'environment',
    subject: 'the amount of four types of waste produced by two towns',
    unit: 'tonnes per year',
    range: [0, 9000],
    subjects: ['Paper', 'Plastic', 'Food', 'Glass'],
    labels: ['Paper', 'Plastic', 'Food', 'Glass'],
    groups: ['Town A', 'Town B'],
  },

  // ------------------------------------------------------------------- pie
  {
    slug: 'electricity-sources',
    kind: 'pie',
    topicSlug: 'environment',
    subject: 'how electricity was generated in one country in 1995 and in 2020',
    unit: '%',
    range: [0, 100],
    subjects: ['Coal', 'Gas', 'Nuclear', 'Renewables'],
    labels: ['1995', '2020'],
  },
  {
    slug: 'household-spending',
    kind: 'pie',
    topicSlug: 'business',
    subject: 'how an average household spent its money in 2000 and in 2020',
    unit: '%',
    range: [0, 100],
    subjects: ['Food', 'Housing', 'Transport', 'Leisure'],
    labels: ['2000', '2020'],
  },
  {
    slug: 'waste-composition',
    kind: 'pie',
    topicSlug: 'environment',
    subject: 'the composition of household waste in a city in 2005 and in 2020',
    unit: '%',
    range: [0, 100],
    subjects: ['Paper', 'Plastic', 'Food waste', 'Glass'],
    labels: ['2005', '2020'],
  },
  {
    slug: 'moving-reasons',
    kind: 'pie',
    topicSlug: 'society',
    subject: 'the reasons people gave for moving home in 2000 and in 2020',
    unit: '%',
    range: [0, 100],
    subjects: ['Work', 'Study', 'Family', 'Cost of living'],
    labels: ['2000', '2020'],
  },
  {
    slug: 'graduate-subjects',
    kind: 'pie',
    topicSlug: 'education',
    subject: 'the subjects studied by university graduates in 2000 and in 2020',
    unit: '%',
    range: [0, 100],
    subjects: ['Science', 'Business', 'Arts', 'Health'],
    labels: ['2000', '2020'],
  },
  {
    slug: 'internet-devices',
    kind: 'pie',
    topicSlug: 'technology',
    subject: 'how people accessed the internet in 2010 and in 2020',
    unit: '%',
    range: [0, 100],
    subjects: ['Desktop', 'Laptop', 'Smartphone', 'Tablet'],
    labels: ['2010', '2020'],
  },

  // ----------------------------------------------------------------- table
  {
    slug: 'literacy-rate',
    kind: 'table',
    topicSlug: 'education',
    subject: 'adult literacy rates in four regions of the world',
    unit: '% of adults',
    range: [30, 100],
    subjects: ['East Asia', 'South Asia', 'Sub-Saharan Africa', 'Europe'],
    labels: ['1990', '2000', '2010', '2020'],
  },
  {
    slug: 'transport-modes',
    kind: 'table',
    topicSlug: 'society',
    subject: 'the percentage of people using four modes of transport to travel to work',
    unit: '% of commuters',
    range: [0, 70],
    subjects: ['Private car', 'Bus', 'Train', 'Cycling'],
    labels: ['2000', '2010', '2020'],
  },
  {
    slug: 'life-expectancy',
    kind: 'table',
    topicSlug: 'health',
    subject: 'average life expectancy at birth in four countries',
    unit: 'years',
    range: [45, 90],
    subjects: ['Japan', 'Brazil', 'India', 'Nigeria'],
    labels: ['1990', '2000', '2010', '2020'],
  },
  {
    slug: 'company-revenue',
    kind: 'table',
    topicSlug: 'business',
    subject: 'the annual revenue of four companies',
    unit: 'million USD',
    range: [10, 900],
    subjects: ['Alpha', 'Beta', 'Gamma', 'Delta'],
    labels: ['2016', '2018', '2020', '2022'],
  },
  {
    slug: 'annual-rainfall',
    kind: 'table',
    topicSlug: 'environment',
    subject: 'average annual rainfall in four cities',
    unit: 'mm per year',
    range: [100, 2000],
    subjects: ['Oslo', 'Lisbon', 'Cairo', 'Mumbai'],
    labels: ['2000', '2010', '2020'],
  },
  {
    slug: 'mobile-subscriptions',
    kind: 'table',
    topicSlug: 'technology',
    subject: 'the number of mobile phone subscriptions in four countries',
    unit: 'per 100 people',
    range: [5, 160],
    subjects: ['Country A', 'Country B', 'Country C', 'Country D'],
    labels: ['2000', '2010', '2020'],
  },
];
