import 'package:flutter/material.dart'
    show ChangeNotifier, Color, Colors, VoidCallback;
import '/backend/backend.dart';
import '/backend/schema/structs/index.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'flutter_flow/flutter_flow_util.dart';

class FFAppState extends ChangeNotifier {
  static FFAppState _instance = FFAppState._internal();

  factory FFAppState() {
    return _instance;
  }

  FFAppState._internal();

  static void reset() {
    _instance = FFAppState._internal();
  }

  Future initializePersistedState() async {
    prefs = await SharedPreferences.getInstance();
    _safeInit(() {
      _isIntro = prefs.getBool('ff_isIntro') ?? _isIntro;
    });
    _safeInit(() {
      _isLogin = prefs.getBool('ff_isLogin') ?? _isLogin;
    });
    _safeInit(() {
      _isPro = prefs.getBool('ff_isPro') ?? _isPro;
    });
    _safeInit(() {
      if (prefs.containsKey('ff_userDetail')) {
        try {
          final serializedData = prefs.getString('ff_userDetail') ?? '{}';
          _userDetail =
              LoginModelStruct.fromSerializableMap(jsonDecode(serializedData));
        } catch (e) {
          print("Can't decode persisted data type. Error: $e.");
        }
      }
    });
    _safeInit(() {
      _modeIndex = prefs.getInt('ff_modeIndex') ?? _modeIndex;
    });
    _safeInit(() {
      _packageName = prefs.getString('ff_packageName') ?? _packageName;
    });
    _safeInit(() {
      _appName = prefs.getString('ff_appName') ?? _appName;
    });
    _safeInit(() {
      _deviceId = prefs.getString('ff_deviceId') ?? _deviceId;
    });
    _safeInit(() {
      _currencyType = prefs.getString('ff_currencyType') ?? _currencyType;
    });
    _safeInit(() {
      _countryName = prefs.getString('ff_countryName') ?? _countryName;
    });
    _safeInit(() {
      _searchList = prefs.getStringList('ff_searchList') ?? _searchList;
    });
    _safeInit(() {
      _defTimeZoneName =
          prefs.getString('ff_defTimeZoneName') ?? _defTimeZoneName;
    });
    _safeInit(() {
      _mainChatModelList = prefs
              .getStringList('ff_mainChatModelList')
              ?.map((x) {
                try {
                  return MainChatModelStruct.fromSerializableMap(jsonDecode(x));
                } catch (e) {
                  print("Can't decode persisted data type. Error: $e.");
                  return null;
                }
              })
              .withoutNulls
              .toList() ??
          _mainChatModelList;
    });
    _safeInit(() {
      _favouriteDataList = prefs
              .getStringList('ff_favouriteDataList')
              ?.map((x) {
                try {
                  return MainDataModelStruct.fromSerializableMap(jsonDecode(x));
                } catch (e) {
                  print("Can't decode persisted data type. Error: $e.");
                  return null;
                }
              })
              .withoutNulls
              .toList() ??
          _favouriteDataList;
    });
    _safeInit(() {
      _isAdsTap = prefs.getInt('ff_isAdsTap') ?? _isAdsTap;
    });
    _safeInit(() {
      _historyList = prefs
              .getStringList('ff_historyList')
              ?.map((x) {
                try {
                  return MainDataModelStruct.fromSerializableMap(jsonDecode(x));
                } catch (e) {
                  print("Can't decode persisted data type. Error: $e.");
                  return null;
                }
              })
              .withoutNulls
              .toList() ??
          _historyList;
    });
  }

  void update(VoidCallback callback) {
    callback();
    notifyListeners();
  }

  late SharedPreferences prefs;

  bool _isIntro = false;
  bool get isIntro => _isIntro;
  set isIntro(bool value) {
    _isIntro = value;
    prefs.setBool('ff_isIntro', value);
  }

  bool _isLogin = false;
  bool get isLogin => _isLogin;
  set isLogin(bool value) {
    _isLogin = value;
    prefs.setBool('ff_isLogin', value);
  }

  bool _isPro = false;
  bool get isPro => _isPro;
  set isPro(bool value) {
    _isPro = value;
    prefs.setBool('ff_isPro', value);
  }

  LoginModelStruct _userDetail = LoginModelStruct();
  LoginModelStruct get userDetail => _userDetail;
  set userDetail(LoginModelStruct value) {
    _userDetail = value;
    prefs.setString('ff_userDetail', value.serialize());
  }

  void updateUserDetailStruct(Function(LoginModelStruct) updateFn) {
    updateFn(_userDetail);
    prefs.setString('ff_userDetail', _userDetail.serialize());
  }

  int _modeIndex = 2;
  int get modeIndex => _modeIndex;
  set modeIndex(int value) {
    _modeIndex = value;
    prefs.setInt('ff_modeIndex', value);
  }

  String _packageName = 'com.mycompany.purrbiv2development';
  String get packageName => _packageName;
  set packageName(String value) {
    _packageName = value;
    prefs.setString('ff_packageName', value);
  }

  String _appName = 'Purrbi';
  String get appName => _appName;
  set appName(String value) {
    _appName = value;
    prefs.setString('ff_appName', value);
  }

  bool _connected = true;
  bool get connected => _connected;
  set connected(bool value) {
    _connected = value;
  }

  String _deviceId = '';
  String get deviceId => _deviceId;
  set deviceId(String value) {
    _deviceId = value;
    prefs.setString('ff_deviceId', value);
  }

  String _currencyType = 'USD';
  String get currencyType => _currencyType;
  set currencyType(String value) {
    _currencyType = value;
    prefs.setString('ff_currencyType', value);
  }

  List<IntroModelStruct> _introList = [
    IntroModelStruct.fromSerializableMap(jsonDecode(
        '{\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/dboi154xv6s0/intro-light-1.png\",\"darkImage\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/3gkvyohg7bcb/intro-dark-1.png\",\"title\":\"Scan every \\nproduct barcode\",\"title2\":\"\",\"subTitle\":\"Scan barcode instantly with AI and \\ndiscover the product behind every trail.\"}')),
    IntroModelStruct.fromSerializableMap(jsonDecode(
        '{\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/tbmhahfijrt8/intro-light-2.png\",\"darkImage\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/e0dzk1esgnh9/intro-dark-2.png\",\"title\":\"Smart AI\\nscanning\",\"title2\":\"\",\"subTitle\":\"Get accurate barcode results with brand, category, and product insightsts.\"}')),
    IntroModelStruct.fromSerializableMap(jsonDecode(
        '{\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/b8r5vtsh4b6u/intro-light-3.png\",\"darkImage\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/4vncjjahgby9/intro-dark-3.png\",\"title\":\"Explore products\\nsmarter\",\"title2\":\"\",\"subTitle\":\"Save scans, build your history, and learn about products wherever you go.\"}'))
  ];
  List<IntroModelStruct> get introList => _introList;
  set introList(List<IntroModelStruct> value) {
    _introList = value;
  }

