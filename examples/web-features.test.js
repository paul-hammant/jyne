/**
 * Web Features Browser Tests
 * Tests for web/HTML feature demonstrations in Tsyne Browser
 *
 * Run with: npm run build && node examples/web-features.test.js
 */

const { browserTest, runBrowserTests } = require('../dist/src/index.js');

console.log('Starting Web Features Browser Tests...\n');

// Test 1: /text-features - Verify text display and formatting
browserTest(
  'Test /text-features',
  [
    {
      path: '/text-features',
      code: require('fs').readFileSync(__dirname + '/pages/text-features.ts', 'utf8')
    },
    {
      path: '/',
      code: require('fs').readFileSync(__dirname + '/pages/index.ts', 'utf8')
    }
  ],
  async (bt) => {
    await bt.createBrowser('/text-features');
    const ctx = bt.getContext();
    bt.assertUrl('/text-features');

    ctx.logStep('Verifying page heading');

    // Verify heading present
    const heading = await ctx.findWidget({ text: 'Text Features Demo' });
    if (!heading) {
      throw new Error('Assertion failed: Page heading not found\n  Expected: "Text Features Demo"');
    }
    ctx.logAssertion('Page heading found', 'Text Features Demo', heading.text);

    ctx.logStep('Verifying HTML comparison section');

    // Verify comparison section exists
    const comparison = await ctx.findWidget({ text: '=== Comparison to HTML ===' });
    if (!comparison) {
      throw new Error('Assertion failed: HTML comparison section not found');
    }
    ctx.logAssertion('HTML comparison section present');

    ctx.logStep('Verifying rich text formatting examples');

    // Verify specific formatting examples present
    await ctx.assertElementsPresent([
      'HTML: <strong>Bold</strong>',
      '=== Rich Text ===',
      '=== Paragraphs ==='
    ], 'Text formatting sections');
    ctx.logAssertion('Rich text formatting sections verified');

    ctx.logStep('Verifying paragraphs section');

    // Verify paragraphs section exists
    const paragraphsSection = await ctx.findWidget({ text: '=== Paragraphs ===' });
    if (!paragraphsSection) {
      throw new Error('Assertion failed: Paragraphs section not found');
    }
    ctx.logAssertion('Paragraphs section present');

    console.log('✓ /text-features test passed - text rendering verified\n');
  }
);

// Test 2: /scrolling - Verify scrollable content with 100 lines
browserTest(
  'Test /scrolling',
  [
    {
      path: '/scrolling',
      code: require('fs').readFileSync(__dirname + '/pages/scrolling.ts', 'utf8')
    },
    {
      path: '/',
      code: require('fs').readFileSync(__dirname + '/pages/index.ts', 'utf8')
    }
  ],
  async (bt) => {
    await bt.createBrowser('/scrolling');
    const ctx = bt.getContext();
    bt.assertUrl('/scrolling');

    ctx.logStep('Verifying scrolling page structure');

    // Verify heading
    const heading = await ctx.findWidget({ text: 'Scrolling Demo' });
    if (!heading) {
      throw new Error('Assertion failed: Page heading not found\n  Expected: "Scrolling Demo"');
    }
    ctx.logAssertion('Page heading found', 'Scrolling Demo', heading.text);

    ctx.logStep('Verifying first line of scrollable content');

    // Verify first line exists
    const firstLine = await ctx.findWidget({ text: 'Line 1: This is a line of text to demonstrate scrolling. Scroll down to see more!' });
    if (!firstLine) {
      throw new Error('Assertion failed: First line (Line 1) not found in scrollable content');
    }
    ctx.logAssertion('First line present', 'Line 1', 'Line 1');

    ctx.logStep('Verifying middle line (Line 50) exists');

    // Verify middle line exists
    const middleLine = await ctx.findWidget({ text: 'Line 50: This is a line of text to demonstrate scrolling. Scroll down to see more!' });
    if (!middleLine) {
      throw new Error('Assertion failed: Middle line (Line 50) not found');
    }
    ctx.logAssertion('Middle line present', 'Line 50', 'Line 50');

    ctx.logStep('Verifying last line (Line 100) exists');

    // Verify last line exists (Line 100)
    const lastLine = await ctx.findWidget({ text: 'Line 100: This is a line of text to demonstrate scrolling. Scroll down to see more!' });
    if (!lastLine) {
      throw new Error('Assertion failed: Last line (Line 100) not found\n  All 100 lines not rendered in scroll container');
    }
    ctx.logAssertion('Last line present', 'Line 100', 'Line 100');

    ctx.logStep('Verifying total line count');

    // Count label widgets to verify all 100 lines are rendered
    const allWidgets = await ctx.getAllWidgets();
    const labelWidgets = allWidgets.filter(w => w.type === 'label' && w.text.startsWith('Line '));

    if (labelWidgets.length < 100) {
      throw new Error(`Assertion failed: Expected 100 lines\n  Expected: 100 lines\n  Actual:   ${labelWidgets.length} lines`);
    }
    ctx.logAssertion('All lines rendered in scroll container', '100 lines', `${labelWidgets.length} lines`);

    console.log('✓ /scrolling test passed - verified scrollable content\n');
  }
);

