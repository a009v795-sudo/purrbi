@Page(route: '/')
class AIAssistantPage {
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              MainAppbar(
                title: 'AI assistant',
                isBack: false,
                isEdit: false,
                isShare: false,
              ),
              Expanded(
                ListView(
                  children: [
                    Row(
                      children: [
                        Container(
                          child: MiniLogo(hight: 64.0, width: 64.0),
                          color: primaryBackground,
                          borderColor: Color(0x00000000),
                          width: 114,
                          alignment: Alignment.center,
                          boxShape: BoxShape.circle,
                        ),
                      ],
                      mainAxis: MainAxis.center,
                    ),
                    Text(
                      'Hello! I\'m ChatBot—\nyour barcode companion.',
                      style: bodyMedium,
                      color: primary,
                      textAlign: TextAlign.start,
                      lineHeight: 1.25,
                      fontSize: 30,
                      fontWeight: FontWeight.w700,
                      padding: EdgeInsets.only(
                        left: Constant('mainPadding'),
                        top: 16,
                        right: Constant('mainPadding'),
                        bottom: 8,
                      ),
                    ),
                    Row(
                      children: [
                        Container(
                          child: Image(
                            'projects/a-i-barcode-identifier-app-ahbvz7/assets/o7y0014clui4/details-1.png',
                            isNetwork: false,
                            width: 18,
                            height: 18,
                            borderRadius: 0,
                          ),
                          color: primaryLightColor,
                          width: 32,
                          alignment: Alignment.center,
                          boxShape: BoxShape.circle,
                        ),
                        Expanded(
                          Column(
                            children: [
                              Text(
                                'Identify barcodes using AI',
                                style: bodyMedium,
                                color: secondaryText,
                                maxLines: 1,
                                textAlign: TextAlign.start,
                                overflow: TextOverflow.ellipsis,
                                lineHeight: 1.33,
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                              ),
                            ],
                            crossAxis: CrossAxis.start,
                            spacing: 2,
                          ),
                        ),
                      ],
                      spacing: 12,
                      padding: EdgeInsets.only(
                        left: 16,
                        top: 26,
                        right: 16,
                        bottom: 14,
                      ),
                    ),
                    Row(
                      children: [
                        Container(
                          child: Icon(
                            IconData('articlesyp', custom: true),
                            size: 18,
                            color: primary,
                          ),
                          color: primaryLightColor,
                          width: 32,
                          alignment: Alignment.center,
                          boxShape: BoxShape.circle,
                        ),
                        Expanded(
                          Column(
                            children: [
                              Text(
                                'Learn fascinating facts about product',
                                style: bodyMedium,
                                color: secondaryText,
                                maxLines: 2,
                                textAlign: TextAlign.start,
                                overflow: TextOverflow.ellipsis,
                                lineHeight: 1.46,
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                              ),
                            ],
                            crossAxis: CrossAxis.start,
                            spacing: 2,
                          ),
                        ),
                      ],
                      spacing: 12,
                      padding: EdgeInsets.only(left: 16, right: 16),
                    ),
                    Row(
                      children: [
                        Container(
                          child: Icon(
                            'insert_chart_outlined',
                            size: 18,
                            color: primary,
                          ),
                          color: primaryLightColor,
                          width: 32,
                          alignment: Alignment.center,
                          boxShape: BoxShape.circle,
                        ),
                        Expanded(
                          Column(
                            children: [
                              Text(
                                'Analyze barcode patterns with AI',
                                style: bodyMedium,
                                color: secondaryText,
                                maxLines: 2,
                                textAlign: TextAlign.start,
                                overflow: TextOverflow.ellipsis,
                                lineHeight: 1.46,
                                fontSize: 15,
                                fontWeight: FontWeight.w400,
                              ),
                            ],
                            crossAxis: CrossAxis.start,
                            spacing: 2,
                          ),
                        ),
                      ],
                      spacing: 12,
                      padding: EdgeInsets.only(
                        left: 16,
                        top: 14,
                        right: 16,
                        bottom: 18,
                      ),
                    ),
                    Text(
                      'This AI assistant helps explore barcodes and product. Answers may be imperfect—use your own judgment outdoors.',
                      style: bodyMedium,
                      color: secondaryText,
                      textAlign: TextAlign.start,
                      lineHeight: 1.52,
                      fontSize: 13,
                      fontWeight: FontWeight.w400,
                      padding: EdgeInsets.only(
                        left: Constant('mainPadding'),
                        right: Constant('mainPadding'),
                        bottom: 32,
                      ),
                    ),
                  ],
                  primary: true,
                  startSpacing: 24,
                  endSpacing: 12,
                ),
              ),
              Button(
                'Start chatting',
                icon: IconSpec(
                  IconData('chatfyp', custom: true),
                  size: 24,
                  color: Color(0xFFFFFFFF),
                ),
                width: double.infinity,
                height: 56,
                borderRadius: 16,
                style: titleSmall,
                fontSize: 18,
                fontWeight: FontWeight.w600,
                lineHeight: 1,
                elevation: 0,
                innerPadding: EdgeInsets.only(left: 20, right: 20),
                padding: EdgeInsets.only(
                  left: Constant('mainPadding'),
                  top: 12,
                  right: Constant('mainPadding'),
                  bottom: 16,
                ),
                onTap: () {
                  if (appState.connected) {
                    context.push(ChatPageComponent());
                  } else {
                    internetSnackbar(shouldSetState: true);
                  }
                },
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
