// The app's theme. Pages and components use these names:
// `color: primary`, `style: bodyMedium`. Edit a value, add a
// custom color, text style or token, or delete a custom one,
// then push. Colors are 0xAARRGGBB; `dark:` is the dark-mode
// value.
// `darkMode = true` adds a dark mode; the editor canvas, `./fft preview`
// and light-mode phones show the light (first) values.

final darkMode = true;

// Colors
final primary = Color(0xFF0E8A80, dark: 0xFF35B8A8);
final secondary = Color(0xFFE0F2EF, dark: 0xFF12302D);
final tertiary = Color(0xFFEE7A5C, dark: 0xFFEE7A5C);
final alternate = Color(0xFFEFE7DA, dark: 0xFF2C3238);
final primaryBackground = Color(0xFFFCF7EE, dark: 0xFF14181D);
final secondaryBackground = Color(0xFFFFFFFF, dark: 0xFF1E2329);
final primaryText = Color(0xFF2A3038, dark: 0xFFF2F4F6);
final secondaryText = Color(0xFF68727E, dark: 0xFFAEB6BF);
final accent1 = Color(0xFF2A3038, dark: 0xFFF2F4F6);
final accent2 = Color(0x33F8F8F8, dark: 0x1FE9E7EF);
final accent3 = Color(0xFF68727E, dark: 0x1FE9E7EF);
final accent4 = Color(0xCCFFFFFF, dark: 0xFF2C3238);
final success = Color(0xFF3E9B6E, dark: 0xFF5DBB8C);
final warning = Color(0xFFE9A83B, dark: 0xFFF0BC62);
final error = Color(0xFFC24A38, dark: 0xFFE06A58);
final info = Color(0xFFFFFFFF, dark: 0xFF2C3238);

// Custom colors
final grey20 = Color(0xFFDCDCDC, dark: 0xFF4A525B, name: 'Grey 20');
final lightGray = Color(0xFFF7F3EC, dark: 0xFF262C33, name: 'Light Gray');
final grey40 = Color(0xFF68727E, dark: 0xFF9AA3AD, name: 'Grey 40');
final grey = Color(0xFFF2EDE4, dark: 0xFF262C33, name: 'Grey');
final lightRed = Color(0xFFF9E4DF, dark: 0xFF3A1D18, name: 'light red');
final borderColor = Color(0xFFEFE7DA, dark: 0xFF2C3238, name: 'Border color');
final disableButton = Color(0xFFF2EDE4, dark: 0xFF262C33, name: 'Disable button');
final buttonBg = Color(0xFFFFFFFF, dark: 0xFF1E2329, name: 'Button bg');
final iconColor = Color(0xFF68727E, dark: 0xFFAEB6BF, name: 'Icon Color');
final whiteToBlackColor = Color(0xFFFFFFFF, dark: 0xFF14181D, name: 'WhiteToBlack Color');
final primaryLightColor = Color(0xFFE0F2EF, dark: 0xFF12302D, name: 'Primary light color');
final suceess50 = Color(0xFFE4F4EA, dark: 0xFF153325, name: 'Suceess 50 ');
final bgColor = Color(0xFFF2EDE4, dark: 0xFF262C33);
final primary70 = Color(0xFFB5E2DC, dark: 0xFF1A4A45, name: 'Primary 70');
final primary80 = Color(0xFFE0F2EF, dark: 0xFF12302D, name: 'primary 80');
final linearColor1 = Color(0xFFCDEEEA, dark: 0xFF14181D, name: 'Linear Color 1');
final linearColor2 = Color(0xFFFCF7EE, dark: 0xFF14181D, name: 'Linear Color 2');
final linearColor3 = Color(0xFFFCF7EE, dark: 0xFF14181D, name: 'Linear Color 3');
final grey100 = Color(0xFFF4EFE6, dark: 0xFF1A1F25, name: 'Grey 100');
final shadow = Color(0x122A3038, dark: 0x22000000, name: 'Shadow');
final coralSoft = Color(0xFFFDEAE2, dark: 0xFF3A2219, name: 'Coral Soft');
final sunSoft = Color(0xFFFBF0D8, dark: 0xFF3A3018, name: 'Sun Soft');
final slate = Color(0xFF8A93A0, dark: 0xFF9AA3AD, name: 'Slate');
final slateSoft = Color(0xFFEEF0F2, dark: 0xFF262C33, name: 'Slate Soft');
final aqua = Color(0xFF35B8A8, dark: 0xFF35B8A8, name: 'Aqua');

// Fonts: any Google Font by name.
final primaryFont = 'Nunito';
final secondaryFont = 'Nunito';

// Text styles
final displayLarge = TextStyle(font: primaryFont, size: 57, weight: 800, color: primaryText);
final displayMedium = TextStyle(font: primaryFont, size: 44, weight: 800, color: primaryText);
final displaySmall = TextStyle(font: primaryFont, size: 32, weight: 800, color: primaryText);
final headlineLarge = TextStyle(font: primaryFont, size: 30, weight: 800, color: primaryText);
final headlineMedium = TextStyle(font: primaryFont, size: 26, weight: 800, color: primaryText);
final headlineSmall = TextStyle(font: primaryFont, size: 24, weight: 800, color: primaryText);
final titleLarge = TextStyle(font: primaryFont, size: 20, weight: 800, color: primaryText);
final titleMedium = TextStyle(font: primaryFont, size: 18, weight: 800, color: primaryText);
final titleSmall = TextStyle(font: primaryFont, size: 16, weight: 700, color: primaryText);
final labelLarge = TextStyle(font: primaryFont, size: 16, weight: 600, color: secondaryText);
final labelMedium = TextStyle(font: primaryFont, size: 14, weight: 600, color: secondaryText);
final labelSmall = TextStyle(font: primaryFont, size: 12, weight: 600, color: secondaryText);
final bodyLarge = TextStyle(font: primaryFont, size: 16, weight: 500, color: primaryText);
final bodyMedium = TextStyle(font: primaryFont, size: 14, weight: 500, color: primaryText);
final bodySmall = TextStyle(font: primaryFont, size: 12, weight: 500, color: primaryText);

// Design tokens
final spacing = Spacing(xs: 4, sm: 8, md: 16, lg: 24, xl: 32);
final radius = Radius(sm: 8, md: 16, lg: 24, full: 9999);
final shadows = Shadows(
  sm: Shadow(blur: 12, dy: 2, color: Color(0x0F2A3038)),
  md: Shadow(blur: 22, dy: 6, color: Color(0x122A3038)),
  lg: Shadow(blur: 26, dy: 10, color: Color(0x592A3038)),
  xl: Shadow(blur: 26, dy: 10, color: Color(0x590E8A80)),
);

// Screen widths where layouts switch (phone, tablet, desktop)
final breakpoints = Breakpoints(small: 479, medium: 767, large: 991);

// Scrollbars and the pull-to-refresh indicator
final pullToRefresh = PullToRefresh(indicatorColor: primary, backgroundColor: primaryBackground);