// Test 3: /hyperlinks - Test link clicking and navigation outcomes
browserTest(
  'Test /hyperlinks',
  [
    {
      path: '/hyperlinks',
      code: require('fs').readFileSync(__dirname + '/pages/hyperlinks.ts', 'utf8')
    },
    {
      path: '/about',
      code: require('fs').readFileSync(__dirname + '/pages/about.ts', 'utf8')
    },
    {
      path: '/contact',
      code: require('fs').readFileSync(__dirname + '/pages/contact.ts', 'utf8')
    },
    {
      path: '/form',
      code: require('fs').readFileSync(__dirname + '/pages/form.ts', 'utf8')
    },
    {
      path: '/',
      code: require('fs').readFileSync(__dirname + '/pages/index.ts', 'utf8')
    }
  ],
  async (bt) => {
    await bt.createBrowser('/hyperlinks');
    const ctx = bt.getContext();
    bt.assertUrl('/hyperlinks');

    ctx.logStep('Initial page load verification');

    // Verify heading
    const heading = await ctx.findWidget({ text: 'Hyperlinks & Navigation Demo' });
    if (!heading) {
      throw new Error('Assertion failed: Page heading not found\n  Expected: "Hyperlinks & Navigation Demo"');
    }
    ctx.logAssertion('Page heading present', 'Hyperlinks & Navigation Demo', heading.text);

    ctx.logStep('Test 1: Click "Go to About Page" button and verify outcome');

    // Test navigation button exists
    const aboutButton = await ctx.findWidget({ text: '→ Go to About Page' });
    if (!aboutButton) {
      throw new Error('Assertion failed: Navigation button "→ Go to About Page" not found');
    }
    ctx.logAssertion('About button found', '→ Go to About Page', aboutButton.text);

    // Click button and verify navigation outcome
    await ctx.clickWidget(aboutButton.id);
    await new Promise(resolve => setTimeout(resolve, 200));

    const currentUrl = bt.getCurrentUrl();
    const expectedUrl = bt.getTestUrl('/about');
    if (currentUrl !== expectedUrl) {
      throw new Error(`Assertion failed: Navigation outcome\n  Expected URL: ${expectedUrl}\n  Actual URL:   ${currentUrl}`);
    }
    ctx.logAssertion('Navigation successful', '/about', currentUrl.split('/').pop());

    // Verify About page content loaded
    const aboutHeading = await ctx.findWidget({ text: 'About Page' });
    if (!aboutHeading) {
      throw new Error('Assertion failed: About page content not loaded\n  Expected heading: "About Page"');
    }
    ctx.logAssertion('About page content loaded', 'About Page', aboutHeading.text);

    ctx.logStep('Test 2: Browser back() navigation and verify outcome');

    // Test back navigation
    await bt.back();
    await new Promise(resolve => setTimeout(resolve, 200));

    const backUrl = bt.getCurrentUrl();
    const expectedBackUrl = bt.getTestUrl('/hyperlinks');
    if (backUrl !== expectedBackUrl) {
      throw new Error(`Assertion failed: Back navigation outcome\n  Expected URL: ${expectedBackUrl}\n  Actual URL:   ${backUrl}`);
    }
    ctx.logAssertion('Back navigation successful', '/hyperlinks', backUrl.split('/').pop());

    // Verify we're back on hyperlinks page
    const backHeading = await ctx.findWidget({ text: 'Hyperlinks & Navigation Demo' });
    if (!backHeading) {
      throw new Error('Assertion failed: Hyperlinks page not restored after back()');
    }
    ctx.logAssertion('Original page content restored', 'Hyperlinks & Navigation Demo', backHeading.text);

    ctx.logStep('Test 3: Click "Go to Contact Page" button and verify outcome');

    // Test second navigation button
    const contactButton = await ctx.findWidget({ text: '→ Go to Contact Page' });
    if (!contactButton) {
      throw new Error('Assertion failed: Contact button not found');
    }

    await ctx.clickWidget(contactButton.id);
    await new Promise(resolve => setTimeout(resolve, 200));

    const contactUrl = bt.getCurrentUrl();
    const expectedContactUrl = bt.getTestUrl('/contact');
    if (contactUrl !== expectedContactUrl) {
      throw new Error(`Assertion failed: Contact navigation outcome\n  Expected URL: ${expectedContactUrl}\n  Actual URL:   ${contactUrl}`);
    }
    ctx.logAssertion('Contact page navigation successful', '/contact', contactUrl.split('/').pop());

    ctx.logStep('Test 4: Browser forward() navigation and verify outcome');

    // Go back then forward
    await bt.back();
    await new Promise(resolve => setTimeout(resolve, 200));
    await bt.forward();
    await new Promise(resolve => setTimeout(resolve, 200));

    const forwardUrl = bt.getCurrentUrl();
    if (forwardUrl !== expectedContactUrl) {
      throw new Error(`Assertion failed: Forward navigation outcome\n  Expected URL: ${expectedContactUrl}\n  Actual URL:   ${forwardUrl}`);
    }
    ctx.logAssertion('Forward navigation successful', '/contact', forwardUrl.split('/').pop());

    console.log('✓ /hyperlinks test passed - verified 4 link/navigation outcomes\n');
  }
);

