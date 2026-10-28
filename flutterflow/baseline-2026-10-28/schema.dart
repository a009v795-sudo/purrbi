@Struct()
class IntroModel {
  ImagePath image;
  ImagePath darkImage;
  String title;
  String title2;
  String subTitle;
}

@Struct()
class LoginModel {
  String userName;
  String firstName;
  String lastName;
  String email;
  String countryCode;
  String phoneNumber;
  String password;
}

@Struct()
class NotificationsModel {
  String title;
  String subTitle;
  String createAt;
}

@Struct()
class ChatModel {
  String UserMessage;
  String responce;
}

@Struct()
class HelpSupportModel {
  String title;
  String description;
}

@Struct()
class MainChatModel {
  int id;
  String title;
  List<ChatModel> chatModelList;
}

@Struct()
class MainDataModel {
  int id;
  ImagePath image;
  String name;
  List<String> categorieName;
  bool Popularfootprint;
  bool Trendingnow;
  String subName;
  String Barcode;
  String date;
  String time;
}

@Struct()
class ChooseStyleModel {
  ImagePath image;
  String name;
}

@Struct()
class BolgModel {
  ImagePath image;
  String name;
  String desc;
  String time;
}

@Struct()
class RecentiModel {
  ImagePath img;
  String title;
  String subtext;
  String date;
  String barcode;
  String time;
  String macth;
}

@Struct()
class CategorieModel {
  String name;
  ImagePath img;
}

@AppState()
class appState {
  @persisted
  bool isIntro;
  @persisted
  bool isLogin;
  @persisted
  bool isPro;
  @persisted
  LoginModel userDetail = {
    "userName": "Baker Patrick",
    "firstName": "Baker",
    "lastName": "Patrick",
    "email": "bakerpatrick@watson.com",
    "countryCode": "+91",
    "phoneNumber": "9909999099",
    "password": "123456",
  };
  @persisted
  int modeIndex = 2;
  @persisted
  String packageName = 'com.mycompany.aiwatchidentifierapp';
  @persisted
  String appName = 'AI Barcode Scanner';
  bool connected = true;
  @persisted
  String deviceId;
  @persisted
  String currencyType = 'USD';
  List<IntroModel> introList = [];
  @persisted
  String countryName = 'IN';
  int homePageIndex = 0;
  @persisted
  List<String> searchList = [];
  List<NotificationsModel> notificationsList = [];
  @persisted
  String defTimeZoneName = 'America/Detroit';
  List<String> randomChat = [];
  List<ChatModel> messageList = [];
  List<HelpSupportModel> faqList = [];
  @persisted
  List<MainChatModel> mainChatModelList = [];
  @persisted
  List<MainDataModel> favouriteDataList = [];
  @persisted
  String androidRewardedAdsId = 'ca-app-pub-3940256099942544/5354046379';
  @persisted
  String iosRewardedAdsId = 'ca-app-pub-3940256099942544/6978759866';
  @persisted
  int isAdsTap = 0;
  @persisted
  List<MainDataModel> historyList = [];
  List<BolgModel> BolgDataList = [];
  List<RecentiModel> RecentidentifierList = [];
  List<CategorieModel> categorieDataList = [];
  List<MainDataModel> MainDataList = [];
  String selectExplore = 'All';
  bool isSpeaking;
}
