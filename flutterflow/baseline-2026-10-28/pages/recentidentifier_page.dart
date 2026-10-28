@Page(route: '/')
class RecentidentifierPage {
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
                title: 'Recently Scanned',
                isBack: false,
                isEdit: false,
                isShare: false,
              ),
              Expanded(
                ListView(
                  children: [
                    Wrap(
                      children: [
                        RecentIdentifier(
                          detail: ItemRef(),
                          uniqueKey: ItemRef().index,
                          padding: EdgeInsets.all(8),
                          onTapAction: () {
                            context.push(
                              ResultDetailsPage(
                                images: ItemRef().img,
                                title: ItemRef().title,
                              ),
                            );
                          },
                        ),
                      ],
                      padding: EdgeInsets.only(left: 8, top: 8, right: 8),
                    ),
                  ],
                  primary: true,
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