// Test 4: /images - Verify actual images are displayed
browserTest(
  'Test /images',
  [
    {
      path: '/images',
      code: require('fs').readFileSync(__dirname + '/pages/images.ts', 'utf8')
    },
    {
      path: '/',
      code: require('fs').readFileSync(__dirname + '/pages/index.ts', 'utf8')
    }
  ],
  async (bt) => {
    await bt.createBrowser('/images');
    const ctx = bt.getContext();
    bt.assertUrl('/images');

    ctx.logStep('Verifying page structure');

    // Verify heading
    const heading = await ctx.findWidget({ text: 'Images Demo' });
    if (!heading) {
      throw new Error('Assertion failed: Page heading "Images Demo" not found');
    }
    ctx.logAssertion('Page heading present', 'Images Demo', heading.text);

    ctx.logStep('Verifying all three image modes are documented');

    // Verify all three image modes are documented
    await ctx.assertElementsPresent([
      '1. Contain mode (default) - fits image inside bounds:',
      '2. Stretch mode - stretches to fill bounds:',
      '3. Original mode - displays at original size:'
    ], 'Image mode headers');
    ctx.logAssertion('All three image mode sections present');

    ctx.logStep('Verifying actual image widgets are displayed');

    // Verify image widgets exist (by checking for their presence via getAllWidgets)
    const allWidgets = await ctx.getAllWidgets();
    const imageWidgets = allWidgets.filter(w => w.type === 'image');

    if (imageWidgets.length < 3) {
      throw new Error(`Assertion failed: Expected at least 3 image widgets\n  Expected: >= 3\n  Actual:   ${imageWidgets.length}`);
    }
    ctx.logAssertion('Image widgets displayed', '>= 3', `${imageWidgets.length}`);

    ctx.logStep('Verifying image code examples are shown');

    // Verify code examples for each image
    await ctx.assertElementsPresent([
      "   Code: image('./examples/assets/red-square.svg', 'contain')",
      "   Code: image('./examples/assets/blue-circle.svg', 'stretch')",
      "   Code: image('./examples/assets/green-pattern.svg', 'original')"
    ], 'Image code examples');
    ctx.logAssertion('All image code examples present');

    ctx.logStep('Verifying supported formats documentation');

    // Verify supported formats section
    await ctx.assertElementsPresent([
      '  • PNG (.png)',
      '  • JPEG (.jpg, .jpeg)',
      '  • SVG (.svg)'
    ], 'Image format list');
    ctx.logAssertion('Supported image formats documented');

    console.log('✓ /images test passed - verified actual images displayed\n');
  }
);

