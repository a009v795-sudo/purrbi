// ignore_for_file: overridden_fields, annotate_overrides

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:shared_preferences/shared_preferences.dart';

const kThemeModeKey = '__theme_mode__';

SharedPreferences? _prefs;

abstract class FlutterFlowTheme {
  static Future initialize() async =>
      _prefs = await SharedPreferences.getInstance();

  static ThemeMode get themeMode {
    final darkMode = _prefs?.getBool(kThemeModeKey);
    return darkMode == null
        ? ThemeMode.system
        : darkMode
            ? ThemeMode.dark
            : ThemeMode.light;
  }

  static void saveThemeMode(ThemeMode mode) => mode == ThemeMode.system
      ? _prefs?.remove(kThemeModeKey)
      : _prefs?.setBool(kThemeModeKey, mode == ThemeMode.dark);

  static FlutterFlowTheme of(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark
        ? DarkModeTheme()
        : LightModeTheme();
  }

  @Deprecated('Use primary instead')
  Color get primaryColor => primary;
  @Deprecated('Use secondary instead')
  Color get secondaryColor => secondary;
  @Deprecated('Use tertiary instead')
  Color get tertiaryColor => tertiary;

  late Color primary;
  late Color secondary;
  late Color tertiary;
  late Color alternate;
  late Color primaryText;
  late Color secondaryText;
  late Color primaryBackground;
  late Color secondaryBackground;
  late Color accent1;
  late Color accent2;
  late Color accent3;
  late Color accent4;
  late Color success;
  late Color warning;
  late Color error;
  late Color info;

  late Color grey20;
  late Color lightGray;
  late Color grey40;
  late Color grey;
  late Color lightRed;
  late Color borderColor;
  late Color disableButton;
  late Color buttonBg;
  late Color iconColor;
  late Color whiteToBlackColor;
  late Color primaryLightColor;
  late Color suceess50;
  late Color bgColor;
  late Color primary70;
  late Color primary80;
  late Color linearColor1;
  late Color linearColor2;
  late Color linearColor3;
  late Color grey100;
  late Color shadow;
  late Color coralSoft;
  late Color sunSoft;
  late Color slate;
  late Color slateSoft;
  late Color aqua;
  late Color onPrimary;

  FFDesignTokens get designToken => FFDesignTokens(this);

  @Deprecated('Use displaySmallFamily instead')
  String get title1Family => displaySmallFamily;
  @Deprecated('Use displaySmall instead')
  TextStyle get title1 => typography.displaySmall;
  @Deprecated('Use headlineMediumFamily instead')
  String get title2Family => typography.headlineMediumFamily;
  @Deprecated('Use headlineMedium instead')
  TextStyle get title2 => typography.headlineMedium;
  @Deprecated('Use headlineSmallFamily instead')
  String get title3Family => typography.headlineSmallFamily;
  @Deprecated('Use headlineSmall instead')
  TextStyle get title3 => typography.headlineSmall;
  @Deprecated('Use titleMediumFamily instead')
  String get subtitle1Family => typography.titleMediumFamily;
  @Deprecated('Use titleMedium instead')
  TextStyle get subtitle1 => typography.titleMedium;
  @Deprecated('Use titleSmallFamily instead')
  String get subtitle2Family => typography.titleSmallFamily;
  @Deprecated('Use titleSmall instead')
  TextStyle get subtitle2 => typography.titleSmall;
  @Deprecated('Use bodyMediumFamily instead')
  String get bodyText1Family => typography.bodyMediumFamily;
  @Deprecated('Use bodyMedium instead')
  TextStyle get bodyText1 => typography.bodyMedium;
  @Deprecated('Use bodySmallFamily instead')
  String get bodyText2Family => typography.bodySmallFamily;
  @Deprecated('Use bodySmall instead')
  TextStyle get bodyText2 => typography.bodySmall;

