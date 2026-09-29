/**
 * Bổ sung từ điển SAT Verbal — phần A: ba chủ đề TỪ NỐI (0, 1, 2) và chủ đề
 * "Dữ liệu và cụm từ cố định" (10), để mỗi chủ đề có ít nhất 30 từ.
 *
 * VIẾT TAY, KHÔNG SINH BẰNG AI; câu ví dụ tự soạn, không chép từ đề thi hay từ
 * điển nào. Kiểm bằng `npx tsx scripts/check-lex-more.ts src/data/sat-rw-lexicon-more-a.ts`.
 *
 * Quy ước chống câu hỏi hai đáp án trong quiz (`related()` ở sat-quiz.ts):
 * - Từ nối cùng nhãn logic không bao giờ làm nhiễu cho nhau, nên nhãn phải đúng.
 * - Hai từ khác nhãn mà thay được cho nhau trong câu ví dụ thì ghi chéo vào
 *   `synonyms` của nhau (while ↔ although/even though, whereas ↔ although,
 *   on the other hand ↔ that said, in particular ↔ specifically,
 *   in conclusion ↔ finally, likewise ↔ also).
 * - Câu ví dụ của từ nối viết theo logic của đề SAT: "Similarly" nối HAI đối
 *   tượng giống nhau, "Additionally" thêm ý cho CÙNG một đối tượng; "In contrast"
 *   so sánh hai đối tượng, "Nonetheless" là vẫn làm/vẫn đúng BẤT CHẤP điều trước.
 */
import { T, W, type LexEntry } from './sat-rw-lex-helpers';

