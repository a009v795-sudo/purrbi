@Component()
class Card4 {
  build() => Container(
    child: Container(
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                Container(
                  padding: EdgeInsets.all(12),
                  child: Column(
                    children: [
                      Text(
                        'Product Overview',
                        style: bodyMedium,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                      Text(
                        'Red Label Natural Care Tea is a masala tea blend with five Ayurvedic ingredients: cardamom, ginger, tulsi, mulethi and ashwagandha',
                        style: bodyMedium,
                        color: secondaryText,
                        lineHeight: 1.33,
                        fontSize: 15,
                      ),
                    ],
                    crossAxis: CrossAxis.start,
                    spacing: 8,
                  ),
                  borderRadius: 16,
                  borderColor: borderColor,
                  margin: EdgeInsets.only(top: 12),
                ),
              ),
            ],
            spacing: 16,
          ),
          Row(
            children: [
              Expanded(
                Container(
                  padding: EdgeInsets.all(12),
                  child: Column(
                    children: [
                      Text(
                        'Cardamom',
                        style: bodyMedium,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                      Text(
                        'Helps support digestion.',
                        style: bodyMedium,
                        color: secondaryText,
                        lineHeight: 1.33,
                        fontSize: 15,
                      ),
                    ],
                    crossAxis: CrossAxis.start,
                    spacing: 8,
                  ),
                  borderRadius: 16,
                  borderColor: borderColor,
                  margin: EdgeInsets.only(top: 12),
                ),
              ),
            ],
            spacing: 16,
          ),
          Row(
            children: [
              Expanded(
                Container(
                  padding: EdgeInsets.all(12),
                  child: Column(
                    children: [
                      Text(
                        'Ginger',
                        style: bodyMedium,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                      Text(
                        'Traditionally associated with soothing cold and cough.',
                        style: bodyMedium,
                        color: secondaryText,
                        lineHeight: 1.33,
                        fontSize: 15,
                      ),
                    ],
                    crossAxis: CrossAxis.start,
                    spacing: 8,
                  ),
                  borderRadius: 16,
                  borderColor: borderColor,
                  margin: EdgeInsets.only(top: 12),
                ),
              ),
            ],
            spacing: 16,
          ),
          Row(
            children: [
              Expanded(
                Container(
                  padding: EdgeInsets.all(12),
                  child: Column(
                    children: [
                      Text(
                        'Tulsi',
                        style: bodyMedium,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                      Text(
                        'A traditional herbal ingredient.',
                        style: bodyMedium,
                        color: secondaryText,
                        lineHeight: 1.33,
                        fontSize: 15,
                      ),
                    ],
                    crossAxis: CrossAxis.start,
                    spacing: 8,
                  ),
                  borderRadius: 16,
                  borderColor: borderColor,
                  margin: EdgeInsets.only(top: 12),
                ),
              ),
            ],
            spacing: 16,
          ),
          Row(
            children: [
              Expanded(
                Container(
                  padding: EdgeInsets.all(12),
                  child: Column(
                    children: [
                      Text(
                        'Mulethi',
                        style: bodyMedium,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                      Text(
                        'Traditionally used for soothing the throat.',
                        style: bodyMedium,
                        color: secondaryText,
                        lineHeight: 1.33,
                        fontSize: 15,
                      ),
                    ],
                    crossAxis: CrossAxis.start,
                    spacing: 8,
                  ),
                  borderRadius: 16,
                  borderColor: borderColor,
                  margin: EdgeInsets.only(top: 12),
                ),
              ),
            ],
            spacing: 16,
          ),
          Row(
            children: [
              Expanded(
                Container(
                  padding: EdgeInsets.all(12),
                  child: Column(
                    children: [
                      Text(
                        'Ashwagandha',
                        style: bodyMedium,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                      Text(
                        'A traditional Ayurvedic ingredient.',
                        style: bodyMedium,
                        color: secondaryText,
                        lineHeight: 1.33,
                        fontSize: 15,
                      ),
                    ],
                    crossAxis: CrossAxis.start,
                    spacing: 8,
                  ),
                  borderRadius: 16,
                  borderColor: borderColor,
                  margin: EdgeInsets.only(top: 12),
                ),
              ),
            ],
            spacing: 16,
          ),
          Row(
            children: [
              Expanded(
                Container(
                  padding: EdgeInsets.all(12),
                  child: Column(
                    children: [
                      Text(
                        'Status',
                        style: bodyMedium,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                      Text(
                        'Product Verified',
                        style: bodyMedium,
                        color: secondaryText,
                        lineHeight: 1.33,
                        fontSize: 15,
                      ),
                    ],
                    crossAxis: CrossAxis.start,
                    spacing: 8,
                  ),
                  borderRadius: 16,
                  borderColor: borderColor,
                  margin: EdgeInsets.only(top: 12),
                ),
              ),
            ],
            spacing: 16,
          ),
        ],
        crossAxis: CrossAxis.start,
        minSize: MainAxisSize.min,
      ),
      color: buttonBg,
      borderColor: Color(0x00000000),
      borderWidth: 1,
      width: double.infinity,
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