  String get displayLargeFamily => typography.displayLargeFamily;
  bool get displayLargeIsCustom => typography.displayLargeIsCustom;
  TextStyle get displayLarge => typography.displayLarge;
  String get displayMediumFamily => typography.displayMediumFamily;
  bool get displayMediumIsCustom => typography.displayMediumIsCustom;
  TextStyle get displayMedium => typography.displayMedium;
  String get displaySmallFamily => typography.displaySmallFamily;
  bool get displaySmallIsCustom => typography.displaySmallIsCustom;
  TextStyle get displaySmall => typography.displaySmall;
  String get headlineLargeFamily => typography.headlineLargeFamily;
  bool get headlineLargeIsCustom => typography.headlineLargeIsCustom;
  TextStyle get headlineLarge => typography.headlineLarge;
  String get headlineMediumFamily => typography.headlineMediumFamily;
  bool get headlineMediumIsCustom => typography.headlineMediumIsCustom;
  TextStyle get headlineMedium => typography.headlineMedium;
  String get headlineSmallFamily => typography.headlineSmallFamily;
  bool get headlineSmallIsCustom => typography.headlineSmallIsCustom;
  TextStyle get headlineSmall => typography.headlineSmall;
  String get titleLargeFamily => typography.titleLargeFamily;
  bool get titleLargeIsCustom => typography.titleLargeIsCustom;
  TextStyle get titleLarge => typography.titleLarge;
  String get titleMediumFamily => typography.titleMediumFamily;
  bool get titleMediumIsCustom => typography.titleMediumIsCustom;
  TextStyle get titleMedium => typography.titleMedium;
  String get titleSmallFamily => typography.titleSmallFamily;
  bool get titleSmallIsCustom => typography.titleSmallIsCustom;
  TextStyle get titleSmall => typography.titleSmall;
  String get labelLargeFamily => typography.labelLargeFamily;
  bool get labelLargeIsCustom => typography.labelLargeIsCustom;
  TextStyle get labelLarge => typography.labelLarge;
  String get labelMediumFamily => typography.labelMediumFamily;
  bool get labelMediumIsCustom => typography.labelMediumIsCustom;
  TextStyle get labelMedium => typography.labelMedium;
  String get labelSmallFamily => typography.labelSmallFamily;
  bool get labelSmallIsCustom => typography.labelSmallIsCustom;
  TextStyle get labelSmall => typography.labelSmall;
  String get bodyLargeFamily => typography.bodyLargeFamily;
  bool get bodyLargeIsCustom => typography.bodyLargeIsCustom;
  TextStyle get bodyLarge => typography.bodyLarge;
  String get bodyMediumFamily => typography.bodyMediumFamily;
  bool get bodyMediumIsCustom => typography.bodyMediumIsCustom;
  TextStyle get bodyMedium => typography.bodyMedium;
  String get bodySmallFamily => typography.bodySmallFamily;
  bool get bodySmallIsCustom => typography.bodySmallIsCustom;
  TextStyle get bodySmall => typography.bodySmall;

  Typography get typography => ThemeTypography(this);
}

class LightModeTheme extends FlutterFlowTheme {
  @Deprecated('Use primary instead')
  Color get primaryColor => primary;
  @Deprecated('Use secondary instead')
  Color get secondaryColor => secondary;
  @Deprecated('Use tertiary instead')
  Color get tertiaryColor => tertiary;

  late Color primary = const Color(0xFF0E8A80);
  late Color secondary = const Color(0xFFE0F2EF);
  late Color tertiary = const Color(0xFFEE7A5C);
  late Color alternate = const Color(0xFFEFE7DA);
  late Color primaryText = const Color(0xFF2A3038);
  late Color secondaryText = const Color(0xFF68727E);
  late Color primaryBackground = const Color(0xFFFCF7EE);
  late Color secondaryBackground = const Color(0xFFFFFFFF);
  late Color accent1 = const Color(0xFF2A3038);
  late Color accent2 = const Color(0x33F8F8F8);
  late Color accent3 = const Color(0xFF68727E);
  late Color accent4 = const Color(0xCCFFFFFF);
  late Color success = const Color(0xFF3E9B6E);
  late Color warning = const Color(0xFFE9A83B);
  late Color error = const Color(0xFFC24A38);
  late Color info = const Color(0xFFFFFFFF);

