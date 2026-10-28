@Component()
class GenerationFailedDialog {
  build() => Container(
    padding: EdgeInsets.only(
      left: Constant('mainPadding'),
      right: Constant('mainPadding'),
    ),
    child: Container(
      padding: EdgeInsets.only(left: 16, top: 20, right: 16, bottom: 20),
      child: Column(
        children: [
          Container(
            child: Icon(
              IconData('calendaryp', custom: true),
              size: 32,
              color: primary,
            ),
            color: primaryLightColor,
            width: 80,
            alignment: Alignment.center,
            boxShape: BoxShape.circle,
          ),
          Text(
            'Generation failed!',
            style: bodyMedium,
            textAlign: TextAlign.center,
            lineHeight: 1.2,
            fontSize: 20,
            fontWeight: FontWeight.w600,
            padding: EdgeInsets.only(top: 16, bottom: 8),
          ),
          Text(
            ' We couldn\'t process your image. Please \ntry again with a clearer photo',
            style: bodyMedium,
            textAlign: TextAlign.center,
            lineHeight: 1.33,
            fontSize: 15,
            fontWeight: FontWeight.w400,
            padding: EdgeInsets.only(bottom: 20),
          ),
          Button(
            'Tyr again!',
            width: double.infinity,
            height: 56,
            borderRadius: 16,
            style: titleSmall,
            fontSize: 18,
            fontWeight: FontWeight.w600,
            lineHeight: 1,
            elevation: 0,
            innerPadding: EdgeInsets.only(left: 20, right: 20),
            padding: EdgeInsets.only(left: 32, right: 32),
          ),
        ],
        mainAxis: MainAxis.center,
        minSize: MainAxisSize.min,
      ),
      color: buttonBg,
      borderRadius: 16,
      width:
          (globalProperties.screenWidth > (Constant('maxWidth')))
              ? ((Constant('maxWidth')) - 32)
              : constants.infinity,
      margin: EdgeInsets.only(
        left: Constant('mainPadding'),
        right: Constant('mainPadding'),
      ),
      outerAlignment: Alignment.center,
    ),
    color: Color(0x00000000),
  );
}
