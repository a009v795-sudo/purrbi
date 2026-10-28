@Page(route: '/')
class BlolgDetailPage {
  final BolgModel blogDetail;
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              MainAppbar(
                title: constants.emptyString,
                isBack: false,
                isEdit: false,
                isShare: false,
              ),
              Expanded(
                ListView(
                  children: [
                    Image(
                      blogDetail.image ??
                          'https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/84wxpcg29ejq/b1.png',
                      width: double.infinity,
                      height: 224,
                      borderRadius: 16,
                      cacheFadeDuration: 200,
                      showErrorImage: true,
                      padding: EdgeInsets.only(
                        left: Constant('mainPadding'),
                        right: Constant('mainPadding'),
                      ),
                    ),
                    Container(
                      padding: EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Text(
                            blogDetail.name ?? 'Title',
                            style: bodyMedium,
                            textAlign: TextAlign.start,
                            lineHeight: 1.3,
                            fontSize: 20,
                            fontWeight: FontWeight.w600,
                          ),
                          Row(
                            children: [
                              Icon(
                                IconData('calendaryp', custom: true),
                                size: 16,
                                color: iconColor,
                              ),
                              Text(
                                'Oct 08, 2026',
                                style: bodyMedium,
                                maxLines: 1,
                                textAlign: TextAlign.start,
                                lineHeight: 1.42,
                                fontSize: 14,
                                fontWeight: FontWeight.w400,
                              ),
                              Container(
                                color: primaryText,
                                width: 4,
                                boxShape: BoxShape.circle,
                              ),
                              Expanded(
                                Text(
                                  blogDetail.time ?? 'CreateAt',
                                  style: bodyMedium,
                                  maxLines: 1,
                                  textAlign: TextAlign.start,
                                  overflow: TextOverflow.ellipsis,
                                  lineHeight: 1.42,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w400,
                                ),
                              ),
                            ],
                            spacing: 4,
                          ),
                          Container(
                            color: borderColor,
                            width: double.infinity,
                            height: 1,
                          ),
                          Text(
                            'Identifying barcodes in the wild involves observing the shape, size, and pattern of the tracks. Look for distinctive features like claw marks, toe count, and stride length to determine the species.\n\nTo identify barcodes in the wild, examine the size and shape of the print, the number of toes, and any claw impressions. Patterns in the tracks can reveal the animal\'s gait and speed, helping you recognize different species and their habits.\n\nBarcodes can be identified by their unique shapes, toe arrangements, and claw marks. Observing the spacing between prints and the depth can provide clues about the animal\'s size and weight.\n\nWhen identifying barcodes, use a soft brush or stick to gently clear debris without damaging the print.',
                            style: bodyMedium,
                            textAlign: TextAlign.start,
                            lineHeight: 1.46,
                            fontSize: 15,
                            fontWeight: FontWeight.w400,
                          ),
                        ],
                        crossAxis: CrossAxis.start,
                        spacing: 12,
                      ),
                      color: buttonBg,
                      borderRadius: 16,
                      borderColor: borderColor,
                      borderWidth: 1,
                      width: double.infinity,
                      margin: EdgeInsets.only(
                        left: Constant('mainPadding'),
                        right: Constant('mainPadding'),
                      ),
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
          safeArea: true,
        ),
        width: double.infinity,
        height: double.infinity,
        gradient: Gradient.linear([
          GradientStop(linearColor1, 0),
          GradientStop(linearColor2, 0.13),
          GradientStop(linearColor3, 1),
        ], angle: 0),
        maxWidth: Constant('maxWidth'),
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
