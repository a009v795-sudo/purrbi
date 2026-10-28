@Page(route: '/')
class FaqPage {
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              MainAppbar(
                title: 'FAQs',
                isBack: false,
                isEdit: false,
                isShare: false,
              ),
              Expanded(
                ListView(
                  source: appState.faqList,
                  itemBuilder:
                      (item) => Container(
                        padding: EdgeInsets.only(left: 16, right: 12),
                        child: Expandable(
                          header: Text(
                            item.title,
                            style: bodyMedium,
                            maxLines: 2,
                            textAlign: TextAlign.start,
                            overflow: TextOverflow.ellipsis,
                            lineHeight: 1.52,
                            fontSize: 17,
                            fontWeight: FontWeight.w500,
                            padding: EdgeInsets.only(top: 14, bottom: 8),
                          ),
                          collapsed: Container(
                            width: 0,
                            height: 0,
                            margin: EdgeInsets.only(bottom: 8),
                          ),
                          expanded: Text(
                            item.description,
                            style: bodyMedium,
                            textAlign: TextAlign.start,
                            lineHeight: 1.46,
                            fontSize: 15,
                            fontWeight: FontWeight.w400,
                            padding: EdgeInsets.only(bottom: 16),
                          ),
                          iconSize: 24,
                          iconColor: primaryText,
                          headerAlignment: HeaderAlignment.top,
                        ),
                        color: buttonBg,
                        borderRadius: 12,
                        borderColor: borderColor,
                        borderWidth: 1,
                        width: double.infinity,
                        margin: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          right: Constant('mainPadding'),
                        ),
                      ),
                  spacing: 16,
                  primary: true,
                  applyStartEndSpace: true,
                ),
              ),
            ],
            crossAxis: CrossAxis.start,
          ),
          width: double.infinity,
          height: double.infinity,
          maxWidth: Constant('maxWidth'),
          safeArea: true,
        ),
        gradient: Gradient.linear([
          GradientStop(linearColor1, 0),
          GradientStop(linearColor2, 0.13),
          GradientStop(linearColor3, 1),
        ], angle: 0),
        outerAlignment: Alignment.topCenter,
      ),
      color: bgColor,
      width: double.infinity,
      height: double.infinity,
    ),
    backgroundColor: bgColor,
    safeArea: false,
  );
}
