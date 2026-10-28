@Page(route: '/')
class CategopriePage {
  final String appbarName;
  List<String> categoryList = [
    'All',
    'Food & Beverages',
    'Health & Beauty',
    'Household Products',
    'Electronics',
    'Fashion & Apparel',
    'Baby Products',
    'Pet Products',
    'Sports & Fitness',
    'Toys & Games',
    'Office & Stationery',
    'Automotive',
    'Home & Lifestyle',
  ];
  String catname = 'All';
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              MainAppbar(
                title: appbarName,
                isBack: false,
                isEdit: false,
                isShare: false,
              ),
              Expanded(
                ListView(
                  source:
                      (appState.selectExplore == 'All')
                          ? appState.MainDataList
                          : (appState.MainDataList.where(
                            (e) => e.categorieName.contains(
                              appState.selectExplore,
                            ),
                          )),
                  itemBuilder:
                      (mainList) => ScanComponent(
                        detail: mainList,
                        uniqueKey: mainList.index,
                        padding: EdgeInsets.only(left: 16, right: 16),
                        animations: [
                          WidgetAnimation(
                            effects: [
                              SlideEffect(
                                beginDx: 0,
                                beginDy: 60.0,
                                endDx: 0,
                                endDy: 0,
                                delayMs: mainList.index * 20,
                                durationMs: 200.0,
                              ),
                              FadeEffect(
                                begin: 0,
                                end: 1,
                                delayMs: mainList.index * 20,
                                durationMs: 200.0,
                              ),
                            ],
                            applyInitialState: true,
                          ),
                        ],
                        onTap: () {
                          context.push(
                            ResultDetailsPage(
                              images: mainList.image,
                              title: mainList.name,
                            ),
                          );
                        },
                      ),
                  spacing: 12,
                  shrinkWrap: true,
                  primary: true,
                  startSpacing: 8,
                  endSpacing: 8,
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
      width: double.infinity,
      height: double.infinity,
    ),
    backgroundColor: bgColor,
    safeArea: false,
  );
}