  void addToIntroList(IntroModelStruct value) {
    introList.add(value);
  }

  void removeFromIntroList(IntroModelStruct value) {
    introList.remove(value);
  }

  void removeAtIndexFromIntroList(int index) {
    introList.removeAt(index);
  }

  void updateIntroListAtIndex(
    int index,
    IntroModelStruct Function(IntroModelStruct) updateFn,
  ) {
    introList[index] = updateFn(_introList[index]);
  }

  void insertAtIndexInIntroList(int index, IntroModelStruct value) {
    introList.insert(index, value);
  }

  String _countryName = 'IN';
  String get countryName => _countryName;
  set countryName(String value) {
    _countryName = value;
    prefs.setString('ff_countryName', value);
  }

  int _homePageIndex = 0;
  int get homePageIndex => _homePageIndex;
  set homePageIndex(int value) {
    _homePageIndex = value;
  }

  List<String> _searchList = [];
  List<String> get searchList => _searchList;
  set searchList(List<String> value) {
    _searchList = value;
    prefs.setStringList('ff_searchList', value);
  }

  void addToSearchList(String value) {
    searchList.add(value);
    prefs.setStringList('ff_searchList', _searchList);
  }

  void removeFromSearchList(String value) {
    searchList.remove(value);
    prefs.setStringList('ff_searchList', _searchList);
  }

  void removeAtIndexFromSearchList(int index) {
    searchList.removeAt(index);
    prefs.setStringList('ff_searchList', _searchList);
  }

  void updateSearchListAtIndex(
    int index,
    String Function(String) updateFn,
  ) {
    searchList[index] = updateFn(_searchList[index]);
    prefs.setStringList('ff_searchList', _searchList);
  }

  void insertAtIndexInSearchList(int index, String value) {
    searchList.insert(index, value);
    prefs.setStringList('ff_searchList', _searchList);
  }

  List<NotificationsModelStruct> _notificationsList = [
    NotificationsModelStruct.fromSerializableMap(jsonDecode(
        '{\"title\":\"Scanner ready for barcode scan!\",\"subTitle\":\"Tracking session starts soon, head to the observation point.\",\"createAt\":\"May 19, 2026 | 9:41 AM\"}')),
    NotificationsModelStruct.fromSerializableMap(jsonDecode(
        '{\"title\":\"Scanner ready for barcode scan!\",\"subTitle\":\"Barcode scan scheduled and ready.\",\"createAt\":\"May 18, 2026 | 9:30 AM\"}')),
    NotificationsModelStruct.fromSerializableMap(jsonDecode(
        '{\"title\":\"Scanning starts in minutes!\",\"subTitle\":\"Arrive at the tracking site before scanning starts.\",\"createAt\":\"May 17, 2026 | 9:35 AM\"}')),
    NotificationsModelStruct.fromSerializableMap(jsonDecode(
        '{\"title\":\"Today\'s scan reminder!\",\"subTitle\":\"Bring your scan ID and device before starting.\",\"createAt\":\"May 16, 2026 | 9:25 AM\"}')),
    NotificationsModelStruct.fromSerializableMap(jsonDecode(
        '{\"title\":\"Scanner ready for barcode scan!\",\"subTitle\":\"Tracking session starts soon, head to the observation point.\",\"createAt\":\"May 19, 2026 | 9:41 AM\"}'))
  ];
  List<NotificationsModelStruct> get notificationsList => _notificationsList;
  set notificationsList(List<NotificationsModelStruct> value) {
    _notificationsList = value;
  }

  void addToNotificationsList(NotificationsModelStruct value) {
    notificationsList.add(value);
  }

  void removeFromNotificationsList(NotificationsModelStruct value) {
    notificationsList.remove(value);
  }

  void removeAtIndexFromNotificationsList(int index) {
    notificationsList.removeAt(index);
  }

  void updateNotificationsListAtIndex(
    int index,
    NotificationsModelStruct Function(NotificationsModelStruct) updateFn,
  ) {
    notificationsList[index] = updateFn(_notificationsList[index]);
  }

  void insertAtIndexInNotificationsList(
      int index, NotificationsModelStruct value) {
    notificationsList.insert(index, value);
  }

  String _defTimeZoneName = 'America/Detroit';
  String get defTimeZoneName => _defTimeZoneName;
  set defTimeZoneName(String value) {
    _defTimeZoneName = value;
    prefs.setString('ff_defTimeZoneName', value);
  }

  List<String> _randomChat = [
    'Sure! Share a clear photo or describe the barcode — format, digits, brand, and packaging help me scan it.',
    'The barcode is clear, printed, has 12 digits, and no visible damage.',
    'That pattern often points to a UPC-A or EAN-13 retail code. Want me to narrow it down with a few more questions?',
    'Scan product barcodes using AI',
    'Learn fascinating facts about product',
    'Decode barcode patterns with AI',
    'What product is this barcode?',
    'Coca-Cola barcode',
    'Organic honey barcode',
    'iPhone charger barcode',
    'Protein bar scan',
    'Olive oil barcode',
    'Almond milk barcode',
    'Green tea barcode',
    'Energy drink barcode',
    'Greek yogurt barcode',
    'Sparkling water barcode',
    'Baby formula barcode',
    'Sports drink barcode',
    '📷 Scan a product barcode'
  ];
  List<String> get randomChat => _randomChat;
  set randomChat(List<String> value) {
    _randomChat = value;
  }

  void addToRandomChat(String value) {
    randomChat.add(value);
  }

  void removeFromRandomChat(String value) {
    randomChat.remove(value);
  }

  void removeAtIndexFromRandomChat(int index) {
    randomChat.removeAt(index);
  }

  void updateRandomChatAtIndex(
    int index,
    String Function(String) updateFn,
  ) {
    randomChat[index] = updateFn(_randomChat[index]);
  }

  void insertAtIndexInRandomChat(int index, String value) {
    randomChat.insert(index, value);
  }

  List<ChatModelStruct> _messageList = [];
  List<ChatModelStruct> get messageList => _messageList;
  set messageList(List<ChatModelStruct> value) {
    _messageList = value;
  }

  void addToMessageList(ChatModelStruct value) {
    messageList.add(value);
  }

  void removeFromMessageList(ChatModelStruct value) {
    messageList.remove(value);
  }

  void removeAtIndexFromMessageList(int index) {
    messageList.removeAt(index);
  }

