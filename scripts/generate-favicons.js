const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const svgPath = path.join(publicDir, 'favicon.svg');

// 생성할 아이콘 크기들
const sizes = [
  { name: 'favicon-16.png', size: 16 },
  { name: 'favicon-32.png', size: 32 },
  { name: 'favicon.png', size: 32 },
  { name: 'logo192.png', size: 192 },
  { name: 'logo512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

async function generateFavicons() {
  try {
    // SVG 파일 확인
    if (!fs.existsSync(svgPath)) {
      console.error(`SVG 파일을 찾을 수 없습니다: ${svgPath}`);
      process.exit(1);
    }

    console.log('파비콘 생성 시작...');
    console.log(`SVG 파일: ${svgPath}`);

    // 각 크기별로 PNG 생성
    for (const { name, size } of sizes) {
      const outputPath = path.join(publicDir, name);
      
      await sharp(svgPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✓ ${name} (${size}x${size}) 생성 완료`);
    }

    // favicon.ico 생성 (16x16, 32x32, 48x48 포함)
    const ico16 = await sharp(svgPath)
      .resize(16, 16, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();

    const ico32 = await sharp(svgPath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();

    const ico48 = await sharp(svgPath)
      .resize(48, 48, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();

    // ICO 파일은 복잡하므로, 대신 32x32 PNG를 favicon.ico로 복사
    // (대부분의 브라우저는 PNG를 ICO로 인식)
    fs.writeFileSync(
      path.join(publicDir, 'favicon.ico'),
      ico32
    );
    console.log('✓ favicon.ico 생성 완료');

    console.log('\n모든 파비콘 생성 완료!');
  } catch (error) {
    console.error('파비콘 생성 중 오류 발생:', error);
    process.exit(1);
  }
}

generateFavicons();

