@Component()
class Card2 {
  build() => Container(
    child: Container(
      padding: EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                Text(
                  'Brand',
                  style: bodyMedium,
                  color: secondaryText,
                  lineHeight: 1.5,
                  fontSize: 16,
                  fontWeight: FontWeight.w400,
                ),
              ),
              Text(
                'Brooke Bond',
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
                  'Product',
                  style: bodyMedium,
                  color: secondaryText,
                  lineHeight: 1.5,
                  fontSize: 16,
                  fontWeight: FontWeight.w400,
                ),
              ),
              Text(
                'Red Label Natural Care Tea',
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
                  'Category',
                  style: bodyMedium,
                  color: secondaryText,
                  lineHeight: 1.5,
                  fontSize: 16,
                  fontWeight: FontWeight.w400,
                ),
              ),
              Text(
                'Tea & Beverages',
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
                  'Size',
                  style: bodyMedium,
                  color: secondaryText,
                  lineHeight: 1.5,
                  fontSize: 16,
                  fontWeight: FontWeight.w400,
                ),
              ),
              Text(
                '250 g',
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
                  'Price',
                  style: bodyMedium,
                  color: secondaryText,
                  lineHeight: 1.5,
                  fontSize: 16,
                  fontWeight: FontWeight.w400,
                ),
              ),
              Text(
                ' ₹145',
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
                  'Barcode Type',
                  style: bodyMedium,
                  color: secondaryText,
                  lineHeight: 1.5,
                  fontSize: 16,
                  fontWeight: FontWeight.w400,
                ),
              ),
              Text(
                'EAN-13',
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
                  'Barcode Number',
                  style: bodyMedium,
                  color: secondaryText,
                  lineHeight: 1.5,
                  fontSize: 16,
                  fontWeight: FontWeight.w400,
                ),
              ),
              Text(
                '8901030882555',
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
                  'Country',
                  style: bodyMedium,
                  color: secondaryText,
                  lineHeight: 1.5,
                  fontSize: 16,
                  fontWeight: FontWeight.w400,
                ),
              ),
              Text(
                'India',
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
                  'Product Status',
                  style: bodyMedium,
                  color: secondaryText,
                  lineHeight: 1.5,
                  fontSize: 16,
                  fontWeight: FontWeight.w400,
                ),
              ),
              Text(
                'Verified',
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
