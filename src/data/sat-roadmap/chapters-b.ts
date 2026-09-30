import type { RoadChapter } from './types';

/**
 * Chương 15 – 27 của lộ trình. Bám THỨ TỰ mục và kiến thức của giáo trình,
 * nhưng câu chữ lý thuyết, ví dụ và số liệu đều tự viết. `bookSet` là bộ bài
 * bám sách: mỗi phần tử ứng với một bài tập cuối chương, đúng thứ tự, dựng từ
 * template cùng dạng (xem `src/services/math/templates/panda-d.ts`).
 */
export const CHAPTERS_B: RoadChapter[] = [
  {
    n: 15,
    id: 'quadratics',
    title: { vi: 'Hàm bậc hai', en: 'Quadratics' },
    phase: 3,
    art: 'rocket',
    bookPages: [126, 140],
    subtopics: [
      { vi: 'Tìm nghiệm bằng phân tích nhân tử', en: 'Finding the roots by factoring' },
      { vi: 'Tổng và tích hai nghiệm', en: 'Sum and product of the roots' },
      { vi: 'Đỉnh, trục đối xứng, giá trị lớn nhất / nhỏ nhất', en: 'The vertex, axis of symmetry, maximum and minimum' },
      { vi: 'Dạng đỉnh và hoàn thành bình phương', en: 'Vertex form and completing the square' },
      { vi: 'Biệt thức và số nghiệm', en: 'The discriminant and the number of solutions' },
      { vi: 'Công thức nghiệm', en: 'The quadratic formula' },
      { vi: 'Giao điểm của parabol với đường thẳng', en: 'Where a parabola meets a line' },
    ],
    theory: [
      {
        title: { vi: 'Nghiệm = giao điểm với trục hoành', en: 'Roots are x-intercepts' },
        body: {
          vi: 'Nghiệm (hay "zero") của y = ax² + bx + c là các giá trị x làm y = 0 — chính là hoành độ các điểm đồ thị cắt trục hoành. Cách nhanh nhất là phân tích thành tích hai nhân tử rồi cho từng nhân tử bằng 0. Khi a khác 1, tìm hai số có tích bằng a·c và tổng bằng b để tách số hạng giữa.',
          en: 'The roots (or zeros) of y = ax² + bx + c are the x-values that make y = 0 — the x-coordinates where the graph crosses the x-axis. The fastest route is to factor into two factors and set each factor to 0. When a is not 1, find two numbers whose product is a·c and whose sum is b to split the middle term.',
        },
        formula: '2x^2 - 7x + 3 = (2x - 1)(x - 3) = 0  →  x = frac(1,2)  or  x = 3',
      },
      {
        title: { vi: 'Tổng và tích hai nghiệm', en: 'Sum and product of the roots' },
        body: {
          vi: 'Với ax² + bx + c = 0 (đã chuyển hết về một vế), tổng hai nghiệm là −b/a và tích là c/a — không cần giải. Công thức vẫn đúng cả khi nghiệm là số vô tỉ. Nhớ khai triển và chuyển vế TRƯỚC khi đọc a, b, c.',
          en: 'For ax² + bx + c = 0 (with everything on one side), the roots add to −b/a and multiply to c/a — no solving needed. This still works when the roots are irrational. Expand and move every term to one side BEFORE reading a, b and c.',
        },
        formula: 'x_1 + x_2 = frac(-b,a)    x_1 x_2 = frac(c,a)',
      },
      {
        title: { vi: 'Đỉnh nằm chính giữa hai nghiệm', en: 'The vertex sits halfway between the roots' },
        body: {
          vi: 'Parabol đối xứng qua đường thẳng đứng đi qua đỉnh, nên hoành độ đỉnh là trung bình cộng hai nghiệm, cũng bằng −b/(2a). Thay hoành độ đó vào hàm để được tung độ đỉnh. a > 0 thì parabol mở lên và đỉnh là điểm thấp nhất (giá trị nhỏ nhất); a < 0 thì mở xuống và đỉnh là điểm cao nhất.',
          en: 'A parabola is symmetric about the vertical line through its vertex, so the vertex x-coordinate is the average of the roots, which is also −b/(2a). Plug it in to get the y-coordinate. If a > 0 the parabola opens up and the vertex is the lowest point (minimum); if a < 0 it opens down and the vertex is the highest point (maximum).',
        },
        formula: 'x_(đỉnh) = frac(x_1 + x_2,2) = frac(-b,2a)',
      },
      {
        title: { vi: 'Dạng đỉnh', en: 'Vertex form' },
        body: {
          vi: 'y = a(x − h)² + k có đỉnh (h, k). Dấu trong ngoặc NGƯỢC với hoành độ đỉnh: (x + 3)² ứng với h = −3. Hằng số k là giá trị lớn nhất (a < 0) hoặc nhỏ nhất (a > 0) của hàm, nên đây là dạng "hiển thị" cực trị.',
          en: 'y = a(x − h)² + k has vertex (h, k). The sign inside the parentheses is OPPOSITE the vertex x-coordinate: (x + 3)² means h = −3. The constant k is the maximum (a < 0) or minimum (a > 0) value, so this is the form that "displays" the extreme value.',
        },
        formula: 'y = a(x - h)^2 + k',
      },
      {
        title: { vi: 'Hoàn thành bình phương', en: 'Completing the square' },
        body: {
          vi: 'Để đưa y = x² + bx + c về dạng đỉnh: lấy nửa hệ số của x, bình phương, cộng rồi trừ đúng lượng đó. Nếu hệ số của x² khác 1, đặt nó ra ngoài (hoặc chia cả phương trình) TRƯỚC. Cách này cũng dùng để giải phương trình khi không phân tích được nhân tử.',
          en: 'To turn y = x² + bx + c into vertex form: take half the x-coefficient, square it, add it and subtract it. If the x² coefficient is not 1, factor it out (or divide the equation by it) FIRST. The same move solves equations that do not factor nicely.',
        },
        formula: 'x^2 - 6x + 11 = (x^2 - 6x + 9) - 9 + 11 = (x - 3)^2 + 2',
      },
      {
        title: { vi: 'Biệt thức', en: 'The discriminant' },
        body: {
          vi: 'b² − 4ac > 0: hai nghiệm thực (cắt trục hoành hai lần); = 0: một nghiệm kép (đỉnh nằm trên trục hoành); < 0: không có nghiệm thực (không cắt trục hoành). Dùng khi đề hỏi SỐ nghiệm, hoặc hỏi hằng số nào để có đúng một/hai/không nghiệm.',
          en: 'b² − 4ac > 0: two real roots (crosses the x-axis twice); = 0: one double root (the vertex touches the x-axis); < 0: no real roots (misses the x-axis). Use it when a question asks HOW MANY solutions, or which constant gives exactly one, two or no solutions.',
        },
        formula: 'Δ = b^2 - 4ac',
      },
      {
        title: { vi: 'Công thức nghiệm', en: 'The quadratic formula' },
        body: {
          vi: 'Giải được mọi phương trình bậc hai. Chia cả tử cho 2a — kể cả phần căn — rồi rút gọn căn. Nghiệm vô tỉ luôn đi thành cặp p ± √q, đối xứng quanh hoành độ đỉnh.',
          en: 'Solves any quadratic equation. Divide the whole numerator — including the square-root part — by 2a, then simplify the radical. Irrational roots always come in pairs p ± √q, symmetric about the vertex.',
        },
        formula: 'x = frac(-b ± sqrt(b^2 - 4ac),2a)',
      },
      {
        title: { vi: 'Parabol gặp đường thẳng', en: 'A parabola meeting a line' },
        body: {
          vi: 'Giao điểm của y = ax² + bx + c với một đường thẳng (kể cả đường nằm ngang y = k) tìm bằng cách cho hai vế bằng nhau, chuyển về một vế rồi giải. Số giao điểm là số nghiệm, nên biệt thức của phương trình đó cho biết có 0, 1 hay 2 giao điểm. Đừng quên thay x trở lại để lấy tung độ nếu đề hỏi điểm.',
          en: 'To find where y = ax² + bx + c meets a line (including a horizontal line y = k), set the two expressions equal, move everything to one side and solve. The number of intersection points is the number of solutions, so that equation’s discriminant tells you 0, 1 or 2. If the question asks for the points, plug x back in for y.',
        },
        formula: 'x^2 + bx + c = mx + d  →  x^2 + (b - m)x + (c - d) = 0',
      },
      {
        title: { vi: 'Mô hình bậc hai trong bài toán thực tế', en: 'Quadratic models in context' },
        body: {
          vi: 'Chiều cao vật ném, lợi nhuận theo giá… thường là hàm bậc hai. "Lớn nhất / nhỏ nhất" là đỉnh; "khi nào bằng 0 / hoà vốn" là nghiệm. Loại nghiệm âm nếu đại lượng không thể âm (thời gian, số sản phẩm).',
          en: 'Heights of thrown objects, profit versus price and similar situations are often quadratic. "Greatest / least" means the vertex; "when does it equal 0 / break even" means the roots. Discard a negative root when the quantity cannot be negative (time, number of items).',
        },
      },
    ],
    examples: [
      {
        problem: 'What is the sum of the solutions to 2x^2 - 7x - 15 = 0?',
        steps: [
          { vi: 'Đọc a = 2, b = −7. Tổng hai nghiệm là −b/a.', en: 'Read a = 2, b = −7. The sum of the roots is −b/a.' },
          { vi: '−(−7)/2 = 7/2 (kiểm: nghiệm là 5 và −3/2).', en: '−(−7)/2 = 7/2 (check: the roots are 5 and −3/2).' },
        ],
        answer: 'frac(7,2)',
      },
      {
        problem: 'The function f is defined by f(x) = x^2 - 6x + 11. What is the minimum value of f(x)?',
        steps: [
          { vi: 'Hoàn thành bình phương: nửa của −6 là −3, bình phương là 9.', en: 'Complete the square: half of −6 is −3, and its square is 9.' },
          { vi: 'f(x) = (x − 3)² + 2, nên giá trị nhỏ nhất là 2 (tại x = 3).', en: 'f(x) = (x − 3)² + 2, so the minimum value is 2 (at x = 3).' },
        ],
        answer: '2',
      },
      {
        problem: 'For what value of k does the line y = k intersect the graph of y = x^2 + 4x + 1 at exactly one point?',
        steps: [
          { vi: 'Đường nằm ngang chỉ chạm parabol một lần tại đỉnh.', en: 'A horizontal line touches the parabola exactly once at the vertex.' },
          { vi: 'Hoành độ đỉnh −4/2 = −2; tung độ 4 − 8 + 1 = −3. Vậy k = −3.', en: 'Vertex x = −4/2 = −2; y = 4 − 8 + 1 = −3. So k = −3.' },
        ],
        answer: '-3',
      },
      {
        problem: 'At which points do the graphs of y = x^2 - 2x - 3 and y = x + 1 intersect?',
        steps: [
          { vi: 'Cho bằng nhau: x² − 3x − 4 = 0, tức (x − 4)(x + 1) = 0.', en: 'Set them equal: x² − 3x − 4 = 0, so (x − 4)(x + 1) = 0.' },
          { vi: 'x = 4 cho y = 5; x = −1 cho y = 0.', en: 'x = 4 gives y = 5; x = −1 gives y = 0.' },
        ],
        answer: '(4, 5) and (-1, 0)',
      },
      {
        problem: 'The height, in meters, of a ball t seconds after it is thrown is h(t) = -5t^2 + 20t + 1. What is the greatest height the ball reaches?',
        steps: [
          { vi: 'Hệ số của t² âm nên đỉnh là điểm cao nhất; t = −20/(2 · (−5)) = 2.', en: 'The t² coefficient is negative, so the vertex is the highest point; t = −20/(2 · (−5)) = 2.' },
          { vi: 'h(2) = −20 + 40 + 1 = 21 mét.', en: 'h(2) = −20 + 40 + 1 = 21 meters.' },
        ],
        answer: '21',
      },
    ],
    traps: [
      { vi: 'Đọc đỉnh của (x + 3)² là x = 3 (phải là −3).', en: 'Reading the vertex of (x + 3)² as x = 3 (it is −3).' },
      { vi: 'Hoàn thành bình phương khi hệ số của x² chưa bằng 1.', en: 'Completing the square before the x² coefficient has been made 1.' },
      { vi: 'Đọc a, b, c trước khi chuyển hết về một vế (nhất là khi vế phải khác 0).', en: 'Reading a, b and c before moving everything to one side (especially when the right side is not 0).' },
      { vi: 'Chia −b cho 2a nhưng quên chia phần căn trong công thức nghiệm.', en: 'Dividing −b by 2a but forgetting to divide the square-root part in the quadratic formula.' },
      { vi: 'Giữ nghiệm âm khi đại lượng thực tế không thể âm.', en: 'Keeping a negative root when the real-world quantity cannot be negative.' },
    ],
    templates: {
      easy: ['pd-d-quad-intercept-distance', 'adv-vertex-form-extreme'],
      medium: ['pd-d-quad-irrational-roots', 'pd-d-quad-fraction-root', 'pd-d-quad-smaller-root-square', 'pd-d-quad-line-meets-vertex', 'pd-d-quad-vertex-root-equation', 'pd-d-quad-max-time', 'pd-d-quad-form-shows-extreme', 'adv-quadratic-positive-root', 'adv-discriminant-count', 'adv-quadratic-sum-of-roots'],
      hard: ['pd-d-quad-sum-expanded', 'pd-d-quad-system-two-solutions', 'pd-d-quad-break-even', 'pd-d-quad-one-solution-a', 'pd-d-quad-factored-vertex-a', 'pd-d-quad-line-parabola-shared', 'adv-parabola-vertex-from-roots'],
    },
    bookSet: [
      { slug: 'pd-d-quad-intercept-distance', calc: false },
      { slug: 'pd-d-quad-irrational-roots', calc: false },
      { slug: 'pd-d-quad-fraction-root', calc: false },
      { slug: 'pd-d-quad-smaller-root-square', calc: false },
      { slug: 'pd-d-quad-sum-expanded', calc: false },
      { slug: 'pd-d-quad-system-two-solutions', calc: false },
      { slug: 'pd-d-quad-line-meets-vertex', calc: true },
      { slug: 'pd-d-quad-vertex-root-equation', calc: true },
      { slug: 'pd-d-quad-max-time', calc: true },
      { slug: 'pd-d-quad-break-even', calc: true },
      { slug: 'pd-d-quad-one-solution-a', calc: true },
      { slug: 'pd-d-quad-form-shows-extreme', calc: true },
      { slug: 'pd-d-quad-factored-vertex-a', calc: true },
      { slug: 'pd-d-quad-line-parabola-shared', calc: true },
    ],
  },
  {
    n: 16,
    id: 'synthetic-division',
    title: { vi: 'Chia đa thức (Horner)', en: 'Synthetic Division' },
    phase: 3,
    art: 'notebook',
    bookPages: [141, 149],
    subtopics: [
      { vi: 'Thương, số dư và cách viết kết quả phép chia', en: 'Quotient, remainder and how to write the result' },
      { vi: 'Chia Horner từng bước', en: 'Synthetic division step by step' },
      { vi: 'Đồng nhất hai vế thay cho phép chia', en: 'Matching both sides instead of dividing' },
      { vi: 'Thay số để kiểm các lựa chọn', en: 'Plugging in numbers to test the choices' },
      { vi: 'Định lý số dư', en: 'The remainder theorem' },
      { vi: 'Nhân tử và nghiệm', en: 'Factors and roots' },
    ],
    theory: [
      {
        title: { vi: 'Bị chia = số chia × thương + số dư', en: 'Dividend = divisor × quotient + remainder' },
        body: {
          vi: 'Chia đa thức giống chia số: 17 ÷ 5 được 3 dư 2, viết 3 + 2/5. Với đa thức, kết quả viết thành thương cộng với phân số "số dư trên số chia". Mọi dạng bài đều quy về đẳng thức bị chia = số chia × thương + số dư.',
          en: 'Dividing polynomials works like dividing numbers: 17 ÷ 5 is 3 remainder 2, written 3 + 2/5. For polynomials the result is written as the quotient plus the fraction "remainder over divisor". Every problem type comes back to dividend = divisor × quotient + remainder.',
        },
        formula: 'frac(p(x),x - a) = q(x) + frac(r,x - a)  ⇔  p(x) = (x - a)q(x) + r',
      },
      {
        title: { vi: 'Chia Horner (synthetic division)', en: 'Synthetic division' },
        body: {
          vi: 'Chỉ dùng khi chia cho nhị thức bậc nhất x − a. Viết a ở góc trái và hàng hệ số của bị chia — nhớ ghi 0 cho bậc bị thiếu. Hạ hệ số đầu xuống, nhân với a, cộng vào cột kế, lặp lại. Hàng cuối (trừ số cuối) là hệ số của thương, số cuối là số dư. Chia cho 2x − 1 thì dùng a = 1/2 rồi chia các hệ số thương cho 2.',
          en: 'Works only for a linear divisor x − a. Write a in the corner and the dividend’s coefficients in a row — put 0 for any missing power. Bring down the first coefficient, multiply by a, add to the next column, and repeat. The bottom row (except the last number) gives the quotient’s coefficients; the last number is the remainder. For 2x − 1, use a = 1/2 and then divide the quotient’s coefficients by 2.',
        },
      },
      {
        title: { vi: 'Đồng nhất hệ số', en: 'Matching coefficients' },
        body: {
          vi: 'Khi đề cho dạng p(x) = A(x + d) + B hoặc (ax + b)(x − d) + e, khai triển vế phải rồi cho hệ số từng bậc hai vế bằng nhau. Thường nhanh hơn chia thật và ít sai dấu hơn.',
          en: 'When a problem gives a form like p(x) = A(x + d) + B or (ax + b)(x − d) + e, expand the right side and set the coefficients of each power equal on both sides. Usually faster than dividing and less prone to sign slips.',
        },
        formula: '2x^2 - 4x - 3 = (ax + b)(x + 1) + c',
      },
      {
        title: { vi: 'Thay số để loại lựa chọn', en: 'Plug in numbers to eliminate choices' },
        body: {
          vi: 'Hai biểu thức tương đương thì bằng nhau tại MỌI x. Chọn một giá trị dễ (x = 0, x = 2…, tránh giá trị làm mẫu bằng 0), tính biểu thức gốc và từng lựa chọn; lựa chọn cho giá trị khác thì loại.',
          en: 'Equivalent expressions agree for EVERY x. Pick an easy value (x = 0, x = 2…, avoiding values that make a denominator 0), evaluate the original and each choice, and eliminate any choice that gives a different value.',
        },
      },
      {
        title: { vi: 'Định lý số dư', en: 'The remainder theorem' },
        body: {
          vi: 'Số dư khi chia p(x) cho x − a chính là p(a), vì thay x = a làm số hạng (x − a)q(x) biến mất. Chia cho x + a thì thay x = −a; chia cho 2x − 1 thì thay x = 1/2.',
          en: 'The remainder when p(x) is divided by x − a is simply p(a), because plugging in x = a wipes out the (x − a)q(x) term. For x + a, plug in x = −a; for 2x − 1, plug in x = 1/2.',
        },
        formula: 'p(x) = (x - a)q(x) + r  →  p(a) = r',
      },
      {
        title: { vi: 'Nhân tử ⇔ nghiệm', en: 'Factor ⇔ root' },
        body: {
          vi: 'x − a là nhân tử của p(x) khi và chỉ khi p(a) = 0 (số dư bằng 0). Biết p(a) = 0 thì x − a CHẮC CHẮN là nhân tử; biết p(b) = 5 thì x − b không phải nhân tử. Nghiệm phân số a/b cho nhân tử bx − a. Dùng p(a) = 0 để tìm hệ số chưa biết.',
          en: 'x − a is a factor of p(x) exactly when p(a) = 0 (remainder 0). Knowing p(a) = 0 means x − a MUST be a factor; knowing p(b) = 5 means x − b is not. A fractional root a/b gives the factor bx − a. Use p(a) = 0 to solve for an unknown coefficient.',
        },
      },
    ],
    examples: [
      {
        problem: 'Which of the following is equivalent to frac(3x,x - 4)?',
        steps: [
          { vi: 'Viết tử theo số chia: 3x = 3(x − 4) + 12.', en: 'Write the numerator in terms of the divisor: 3x = 3(x − 4) + 12.' },
          { vi: 'Tách phân số: 3 + 12/(x − 4).', en: 'Split the fraction: 3 + 12/(x − 4).' },
        ],
        answer: '3 + frac(12,x - 4)',
      },
      {
        problem: 'What is the remainder when 2x^3 - x + 5 is divided by x + 2?',
        steps: [
          { vi: 'Định lý số dư: thay x = −2.', en: 'Remainder theorem: plug in x = −2.' },
          { vi: '2(−8) − (−2) + 5 = −16 + 2 + 5 = −9.', en: '2(−8) − (−2) + 5 = −16 + 2 + 5 = −9.' },
        ],
        answer: '-9',
      },
      {
        problem: 'The expression 6x^2 + x - 5 can be written as A(2x - 1) + R, where A is a polynomial and R is a constant. What is R?',
        steps: [
          { vi: 'Cho 2x − 1 = 0, tức x = 1/2, để số hạng chứa A biến mất.', en: 'Let 2x − 1 = 0, so x = 1/2, making the A term vanish.' },
          { vi: 'R = 6(1/4) + 1/2 − 5 = −2.', en: 'R = 6(1/4) + 1/2 − 5 = −2.' },
        ],
        answer: '-2',
      },
      {
        problem: 'In the polynomial p(x) = x^3 - kx^2 + 2x + 8, k is a constant. If x - 2 is a factor of p(x), what is k?',
        steps: [
          { vi: 'x − 2 là nhân tử nên p(2) = 0: 8 − 4k + 4 + 8 = 0.', en: 'x − 2 is a factor, so p(2) = 0: 8 − 4k + 4 + 8 = 0.' },
          { vi: '4k = 20, k = 5.', en: '4k = 20, k = 5.' },
        ],
        answer: '5',
      },
    ],
    traps: [
      { vi: 'Chia cho x + 2 mà thay x = 2 (phải thay x = −2).', en: 'Dividing by x + 2 but plugging in x = 2 (it should be −2).' },
      { vi: 'Quên ghi hệ số 0 cho bậc bị thiếu khi chia Horner.', en: 'Forgetting to write a 0 for a missing power in synthetic division.' },
      { vi: 'Gộp số dư vào thương, hoặc sai dấu số dư khi đề viết dạng "A − số/(số chia)".', en: 'Folding the remainder into the quotient, or getting its sign wrong when the problem writes "A − number/(divisor)".' },
      { vi: 'Nghĩ p(b) = 5 cho nhân tử x − 5 (nhầm giá trị hàm với nghiệm).', en: 'Thinking p(b) = 5 gives the factor x − 5 (mixing up an output with a root).' },
    ],
    templates: {
      easy: ['pd-d-div-linear-over-linear', 'pd-d-div-table-remainder', 'pd-remainder-theorem'],
      medium: ['pd-d-div-find-quotient', 'pd-d-div-factor-k-grid', 'pd-d-div-identity-quotient', 'pd-d-div-root-to-factor', 'pd-d-div-which-divisible', 'pd-polynomial-factor-k'],
      hard: ['pd-d-div-remainder-fraction', 'pd-d-div-identity-sum', 'pd-d-div-roman-factors', 'pd-d-div-two-factors-a', 'pd-d-div-fraction-root-factor', 'pd-poly-division-quotient'],
    },
    bookSet: [
      { slug: 'pd-d-div-linear-over-linear', calc: false },
      { slug: 'pd-d-div-find-quotient', calc: false },
      { slug: 'pd-d-div-remainder-fraction', calc: false },
      { slug: 'pd-d-div-table-remainder', calc: false },
      { slug: 'pd-d-div-factor-k-grid', calc: false },
      { slug: 'pd-d-div-find-quotient', calc: true },
      { slug: 'pd-d-div-identity-quotient', calc: true },
      { slug: 'pd-d-div-identity-sum', calc: true },
      { slug: 'pd-d-div-root-to-factor', calc: true },
      { slug: 'pd-d-div-roman-factors', calc: true },
      { slug: 'pd-d-div-which-divisible', calc: true },
      { slug: 'pd-d-div-two-factors-a', calc: true },
      { slug: 'pd-d-div-fraction-root-factor', calc: true },
    ],
  },
  {
    n: 17,
    id: 'complex-numbers',
    title: { vi: 'Số phức', en: 'Complex Numbers' },
    phase: 3,
    art: 'star',
    bookPages: [150, 153],
    subtopics: [
      { vi: 'Đơn vị ảo i và luỹ thừa của i', en: 'The imaginary unit and powers of i' },
      { vi: 'Cộng và trừ số phức', en: 'Adding and subtracting' },
      { vi: 'Nhân số phức', en: 'Multiplying' },
      { vi: 'Chia số phức bằng số liên hợp', en: 'Dividing with the conjugate' },
    ],
    theory: [
      {
        title: { vi: 'Đơn vị ảo', en: 'The imaginary unit' },
        body: {
          vi: 'i là số có bình phương bằng −1, tức i = √−1. Số phức có dạng a + bi, với a là phần thực và b là phần ảo.',
          en: 'i is the number whose square is −1, that is, i = √−1. A complex number has the form a + bi, where a is the real part and b is the imaginary part.',
        },
        formula: 'i = sqrt(-1)    i^2 = -1',
      },
      {
        title: { vi: 'Luỹ thừa của i lặp theo chu kỳ 4', en: 'Powers of i repeat every 4' },
        body: {
          vi: 'i¹ = i, i² = −1, i³ = −i, i⁴ = 1, rồi lặp lại. Với số mũ lớn, bỏ đi mọi bội của 4 (vì i⁴ = 1) và chỉ nhìn số dư khi chia số mũ cho 4.',
          en: 'i¹ = i, i² = −1, i³ = −i, i⁴ = 1, and then the cycle repeats. For a large exponent, drop every multiple of 4 (since i⁴ = 1) and look only at the remainder when the exponent is divided by 4.',
        },
        formula: 'i^(4k + r) = i^r',
      },
      {
        title: { vi: 'Cộng, trừ', en: 'Adding and subtracting' },
        body: {
          vi: 'Gộp phần thực với phần thực, phần ảo với phần ảo, như gộp số hạng đồng dạng. Dấu trừ trước ngoặc đổi dấu CẢ HAI phần.',
          en: 'Combine real with real and imaginary with imaginary, just like like terms. A minus sign in front of parentheses changes the sign of BOTH parts.',
        },
        formula: '(a + bi) - (c + di) = (a - c) + (b - d)i',
      },
      {
        title: { vi: 'Nhân', en: 'Multiplying' },
        body: {
          vi: 'Nhân phân phối (FOIL) như hai nhị thức, rồi thay i² bằng −1. Tích hai phần ảo trở thành số thực và ĐỔI DẤU.',
          en: 'Distribute (FOIL) as with two binomials, then replace i² with −1. The product of the two imaginary parts becomes a real number with its sign CHANGED.',
        },
        formula: '(a + bi)(c + di) = (ac - bd) + (ad + bc)i',
      },
      {
        title: { vi: 'Chia: nhân với số liên hợp', en: 'Dividing: multiply by the conjugate' },
        body: {
          vi: 'Số liên hợp của c + di là c − di. Nhân cả tử và mẫu với số liên hợp của mẫu: mẫu thành c² + d² (số thực), rồi chia từng phần của tử. Mẫu chỉ có i (như 1/i) thì nhân tử và mẫu với i.',
          en: 'The conjugate of c + di is c − di. Multiply the numerator and the denominator by the conjugate of the denominator: the denominator becomes c² + d² (a real number), then divide each part of the numerator. If the denominator is just i (as in 1/i), multiply top and bottom by i.',
        },
        formula: 'frac(a + bi,c + di) = frac((a + bi)(c - di),c^2 + d^2)    frac(1,i) = -i',
      },
    ],
    examples: [
      {
        problem: 'Which of the following is equivalent to (4 + 3i)(2 - 5i), where i = sqrt(-1)?',
        steps: [
          { vi: 'FOIL: 8 − 20i + 6i − 15i².', en: 'FOIL: 8 − 20i + 6i − 15i².' },
          { vi: 'i² = −1: 8 + 15 − 14i = 23 − 14i.', en: 'i² = −1: 8 + 15 − 14i = 23 − 14i.' },
        ],
        answer: '23 - 14i',
      },
      {
        problem: 'What is the value of i^58 + i^3, where i = sqrt(-1)?',
        steps: [
          { vi: '58 = 4 · 14 + 2 nên i⁵⁸ = i² = −1; i³ = −i.', en: '58 = 4 · 14 + 2, so i⁵⁸ = i² = −1; i³ = −i.' },
          { vi: 'Tổng là −1 − i.', en: 'The sum is −1 − i.' },
        ],
        answer: '-1 - i',
      },
      {
        problem: 'Which of the following is equivalent to frac(5 + i,2 - 3i), where i = sqrt(-1)?',
        steps: [
          { vi: 'Nhân tử và mẫu với 2 + 3i. Mẫu: 4 + 9 = 13.', en: 'Multiply top and bottom by 2 + 3i. Denominator: 4 + 9 = 13.' },
          { vi: 'Tử: 10 + 15i + 2i + 3i² = 7 + 17i. Kết quả 7/13 + (17/13)i.', en: 'Numerator: 10 + 15i + 2i + 3i² = 7 + 17i. Result 7/13 + (17/13)i.' },
        ],
        answer: 'frac(7,13) + frac(17,13)i',
      },
    ],
    traps: [
      { vi: 'Coi i² = 1 khi nhân.', en: 'Treating i² as 1 when multiplying.' },
      { vi: 'Trừ số phức mà chỉ đổi dấu phần thực.', en: 'Subtracting complex numbers but changing the sign of only the real part.' },
      { vi: 'Chia riêng phần thực cho phần thực, phần ảo cho phần ảo.', en: 'Dividing real by real and imaginary by imaginary separately.' },
      { vi: 'Nghĩ 1/i = i (thật ra 1/i = −i).', en: 'Thinking 1/i = i (actually 1/i = −i).' },
    ],
    templates: {
      easy: ['pd-d-cx-subtract', 'pd-d-cx-i-times', 'pd-complex-add'],
      medium: ['pd-d-cx-power-sum', 'pd-d-cx-product-real-part', 'pd-d-cx-distribute-combine', 'pd-d-cx-i-distribute-diff', 'pd-d-cx-big-power', 'pd-d-cx-square', 'pd-complex-multiply'],
      hard: ['pd-d-cx-reciprocal-powers', 'pd-d-cx-divide-pure', 'pd-complex-divide'],
    },
    bookSet: [
      { slug: 'pd-d-cx-subtract', calc: false },
      { slug: 'pd-d-cx-i-times', calc: false },
      { slug: 'pd-d-cx-power-sum', calc: false },
      { slug: 'pd-d-cx-product-real-part', calc: false },
      { slug: 'pd-d-cx-distribute-combine', calc: false },
      { slug: 'pd-d-cx-i-distribute-diff', calc: false },
      { slug: 'pd-d-cx-big-power', calc: false },
      { slug: 'pd-d-cx-square', calc: false },
      { slug: 'pd-complex-multiply', calc: false },
      { slug: 'pd-d-cx-reciprocal-powers', calc: false },
      { slug: 'pd-d-cx-divide-pure', calc: false },
      { slug: 'pd-complex-divide', calc: false },
    ],
  },
  {
    n: 18,
    id: 'absolute-value',
    title: { vi: 'Giá trị tuyệt đối', en: 'Absolute Value' },
    phase: 3,
    art: 'magnifier',
    bookPages: [154, 159],
    subtopics: [
      { vi: 'Giá trị tuyệt đối là khoảng cách', en: 'Absolute value as distance' },
      { vi: 'Phương trình trị tuyệt đối', en: 'Absolute value equations' },
      { vi: 'Bất phương trình và đếm nghiệm nguyên', en: 'Inequalities and counting integer solutions' },
      { vi: 'Bài toán dung sai', en: 'Tolerance word problems' },
      { vi: 'Đồ thị hình chữ V và đồ thị |f(x)|', en: 'V-shaped graphs and the graph of |f(x)|' },
    ],
    theory: [
      {
        title: { vi: 'Khoảng cách tới 0', en: 'Distance from 0' },
        body: {
          vi: '|x| là khoảng cách từ x tới 0 trên trục số nên không bao giờ âm; |x − a| là khoảng cách giữa x và a. Vì thế |…| = số âm là vô nghiệm, và |…| + c nhỏ nhất bằng c.',
          en: '|x| is the distance from x to 0 on the number line, so it is never negative; |x − a| is the distance between x and a. So |…| = a negative number has no solution, and |…| + c is at least c.',
        },
        formula: '|x - a| = khoảng cách từ x tới a',
      },
      {
        title: { vi: 'Phương trình: hai trường hợp', en: 'Equations: two cases' },
        body: {
          vi: '|biểu thức| = b (b > 0) cho hai phương trình: biểu thức = b hoặc biểu thức = −b. Giải cả hai; bỏ sót một nhánh là lỗi phổ biến nhất. Nếu đề cho thêm điều kiện (x < a…) thì chỉ giữ nhánh phù hợp.',
          en: '|expression| = b (b > 0) gives two equations: expression = b or expression = −b. Solve both; dropping one branch is the most common error. If the problem adds a condition (x < a…), keep only the branch that fits.',
        },
        formula: '|x - a| = b  ⇔  x = a + b  hoặc  x = a - b',
      },
      {
        title: { vi: 'Bất phương trình: "kẹp" hoặc "ra ngoài"', en: 'Inequalities: "between" or "outside"' },
        body: {
          vi: '|x − a| < b nghĩa là x cách a ít hơn b: a − b < x < a + b (một khoảng). |x − a| > b nghĩa là x ở ngoài: x < a − b hoặc x > a + b. Đếm số nguyên trong khoảng mở: không lấy hai đầu mút.',
          en: '|x − a| < b means x is within b of a: a − b < x < a + b (one interval). |x − a| > b means x is outside: x < a − b or x > a + b. When counting integers in an open interval, leave out the endpoints.',
        },
        formula: '|x - a| < b  ⇔  a - b < x < a + b',
      },
      {
        title: { vi: 'Dung sai: tâm và nửa độ rộng', en: 'Tolerance: center and half-width' },
        body: {
          vi: 'Giá trị hợp lệ từ L tới H (tính cả hai đầu) viết được thành |x − tâm| ≤ nửa độ rộng, với tâm = (L + H)/2 và nửa độ rộng = (H − L)/2.',
          en: 'Acceptable values from L to H (inclusive) can be written as |x − center| ≤ half-width, where center = (L + H)/2 and half-width = (H − L)/2.',
        },
        formula: '|x - frac(L + H,2)| <= frac(H - L,2)',
      },
      {
        title: { vi: 'Đồ thị hình chữ V', en: 'V-shaped graphs' },
        body: {
          vi: 'y = |x| là chữ V đỉnh ở gốc. y = a|x − h| + k có đỉnh (h, k); a > 0 mở lên, a < 0 úp xuống, |a| là độ dốc hai nhánh. Để nhận dạng đồ thị, thay vài điểm dễ (như đỉnh, giao với trục tung) vào từng lựa chọn.',
          en: 'y = |x| is a V with its vertex at the origin. y = a|x − h| + k has vertex (h, k); a > 0 opens up, a < 0 opens down, and |a| is the steepness of the two arms. To identify a graph, plug a few easy points (the vertex, the y-intercept) into each choice.',
        },
        formula: 'y = a|x - h| + k',
      },
      {
        title: { vi: 'Đồ thị của |f(x)|', en: 'The graph of |f(x)|' },
        body: {
          vi: 'Phần đồ thị f nằm trên trục hoành giữ nguyên; phần nằm dưới được lật lên (đổi dấu tung độ). Trong bảng giá trị: giá trị âm đổi dấu, giá trị không âm giữ nguyên.',
          en: 'The part of the graph of f above the x-axis stays; the part below is flipped up (the y-values change sign). In a table: negative outputs change sign, nonnegative outputs stay.',
        },
      },
    ],
    examples: [
      {
        problem: 'How many integers x satisfy |x + 2| < 4?',
        steps: [
          { vi: '−4 < x + 2 < 4, tức −6 < x < 2.', en: '−4 < x + 2 < 4, so −6 < x < 2.' },
          { vi: 'Các số nguyên −5 tới 1: có 7 số.', en: 'The integers −5 through 1: 7 of them.' },
        ],
        answer: '7',
      },
      {
        problem: 'If |x - 7| = b and x > 7, what is x - b in terms of b?',
        steps: [
          { vi: 'x > 7 nên x − 7 dương: x − 7 = b, tức x = 7 + b.', en: 'x > 7, so x − 7 is positive: x − 7 = b, so x = 7 + b.' },
          { vi: 'x − b = 7.', en: 'x − b = 7.' },
        ],
        answer: '7',
      },
      {
        problem: 'A bag of flour is acceptable if its weight w, in grams, is from 995 to 1,005, inclusive. Which inequality describes all acceptable weights?',
        steps: [
          { vi: 'Tâm = (995 + 1005)/2 = 1000; nửa độ rộng = 5.', en: 'Center = (995 + 1005)/2 = 1000; half-width = 5.' },
          { vi: '|w − 1000| ≤ 5.', en: '|w − 1000| ≤ 5.' },
        ],
        answer: '|w - 1000| <= 5',
      },
    ],
    traps: [
      { vi: 'Chỉ giải nhánh dương của phương trình trị tuyệt đối.', en: 'Solving only the positive branch of an absolute value equation.' },
      { vi: 'Nhầm |x − a| > b thành một khoảng kẹp.', en: 'Turning |x − a| > b into a single "between" interval.' },
      { vi: 'Tính cả hai đầu mút khi đếm nghiệm của bất phương trình chặt.', en: 'Counting the endpoints for a strict inequality.' },
      { vi: 'Quên đổi dấu khi bỏ trị tuyệt đối của một biểu thức âm.', en: 'Forgetting the sign change when removing the bars from a negative expression.' },
    ],
    templates: {
      easy: ['pd-d-abs-of-quadratic', 'pd-d-abs-count-integers', 'pd-d-abs-reflect-values', 'pd-abs-evaluate'],
      medium: ['pd-d-abs-can-equal-negative', 'pd-d-abs-v-graph', 'adv-absolute-value-sum', 'pd-d-abs-tolerance-int'],
      hard: ['pd-d-abs-could-be', 'pd-d-abs-express', 'pd-d-abs-tolerance-fraction', 'pd-d-abs-product-extreme', 'pd-d-abs-roman-must', 'pd-abs-inequality'],
    },
    bookSet: [
      { slug: 'pd-d-abs-of-quadratic', calc: false },
      { slug: 'pd-d-abs-can-equal-negative', calc: false },
      { slug: 'pd-d-abs-v-graph', calc: false },
      { slug: 'pd-d-abs-could-be', calc: false },
      { slug: 'pd-d-abs-count-integers', calc: true },
      { slug: 'adv-absolute-value-sum', calc: true },
      { slug: 'pd-d-abs-reflect-values', calc: true },
      { slug: 'pd-d-abs-express', calc: true },
      { slug: 'pd-d-abs-tolerance-fraction', calc: true },
      { slug: 'pd-d-abs-tolerance-int', calc: true },
      { slug: 'pd-d-abs-product-extreme', calc: true },
      { slug: 'pd-d-abs-roman-must', calc: true },
    ],
  },
  {
    n: 19,
    id: 'angles',
    title: { vi: 'Góc', en: 'Angles' },
    phase: 4,
    art: 'pencil',
    bookPages: [160, 167],
    subtopics: [
      { vi: 'Góc đối đỉnh, kề bù, quanh một điểm', en: 'Vertical angles, linear pairs, angles around a point' },
      { vi: 'Tổng ba góc và định lý góc ngoài', en: 'Triangle sum and the exterior angle theorem' },
      { vi: 'Hai đường song song và cát tuyến', en: 'Parallel lines cut by a transversal' },
      { vi: 'Góc trong đa giác', en: 'Angles in polygons' },
    ],
    theory: [
      {
        title: { vi: 'Góc cơ bản', en: 'The basic facts' },
        body: {
          vi: 'Hai góc đối đỉnh bằng nhau. Các góc kề nhau trên một đường thẳng cộng lại 180°. Các góc quanh một điểm cộng lại 360°. Ba góc của tam giác cộng lại 180°.',
          en: 'Vertical angles are equal. Adjacent angles along a straight line add to 180°. Angles around a point add to 360°. The three angles of a triangle add to 180°.',
        },
        formula: 'A + B + C = 180deg',
      },
      {
        title: { vi: 'Định lý góc ngoài', en: 'The exterior angle theorem' },
        body: {
          vi: 'Góc ngoài của tam giác (tạo bởi một cạnh và phần kéo dài của cạnh kề) bằng tổng hai góc trong KHÔNG kề với nó. Rất hay dùng trong hình có tam giác lồng nhau: không cần tính góc thứ ba.',
          en: 'An exterior angle of a triangle (formed by one side and the extension of the next) equals the sum of the two interior angles NOT next to it. Very handy in figures with nested triangles: no need to find the third angle.',
        },
        formula: 'góc ngoài = A + B',
      },
      {
        title: { vi: 'Song song và cát tuyến', en: 'Parallel lines and a transversal' },
        body: {
          vi: 'Khi một cát tuyến cắt hai đường song song, tám góc chỉ có HAI số đo: mọi góc nhọn bằng nhau, mọi góc tù bằng nhau, và một góc nhọn cộng một góc tù bằng 180°. Tên gọi: đồng vị, so le trong (bằng nhau), trong cùng phía (bù nhau).',
          en: 'When a transversal cuts two parallel lines, the eight angles take only TWO values: all the acute angles are equal, all the obtuse angles are equal, and an acute plus an obtuse makes 180°. Names: corresponding and alternate interior (equal), same-side interior (supplementary).',
        },
      },
      {
        title: { vi: 'Kẻ thêm đường song song', en: 'Draw an extra parallel line' },
        body: {
          vi: 'Khi một góc "gãy khúc" nằm giữa hai đường song song, kẻ qua đỉnh góc một đường song song với chúng: góc đó tách thành hai góc so le, nên bằng tổng hai góc đã cho.',
          en: 'When a "bent" angle sits between two parallel lines, draw a line through its vertex parallel to them: the angle splits into two alternate angles, so it equals the sum of the two given angles.',
        },
      },
      {
        title: { vi: 'Tổng góc trong của đa giác', en: 'Interior angle sum of a polygon' },
        body: {
          vi: 'Từ một đỉnh kẻ các đường chéo, đa giác n cạnh chia thành n − 2 tam giác, nên tổng góc trong là 180(n − 2). Đa giác đều: mỗi góc bằng tổng chia n; mỗi góc ngoài bằng 360/n.',
          en: 'Diagonals from one vertex split an n-sided polygon into n − 2 triangles, so the interior angles add to 180(n − 2). In a regular polygon each angle is the sum divided by n; each exterior angle is 360/n.',
        },
        formula: 'S = 180(n - 2)    góc đều = frac(180(n - 2),n)',
      },
    ],
    examples: [
      {
        problem: 'In triangle ABC, side BC is extended through C to point D. If angle ACD measures 115deg and angle A measures 48deg, what is the measure of angle B?',
        steps: [
          { vi: 'Góc ngoài ACD = A + B.', en: 'Exterior angle ACD = A + B.' },
          { vi: 'B = 115 − 48 = 67°.', en: 'B = 115 − 48 = 67°.' },
        ],
        answer: '67',
      },
      {
        problem: 'Lines j and k are parallel. Point P lies between them. Segment PA meets j at an angle of 35deg and segment PB meets k at an angle of 50deg, both on the side facing P. What is angle APB?',
        steps: [
          { vi: 'Kẻ qua P đường song song với j và k.', en: 'Draw a line through P parallel to j and k.' },
          { vi: 'Hai phần là góc so le: 35 + 50 = 85°.', en: 'The two pieces are alternate angles: 35 + 50 = 85°.' },
        ],
        answer: '85',
      },
      {
        problem: 'What is the measure of each interior angle of a regular octagon?',
        steps: [
          { vi: 'Tổng = 180(8 − 2) = 1080°.', en: 'Sum = 180(8 − 2) = 1080°.' },
          { vi: 'Mỗi góc = 1080/8 = 135°.', en: 'Each angle = 1080/8 = 135°.' },
        ],
        answer: '135',
      },
    ],
    traps: [
      { vi: 'Nhầm góc bù (180°) với góc phụ (90°).', en: 'Confusing supplementary (180°) with complementary (90°).' },
      { vi: 'Coi hai góc trong cùng phía là bằng nhau (chúng bù nhau).', en: 'Treating same-side interior angles as equal (they are supplementary).' },
      { vi: 'Quên trừ 2 trong công thức 180(n − 2).', en: 'Forgetting the minus 2 in 180(n − 2).' },
      { vi: 'Tin vào hình vẽ khi đề ghi "không vẽ theo tỉ lệ".', en: 'Trusting the picture when it says "not drawn to scale".' },
    ],
    templates: {
      easy: ['pd-d-ang-exterior-find-interior', 'pd-d-ang-triangle-xy', 'pd-d-ang-three-lines', 'pd-d-ang-linear-pair', 'pd-supplementary-angles'],
      medium: ['pd-d-ang-cevian', 'pd-d-ang-two-transversals-sum', 'pd-d-ang-zigzag', 'pd-d-ang-bowtie', 'pd-d-ang-exterior-pair', 'pd-d-ang-polygon-sum-two', 'geo-parallel-lines-angle', 'geo-triangle-exterior-angle'],
      hard: ['pd-d-ang-cut-triangle', 'pd-d-ang-regular-perp', 'pd-d-ang-parallel-roman', 'pd-d-ang-dart', 'pd-d-ang-three-parallel', 'pd-polygon-interior'],
    },
    bookSet: [
      { slug: 'pd-d-ang-exterior-find-interior', calc: false },
      { slug: 'pd-d-ang-cevian', calc: false },
      { slug: 'pd-d-ang-two-transversals-sum', calc: false },
      { slug: 'pd-d-ang-triangle-xy', calc: false },
      { slug: 'pd-d-ang-zigzag', calc: false },
      { slug: 'pd-d-ang-cut-triangle', calc: false },
      { slug: 'pd-d-ang-three-lines', calc: true },
      { slug: 'pd-d-ang-bowtie', calc: true },
      { slug: 'pd-d-ang-linear-pair', calc: true },
      { slug: 'pd-d-ang-exterior-pair', calc: true },
      { slug: 'pd-d-ang-polygon-sum-two', calc: true },
      { slug: 'pd-d-ang-regular-perp', calc: true },
      { slug: 'pd-d-ang-parallel-roman', calc: true },
      { slug: 'pd-d-ang-dart', calc: true },
      { slug: 'pd-d-ang-three-parallel', calc: true },
    ],
  },
  {
    n: 20,
    id: 'triangles',
    title: { vi: 'Tam giác', en: 'Triangles' },
    phase: 4,
    art: 'pencil',
    bookPages: [168, 188],
    subtopics: [
      { vi: 'Bất đẳng thức tam giác', en: 'The triangle inequality' },
      { vi: 'Tam giác cân và tam giác đều', en: 'Isosceles and equilateral triangles' },
      { vi: 'Định lý Pythagoras và bộ ba Pythagoras', en: 'The Pythagorean theorem and Pythagorean triples' },
      { vi: 'Tam giác vuông đặc biệt 45-45-90 và 30-60-90', en: 'Special right triangles: 45-45-90 and 30-60-90' },
      { vi: 'Tam giác đồng dạng', en: 'Similar triangles' },
      { vi: 'Radian', en: 'Radians' },
    ],
    theory: [
      {
        title: { vi: 'Bất đẳng thức tam giác', en: 'The triangle inequality' },
        body: {
          vi: 'Tổng hai cạnh bất kỳ phải LỚN HƠN cạnh thứ ba; bằng nhau thì ba điểm thẳng hàng. Hệ quả: nếu biết hai cạnh p ≤ q thì cạnh thứ ba nằm giữa q − p và p + q (không lấy hai đầu). Chỉ cần kiểm tổng hai cạnh ngắn với cạnh dài nhất.',
          en: 'Any two sides must add to MORE than the third; if they are equal the three points lie on a line. So with two sides p ≤ q, the third side is strictly between q − p and p + q. You only need to check the two shorter sides against the longest.',
        },
        formula: 'q - p < c < p + q',
      },
      {
        title: { vi: 'Tam giác cân, tam giác đều', en: 'Isosceles and equilateral triangles' },
        body: {
          vi: 'Hai cạnh bằng nhau thì hai góc đối diện bằng nhau (và ngược lại). Tam giác đều có ba góc 60°. Cạnh dài hơn đối diện góc lớn hơn. Khi chỉ biết một góc của tam giác cân, xét cả hai trường hợp: góc đó là góc đỉnh hoặc góc đáy.',
          en: 'Equal sides face equal angles (and vice versa). An equilateral triangle has three 60° angles. A longer side faces a larger angle. When you know only one angle of an isosceles triangle, consider both cases: it is the vertex angle or a base angle.',
        },
      },
      {
        title: { vi: 'Định lý Pythagoras', en: 'The Pythagorean theorem' },
        body: {
          vi: 'Trong tam giác vuông, bình phương cạnh huyền (cạnh dài nhất, đối diện góc vuông) bằng tổng bình phương hai cạnh góc vuông. Nhớ các bộ ba 3-4-5, 5-12-13, 8-15-17, 7-24-25 và bội của chúng để khỏi tính.',
          en: 'In a right triangle, the square of the hypotenuse (the longest side, opposite the right angle) equals the sum of the squares of the legs. Memorize the triples 3-4-5, 5-12-13, 8-15-17, 7-24-25 and their multiples to skip the arithmetic.',
        },
        formula: 'a^2 + b^2 = c^2',
      },
      {
        title: { vi: 'Tam giác 45-45-90', en: 'The 45-45-90 triangle' },
        body: {
          vi: 'Tam giác vuông cân (nửa hình vuông): hai cạnh góc vuông bằng nhau, cạnh huyền bằng cạnh góc vuông nhân √2. Đường chéo hình vuông cạnh s là s√2.',
          en: 'The isosceles right triangle (half a square): the legs are equal and the hypotenuse is a leg times √2. The diagonal of a square with side s is s√2.',
        },
        formula: 'x,  x,  xsqrt(2)',
      },
      {
        title: { vi: 'Tam giác 30-60-90', en: 'The 30-60-90 triangle' },
        body: {
          vi: 'Nửa tam giác đều: cạnh đối diện 30° ngắn nhất (x), cạnh huyền gấp đôi (2x), cạnh đối diện 60° là x√3. Đường cao tam giác đều cạnh s là (s/2)√3, diện tích là (√3/4)s². Đừng nghĩ góc 60° gấp đôi góc 30° thì cạnh cũng gấp đôi.',
          en: 'Half of an equilateral triangle: the side opposite 30° is shortest (x), the hypotenuse is twice that (2x), and the side opposite 60° is x√3. The height of an equilateral triangle with side s is (s/2)√3 and its area is (√3/4)s². Do not assume the side opposite 60° is double the side opposite 30°.',
        },
        formula: 'x,  xsqrt(3),  2x',
      },
      {
        title: { vi: 'Tam giác đồng dạng', en: 'Similar triangles' },
        body: {
          vi: 'Hai tam giác có hai cặp góc bằng nhau thì đồng dạng: các cạnh tương ứng tỉ lệ cùng một hệ số k. Hay gặp: một đoạn song song với một cạnh cắt ra tam giác nhỏ; hình "nơ bướm" (hai góc đối đỉnh + hai đường song song); đường cao trong tam giác vuông. Chu vi tỉ lệ theo k, diện tích theo k².',
          en: 'Two triangles with two pairs of equal angles are similar: corresponding sides are in the same ratio k. Common setups: a segment parallel to one side cuts off a smaller triangle; the "bowtie" (vertical angles plus parallel lines); an altitude in a right triangle. Perimeters scale by k and areas by k².',
        },
        formula: 'frac(a,a_2) = frac(b,b_2) = frac(c,c_2) = k    frac(S,S_2) = k^2',
      },
      {
        title: { vi: 'Radian', en: 'Radians' },
        body: {
          vi: 'π radian = 180°. Đổi độ sang radian: nhân π/180; radian sang độ: nhân 180/π. Góc tạo bởi một đường thẳng và trục hoành có thể đọc từ tỉ số hai cạnh góc vuông (ví dụ hệ số góc √3 ứng với 60° = π/3).',
          en: 'π radians = 180°. Degrees to radians: multiply by π/180; radians to degrees: multiply by 180/π. The angle a line makes with the x-axis can be read from the ratio of the legs (for example, a slope of √3 means 60° = π/3).',
        },
        formula: 'π = 180deg',
      },
    ],
    examples: [
      {
        problem: 'Two sides of a triangle have lengths 6 and 14. How many integer lengths are possible for the third side?',
        steps: [
          { vi: '14 − 6 < c < 14 + 6, tức 8 < c < 20.', en: '14 − 6 < c < 14 + 6, so 8 < c < 20.' },
          { vi: 'Các số 9 tới 19: có 11 số.', en: 'The integers 9 through 19: 11 values.' },
        ],
        answer: '11',
      },
      {
        problem: 'The hypotenuse of a 45-45-90 triangle has length 10. What is the area of the triangle?',
        steps: [
          { vi: 'Cạnh góc vuông = 10/√2 = 5√2.', en: 'Each leg = 10/√2 = 5√2.' },
          { vi: 'Diện tích = ½(5√2)² = 25.', en: 'Area = ½(5√2)² = 25.' },
        ],
        answer: '25',
      },
      {
        problem: 'In a 30-60-90 triangle, the side opposite the 60deg angle has length 9. What is the length of the hypotenuse?',
        steps: [
          { vi: 'x√3 = 9 nên x = 9/√3 = 3√3.', en: 'x√3 = 9, so x = 9/√3 = 3√3.' },
          { vi: 'Cạnh huyền 2x = 6√3.', en: 'Hypotenuse 2x = 6√3.' },
        ],
        answer: '6sqrt(3)',
      },
      {
        problem: 'In triangle ABC, D is on AB and E is on AC with DE parallel to BC. If AD = 4, DB = 6, and DE = 5, what is BC?',
        steps: [
          { vi: 'Tam giác ADE đồng dạng ABC với tỉ số AD/AB = 4/10.', en: 'Triangle ADE is similar to ABC with ratio AD/AB = 4/10.' },
          { vi: 'BC = 5 · 10/4 = 12,5.', en: 'BC = 5 · 10/4 = 12.5.' },
        ],
        answer: 'frac(25,2)',
      },
    ],
    traps: [
      { vi: 'Cho phép tổng hai cạnh BẰNG cạnh thứ ba.', en: 'Allowing two sides to add up to exactly the third side.' },
      { vi: 'Chọn nhầm cạnh huyền (phải là cạnh dài nhất).', en: 'Picking the wrong side as the hypotenuse (it is the longest).' },
      { vi: 'Nghĩ cạnh đối diện 60° gấp đôi cạnh đối diện 30°.', en: 'Thinking the side opposite 60° is twice the side opposite 30°.' },
      { vi: 'Ghép nhầm cạnh tương ứng của hai tam giác đồng dạng.', en: 'Matching the wrong corresponding sides of similar triangles.' },
      { vi: 'Nhân diện tích với k thay vì k².', en: 'Scaling area by k instead of k².' },
    ],
    templates: {
      easy: ['pd-d-tri-pyth-setup', 'pd-d-tri-equilateral-parts', 'pd-d-tri-square-diagonal', 'pd-d-tri-third-side-extreme', 'pd-d-tri-deg-to-rad', 'geo-pythagorean-side', 'geo-isosceles-angle'],
      medium: ['pd-d-tri-bowtie-similar', 'pd-d-tri-isosceles-perimeter', 'pd-d-tri-roman-valid', 'pd-d-tri-isosceles-area', 'pd-d-tri-square-equilateral', 'pd-d-tri-similar-perimeter', 'pd-d-tri-count-third-sides', 'pd-d-tri-poles-rope', 'pd-d-tri-legs-hyp-plus', 'pd-d-tri-coord-angle-rad', 'pd-d-tri-inscribed-central', 'pd-d-tri-circle-in-square', 'pd-d-tri-roman-perimeters', 'geo-special-angle-missing-side', 'geo-triangle-angle-algebra'],
      hard: ['pd-d-tri-cone-slice', 'pd-d-tri-integer-perimeter-max', 'pd-d-tri-nested-parallel', 'pd-d-tri-right-parallel-inside', 'pd-d-tri-isosceles-angle-bound', 'pd-d-tri-right-trapezoid', 'pd-d-tri-square-corner-cut', 'pd-d-tri-parallel-intercepts', 'pd-d-tri-chain-special', 'pd-d-tri-inscribed-equilateral', 'pd-d-tri-two-triangles-diff', 'pd-d-tri-square-equilateral-angle', 'pd-d-tri-semicircle-square', 'pd-d-tri-isosceles-special-area', 'pd-d-tri-point-angle-rad', 'pd-d-tri-square-in-right', 'pd-d-tri-square-diag-intersect', 'pd-d-tri-altitude-similar', 'pd-similar-triangles'],
    },
    bookSet: [
      { slug: 'pd-d-tri-pyth-setup', calc: false },
      { slug: 'pd-d-tri-equilateral-parts', calc: false },
      { slug: 'pd-d-tri-square-diagonal', calc: false },
      { slug: 'pd-d-tri-bowtie-similar', calc: false },
      { slug: 'pd-d-tri-third-side-extreme', calc: false },
      { slug: 'pd-d-tri-isosceles-perimeter', calc: false },
      { slug: 'pd-d-tri-roman-valid', calc: false },
      { slug: 'pd-d-tri-isosceles-area', calc: false },
      { slug: 'pd-d-tri-square-equilateral', calc: false },
      { slug: 'pd-d-tri-cone-slice', calc: false },
      { slug: 'pd-d-tri-integer-perimeter-max', calc: false },
      { slug: 'pd-d-tri-nested-parallel', calc: false },
      { slug: 'pd-d-tri-deg-to-rad', calc: true },
      { slug: 'pd-d-tri-similar-perimeter', calc: true },
      { slug: 'pd-d-tri-count-third-sides', calc: true },
      { slug: 'pd-d-tri-right-parallel-inside', calc: true },
      { slug: 'pd-d-tri-isosceles-angle-bound', calc: true },
      { slug: 'pd-d-tri-poles-rope', calc: true },
      { slug: 'pd-d-tri-right-trapezoid', calc: true },
      { slug: 'pd-d-tri-legs-hyp-plus', calc: true },
      { slug: 'pd-d-tri-square-corner-cut', calc: true },
      { slug: 'pd-d-tri-coord-angle-rad', calc: true },
      { slug: 'pd-d-tri-parallel-intercepts', calc: true },
      { slug: 'pd-d-tri-inscribed-central', calc: true },
      { slug: 'pd-d-tri-chain-special', calc: true },
      { slug: 'pd-d-tri-circle-in-square', calc: true },
      { slug: 'pd-d-tri-roman-perimeters', calc: true },
      { slug: 'pd-d-tri-inscribed-equilateral', calc: true },
      { slug: 'pd-d-tri-two-triangles-diff', calc: true },
      { slug: 'pd-d-tri-square-equilateral-angle', calc: true },
      { slug: 'pd-d-tri-semicircle-square', calc: true },
      { slug: 'pd-d-tri-isosceles-special-area', calc: true },
      { slug: 'pd-d-tri-point-angle-rad', calc: true },
      { slug: 'pd-d-tri-square-in-right', calc: true },
      { slug: 'pd-d-tri-square-diag-intersect', calc: true },
      { slug: 'pd-d-tri-altitude-similar', calc: true },
    ],
  },
  {
    n: 21,
    id: 'circles',
    title: { vi: 'Đường tròn', en: 'Circles' },
    phase: 4,
    art: 'globe',
    bookPages: [189, 197],
    subtopics: [
      { vi: 'Diện tích, chu vi, độ dài cung, diện tích hình quạt', en: 'Area, circumference, arc length and sector area' },
      { vi: 'Góc ở tâm và góc nội tiếp', en: 'Central and inscribed angles' },
      { vi: 'Góc chắn nửa đường tròn, bán kính vuông góc tiếp tuyến', en: 'Angles in a semicircle; radius perpendicular to a tangent' },
      { vi: 'Phương trình đường tròn', en: 'The equation of a circle' },
      { vi: 'Diện tích phần tô đậm', en: 'Shaded regions' },
    ],
    theory: [
      {
        title: { vi: 'Công thức cơ bản', en: 'The basic formulas' },
        body: {
          vi: 'Diện tích πr², chu vi 2πr = πd. Hầu hết bài bắt đầu bằng việc tìm bán kính từ dữ kiện (diện tích, chu vi, đường kính, đường chéo hình vuông nội tiếp…).',
          en: 'Area πr², circumference 2πr = πd. Most problems start by getting the radius from whatever is given (area, circumference, diameter, the diagonal of an inscribed square…).',
        },
        formula: 'A = πr^2    C = 2πr',
      },
      {
        title: { vi: 'Cung và hình quạt: lấy phần của cả vòng', en: 'Arcs and sectors: take the fraction of the whole' },
        body: {
          vi: 'Góc ở tâm θ chiếm θ/360 của cả vòng tròn: độ dài cung = (θ/360)·2πr, diện tích quạt = (θ/360)·πr². Với radian: cung = rθ, diện tích quạt = ½r²θ. Chu vi một hình quạt gồm hai bán kính cộng độ dài cung.',
          en: 'A central angle θ is θ/360 of the full circle: arc length = (θ/360)·2πr and sector area = (θ/360)·πr². In radians: arc = rθ and sector area = ½r²θ. The perimeter of a sector is two radii plus the arc.',
        },
        formula: 'cung = frac(θ,360) · 2πr    quạt = frac(θ,360) · πr^2',
      },
      {
        title: { vi: 'Góc ở tâm và góc nội tiếp', en: 'Central and inscribed angles' },
        body: {
          vi: 'Số đo cung bằng góc ở tâm chắn nó. Góc nội tiếp (đỉnh nằm trên đường tròn) bằng NỬA số đo cung bị chắn. Phân biệt số đo cung (độ) với độ dài cung (đơn vị độ dài).',
          en: 'An arc’s measure equals the central angle that cuts it off. An inscribed angle (vertex on the circle) is HALF the arc it intercepts. Keep arc measure (degrees) separate from arc length (a distance).',
        },
        formula: 'góc nội tiếp = frac(1,2) · cung bị chắn',
      },
      {
        title: { vi: 'Nửa đường tròn và tiếp tuyến', en: 'Semicircles and tangents' },
        body: {
          vi: 'Góc nội tiếp chắn nửa đường tròn (một cạnh là đường kính) luôn là góc vuông. Bán kính tới tiếp điểm vuông góc với tiếp tuyến — hai sự kiện này biến rất nhiều bài đường tròn thành bài tam giác vuông.',
          en: 'An inscribed angle that intercepts a semicircle (a diameter as one side) is always a right angle. A radius drawn to the point of tangency is perpendicular to the tangent line — these two facts turn many circle problems into right-triangle problems.',
        },
      },
      {
        title: { vi: 'Phương trình đường tròn', en: 'The equation of a circle' },
        body: {
          vi: '(x − h)² + (y − k)² = r² là đường tròn tâm (h, k), bán kính r. Tâm lấy NGƯỢC dấu với số trong ngoặc; vế phải là r² chứ không phải r. Dạng khai triển thì hoàn thành bình phương hai lần (cho x và cho y). Đường tròn tiếp xúc trục hoành khi |k| = r, tiếp xúc trục tung khi |h| = r.',
          en: '(x − h)² + (y − k)² = r² is the circle with center (h, k) and radius r. The center has the OPPOSITE signs of the numbers in the parentheses; the right side is r², not r. From an expanded equation, complete the square twice (for x and for y). The circle touches the x-axis when |k| = r and the y-axis when |h| = r.',
        },
        formula: '(x - h)^2 + (y - k)^2 = r^2',
      },
      {
        title: { vi: 'Phần tô đậm = hình lớn − hình nhỏ', en: 'Shaded area = big shape − small shape' },
        body: {
          vi: 'Tìm diện tích phần tô đậm bằng cách lấy hình bao ngoài trừ phần không tô: vành khăn = πR² − πr²; hình viên phân = quạt − tam giác; khe giữa các hình tròn tiếp xúc = đa giác nối tâm − các phần quạt.',
          en: 'Find a shaded area as the outer shape minus the unshaded part: a ring = πR² − πr²; a segment = sector − triangle; the gap between tangent circles = the polygon joining the centers − the sectors inside it.',
        },
      },
    ],
    examples: [
      {
        problem: 'The outer circle of a ring has three times the radius of the inner circle. What is the ratio of the area of the ring to the area of the inner circle?',
        steps: [
          { vi: 'Bán kính trong r, ngoài 3r: vành khăn = 9πr² − πr² = 8πr².', en: 'Inner radius r, outer 3r: ring = 9πr² − πr² = 8πr².' },
          { vi: 'Tỉ số 8πr² : πr² = 8.', en: 'Ratio 8πr² : πr² = 8.' },
        ],
        answer: '8',
      },
      {
        problem: 'A circle has a diameter of 12. What is the length of the arc cut off by a central angle of 150deg?',
        steps: [
          { vi: 'r = 6; cung = (150/360) · 2π · 6.', en: 'r = 6; arc = (150/360) · 2π · 6.' },
          { vi: '= 5π.', en: '= 5π.' },
        ],
        answer: '5π',
      },
      {
        problem: 'What is the center of the circle x^2 + 8x + y^2 - 2y = 8?',
        steps: [
          { vi: 'Hoàn thành bình phương: (x + 4)² − 16 + (y − 1)² − 1 = 8.', en: 'Complete the square: (x + 4)² − 16 + (y − 1)² − 1 = 8.' },
          { vi: '(x + 4)² + (y − 1)² = 25: tâm (−4, 1), bán kính 5.', en: '(x + 4)² + (y − 1)² = 25: center (−4, 1), radius 5.' },
        ],
        answer: '(-4, 1)',
      },
    ],
    traps: [
      { vi: 'Dùng đường kính vào chỗ bán kính.', en: 'Using the diameter where the radius belongs.' },
      { vi: 'Đọc tâm (x − 3)² thành −3, hoặc lấy vế phải làm bán kính.', en: 'Reading the center of (x − 3)² as −3, or taking the right side as the radius.' },
      { vi: 'Quên rằng góc nội tiếp chỉ bằng NỬA cung bị chắn.', en: 'Forgetting that an inscribed angle is only HALF its arc.' },
      { vi: 'Chu vi hình quạt quên cộng hai bán kính.', en: 'Leaving out the two radii from a sector’s perimeter.' },
    ],
    templates: {
      easy: ['pd-d-cir-inscribed-polygon-arc', 'pd-d-cir-equation-center-area', 'pd-d-cir-cylinder-surface', 'pd-circle-diameter-easy'],
      medium: ['pd-d-cir-circles-on-diameter', 'pd-d-cir-sector-perimeter', 'pd-d-cir-inscribed-arc-fraction', 'pd-d-cir-diameter-chord-angle', 'pd-d-cir-equilateral-arc', 'geo-circle-circumference-area', 'geo-circle-arc-sector-pi', 'geo-circle-radius-from-point'],
      hard: ['pd-d-cir-sector-angle-rad', 'pd-d-cir-arc-integer-range', 'pd-d-cir-tangent-gap', 'pd-d-cir-two-circles-equilateral', 'pd-d-cir-tangent-lines-angle', 'pd-d-cir-tangent-circles-triangle', 'pd-d-cir-equation-roman', 'geo-circle-equation-radius'],
    },
    bookSet: [
      { slug: 'pd-d-cir-inscribed-polygon-arc', calc: true },
      { slug: 'pd-d-cir-circles-on-diameter', calc: true },
      { slug: 'pd-d-cir-sector-perimeter', calc: true },
      { slug: 'pd-d-cir-equation-center-area', calc: true },
      { slug: 'pd-d-cir-inscribed-arc-fraction', calc: true },
      { slug: 'pd-d-cir-diameter-chord-angle', calc: true },
      { slug: 'pd-d-cir-equilateral-arc', calc: true },
      { slug: 'pd-d-cir-sector-angle-rad', calc: true },
      { slug: 'pd-d-cir-arc-integer-range', calc: true },
      { slug: 'pd-d-cir-tangent-gap', calc: true },
      { slug: 'pd-d-cir-cylinder-surface', calc: true },
      { slug: 'pd-d-cir-two-circles-equilateral', calc: true },
      { slug: 'pd-d-cir-tangent-lines-angle', calc: true },
      { slug: 'pd-d-cir-tangent-circles-triangle', calc: true },
      { slug: 'pd-d-cir-equation-roman', calc: true },
    ],
  },
  {
    n: 22,
    id: 'trigonometry',
    title: { vi: 'Lượng giác', en: 'Trigonometry' },
    phase: 4,
    art: 'star',
    bookPages: [198, 204],
    subtopics: [
      { vi: 'SOH-CAH-TOA', en: 'SOH-CAH-TOA' },
      { vi: 'Tỉ số lượng giác chỉ phụ thuộc góc', en: 'Trig ratios depend only on the angle' },
      { vi: 'Góc phụ nhau: sin x = cos(90° − x)', en: 'Complementary angles: sin x = cos(90° − x)' },
      { vi: 'Dấu theo góc phần tư', en: 'Signs by quadrant' },
      { vi: 'Tính sin, cos, tan của góc đặc biệt', en: 'Evaluating special angles' },
    ],
    theory: [
      {
        title: { vi: 'SOH-CAH-TOA', en: 'SOH-CAH-TOA' },
        body: {
          vi: 'Với một góc nhọn của tam giác vuông: sin = đối/huyền, cos = kề/huyền, tan = đối/kề. Luôn xác định cạnh đối, cạnh kề THEO góc đang xét — đổi góc là đổi vai hai cạnh góc vuông.',
          en: 'For an acute angle of a right triangle: sin = opposite/hypotenuse, cos = adjacent/hypotenuse, tan = opposite/adjacent. Always name the opposite and adjacent sides relative to the angle in question — switching angles swaps the two legs.',
        },
        formula: 'sin x = frac(đối,huyền)    cos x = frac(kề,huyền)    tan x = frac(đối,kề)',
      },
      {
        title: { vi: 'Chỉ là một con số', en: 'Just a number' },
        body: {
          vi: 'Mọi tam giác vuông có cùng một góc nhọn đều đồng dạng, nên sin, cos, tan của góc đó là những con số cố định (sin 30° luôn là 1/2). Tam giác đồng dạng thì góc tương ứng có cùng tỉ số. "sin 2x" là một khối: không tách "sin" ra khỏi "2x" để rút gọn.',
          en: 'All right triangles with the same acute angle are similar, so sin, cos and tan of that angle are fixed numbers (sin 30° is always 1/2). In similar triangles, corresponding angles have the same ratios. "sin 2x" is one unit: you cannot pull "sin" apart from "2x" to cancel.',
        },
      },
      {
        title: { vi: 'Tìm tỉ số còn lại', en: 'Finding the other ratios' },
        body: {
          vi: 'Biết một tỉ số (ví dụ tan = 3/4 hay 0,75): vẽ tam giác vuông có hai cạnh theo tỉ số đó, dùng Pythagoras tìm cạnh thứ ba, rồi đọc mọi tỉ số khác.',
          en: 'Given one ratio (say tan = 3/4 or 0.75): sketch a right triangle with two sides in that ratio, find the third side with the Pythagorean theorem, then read off every other ratio.',
        },
        formula: 'tan x = frac(3,4)  →  cạnh 3, 4, 5  →  cos x = frac(4,5)',
      },
      {
        title: { vi: 'Góc phụ nhau', en: 'Complementary angles' },
        body: {
          vi: 'Hai góc nhọn của tam giác vuông cộng lại 90°, và cạnh đối của góc này là cạnh kề của góc kia. Vì thế sin x = cos(90° − x) và cos x = sin(90° − x); bằng radian, thay 90° bằng π/2. Nếu sin A = cos B với hai góc nhọn thì A + B = 90°.',
          en: 'The two acute angles of a right triangle add to 90°, and the side opposite one is adjacent to the other. So sin x = cos(90° − x) and cos x = sin(90° − x); in radians, replace 90° with π/2. If sin A = cos B for acute angles, then A + B = 90°.',
        },
        formula: 'sin x = cos(90deg - x)    cos x = sin(90deg - x)',
      },
      {
        title: { vi: 'Dấu theo góc phần tư', en: 'Signs by quadrant' },
        body: {
          vi: 'Góc phần tư I: cả sin, cos, tan dương. II: chỉ sin dương. III: chỉ tan dương. IV: chỉ cos dương. (Mẹo nhớ theo thứ tự "Tất cả – Sin – Tan – Cos".)',
          en: 'Quadrant I: sin, cos and tan are all positive. II: only sin is positive. III: only tan is positive. IV: only cos is positive. (Memory aid in order: "All – Sin – Tan – Cos".)',
        },
      },
      {
        title: { vi: 'Góc đặc biệt ở góc phần tư khác', en: 'Special angles in other quadrants' },
        body: {
          vi: 'Ba bước: (1) xác định dấu theo góc phần tư; (2) cộng/trừ bội của 90° (π/2) để về góc tham chiếu trong góc phần tư thứ nhất; (3) đọc giá trị từ tam giác 45-45-90 hoặc 30-60-90 rồi gắn dấu. Nhớ thêm: sin 0° = 0, cos 0° = 1, sin 90° = 1, cos 90° = 0, tan 90° không tồn tại.',
          en: 'Three steps: (1) decide the sign from the quadrant; (2) add or subtract multiples of 90° (π/2) to reach a reference angle in quadrant I; (3) read the value from the 45-45-90 or 30-60-90 triangle and attach the sign. Also memorize: sin 0° = 0, cos 0° = 1, sin 90° = 1, cos 90° = 0, and tan 90° does not exist.',
        },
        formula: 'sin 330deg = -sin 30deg = -frac(1,2)',
      },
    ],
    examples: [
      {
        problem: 'In a right triangle, tan x = 0.75. What is the value of sin x?',
        steps: [
          { vi: '0,75 = 3/4: cạnh đối 3, kề 4, huyền 5.', en: '0.75 = 3/4: opposite 3, adjacent 4, hypotenuse 5.' },
          { vi: 'sin x = 3/5.', en: 'sin x = 3/5.' },
        ],
        answer: 'frac(3,5)',
      },
      {
        problem: 'If sin(2m + 10)deg = cos(4m - 10)deg and both angles are acute, what is the value of m?',
        steps: [
          { vi: 'Hai góc phụ nhau: 2m + 10 + 4m − 10 = 90.', en: 'The angles are complementary: 2m + 10 + 4m − 10 = 90.' },
          { vi: '6m = 90, m = 15.', en: '6m = 90, m = 15.' },
        ],
        answer: '15',
      },
      {
        problem: 'What is the value of cos 150deg?',
        steps: [
          { vi: '150° ở góc phần tư II nên cos âm; góc tham chiếu 180 − 150 = 30°.', en: '150° is in quadrant II, so cos is negative; the reference angle is 180 − 150 = 30°.' },
          { vi: 'cos 30° = √3/2, vậy cos 150° = −√3/2.', en: 'cos 30° = √3/2, so cos 150° = −√3/2.' },
        ],
        answer: '-frac(sqrt(3),2)',
      },
    ],
    traps: [
      { vi: 'Lấy cạnh đối/kề theo nhầm góc.', en: 'Taking opposite/adjacent relative to the wrong angle.' },
      { vi: 'Rút gọn "sin 2x / x" thành "sin 2".', en: 'Cancelling "sin 2x / x" down to "sin 2".' },
      { vi: 'Áp quan hệ phụ nhau vào giá trị (90 − a) thay vì vào góc.', en: 'Applying the complement to the value (90 − a) instead of to the angle.' },
      { vi: 'Quên dấu âm của cos ở góc phần tư II và III.', en: 'Forgetting that cos is negative in quadrants II and III.' },
    ],
    templates: {
      easy: ['pd-d-trig-cofunction-letter', 'pd-d-trig-tan-to-cos', 'pd-d-trig-hyp-side', 'pd-d-trig-sin-decimal-hyp', 'pd-sin-cos-complement'],
      medium: ['pd-d-trig-cofunction-sum', 'pd-d-trig-sin-plus-cos', 'pd-d-trig-similar-tan-cos', 'pd-d-trig-cofunction-solve', 'pd-d-trig-coord-cos', 'geo-right-triangle-trig-ratio', 'geo-trig-opposite-side'],
      hard: ['pd-d-trig-tan-m', 'pd-d-trig-diameter-area', 'pd-d-trig-quadrant-roman', 'pd-radians-convert'],
    },
    bookSet: [
      { slug: 'pd-d-trig-cofunction-letter', calc: false },
      { slug: 'pd-d-trig-tan-to-cos', calc: false },
      { slug: 'pd-d-trig-cofunction-sum', calc: false },
      { slug: 'pd-d-trig-hyp-side', calc: false },
      { slug: 'pd-d-trig-tan-m', calc: false },
      { slug: 'pd-d-trig-sin-plus-cos', calc: false },
      { slug: 'pd-d-trig-sin-decimal-hyp', calc: true },
      { slug: 'pd-d-trig-similar-tan-cos', calc: true },
      { slug: 'pd-d-trig-cofunction-solve', calc: true },
      { slug: 'pd-d-trig-coord-cos', calc: true },
      { slug: 'pd-d-trig-diameter-area', calc: true },
      { slug: 'pd-d-trig-quadrant-roman', calc: true },
    ],
  },
  {
    n: 23,
    id: 'reading-data',
    title: { vi: 'Đọc số liệu', en: 'Reading Data' },
    phase: 4,
    art: 'magnifier',
    bookPages: [205, 213],
    subtopics: [
      { vi: 'Đọc bảng, biểu đồ cột, biểu đồ đường, biểu đồ điểm', en: 'Reading tables, bar graphs, line graphs and scatterplots' },
      { vi: 'So sánh và phần trăm từ số liệu', en: 'Comparisons and percents from data' },
      { vi: 'Xu hướng và điểm cực trị', en: 'Trends and extreme points' },
      { vi: 'Kết hợp số liệu với một phép tính', en: 'Combining a reading with one calculation' },
    ],
    theory: [
      {
        title: { vi: 'Đọc kỹ trục và đơn vị', en: 'Read the axes and units first' },
        body: {
          vi: 'Trước khi tính, xác định mỗi trục (mỗi cột) đo gì và đơn vị gì — "nghìn", "triệu", "phần trăm", "mỗi 1.000 người". Nhiều câu sai chỉ vì đọc nhầm thang chia hoặc nhầm hai chuỗi số liệu.',
          en: 'Before calculating, pin down what each axis (or column) measures and in what units — "thousands", "millions", "percent", "per 1,000 people". Many wrong answers come from misreading the scale or mixing up two data series.',
        },
      },
      {
        title: { vi: 'So sánh đúng đại lượng đề hỏi', en: 'Compare exactly what is asked' },
        body: {
          vi: 'Đề hỏi TỔNG hai chiều, HIỆU giữa hai chuỗi hay TÍCH số lượng × giá thì phải tính đại lượng đó cho từng lựa chọn rồi mới so; giá trị lớn nhất của một cột riêng lẻ thường là bẫy.',
          en: 'If the question asks for a SUM of two parts, a DIFFERENCE between two series or a PRODUCT such as units × price, compute that quantity for each choice before comparing; the largest single bar is often the trap.',
        },
      },
      {
        title: { vi: 'Phần trăm và phần trăm thay đổi', en: 'Percent of and percent change' },
        body: {
          vi: '"A bằng bao nhiêu phần trăm B" = A/B × 100. "Phần trăm tăng/giảm" = (mới − cũ)/cũ × 100 — luôn chia cho giá trị BAN ĐẦU. Cùng một hiệu số có thể là những phần trăm khác nhau.',
          en: '"A is what percent of B" = A/B × 100. "Percent increase/decrease" = (new − old)/old × 100 — always divide by the ORIGINAL value. The same difference can be different percents.',
        },
        formula: 'frac(mới - cũ,cũ) × 100%',
      },
      {
        title: { vi: 'Xu hướng và cực trị', en: 'Trends and extremes' },
        body: {
          vi: 'Xu hướng "mỗi năm tăng" nghĩa là MỌI bước đều tăng. Điểm cao nhất/thấp nhất đọc theo trục tung; đề có thể hỏi hoành độ của điểm đó. Với đại lượng tích luỹ (hàng trên xe, lượng đường trong máu), giá trị lớn nhất chính là sức chứa hay đỉnh.',
          en: 'A trend like "increased each year" means EVERY step went up. The highest or lowest point is read on the vertical axis; the question may ask for that point’s horizontal coordinate. For quantities that build up (load on a truck, blood sugar), the maximum is the capacity or peak.',
        },
      },
      {
        title: { vi: 'Tốc độ × thời gian', en: 'Rate × time' },
        body: {
          vi: 'Khi đồ thị cho tốc độ (mỗi giờ, mỗi gallon…), tổng lượng = tốc độ × thời gian cho từng đoạn rồi cộng lại. Ví dụ số gallon = quãng đường ÷ số dặm mỗi gallon.',
          en: 'When a graph gives a rate (per hour, per gallon…), total amount = rate × time for each piece, then add. For example, gallons = distance ÷ miles per gallon.',
        },
        formula: 'tổng = tốc độ × thời gian',
      },
    ],
    examples: [
      {
        problem: 'A bar graph shows sales of 40 thousand units in 2019 and 30 thousand units in 2020. By what percent did sales decrease?',
        steps: [
          { vi: 'Giảm 10 nghìn so với ban đầu 40 nghìn.', en: 'A drop of 10 thousand from an original 40 thousand.' },
          { vi: '10/40 = 25%.', en: '10/40 = 25%.' },
        ],
        answer: '25%',
      },
      {
        problem: 'A worker answers messages at 5 per hour for 2 hours and then at 8 per hour for 3 hours. How many messages are answered in total?',
        steps: [
          { vi: 'Mỗi đoạn: tốc độ × thời gian.', en: 'Each piece: rate × time.' },
          { vi: '5 × 2 + 8 × 3 = 34.', en: '5 × 2 + 8 × 3 = 34.' },
        ],
        answer: '34',
      },
    ],
    traps: [
      { vi: 'Đọc nhầm thang chia (mỗi vạch không phải 1 đơn vị).', en: 'Misreading the scale (each gridline is not 1 unit).' },
      { vi: 'Chọn cột cao nhất khi đề hỏi tổng hoặc tích.', en: 'Picking the tallest bar when the question asks for a sum or product.' },
      { vi: 'Tính phần trăm thay đổi mà chia cho giá trị sau.', en: 'Computing percent change by dividing by the later value.' },
      { vi: 'Bỏ qua đơn vị "nghìn/triệu" trên trục.', en: 'Ignoring "thousands/millions" on the axis.' },
    ],
    templates: {
      easy: ['pd-d-data-max-sum', 'pd-d-data-gap-smallest', 'pd-d-data-quarter-highest', 'pd-d-data-under-roman', 'pd-d-data-trend', 'pd-d-data-scatter-argmin', 'pd-d-data-peak', 'pd-d-data-fraction-of', 'pd-d-data-twice', 'pd-d-data-combined-max', 'pd-table-read'],
      medium: ['pd-d-data-percent-of', 'pd-d-data-max-revenue', 'pd-d-data-rate-total', 'pd-d-data-mileage-gallons', 'psda-scatterplot-prediction', 'psda-line-of-fit-predict', 'psda-best-fit-slope-from-points'],
      hard: ['pd-d-data-matching-percent', 'pd-d-data-recovery-diff', 'pd-table-percent-hard'],
    },
    bookSet: [
      { slug: 'pd-d-data-max-sum', calc: true },
      { slug: 'pd-d-data-gap-smallest', calc: true },
      { slug: 'pd-d-data-quarter-highest', calc: true },
      { slug: 'pd-d-data-percent-of', calc: true },
      { slug: 'pd-d-data-under-roman', calc: true },
      { slug: 'pd-d-data-trend', calc: true },
      { slug: 'pd-d-data-scatter-argmin', calc: true },
      { slug: 'pd-d-data-peak', calc: true },
      { slug: 'pd-d-data-matching-percent', calc: true },
      { slug: 'pd-d-data-fraction-of', calc: true },
      { slug: 'pd-d-data-max-revenue', calc: true },
      { slug: 'pd-d-data-twice', calc: true },
      { slug: 'pd-d-data-combined-max', calc: true },
      { slug: 'pd-d-data-rate-total', calc: true },
      { slug: 'pd-d-data-recovery-diff', calc: true },
      { slug: 'pd-d-data-mileage-gallons', calc: true },
    ],
  },
  {
    n: 24,
    id: 'probability',
    title: { vi: 'Xác suất', en: 'Probability' },
    phase: 4,
    art: 'star',
    bookPages: [214, 222],
    subtopics: [
      { vi: 'Nhóm mục tiêu trên nhóm đang xét', en: 'Target group over group under consideration' },
      { vi: 'Xác suất có điều kiện từ bảng hai chiều', en: 'Conditional probability from two-way tables' },
      { vi: 'Xác suất "hoặc" trên cả bảng', en: '"Or" probabilities over the whole table' },
      { vi: 'Điền bảng thiếu ô', en: 'Completing an incomplete table' },
    ],
    theory: [
      {
        title: { vi: 'Định nghĩa', en: 'The definition' },
        body: {
          vi: 'Xác suất = số kết quả mục tiêu / tổng số kết quả có thể. Trên SAT gần như luôn là: số trong nhóm mục tiêu / số trong nhóm đang xét.',
          en: 'Probability = number of target outcomes / number of possible outcomes. On the SAT it is almost always: number in the target group / number in the group under consideration.',
        },
        formula: 'P = frac(nhóm mục tiêu,nhóm đang xét)',
      },
      {
        title: { vi: 'Xác định nhóm đang xét (mẫu số)', en: 'Identify the group under consideration (the denominator)' },
        body: {
          vi: 'Cụm "nếu chọn một người trong nhóm X", "trong số các X", "biết rằng X" giới hạn mẫu số vào nhóm X — một hàng hoặc một cột, đọc ở ô tổng của nó. Chỉ khi chọn từ TẤT CẢ thì mẫu số mới là tổng cả bảng. Câu hỏi "ngược" (biết cột, hỏi hàng) đổi hẳn mẫu số.',
          en: 'Phrases like "if a person in group X is chosen", "of the X", "given that X" restrict the denominator to group X — one row or one column, read from its total. Only when choosing from EVERYONE is the denominator the grand total. A "reversed" question (given the column, asking about the row) changes the denominator completely.',
        },
      },
      {
        title: { vi: 'Xác suất "hoặc"', en: '"Or" probabilities' },
        body: {
          vi: 'Khi mục tiêu gồm nhiều ô rời nhau ("xe tải ca một hoặc xe hơi ca ba"), cộng các ô đó ở tử số, giữ mẫu số là nhóm đang xét.',
          en: 'When the target is several separate cells ("a truck from shift one or a car from shift three"), add those cells in the numerator and keep the denominator as the group under consideration.',
        },
      },
      {
        title: { vi: 'Bảng thiếu ô và tỉ lệ', en: 'Incomplete tables and ratios' },
        body: {
          vi: 'Ô trống điền được từ tổng hàng/cột: ô = tổng − các ô còn lại. Bảng phần trăm: các phần cộng lại 100%. Khi đề cho tỉ số (cứ 2 khỏi thì 5 không khỏi), xác suất là 2/(2 + 5); khi cho số mẫu kèm phần trăm, đổi phần trăm thành số lượng trước khi cộng.',
          en: 'Blank cells come from row or column totals: cell = total − the other cells. In a percent table the parts add to 100%. When given a ratio (2 cured for every 5 not cured), the probability is 2/(2 + 5); when given counts with percents, turn each percent into a count before adding.',
        },
      },
    ],
    examples: [
      {
        problem: 'Of 60 members of a club, 24 are in the chess group, and 9 of those 24 are seniors. If a chess-group member is chosen at random, what is the probability that the member is a senior?',
        steps: [
          { vi: 'Nhóm đang xét: 24 thành viên nhóm cờ.', en: 'Group under consideration: the 24 chess-group members.' },
          { vi: '9/24 = 3/8.', en: '9/24 = 3/8.' },
        ],
        answer: 'frac(3,8)',
      },
      {
        problem: 'Pond A gives 300 samples, 4% with algae; pond B gives 200 samples, 9% with algae. What fraction of all samples have algae?',
        steps: [
          { vi: 'Số mẫu có tảo: 12 + 18 = 30.', en: 'Samples with algae: 12 + 18 = 30.' },
          { vi: '30/500 = 0,06.', en: '30/500 = 0.06.' },
        ],
        answer: '0.06',
      },
    ],
    traps: [
      { vi: 'Dùng tổng cả bảng khi đề đã giới hạn vào một hàng/cột.', en: 'Using the grand total when the question restricts to one row or column.' },
      { vi: 'Làm câu hỏi ngược với mẫu số của câu hỏi xuôi.', en: 'Answering the reversed question with the forward question’s denominator.' },
      { vi: 'Lấy trung bình hai phần trăm khi hai nhóm có cỡ khác nhau.', en: 'Averaging two percents when the groups have different sizes.' },
      { vi: 'Dùng tỉ số "khỏi : không khỏi" làm xác suất.', en: 'Using a "cured : not cured" ratio as the probability.' },
    ],
    templates: {
      easy: ['pd-d-prob-missing-percent', 'pd-d-prob-row-fraction', 'psda-expected-count'],
      medium: ['pd-d-prob-col-given', 'pd-d-prob-row-atleast', 'pd-d-prob-highest-conditional', 'pd-d-prob-difference', 'pd-d-prob-given-col-percent', 'pd-d-prob-given-col-rows', 'pd-d-prob-incorrect-test', 'psda-probability-not-color', 'psda-two-way-table-conditional', 'psda-independent-events-multiply'],
      hard: ['pd-d-prob-reverse-conditional', 'pd-d-prob-incomplete-weeks', 'pd-d-prob-incomplete-2x2', 'pd-d-prob-weighted', 'pd-d-prob-ratio-reasoning', 'pd-d-prob-solve-total', 'pd-probability-without-replacement'],
    },
    bookSet: [
      { slug: 'pd-d-prob-col-given', calc: true },
      { slug: 'pd-d-prob-row-atleast', calc: true },
      { slug: 'pd-d-prob-reverse-conditional', calc: true },
      { slug: 'pd-d-prob-missing-percent', calc: true },
      { slug: 'pd-d-prob-row-fraction', calc: true },
      { slug: 'pd-d-prob-incomplete-weeks', calc: true },
      { slug: 'pd-d-prob-highest-conditional', calc: true },
      { slug: 'pd-d-prob-difference', calc: true },
      { slug: 'pd-d-prob-incomplete-2x2', calc: true },
      { slug: 'pd-d-prob-given-col-percent', calc: true },
      { slug: 'pd-d-prob-given-col-rows', calc: true },
      { slug: 'pd-d-prob-weighted', calc: true },
      { slug: 'pd-d-prob-incorrect-test', calc: true },
      { slug: 'pd-d-prob-ratio-reasoning', calc: true },
      { slug: 'pd-d-prob-solve-total', calc: true },
    ],
  },
  {
    n: 25,
    id: 'statistics-1',
    title: { vi: 'Thống kê I', en: 'Statistics I' },
    phase: 4,
    art: 'calendar',
    bookPages: [223, 232],
    subtopics: [
      { vi: 'Trung bình, trung vị, mốt, khoảng biến thiên', en: 'Mean, median, mode and range' },
      { vi: 'Độ lệch chuẩn (so sánh)', en: 'Standard deviation (comparing)' },
      { vi: 'Số đo từ bảng tần số và biểu đồ', en: 'Measures from frequency tables and charts' },
      { vi: 'Giá trị ngoại lai', en: 'Outliers' },
      { vi: 'Bài toán trung bình: nghĩ theo tổng', en: 'Average problems: think in totals' },
    ],
    theory: [
      {
        title: { vi: 'Bốn số đo cơ bản', en: 'The four basic measures' },
        body: {
          vi: 'Trung bình = tổng / số phần tử. Trung vị = giá trị ở giữa sau khi xếp thứ tự (số phần tử chẵn thì lấy trung bình hai số giữa). Mốt = giá trị xuất hiện nhiều nhất. Khoảng biến thiên = lớn nhất − nhỏ nhất.',
          en: 'Mean = sum / count. Median = the middle value once sorted (with an even count, average the two middle values). Mode = the most frequent value. Range = largest − smallest.',
        },
        formula: 'trung bình = frac(tổng,n)',
      },
      {
        title: { vi: 'Tìm vị trí trung vị', en: 'Locating the median' },
        body: {
          vi: 'Với n giá trị đã xếp: n lẻ thì trung vị ở vị trí (n + 1)/2; n chẵn thì là trung bình của vị trí n/2 và n/2 + 1. Với bảng tần số hay biểu đồ, cộng dồn tần số để biết các vị trí đó rơi vào giá trị (hay khoảng) nào.',
          en: 'With n sorted values: if n is odd, the median is in position (n + 1)/2; if n is even, it is the average of positions n/2 and n/2 + 1. For a frequency table or chart, add up the frequencies cumulatively to see which value (or interval) those positions fall in.',
        },
      },
      {
        title: { vi: 'Độ lệch chuẩn', en: 'Standard deviation' },
        body: {
          vi: 'Đo mức dữ liệu trải xa trung bình. Không cần tính trên SAT, chỉ cần so sánh: dữ liệu dồn sát trung bình thì nhỏ, dồn về hai đầu thì lớn. Hai tập có cùng tần số nhưng giá trị cách xa nhau hơn thì độ lệch chuẩn lớn hơn. Bỏ các giá trị xa trung bình nhất làm độ lệch chuẩn giảm nhiều nhất.',
          en: 'It measures how spread out the data are from the mean. The SAT never asks you to compute it, only to compare: data bunched near the mean give a small value; data pushed to the ends give a large one. Two sets with the same frequencies but values farther apart have the larger standard deviation. Removing the values farthest from the mean lowers it the most.',
        },
      },
      {
        title: { vi: 'Trung bình từ bảng tần số', en: 'Mean from a frequency table' },
        body: {
          vi: 'Nhân mỗi giá trị với tần số của nó, cộng lại, rồi chia cho TỔNG tần số (không chia cho số giá trị khác nhau).',
          en: 'Multiply each value by its frequency, add them up, then divide by the TOTAL frequency (not by the number of different values).',
        },
        formula: 'frac(Σ(giá trị × tần số),Σ tần số)',
      },
      {
        title: { vi: 'Giá trị ngoại lai', en: 'Outliers' },
        body: {
          vi: 'Giá trị ngoại lai kéo trung bình về phía nó và làm tăng khoảng biến thiên, độ lệch chuẩn; trung vị hầu như không đổi. Bỏ hoặc sửa một giá trị ngoại lai thì khoảng biến thiên thường thay đổi nhiều nhất.',
          en: 'An outlier pulls the mean toward it and increases the range and standard deviation; the median barely moves. Removing or correcting an outlier usually changes the range the most.',
        },
      },
      {
        title: { vi: 'Bài toán trung bình: nghĩ theo tổng', en: 'Average problems: think in totals' },
        body: {
          vi: 'Tổng = trung bình × số phần tử. Gộp hai nhóm: cộng hai tổng rồi chia cho tổng số phần tử (không lấy trung bình hai trung bình). Có thêm/bớt phần tử: viết phương trình theo tổng.',
          en: 'Total = average × count. To combine two groups, add the totals and divide by the total count (do not average the two averages). When a member joins or leaves, write an equation in terms of totals.',
        },
        formula: 'frac(n_1 m_1 + n_2 m_2,n_1 + n_2)',
      },
    ],
    examples: [
      {
        problem: 'The frequency table shows 0 hours for 4 students, 1 hour for 10 students, 2 hours for 4 students, and 3 hours for 2 students. What are the mean and median?',
        steps: [
          { vi: 'Tổng = 0 + 10 + 8 + 6 = 24 trên 20 học sinh: trung bình 1,2.', en: 'Total = 0 + 10 + 8 + 6 = 24 over 20 students: mean 1.2.' },
          { vi: 'Vị trí 10 và 11 đều là 1 giờ: trung vị 1.', en: 'Positions 10 and 11 are both 1 hour: median 1.' },
        ],
        answer: 'mean 1.2, median 1',
      },
      {
        problem: 'The average weight of a group of boxes is 12 kilograms. A 20-kilogram box is added, and the average becomes 13 kilograms. How many boxes were in the original group?',
        steps: [
          { vi: 'Gọi n là số hộp: 12n + 20 = 13(n + 1).', en: 'Let n be the number of boxes: 12n + 20 = 13(n + 1).' },
          { vi: 'n = 7.', en: 'n = 7.' },
        ],
        answer: '7',
      },
    ],
    traps: [
      { vi: 'Tìm trung vị khi chưa xếp thứ tự.', en: 'Finding the median before sorting.' },
      { vi: 'Lấy trung bình của hai trung bình khi hai nhóm khác cỡ.', en: 'Averaging two averages when the groups differ in size.' },
      { vi: 'Chia cho số giá trị khác nhau thay vì tổng tần số.', en: 'Dividing by the number of distinct values instead of the total frequency.' },
      { vi: 'Nghĩ bỏ ngoại lai làm trung vị đổi nhiều.', en: 'Expecting removing an outlier to move the median a lot.' },
    ],
    templates: {
      easy: ['pd-d-stat-dotplot-mean', 'psda-mean-missing-value'],
      medium: ['pd-d-stat-combined-mean', 'pd-d-stat-mean-first-part', 'pd-d-stat-histogram-median-bin', 'pd-d-stat-sd-remove-two', 'pd-d-stat-sd-compare-freq', 'pd-d-stat-median-compare', 'pd-d-stat-freq-median', 'pd-d-stat-median-must', 'pd-d-stat-range-must', 'pd-d-stat-freq-mean-range', 'psda-median-of-list', 'psda-median-frequency-table', 'psda-mean-after-adding-value'],
      hard: ['pd-d-stat-list-roman', 'pd-d-stat-compare-mean-median', 'pd-d-stat-add-value-roman', 'pd-d-stat-remove-outlier', 'pd-d-stat-correct-outlier', 'pd-range-stddev-compare'],
    },
    bookSet: [
      { slug: 'pd-d-stat-combined-mean', calc: true },
      { slug: 'pd-d-stat-mean-first-part', calc: true },
      { slug: 'pd-d-stat-histogram-median-bin', calc: true },
      { slug: 'pd-d-stat-dotplot-mean', calc: true },
      { slug: 'pd-d-stat-sd-remove-two', calc: true },
      { slug: 'pd-d-stat-sd-compare-freq', calc: true },
      { slug: 'pd-d-stat-median-compare', calc: true },
      { slug: 'pd-d-stat-freq-median', calc: true },
      { slug: 'pd-d-stat-median-must', calc: true },
      { slug: 'pd-d-stat-range-must', calc: true },
      { slug: 'pd-d-stat-freq-mean-range', calc: true },
      { slug: 'pd-d-stat-list-roman', calc: true },
      { slug: 'pd-d-stat-compare-mean-median', calc: true },
      { slug: 'pd-d-stat-add-value-roman', calc: true },
      { slug: 'pd-d-stat-remove-outlier', calc: true },
      { slug: 'pd-d-stat-correct-outlier', calc: true },
    ],
  },
  {
    n: 26,
    id: 'statistics-2',
    title: { vi: 'Thống kê II', en: 'Statistics II' },
    phase: 4,
    art: 'magnifier',
    bookPages: [233, 245],
    subtopics: [
      { vi: 'Từ mẫu suy ra tổng thể', en: 'From a sample to the population' },
      { vi: 'Đường khớp nhất: dự đoán và cảnh báo', en: 'Line of best fit: predictions and cautions' },
      { vi: 'Ý nghĩa hệ số góc và tung độ gốc', en: 'Interpreting the slope and y-intercept' },
      { vi: 'Sai số và khoảng tin cậy', en: 'Margin of error and confidence intervals' },
      { vi: 'Liên hệ hay nhân quả; chọn ngẫu nhiên và phân nhóm ngẫu nhiên', en: 'Association or causation; random selection and random assignment' },
    ],
    theory: [
      {
        title: { vi: 'Suy ra tổng thể từ mẫu', en: 'Estimating the population from a sample' },
        body: {
          vi: 'Tỉ lệ trong mẫu ngẫu nhiên dùng để ước lượng tỉ lệ trong tổng thể: số ước tính = tỉ lệ mẫu × cỡ tổng thể.',
          en: 'The proportion in a random sample estimates the proportion in the population: estimate = sample proportion × population size.',
        },
        formula: 'ước tính = frac(k,n) × N',
      },
      {
        title: { vi: 'Đường khớp nhất', en: 'The line of best fit' },
        body: {
          vi: 'Dự đoán đọc trên ĐƯỜNG THẲNG, không phải trên một điểm dữ liệu. Cẩn thận khi dự đoán ngoài phạm vi dữ liệu, khi có ngoại lai kéo lệch đường, hoặc khi dữ liệu thật ra theo dạng cong. Điểm xa đường nhất (theo phương đứng) là điểm dự đoán kém nhất; điểm gần đường nhất được dự đoán tốt nhất.',
          en: 'Predictions are read from the LINE, not from a data point. Be careful predicting beyond the data, when outliers pull the line, or when the data really follow a curve. The point farthest from the line (vertically) is the worst predicted; the closest is the best predicted.',
        },
      },
      {
        title: { vi: 'Hệ số góc và tung độ gốc', en: 'Slope and y-intercept' },
        body: {
          vi: 'Hệ số góc = mức tăng (hoặc giảm, nếu âm) DỰ ĐOÁN của y khi x tăng MỘT đơn vị của trục — nếu trục đo bằng "nghìn đô la" thì một đơn vị là một nghìn đô la. Tung độ gốc = giá trị dự đoán của y khi x = 0 (có thể vô nghĩa ngoài thực tế).',
          en: 'Slope = the PREDICTED increase (or decrease, if negative) in y for each ONE-unit increase in x on that axis — if the axis is in "thousands of dollars", one unit is one thousand dollars. The y-intercept = the predicted y when x = 0 (which may be meaningless in real life).',
        },
      },
      {
        title: { vi: 'Sai số', en: 'Margin of error' },
        body: {
          vi: 'Sai số cho biết ước lượng có thể lệch bao nhiêu: trung bình mẫu ± sai số là khoảng hợp lý cho trung bình thật. Sai số nhỏ hơn khi mẫu LỚN hơn và dữ liệu ÍT biến thiên hơn (nhóm đồng nhất). Mẫu phải lấy ngẫu nhiên từ đúng tổng thể cần nghiên cứu. Hai khoảng không chồng nhau thì rất có thể hai trung bình thật khác nhau.',
          en: 'The margin of error says how far the estimate might be off: sample mean ± margin is a plausible range for the true mean. It shrinks with a LARGER sample and LESS variable data (a more uniform group). The sample must be random and drawn from the population you want to study. If two intervals do not overlap, the true means very likely differ.',
        },
      },
      {
        title: { vi: 'Khoảng tin cậy', en: 'Confidence intervals' },
        body: {
          vi: 'Khoảng tin cậy 95% từ a tới b nghĩa là trung bình THẬT của tổng thể đã lấy mẫu nhiều khả năng nằm trong [a, b]. Nó không nói 95% cá thể nằm trong khoảng đó, không áp dụng cho tổng thể khác hay thời điểm khác.',
          en: 'A 95% confidence interval from a to b means the TRUE mean of the sampled population is plausibly in [a, b]. It does not say 95% of individuals fall in that range, and it does not carry over to another population or time period.',
        },
      },
      {
        title: { vi: 'Bốn tình huống thiết kế nghiên cứu', en: 'The four study designs' },
        body: {
          vi: 'Chọn NGẪU NHIÊN từ tổng thể → khái quát được cho tổng thể. PHÂN NHÓM ngẫu nhiên vào các cách xử lý → kết luận được nhân quả. Có cả hai: khái quát được và kết luận nhân quả. Không có phân nhóm ngẫu nhiên (khảo sát, quan sát) → chỉ kết luận được "có liên hệ", không phải "gây ra". Phân nhóm ngẫu nhiên nghĩa là từng cá thể được gán bằng cơ chế ngẫu nhiên, không phải để họ tự chia nhóm.',
          en: 'RANDOM SELECTION from the population → results generalize to the population. RANDOM ASSIGNMENT to treatments → cause and effect can be concluded. Both → both. No random assignment (a survey or observation) → only an "association", not "causes". Random assignment means each individual is placed by a chance mechanism, not that people split themselves into groups.',
        },
      },
    ],
    examples: [
      {
        problem: 'In a random sample of 400 households, 60 own an electric car. There are 12,000 households in the town. About how many households in the town own an electric car?',
        steps: [
          { vi: 'Tỉ lệ mẫu 60/400 = 0,15.', en: 'Sample proportion 60/400 = 0.15.' },
          { vi: '0,15 × 12.000 = 1.800.', en: '0.15 × 12,000 = 1,800.' },
        ],
        answer: '1800',
      },
      {
        problem: 'A line of best fit is y = 0.4x + 12, where x is minutes of practice and y is a test score. What does 0.4 mean?',
        steps: [
          { vi: 'Hệ số góc: mỗi phút luyện thêm, điểm dự đoán tăng 0,4.', en: 'Slope: each extra minute of practice raises the predicted score by 0.4.' },
          { vi: 'Không phải "mỗi 10 phút", cũng không phải điểm khi không luyện (đó là 12).', en: 'Not "per 10 minutes", and not the score with no practice (that is 12).' },
        ],
        answer: 'predicted increase of 0.4 point per minute',
      },
    ],
    traps: [
      { vi: 'Đọc dự đoán từ một điểm dữ liệu thay vì từ đường thẳng.', en: 'Reading a prediction from a data point instead of the line.' },
      { vi: 'Nhầm hệ số góc với tung độ gốc, hoặc quên đơn vị "nghìn".', en: 'Mixing up slope and intercept, or forgetting the "thousands" unit.' },
      { vi: 'Kết luận nhân quả từ nghiên cứu không phân nhóm ngẫu nhiên.', en: 'Concluding causation from a study without random assignment.' },
      { vi: 'Hiểu khoảng tin cậy như khoảng chứa 95% cá thể.', en: 'Reading a confidence interval as the range of 95% of individuals.' },
    ],
    templates: {
      easy: ['pd-d-stat2-count-above-line', 'pd-d-stat2-line-predict', 'pd-d-stat2-best-survey', 'psda-sample-estimate-population'],
      medium: ['pd-d-stat2-poll-difference', 'pd-d-stat2-intercept-meaning', 'pd-d-stat2-slope-units', 'pd-d-stat2-slope-two-points', 'pd-d-stat2-closest-to-line', 'pd-d-stat2-random-assignment', 'pd-d-stat2-least-variability', 'pd-d-stat2-ci-interpret', 'psda-survey-association-only', 'psda-margin-of-error-conclusion', 'psda-ci-margin-or-point-estimate', 'psda-sampling-bias-conclusion', 'psda-margin-sample-size'],
      hard: ['pd-d-stat2-slope-scaled', 'pd-d-stat2-farthest-total', 'pd-d-stat2-margin-compare', 'psda-study-design-conclusion', 'psda-experiment-causal-scope'],
    },
    bookSet: [
      { slug: 'pd-d-stat2-count-above-line', calc: true },
      { slug: 'pd-d-stat2-line-predict', calc: true },
      { slug: 'pd-d-stat2-best-survey', calc: true },
      { slug: 'pd-d-stat2-poll-difference', calc: true },
      { slug: 'pd-d-stat2-intercept-meaning', calc: true },
      { slug: 'pd-d-stat2-slope-units', calc: true },
      { slug: 'pd-d-stat2-slope-scaled', calc: true },
      { slug: 'pd-d-stat2-intercept-meaning', calc: true },
      { slug: 'pd-d-stat2-slope-two-points', calc: true },
      { slug: 'pd-d-stat2-closest-to-line', calc: true },
      { slug: 'pd-d-stat2-farthest-total', calc: true },
      { slug: 'pd-d-stat2-random-assignment', calc: true },
      { slug: 'pd-d-stat2-margin-compare', calc: true },
      { slug: 'pd-d-stat2-least-variability', calc: true },
      { slug: 'pd-d-stat2-ci-interpret', calc: true },
      { slug: 'psda-survey-association-only', calc: true },
    ],
  },
  {
    n: 27,
    id: 'volume',
    title: { vi: 'Thể tích', en: 'Volume' },
    phase: 4,
    art: 'trophy',
    bookPages: [246, 250],
    subtopics: [
      { vi: 'Thể tích = diện tích đáy × chiều cao', en: 'Volume = base area × height' },
      { vi: 'Hình nón và hình cầu', en: 'Cones and spheres' },
      { vi: 'Hình trụ rỗng', en: 'Hollow cylinders' },
      { vi: 'Khối lập phương đơn vị và diện tích mặt', en: 'Unit cubes and surface area' },
    ],
    theory: [
      {
        title: { vi: 'Đáy × cao', en: 'Base × height' },
        body: {
          vi: 'Mọi lăng trụ đứng: thể tích = diện tích đáy × chiều cao. Lập phương s³, hộp chữ nhật l·w·h, hình trụ πr²h. Chất lỏng dâng lên khi thả vật vào: thể tích vật = diện tích đáy bể × độ dâng.',
          en: 'For any right prism: volume = area of the base × height. Cube s³, rectangular box l·w·h, cylinder πr²h. When an object is submerged, its volume = area of the tank’s base × the rise in water level.',
        },
        formula: 'V = B · h    V_(trụ) = πr^2h',
      },
      {
        title: { vi: 'Hình nón, hình cầu', en: 'Cones and spheres' },
        body: {
          vi: 'Hình nón bằng một phần ba hình trụ cùng đáy, cùng chiều cao; nửa hình cầu bằng một nửa hình cầu. Nếu đề cho đường sinh (slant height) thì tìm chiều cao bằng Pythagoras trước.',
          en: 'A cone is one third of the cylinder with the same base and height; a hemisphere is half a sphere. If a slant height is given, get the height with the Pythagorean theorem first.',
        },
        formula: 'V_(nón) = frac(1,3)πr^2h    V_(cầu) = frac(4,3)πr^3',
      },
      {
        title: { vi: 'Hình trụ rỗng', en: 'Hollow cylinders' },
        body: {
          vi: 'Đáy là vành khăn: diện tích πR² − πr². Nhân với chiều cao để có thể tích phần vật liệu.',
          en: 'The base is a ring with area πR² − πr². Multiply by the height to get the volume of material.',
        },
        formula: 'V = π(R^2 - r^2)h',
      },
      {
        title: { vi: 'Diện tích toàn phần', en: 'Surface area' },
        body: {
          vi: 'Cộng diện tích mọi mặt: hộp 2(lw + lh + wh), lập phương 6s², hình trụ 2πr² + 2πrh. Đi từ diện tích toàn phần của lập phương về cạnh rồi về thể tích.',
          en: 'Add the areas of all faces: box 2(lw + lh + wh), cube 6s², cylinder 2πr² + 2πrh. From a cube’s surface area, get the edge, then the volume.',
        },
        formula: 'S_(hộp) = 2(lw + lh + wh)',
      },
      {
        title: { vi: 'Đếm khối lập phương đơn vị', en: 'Counting unit cubes' },
        body: {
          vi: 'Khối n × n × n sơn ngoài rồi cắt: 8 khối ba mặt sơn (góc), 12(n − 2) khối hai mặt (cạnh), 6(n − 2)² khối một mặt, (n − 2)³ khối không sơn. Thùng có thành dày t thì kích thước trong giảm 2t mỗi chiều ngang.',
          en: 'Paint an n × n × n block and cut it: 8 cubes with three painted faces (corners), 12(n − 2) with two (edges), 6(n − 2)² with one, and (n − 2)³ with none. A crate with walls t thick loses 2t from each inside horizontal dimension.',
        },
      },
    ],
    examples: [
      {
        problem: 'A cube has a surface area of 150 square inches. What is its volume?',
        steps: [
          { vi: '6s² = 150 nên s² = 25, s = 5.', en: '6s² = 150, so s² = 25 and s = 5.' },
          { vi: 'V = 125 inch khối.', en: 'V = 125 cubic inches.' },
        ],
        answer: '125',
      },
      {
        problem: 'A tank with a 40-inch by 30-inch base holds water. A rock with a volume of 1,800 cubic inches is fully submerged. How many inches does the water rise?',
        steps: [
          { vi: 'Diện tích đáy 1.200.', en: 'Base area 1,200.' },
          { vi: '1.800/1.200 = 1,5 inch.', en: '1,800/1,200 = 1.5 inches.' },
        ],
        answer: '1.5',
      },
      {
        problem: 'A cone has a base radius of 6 and a slant height of 10. What is its volume?',
        steps: [
          { vi: 'h = √(100 − 36) = 8.', en: 'h = √(100 − 36) = 8.' },
          { vi: 'V = ⅓π · 36 · 8 = 96π.', en: 'V = ⅓π · 36 · 8 = 96π.' },
        ],
        answer: '96π',
      },
    ],
    traps: [
      { vi: 'Dùng đường sinh làm chiều cao của hình nón.', en: 'Using the slant height as the cone’s height.' },
      { vi: 'Dùng đường kính thay cho bán kính.', en: 'Using the diameter instead of the radius.' },
      { vi: 'Quên hệ số 1/3 của hình nón.', en: 'Forgetting the 1/3 in the cone formula.' },
      { vi: 'Trừ bề dày thành một lần thay vì hai lần mỗi chiều.', en: 'Subtracting a wall’s thickness once instead of twice per dimension.' },
    ],
    templates: {
      easy: ['pd-d-vol-cylinder-half', 'geo-box-missing-height'],
      medium: ['pd-d-vol-box-surface', 'pd-d-vol-cube-symbolic', 'pd-d-vol-fill-time', 'pd-d-vol-balls-cylinder', 'pd-d-vol-water-rise', 'pd-d-vol-crate-inside', 'geo-cube-volume-from-surface', 'geo-cylinder-volume-height', 'geo-rect-area-change'],
      hard: ['pd-d-vol-painted-cube', 'pd-d-vol-open-box-touching', 'pd-d-vol-block-faces', 'pd-d-vol-cone-hemisphere', 'pd-d-vol-staircase-mass', 'pd-cone-sphere-volume'],
    },
    bookSet: [
      { slug: 'pd-d-vol-cylinder-half', calc: true },
      { slug: 'pd-d-vol-box-surface', calc: true },
      { slug: 'pd-d-vol-cube-symbolic', calc: true },
      { slug: 'pd-d-vol-fill-time', calc: true },
      { slug: 'pd-d-vol-balls-cylinder', calc: true },
      { slug: 'pd-d-vol-water-rise', calc: true },
      { slug: 'pd-d-vol-painted-cube', calc: true },
      { slug: 'pd-d-vol-open-box-touching', calc: true },
      { slug: 'pd-d-vol-block-faces', calc: true },
      { slug: 'pd-d-vol-cone-hemisphere', calc: true },
      { slug: 'pd-d-vol-crate-inside', calc: true },
      { slug: 'pd-d-vol-staircase-mass', calc: true },
    ],
  },
];
