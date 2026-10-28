@Component()
class Card3 {
  build() => Container(
    child: Container(
      padding: EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                Text(
                  'Per 100 ml',
                  style: bodyMedium,
                  color: secondaryText,
                  lineHeight: 1.5,
                  fontSize: 18,
                  fontWeight: FontWeight.w400,
                  padding: EdgeInsets.only(bottom: 12),
                ),
              ),
            ],
          ),
          Row(
            children: [
              Expanded(
                Text(
                  'Energy',
                  style: bodyMedium,
                  color: secondaryText,
                  lineHeight: 1.5,
                  fontSize: 16,
                  fontWeight: FontWeight.w400,
                ),
              ),
              Text(
                '0 kcal',
                style: bodyMedium,
                lineHeight: 1.47,
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
            ],
          ),
          Container(
            color: borderColor,
            borderColor: borderColor,
            width: double.infinity,
            height: 1,
            margin: EdgeInsets.only(top: 12, bottom: 12),
          ),
          Row(
            children: [
              Expanded(
                Text(
                  'Carbohydrates',
                  style: bodyMedium,
                  color: secondaryText,
                  lineHeight: 1.5,
                  fontSize: 16,
                  fontWeight: FontWeight.w400,
                ),
              ),
              Text(
                '0 g',
                style: bodyMedium,
                lineHeight: 1.47,
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
            ],
          ),
          Container(
            color: borderColor,
            borderColor: borderColor,
            width: double.infinity,
            height: 1,
            margin: EdgeInsets.only(top: 12, bottom: 12),
          ),
          Row(
            children: [
              Expanded(
                Text(
                  'Total Sugars',
                  style: bodyMedium,
                  color: secondaryText,
                  lineHeight: 1.5,
                  fontSize: 16,
                  fontWeight: FontWeight.w400,
                ),
              ),
              Text(
                '0 g',
                style: bodyMedium,
                lineHeight: 1.47,
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
            ],
          ),
          Container(
            color: borderColor,
            borderColor: borderColor,
            width: double.infinity,
            height: 1,
            margin: EdgeInsets.only(top: 12, bottom: 12),
          ),
          Row(
            children: [
              Expanded(
                Text(
                  'Added Sugars',
                  style: bodyMedium,
                  color: secondaryText,
                  lineHeight: 1.5,
                  fontSize: 16,
                  fontWeight: FontWeight.w400,
                ),
              ),
              Text(
                '10.6 g',
                style: bodyMedium,
                lineHeight: 1.47,
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
            ],
          ),
          Container(
            color: borderColor,
            borderColor: borderColor,
            width: double.infinity,
            height: 1,
            margin: EdgeInsets.only(top: 12, bottom: 12),
          ),
          Row(
            children: [
              Expanded(
                Text(
                  'Protein',
                  style: bodyMedium,
                  color: secondaryText,
                  lineHeight: 1.5,
                  fontSize: 16,
                  fontWeight: FontWeight.w400,
                ),
              ),
              Text(
                '0 g',
                style: bodyMedium,
                lineHeight: 1.47,
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
            ],
          ),
          Container(
            color: borderColor,
            borderColor: borderColor,
            width: double.infinity,
            height: 1,
            margin: EdgeInsets.only(top: 12, bottom: 12),
          ),
          Row(
            children: [
              Expanded(
                Text(
                  'Fat',
                  style: bodyMedium,
                  color: secondaryText,
                  lineHeight: 1.5,
                  fontSize: 16,
                  fontWeight: FontWeight.w400,
                ),
              ),
              Text(
                '0 g',
                style: bodyMedium,
                lineHeight: 1.47,
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
            ],
          ),
          Container(
            color: borderColor,
            borderColor: borderColor,
            width: double.infinity,
            height: 1,
            margin: EdgeInsets.only(top: 12, bottom: 12),
          ),
          Row(
            children: [
              Expanded(
                Text(
                  'Sodium',
                  style: bodyMedium,
                  color: secondaryText,
                  lineHeight: 1.5,
                  fontSize: 16,
                  fontWeight: FontWeight.w400,
                ),
              ),
              Text(
                '0 mg',
                style: bodyMedium,
                lineHeight: 1.47,
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
            ],
          ),
        ],
        crossAxis: CrossAxis.start,
        minSize: MainAxisSize.min,
      ),
      color: buttonBg,
      borderRadius: 16,
      borderColor: borderColor,
      borderWidth: 1,
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
