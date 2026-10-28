@Component()
class SelectTextBottomSheet {
  final String textData;
  build() => Container(
    padding: EdgeInsets.only(top: 100),
    child: Container(
      child: Column(
        children: [
          Row(
            children: [
              Container(
                color: borderColor,
                borderRadius: 20,
                width: 48,
                height: 6,
              ),
            ],
            mainAxis: MainAxis.center,
          ),
          Flexible(
            Container(
              child: Column(
                children: [
                  Markdown(
                    textData,
                    selectable: true,
                    padding: EdgeInsets.only(
                      left: Constant('mainPadding'),
                      right: Constant('mainPadding'),
                    ),
                  ),
                ],
                crossAxis: CrossAxis.start,
                scrollable: true,
                startSpacing: 16,
                endSpacing: 30,
              ),
              borderRadius: 8,
              width: double.infinity,
            ),
          ),
        ],
        minSize: MainAxisSize.min,
        startSpacing: 16,
      ),
      color: secondaryBackground,
      borderRadius: BorderRadius.only(topLeft: 26, topRight: 26),
      width: double.infinity,
      margin: EdgeInsets.only(top: 100),
    ),
    color: Color(0x00000000),
  );
}
