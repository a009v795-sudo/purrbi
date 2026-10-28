@Component()
class AppLogo {
  final double height;
  final double width;
  build() => Container(
    child: Container(
      child: MiniLogo(hight: 72.0, width: 72.0),
      color: primaryBackground,
      borderColor: borderColor,
      borderWidth: 1,
      width: 120,
      alignment: Alignment.center,
      boxShape: BoxShape.circle,
    ),
    color: Color(0x00000000),
  );
}