  late Color grey20 = const Color(0xFFDCDCDC);
  late Color lightGray = const Color(0xFFF7F3EC);
  late Color grey40 = const Color(0xFF68727E);
  late Color grey = const Color(0xFFF2EDE4);
  late Color lightRed = const Color(0xFFF9E4DF);
  late Color borderColor = const Color(0xFFEFE7DA);
  late Color disableButton = const Color(0xFFF2EDE4);
  late Color buttonBg = const Color(0xFFFFFFFF);
  late Color iconColor = const Color(0xFF68727E);
  late Color whiteToBlackColor = const Color(0xFFFFFFFF);
  late Color primaryLightColor = const Color(0xFFE0F2EF);
  late Color suceess50 = const Color(0xFFE4F4EA);
  late Color bgColor = const Color(0xFFF2EDE4);
  late Color primary70 = const Color(0xFFB5E2DC);
  late Color primary80 = const Color(0xFFE0F2EF);
  late Color linearColor1 = const Color(0xFFCDEEEA);
  late Color linearColor2 = const Color(0xFFFCF7EE);
  late Color linearColor3 = const Color(0xFFFCF7EE);
  late Color grey100 = const Color(0xFFF4EFE6);
  late Color shadow = const Color(0x122A3038);
  late Color coralSoft = const Color(0xFFFDEAE2);
  late Color sunSoft = const Color(0xFFFBF0D8);
  late Color slate = const Color(0xFF8A93A0);
  late Color slateSoft = const Color(0xFFEEF0F2);
  late Color aqua = const Color(0xFF35B8A8);
  late Color onPrimary = const Color(0xFFFFFFFF);
}

abstract class Typography {
  String get displayLargeFamily;
  bool get displayLargeIsCustom;
  TextStyle get displayLarge;
  String get displayMediumFamily;
  bool get displayMediumIsCustom;
  TextStyle get displayMedium;
  String get displaySmallFamily;
  bool get displaySmallIsCustom;
  TextStyle get displaySmall;
  String get headlineLargeFamily;
  bool get headlineLargeIsCustom;
  TextStyle get headlineLarge;
  String get headlineMediumFamily;
  bool get headlineMediumIsCustom;
  TextStyle get headlineMedium;
  String get headlineSmallFamily;
  bool get headlineSmallIsCustom;
  TextStyle get headlineSmall;
  String get titleLargeFamily;
  bool get titleLargeIsCustom;
  TextStyle get titleLarge;
  String get titleMediumFamily;
  bool get titleMediumIsCustom;
  TextStyle get titleMedium;
  String get titleSmallFamily;
  bool get titleSmallIsCustom;
  TextStyle get titleSmall;
  String get labelLargeFamily;
  bool get labelLargeIsCustom;
  TextStyle get labelLarge;
  String get labelMediumFamily;
  bool get labelMediumIsCustom;
  TextStyle get labelMedium;
  String get labelSmallFamily;
  bool get labelSmallIsCustom;
  TextStyle get labelSmall;
  String get bodyLargeFamily;
  bool get bodyLargeIsCustom;
  TextStyle get bodyLarge;
  String get bodyMediumFamily;
  bool get bodyMediumIsCustom;
  TextStyle get bodyMedium;
  String get bodySmallFamily;
  bool get bodySmallIsCustom;
  TextStyle get bodySmall;
}

class ThemeTypography extends Typography {
  ThemeTypography(this.theme);

  final FlutterFlowTheme theme;