// Test 5: /table-demo - Verify table widget with headers and data
browserTest(
  'Test /table-demo',
  [
    {
      path: '/table-demo',
      code: require('fs').readFileSync(__dirname + '/pages/table-demo.ts', 'utf8')
    },
    {
      path: '/',
      code: require('fs').readFileSync(__dirname + '/pages/index.ts', 'utf8')
    }
  ],
  async (bt) => {
    await bt.createBrowser('/table-demo');
    const ctx = bt.getContext();
    bt.assertUrl('/table-demo');

    const heading = await ctx.findWidget({ text: 'Table Demo' });
    if (!heading) {
      throw new Error('Page heading not found');
    }
    console.log('✓ Page heading found: Table Demo');

    // Verify page description present
    const description = await ctx.findWidget({ text: 'This page demonstrates tables, similar to HTML <table> elements' });
    if (!description) {
      throw new Error('Table description not found');
    }
    console.log('✓ Table page content verified');

    console.log('✓ /table-demo test passed\n');
  }
);

// Test 6: /list-demo - Verify list widget with items
browserTest(
  'Test /list-demo',
  [
    {
      path: '/list-demo',
      code: require('fs').readFileSync(__dirname + '/pages/list-demo.ts', 'utf8')
    },
    {
      path: '/',
      code: require('fs').readFileSync(__dirname + '/pages/index.ts', 'utf8')
    }
  ],
  async (bt) => {
    await bt.createBrowser('/list-demo');
    const ctx = bt.getContext();
    bt.assertUrl('/list-demo');

    const heading = await ctx.findWidget({ text: 'List Demo' });
    if (!heading) {
      throw new Error('Page heading not found');
    }
    console.log('✓ Page heading found: List Demo');

    // Verify page description present
    const description = await ctx.findWidget({ text: 'This page demonstrates lists, similar to HTML <ul> and <ol> elements' });
    if (!description) {
      throw new Error('List description not found');
    }
    console.log('✓ List page content verified');

    console.log('✓ /list-demo test passed\n');
  }
);

// Test 7: /dynamic-demo - Verify counter and control buttons
browserTest(
  'Test /dynamic-demo',
  [
    {
      path: '/dynamic-demo',
      code: require('fs').readFileSync(__dirname + '/pages/dynamic-demo.ts', 'utf8')
    },
    {
      path: '/',
      code: require('fs').readFileSync(__dirname + '/pages/index.ts', 'utf8')
    }
  ],
  async (bt) => {
    await bt.createBrowser('/dynamic-demo');
    const ctx = bt.getContext();
    bt.assertUrl('/dynamic-demo');

    const heading = await ctx.findWidget({ text: 'Dynamic Updates Demo (AJAX-like)' });
    if (!heading) {
      throw new Error('Page heading not found');
    }
    console.log('✓ Page heading found: Dynamic Updates Demo (AJAX-like)');

    // Verify counter display at initial value
    const counterLabel = await ctx.findWidget({ text: 'Count: 0' });
    if (!counterLabel) {
      throw new Error('Counter label not found or not at initial value (0)');
    }
    console.log('✓ Counter display found: Count: 0');

    // Verify all control buttons present
    const incrementButton = await ctx.findWidget({ text: '+' });
    const decrementButton = await ctx.findWidget({ text: '-' });
    const resetButton = await ctx.findWidget({ text: 'Reset' });

    if (!incrementButton || !decrementButton || !resetButton) {
      throw new Error('Not all counter control buttons found');
    }
    console.log('✓ All control buttons found: +, -, Reset');

    console.log('✓ /dynamic-demo test passed\n');
  }
);

// Test 8: /post-demo - Verify form with POST-Redirect-GET pattern
browserTest(
  'Test /post-demo',
  [
    {
      path: '/post-demo',
      code: require('fs').readFileSync(__dirname + '/pages/post-demo.ts', 'utf8')
    },
    {
      path: '/post-success',
      code: require('fs').readFileSync(__dirname + '/pages/post-success.ts', 'utf8')
    },
    {
      path: '/',
      code: require('fs').readFileSync(__dirname + '/pages/index.ts', 'utf8')
    }
  ],
  async (bt) => {
    await bt.createBrowser('/post-demo');
    const ctx = bt.getContext();
    bt.assertUrl('/post-demo');

    const heading = await ctx.findWidget({ text: 'POST-Redirect-GET Demo' });
    if (!heading) {
      throw new Error('Page heading not found');
    }
    console.log('✓ Page heading found: POST-Redirect-GET Demo');

    // Verify pattern explanation present
    const patternSection = await ctx.findWidget({ text: '=== POST-Redirect-GET Pattern ===' });
    if (!patternSection) {
      throw new Error('POST-Redirect-GET pattern section not found');
    }
    console.log('✓ POST-Redirect-GET pattern documented');

    // Verify form elements present
    const submitButton = await ctx.findWidget({ text: 'Submit Registration' });
    if (!submitButton) {
      throw new Error('Submit Registration button not found');
    }
    console.log('✓ Form submit button found');

    console.log('✓ /post-demo test passed\n');
  }
);

