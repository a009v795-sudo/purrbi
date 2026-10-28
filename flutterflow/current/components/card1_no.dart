@Component()
class Card1No {
  final String title;
  build() => Container(
    child: Container(
      child: Container(
        padding: EdgeInsets.only(left: 16, right: 16),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  Column(
                    children: [
                      Text(
                        title ?? 'title',
                        style: bodyMedium,
                        textAlign: TextAlign.start,
                        lineHeight: 1.3,
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                      ),
                      Text(
                        'Canis latrans',
                        style: bodyMedium,
                        color: secondaryText,
                        textAlign: TextAlign.start,
                        lineHeight: 1.52,
                        fontSize: 17,
                        fontWeight: FontWeight.w500,
                      ),
                      Column(
                        children: [
                          Row(
                            children: [
                              Expanded(
                                Container(
                                  padding: EdgeInsets.all(16),
                                  child: Row(
                                    children: [
                                      Container(
                                        child: Image(
                                          'projects/a-i-barcode-identifier-app-ahbvz7/assets/o7y0014clui4/details-1.png',
                                          isNetwork: false,
                                          width: 20,
                                          height: 20,
                                          borderRadius: 0,
                                        ),
                                        color: primaryLightColor,
                                        borderRadius: 8,
                                        width: 46,
                                        height: 46,
                                        alignment: Alignment.center,
                                      ),
                                      Expanded(
                                        Column(
                                          children: [
                                            Text(
                                              '₹145',
                                              style: bodyMedium,
                                              maxLines: 1,
                                              fontSize: 15,
                                              fontWeight: FontWeight.w600,
                                            ),
                                            Text(
                                              'Est. Retail Price',
                                              style: bodyMedium,
                                              color: secondaryText,
                                              maxLines: 1,
                                              lineHeight: 1.43,
                                            ),
                                          ],
                                          crossAxis: CrossAxis.start,
                                          spacing: 2,
                                        ),
                                      ),
                                    ],
                                    spacing: 8,
                                  ),
                                  color: secondaryBackground,
                                  borderRadius: 16,
                                  borderColor: borderColor,
                                  width: double.infinity,
                                ),
                              ),
                              Expanded(
                                Container(
                                  padding: EdgeInsets.all(16),
                                  child: Row(
                                    children: [
                                      Container(
                                        child: Image(
                                          'projects/a-i-barcode-identifier-app-ahbvz7/assets/6muz5o3hwbjg/detail-2.png',
                                          isNetwork: false,
                                          width: 20,
                                          height: 20,
                                          borderRadius: 0,
                                        ),
                                        color: primaryLightColor,
                                        borderRadius: 8,
                                        width: 46,
                                        height: 46,
                                        alignment: Alignment.center,
                                      ),
                                      Expanded(
                                        Column(
                                          children: [
                                            Text(
                                              'EAN-13',
                                              style: bodyMedium,
                                              maxLines: 1,
                                              fontSize: 15,
                                              fontWeight: FontWeight.w600,
                                            ),
                                            Text(
                                              'Barcode Type',
                                              style: bodyMedium,
                                              color: secondaryText,
                                              maxLines: 1,
                                              lineHeight: 1.43,
                                            ),
                                          ],
                                          crossAxis: CrossAxis.start,
                                        ),
                                      ),
                                    ],
                                    spacing: 8,
                                  ),
                                  color: secondaryBackground,
                                  borderRadius: 16,
                                  borderColor: borderColor,
                                  width: double.infinity,
                                ),
                              ),
                            ],
                            spacing: 16,
                            padding: EdgeInsets.only(top: 16),
                          ),
                          Row(
                            children: [
                              Expanded(
                                Container(
                                  padding: EdgeInsets.all(16),
                                  child: Row(
                                    children: [
                                      Container(
                                        child: Image(
                                          'projects/a-i-barcode-identifier-app-ahbvz7/assets/8xvmu9h4405d/details-3.png',
                                          isNetwork: false,
                                          width: 20,
                                          height: 20,
                                          borderRadius: 0,
                                        ),
                                        color: primaryLightColor,
                                        borderRadius: 8,
                                        width: 46,
                                        height: 46,
                                        alignment: Alignment.center,
                                      ),
                                      Expanded(
                                        Column(
                                          children: [
                                            Text(
                                              '8901030891123',
                                              style: bodyMedium,
                                              maxLines: 1,
                                              fontSize: 15,
                                              fontWeight: FontWeight.w600,
                                            ),
                                            Text(
                                              'Barcode',
                                              style: bodyMedium,
                                              color: secondaryText,
                                              maxLines: 1,
                                              lineHeight: 1.43,
                                            ),
                                          ],
                                          crossAxis: CrossAxis.start,
                                          spacing: 2,
                                        ),
                                      ),
                                    ],
                                    spacing: 8,
                                  ),
                                  color: secondaryBackground,
                                  borderRadius: 16,
                                  borderColor: borderColor,
                                  width: double.infinity,
                                ),
                              ),
                              Expanded(
                                Container(
                                  padding: EdgeInsets.all(16),
                                  child: Row(
                                    children: [
                                      Container(
                                        child: Image(
                                          'projects/a-i-barcode-identifier-app-ahbvz7/assets/59saooc1xpzb/detils-4.png',
                                          isNetwork: false,
                                          width: 20,
                                          height: 20,
                                          borderRadius: 0,
                                        ),
                                        color: primaryLightColor,
                                        borderRadius: 8,
                                        width: 46,
                                        height: 46,
                                        alignment: Alignment.center,
                                      ),
                                      Expanded(
                                        Column(
                                          children: [
                                            Text(
                                              'India',
                                              style: bodyMedium,
                                              maxLines: 1,
                                              fontSize: 15,
                                              fontWeight: FontWeight.w600,
                                            ),
                                            Text(
                                              'Country',
                                              style: bodyMedium,
                                              maxLines: 1,
                                              lineHeight: 1.43,
                                            ),
                                          ],
                                          crossAxis: CrossAxis.start,
                                          spacing: 2,
                                        ),
                                      ),
                                    ],
                                    spacing: 8,
                                  ),
                                  color: secondaryBackground,
                                  borderRadius: 16,
                                  borderColor: borderColor,
                                  width: double.infinity,
                                ),
                              ),
                            ],
                            spacing: 16,
                            padding: EdgeInsets.only(top: 16),
                          ),
                        ],
                      ),
                    ],
                    crossAxis: CrossAxis.start,
                    spacing: 4,
                    minSize: MainAxisSize.min,
                  ),
                ),
              ],
              crossAxis: CrossAxis.start,
            ),
          ],
          minSize: MainAxisSize.min,
        ),
        borderRadius: 16,
        borderColor: Color(0x00000000),
      ),
      borderRadius: 16,
      borderColor: Color(0x00000000),
    ),
    color: Color(0x00000000),
    animations: [
      WidgetAnimation(
        effects: [
          FadeEffect(begin: 0.0, end: 1.0, delayMs: 0.0, durationMs: 300.0),
          SlideEffect(
            beginDx: 0.0,
            beginDy: 16.0,
            endDx: 0.0,
            endDy: 0.0,
            delayMs: 0.0,
            durationMs: 300.0,
          ),
        ],
        applyInitialState: true,
        hideBeforeAnimating: true,
      ),
    ],
  );
}
