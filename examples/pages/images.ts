// Images Demo Page - Demonstrates image display
// URL: http://localhost:3000/images
// Feature: Display images (like HTML <img> tags)

const { vbox, scroll, label, button, separator, image } = tsyne;

vbox(() => {
  label('Images Demo');
  label('This page demonstrates image display, similar to HTML <img> tags');
  separator();

  scroll(() => {
    vbox(() => {
      label('');
      label('Image display modes:');
      label('');

      // Mode 1: Contain - fits image inside bounds maintaining aspect ratio
      label('1. Contain mode (default) - fits image inside bounds:');
      image('./examples/assets/red-square.svg', 'contain');
      label('   Code: image(\'./examples/assets/red-square.svg\', \'contain\')');
      label('');

      separator();
      label('');

      // Mode 2: Stretch - stretches to fill bounds (may distort)
      label('2. Stretch mode - stretches to fill bounds:');
      image('./examples/assets/blue-circle.svg', 'stretch');
      label('   Code: image(\'./examples/assets/blue-circle.svg\', \'stretch\')');
      label('');

      separator();
      label('');

      // Mode 3: Original - displays at original size
      label('3. Original mode - displays at original size:');
      image('./examples/assets/green-pattern.svg', 'original');
      label('   Code: image(\'./examples/assets/green-pattern.svg\', \'original\')');
      label('');

      separator();
      label('');
      label('Image formats supported:');
      label('  • PNG (.png)');
      label('  • JPEG (.jpg, .jpeg)');
      label('  • GIF (.gif)');
      label('  • BMP (.bmp)');
      label('  • SVG (.svg)');
      label('');

      separator();
      label('');
      label('Comparison to HTML:');
      label('');
      label('HTML: <img src="/assets/logo.png" style="object-fit: contain">');
      label('Tsyne: image(\'./assets/logo.png\', \'contain\')');
      label('');
    });
  });

  separator();
  button('Back to Home', () => {
    browserContext.changePage('/');
  });
});
