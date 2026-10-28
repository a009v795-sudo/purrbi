@Page(route: '/')
class EditProfilePage {
  String phone;
  String code;
  onLoad() {
    SetState.batch([
      phone =
          (appState.userDetail.phoneNumber.isSet &&
                  constants.emptyString != appState.userDetail.phoneNumber)
              ? appState.userDetail.phoneNumber
              : constants.emptyString,
      code =
          (appState.userDetail.countryCode.isSet &&
                  constants.emptyString != appState.userDetail.countryCode)
              ? appState.userDetail.countryCode
              : constants.emptyString,
    ]);
  }

  build() => Scaffold(
    body: Container(
      child: Container(
        child: Container(
          child: Column(
            children: [
              MainAppbar(
                title: 'Edit profile',
                isBack: false,
                isEdit: false,
                isShare: false,
              ),
              Expanded(
                Form(
                  child: ListView(
                    children: [
                      Row(
                        children: [
                          Stack(
                            children: [
                              CircleImage(
                                'projects/a-i-tattoo-generator-app-5wmwuy/assets/g7lqpde7r00q/user_image_at.png',
                                isNetwork: false,
                                fit: ImageFit.contain,
                                width: 108,
                              ),
                              Container(
                                child: Icon(
                                  'camera_alt_outlined',
                                  size: 20,
                                  color: Color(0xFF000000),
                                ),
                                color: Color(0xFFFFFFFF),
                                width: 34,
                                alignment: Alignment.center,
                                boxShape: BoxShape.circle,
                                onTap: () {
                                  UploadData(
                                    actionName: 'UploadData_dr6',
                                    maxWidth: 108,
                                    maxHeight: 108,
                                    showSnackBar: false,
                                    key: '35telual',
                                  );
                                },
                              ),
                            ],
                            alignment: Alignment.bottomRight,
                          ),
                        ],
                        mainAxis: MainAxis.center,
                        padding: EdgeInsets.only(bottom: 30),
                      ),
                      Text(
                        'First name',
                        style: bodyMedium,
                        textAlign: TextAlign.start,
                        lineHeight: 1.46,
                        fontSize: 15,
                        fontWeight: FontWeight.w400,
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          right: Constant('mainPadding'),
                        ),
                      ),
                      TextField(
                        hint: 'Enter first name',
                        maxLines: 1,
                        initialText: appState.userDetail.firstName,
                        style: bodyMedium,
                        fontSize: 17,
                        lineHeight: 1,
                        hintStyle: labelMedium,
                        hintColor: secondaryText,
                        hintFontSize: 17,
                        hintFontWeight: FontWeight.w400,
                        hintLineHeight: 1,
                        errorStyle: bodyMedium,
                        errorColor: error,
                        errorFontSize: 15,
                        errorLineHeight: 1,
                        borderColor: borderColor,
                        borderRadius: 12,
                        focusBorderColor: primary,
                        errorBorderColor: error,
                        fillColor: buttonBg,
                        contentPadding: EdgeInsets.only(
                          left: 16,
                          top: 15,
                          right: 16,
                          bottom: 15,
                        ),
                        cursorColor: primaryText,
                        capitalization: Capitalization.sentences,
                        submitType: SubmitType.next,
                        width: double.infinity,
                        setStateOnChanged: true,
                        debounceTime: 100,
                        required: true,
                        requiredMessage: 'Please enter first name',
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          top: 8,
                          right: Constant('mainPadding'),
                          bottom: 16,
                        ),
                      ),
                      Text(
                        'Last name',
                        style: bodyMedium,
                        textAlign: TextAlign.start,
                        lineHeight: 1.46,
                        fontSize: 15,
                        fontWeight: FontWeight.w400,
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          right: Constant('mainPadding'),
                        ),
                      ),
                      TextField(
                        hint: 'Enter last name',
                        maxLines: 1,
                        initialText: appState.userDetail.lastName,
                        style: bodyMedium,
                        fontSize: 17,
                        lineHeight: 1,
                        hintStyle: labelMedium,
                        hintColor: secondaryText,
                        hintFontSize: 17,
                        hintFontWeight: FontWeight.w400,
                        hintLineHeight: 1,
                        errorStyle: bodyMedium,
                        errorColor: error,
                        errorFontSize: 15,
                        errorLineHeight: 1,
                        borderColor: borderColor,
                        borderRadius: 12,
                        focusBorderColor: primary,
                        errorBorderColor: error,
                        fillColor: buttonBg,
                        contentPadding: EdgeInsets.only(
                          left: 16,
                          top: 15,
                          right: 16,
                          bottom: 15,
                        ),
                        cursorColor: primaryText,
                        capitalization: Capitalization.sentences,
                        submitType: SubmitType.next,
                        width: double.infinity,
                        setStateOnChanged: true,
                        debounceTime: 100,
                        required: true,
                        requiredMessage: 'Please enter last name',
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          top: 8,
                          right: Constant('mainPadding'),
                          bottom: 16,
                        ),
                      ),
                      Text(
                        'Username',
                        style: bodyMedium,
                        color: secondaryText,
                        textAlign: TextAlign.start,
                        lineHeight: 1.46,
                        fontSize: 15,
                        fontWeight: FontWeight.w400,
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          right: Constant('mainPadding'),
                        ),
                      ),
                      Container(
                        padding: EdgeInsets.all(16),
                        child: Text(
                          appState.userDetail.userName,
                          style: bodyMedium,
                          color: secondaryText,
                          maxLines: 1,
                          textAlign: TextAlign.start,
                          overflow: TextOverflow.ellipsis,
                          lineHeight: 1.2,
                          fontSize: 17,
                          fontWeight: FontWeight.w400,
                        ),
                        color: primaryLightColor,
                        borderRadius: 12,
                        borderColor: borderColor,
                        borderWidth: 1,
                        width: double.infinity,
                        margin: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          top: 8,
                          right: Constant('mainPadding'),
                          bottom: 16,
                        ),
                      ),
                      Text(
                        'Email address',
                        style: bodyMedium,
                        color: secondaryText,
                        textAlign: TextAlign.start,
                        lineHeight: 1.46,
                        fontSize: 15,
                        fontWeight: FontWeight.w400,
                        padding: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          right: Constant('mainPadding'),
                        ),
                      ),
                      Container(
                        padding: EdgeInsets.all(16),
                        child: Text(
                          appState.userDetail.email,
                          style: bodyMedium,
                          color: secondaryText,
                          maxLines: 1,
                          textAlign: TextAlign.start,
                          overflow: TextOverflow.ellipsis,
                          lineHeight: 1.2,
                          fontSize: 17,
                          fontWeight: FontWeight.w400,
                        ),
                        color: primaryLightColor,
                        borderRadius: 12,
                        borderColor: borderColor,
                        borderWidth: 1,
                        width: double.infinity,
                        margin: EdgeInsets.only(
                          left: Constant('mainPadding'),
                          top: 8,
                          right: Constant('mainPadding'),
                          bottom: 16,
                        ),
                      ),
                    ],
                    primary: true,
                    startSpacing: 16,
                    endSpacing: 16,
                  ),
                ),
              ),
              Button(
                'Save',
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
                    ValidateForm('Form_ljgptjdc');
                    appState.userDetail
                      ..firstName = WidgetState('TextField_aya25xap').text
                      ..countryCode = code
                      ..phoneNumber = phone
                      ..lastName = WidgetState('TextField_hg66w765').text;
                    mainSanckbar(
                      title: 'Profile Updated Successfully',
                      shouldSetState: true,
                    );
                    context.safePop();
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