  void updateMessageListAtIndex(
    int index,
    ChatModelStruct Function(ChatModelStruct) updateFn,
  ) {
    messageList[index] = updateFn(_messageList[index]);
  }

  void insertAtIndexInMessageList(int index, ChatModelStruct value) {
    messageList.insert(index, value);
  }

  List<HelpSupportModelStruct> _faqList = [
    HelpSupportModelStruct.fromSerializableMap(jsonDecode(
        '{\"title\":\"What types of barcodes can the AI scan?\",\"description\":\"The AI can scan barcodes including UPC-A, EAN-13, QR codes, Code 128, and hundreds more retail and logistics formats acraptors, songbirds), and some reptiles and amphibians. It works with prints in mud, snow, sand, soil, and other substrates.\"}')),
    HelpSupportModelStruct.fromSerializableMap(jsonDecode(
        '{\"title\":\"Does the photo need to include a scale reference?\",\"description\":\"A scale reference (coin, ruler, or boot) greatly improves measurement accuracy. However, the AI can still scan the product and provide estimated measurements without one, based on the relative proportions of the print features.\"}')),
    HelpSupportModelStruct.fromSerializableMap(jsonDecode(
        '{\"title\":\"How accurate is the barcode scan?\",\"description\":\"Accuracy depends on the clarity of the print, lighting, and the angle of the photo. Clear, top-down photos in good light with visible toe and pad details yield the highest confidence. The AI also provides a confidence score and notes any ambiguities, such as similar product that could leave the same barcode.\"}')),
    HelpSupportModelStruct.fromSerializableMap(jsonDecode(
        '{\"title\":\"Can it scan damaged barcodes?\",\"description\":\"Yes. Barcodes in snow are often very clear and produce excellent results. Keep in mind that melting snow can distort print size and shape, so the AI will factor this uncertainty into its confidence score.\"}')),
    HelpSupportModelStruct.fromSerializableMap(jsonDecode(
        '{\"title\":\"Is this useful for hunters and product managers?\",\"description\":\"Absolutely. The AI provides barcode format detection, estimated product category, brand clues (e.g., foraging vs. fleeing), and travel direction. All of this is useful for locating and monitoring product. It can also help differentiate between product that leave similar barcodes, like domestic dogs and coyotes.\"}')),
    HelpSupportModelStruct.fromSerializableMap(jsonDecode(
        '{\"title\":\"What types of barcodes can the AI scan?\",\"description\":\"The AI can scan barcodes including UPC-A, EAN-13, QR codes, Code 128, and hundreds more retail and logistics formats acraptors, songbirds), and some reptiles and amphibians. It works with prints in mud, snow, sand, soil, and other substrates.\"}')),
    HelpSupportModelStruct.fromSerializableMap(jsonDecode(
        '{\"title\":\"Does the photo need to include a scale reference?\",\"description\":\"A scale reference (coin, ruler, or boot) greatly improves measurement accuracy. However, the AI can still scan the product and provide estimated measurements without one, based on the relative proportions of the print features.\"}'))
  ];
  List<HelpSupportModelStruct> get faqList => _faqList;
  set faqList(List<HelpSupportModelStruct> value) {
    _faqList = value;
  }

  void addToFaqList(HelpSupportModelStruct value) {
    faqList.add(value);
  }

  void removeFromFaqList(HelpSupportModelStruct value) {
    faqList.remove(value);
  }

  void removeAtIndexFromFaqList(int index) {
    faqList.removeAt(index);
  }

  void updateFaqListAtIndex(
    int index,
    HelpSupportModelStruct Function(HelpSupportModelStruct) updateFn,
  ) {
    faqList[index] = updateFn(_faqList[index]);
  }

  void insertAtIndexInFaqList(int index, HelpSupportModelStruct value) {
    faqList.insert(index, value);
  }

  List<MainChatModelStruct> _mainChatModelList = [
    MainChatModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"0\",\"title\":\"Coca-Cola barcode\",\"chatModelList\":\"[\\\"{\\\\\\\"UserMessage\\\\\\\":\\\\\\\"Sure! Share a clear photo or describe the barcode — format, digits, brand, and packaging help me scan it.\\\\\\\",\\\\\\\"responce\\\\\\\":\\\\\\\"Sure! Share a clear photo or describe the barcode — format, digits, brand, and packaging help me scan it.\\\\\\\"}\\\",\\\"{\\\\\\\"UserMessage\\\\\\\":\\\\\\\"The barcode is clear, printed, has 12 digits, and no visible damage.\\\\\\\",\\\\\\\"responce\\\\\\\":\\\\\\\"The barcode is clear, printed, has 12 digits, and no visible damage.\\\\\\\"}\\\",\\\"{\\\\\\\"UserMessage\\\\\\\":\\\\\\\"That pattern often points to a UPC-A or EAN-13 retail code. Want me to narrow it down with a few more questions?\\\\\\\",\\\\\\\"responce\\\\\\\":\\\\\\\"That pattern often points to a UPC-A or EAN-13 retail code. Want me to narrow it down with a few more questions?\\\\\\\"}\\\",\\\"{\\\\\\\"UserMessage\\\\\\\":\\\\\\\"Scan product barcodes using AI\\\\\\\",\\\\\\\"responce\\\\\\\":\\\\\\\"Scan product barcodes using AI\\\\\\\"}\\\",\\\"{\\\\\\\"UserMessage\\\\\\\":\\\\\\\"Learn fascinating facts about product\\\\\\\",\\\\\\\"responce\\\\\\\":\\\\\\\"Learn fascinating facts about product\\\\\\\"}\\\"]\"}')),
    MainChatModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"1\",\"title\":\"Coca-Cola barcode\",\"chatModelList\":\"[\\\"{\\\\\\\"UserMessage\\\\\\\":\\\\\\\"Coca-Cola barcode\\\\\\\",\\\\\\\"responce\\\\\\\":\\\\\\\"📷 Scan a product barcode\\\\\\\"}\\\",\\\"{\\\\\\\"UserMessage\\\\\\\":\\\\\\\"The barcode is clear, printed, has 12 digits, and no visible damage.\\\\\\\",\\\\\\\"responce\\\\\\\":\\\\\\\"The barcode is clear, printed, has 12 digits, and no visible damage.\\\\\\\"}\\\",\\\"{\\\\\\\"UserMessage\\\\\\\":\\\\\\\"That pattern often points to a UPC-A or EAN-13 retail code. Want me to narrow it down with a few more questions?\\\\\\\",\\\\\\\"responce\\\\\\\":\\\\\\\"That pattern often points to a UPC-A or EAN-13 retail code. Want me to narrow it down with a few more questions?\\\\\\\"}\\\",\\\"{\\\\\\\"UserMessage\\\\\\\":\\\\\\\"Scan product barcodes using AI\\\\\\\",\\\\\\\"responce\\\\\\\":\\\\\\\"Scan product barcodes using AI\\\\\\\"}\\\",\\\"{\\\\\\\"UserMessage\\\\\\\":\\\\\\\"Learn fascinating facts about product\\\\\\\",\\\\\\\"responce\\\\\\\":\\\\\\\"Learn fascinating facts about product\\\\\\\"}\\\"]\"}'))
  ];
  List<MainChatModelStruct> get mainChatModelList => _mainChatModelList;
  set mainChatModelList(List<MainChatModelStruct> value) {
    _mainChatModelList = value;
    prefs.setStringList(
        'ff_mainChatModelList', value.map((x) => x.serialize()).toList());
  }

