@Page(route: '/')
class FavouritePage {
  int tabIndex = 0;
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              MainAppbar(
                title: 'Favourite',
                isBack: false,
                isEdit: false,
                isShare: false,
              ),
              Expanded(
                ConditionalBuilder(
                  children: [
                    PlaceholderWidget(
                      children: [
                        ListView(
                          children: [
                            Wrap(
                              children: [
                                ScanComponent(
                                  detail: ItemRef(),
                                  uniqueKey: ItemRef().index,
                                  padding: EdgeInsets.all(8),
                                  onTap: () {
                                    context.push(
                                      ResultDetailsPage(
                                        images: ItemRef().image,
                                        title: ItemRef().name,
                                      ),
                                    );
                                  },
                                ),
                              ],
                              padding: EdgeInsets.only(left: 8, right: 8),
                            ),
                          ],
                          primary: true,
                          startSpacing: 8,
                          endSpacing: 8,
                        ),
                      ],
                      visible: appState.favouriteDataList.isSet,
                    ),
                    PlaceholderWidget(children: [NoResultsComponent()]),
                  ],
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
