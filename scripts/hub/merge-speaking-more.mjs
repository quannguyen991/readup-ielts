// Gộp src/data/hub/speaking-more-raw/{mock,gt}/*.json thành speaking-mocks.json và speaking-gt.json.
// Chạy: node scripts/hub/merge-speaking-more.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RAW = path.join(ROOT, 'src/data/hub/speaking-more-raw');
const OUT = path.join(ROOT, 'src/data/hub');
const read = (k) => fs.readdirSync(path.join(RAW, k)).filter((f) => f.endsWith('.json')).sort().map((f) => ({ f, o: JSON.parse(fs.readFileSync(path.join(RAW, k, f), 'utf8')) }));

const mocks = read('mock').map((x) => x.o);
const TITLES = {
  'gioi-thieu': 'Giới thiệu và làm quen', 'hoi-thong-tin': 'Hỏi thông tin và chỉ đường', 'nho-giup': 'Nhờ giúp, đề nghị và từ chối lịch sự',
  'phan-nan': 'Phàn nàn và xin lỗi', 'y-kien': 'Nêu ý kiến, đồng ý và phản đối', 'ke-chuyen': 'Kể chuyện và trải nghiệm',
  'mo-ta': 'Mô tả người, nơi chốn, đồ vật', 'dien-thoai': 'Điện thoại, đặt chỗ và dịch vụ', 'cong-so': 'Công sở: họp, báo cáo, email nói', 'du-lich': 'Du lịch và nhà hàng',
  'thoi-quen': 'Thói quen và một ngày của bạn', 'mua-sam': 'Mua sắm và tiền bạc', 'am-thuc': 'Ăn uống và nấu nướng', 'suc-khoe': 'Sức khỏe và đi khám',
  'nha-cua': 'Nhà cửa và hàng xóm', 'di-chuyen': 'Di chuyển và giao thông', 'ban-be': 'Bạn bè, gia đình và kế hoạch', 'cong-nghe': 'Công nghệ và mạng xã hội',
  'hoc-tap': 'Học tập và trường lớp', 'xa-hoi': 'Xã hội, tin tức và ý kiến',
};
const gt = read('gt').map(({ f, o }) => ({ id: f.replace('.json', ''), titleVi: TITLES[f.replace('.json', '')] ?? f, tasks: o }));
fs.writeFileSync(path.join(OUT, 'speaking-mocks.json'), JSON.stringify(mocks, null, 1));
fs.writeFileSync(path.join(OUT, 'speaking-gt.json'), JSON.stringify(gt, null, 1));
console.log('đề thi thử', mocks.length, '· nhóm giao tiếp', gt.length, '· đề', gt.reduce((n, c) => n + c.tasks.length, 0));