  void addToMainChatModelList(MainChatModelStruct value) {
    mainChatModelList.add(value);
    prefs.setStringList('ff_mainChatModelList',
        _mainChatModelList.map((x) => x.serialize()).toList());
  }

  void removeFromMainChatModelList(MainChatModelStruct value) {
    mainChatModelList.remove(value);
    prefs.setStringList('ff_mainChatModelList',
        _mainChatModelList.map((x) => x.serialize()).toList());
  }

  void removeAtIndexFromMainChatModelList(int index) {
    mainChatModelList.removeAt(index);
    prefs.setStringList('ff_mainChatModelList',
        _mainChatModelList.map((x) => x.serialize()).toList());
  }

  void updateMainChatModelListAtIndex(
    int index,
    MainChatModelStruct Function(MainChatModelStruct) updateFn,
  ) {
    mainChatModelList[index] = updateFn(_mainChatModelList[index]);
    prefs.setStringList('ff_mainChatModelList',
        _mainChatModelList.map((x) => x.serialize()).toList());
  }

  void insertAtIndexInMainChatModelList(int index, MainChatModelStruct value) {
    mainChatModelList.insert(index, value);
    prefs.setStringList('ff_mainChatModelList',
        _mainChatModelList.map((x) => x.serialize()).toList());
  }

  List<MainDataModelStruct> _favouriteDataList = [];
  List<MainDataModelStruct> get favouriteDataList => _favouriteDataList;
  set favouriteDataList(List<MainDataModelStruct> value) {
    _favouriteDataList = value;
    prefs.setStringList(
        'ff_favouriteDataList', value.map((x) => x.serialize()).toList());
  }

  void addToFavouriteDataList(MainDataModelStruct value) {
    favouriteDataList.add(value);
    prefs.setStringList('ff_favouriteDataList',
        _favouriteDataList.map((x) => x.serialize()).toList());
  }

  void removeFromFavouriteDataList(MainDataModelStruct value) {
    favouriteDataList.remove(value);
    prefs.setStringList('ff_favouriteDataList',
        _favouriteDataList.map((x) => x.serialize()).toList());
  }

  void removeAtIndexFromFavouriteDataList(int index) {
    favouriteDataList.removeAt(index);
    prefs.setStringList('ff_favouriteDataList',
        _favouriteDataList.map((x) => x.serialize()).toList());
  }

  void updateFavouriteDataListAtIndex(
    int index,
    MainDataModelStruct Function(MainDataModelStruct) updateFn,
  ) {
    favouriteDataList[index] = updateFn(_favouriteDataList[index]);
    prefs.setStringList('ff_favouriteDataList',
        _favouriteDataList.map((x) => x.serialize()).toList());
  }

  void insertAtIndexInFavouriteDataList(int index, MainDataModelStruct value) {
    favouriteDataList.insert(index, value);
    prefs.setStringList('ff_favouriteDataList',
        _favouriteDataList.map((x) => x.serialize()).toList());
  }

  int _isAdsTap = 0;
  int get isAdsTap => _isAdsTap;
  set isAdsTap(int value) {
    _isAdsTap = value;
    prefs.setInt('ff_isAdsTap', value);
  }

  List<MainDataModelStruct> _historyList = [];
  List<MainDataModelStruct> get historyList => _historyList;
  set historyList(List<MainDataModelStruct> value) {
    _historyList = value;
    prefs.setStringList(
        'ff_historyList', value.map((x) => x.serialize()).toList());
  }

  void addToHistoryList(MainDataModelStruct value) {
    historyList.add(value);
    prefs.setStringList(
        'ff_historyList', _historyList.map((x) => x.serialize()).toList());
  }

  void removeFromHistoryList(MainDataModelStruct value) {
    historyList.remove(value);
    prefs.setStringList(
        'ff_historyList', _historyList.map((x) => x.serialize()).toList());
  }

  void removeAtIndexFromHistoryList(int index) {
    historyList.removeAt(index);
    prefs.setStringList(
        'ff_historyList', _historyList.map((x) => x.serialize()).toList());
  }

  void updateHistoryListAtIndex(
    int index,
    MainDataModelStruct Function(MainDataModelStruct) updateFn,
  ) {
    historyList[index] = updateFn(_historyList[index]);
    prefs.setStringList(
        'ff_historyList', _historyList.map((x) => x.serialize()).toList());
  }

  void insertAtIndexInHistoryList(int index, MainDataModelStruct value) {
    historyList.insert(index, value);
    prefs.setStringList(
        'ff_historyList', _historyList.map((x) => x.serialize()).toList());
  }

  List<BolgModelStruct> _BolgDataList = [
    BolgModelStruct.fromSerializableMap(jsonDecode(
        '{\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/84wxpcg29ejq/b1.png\",\"name\":\"How to scan barcode \\nin store\",\"desc\":\"Scanning barcodes in store involves observing the shape, size, and pattern of the barcodes. Look for distinctive features like quiet zones, toe count, and stride length to determine the product.\",\"time\":\"15 Jun 2026\"}')),
    BolgModelStruct.fromSerializableMap(jsonDecode(
        '{\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/zoh5emkree7c/b2.png\",\"name\":\"How ai accurately scans \\nbarcode \",\"desc\":\"To scan barcodes in store, examine the size and clarity of the print, the number of digits and any print damage. Patterns in the barcodes can reveal the product\'s format and speed, helping you recognize different product and their habits.\",\"time\":\"14 Jun 2026\"}')),
    BolgModelStruct.fromSerializableMap(jsonDecode(
        '{\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/khrpix1tmaoy/b3.png\",\"name\":\"The role of drones in monitoring endangered product\",\"desc\":\"Barcodes can be scanned by their unique formats, digit lengths, and quiet zones. Observing the spacing between prints and the depth can provide clues about the product\'s size and weight. \",\"time\":\"05 Sep 2026\"}')),
    BolgModelStruct.fromSerializableMap(jsonDecode(
        '{\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/ovbiluqpqacb/b4.png\",\"name\":\"Exploring nocturnal product through thermal imaging\",\"desc\":\"When scanning barcode, use a soft brush or stick to gently clear debris without damaging the print.\",\"time\":\"22 Aug 2026\"}'))
  ];
  List<BolgModelStruct> get BolgDataList => _BolgDataList;
  set BolgDataList(List<BolgModelStruct> value) {
    _BolgDataList = value;
  }

