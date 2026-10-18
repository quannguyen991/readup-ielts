const fs = require('fs');

let content = fs.readFileSync('src/navigation/nav-items.ts', 'utf8');

// Normalize line breaks to \n for replacement
const isCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

const target1 = `          { key: 'shadow', label: 'Đọc theo VOA', href: '/shadow', icon: 'mic' },
          { key: 'speaking', label: 'Phòng luyện nói', href: '/speaking', icon: 'chat' },
          // Khu luyện nói: phát âm, gia sư AI, khoá học. Có thanh tab riêng (app/hub/_layout.tsx).
          { key: 'hub', label: 'Luyện nói AI', href: '/hub', icon: 'mic' },`;

const replace1 = `          // Khu luyện nói AI: Gia sư AI, Khám phá, Presentation Coach, Phòng luyện nói, Lồng tiếng video, Shadowing
          {
            key: 'hub',
            label: 'Luyện nói AI',
            href: '/hub',
            icon: 'mic',
            children: [
              { key: 'hub-tutor', label: 'Gia sư AI', href: '/hub/tutor', icon: 'chat' },
              { key: 'hub-explore', label: 'Khám phá', href: '/hub/explore', icon: 'compass' },
              { key: 'hub-presentation', label: 'Presentation Coach', href: '/hub/course/presentation', icon: 'sparkle' },
              { key: 'speaking', label: 'Phòng luyện nói & Forecast', href: '/speaking', icon: 'trophy' },
              { key: 'hub-dubbing', label: 'Lồng tiếng video', href: '/speaking/long-tieng', icon: 'play' },
              { key: 'shadow', label: 'Đọc theo VOA', href: '/shadow', icon: 'volume' },
            ],
          },`;

if (!content.includes(target1)) {
  console.error('Target 1 not found');
  process.exit(1);
}
content = content.replace(target1, replace1);

const target2 = `  shadow: 'VOA shadowing',
  speaking: 'Speaking room',`;

const replace2 = `  shadow: 'VOA shadowing',
  speaking: 'Speaking & Forecast',
  hub: 'AI Speaking Hub',
  'hub-tutor': 'AI Tutors',
  'hub-explore': 'Explore',
  'hub-presentation': 'Presentation Coach',
  'hub-dubbing': 'Video dubbing',`;

if (!content.includes(target2)) {
  console.error('Target 2 not found');
  process.exit(1);
}
content = content.replace(target2, replace2);

if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync('src/navigation/nav-items.ts', content, 'utf8');
console.log('Successfully updated nav-items.ts');
