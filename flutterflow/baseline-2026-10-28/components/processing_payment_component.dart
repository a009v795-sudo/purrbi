@Component()
class ProcessingPaymentComponent {
  build() => Container(
    padding: EdgeInsets.only(
      left: Constant('mainPadding'),
      right: Constant('mainPadding'),
    ),
    child: Container(
      padding: EdgeInsets.only(left: 70, top: 30, right: 70, bottom: 30),
      child: Column(
        children: [
          Container(
            child: CirculatIndicatorWhite(width: 30, height: 30),
            color: primaryLightColor,
            width: 70,
            alignment: Alignment.center,
            boxShape: BoxShape.circle,
          ),
          Text(
            'Processing payment...',
            style: bodyMedium,
            maxLines: 1,
            textAlign: TextAlign.center,
            lineHeight: 1.28,
            fontSize: 18,
            fontWeight: FontWeight.w600,
            autoSize: true,
            padding: EdgeInsets.only(top: 18, bottom: 8),
          ),
          Text(
            'Usually takes 5-10 seconds',
            style: bodyMedium,
            color: secondaryText,
            maxLines: 1,
            textAlign: TextAlign.center,
            lineHeight: 1.31,
            fontSize: 13,
            fontWeight: FontWeight.w400,
            autoSize: true,
          ),
        ],
        minSize: MainAxisSize.min,
      ),
      color: buttonBg,
      borderRadius: 16,
      margin: EdgeInsets.only(
        left: Constant('mainPadding'),
        right: Constant('mainPadding'),
      ),
      maxWidth: 317,
      outerAlignment: Alignment.center,
    ),
    color: Color(0x00000000),
    onInitState: () {
      Wait(1000);
      DismissBottomSheet();
    },
  );
}