  void addToBolgDataList(BolgModelStruct value) {
    BolgDataList.add(value);
  }

  void removeFromBolgDataList(BolgModelStruct value) {
    BolgDataList.remove(value);
  }

  void removeAtIndexFromBolgDataList(int index) {
    BolgDataList.removeAt(index);
  }

  void updateBolgDataListAtIndex(
    int index,
    BolgModelStruct Function(BolgModelStruct) updateFn,
  ) {
    BolgDataList[index] = updateFn(_BolgDataList[index]);
  }

  void insertAtIndexInBolgDataList(int index, BolgModelStruct value) {
    BolgDataList.insert(index, value);
  }

  List<RecentiModelStruct> _RecentidentifierList = [
    RecentiModelStruct.fromSerializableMap(jsonDecode(
        '{\"img\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/s3x4s0kucx13/recent-1.png\",\"title\":\"Bengal Health & Beauty\",\"subtext\":\"SnackHub\",\"date\":\"08 Aug 2026\",\"barcode\":\"Barcode: 8901000001001\",\"time\":\"10:00 AM\",\"macth\":\"98% MATCH\"}')),
    RecentiModelStruct.fromSerializableMap(jsonDecode(
        '{\"img\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/ut9891q1ucaf/recent-2.png\",\"title\":\"Gray Electronics\",\"subtext\":\"DailyCare\",\"date\":\"06 Aug 2026\",\"barcode\":\"Barcode: 8902000002005\",\"time\":\"10:00 AM\",\"macth\":\"96% MATCH\"}')),
    RecentiModelStruct.fromSerializableMap(jsonDecode(
        '{\"img\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/k74psdemkra7/recent-3.png\",\"title\":\"Cape Pet Products\",\"subtext\":\"CocoaHouse\",\"date\":\"06 Aug 2026\",\"barcode\":\"Barcode: 8901000001002\",\"time\":\"05:55 PM\",\"macth\":\"96% MATCH\"}')),
    RecentiModelStruct.fromSerializableMap(jsonDecode(
        '{\"img\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/39v7pux7h1up/recent-4.png\",\"title\":\"Chimpanzee\",\"subtext\":\"GrainBox\",\"date\":\"06 Aug 2026\",\"barcode\":\"Barcode: 8901000001005\",\"time\":\"08:05 AM\",\"macth\":\"96% MATCH\"}')),
    RecentiModelStruct.fromSerializableMap(jsonDecode(
        '{\"img\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/nbnlik4h0xc5/recent-5.png\",\"title\":\"Snow Home & Lifestyle\",\"subtext\":\"GrainBox\",\"date\":\"27 Jun 2026\",\"barcode\":\"Barcode: 8905000005005\",\"time\":\"3:30 AM\",\"macth\":\"96% MATCH\"}')),
    RecentiModelStruct.fromSerializableMap(jsonDecode(
        '{\"img\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/u3u12iwanra4/recent-6.png\",\"title\":\"White-tailed Pet Products\",\"subtext\":\"Purina\",\"date\":\"26 Jun 2026\",\"barcode\":\"Barcode: 8904000004004\",\"time\":\"2:20 AM\",\"macth\":\"96% MATCH\"}'))
  ];
  List<RecentiModelStruct> get RecentidentifierList => _RecentidentifierList;
  set RecentidentifierList(List<RecentiModelStruct> value) {
    _RecentidentifierList = value;
  }

  void addToRecentidentifierList(RecentiModelStruct value) {
    RecentidentifierList.add(value);
  }

  void removeFromRecentidentifierList(RecentiModelStruct value) {
    RecentidentifierList.remove(value);
  }

  void removeAtIndexFromRecentidentifierList(int index) {
    RecentidentifierList.removeAt(index);
  }

  void updateRecentidentifierListAtIndex(
    int index,
    RecentiModelStruct Function(RecentiModelStruct) updateFn,
  ) {
    RecentidentifierList[index] = updateFn(_RecentidentifierList[index]);
  }

  void insertAtIndexInRecentidentifierList(
      int index, RecentiModelStruct value) {
    RecentidentifierList.insert(index, value);
  }

  List<CategorieModelStruct> _categorieDataList = [
    CategorieModelStruct.fromSerializableMap(jsonDecode(
        '{\"name\":\"Food & \\nBeverages\",\"img\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/oaeqzzlk41mn/categories-1.png\"}')),
    CategorieModelStruct.fromSerializableMap(jsonDecode(
        '{\"name\":\"Health & \\nBeauty\",\"img\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/p1691qdaucrq/categories-2.png\"}')),
    CategorieModelStruct.fromSerializableMap(jsonDecode(
        '{\"name\":\"Household \\nProducts\",\"img\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/kjetwzsj1wft/categories-3.png\"}')),
    CategorieModelStruct.fromSerializableMap(jsonDecode(
        '{\"name\":\"Electronics\",\"img\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/zh81at2pljb4/categories-4.png\"}')),
    CategorieModelStruct.fromSerializableMap(jsonDecode(
        '{\"name\":\"Fashion & \\nApparel\",\"img\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/03tffuilgcmx/categories-5.png\"}')),
    CategorieModelStruct.fromSerializableMap(jsonDecode(
        '{\"name\":\"Baby \\nProducts\",\"img\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/onjnw941wlry/categories-6.png\"}')),
    CategorieModelStruct.fromSerializableMap(jsonDecode(
        '{\"name\":\"Pet Products\",\"img\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/6ujbycsjqsws/categories-7.png\"}')),
    CategorieModelStruct.fromSerializableMap(jsonDecode(
        '{\"name\":\"Sports & \\nFitness\",\"img\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/9veu7bsqpchi/categories-8.png\"}')),
    CategorieModelStruct.fromSerializableMap(jsonDecode(
        '{\"name\":\"Toys & \\nGames\",\"img\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/nhz2kuclb2m9/categories-9.png\"}')),
    CategorieModelStruct.fromSerializableMap(jsonDecode(
        '{\"name\":\"Office & \\nStationery\",\"img\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/fj54ilgf1cdq/categories-10.png\"}')),
    CategorieModelStruct.fromSerializableMap(jsonDecode(
        '{\"name\":\"Automotive\",\"img\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/ie1p7n2xpy2a/categories-11.png\"}')),
    CategorieModelStruct.fromSerializableMap(jsonDecode(
        '{\"name\":\"Home & \\nLifestyle\",\"img\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/obqfdwk6wnxt/categories-12.png\"}'))
  ];
  List<CategorieModelStruct> get categorieDataList => _categorieDataList;
  set categorieDataList(List<CategorieModelStruct> value) {
    _categorieDataList = value;
  }