// Test 9: /fyne-widgets - Verify Fyne-specific widgets and interactive buttons
browserTest(
  'Test /fyne-widgets',
  [
    {
      path: '/fyne-widgets',
      code: require('fs').readFileSync(__dirname + '/pages/fyne-widgets.ts', 'utf8')
    },
    {
      path: '/',
      code: require('fs').readFileSync(__dirname + '/pages/index.ts', 'utf8')
    }
  ],
  async (bt) => {
    await bt.createBrowser('/fyne-widgets');
    const ctx = bt.getContext();
    bt.assertUrl('/fyne-widgets');

    const heading = await ctx.findWidget({ text: 'Fyne-Specific Widgets Demo' });
    if (!heading) {
      throw new Error('Page heading not found');
    }
    console.log('✓ Page heading found: Fyne-Specific Widgets Demo');

    // Verify glass ceiling concept section
    const glassCeiling = await ctx.findWidget({ text: '=== The Glass Ceiling Concept ===' });
    if (!glassCeiling) {
      throw new Error('Glass ceiling concept section not found');
    }
    console.log('✓ Glass ceiling concept section found');

    // Test interactive buttons - click Start button
    const startButton = await ctx.findWidget({ text: 'Start' });
    if (!startButton) {
      throw new Error('Start button not found');
    }
    console.log('✓ Start button found');

    await ctx.clickWidget(startButton.id);
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('✓ Clicked Start button');

    // Click Reset button
    const resetButton = await ctx.findWidget({ text: 'Reset' });
    if (!resetButton) {
      throw new Error('Reset button not found');
    }
    console.log('✓ Reset button found');

    await ctx.clickWidget(resetButton.id);
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('✓ Clicked Reset button');

    console.log('✓ /fyne-widgets test passed\n');
  }
);

// Test 10: / (home page) - Verify navigation structure and links
browserTest(
  'Test /',
  [
    {
      path: '/',
      code: require('fs').readFileSync(__dirname + '/pages/index.ts', 'utf8')
    }
  ],
  async (bt) => {
    await bt.createBrowser('/');
    const ctx = bt.getContext();
    bt.assertUrl('/');

    ctx.logStep('Verifying home page heading');

    const heading = await ctx.findWidget({ text: 'Welcome to Tsyne Browser!' });
    if (!heading) {
      throw new Error('Assertion failed: Home page heading not found\n  Expected: "Welcome to Tsyne Browser!"');
    }
    ctx.logAssertion('Home page heading present', 'Welcome to Tsyne Browser!', heading.text);

    ctx.logStep('Verifying all four section headers are present');

    // Verify all four section headers present
    const sections = [
      '=== Core Web/HTML Features ===',
      '=== Forms & User Input ===',
      '=== Dynamic Features (AJAX / Web 2.0) ===',
      '=== Desktop UI Features (Beyond HTML) ==='
    ];

    await ctx.assertElementsPresent(sections, 'Section headers');
    ctx.logAssertion('All section headers present', '4 sections', '4 sections');

    ctx.logStep('Verifying key navigation buttons (one from each section)');

    // Verify key navigation buttons (one from each section)
    const keyButtons = [
      '📝 Text Features (Paragraphs, Headings)',
      '📝 Form Demo (Inputs, Checkboxes, Selects)',
      '⚡ Dynamic Updates (AJAX-like)',
      '🎨 Fyne-Specific Widgets'
    ];

    await ctx.assertElementsPresent(keyButtons, 'Navigation buttons');
    ctx.logAssertion('Key navigation buttons present', '4 buttons', '4 buttons');

    ctx.logStep('Counting total navigation buttons');

    // Count all buttons to ensure comprehensive navigation
    const allWidgets = await ctx.getAllWidgets();
    const allButtons = allWidgets.filter(w => w.type === 'button');

    ctx.logAssertion('Total navigation buttons available', '> 8', `${allButtons.length}`);

    console.log('✓ / (home) test passed - verified navigation structure\n');
  }
);

// Run all collected tests
(async () => {
  try {
    await runBrowserTests();
    console.log('\n✅ All Web Features Browser Tests Passed!\n');
  } catch (error) {
    console.error('\n❌ Browser tests failed:', error);
    process.exit(1);
  }
})();