  String get displayLargeFamily => 'Nunito';
  bool get displayLargeIsCustom => false;
  TextStyle get displayLarge => GoogleFonts.nunito(
        color: theme.primaryText,
        fontWeight: FontWeight.w800,
        fontSize: 57.0,
      );
  String get displayMediumFamily => 'Nunito';
  bool get displayMediumIsCustom => false;
  TextStyle get displayMedium => GoogleFonts.nunito(
        color: theme.primaryText,
        fontWeight: FontWeight.w800,
        fontSize: 44.0,
      );
  String get displaySmallFamily => 'Nunito';
  bool get displaySmallIsCustom => false;
  TextStyle get displaySmall => GoogleFonts.nunito(
        color: theme.primaryText,
        fontWeight: FontWeight.w800,
        fontSize: 32.0,
      );
  String get headlineLargeFamily => 'Nunito';
  bool get headlineLargeIsCustom => false;
  TextStyle get headlineLarge => GoogleFonts.nunito(
        color: theme.primaryText,
        fontWeight: FontWeight.w800,
        fontSize: 30.0,
      );
  String get headlineMediumFamily => 'Nunito';
  bool get headlineMediumIsCustom => false;
  TextStyle get headlineMedium => GoogleFonts.nunito(
        color: theme.primaryText,
        fontWeight: FontWeight.w800,
        fontSize: 26.0,
      );
  String get headlineSmallFamily => 'Nunito';
  bool get headlineSmallIsCustom => false;
  TextStyle get headlineSmall => GoogleFonts.nunito(
        color: theme.primaryText,
        fontWeight: FontWeight.w800,
        fontSize: 24.0,
      );
  String get titleLargeFamily => 'Nunito';
  bool get titleLargeIsCustom => false;
  TextStyle get titleLarge => GoogleFonts.nunito(
        color: theme.primaryText,
        fontWeight: FontWeight.w800,
        fontSize: 20.0,
      );
  String get titleMediumFamily => 'Nunito';
  bool get titleMediumIsCustom => false;
  TextStyle get titleMedium => GoogleFonts.nunito(
        color: theme.primaryText,
        fontWeight: FontWeight.w800,
        fontSize: 18.0,
      );
  String get titleSmallFamily => 'Nunito';
  bool get titleSmallIsCustom => false;
  TextStyle get titleSmall => GoogleFonts.nunito(
        color: theme.primaryText,
        fontWeight: FontWeight.bold,
        fontSize: 16.0,
      );
  String get labelLargeFamily => 'Nunito';
  bool get labelLargeIsCustom => false;
  TextStyle get labelLarge => GoogleFonts.nunito(
        color: theme.secondaryText,
        fontWeight: FontWeight.w600,
        fontSize: 16.0,
      );
  String get labelMediumFamily => 'Nunito';
  bool get labelMediumIsCustom => false;
  TextStyle get labelMedium => GoogleFonts.nunito(
        color: theme.secondaryText,
        fontWeight: FontWeight.w600,
        fontSize: 14.0,
      );
  String get labelSmallFamily => 'Nunito';
  bool get labelSmallIsCustom => false;
  TextStyle get labelSmall => GoogleFonts.nunito(
        color: theme.secondaryText,
        fontWeight: FontWeight.w600,
        fontSize: 12.0,
      );
  String get bodyLargeFamily => 'Nunito';
  bool get bodyLargeIsCustom => false;
  TextStyle get bodyLarge => GoogleFonts.nunito(
        color: theme.primaryText,
        fontWeight: FontWeight.w500,
        fontSize: 16.0,
      );
  String get bodyMediumFamily => 'Nunito';
  bool get bodyMediumIsCustom => false;
  TextStyle get bodyMedium => GoogleFonts.nunito(
        color: theme.primaryText,
        fontWeight: FontWeight.w500,
        fontSize: 14.0,
      );
  String get bodySmallFamily => 'Nunito';
  bool get bodySmallIsCustom => false;
  TextStyle get bodySmall => GoogleFonts.nunito(
        color: theme.primaryText,
        fontWeight: FontWeight.w500,
        fontSize: 12.0,
      );
}

class DarkModeTheme extends FlutterFlowTheme {
  @Deprecated('Use primary instead')
  Color get primaryColor => primary;
  @Deprecated('Use secondary instead')
  Color get secondaryColor => secondary;
  @Deprecated('Use tertiary instead')
  Color get tertiaryColor => tertiary;

  late Color primary = const Color(0xFF35B8A8);
  late Color secondary = const Color(0xFF12302D);
  late Color tertiary = const Color(0xFFEE7A5C);
  late Color alternate = const Color(0xFF2C3238);
  late Color primaryText = const Color(0xFFF2F4F6);
  late Color secondaryText = const Color(0xFFAEB6BF);
  late Color primaryBackground = const Color(0xFF14181D);
  late Color secondaryBackground = const Color(0xFF1E2329);
  late Color accent1 = const Color(0xFFF2F4F6);
  late Color accent2 = const Color(0x1FE9E7EF);
  late Color accent3 = const Color(0x1FE9E7EF);
  late Color accent4 = const Color(0xFF2C3238);
  late Color success = const Color(0xFF5DBB8C);
  late Color warning = const Color(0xFFF0BC62);
  late Color error = const Color(0xFFE06A58);
  late Color info = const Color(0xFF2C3238);