  void addToCategorieDataList(CategorieModelStruct value) {
    categorieDataList.add(value);
  }

  void removeFromCategorieDataList(CategorieModelStruct value) {
    categorieDataList.remove(value);
  }

  void removeAtIndexFromCategorieDataList(int index) {
    categorieDataList.removeAt(index);
  }

  void updateCategorieDataListAtIndex(
    int index,
    CategorieModelStruct Function(CategorieModelStruct) updateFn,
  ) {
    categorieDataList[index] = updateFn(_categorieDataList[index]);
  }

  void insertAtIndexInCategorieDataList(int index, CategorieModelStruct value) {
    categorieDataList.insert(index, value);
  }

  List<MainDataModelStruct> _MainDataList = [
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"0\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/swq2efgeuewo/sub_cat_1.png\",\"name\":\"Dog Food\",\"categorieName\":\"[\\\"Food & Beverages\\\",\\\"Baby Products\\\"]\",\"Trendingnow\":\"true\",\"subName\":\"Pedigree\",\"Barcode\":\"Barcode: 8901000001000\",\"date\":\"08 Aug 2026\",\"time\":\"09:30 AM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"1\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/h3bg209ac5qc/sub_cat_2.png\",\"name\":\"Cat Food\",\"categorieName\":\"[\\\"Food & Beverages\\\",\\\"Baby Products\\\"]\",\"subName\":\"Whiskas\",\"Barcode\":\"Barcode: 8901000001001\",\"date\":\"09 Aug 2026\",\"time\":\"10:00 AM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"2\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/is0d5l461k8m/sub_cat_3.png\",\"name\":\"Biscuits\",\"categorieName\":\"[\\\"Food & Beverages\\\"]\",\"Popularfootprint\":\"true\",\"subName\":\"Britannia\",\"Barcode\":\"Barcode: 8901000001002\",\"date\":\"10 Aug 2026\",\"time\":\"11:15 AM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"3\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/wp0xi02sqz9v/sub_cat_4.png\",\"name\":\"Pet Toys\",\"categorieName\":\"[\\\"Food & Beverages\\\",\\\"Baby Products\\\"]\",\"subName\":\"PetPlay\",\"Barcode\":\"Barcode: 8901000001003\",\"date\":\"07 Aug 2026\",\"time\":\"12:45 PM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"4\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/cgo57h8kr1zt/sub_cat_5.png\",\"name\":\"Baby Shampoo\",\"categorieName\":\"[\\\"Food & Beverages\\\",\\\"Baby Products\\\"]\",\"subName\":\"Johnson\'s Baby\",\"Barcode\":\"Barcode: 8901000001004\",\"date\":\"06 Aug 2026\",\"time\":\"02:15 PM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"5\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/veb9128gtxzg/sub_cat_6.png\",\"name\":\"Paper Products\",\"categorieName\":\"[\\\"Food & Beverages\\\",\\\"Baby Products\\\"]\",\"subName\":\"Origami\",\"Barcode\":\"Barcode: 8901000001005\",\"date\":\"05 Aug 2026\",\"time\":\"03:30 PM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"6\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/54fiu7owuqd2/sub_cat_7.png\",\"name\":\"Coca-Cola Original\",\"categorieName\":\"[\\\"Food & Beverages\\\"]\",\"Popularfootprint\":\"true\",\"subName\":\"Coca-Cola\",\"Barcode\":\"Barcode: 8901000001006\",\"date\":\"04 Aug 2026\",\"time\":\"04:00 PM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"7\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/gutu6p28ctmu/sub_cat_8.png\",\"name\":\"Maggi 2-Minute Noodles\",\"categorieName\":\"[\\\"Food & Beverages\\\",\\\"Food & Beverages\\\"]\",\"subName\":\"Nestlé\",\"Barcode\":\"Barcode: 8901000001007\",\"date\":\"03 Aug 2026\",\"time\":\"05:20 PM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"8\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/f5mz4qhckhz0/sub_cat_9.png\",\"name\":\"Amul Butter\",\"categorieName\":\"[\\\"Health & Beauty\\\",\\\"Food & Beverages\\\"]\",\"Trendingnow\":\"true\",\"subName\":\"Amul\",\"Barcode\":\"Barcode: 8901000001008\",\"date\":\"02 Aug 2026\",\"time\":\"06:10 PM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"9\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/tdo95pq5ywzv/sub_cat_10.png\",\"name\":\"Parle-G Biscuits\",\"categorieName\":\"[\\\"Health & Beauty\\\",\\\"Food & Beverages\\\"]\",\"subName\":\"Parle\",\"Barcode\":\"Barcode: 8901000001009\",\"date\":\"01 Aug 2026\",\"time\":\"07:45 PM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"10\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/4as9xydldp9h/sub_cat_11.png\",\"name\":\"Lay\'s Classic Chips\",\"categorieName\":\"[\\\"Health & Beauty\\\"]\",\"Trendingnow\":\"true\",\"subName\":\"Lay\'s\",\"Barcode\":\"Barcode: 8901000001010\",\"date\":\"31 Jul 2026\",\"time\":\"08:30 AM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"11\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/3oxorhkmymj1/sub_cat_12.png\",\"name\":\"Dove Beauty Bar\",\"categorieName\":\"[\\\"Health & Beauty\\\",\\\"Food & Beverages\\\"]\",\"subName\":\"Dove\",\"Barcode\":\"Barcode: 8901000001011\",\"date\":\"30 Jul 2026\",\"time\":\"01:00 PM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"12\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/etyuba5v5ffb/sub_cat_13.png\",\"name\":\"Red Bull Energy Drink\",\"categorieName\":\"[\\\"Health & Beauty\\\",\\\"Food & Beverages\\\"]\",\"Popularfootprint\":\"true\",\"subName\":\"Red Bull\",\"Barcode\":\"Barcode: 8901000001012\",\"date\":\"08 Aug 2026\",\"time\":\"09:30 AM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"13\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/gni9izlndely/sub_cat_14.png\",\"name\":\"Monster Energy\",\"categorieName\":\"[\\\"Health & Beauty\\\",\\\"Food & Beverages\\\"]\",\"subName\":\"Monster\",\"Barcode\":\"Barcode: 8901000001013\",\"date\":\"09 Aug 2026\",\"time\":\"10:00 AM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"14\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/num3hg63h524/sub_cat_15.png\",\"name\":\"Sting Energy Drink\",\"categorieName\":\"[\\\"Health & Beauty\\\",\\\"Health & Beauty\\\"]\",\"Trendingnow\":\"true\",\"subName\":\"Sting\",\"Barcode\":\"Barcode: 8901000001014\",\"date\":\"10 Aug 2026\",\"time\":\"11:15 AM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"15\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/dkryo6nzcwca/sub_cat_16.png\",\"name\":\"Gatorade Energy Drink\",\"categorieName\":\"[\\\"Health & Beauty\\\",\\\"Health & Beauty\\\"]\",\"subName\":\"Gatorade\",\"Barcode\":\"Barcode: 8901000001015\",\"date\":\"07 Aug 2026\",\"time\":\"12:45 PM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"16\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/fjgvmofvtu8s/sub_cat_17.png\",\"name\":\"Hell Energy Drink\",\"categorieName\":\"[\\\"Household Products\\\",\\\"Health & Beauty\\\"]\",\"Popularfootprint\":\"true\",\"Trendingnow\":\"false\",\"subName\":\"Hell Energy\",\"Barcode\":\"Barcode: 8901000001016\",\"date\":\"06 Aug 2026\",\"time\":\"02:15 PM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"17\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/4hvbklae8qxi/sub_cat_18.png\",\"name\":\"Snacks\",\"categorieName\":\"[\\\"Household Products\\\",\\\"Health & Beauty\\\"]\",\"Popularfootprint\":\"true\",\"Trendingnow\":\"false\",\"subName\":\"SnackHub\",\"Barcode\":\"Barcode: 8901000001017\",\"date\":\"05 Aug 2026\",\"time\":\"03:30 PM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"18\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/yw9vbjxy7nw8/sub_cat_19.png\",\"name\":\"Chocolates\",\"categorieName\":\"[\\\"Household Products\\\"]\",\"Popularfootprint\":\"false\",\"Trendingnow\":\"false\",\"subName\":\"Cadbury\",\"Barcode\":\"Barcode: 8901000001018\",\"date\":\"04 Aug 2026\",\"time\":\"04:00 PM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"19\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/zxdseiqu9uzt/sub_cat_41.png\",\"name\":\"Personal Care\",\"categorieName\":\"[\\\"Household Products\\\",\\\"Health & Beauty\\\",\\\"Household Products\\\"]\",\"Popularfootprint\":\"false\",\"Trendingnow\":\"true\",\"subName\":\"Nivea\",\"Barcode\":\"Barcode: 8901000001019\",\"date\":\"03 Aug 2026\",\"time\":\"05:20 PM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"20\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/ifq88ryhd41l/sub_cat_21.png\",\"name\":\"Cereals\",\"categorieName\":\"[\\\"Household Products\\\"]\",\"Popularfootprint\":\"false\",\"Trendingnow\":\"false\",\"subName\":\"Kellogg\'s\",\"Barcode\":\"Barcode: 8901000001020\",\"date\":\"02 Aug 2026\",\"time\":\"06:10 PM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"21\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/hxlxno4wxdwe/sub_cat_22.png\",\"name\":\"Baby Powder\",\"categorieName\":\"[\\\"Household Products\\\",\\\"Health & Beauty\\\"]\",\"Popularfootprint\":\"false\",\"Trendingnow\":\"false\",\"subName\":\"Himalaya\",\"Barcode\":\"Barcode: 8901000001021\",\"date\":\"01 Aug 2026\",\"time\":\"07:45 PM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"22\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/lg7iranvfco0/sub_cat_23.png\",\"name\":\"Baby Diapers\",\"categorieName\":\"[\\\"Household Products\\\",\\\"Household Products\\\"]\",\"Popularfootprint\":\"false\",\"Trendingnow\":\"false\",\"subName\":\"Pampers\",\"Barcode\":\"Barcode: 8901000001022\",\"date\":\"31 Jul 2026\",\"time\":\"08:30 AM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"23\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/8sb5mqb4zu5i/sub_cat_24.png\",\"name\":\"Baby Wipes\",\"categorieName\":\"[\\\"Household Products\\\",\\\"Household Products\\\"]\",\"Popularfootprint\":\"true\",\"Trendingnow\":\"false\",\"subName\":\"Huggies\",\"Barcode\":\"Barcode: 8901000001023\",\"date\":\"30 Jul 2026\",\"time\":\"01:00 PM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"26\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/ehklz38vsadx/sub_cat_25.png\",\"name\":\"Baby Lotion\",\"categorieName\":\"[\\\"Electronics\\\"]\",\"Popularfootprint\":\"false\",\"Trendingnow\":\"false\",\"subName\":\"Sebamed\",\"Barcode\":\"Barcode: 8901000001026\",\"date\":\"10 Aug 2026\",\"time\":\"11:15 AM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"27\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/dt1dmoucbopb/sub_cat_26.png\",\"name\":\"Baby Feeding Bottle\",\"categorieName\":\"[\\\"Electronics\\\",\\\"Electronics\\\"]\",\"Popularfootprint\":\"false\",\"Trendingnow\":\"true\",\"subName\":\"Philips Avent\",\"Barcode\":\"Barcode: 8901000001027\",\"date\":\"07 Aug 2026\",\"time\":\"12:45 PM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"28\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/ittllbtzbpu8/sub_cat_27.png\",\"name\":\"Pet Treats\",\"categorieName\":\"[\\\"Electronics\\\"]\",\"Popularfootprint\":\"true\",\"Trendingnow\":\"false\",\"subName\":\"Drools\",\"Barcode\":\"Barcode: 8901000001028\",\"date\":\"06 Aug 2026\",\"time\":\"02:15 PM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"29\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/0uvyh6qn8j07/sub_cat_28.png\",\"name\":\"Pet Grooming\",\"categorieName\":\"[\\\"Electronics\\\"]\",\"Popularfootprint\":\"false\",\"Trendingnow\":\"false\",\"subName\":\"Wahl\",\"Barcode\":\"Barcode: 8901000001029\",\"date\":\"05 Aug 2026\",\"time\":\"03:30 PM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"30\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/2072x5mbvosu/sub_cat_29.png\",\"name\":\"Pet Accessories\",\"categorieName\":\"[\\\"Electronics\\\",\\\"Electronics\\\",\\\"Fashion & Apparel\\\"]\",\"Popularfootprint\":\"false\",\"Trendingnow\":\"true\",\"subName\":\"Trixie\",\"Barcode\":\"Barcode: 8901000001030\",\"date\":\"04 Aug 2026\",\"time\":\"04:00 PM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"31\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/7pwhxjs34bfn/sub_cat_30.png\",\"name\":\"Cleaning\",\"categorieName\":\"[\\\"Electronics\\\",\\\"Electronics\\\",\\\"Fashion & Apparel\\\"]\",\"Popularfootprint\":\"false\",\"Trendingnow\":\"false\",\"subName\":\"Domex\",\"Barcode\":\"Barcode: 8901000001031\",\"date\":\"03 Aug 2026\",\"time\":\"05:20 PM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"32\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/8648eftiie87/sub_cat_31.png\",\"name\":\"Laundry\",\"categorieName\":\"[\\\"Electronics\\\",\\\"Electronics\\\"]\",\"Popularfootprint\":\"true\",\"Trendingnow\":\"false\",\"subName\":\"Surf Excel\",\"Barcode\":\"Barcode: 8901000001032\",\"date\":\"02 Aug 2026\",\"time\":\"06:10 PM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"33\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/4r4v5aprc3tr/sub_cat_32.png\",\"name\":\"Kitchen Care\",\"categorieName\":\"[\\\"Electronics\\\",\\\"Fashion & Apparel\\\"]\",\"Popularfootprint\":\"false\",\"Trendingnow\":\"true\",\"subName\":\"Vim\",\"Barcode\":\"Barcode: 8901000001033\",\"date\":\"01 Aug 2026\",\"time\":\"07:45 PM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"34\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/61kf3nq02yio/sub_cat_33.png\",\"name\":\"Air Fresheners\",\"categorieName\":\"[\\\"Baby Products\\\"]\",\"Popularfootprint\":\"false\",\"Trendingnow\":\"false\",\"subName\":\"Ambi Pur\",\"Barcode\":\"Barcode: 8901000001034\",\"date\":\"31 Jul 2026\",\"time\":\"08:30 AM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"35\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/bop5sl517b6w/sub_cat_34.png\",\"name\":\"Storage\",\"categorieName\":\"[\\\"Fashion & Apparel\\\"]\",\"Popularfootprint\":\"false\",\"Trendingnow\":\"false\",\"subName\":\"Tupperware\",\"Barcode\":\"Barcode: 8901000001035\",\"date\":\"30 Jul 2026\",\"time\":\"01:00 PM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"36\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/setnvm2jea26/sub_cat_35.png\",\"name\":\"Skincare\",\"categorieName\":\"[\\\"Fashion & Apparel\\\"]\",\"Popularfootprint\":\"true\",\"Trendingnow\":\"false\",\"subName\":\"Cetaphil\",\"Barcode\":\"Barcode: 8901000001036\",\"date\":\"08 Aug 2026\",\"time\":\"09:30 AM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"37\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/t9yfhyqqcq9r/sub_cat_36.png\",\"name\":\"Haircare\",\"categorieName\":\"[\\\"Fashion & Apparel\\\"]\",\"Popularfootprint\":\"false\",\"Trendingnow\":\"true\",\"subName\":\"Head & Shoulders\",\"Barcode\":\"Barcode: 8901000001037\",\"date\":\"09 Aug 2026\",\"time\":\"10:00 AM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"38\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/cvsjddc99rmg/sub_cat_37.png\",\"name\":\"Makeup\",\"categorieName\":\"[\\\"Fashion & Apparel\\\"]\",\"Popularfootprint\":\"false\",\"Trendingnow\":\"false\",\"subName\":\"Maybelline\",\"Barcode\":\"Barcode: 8901000001038\",\"date\":\"10 Aug 2026\",\"time\":\"11:15 AM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"39\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/1yuo5469t7ss/sub_cat_38.png\",\"name\":\"Oral Care\",\"categorieName\":\"[\\\"Fashion & Apparel\\\"]\",\"Popularfootprint\":\"false\",\"Trendingnow\":\"false\",\"subName\":\"Colgate\",\"Barcode\":\"Barcode: 8901000001039\",\"date\":\"07 Aug 2026\",\"time\":\"12:45 PM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"40\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/1m4acma1zyc7/sub_cat_39.png\",\"name\":\"Fragrances\",\"categorieName\":\"[\\\"Fashion & Apparel\\\"]\",\"Popularfootprint\":\"true\",\"Trendingnow\":\"false\",\"subName\":\"Park Avenue\",\"Barcode\":\"Barcode: 8901000001040\",\"date\":\"06 Aug 2026\",\"time\":\"02:15 PM\"}')),
    MainDataModelStruct.fromSerializableMap(jsonDecode(
        '{\"id\":\"41\",\"image\":\"https://storage.googleapis.com/flutterflow-io-6f20.appspot.com/projects/a-i-barcode-identifier-app-ahbvz7/assets/r3s68v2c5b1y/sub_cat_40.png\",\"name\":\"Beverages\",\"categorieName\":\"[\\\"Fashion & Apparel\\\",\\\"Fashion & Apparel\\\"]\",\"Popularfootprint\":\"false\",\"Trendingnow\":\"true\",\"subName\":\"Real Fruit\",\"Barcode\":\"Barcode: 8901000001041\",\"date\":\"05 Aug 2026\",\"time\":\"03:30 PM\"}'))
  ];
  List<MainDataModelStruct> get MainDataList => _MainDataList;
  set MainDataList(List<MainDataModelStruct> value) {
    _MainDataList = value;
  }

