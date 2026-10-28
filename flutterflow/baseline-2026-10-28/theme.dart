// The app's theme. Pages and components use these names:
// `color: primary`, `style: bodyMedium`. Edit a value, add a
// custom color, text style or token, or delete a custom one,
// then push. Colors are 0xAARRGGBB; `dark:` is the dark-mode
// value.
// `darkMode = true` adds a dark mode; the editor canvas, `./fft preview`
// and light-mode phones show the light (first) values.

final darkMode = true;

// Colors
final primary = Color(0xFF2563EB, dark: 0xFF2563EB);
final secondary = Color(0xFFEFF6FF, dark: 0xFF050B20);
final tertiary = Color(0xFFEE8B60, dark: 0xFFEE8B60);
final alternate = Color(0xFFE0E3E7, dark: 0xFF262D34);
final primaryBackground = Color(0xFFEFF6FF, dark: 0xFF050B20);
final secondaryBackground = Color(0xFFFFFFFF, dark: 0xFF010201);
final primaryText = Color(0xFF000000, dark: 0xFFFFFFFF);
final secondaryText = Color(0xFF6D717F, dark: 0xFFDCDCDC);
final accent1 = Color(0xFF0E1920, dark: 0xFFFFFFFF);
final accent2 = Color(0x33F8F8F8, dark: 0x1FE9E7EF);
final accent3 = Color(0xFF666666, dark: 0x1FE9E7EF);
final accent4 = Color(0xCCFFFFFF, dark: 0xFF2D2D2D);
final success = Color(0xFF059742, dark: 0xFF059742);
final warning = Color(0xFFFFA10F, dark: 0xFFFFA10F);
final error = Color(0xFFFF2F2F, dark: 0xFFFF3A3A);
final info = Color(0xFFFFFFFF, dark: 0xFF2D2D2D);

// Custom colors
final grey20 = Color(0xFFDCDCDC, dark: 0xFF666666, name: 'Grey 20');
final lightGray = Color(0xFFF7F7F7, dark: 0xFFDCDCDC, name: 'Light Gray');
final grey40 = Color(0xFF666666, dark: 0xFF999999, name: 'Grey 40');
final grey = Color(0xFFF0F0F0, dark: 0xFFDCDCDC, name: 'Grey');
final lightRed = Color(0xFFFDECEC, dark: 0xFF260B0A, name: 'light red');
final borderColor = Color(0xFFBFDBFE, dark: 0xFF182347, name: 'Border color');
final disableButton = Color(0xFFF5F5F5, dark: 0xFF222325, name: 'Disable button');
final buttonBg = Color(0xFFFFFFFF, dark: 0xFF0D1017, name: 'Button bg');
final iconColor = Color(0xFF666666, dark: 0xFFDCDCDC, name: 'Icon Color');
final whiteToBlackColor = Color(0xFFFFFFFF, dark: 0xFF000000, name: 'WhiteToBlack Color');
final primaryLightColor = Color(0xFFEFF6FF, dark: 0xFF050B20, name: 'Primary light color');
final suceess50 = Color(0xFFE6F3EB, dark: 0xFF021C0D, name: 'Suceess 50 ');
final bgColor = Color(0xFFF5F5F5, dark: 0xFF2D2D2D);
final primary70 = Color(0xFFBFDBFE, dark: 0xFF172554, name: 'Primary 70');
final primary80 = Color(0xFFDBEAFE, dark: 0xFF0F1B3D, name: 'primary 80');
final linearColor1 = Color(0xFFB1CAFF, dark: 0xFF010201, name: 'Linear Color 1');
final linearColor2 = Color(0xFFFFFFFF, dark: 0xFF010201, name: 'Linear Color 2');
final linearColor3 = Color(0xFFFFFFFF, dark: 0xFF010201, name: 'Linear Color 3');
final grey100 = Color(0xFFF3F4F6, dark: 0xFF14171F, name: 'Grey 100');
final shadow = Color(0x11000000, dark: 0x11000000, name: 'Shadow');

// Fonts: any Google Font by name.
final primaryFont = 'Inter';
final secondaryFont = 'Inter';

// Text styles
final displayLarge = TextStyle(font: primaryFont, size: 64, weight: 600, color: primaryText);
final displayMedium = TextStyle(font: primaryFont, size: 44, weight: 600, color: primaryText);
final displaySmall = TextStyle(font: primaryFont, size: 36, weight: 600, color: primaryText);
final headlineLarge = TextStyle(font: primaryFont, size: 32, weight: 600, color: primaryText);
final headlineMedium = TextStyle(font: primaryFont, size: 28, weight: 600, color: primaryText);
final headlineSmall = TextStyle(font: primaryFont, size: 24, weight: 600, color: primaryText);
final titleLarge = TextStyle(font: primaryFont, size: 20, weight: 600, color: primaryText);
final titleMedium = TextStyle(font: primaryFont, size: 18, weight: 600, color: primaryText);
final titleSmall = TextStyle(font: primaryFont, size: 16, weight: 600, color: primaryText);
final labelLarge = TextStyle(font: primaryFont, size: 16, weight: 400, color: secondaryText);
final labelMedium = TextStyle(font: primaryFont, size: 14, weight: 400, color: secondaryText);
final labelSmall = TextStyle(font: primaryFont, size: 12, weight: 400, color: secondaryText);
final bodyLarge = TextStyle(font: primaryFont, size: 16, weight: 400, color: primaryText);
final bodyMedium = TextStyle(font: primaryFont, size: 14, weight: 400, color: primaryText);
final bodySmall = TextStyle(font: primaryFont, size: 12, weight: 400, color: primaryText);

// Design tokens
final spacing = Spacing(xs: 4, sm: 8, md: 16, lg: 24, xl: 32);
final radius = Radius(sm: 8, md: 16, lg: 24, full: 9999);
final shadows = Shadows(
  sm: Shadow(blur: 16, dy: 1, spread: 4, color: Color(0xFF988070)),
  md: Shadow(blur: 6, dy: 3, color: Color(0x1A000000)),
  lg: Shadow(blur: 15, dy: 8, color: Color(0x1A000000)),
  xl: Shadow(blur: 25, dy: 16, color: Color(0x1A000000)),
);

// Screen widths where layouts switch (phone, tablet, desktop)
final breakpoints = Breakpoints(small: 479, medium: 767, large: 991);

// Scrollbars and the pull-to-refresh indicator
final pullToRefresh = PullToRefresh(indicatorColor: primary, backgroundColor: primaryBackground);