export const MORE: Record<string, LexEntry> = {
  // ================================================ 0 · kết quả, bổ sung, tương đồng
  // ---------------------------------------------------------------- kết quả
  hence: T('Kết quả', 'bởi vậy', 'For this reason; used to show that something is a result of what was just said.', ['therefore', 'thus', 'consequently'], ['however', 'nevertheless'], 'The samples had been stored at the wrong temperature; hence, the lab had to repeat every test.'),
  accordingly: T('Kết quả', 'theo đó, cho nên', 'As a result of what has just been said; in a way that suits the situation.', ['consequently', 'therefore', 'for this reason'], ['regardless', 'nevertheless'], 'The forecast warned of a severe storm on Saturday. Accordingly, the organizers moved the race to Sunday.'),
  'for this reason': T('Kết quả', 'vì lý do này', 'Because of the fact or situation just described.', ['therefore', 'accordingly', 'hence'], ['nevertheless', 'even so'], 'Many shorebirds lay their eggs directly on open sand. For this reason, parts of the beach are fenced off every spring.'),
  'as a consequence': T('Kết quả', 'hệ quả là', 'As a result of the event or action just mentioned.', ['as a result', 'consequently', 'therefore'], ['nevertheless', 'even so'], 'The factory dumped waste into the river for decades. As a consequence, few fish survive downstream.'),
  so: T('Kết quả', 'nên, vậy nên', 'Used to join a cause to its result within the same sentence.', ['therefore', 'thus', 'hence'], ['but', 'yet'], 'The ice on the lake was only a few centimeters thick, so the rangers closed it to skaters.'),
  'it follows that': T('Kết quả', 'từ đó suy ra', 'Used to state a conclusion that must be true because of the facts just given.', ['therefore', 'hence', 'thus'], ['nevertheless', 'even so'], 'Every sample from the well contained the bacteria, but none of the samples from the pipes did. It follows that the well was the source of the outbreak.'),
  thereby: T('Kết quả', 'nhờ đó, qua đó', 'By that means; as a result of the action just described.', ['thus', 'in this way', 'as a result'], ['nevertheless', 'even so'], 'The city planted trees along its streets and also painted many rooftops white, thereby lowering summer temperatures by several degrees.'),
  'in turn': T('Kết quả', 'đến lượt nó, từ đó', 'As a result of the previous step in a chain of causes and effects.', ['as a result', 'consequently', 'thus'], ['nevertheless', 'regardless'], 'Warmer oceans release more water vapor into the air; this vapor, in turn, fuels stronger storms.'),
  'in response': T('Kết quả', 'để đáp lại', 'As a reaction to what has just been described.', ['as a result', 'accordingly', 'consequently'], ['regardless', 'nevertheless'], 'Customers complained that the app was too slow. In response, the company rebuilt its search feature from scratch.'),
  'to that end': T('Kết quả', 'để đạt mục đích đó', 'In order to achieve the goal just mentioned.', ['for that purpose', 'with this aim', 'accordingly'], ['regardless', 'nevertheless'], 'The school hopes to cut its energy use in half by 2030. To that end, it has installed solar panels on every roof.'),

  // ---------------------------------------------------------------- bổ sung
  additionally: T('Bổ sung', 'thêm vào đó', 'Used to add another fact or point about the same subject.', ['in addition', 'moreover', 'furthermore'], ['however', 'by contrast'], 'The new library offers free tutoring after school. Additionally, it lends laptops to students who need them.'),
  also: T('Bổ sung', 'cũng, còn', 'In addition; too.', ['too', 'as well', 'in addition', 'likewise'], ['however', 'by contrast'], 'The app counts how many steps you take each day; it also reminds you to drink water.'),
  'as well as': T('Bổ sung', 'và cả, lẫn cả', 'In addition to; and also.', ['along with', 'in addition to', 'together with'], ['instead of', 'rather than'], 'The storm knocked down power lines as well as several old oak trees.'),
  besides: T('Bổ sung', 'vả lại, bên cạnh đó', 'Used to add another reason, often a stronger one, to support what was just said.', ['moreover', 'in addition', 'what is more'], ['however', 'nevertheless'], 'Maya decided not to enter the race; she had not trained for it. Besides, she had already promised to help at the finish line.'),
  'what is more': T('Bổ sung', 'thêm nữa là', 'Used to add a further point that makes the argument stronger.', ['moreover', 'furthermore', 'besides'], ['however', 'by contrast'], 'The new battery charges in ten minutes. What is more, it lasts twice as long as older models.'),
  further: T('Bổ sung', 'ngoài ra còn', 'In addition; used to add another point, especially in formal writing.', ['furthermore', 'moreover', 'additionally'], ['however', 'nevertheless'], 'The new vaccine is highly effective against the virus. Further, it can be stored in an ordinary refrigerator.'),
  'on top of that': T('Bổ sung', 'chưa hết', 'In addition to what has already been mentioned, often something unwelcome.', ['besides', 'what is more', 'in addition'], ['however', 'by contrast'], 'The hotel room was tiny and faced a noisy highway. On top of that, the air conditioner was broken.'),
  'not to mention': T('Bổ sung', 'chưa kể đến', 'Used to add a further point that makes the situation even more serious or impressive.', ['in addition to', 'as well as', 'besides'], [], 'The renovation will take at least six months, not to mention the noise it will bring to the whole street.'),
  'coupled with': T('Bổ sung', 'cộng thêm, kèm theo', 'Combined with; together with.', ['combined with', 'along with', 'together with'], ['apart from', 'without'], 'Weak demand, coupled with rising fuel costs, forced the airline to cancel the route.'),

  // ---------------------------------------------------------------- tương đồng
  similarly: T('Tương đồng', 'tương tự', 'In a way that is alike; used to show that the next case resembles the one before.', ['likewise', 'in the same way', 'by the same token'], ['by contrast', 'conversely'], 'Honeybees perform dances that tell nestmates where to find food. Similarly, many ants lay scent trails that lead nestmates to a meal.'),
  likewise: T('Tương đồng', 'cũng vậy, cũng thế', 'In the same way; also.', ['similarly', 'in the same way', 'also'], ['by contrast', 'in contrast'], 'Wolves hunt in packs to bring down animals much larger than themselves; likewise, lions often work together to catch buffalo.'),
  'in the same way': T('Tương đồng', 'theo cách tương tự', 'Used to show that the next example works like the one just described.', ['similarly', 'likewise', 'analogously'], ['by contrast', 'conversely'], 'A vaccine trains the body to recognize a virus before any real infection. In the same way, fire drills prepare students to act calmly before a real emergency.'),
  'just as': T('Tương đồng', 'giống như', 'Used to introduce a comparison showing that two things happen in the same way.', ['in the same way that', 'like', 'much as'], ['unlike', 'whereas'], 'Just as a map simplifies a landscape, a scientific model simplifies a complex system.'),
  'by the same token': T('Tương đồng', 'cũng theo lẽ đó', 'For the same reason; applying the same logic to another case.', ['similarly', 'likewise', 'in the same way'], ['by contrast', 'conversely'], 'If praise can motivate a child to work harder, then, by the same token, constant criticism can discourage her.'),
  analogously: T('Tương đồng', 'tương tự như thế', 'In a way that is similar or comparable to another case.', ['similarly', 'in the same way', 'comparably'], ['by contrast', 'conversely'], 'A thermostat turns on the heater when a room gets cold; analogously, the body starts to shiver when its temperature drops.'),

  // ================================================ 1 · tương phản và nhượng bộ
  // ---------------------------------------------------------------- tương phản
  'in contrast': T('Tương phản', 'trái ngược với điều đó', 'Used to compare two things and show how they differ.', ['by contrast', 'conversely', 'on the other hand'], ['similarly', 'likewise'], 'Many desert plants have thick, waxy leaves that hold in water. In contrast, many rainforest plants have thin leaves with pointed tips that shed rain quickly.'),
  conversely: T('Tương phản', 'theo chiều ngược lại', 'In the opposite way; used when the second idea reverses the first.', ['in contrast', 'on the other hand', 'by contrast'], ['similarly', 'likewise'], 'When interest rates rise, people tend to borrow less. Conversely, when rates fall, borrowing usually increases.'),
  'on the other hand': T('Tương phản', 'mặt khác', 'Used to introduce a second side of a situation that differs from the first.', ['in contrast', 'however', 'that said', 'then again'], ['similarly', 'in addition'], 'On one hand, living downtown means a short walk to work. On the other hand, apartments there cost nearly twice as much.'),
  'in comparison': T('Tương phản', 'so ra thì', 'Used when comparing one thing with another to show a difference.', ['by comparison', 'in contrast', 'by contrast'], ['similarly', 'likewise'], 'The old engine burned eight liters of fuel every hundred kilometers. In comparison, the new one burns just five.'),
  whereas: T('Tương phản', 'còn, trong khi đó', 'Used to compare two facts and show how they are different.', ['while', 'although', 'by contrast'], ['similarly', 'just as'], 'Frogs usually lay their eggs in water, whereas turtles bury theirs in sand or soil on land.'),
  while: T('Tương phản', 'trong khi, dù rằng', 'Used to contrast two facts; it can also mean “although.”', ['whereas', 'although', 'even though'], ['similarly', 'just as'], 'While the northern slope stays covered in snow for half the year, the southern slope remains green through the winter.'),
  unlike: T('Tương phản', 'không giống như', 'Different from; used to contrast one thing with another.', ['in contrast to', 'as opposed to', 'different from'], ['like', 'similar to'], 'Unlike most snakes, the king cobra builds a nest for its eggs.'),
  'as opposed to': T('Tương phản', 'chứ không phải', 'Used to show that one thing is being considered rather than another.', ['rather than', 'instead of', 'in contrast to'], ['as well as', 'along with'], 'The study measured how long students actually slept, as opposed to how long they said they slept.'),
  instead: T('Tương phản', 'thay vào đó', 'In place of something else; as an alternative to what was expected or mentioned.', ['rather', 'alternatively', 'in its place'], ['also', 'as well'], 'The city chose not to repair the old wooden bridge. Instead, it built a new steel one a few meters downstream.'),
  rather: T('Tương phản', 'mà đúng hơn là', 'Used to correct a statement and give a more accurate one.', ['instead', 'on the contrary', 'more precisely'], ['similarly', 'likewise'], 'The drop in bird numbers was not caused by hunting. Rather, it resulted from the loss of the wetlands where the birds nest.'),
  'on the contrary': T('Tương phản', 'ngược hẳn lại', 'Used to reject a statement and say that the opposite is true.', ['quite the opposite', 'rather', 'instead'], ['similarly', 'likewise'], 'The new rule did not slow production. On the contrary, the factory produced more parts than ever.'),
  alternatively: T('Tương phản', 'hoặc theo cách khác', 'Used to suggest another possible choice.', ['instead', 'otherwise', 'as another option'], ['similarly', 'likewise'], 'Visitors can reach the island by ferry. Alternatively, they can drive across the new bridge from the mainland.'),

  // ---------------------------------------------------------------- nhượng bộ
  although: T('Nhượng bộ', 'mặc dù', 'In spite of the fact that.', ['though', 'even though', 'while', 'whereas'], ['because', 'since'], 'Although the museum is small, its collection of old maps is one of the finest in the country.'),
  'even though': T('Nhượng bộ', 'mặc dù thực tế là', 'Despite the fact that; a stronger form of “although.”', ['although', 'though', 'while'], ['because', 'since'], 'Even though the team had practiced the routine for months, it stumbled during the final performance.'),
  'even if': T('Nhượng bộ', 'ngay cả khi', 'Whether or not something happens; used for a possible situation that will not change the result.', ['whether or not', 'regardless of whether'], ['only if', 'provided that'], 'Even if the rain stops tonight, the field will be too muddy for Saturday’s game.'),
  albeit: T('Nhượng bộ', 'dù là, tuy là', 'Although; used before a word or phrase rather than a full clause.', ['although', 'though', 'even though'], ['because'], 'The students finished the project on time, albeit with a lot of help from their teacher.'),
  despite: T('Nhượng bộ', 'bất chấp', 'Without being prevented by something; in spite of.', ['in spite of', 'notwithstanding', 'regardless of'], ['because of', 'owing to'], 'Despite years of drought, the ancient olive trees continue to bear fruit.'),
  'in spite of': T('Nhượng bộ', 'mặc cho', 'Without being stopped or changed by a difficulty.', ['despite', 'notwithstanding', 'regardless of'], ['because of', 'thanks to'], 'The festival went ahead in spite of the storm warnings.'),
  notwithstanding: T('Nhượng bộ', 'dẫu có (trang trọng)', 'In spite of; a formal word used mostly in writing.', ['despite', 'in spite of', 'regardless of'], ['because of', 'owing to'], 'Notwithstanding its high price, the new phone sold out within hours.'),
  nonetheless: T('Nhượng bộ', 'dẫu vậy, tuy thế', 'In spite of what has just been said.', ['nevertheless', 'even so', 'however', 'still'], ['therefore', 'consequently'], 'The hikers were soaked and exhausted. Nonetheless, they pushed on and reached the summit before dark.'),
  still: T('Nhượng bộ', 'dù sao vẫn', 'Even so; despite what has just been said.', ['even so', 'nonetheless', 'however'], ['therefore', 'as a result'], 'The bakery’s ovens broke down at dawn. Still, the owners managed to open on time and sold out by noon.'),
  'all the same': T('Nhượng bộ', 'dẫu sao thì vẫn', 'Despite what has just been said; in spite of this.', ['nevertheless', 'even so', 'nonetheless', 'however'], ['therefore', 'consequently'], 'The instructions were confusing, and several parts were missing. All the same, the students managed to build a working model.'),
  regardless: T('Nhượng bộ', 'bất kể thế nào', 'Without being affected or stopped by the problem just mentioned.', ['nonetheless', 'however', 'anyway'], ['accordingly', 'therefore'], 'The forecast called for heavy rain all weekend. Regardless, the organizers kept the outdoor concert on schedule.'),
  'that said': T('Nhượng bộ', 'tuy nói vậy', 'Used to add a point that limits or balances what was just said.', ['having said that', 'even so', 'however', 'on the other hand'], ['therefore', 'as a result'], 'The new stadium is expensive and years behind schedule. That said, it will give the city a venue for international events.'),
  'be that as it may': T('Nhượng bộ', 'dù có thế đi nữa', 'Even if that is true; despite that.', ['nevertheless', 'even so', 'all the same', 'however'], ['therefore', 'consequently'], 'Critics warned that the bridge could not be finished in two years. Be that as it may, the engineers pressed ahead with the original schedule.'),
  admittedly: T('Nhượng bộ', 'phải thừa nhận rằng', 'Used to admit that something is true before making a different point.', ['granted', 'to be sure', 'it is true that'], [], 'Admittedly, the new subway line cost far more than planned; it has, however, cut many commutes in half.'),
  granted: T('Nhượng bộ', 'đành rằng', 'Used to accept that something is true before arguing a stronger point.', ['admittedly', 'to be sure', 'it is true that'], [], 'Granted, the author’s evidence comes from a single village; her conclusions, though, are carefully argued.'),
  'to be sure': T('Nhượng bộ', 'phải công nhận là', 'Used to admit a point before adding one that outweighs it.', ['admittedly', 'granted', 'certainly'], [], 'To be sure, electric buses cost more to buy than diesel ones, but they are far cheaper to run.'),

  // ================================================ 2 · ví dụ, diễn giải, thời gian, tổng kết
  // ---------------------------------------------------------------- ví dụ
  'such as': T('Ví dụ', 'chẳng hạn như', 'Used to introduce one or more examples of the thing just mentioned.', ['for example', 'like', 'including'], ['in general', 'overall'], 'Cold-blooded animals, such as snakes and lizards, rely on the sun to warm their bodies.'),
  'to illustrate': T('Ví dụ', 'để minh họa', 'Used to introduce an example that makes a general point clearer.', ['for example', 'for instance', 'as an illustration'], ['in general', 'overall'], 'Many animals use tools to get food. To illustrate, sea otters crack open shellfish by hitting them against rocks.'),
  'in particular': T('Ví dụ', 'đặc biệt là', 'Especially; used to single out one member of a group.', ['especially', 'particularly', 'specifically'], ['in general', 'overall'], 'Several of the museum’s paintings were damaged in the flood; one portrait, in particular, will take years to restore.'),
  notably: T('Ví dụ', 'đáng chú ý là', 'Used to point out an especially important example.', ['especially', 'in particular', 'particularly'], ['in general', 'overall'], 'The festival drew performers from many countries, notably Brazil, whose drummers opened the show.'),

  // ---------------------------------------------------------------- diễn giải lại
  namely: T('Diễn giải lại', 'cụ thể là', 'Used to name exactly the people or things just referred to.', ['that is', 'specifically', 'to be specific'], [], 'The recipe calls for only two spices, namely cumin and black pepper.'),
  specifically: T('Diễn giải lại', 'nói cụ thể hơn', 'Used to give more exact details about what was just said.', ['in particular', 'namely', 'more precisely'], ['in general', 'broadly'], 'The study focused on one part of the brain—specifically, the region that stores memories of places.'),
  'put differently': T('Diễn giải lại', 'diễn đạt theo cách khác', 'Used to say the same idea again in another way.', ['in other words', 'that is', 'to put it another way'], [], 'The new law puts the burden of proof on the company; put differently, the company must show that its product is safe, rather than critics having to show that it is harmful.'),
  'to clarify': T('Diễn giải lại', 'nói cho rõ', 'Used to explain something more exactly so that it is not misunderstood.', ['that is', 'in other words', 'to be clear'], [], 'The report uses the word “youth” throughout. To clarify, it means anyone between the ages of 15 and 24.'),

  // ---------------------------------------------------------------- nhấn mạnh
  indeed: T('Nhấn mạnh', 'quả thực', 'Used to confirm and strengthen what was just said, often by adding a stronger point.', ['in fact', 'certainly', 'truly'], [], 'The storm was strong; indeed, it was the most powerful to hit the island in a century.'),
  'in fact': T('Nhấn mạnh', 'thực ra, trên thực tế', 'Used to add a stronger point or to correct a mistaken idea.', ['indeed', 'actually', 'as a matter of fact'], [], 'Many people believe that goldfish can remember things for only a few seconds. In fact, goldfish can be trained to respond to a feeding signal for months.'),

  // ---------------------------------------------------------------- trình tự thời gian
  initially: T('Trình tự thời gian', 'ban đầu', 'At the beginning; at first.', ['at first', 'originally', 'in the beginning'], ['eventually', 'later', 'ultimately'], 'Initially, the astronomers thought the strange signal came from deep space; later tests traced it to a microwave oven at the observatory.'),
  beforehand: T('Trình tự thời gian', 'từ trước', 'Before a particular event; in advance.', ['in advance', 'earlier', 'previously'], ['afterward', 'later'], 'The recital began at seven; beforehand, the pianist had warmed up for an hour in a practice room.'),
  afterward: T('Trình tự thời gian', 'rồi sau đó', 'At a later time; after the event just mentioned.', ['later', 'subsequently', 'then'], ['beforehand', 'previously'], 'The team spent the morning collecting water samples from the lake. Afterward, they tested the samples in a lab on shore.'),
  thereafter: T('Trình tự thời gian', 'từ đó về sau', 'After that time; from then on.', ['afterward', 'subsequently', 'from then on'], ['beforehand', 'previously'], 'The town library opened in 1921 and thereafter grew into the largest collection in the state.'),
  'until then': T('Trình tự thời gian', 'cho đến lúc đó', 'Up to the time just mentioned, but not after it.', ['before then', 'up to that point', 'till then'], ['since then', 'from then on'], 'The first bridge over the river opened in 1932; until then, the only way across was by ferry.'),
  'since then': T('Trình tự thời gian', 'kể từ đó', 'From the time just mentioned until now.', ['ever since', 'thereafter', 'from then on'], ['until then', 'before that'], 'The factory closed in 1998; since then, the river has slowly returned to health.'),
  eventually: T('Trình tự thời gian', 'rốt cuộc, sau cùng', 'In the end, especially after a long time or many problems.', ['in the end', 'ultimately', 'finally'], ['initially', 'immediately'], 'After dozens of failed designs, the engineers eventually built a drone that could fly through heavy rain.'),
  finally: T('Trình tự thời gian', 'cuối cùng', 'As the last step in a series, or after a long wait.', ['lastly', 'eventually', 'in the end', 'in conclusion'], ['first', 'initially'], 'First, the clay is shaped on a wheel; next, it is dried for several days; finally, it is fired in a kiln.'),
  ultimately: T('Trình tự thời gian', 'xét đến cùng, sau rốt', 'In the end; after everything else has happened or been considered.', ['eventually', 'in the end', 'finally'], ['initially', 'at first'], 'The lawsuit dragged on for nine years; ultimately, the court ruled in favor of the farmers.'),
  currently: T('Trình tự thời gian', 'hiện nay', 'At the present time.', ['now', 'at present', 'today'], ['previously', 'formerly'], 'Wolves once roamed across most of the region; currently, they survive in only a few protected valleys.'),

  // ---------------------------------------------------------------- đồng thời
  simultaneously: T('Đồng thời / đối chiếu', 'cùng một lúc', 'At exactly the same time.', ['at the same time', 'concurrently', 'meanwhile'], ['afterward', 'previously', 'one after another'], 'The two cameras record simultaneously, capturing the same moment from opposite sides of the field.'),

  // ---------------------------------------------------------------- tổng kết
  'in short': T('Tổng kết', 'nói ngắn gọn', 'Used to sum up several points in a few words.', ['in brief', 'in sum', 'to sum up'], ['for example', 'specifically'], 'The hotel was far from the beach, its rooms were cramped, and breakfast cost extra. In short, it was poor value for the money.'),
  'in sum': T('Tổng kết', 'tóm lại', 'Used to introduce a summary of several points made before.', ['in short', 'to sum up', 'in summary'], ['for example', 'specifically'], 'The new policy cut costs, shortened wait times and raised patient satisfaction. In sum, the policy did what it was designed to do.'),
  overall: T('Tổng kết', 'nhìn chung', 'Taking everything into account; in general.', ['on the whole', 'all in all', 'in general'], ['in particular', 'specifically'], 'Scores rose in reading, held steady in math and dipped slightly in science; overall, the school’s results improved.'),
  'in conclusion': T('Tổng kết', 'kết luận lại', 'Used to introduce the final point or summary of an argument.', ['to conclude', 'in summary', 'finally'], ['to begin with', 'first'], 'This essay has shown that bike lanes cut costs, clean the air and calm traffic. In conclusion, they are among the best investments a city can make.'),

  // ================================================ 10 · dữ liệu, bằng chứng, cụm từ cố định
  // ---------------------------------------------------------------- khái niệm nghiên cứu
  hypothesis: W('noun', 'giả thuyết', 'An idea or explanation that is tested through research or experiments.', ['theory', 'proposition', 'supposition'], ['fact', 'proof', 'certainty'], 'The team’s hypothesis was that frogs call louder near busy roads; recordings from twelve ponds supported the idea.'),
  variable: W('noun', 'biến số', 'A factor that can change in an experiment and may affect the result.', ['factor', 'element', 'parameter'], ['constant', 'fixed factor'], 'In the experiment, light was the only variable; soil, water and temperature were kept the same for every plant.'),
  sample: W('noun', 'mẫu nghiên cứu', 'A small group chosen from a larger population to be studied.', ['subset', 'selection', 'cross section'], ['population', 'whole'], 'Rather than question every resident, the researchers surveyed a sample of 2,000 adults.'),
  representative: W('adjective', 'mang tính đại diện', 'Typical of a larger group, so that it can stand for the whole group.', ['typical', 'characteristic', 'balanced'], ['skewed', 'unrepresentative', 'atypical'], 'To be representative, the sample had to include voters of every age, income and region.'),
  skewed: W('adjective', 'bị lệch, thiên lệch', 'Distorted so that it does not show the true picture, often by favoring one group.', ['distorted', 'biased', 'lopsided'], ['representative', 'balanced', 'unbiased'], 'Because the poll was posted only on a gaming website, its results were skewed toward young men.'),
  outlier: W('noun', 'giá trị ngoại lai', 'A result or data point that is very different from all the others.', ['anomaly', 'exception', 'aberration'], ['norm', 'average'], 'One temperature reading of 95 degrees was an outlier, far above every other measurement, so the team rechecked the thermometer.'),
  correlation: W('noun', 'mối tương quan', 'A connection between two things in which one tends to change when the other changes.', ['association', 'link', 'relationship'], ['independence', 'lack of connection'], 'The study found a strong correlation between hours of sleep and test scores, though it could not show that one caused the other.'),
  causation: W('noun', 'quan hệ nhân quả', 'The process of one thing directly making another thing happen.', ['causality', 'cause and effect'], ['coincidence', 'mere correlation'], 'Students who eat breakfast tend to earn higher grades, but that pattern alone does not prove causation; families that serve breakfast may also offer more help with homework.'),
  empirical: W('adjective', 'dựa trên thực nghiệm', 'Based on observation or experiment rather than on theory alone.', ['observational', 'experimental', 'evidence-based'], ['theoretical', 'speculative'], 'The theory was elegant, but it lacked empirical support: no one had ever observed the particle it predicted.'),
  qualitative: W('adjective', 'định tính', 'Describing qualities, experiences or meanings rather than numbers.', ['descriptive', 'non-numerical', 'interpretive'], ['quantitative', 'numerical', 'statistical'], 'Instead of counting how often the children spoke, the researchers took a qualitative approach, recording what they said and how they seemed to feel.'),
  quantitative: W('adjective', 'định lượng', 'Measured or expressed in numbers.', ['numerical', 'statistical', 'measurable'], ['qualitative', 'descriptive'], 'Unlike the interviews, which captured feelings, the survey was quantitative: every answer was a number from 1 to 10.'),

  // ---------------------------------------------------------------- động từ về bằng chứng
  corroborate: W('verb', 'chứng thực, xác nhận', 'To confirm or support a claim with new evidence.', ['confirm', 'substantiate', 'bolster', 'verify'], ['refute', 'contradict', 'undermine'], 'Satellite photos corroborate the villagers’ account: the river really did change its course in the 1990s.'),
  substantiate: W('verb', 'chứng minh bằng chứng cứ', 'To provide evidence that shows a claim is true.', ['corroborate', 'bolster', 'verify', 'prove'], ['refute', 'disprove', 'undermine'], 'The reporter could not substantiate the rumor, so the newspaper refused to print it.'),
  bolster: W('verb', 'củng cố', 'To make an argument, belief or position stronger.', ['strengthen', 'reinforce', 'corroborate', 'substantiate'], ['undermine', 'weaken', 'erode'], 'The discovery of a second, identical tool nearby helped bolster the case that the site had been a workshop.'),
  undermine: W('verb', 'làm suy yếu, làm lung lay', 'To gradually weaken something, such as trust, an argument or an effort.', ['weaken', 'erode', 'subvert'], ['bolster', 'strengthen', 'support'], 'News that the lead author had been paid by the drug’s maker was enough to undermine trust in the study.'),
  refute: W('verb', 'bác bỏ', 'To prove that a statement or theory is wrong.', ['disprove', 'rebut', 'debunk'], ['confirm', 'corroborate', 'prove'], 'A single fossil older than the supposed ancestor would be enough to refute the theory outright, not merely weaken it.'),
  replicate: W('verb', 'lặp lại (thí nghiệm)', 'To repeat an experiment or study to see whether the same results appear.', ['reproduce', 'repeat', 'duplicate'], ['originate', 'deviate from'], 'Other labs tried to replicate the experiment, following the original steps exactly, but none obtained the same results.'),

  // ---------------------------------------------------------------- cụm từ cố định
  'attribute to': W('phrase', 'quy cho, cho là do', 'To say or believe that something is caused by a particular thing.', ['ascribe to', 'credit to', 'blame on'], ['dissociate from'], 'The decline in bee numbers is difficult to attribute to any single cause.'),
  'account for': W('phrase', 'giải thích cho, lý giải', 'To explain something or be the reason for it.', ['explain', 'be responsible for', 'give rise to'], ['leave unexplained'], 'Differences in diet may account for the gap in height between the two groups.'),
  'contingent on': W('phrase', 'tùy thuộc vào', 'Depending on something else happening first.', ['dependent on', 'conditional on', 'subject to'], ['independent of', 'unconditional'], 'Funding for a second year is contingent on the success of the first: if the pilot fails, the grant ends.'),
  'independent of': W('phrase', 'không phụ thuộc vào', 'Not depending on or determined by something else.', ['unaffected by', 'unrelated to', 'separate from'], ['contingent on', 'dependent on', 'derived from'], 'The results were independent of the volunteers’ age: people in their twenties and people in their seventies scored almost exactly the same.'),
  'indicative of': W('phrase', 'là dấu hiệu của', 'Serving as a sign that something exists or is true.', ['suggestive of', 'a sign of', 'symptomatic of'], ['unrelated to'], 'A wagging tail is not always indicative of friendliness; sometimes it signals nervousness or even fear.'),
  'susceptible to': W('phrase', 'dễ bị ảnh hưởng bởi', 'Easily harmed or influenced by something.', ['vulnerable to', 'prone to', 'at risk from'], ['resistant to', 'immune to'], 'Young seedlings are highly susceptible to frost, so gardeners cover them on cold nights.'),
  'prone to': W('phrase', 'hay bị, dễ mắc', 'Likely to suffer from or do something, usually something bad.', ['susceptible to', 'liable to', 'inclined to'], ['resistant to', 'immune to'], 'Old wooden bridges are prone to rot in wet climates, so inspectors check them every year.'),
  'conducive to': W('phrase', 'thuận lợi cho', 'Making a particular result or activity more likely.', ['favorable to', 'helpful to', 'good for'], ['detrimental to', 'harmful to', 'unfavorable to'], 'Warm, humid air is conducive to the growth of mold, so the museum keeps its storage rooms cool and dry.'),
  'relative to': W('phrase', 'so với', 'In comparison with something else.', ['compared with', 'in proportion to', 'in comparison with'], ['in absolute terms'], 'Relative to its size, an ant can lift an astonishing amount of weight.'),
  'in line with': W('phrase', 'theo đúng, thống nhất với', 'In agreement with or following a rule, plan or expectation.', ['consistent with', 'in keeping with', 'in accordance with'], ['contrary to', 'at odds with'], 'In line with the new safety rules, all visitors must now wear helmets on the construction site.'),
  'contrary to': W('phrase', 'trái với', 'Opposite to or in disagreement with something.', ['at odds with', 'in opposition to', 'against'], ['in line with', 'consistent with'], 'The author claims that the two scientists never met. Contrary to that claim, their letters mention at least six meetings.'),
  'compatible with': W('phrase', 'tương thích với', 'Able to exist or work together with something without problems.', ['suited to', 'consistent with', 'in harmony with'], ['incompatible with', 'at odds with'], 'The new charger is not compatible with older phones, so many customers will need an adapter.'),
};