  void addToMainDataList(MainDataModelStruct value) {
    MainDataList.add(value);
  }

  void removeFromMainDataList(MainDataModelStruct value) {
    MainDataList.remove(value);
  }

  void removeAtIndexFromMainDataList(int index) {
    MainDataList.removeAt(index);
  }

  void updateMainDataListAtIndex(
    int index,
    MainDataModelStruct Function(MainDataModelStruct) updateFn,
  ) {
    MainDataList[index] = updateFn(_MainDataList[index]);
  }

  void insertAtIndexInMainDataList(int index, MainDataModelStruct value) {
    MainDataList.insert(index, value);
  }

  String _selectExplore = 'All';
  String get selectExplore => _selectExplore;
  set selectExplore(String value) {
    _selectExplore = value;
  }

  bool _isSpeaking = false;
  bool get isSpeaking => _isSpeaking;
  set isSpeaking(bool value) {
    _isSpeaking = value;
  }

  /// App state lastScanRef
  DocumentReference? _lastScanRef;
  DocumentReference? get lastScanRef => _lastScanRef;
  set lastScanRef(DocumentReference? value) {
    _lastScanRef = value;
  }
}

void _safeInit(Function() initializeField) {
  try {
    initializeField();
  } catch (_) {}
}

Future _safeInitAsync(Function() initializeField) async {
  try {
    await initializeField();
  } catch (_) {}
}
