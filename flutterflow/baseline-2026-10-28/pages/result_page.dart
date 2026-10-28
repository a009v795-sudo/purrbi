@Page(route: '/')
class ResultPage {
  final UploadedFile uplodImage;
  final String title;
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Column(
          children: [
            Expanded(
              ListView(
                children: [
                  Container(
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Container(
                              child: Icon(
                                IconData('arrowbackyp', custom: true),
                                color: primaryText,
                              ),
                              color: buttonBg,
                              borderColor: borderColor,
                              borderWidth: 1,
                              width: 40,
                              alignment: Alignment.center,
                              boxShape: BoxShape.circle,
                              onTap: () {
                                appState.homePageIndex = 0;
                                context.push(HomeMainPage(), allowBack: false);
                              },
                            ),
                          ],
                          crossAxis: CrossAxis.start,
                          padding: EdgeInsets.only(
                            left: Constant('mainPadding'),
                            top: 58,
                            right: Constant('mainPadding'),
                            bottom: 12,
                          ),
                        ),
                        Container(
                          color: secondaryBackground,
                          borderRadius: BorderRadius.only(
                            topLeft: 24,
                            topRight: 24,
                          ),
                          width: double.infinity,
                          height: 24,
                        ),
                      ],
                      mainAxis: MainAxis.spaceBetween,
                    ),
                    borderRadius: BorderRadius.only(),
                    width: double.infinity,
                    height: ScreenPercent(40),
                    image: Bound('fed1aae2', 'image'),
                    outerAlignment: Alignment.topCenter,
                  ),
                  Container(
                    child: Card1(title: title),
                    borderRadius: BorderRadius.only(topLeft: 24, topRight: 24),
                  ),
                  Card2(
                    padding: EdgeInsets.only(
                      left: Constant('mainPadding'),
                      top: 16,
                      right: Constant('mainPadding'),
                      bottom: 16,
                    ),
                  ),
                  Card3(
                    padding: EdgeInsets.only(
                      left: Constant('mainPadding'),
                      right: Constant('mainPadding'),
                    ),
                  ),
                  Card4(
                    padding: EdgeInsets.only(
                      left: Constant('mainPadding'),
                      right: Constant('mainPadding'),
                      bottom: 16,
                    ),
                  ),
                ],
                primary: true,
              ),
            ),
            Container(
              padding: EdgeInsets.only(
                left: 16,
                top: 24,
                right: 16,
                bottom: 24,
              ),
              child: Row(
                children: [
                  Expanded(
                    Button(
                      'Save result',
                      variant: ButtonVariant.outlined,
                      width: double.infinity,
                      height: 56,
                      borderRadius: 60,
                      style: titleSmall,
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      lineHeight: 1,
                      innerPadding: EdgeInsets.only(left: 20, right: 20),
                      onTap: () {
                        mainSanckbar(
                          title: 'Save to Collection Sucessfull !',
                          shouldSetState: true,
                        );
                        appState.homePageIndex = 2;
                        context.push(HomeMainPage(), allowBack: false);
                      },
                    ),
                  ),
                  Expanded(
                    Button(
                      'Find another',
                      width: double.infinity,
                      height: 56,
                      borderRadius: 60,
                      style: titleSmall,
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      lineHeight: 1,
                      elevation: 0,
                      innerPadding: EdgeInsets.only(left: 20, right: 20),
                      onTap: () {
                        context.push(IdentifierPage(), allowBack: false);
                      },
                    ),
                  ),
                ],
                spacing: 16,
              ),
              color: secondaryBackground,
              width: double.infinity,
              height: 100,
            ),
          ],
        ),
        color: secondaryBackground,
        maxWidth: Constant('maxWidth'),
      ),
      color: bgColor,
      width: double.infinity,
      height: double.infinity,
      alignment: Alignment.topCenter,
    ),
    backgroundColor: bgColor,
    safeArea: false,
    disableAndroidBackButton: true,
  );
}
