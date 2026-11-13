const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function captureScreenshots() {
  const screenshotsDir = path.resolve(__dirname, '..', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 2 });

  // 1. Dashboard
  console.log('1. Navigating to Dashboard at http://localhost:8000...');
  await page.goto('http://localhost:8000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));
  console.log('Capturing 01_dashboard.png...');
  await page.screenshot({ path: path.join(screenshotsDir, '01_dashboard.png'), fullPage: false });

  // 2. Upload Page & Preview
  console.log('2. Navigating to Upload page...');
  const navButtons = await page.$$('button');
  for (const btn of navButtons) {
    const text = await page.evaluate(el => el.innerText, btn);
    if (text.includes('Upload & Analyse') || text.includes('Analyse Scan')) {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 800));

  console.log('Clicking quick benchmark sample to generate preview...');
  const sampleButtons = await page.$$('button');
  for (const btn of sampleButtons) {
    const text = await page.evaluate(el => el.innerText, btn);
    if (text.includes('Overheating')) {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  console.log('Capturing 02_thermal_image_upload_preview.png...');
  await page.screenshot({ path: path.join(screenshotsDir, '02_thermal_image_upload_preview.png'), fullPage: false });

  // 4. Core Analysis Workflow
  console.log('4. Clicking Execute Thermal Fault Analysis...');
  const uploadPageButtons = await page.$$('button');
  for (const btn of uploadPageButtons) {
    const text = await page.evaluate(el => el.innerText, btn);
    if (text.includes('Execute Thermal Fault Analysis')) {
      await btn.click();
      break;
    }
  }
  // Immediately capture the active progress workflow state
  await new Promise(r => setTimeout(r, 200));
  console.log('Capturing 04_core_analysis_workflow.png...');
  await page.screenshot({ path: path.join(screenshotsDir, '04_core_analysis_workflow.png'), fullPage: false });

  // 5. Analysis Result Page
  console.log('5. Waiting for Diagnostic Analysis Results Page to render...');
  await page.waitForFunction(() => {
    return document.body.innerText.includes('Diagnostic Analysis Results');
  }, { timeout: 20000 });
  await new Promise(r => setTimeout(r, 1500));
  console.log('Capturing 05_analysis_result.png...');
  await page.screenshot({ path: path.join(screenshotsDir, '05_analysis_result.png'), fullPage: false });

  // 3. Image Preprocessing Page (Original vs OpenCV Enhanced)
  console.log('3. Navigating to Image Preprocessing page...');
  const resultPageButtons = await page.$$('button');
  for (const btn of resultPageButtons) {
    const text = await page.evaluate(el => el.innerText, btn);
    if (text.includes('Image Preprocessing')) {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 800));

  console.log('Uploading sample image to Preprocessing Pipeline...');
  const sampleImagePath = path.resolve(__dirname, '..', 'sample_data', 'sample_overheating_1.png');
  const prepFileInput = await page.$('input[type="file"]');
  if (prepFileInput) {
    await prepFileInput.uploadFile(sampleImagePath);
    await page.waitForFunction(() => {
      return document.body.innerText.includes('Original vs. OpenCV Enhanced Thermogram');
    }, { timeout: 20000 });
    await new Promise(r => setTimeout(r, 1200));
  }
  console.log('Capturing 03_original_vs_processed.png...');
  await page.screenshot({ path: path.join(screenshotsDir, '03_original_vs_processed.png'), fullPage: false });

  // 6. Error Handling for Invalid Image Uploads
  console.log('6. Navigating back to Upload page for error handling verification...');
  const prepNavButtons = await page.$$('button');
  for (const btn of prepNavButtons) {
    const text = await page.evaluate(el => el.innerText, btn);
    if (text.includes('Upload & Analyse') || text.includes('Analyse Scan')) {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 800));

  console.log('Triggering invalid file format upload...');
  const invalidFilePath = '/tmp/invalid_thermal_data.pdf';
  fs.writeFileSync(invalidFilePath, '%PDF-1.5 Invalid Binary Document Header');
  const errFileInput = await page.$('input[type="file"]');
  if (errFileInput) {
    await errFileInput.uploadFile(invalidFilePath);
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log('Capturing 06_error_handling_invalid_upload.png...');
  await page.screenshot({ path: path.join(screenshotsDir, '06_error_handling_invalid_upload.png'), fullPage: false });

  console.log('🎉 ALL 6 APPLICATION SCREENSHOTS SUCCESSFULLY CAPTURED!');
  await browser.close();
}

captureScreenshots().catch(err => {
  console.error('Error during screenshot capture:', err);
  process.exit(1);
});