  late Color grey20 = const Color(0xFF4A525B);
  late Color lightGray = const Color(0xFF262C33);
  late Color grey40 = const Color(0xFF9AA3AD);
  late Color grey = const Color(0xFF262C33);
  late Color lightRed = const Color(0xFF3A1D18);
  late Color borderColor = const Color(0xFF2C3238);
  late Color disableButton = const Color(0xFF262C33);
  late Color buttonBg = const Color(0xFF1E2329);
  late Color iconColor = const Color(0xFFAEB6BF);
  late Color whiteToBlackColor = const Color(0xFF14181D);
  late Color primaryLightColor = const Color(0xFF12302D);
  late Color suceess50 = const Color(0xFF153325);
  late Color bgColor = const Color(0xFF262C33);
  late Color primary70 = const Color(0xFF1A4A45);
  late Color primary80 = const Color(0xFF12302D);
  late Color linearColor1 = const Color(0xFF14181D);
  late Color linearColor2 = const Color(0xFF14181D);
  late Color linearColor3 = const Color(0xFF14181D);
  late Color grey100 = const Color(0xFF1A1F25);
  late Color shadow = const Color(0x22000000);
  late Color coralSoft = const Color(0xFF3A2219);
  late Color sunSoft = const Color(0xFF3A3018);
  late Color slate = const Color(0xFF9AA3AD);
  late Color slateSoft = const Color(0xFF262C33);
  late Color aqua = const Color(0xFF35B8A8);
  late Color onPrimary = const Color(0xFF0B1A19);
}

class FFDesignTokens {
  const FFDesignTokens(this.theme);
  final FlutterFlowTheme theme;
  FFSpacing get spacing => const FFSpacing();
  FFRadius get radius => const FFRadius();
  FFShadows get shadow => FFShadows(theme);
}

class FFSpacing {
  const FFSpacing();
  double get xs => 4.0;
  double get sm => 8.0;
  double get md => 16.0;
  double get lg => 24.0;
  double get xl => 32.0;
}

class FFRadius {
  const FFRadius();
  double get sm => 8.0;
  double get md => 16.0;
  double get lg => 24.0;
  double get full => 9999.0;
}

class FFShadows {
  const FFShadows(this.theme);
  final FlutterFlowTheme theme;
  BoxShadow get sm => const BoxShadow(
      blurRadius: 12.0,
      color: const Color(0x0F2A3038),
      offset: const Offset(0.0, 2.0),
      spreadRadius: 0.0);
  BoxShadow get md => const BoxShadow(
      blurRadius: 22.0,
      color: const Color(0x122A3038),
      offset: const Offset(0.0, 6.0),
      spreadRadius: 0.0);
  BoxShadow get lg => const BoxShadow(
      blurRadius: 26.0,
      color: const Color(0x592A3038),
      offset: const Offset(0.0, 10.0),
      spreadRadius: 0.0);
  BoxShadow get xl => const BoxShadow(
      blurRadius: 26.0,
      color: const Color(0x590E8A80),
      offset: const Offset(0.0, 10.0),
      spreadRadius: 0.0);
}

extension TextStyleHelper on TextStyle {
  TextStyle override({
    TextStyle? font,
    String? fontFamily,
    Color? color,
    double? fontSize,
    FontWeight? fontWeight,
    double? letterSpacing,
    FontStyle? fontStyle,
    bool useGoogleFonts = false,
    TextDecoration? decoration,
    double? lineHeight,
    List<Shadow>? shadows,
    String? package,
  }) {
    if (useGoogleFonts && fontFamily != null && fontFamily.isNotEmpty) {
      font = GoogleFonts.getFont(fontFamily,
          fontWeight: fontWeight ?? this.fontWeight,
          fontStyle: fontStyle ?? this.fontStyle);
    }

    return font != null
        ? font.copyWith(
            color: color ?? this.color,
            fontSize: fontSize ?? this.fontSize,
            letterSpacing: letterSpacing ?? this.letterSpacing,
            fontWeight: fontWeight ?? this.fontWeight,
            fontStyle: fontStyle ?? this.fontStyle,
            decoration: decoration,
            height: lineHeight,
            shadows: shadows,
          )
        : copyWith(
            fontFamily: fontFamily,
            package: package,
            color: color,
            fontSize: fontSize,
            letterSpacing: letterSpacing,
            fontWeight: fontWeight,
            fontStyle: fontStyle,
            decoration: decoration,
            height: lineHeight,
            shadows: shadows,
          );
  }
}
