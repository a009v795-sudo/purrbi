@Page(route: '/')
class ResultDetailsPage {
  final ImagePath images;
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
                          borderColor: secondaryBackground,
                          width: double.infinity,
                          height: 24,
                        ),
                      ],
                      mainAxis: MainAxis.spaceBetween,
                    ),
                    color: secondaryBackground,
                    borderRadius: BorderRadius.only(),
                    width: double.infinity,
                    height: ScreenPercent(45),
                    image: DecorationImage(
                      path: images,
                      type: ImageType.network,
                    ),
                    outerAlignment: Alignment.topCenter,
                  ),
                  Container(
                    child: Card1No(title: title),
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
  );
}
