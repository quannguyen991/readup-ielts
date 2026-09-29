import { MATH_DOMAIN_LABEL, type MathDomain } from '@/lib/math/types';
import { SAT_VOCAB_TERMS_MORE } from './sat-math-vocab-more';

/**
 * Từ vựng SAT Math — một chuyên đề RIÊNG, tách khỏi 30 chủ đề IELTS.
 *
 * VÌ SAO TÁCH RIÊNG chứ không thêm thành chủ đề thứ 31 vào `vocab-topics.ts`:
 * hai bộ phục vụ hai việc khác hẳn nhau. Bộ IELTS dạy từ học thuật để VIẾT và
 * NÓI (Writing Task 2, Speaking Part 3) — nó xếp theo mức band 5-6 → 8+ vì đó
 * là thang điểm IELTS thật. SAT Math không thi bằng band, và phần lớn mục ở
 * đây không phải "từ vựng" theo nghĩa thông thường — chúng là THUẬT NGỮ
 * (coefficient, quotient) và CỤM DIỄN ĐẠT ĐỀ BÀI (at least, is a factor of)
 * mà người học phải hiểu ĐÚNG NGHĨA TOÁN HỌC, không phải nghĩa hay dùng ngoài
 * đời. Gắn nhãn "Band 6-7" lên "quotient" vừa sai vừa vô nghĩa.
 *
 * PHÂN LOẠI THEO ĐÚNG 4 DOMAIN CHÍNH THỨC của Digital SAT Math (dùng lại
 * `MathDomain` từ bộ luyện đề, xem `src/lib/math/types.ts`), cộng hai nhóm nằm
 * ngoài bốn domain đó:
 *   - `foundations`: số học và tính chất số cơ bản (sum, integer, factor…),
 *     là nền cho CẢ BỐN domain chứ không thuộc riêng domain nào.
 *   - `word_problem_language`: cụm từ tiếng Anh hay gặp trong ĐỀ BÀI, không
 *     phải thuật ngữ toán — "at least" hay "is directly proportional to" là
 *     rào cản NGÔN NGỮ, tách bạch khỏi rào cản TOÁN.
 *
 * TRÙNG TERM GIỮA HAI CATEGORY LÀ CÓ CHỦ Ý khi đó đúng là hai nghĩa khác nhau
 * của cùng một từ tiếng Anh — "range" của một hàm số (miền giá trị) và "range"
 * của một tập dữ liệu (khoảng biến thiên) là hai khái niệm khác hẳn, và người
 * học CẦN biết cùng một từ có thể mang hai nghĩa tuỳ ngữ cảnh. Xem test
 * `sat-math-vocab.test.ts` — nó cấm trùng TRONG một category, không cấm trùng
 * GIỮA các category.
 */

export type SatVocabCategory = MathDomain | 'foundations' | 'word_problem_language';

export type SatVocabTerm = {
  term: string;
  category: SatVocabCategory;
  meaningVi: string;
  definitionEn: string;
  /** Câu ví dụ tự soạn, phong cách đề SAT — KHÔNG chép từ đề thi thật nào. */
  example: string;
};

export const SAT_VOCAB_CATEGORY_LABEL: Record<SatVocabCategory, string> = {
  ...MATH_DOMAIN_LABEL,
  foundations: 'Số học nền tảng',
  word_problem_language: 'Cụm từ trong đề bài',
};

export const SAT_VOCAB_CATEGORY_BLURB: Record<SatVocabCategory, string> = {
  foundations: 'Phép tính và tính chất số cơ bản — nền cho mọi domain, không riêng ai.',
  algebra: 'Biến, biểu thức, phương trình và bất phương trình bậc nhất.',
  advanced_math: 'Hàm số, đa thức, phương trình bậc hai và các hàm không tuyến tính.',
  problem_solving_data: 'Tỉ lệ, phần trăm, thống kê mô tả và xác suất.',
  geometry_trig: 'Hình học phẳng, hình khối và lượng giác.',
  word_problem_language:
    'Không phải thuật ngữ toán — là cách ĐỀ BÀI diễn đạt điều kiện bằng tiếng Anh. Sai chỗ này là hiểu sai đề dù tính đúng.',
};