/** Chỉ số chủ đề (0-based trong VERBAL_THEMES) → các từ MỚI theo thứ tự học. */
export const THEME_ADDITIONS: Record<number, string[]> = {
  0: [
    // kết quả
    'hence', 'accordingly', 'for this reason', 'as a consequence', 'so', 'it follows that', 'thereby', 'in turn', 'in response', 'to that end',
    // bổ sung
    'additionally', 'also', 'as well as', 'besides', 'what is more', 'further', 'on top of that', 'not to mention', 'coupled with',
    // tương đồng
    'similarly', 'likewise', 'in the same way', 'just as', 'by the same token', 'analogously',
  ],
  1: [
    // tương phản
    'in contrast', 'conversely', 'on the other hand', 'in comparison', 'whereas', 'while', 'unlike', 'as opposed to', 'instead', 'rather', 'on the contrary', 'alternatively',
    // nhượng bộ
    'although', 'even though', 'even if', 'albeit', 'despite', 'in spite of', 'notwithstanding', 'nonetheless', 'still', 'all the same', 'regardless', 'that said', 'be that as it may', 'admittedly', 'granted', 'to be sure',
  ],
  2: [
    // ví dụ
    'such as', 'to illustrate', 'in particular', 'notably',
    // diễn giải lại
    'namely', 'specifically', 'put differently', 'to clarify',
    // nhấn mạnh
    'indeed', 'in fact',
    // thời gian
    'initially', 'beforehand', 'afterward', 'thereafter', 'until then', 'since then', 'eventually', 'finally', 'ultimately', 'currently',
    // đồng thời
    'simultaneously',
    // tổng kết
    'in short', 'in sum', 'overall', 'in conclusion',
  ],
  10: [
    // khái niệm nghiên cứu
    'hypothesis', 'variable', 'sample', 'representative', 'skewed', 'outlier', 'correlation', 'causation', 'empirical', 'qualitative', 'quantitative',
    // động từ về bằng chứng
    'corroborate', 'substantiate', 'bolster', 'undermine', 'refute', 'replicate',
    // cụm từ cố định
    'attribute to', 'account for', 'contingent on', 'independent of', 'indicative of', 'susceptible to', 'prone to', 'conducive to', 'relative to', 'in line with', 'contrary to', 'compatible with',
  ],
};
