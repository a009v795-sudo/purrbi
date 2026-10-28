@Page(route: '/')
class PopularfootprintPage {
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
                title: 'Popular',
                isBack: false,
                isEdit: false,
                isShare: false,
              ),
              Expanded(
                ListView(
                  children: [
                    Wrap(
                      children: [
                        ScanComponent(
                          detail: ItemRef(),
                          uniqueKey: ItemRef().index,
                          padding: EdgeInsets.all(8),
                          animations: [
                            WidgetAnimation(
                              effects: [
                                SlideEffect(
                                  beginDx: 0,
                                  beginDy: 60.0,
                                  endDx: 0,
                                  endDy: 0,
                                  delayMs: (ItemRef().index) * 20,
                                  durationMs: 200.0,
                                ),
                                FadeEffect(
                                  begin: 0,
                                  end: 1,
                                  delayMs: (ItemRef().index) * 20,
                                  durationMs: 200.0,
                                ),
                              ],
                              applyInitialState: true,
                            ),
                          ],
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
                      padding: EdgeInsets.only(left: 8, top: 8, right: 8),
                    ),
                  ],
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
      width: double.infinity,
      height: double.infinity,
    ),
    backgroundColor: bgColor,
    safeArea: false,
  );
}