/**
 * Thứ tự hiển thị: từ nền tảng nhất tới cụm từ đề bài.
 *
 * `foundations` đứng đầu vì nó là những từ ai cũng cần bất kể đang ôn domain
 * nào. `word_problem_language` đứng cuối vì nó không phải "kiến thức" mà là
 * "cách đọc đề" — hợp lý nhất khi người học đã quen mặt chữ thuật ngữ trước.
 */
export const SAT_VOCAB_CATEGORY_ORDER: SatVocabCategory[] = [
  'foundations',
  'algebra',
  'advanced_math',
  'problem_solving_data',
  'geometry_trig',
  'word_problem_language',
];

const SAT_VOCAB_TERMS_BASE: SatVocabTerm[] = [
  // ---------------------------------------------------------- foundations
  {
    term: 'sum',
    category: 'foundations',
    meaningVi: 'tổng',
    definitionEn: 'The result of adding two or more numbers together.',
    example: 'The sum of 8 and 5 is 13.',
  },
  {
    term: 'difference',
    category: 'foundations',
    meaningVi: 'hiệu',
    definitionEn: 'The result of subtracting one number from another.',
    example: 'The difference between 10 and 4 is 6.',
  },
  {
    term: 'product',
    category: 'foundations',
    meaningVi: 'tích',
    definitionEn: 'The result of multiplying two or more numbers together.',
    example: 'The product of 3 and 7 is 21.',
  },
  {
    term: 'quotient',
    category: 'foundations',
    meaningVi: 'thương',
    definitionEn: 'The result of dividing one number by another.',
    example: 'The quotient of 20 divided by 4 is 5.',
  },
  {
    term: 'remainder',
    category: 'foundations',
    meaningVi: 'số dư',
    definitionEn: 'The amount left over when one number does not divide evenly into another.',
    example: 'When 17 is divided by 5, the remainder is 2.',
  },
  {
    term: 'integer',
    category: 'foundations',
    meaningVi: 'số nguyên',
    definitionEn: 'A whole number that can be positive, negative, or zero, with no fractional part.',
    example: '−3, 0, and 7 are all integers, but 2.5 is not.',
  },
  {
    term: 'digit',
    category: 'foundations',
    meaningVi: 'chữ số',
    definitionEn: 'One of the single symbols 0–9 used to write a number.',
    example: 'In the number 4,308, the digit in the hundreds place is 3.',
  },
  {
    term: 'prime number',
    category: 'foundations',
    meaningVi: 'số nguyên tố',
    definitionEn: 'A whole number greater than 1 with exactly two factors: 1 and itself.',
    example: '7 is a prime number because it can only be divided evenly by 1 and 7.',
  },
  {
    term: 'even number',
    category: 'foundations',
    meaningVi: 'số chẵn',
    definitionEn: 'A whole number that can be divided by 2 with no remainder.',
    example: '4, 6, and 10 are even numbers.',
  },
  {
    term: 'odd number',
    category: 'foundations',
    meaningVi: 'số lẻ',
    definitionEn: 'A whole number that cannot be divided evenly by 2.',
    example: '3, 7, and 11 are odd numbers.',
  },
  {
    term: 'multiple',
    category: 'foundations',
    meaningVi: 'bội số',
    definitionEn: 'A number that is the product of a given number and an integer.',
    example: '12 is a multiple of 3 because 3 × 4 = 12.',
  },
  {
    term: 'factor',
    category: 'foundations',
    meaningVi: 'ước số',
    definitionEn: 'A whole number that divides evenly into another number, leaving no remainder.',
    example: 'The number 12 has six factors: 1, 2, 3, 4, 6, and 12.',
  },
  {
    term: 'absolute value',
    category: 'foundations',
    meaningVi: 'giá trị tuyệt đối',
    definitionEn: 'The distance of a number from zero on the number line, always zero or positive.',
    example: 'The absolute value of −7 is 7.',
  },

  // --------------------------------------------------------------- algebra
  {
    term: 'variable',
    category: 'algebra',
    meaningVi: 'biến số',
    definitionEn: 'A symbol, usually a letter, that represents an unknown or changeable number.',
    example: 'In the equation 2x + 5 = 11, x is the variable.',
  },
  {
    term: 'coefficient',
    category: 'algebra',
    meaningVi: 'hệ số',
    definitionEn: 'The number multiplied by a variable in a term.',
    example: 'In the expression 7y, the coefficient of y is 7.',
  },
  {
    term: 'constant',
    category: 'algebra',
    meaningVi: 'hằng số',
    definitionEn: 'A fixed value in an expression or equation that does not change.',
    example: 'In the expression 3x + 8, the number 8 is a constant.',
  },
  {
    term: 'expression',
    category: 'algebra',
    meaningVi: 'biểu thức',
    definitionEn: 'A combination of numbers, variables, and operations with no equals sign.',
    example: '4x − 9 is an algebraic expression, not an equation.',
  },
  {
    term: 'equation',
    category: 'algebra',
    meaningVi: 'phương trình',
    definitionEn: 'A mathematical statement that two expressions are equal, joined by an equals sign.',
    example: 'The equation 5x = 20 has the solution x = 4.',
  },
  {
    term: 'inequality',
    category: 'algebra',
    meaningVi: 'bất phương trình',
    definitionEn: 'A mathematical statement comparing two expressions using <, >, ≤, or ≥.',
    example: 'The inequality x + 3 > 10 means x must be greater than 7.',
  },
  {
    term: 'solve for',
    category: 'algebra',
    meaningVi: 'giải tìm (ẩn)',
    definitionEn: 'To find the value of a variable that makes an equation or inequality true.',
    example: 'Solve for y in the equation 3y − 4 = 11.',
  },
  {
    term: 'substitute',
    category: 'algebra',
    meaningVi: 'thay số, thế vào',
    definitionEn: 'To replace a variable with a given number or expression.',
    example: 'Substitute x = 2 into the expression 5x + 1 to get 11.',
  },
  {
    term: 'simplify',
    category: 'algebra',
    meaningVi: 'rút gọn',
    definitionEn: 'To rewrite an expression in its shortest, clearest form by combining like terms.',
    example: 'Simplify the expression 4x + 3x to get 7x.',
  },
  {
    term: 'expand',
    category: 'algebra',
    meaningVi: 'khai triển',
    definitionEn: 'To rewrite a multiplied expression, such as (x + 2)(x − 3), as a sum of terms.',
    example: 'Expand (x + 2)(x − 3) to get x² − x − 6.',
  },
  {
    term: 'quadratic equation',
    category: 'algebra',
    meaningVi: 'phương trình bậc hai',
    definitionEn: 'An equation containing a variable raised to the second power, written ax² + bx + c = 0.',
    example: 'The quadratic equation x² − 5x + 6 = 0 has two solutions.',
  },
  {
    term: 'linear equation',
    category: 'algebra',
    meaningVi: 'phương trình bậc nhất',
    definitionEn: 'An equation whose graph is a straight line, with every variable raised only to the first power.',
    example: 'y = 3x + 2 is a linear equation.',
  },
  {
    term: 'system of equations',
    category: 'algebra',
    meaningVi: 'hệ phương trình',
    definitionEn: 'Two or more equations considered together that share the same variables.',
    example: 'The system of equations x + y = 10 and x − y = 4 has exactly one solution.',
  },
  {
    term: 'slope',
    category: 'algebra',
    meaningVi: 'hệ số góc, độ dốc',
    definitionEn: 'A number describing the steepness and direction of a line, calculated as rise over run.',
    example: 'A line with a slope of 2 rises 2 units for every 1 unit it moves to the right.',
  },
  {
    term: 'y-intercept',
    category: 'algebra',
    meaningVi: 'giao điểm với trục tung',
    definitionEn: 'The point where a line or curve crosses the y-axis, where x = 0.',
    example: 'In the equation y = 3x + 5, the y-intercept is 5.',
  },

  // --------------------------------------------------------- advanced_math
  {
    term: 'function',
    category: 'advanced_math',
    meaningVi: 'hàm số',
    definitionEn: 'A rule that assigns exactly one output to each input.',
    example: 'The function f(x) = x² squares whatever input it is given.',
  },
  {
    term: 'domain',
    category: 'advanced_math',
    meaningVi: 'miền xác định',
    definitionEn: 'The complete set of possible input values for a function.',
    example: 'The domain of f(x) = 1/x excludes x = 0.',
  },
  {
    term: 'range',
    category: 'advanced_math',
    meaningVi: 'miền giá trị (của hàm số)',
    definitionEn: 'The complete set of possible output values a function can produce.',
    example: 'The range of f(x) = x² is all values greater than or equal to 0.',
  },
  {
    term: 'exponent',
    category: 'advanced_math',
    meaningVi: 'số mũ',
    definitionEn: 'A number showing how many times a base is multiplied by itself.',
    example: 'In 2⁵, the exponent 5 tells you to multiply 2 by itself five times.',
  },
  {
    term: 'polynomial',
    category: 'advanced_math',
    meaningVi: 'đa thức',
    definitionEn:
      'An expression made of variables and coefficients combined with addition, subtraction, and whole-number exponents.',
    example: '3x² + 2x − 7 is a polynomial with three terms.',
  },
  {
    term: 'parabola',
    category: 'advanced_math',
    meaningVi: 'parabol',
    definitionEn: 'The U-shaped curve formed when a quadratic function is graphed.',
    example: 'The graph of y = x² is a parabola that opens upward.',
  },
  {
    term: 'vertex',
    category: 'advanced_math',
    meaningVi: 'đỉnh (của parabol)',
    definitionEn: 'The highest or lowest point on a parabola.',
    example: 'The vertex of the parabola y = (x − 2)² + 3 is the point (2, 3).',
  },
  {
    term: 'root',
    category: 'advanced_math',
    meaningVi: 'nghiệm',
    definitionEn:
      'A value of x that makes a function equal to zero, where its graph crosses the x-axis. Also called a "zero" of the function.',
    example: 'The roots of x² − 9 = 0 are x = 3 and x = −3.',
  },
  {
    term: 'exponential function',
    category: 'advanced_math',
    meaningVi: 'hàm số mũ',
    definitionEn: 'A function in which the variable appears in the exponent, modeling repeated multiplication.',
    example: 'Population growth is often modeled with an exponential function.',
  },
  {
    term: 'rational expression',
    category: 'advanced_math',
    meaningVi: 'biểu thức phân thức',
    definitionEn: 'An expression written as one polynomial divided by another.',
    example: '(x + 1)/(x − 3) is a rational expression.',
  },
  {
    term: 'radical',
    category: 'advanced_math',
    meaningVi: 'căn thức',
    definitionEn: 'An expression that includes a root symbol, such as a square root.',
    example: '√16 is a radical expression equal to 4.',
  },
  {
    term: 'reciprocal',
    category: 'advanced_math',
    meaningVi: 'số nghịch đảo',
    definitionEn: 'The value obtained by flipping a number so that its numerator and denominator switch places.',
    example: 'The reciprocal of 4 is 1/4, and the reciprocal of 2/3 is 3/2.',
  },

  // ---------------------------------------------------- problem_solving_data
  {
    term: 'ratio',
    category: 'problem_solving_data',
    meaningVi: 'tỉ số',
    definitionEn: 'A comparison of two quantities showing how many times one contains the other.',
    example: 'The ratio of boys to girls in the class is 3 to 2.',
  },
  {
    term: 'proportion',
    category: 'problem_solving_data',
    meaningVi: 'tỉ lệ thức',
    definitionEn: 'An equation stating that two ratios are equal.',
    example: 'The proportion 3/4 = 6/8 shows two equal ratios.',
  },
  {
    term: 'percentage',
    category: 'problem_solving_data',
    meaningVi: 'tỉ lệ phần trăm',
    definitionEn: 'A number expressed as a fraction of 100.',
    example: 'A 25 percent discount means the price is reduced by 25 out of every 100 dollars.',
  },
  {
    term: 'mean',
    category: 'problem_solving_data',
    meaningVi: 'trung bình cộng',
    definitionEn: 'The sum of a set of values divided by how many values there are; also called the average.',
    example: 'The mean of 4, 6, and 8 is 6.',
  },
  {
    term: 'median',
    category: 'problem_solving_data',
    meaningVi: 'trung vị',
    definitionEn: 'The middle value in a data set when the values are arranged in order.',
    example: 'The median of the set 2, 5, 9 is 5.',
  },
  {
    term: 'mode',
    category: 'problem_solving_data',
    meaningVi: 'mốt (giá trị lặp nhiều nhất)',
    definitionEn: 'The value that appears most frequently in a data set.',
    example: 'In the set 3, 3, 5, 7, the mode is 3.',
  },
  {
    term: 'range',
    category: 'problem_solving_data',
    meaningVi: 'khoảng biến thiên (của dữ liệu)',
    definitionEn: 'The difference between the highest and lowest values in a data set.',
    example: 'If the highest score is 95 and the lowest is 60, the range is 35.',
  },
  {
    term: 'outlier',
    category: 'problem_solving_data',
    meaningVi: 'giá trị ngoại lai',
    definitionEn: 'A data point that is significantly different from the other values in a set.',
    example: 'The score of 20 is an outlier compared to the rest of the scores, which are all above 80.',
  },
  {
    term: 'correlation',
    category: 'problem_solving_data',
    meaningVi: 'tương quan',
    definitionEn: 'A statistical relationship between two variables, describing how they tend to change together.',
    example: 'There is a positive correlation between study time and test scores.',
  },
  {
    term: 'probability',
    category: 'problem_solving_data',
    meaningVi: 'xác suất',
    definitionEn: 'A number between 0 and 1 describing how likely an event is to happen.',
    example: 'The probability of flipping heads on a fair coin is 1/2.',
  },
  {
    term: 'sample',
    category: 'problem_solving_data',
    meaningVi: 'mẫu (khảo sát)',
    definitionEn: 'A smaller group selected from a larger population to represent it in a study.',
    example: 'Researchers surveyed a sample of 200 students instead of the entire school.',
  },
  {
    term: 'data set',
    category: 'problem_solving_data',
    meaningVi: 'tập dữ liệu',
    definitionEn: 'A collection of related numbers or values being studied.',
    example: 'The data set includes the test scores of 30 students.',
  },
  {
    term: 'scatterplot',
    category: 'problem_solving_data',
    meaningVi: 'biểu đồ phân tán',
    definitionEn: 'A graph that uses dots to show the relationship between two numerical variables.',
    example: 'The scatterplot shows a clear upward trend between hours studied and scores earned.',
  },

  // -------------------------------------------------------------- geometry_trig
  {
    term: 'perimeter',
    category: 'geometry_trig',
    meaningVi: 'chu vi',
    definitionEn: 'The total distance around the outside of a two-dimensional shape.',
    example: 'The perimeter of a rectangle with sides 4 and 6 is 20.',
  },
  {
    term: 'area',
    category: 'geometry_trig',
    meaningVi: 'diện tích',
    definitionEn: 'The amount of space inside a two-dimensional shape.',
    example: 'The area of a square with side length 5 is 25.',
  },
  {
    term: 'circumference',
    category: 'geometry_trig',
    meaningVi: 'chu vi đường tròn',
    definitionEn: 'The distance around a circle.',
    example: 'The circumference of a circle is found using the formula 2πr.',
  },
  {
    term: 'radius',
    category: 'geometry_trig',
    meaningVi: 'bán kính',
    definitionEn: 'The distance from the center of a circle to any point on its edge.',
    example: 'A circle with a radius of 3 has a diameter of 6.',
  },
  {
    term: 'diameter',
    category: 'geometry_trig',
    meaningVi: 'đường kính',
    definitionEn: 'A straight line through the center of a circle connecting two points on the circle, equal to twice the radius.',
    example: 'The diameter of the wheel is 24 inches.',
  },
  {
    term: 'congruent',
    category: 'geometry_trig',
    meaningVi: 'bằng nhau (đồng dạng và bằng nhau)',
    definitionEn: 'Having exactly the same size and shape.',
    example: 'The two triangles are congruent because all their corresponding sides are equal.',
  },
  {
    term: 'similar',
    category: 'geometry_trig',
    meaningVi: 'đồng dạng',
    definitionEn: 'Having the same shape but not necessarily the same size, with proportional corresponding sides.',
    example: 'The two rectangles are similar because their side ratios are equal.',
  },
  {
    term: 'parallel',
    category: 'geometry_trig',
    meaningVi: 'song song',
    definitionEn: 'Describing two lines that never meet and stay the same distance apart.',
    example: 'Line AB is parallel to line CD.',
  },
  {
    term: 'perpendicular',
    category: 'geometry_trig',
    meaningVi: 'vuông góc',
    definitionEn: 'Describing two lines that meet at a 90-degree angle.',
    example: 'The two walls of the room are perpendicular to each other.',
  },
  {
    term: 'hypotenuse',
    category: 'geometry_trig',
    meaningVi: 'cạnh huyền',
    definitionEn: 'The longest side of a right triangle, opposite the right angle.',
    example: 'In a right triangle, the hypotenuse is always the side opposite the 90-degree angle.',
  },
  {
    term: 'volume',
    category: 'geometry_trig',
    meaningVi: 'thể tích',
    definitionEn: 'The amount of three-dimensional space an object takes up.',
    example: "The box's volume is found by multiplying its length, width, and height.",
  },
  {
    term: 'angle',
    category: 'geometry_trig',
    meaningVi: 'góc',
    definitionEn: 'The figure formed by two rays sharing a common endpoint, measured in degrees.',
    example: 'A right angle measures exactly 90 degrees.',
  },
  {
    term: 'supplementary angles',
    category: 'geometry_trig',
    meaningVi: 'hai góc bù nhau (tổng 180°)',
    definitionEn: 'Two angles whose measures add up to 180 degrees.',
    example: 'If one angle measures 110 degrees, its supplementary angle measures 70 degrees.',
  },
  {
    term: 'complementary angles',
    category: 'geometry_trig',
    meaningVi: 'hai góc phụ nhau (tổng 90°)',
    definitionEn: 'Two angles whose measures add up to 90 degrees.',
    example: 'A 30-degree angle and a 60-degree angle are complementary.',
  },

  // ------------------------------------------------- word_problem_language
  {
    term: 'at least',
    category: 'word_problem_language',
    meaningVi: 'ít nhất',
    definitionEn: 'A phrase meaning "greater than or equal to."',
    example: "Mia needs at least 20 points to pass, so her score must be 20 or more.",
  },
  {
    term: 'at most',
    category: 'word_problem_language',
    meaningVi: 'nhiều nhất, không quá',
    definitionEn: 'A phrase meaning "less than or equal to."',
    example: 'The elevator can carry at most 10 people at one time.',
  },
  {
    term: 'no more than',
    category: 'word_problem_language',
    meaningVi: 'không nhiều hơn',
    definitionEn: 'Another way of saying "at most," meaning "less than or equal to."',
    example: 'The box can weigh no more than 15 kilograms.',
  },
  {
    term: 'no less than',
    category: 'word_problem_language',
    meaningVi: 'không ít hơn',
    definitionEn: 'Another way of saying "at least," meaning "greater than or equal to."',
    example: 'Applicants must be no less than 18 years old.',
  },
  {
    term: 'is directly proportional to',
    category: 'word_problem_language',
    meaningVi: 'tỉ lệ thuận với',
    definitionEn: 'A phrase describing two quantities that increase or decrease together at a constant rate.',
    example: 'The distance traveled is directly proportional to time when speed stays constant.',
  },
  {
    term: 'is inversely proportional to',
    category: 'word_problem_language',
    meaningVi: 'tỉ lệ nghịch với',
    definitionEn: 'A phrase describing two quantities where one increases as the other decreases, keeping their product constant.',
    example: 'The time needed for a trip is inversely proportional to speed.',
  },
  {
    term: 'in terms of',
    category: 'word_problem_language',
    meaningVi: 'theo (một biến khác)',
    definitionEn: 'A phrase asking for one quantity to be expressed using another variable.',
    example: 'Write the area of the rectangle in terms of its width, w.',
  },
  {
    term: 'is a factor of',
    category: 'word_problem_language',
    meaningVi: 'là ước số của',
    definitionEn: 'A phrase meaning one number divides evenly into another.',
    example: 'Since 4 is a factor of 20, dividing 20 by 4 leaves no remainder.',
  },
  {
    term: 'is a multiple of',
    category: 'word_problem_language',
    meaningVi: 'là bội số của',
    definitionEn: 'A phrase meaning a number is the product of another number and an integer.',
    example: '15 is a multiple of 5 because 5 × 3 = 15.',
  },
  {
    term: 'consecutive integers',
    category: 'word_problem_language',
    meaningVi: 'các số nguyên liên tiếp',
    definitionEn: 'Whole numbers that follow each other in order, each one more than the last.',
    example: '5, 6, and 7 are three consecutive integers.',
  },
  {
    term: 'is equivalent to',
    category: 'word_problem_language',
    meaningVi: 'tương đương với',
    definitionEn: 'A phrase meaning two expressions or values have the same worth or meaning.',
    example: 'The expression 2(x + 3) is equivalent to 2x + 6.',
  },
  {
    term: 'which of the following',
    category: 'word_problem_language',
    meaningVi: 'trong các đáp án sau, đáp án nào',
    definitionEn: 'A common phrase introducing the answer choices in a multiple-choice question.',
    example: 'Which of the following values of x satisfies the equation?',
  },
  {
    term: 'must be true',
    category: 'word_problem_language',
    meaningVi: 'chắc chắn đúng',
    definitionEn: 'A phrase asking which statement is always correct given the stated conditions.',
    example: 'Given that x > 0, which of the following statements must be true?',
  },
  {
    term: 'the greatest possible value',
    category: 'word_problem_language',
    meaningVi: 'giá trị lớn nhất có thể',
    definitionEn: 'A phrase asking for the maximum value that satisfies the given conditions.',
    example: 'Find the greatest possible value of x that satisfies the inequality.',
  },
  {
    term: 'the value of x that satisfies',
    category: 'word_problem_language',
    meaningVi: 'giá trị của x thoả mãn',
    definitionEn: 'A phrase asking for the specific number that makes an equation or inequality true.',
    example: 'Find the value of x that satisfies the equation 2x + 3 = 11.',
  },
];

