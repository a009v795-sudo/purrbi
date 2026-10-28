@Page(route: '/')
class ChatPageComponent {
  List<ChatModel> chatList;
  bool progress = false;
  List<String> suggestedTopicList = [
    '📷 Scan a product barcode',
    '🌍 Animal habitat & distribution',
    '👣 Barcode patterns & gait',
    '🦌 Animal behavior & characteristics',
  ];
  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              Row(
                children: [
                  Container(
                    child: Icon(
                      IconData('menuyp', custom: true),
                      size: 20,
                      color: primaryText,
                    ),
                    color: buttonBg,
                    borderColor: borderColor,
                    borderWidth: 1,
                    width: 40,
                    alignment: Alignment.center,
                    boxShape: BoxShape.circle,
                    onTap: () {
                      DrawerControl.open();
                    },
                  ),
                  Expanded(
                    Text(
                      'AI assistant',
                      style: bodyMedium,
                      maxLines: 1,
                      textAlign: TextAlign.center,
                      overflow: TextOverflow.ellipsis,
                      lineHeight: 1.3,
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Container(
                    child: Icon(
                      IconData('closeyp', custom: true),
                      size: 20,
                      color: primaryText,
                    ),
                    color: buttonBg,
                    borderColor: borderColor,
                    borderWidth: 1,
                    width: 40,
                    alignment: Alignment.center,
                    boxShape: BoxShape.circle,
                    onTap: () {
                      context.safePop();
                    },
                  ),
                ],
                mainAxis: MainAxis.spaceBetween,
                spacing: 8,
                minSize: MainAxisSize.min,
                padding: EdgeInsets.only(
                  left: Constant('mainPadding'),
                  top: 11,
                  right: Constant('mainPadding'),
                  bottom: 12,
                ),
                name: 'AppRow',
              ),
              Expanded(
                Container(
                  child: ConditionalBuilder(
                    children: [
                      PlaceholderWidget(
                        children: [
                          ListView(
                            source: chatList,
                            itemBuilder:
                                (chat) => Column(
                                  children: [
                                    Row(
                                      children: [
                                        Flexible(
                                          Container(
                                            padding: EdgeInsets.only(
                                              left: 16,
                                              top: 12,
                                              right: 16,
                                              bottom: 12,
                                            ),
                                            child: Text(
                                              chat.UserMessage,
                                              style: bodyMedium,
                                              color: primaryText,
                                              textAlign: TextAlign.end,
                                              lineHeight: 1.52,
                                              fontSize: 15,
                                              fontWeight: FontWeight.w400,
                                            ),
                                            color: secondary,
                                            borderRadius: BorderRadius.only(
                                              topLeft: 20,
                                              topRight: 20,
                                              bottomLeft: 20,
                                            ),
                                            margin: EdgeInsets.only(left: 20),
                                            maxWidth: Constant('maxWidth'),
                                            outerAlignment:
                                                Alignment.centerRight,
                                            onDoubleTap: () {
                                              ShowBottomSheet(
                                                UserMessageSheetComponet(
                                                  copyAction: () {
                                                    CopyToClipboard(
                                                      chat.UserMessage,
                                                    );
                                                    DismissBottomSheet();
                                                  },
                                                  shareAction: () {
                                                    actions.shareContent(
                                                      content: convertMDToST(
                                                        chat.UserMessage,
                                                      ),
                                                    );
                                                    DismissBottomSheet();
                                                  },
                                                  editAction: () {
                                                    SetFormField(
                                                      'TextField_6vf86rii',
                                                      chat.UserMessage,
                                                    );
                                                    DismissBottomSheet();
                                                  },
                                                  selectTextAction: () {
                                                    DismissBottomSheet();
                                                    ShowBottomSheet(
                                                      SelectTextBottomSheet(
                                                        textData:
                                                            chat.UserMessage,
                                                      ),
                                                      backgroundColor: Color(
                                                        0x00000000,
                                                      ),
                                                    );
                                                  },
                                                ),
                                                backgroundColor: Color(
                                                  0x00000000,
                                                ),
                                                enableDrag: false,
                                              );
                                            },
                                          ),
                                        ),
                                      ],
                                      mainAxis: MainAxis.end,
                                      crossAxis: CrossAxis.end,
                                      spacing: 12,
                                    ),
                                    Container(
                                      child: ConditionalBuilder(
                                        children: [
                                          PlaceholderWidget(
                                            children: [
                                              Column(
                                                children: [
                                                  Text(
                                                    'ChatBot',
                                                    style: bodyMedium,
                                                    color: secondaryText,
                                                    textAlign: TextAlign.start,
                                                    lineHeight: 1.38,
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.w400,
                                                  ),
                                                  Container(
                                                    child: Row(
                                                      children: [
                                                        Flexible(
                                                          Container(
                                                            padding:
                                                                EdgeInsets.only(
                                                                  left: 16,
                                                                  top: 12,
                                                                  right: 16,
                                                                  bottom: 12,
                                                                ),
                                                            child: Column(
                                                              children: [
                                                                Markdown(
                                                                  chat.responce,
                                                                  selectable:
                                                                      true,
                                                                ),
                                                                Container(
                                                                  padding:
                                                                      EdgeInsets.only(
                                                                        top: 8,
                                                                      ),
                                                                  child: Row(
                                                                    children: [
                                                                      Row(
                                                                        children: [
                                                                          Icon(
                                                                            IconData(
                                                                              'sharewithfriendsyp',
                                                                              custom:
                                                                                  true,
                                                                            ),
                                                                            size:
                                                                                20,
                                                                            color:
                                                                                secondaryText,
                                                                          ),
                                                                          Container(
                                                                            child: Icon(
                                                                              'content_copy',
                                                                              size:
                                                                                  20,
                                                                              color:
                                                                                  secondaryText,
                                                                            ),
                                                                            onTap: () {
                                                                              mainSanckbar(
                                                                                title:
                                                                                    'Content copied successfully.',
                                                                                shouldSetState:
                                                                                    true,
                                                                              );
                                                                            },
                                                                          ),
                                                                          Container(
                                                                            child: Icon(
                                                                              'volume_up',
                                                                              size:
                                                                                  20,
                                                                              color:
                                                                                  secondaryText,
                                                                            ),
                                                                            onTap: () {
                                                                              actions.textToSpeech(
                                                                                text:
                                                                                    chat.responce,
                                                                              );
                                                                            },
                                                                          ),
                                                                          Container(
                                                                            child: Icon(
                                                                              'article_outlined',
                                                                              size:
                                                                                  20,
                                                                              color:
                                                                                  secondaryText,
                                                                            ),
                                                                            onTap: () {
                                                                              ShowBottomSheet(
                                                                                SelectTextBottomSheet(
                                                                                  textData:
                                                                                      chat.responce,
                                                                                ),
                                                                                backgroundColor: Color(
                                                                                  0x00000000,
                                                                                ),
                                                                                enableDrag:
                                                                                    false,
                                                                              );
                                                                            },
                                                                          ),
                                                                        ],
                                                                        spacing:
                                                                            12,
                                                                        minSize:
                                                                            MainAxisSize.min,
                                                                      ),
                                                                    ],
                                                                  ),
                                                                  color: Color(
                                                                    0x00000000,
                                                                  ),
                                                                  borderRadius:
                                                                      6,
                                                                  borderColor:
                                                                      Color(
                                                                        0x00000000,
                                                                      ),
                                                                  borderWidth:
                                                                      1,
                                                                  alignment:
                                                                      Alignment
                                                                          .centerLeft,
                                                                  visible:
                                                                      chat
                                                                          .responce
                                                                          .isSet,
                                                                ),
                                                              ],
                                                              crossAxis:
                                                                  CrossAxis
                                                                      .start,
                                                            ),
                                                            color: grey100,
                                                            borderRadius:
                                                                BorderRadius.only(
                                                                  topLeft: 20,
                                                                  topRight: 20,
                                                                  bottomRight:
                                                                      20,
                                                                ),
                                                            borderColor: Color(
                                                              0x00000000,
                                                            ),
                                                            borderWidth: 1,
                                                            width:
                                                                double.infinity,
                                                            maxWidth: Constant(
                                                              'maxWidth',
                                                            ),
                                                            onDoubleTap: () {
                                                              ShowBottomSheet(
                                                                BotMessageSheetComponet(
                                                                  copyAction: () {
                                                                    CopyToClipboard(
                                                                      chat.responce,
                                                                    );
                                                                    DismissBottomSheet();
                                                                  },
                                                                  shareAction: () {
                                                                    actions.shareContent(
                                                                      content:
                                                                          convertMDToST(
                                                                            chat.responce,
                                                                          ),
                                                                    );
                                                                    DismissBottomSheet();
                                                                  },
                                                                  selectTextAction: () {
                                                                    DismissBottomSheet();
                                                                    ShowBottomSheet(
                                                                      SelectTextBottomSheet(
                                                                        textData:
                                                                            chat.responce,
                                                                      ),
                                                                      backgroundColor:
                                                                          Color(
                                                                            0x00000000,
                                                                          ),
                                                                    );
                                                                  },
                                                                ),
                                                                backgroundColor:
                                                                    Color(
                                                                      0x00000000,
                                                                    ),
                                                                enableDrag:
                                                                    false,
                                                              );
                                                            },
                                                          ),
                                                        ),
                                                      ],
                                                      crossAxis: CrossAxis.end,
                                                      spacing: 12,
                                                    ),
                                                  ),
                                                ],
                                                crossAxis: CrossAxis.start,
                                              ),
                                            ],
                                            visible: chat.responce.isSet,
                                          ),
                                          PlaceholderWidget(
                                            children: [
                                              Row(
                                                children: [
                                                  Icon(
                                                    'cloudy_snowing',
                                                    size: 21,
                                                    color: primary,
                                                  ),
                                                  Expanded(
                                                    Text(
                                                      'Thinking...',
                                                      style: bodyMedium,
                                                      maxLines: 1,
                                                      textAlign:
                                                          TextAlign.start,
                                                      overflow:
                                                          TextOverflow.ellipsis,
                                                      lineHeight: 1.4,
                                                      fontSize: 13,
                                                      fontWeight:
                                                          FontWeight.w400,
                                                      animations: [
                                                        WidgetAnimation(
                                                          trigger:
                                                              AnimationTrigger
                                                                  .onActionTrigger,
                                                          effects: [
                                                            TintEffect(
                                                              color:
                                                                  primaryBackground,
                                                              begin: 0,
                                                              end: 100,
                                                              delayMs: 0,
                                                              durationMs:
                                                                  1000.0,
                                                            ),
                                                          ],
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ],
                                                spacing: 6,
                                                minSize: MainAxisSize.min,
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                  crossAxis: CrossAxis.start,
                                  spacing: 16,
                                  minSize: MainAxisSize.min,
                                  padding: EdgeInsets.only(
                                    left: Constant('radius2Xl'),
                                    right: Constant('radius2Xl'),
                                  ),
                                ),
                            spacing: 16,
                            primary: true,
                            startSpacing: 16,
                            endSpacing: 12,
                          ),
                        ],
                        visible: chatList.isSet,
                      ),
                      PlaceholderWidget(
                        children: [
                          Column(
                            children: [
                              Container(
                                child: MiniLogo(hight: 64.0, width: 64.0),
                                color: primaryBackground,
                                borderColor: Color(0x00000000),
                                width: 114,
                                alignment: Alignment.center,
                                boxShape: BoxShape.circle,
                              ),
                              Text(
                                'Hello! I\'m ChatBot',
                                style: bodyMedium,
                                maxLines: 1,
                                textAlign: TextAlign.start,
                                lineHeight: 1.25,
                                fontSize: 24,
                                fontWeight: FontWeight.w700,
                                autoSize: true,
                                padding: EdgeInsets.only(
                                  left: Constant('mainPadding'),
                                  top: 16,
                                  right: Constant('mainPadding'),
                                  bottom: 8,
                                ),
                              ),
                              Text(
                                'Ask questions, explore information, and get helpful answers instantly.',
                                style: bodyMedium,
                                color: secondaryText,
                                maxLines: 2,
                                textAlign: TextAlign.center,
                                lineHeight: 1.52,
                                fontSize: 17,
                                fontWeight: FontWeight.w400,
                                autoSize: true,
                                padding: EdgeInsets.only(
                                  left: 20,
                                  top: 12,
                                  right: 20,
                                  bottom: 24,
                                ),
                              ),
                              Text(
                                'SUGGESTED TOPICS',
                                style: bodyMedium,
                                color: secondaryText,
                                maxLines: 1,
                                textAlign: TextAlign.center,
                                lineHeight: 1.46,
                                fontSize: 15,
                                fontWeight: FontWeight.w500,
                                padding: EdgeInsets.only(left: 16, bottom: 8),
                                outerAlignment: Alignment.centerLeft,
                              ),
                              Column(
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        Container(
                                          padding: EdgeInsets.all(20),
                                          child: Text(
                                            ItemRef(),
                                            style: bodyMedium,
                                            textAlign: TextAlign.start,
                                            lineHeight: 1.46,
                                            fontSize: 15,
                                            fontWeight: FontWeight.w400,
                                          ),
                                          color: buttonBg,
                                          borderRadius: 24,
                                          borderColor: Color(0x00000000),
                                          margin: EdgeInsets.all(8),
                                          boxShadow: Shadow(
                                            blur: 12,
                                            color: Color(0x11000000),
                                            dx: 0,
                                            dy: 2,
                                          ),
                                          onTap: () {
                                            SetFormField(
                                              'TextField_6vf86rii',
                                              ItemRef(),
                                            );
                                          },
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                                crossAxis: CrossAxis.start,
                                padding: EdgeInsets.only(left: 20, right: 20),
                                outerAlignment: Alignment.centerLeft,
                              ),
                            ],
                            scrollable: true,
                            startSpacing: 24,
                            endSpacing: 8,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              Container(
                child: Column(
                  children: [
                    Divider(height: 1, color: borderColor),
                    Container(
                      padding: EdgeInsets.only(right: 16),
                      child: Row(
                        children: [
                          Expanded(
                            Container(
                              padding: EdgeInsets.all(2),
                              child: TextField(
                                hint: 'Ask anything you\'d like to know...',
                                maxLines: 1,
                                style: bodyMedium,
                                fontSize: 17,
                                hintStyle: labelMedium,
                                hintColor: secondaryText,
                                hintFontSize: 17,
                                borderRadius: 50,
                                fillColor: Color(0x00070C07),
                                dense: true,
                                contentPadding: EdgeInsets.only(
                                  left: 16,
                                  top: 15,
                                  right: 16,
                                  bottom: 15,
                                ),
                                cursorColor: primaryText,
                                submitType: SubmitType.send,
                                width: double.infinity,
                                onSubmitted: (value) {
                                  if (!progress && value != '') {
                                    progress = true;
                                    StartAnimation(
                                      'Text_2pkpykfw',
                                      looping: true,
                                    );
                                    chatList.add(
                                      ChatModel(
                                        UserMessage: value,
                                        responce: constants.emptyString,
                                      ),
                                    );
                                    ClearTextField('TextField_6vf86rii');
                                    Wait(100);
                                    ScrollTo(
                                      'ListView_lobayzdk',
                                      percentage: 1,
                                      durationMillis: 100,
                                    );
                                    Wait(2000);
                                    chatList[(Count(chatList)) - 1].responce =
                                        appState.randomChat[RandomData.integer(
                                          min: 0,
                                          max: 19,
                                        )];
                                    progress = false;
                                    StopAnimation('Text_2pkpykfw');
                                    Wait(100);
                                    ScrollTo(
                                      'ListView_lobayzdk',
                                      percentage: 1,
                                      durationMillis: 100,
                                    );
                                  }
                                },
                              ),
                              borderRadius: 0,
                            ),
                          ),
                          Container(
                            child: Container(
                              padding: EdgeInsets.all(3.4),
                              child: ConditionalBuilder(
                                children: [
                                  PlaceholderWidget(
                                    children: [
                                      Icon(
                                        IconData('arrowupwardyp', custom: true),
                                        size: 26,
                                        color: iconColor,
                                      ),
                                    ],
                                    visible: !progress,
                                  ),
                                  PlaceholderWidget(
                                    children: [
                                      CirculatIndicatorWhite(
                                        width: 26,
                                        height: 26,
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              color: disableButton,
                              width: 40,
                              alignment: Alignment.center,
                              boxShape: BoxShape.circle,
                            ),
                            onTap: () {
                              if (!progress &&
                                  (WidgetState('TextField_6vf86rii').text) !=
                                      '') {
                                progress = true;
                                StartAnimation('Text_2pkpykfw', looping: true);
                                chatList.add(
                                  ChatModel(
                                    UserMessage:
                                        WidgetState('TextField_6vf86rii').text,
                                    responce: constants.emptyString,
                                  ),
                                );
                                ClearTextField('TextField_6vf86rii');
                                Wait(100);
                                ScrollTo(
                                  'ListView_lobayzdk',
                                  percentage: 1,
                                  durationMillis: 100,
                                );
                                Wait(2000);
                                chatList[(Count(chatList)) - 1].responce =
                                    appState.randomChat[RandomData.integer(
                                      min: 0,
                                      max: 19,
                                    )];
                                progress = Unset();
                                StopAnimation('Text_2pkpykfw');
                                Wait(100);
                                ScrollTo(
                                  'ListView_lobayzdk',
                                  percentage: 1,
                                  durationMillis: 100,
                                );
                              }
                            },
                          ),
                        ],
                        mainAxis: MainAxis.spaceBetween,
                        spacing: 16,
                      ),
                      borderRadius: 50,
                      borderColor: borderColor,
                      margin: EdgeInsets.only(
                        left: Constant('mainPadding'),
                        top: 12,
                        right: Constant('mainPadding'),
                        bottom: 16,
                      ),
                    ),
                  ],
                  crossAxis: CrossAxis.start,
                ),
                width: double.infinity,
                margin: EdgeInsets.only(top: 4),
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
    drawer: Drawer(
      child: Container(
        child: Container(
          child: Column(
            children: [
              Row(
                children: [
                  Container(
                    child: Icon(
                      IconData('closeyp', custom: true),
                      size: 20,
                      color: primaryText,
                    ),
                    color: buttonBg,
                    borderColor: borderColor,
                    borderWidth: 1,
                    width: 40,
                    alignment: Alignment.center,
                    boxShape: BoxShape.circle,
                    onTap: () {
                      CloseDialog();
                    },
                  ),
                  Expanded(
                    Text(
                      'History',
                      style: bodyMedium,
                      maxLines: 1,
                      textAlign: TextAlign.center,
                      overflow: TextOverflow.ellipsis,
                      lineHeight: 1.2,
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Container(width: 40, boxShape: BoxShape.circle),
                ],
                mainAxis: MainAxis.spaceBetween,
                spacing: 8,
                minSize: MainAxisSize.min,
                padding: EdgeInsets.only(
                  left: Constant('mainPadding'),
                  top: 11,
                  right: Constant('mainPadding'),
                  bottom: 12,
                ),
                name: 'AppRow',
              ),
              Row(
                children: [
                  Container(
                    child: Icon(
                      IconData('addyp', custom: true),
                      size: 20,
                      color: Color(0xFFFFFFFF),
                    ),
                    color: primary,
                    width: 32,
                    alignment: Alignment.center,
                    boxShape: BoxShape.circle,
                  ),
                  Expanded(
                    Text(
                      'New Chat',
                      style: bodyMedium,
                      color: primary,
                      maxLines: 1,
                      textAlign: TextAlign.start,
                      overflow: TextOverflow.ellipsis,
                      lineHeight: 1.28,
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Icon(
                    IconData('arrowrightyp', custom: true),
                    size: 16,
                    color: primaryText,
                  ),
                ],
                spacing: 8,
                padding: EdgeInsets.only(
                  left: 16,
                  top: 16,
                  right: 16,
                  bottom: 14,
                ),
                onTap: () {
                  chatList.clear();
                  CloseDialog();
                },
              ),
              Container(
                borderColor: disableButton,
                width: double.infinity,
                height: 1,
              ),
              Expanded(
                ListView(
                  source: appState.mainChatModelList,
                  itemBuilder:
                      (allChatCommonList) => Column(
                        children: [
                          Row(
                            children: [
                              Expanded(
                                Text(
                                  allChatCommonList.title,
                                  style: bodyMedium,
                                  maxLines: 1,
                                  textAlign: TextAlign.start,
                                  overflow: TextOverflow.ellipsis,
                                  lineHeight: 1.33,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w400,
                                ),
                              ),
                              Icon(
                                IconData('arrowrightyp', custom: true),
                                size: 16,
                                color: iconColor,
                              ),
                            ],
                            mainAxis: MainAxis.spaceBetween,
                            spacing: 8,
                            padding: EdgeInsets.only(
                              left: Constant('mainPadding'),
                              top: 14,
                              right: Constant('mainPadding'),
                              bottom: 14,
                            ),
                            onTap: () {
                              chatList = allChatCommonList.chatModelList;
                              CloseDialog();
                            },
                          ),
                          Container(
                            borderColor: disableButton,
                            width: double.infinity,
                            height: 1,
                          ),
                        ],
                        crossAxis: CrossAxis.start,
                      ),
                  primary: true,
                  startSpacing: 4,
                  endSpacing: 8,
                ),
              ),
            ],
            crossAxis: CrossAxis.start,
          ),
          width: double.infinity,
          height: double.infinity,
          safeArea: true,
        ),
        color: secondaryBackground,
        width: double.infinity,
        height: double.infinity,
      ),
      elevation: 16,
      percentOfScreenSize: 70,
    ),
    backgroundColor: bgColor,
    safeArea: false,
    onDispose: () {
      actions.stopTTS();
    },
  );
}