/** Kho đầy đủ: bộ gốc + bộ bổ sung 30/09/2026 (mỗi mảng ≥ 30 thuật ngữ). */
export const SAT_VOCAB_TERMS: SatVocabTerm[] = [...SAT_VOCAB_TERMS_BASE, ...SAT_VOCAB_TERMS_MORE];

export const SAT_VOCAB_TOTALS = {
  terms: SAT_VOCAB_TERMS.length,
  categories: SAT_VOCAB_CATEGORY_ORDER.length,
};

export function groupSatVocabByCategory(
  terms: SatVocabTerm[] = SAT_VOCAB_TERMS,
): { category: SatVocabCategory; terms: SatVocabTerm[] }[] {
  return SAT_VOCAB_CATEGORY_ORDER.map((category) => ({
    category,
    terms: terms.filter((t) => t.category === category),
  })).filter((g) => g.terms.length > 0);
}

/**
 * Khoá để lưu vào sổ từ (`useVocabStore`).
 *
 * KHÔNG dùng `lemmatize()` của `services/dictionary/lookup.ts` — hàm đó cắt
 * đuôi động từ tiếng Anh (running → run) bằng regex CHỈ AN TOÀN cho một từ
 * đơn. Đưa một cụm như "at least" qua nó sẽ mất khoảng trắng và ra "atleast",
 * một khoá vô nghĩa. Ở đây khoá chỉ cần ỔN ĐỊNH và DUY NHẤT cho mỗi term, nên
 * chuẩn hoá hoa/thường và khoảng trắng là đủ, không cần bóc hình thái từ.
 */
export function satVocabLemma(term: string): string {
  return term.trim().toLowerCase();
}
