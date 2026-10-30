import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:page_transition/page_transition.dart';
import 'package:provider/provider.dart';
import '/backend/backend.dart';
import '/backend/schema/structs/index.dart';

import '/auth/base_auth_user_provider.dart';

import '/main.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/lat_lng.dart';
import '/flutter_flow/place.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'serialization_util.dart';

import '/index.dart';

export 'package:go_router/go_router.dart';
export 'serialization_util.dart';

const kTransitionInfoKey = '__transition_info__';

GlobalKey<NavigatorState> appNavigatorKey = GlobalKey<NavigatorState>();

class AppStateNotifier extends ChangeNotifier {
  AppStateNotifier._();

  static AppStateNotifier? _instance;
  static AppStateNotifier get instance => _instance ??= AppStateNotifier._();

  BaseAuthUser? initialUser;
  BaseAuthUser? user;
  bool showSplashImage = true;
  String? _redirectLocation;

  /// Determines whether the app will refresh and build again when a sign
  /// in or sign out happens. This is useful when the app is launched or
  /// on an unexpected logout. However, this must be turned off when we
  /// intend to sign in/out and then navigate or perform any actions after.
  /// Otherwise, this will trigger a refresh and interrupt the action(s).
  bool notifyOnAuthChange = true;

  bool get loading => user == null || showSplashImage;
  bool get loggedIn => user?.loggedIn ?? false;
  bool get initiallyLoggedIn => initialUser?.loggedIn ?? false;
  bool get shouldRedirect => loggedIn && _redirectLocation != null;

  String getRedirectLocation() => _redirectLocation!;
  bool hasRedirect() => _redirectLocation != null;
  void setRedirectLocationIfUnset(String loc) => _redirectLocation ??= loc;
  void clearRedirectLocation() => _redirectLocation = null;

  /// Mark as not needing to notify on a sign in / out when we intend
  /// to perform subsequent actions (such as navigation) afterwards.
  void updateNotifyOnAuthChange(bool notify) => notifyOnAuthChange = notify;

  void update(BaseAuthUser newUser) {
    final shouldUpdate =
        user?.uid == null || newUser.uid == null || user?.uid != newUser.uid;
    initialUser ??= newUser;
    user = newUser;
    // Refresh the app on auth change unless explicitly marked otherwise.
    // No need to update unless the user has changed.
    if (notifyOnAuthChange && shouldUpdate) {
      notifyListeners();
    }
    // Once again mark the notifier as needing to update on auth change
    // (in order to catch sign in / out events).
    updateNotifyOnAuthChange(true);
  }

  void stopShowingSplashImage() {
    showSplashImage = false;
    notifyListeners();
  }
}

GoRouter createRouter(AppStateNotifier appStateNotifier) => GoRouter(
      initialLocation: '/',
      debugLogDiagnostics: true,
      refreshListenable: appStateNotifier,
      navigatorKey: appNavigatorKey,
      errorBuilder: (context, state) => appStateNotifier.loggedIn
          ? SplashPageWidget()
          : WelcomeScreenPageWidget(),
      routes: [
        FFRoute(
          name: '_initialize',
          path: '/',
          builder: (context, _) => appStateNotifier.loggedIn
              ? SplashPageWidget()
              : WelcomeScreenPageWidget(),
        ),
        FFRoute(
          name: OnboardingPageWidget.routeName,
          path: OnboardingPageWidget.routePath,
          builder: (context, params) => OnboardingPageWidget(),
        ),
        FFRoute(
          name: SignInPageWidget.routeName,
          path: SignInPageWidget.routePath,
          builder: (context, params) => SignInPageWidget(),
        ),
        FFRoute(
          name: SignUpPageWidget.routeName,
          path: SignUpPageWidget.routePath,
          builder: (context, params) => SignUpPageWidget(),
        ),
        FFRoute(
          name: HomeMainPageWidget.routeName,
          path: HomeMainPageWidget.routePath,
          requireAuth: true,
          builder: (context, params) => HomeMainPageWidget(),
        ),
        FFRoute(
          name: ForgotPasswordPageWidget.routeName,
          path: ForgotPasswordPageWidget.routePath,
          builder: (context, params) => ForgotPasswordPageWidget(),
        ),
        FFRoute(
          name: ForgotVerificationsPageWidget.routeName,
          path: ForgotVerificationsPageWidget.routePath,
          builder: (context, params) => ForgotVerificationsPageWidget(
            email: params.getParam(
              'email',
              ParamType.String,
            ),
          ),
        ),
        FFRoute(
          name: ResetPasswordPageWidget.routeName,
          path: ResetPasswordPageWidget.routePath,
          builder: (context, params) => ResetPasswordPageWidget(),
        ),
        FFRoute(
          name: ChangePasswordPageWidget.routeName,
          path: ChangePasswordPageWidget.routePath,
          builder: (context, params) => ChangePasswordPageWidget(),
        ),
        FFRoute(
          name: MyProfilePageWidget.routeName,
          path: MyProfilePageWidget.routePath,
          builder: (context, params) => MyProfilePageWidget(),
        ),
        FFRoute(
          name: EditProfilePageWidget.routeName,
          path: EditProfilePageWidget.routePath,
          builder: (context, params) => EditProfilePageWidget(),
        ),
        FFRoute(
          name: NotificationPageWidget.routeName,
          path: NotificationPageWidget.routePath,
          builder: (context, params) => NotificationPageWidget(),
        ),
        FFRoute(
          name: VerificationsPageWidget.routeName,
          path: VerificationsPageWidget.routePath,
          builder: (context, params) => VerificationsPageWidget(
            email: params.getParam(
              'email',
              ParamType.String,
            ),
          ),
        ),
        FFRoute(
          name: DemoPageWidget.routeName,
          path: DemoPageWidget.routePath,
          builder: (context, params) => DemoPageWidget(),
        ),
        FFRoute(
          name: FaqPageWidget.routeName,
          path: FaqPageWidget.routePath,
          builder: (context, params) => FaqPageWidget(),
        ),
        FFRoute(
          name: FavouritePageWidget.routeName,
          path: FavouritePageWidget.routePath,
          builder: (context, params) => FavouritePageWidget(),
        ),
        FFRoute(
          name: PaymentMethodPageWidget.routeName,
          path: PaymentMethodPageWidget.routePath,
          builder: (context, params) => PaymentMethodPageWidget(),
        ),
        FFRoute(
          name: SettingsPageWidget.routeName,
          path: SettingsPageWidget.routePath,
          builder: (context, params) => SettingsPageWidget(),
        ),
        FFRoute(
          name: MySubscriptionPageWidget.routeName,
          path: MySubscriptionPageWidget.routePath,
          builder: (context, params) => MySubscriptionPageWidget(),
        ),
        FFRoute(
          name: HelpSupportPageWidget.routeName,
          path: HelpSupportPageWidget.routePath,
          builder: (context, params) => HelpSupportPageWidget(),
        ),
        FFRoute(
          name: PaymentFailedPageWidget.routeName,
          path: PaymentFailedPageWidget.routePath,
          builder: (context, params) => PaymentFailedPageWidget(),
        ),
        FFRoute(
          name: SelectReasonPageWidget.routeName,
          path: SelectReasonPageWidget.routePath,
          builder: (context, params) => SelectReasonPageWidget(),
        ),
        FFRoute(
          name: DeleteAccountPageWidget.routeName,
          path: DeleteAccountPageWidget.routePath,
          builder: (context, params) => DeleteAccountPageWidget(),
        ),
        FFRoute(
          name: ResultPageWidget.routeName,
          path: ResultPageWidget.routePath,
          builder: (context, params) => ResultPageWidget(
            uplodImage: params.getParam(
              'uplodImage',
              ParamType.FFUploadedFile,
            ),
            title: params.getParam(
              'title',
              ParamType.String,
            ),
          ),
        ),
        FFRoute(
          name: ResultDetailsPageWidget.routeName,
          path: ResultDetailsPageWidget.routePath,
          builder: (context, params) => ResultDetailsPageWidget(
            images: params.getParam(
              'images',
              ParamType.String,
            ),
            title: params.getParam(
              'title',
              ParamType.String,
            ),
          ),
        ),
        FFRoute(
          name: HistorySaveDetailsPageWidget.routeName,
          path: HistorySaveDetailsPageWidget.routePath,
          builder: (context, params) => HistorySaveDetailsPageWidget(
            images: params.getParam(
              'images',
              ParamType.String,
            ),
            title: params.getParam(
              'title',
              ParamType.String,
            ),
          ),
        ),
        FFRoute(
          name: PhotoTipsPageWidget.routeName,
          path: PhotoTipsPageWidget.routePath,
          builder: (context, params) => PhotoTipsPageWidget(),
        ),
        FFRoute(
          name: RecentidentifierPageWidget.routeName,
          path: RecentidentifierPageWidget.routePath,
          builder: (context, params) => RecentidentifierPageWidget(),
        ),
        FFRoute(
          name: PopularfootprintPageWidget.routeName,
          path: PopularfootprintPageWidget.routePath,
          builder: (context, params) => PopularfootprintPageWidget(),
        ),
        FFRoute(
          name: TrendingnowPageWidget.routeName,
          path: TrendingnowPageWidget.routePath,
          builder: (context, params) => TrendingnowPageWidget(),
        ),
        FFRoute(
          name: CategopriePageWidget.routeName,
          path: CategopriePageWidget.routePath,
          builder: (context, params) => CategopriePageWidget(
            appbarName: params.getParam(
              'appbarName',
              ParamType.String,
            ),
          ),
        ),
        FFRoute(
          name: CategoprieListPageWidget.routeName,
          path: CategoprieListPageWidget.routePath,
          builder: (context, params) => CategoprieListPageWidget(),
        ),
        FFRoute(
          name: ChatPageWidget.routeName,
          path: ChatPageWidget.routePath,
          builder: (context, params) => ChatPageWidget(),
        ),
        FFRoute(
          name: BlogPageWidget.routeName,
          path: BlogPageWidget.routePath,
          builder: (context, params) => BlogPageWidget(),
        ),
        FFRoute(
          name: ReviewSummaryPageWidget.routeName,
          path: ReviewSummaryPageWidget.routePath,
          builder: (context, params) => ReviewSummaryPageWidget(
            paymentIndex: params.getParam(
              'paymentIndex',
              ParamType.int,
            ),
          ),
        ),
        FFRoute(
          name: PrivacyPolicyPageWidget.routeName,
          path: PrivacyPolicyPageWidget.routePath,
          builder: (context, params) => PrivacyPolicyPageWidget(),
        ),
        FFRoute(
          name: SearchPageWidget.routeName,
          path: SearchPageWidget.routePath,
          builder: (context, params) => SearchPageWidget(),
        ),
        FFRoute(
          name: IdentifierPageWidget.routeName,
          path: IdentifierPageWidget.routePath,
          requireAuth: true,
          builder: (context, params) => IdentifierPageWidget(),
        ),
        FFRoute(
          name: MySubscriptionDetailPageWidget.routeName,
          path: MySubscriptionDetailPageWidget.routePath,
          builder: (context, params) => MySubscriptionDetailPageWidget(),
        ),
        FFRoute(
          name: AboutUsPageWidget.routeName,
          path: AboutUsPageWidget.routePath,
          builder: (context, params) => AboutUsPageWidget(),
        ),
        FFRoute(
          name: PremiumPageWidget.routeName,
          path: PremiumPageWidget.routePath,
          builder: (context, params) => PremiumPageWidget(
            isEmpty: params.getParam(
              'isEmpty',
              ParamType.bool,
            ),
          ),
        ),
        FFRoute(
          name: MyEmptySubscriptionPageWidget.routeName,
          path: MyEmptySubscriptionPageWidget.routePath,
          builder: (context, params) => MyEmptySubscriptionPageWidget(),
        ),
        FFRoute(
          name: WelcomeScreenPageWidget.routeName,
          path: WelcomeScreenPageWidget.routePath,
          builder: (context, params) => WelcomeScreenPageWidget(),
        ),
        FFRoute(
          name: AIAssistantPageWidget.routeName,
          path: AIAssistantPageWidget.routePath,
          builder: (context, params) => AIAssistantPageWidget(),
        ),
        FFRoute(
          name: SplashPageWidget.routeName,
          path: SplashPageWidget.routePath,
          builder: (context, params) => SplashPageWidget(),
        ),
        FFRoute(
          name: TermsConditionPageWidget.routeName,
          path: TermsConditionPageWidget.routePath,
          builder: (context, params) => TermsConditionPageWidget(),
        ),
        FFRoute(
          name: SubscriptionCancelPageWidget.routeName,
          path: SubscriptionCancelPageWidget.routePath,
          builder: (context, params) => SubscriptionCancelPageWidget(),
        ),
        FFRoute(
          name: BlolgDetailPageWidget.routeName,
          path: BlolgDetailPageWidget.routePath,
          builder: (context, params) => BlolgDetailPageWidget(
            blogDetail: params.getParam(
              'blogDetail',
              ParamType.DataStruct,
              isList: false,
              structBuilder: BolgModelStruct.fromSerializableMap,
            ),
          ),
        ),
        FFRoute(
          name: AnalysisResultPageWidget.routeName,
          path: AnalysisResultPageWidget.routePath,
          builder: (context, params) => AnalysisResultPageWidget(
            imageUpload: params.getParam(
              'imageUpload',
              ParamType.FFUploadedFile,
            ),
            scanType: params.getParam(
              'scanType',
              ParamType.String,
            ),
          ),
        ),
        FFRoute(
          name: PetOnboardingPageWidget.routeName,
          path: PetOnboardingPageWidget.routePath,
          requireAuth: true,
          builder: (context, params) => PetOnboardingPageWidget(),
        ),
        FFRoute(
          name: ScanResultPageWidget.routeName,
          path: ScanResultPageWidget.routePath,
          requireAuth: true,
          builder: (context, params) => ScanResultPageWidget(
            scanRef: params.getParam(
              'scanRef',
              ParamType.DocumentReference,
              isList: false,
              collectionNamePath: ['users', 'scans'],
            ),
            scanId: params.getParam(
              'scanId',
              ParamType.String,
            ),
          ),
        )
      ].map((r) => r.toRoute(appStateNotifier)).toList(),
    );

extension NavParamExtensions on Map<String, String?> {
  Map<String, String> get withoutNulls => Map.fromEntries(
        entries
            .where((e) => e.value != null)
            .map((e) => MapEntry(e.key, e.value!)),
      );
}

extension NavigationExtensions on BuildContext {
  void goNamedAuth(
    String name,
    bool mounted, {
    Map<String, String> pathParameters = const <String, String>{},
    Map<String, String> queryParameters = const <String, String>{},
    Object? extra,
    bool ignoreRedirect = false,
  }) =>
      !mounted || GoRouter.of(this).shouldRedirect(ignoreRedirect)
          ? null
          : goNamed(
              name,
              pathParameters: pathParameters,
              queryParameters: queryParameters,
              extra: extra,
            );

  void pushNamedAuth(
    String name,
    bool mounted, {
    Map<String, String> pathParameters = const <String, String>{},
    Map<String, String> queryParameters = const <String, String>{},
    Object? extra,
    bool ignoreRedirect = false,
  }) =>
      !mounted || GoRouter.of(this).shouldRedirect(ignoreRedirect)
          ? null
          : pushNamed(
              name,
              pathParameters: pathParameters,
              queryParameters: queryParameters,
              extra: extra,
            );

  void safePop() {
    // If there is only one route on the stack, navigate to the initial
    // page instead of popping.
    if (canPop()) {
      pop();
    } else {
      go('/');
    }
  }
}

extension GoRouterExtensions on GoRouter {
  AppStateNotifier get appState => AppStateNotifier.instance;
  void prepareAuthEvent([bool ignoreRedirect = false]) =>
      appState.hasRedirect() && !ignoreRedirect
          ? null
          : appState.updateNotifyOnAuthChange(false);
  bool shouldRedirect(bool ignoreRedirect) =>
      !ignoreRedirect && appState.hasRedirect();
  void clearRedirectLocation() => appState.clearRedirectLocation();
  void setRedirectLocationIfUnset(String location) =>
      appState.updateNotifyOnAuthChange(false);
}

extension _GoRouterStateExtensions on GoRouterState {
  Map<String, dynamic> get extraMap =>
      extra != null ? extra as Map<String, dynamic> : {};
  Map<String, dynamic> get allParams => <String, dynamic>{}
    ..addAll(pathParameters)
    ..addAll(uri.queryParameters)
    ..addAll(extraMap);
  TransitionInfo get transitionInfo => extraMap.containsKey(kTransitionInfoKey)
      ? extraMap[kTransitionInfoKey] as TransitionInfo
      : TransitionInfo.appDefault();
}

class FFParameters {
  FFParameters(this.state, [this.asyncParams = const {}]);

  final GoRouterState state;
  final Map<String, Future<dynamic> Function(String)> asyncParams;

  Map<String, dynamic> futureParamValues = {};

  // Parameters are empty if the params map is empty or if the only parameter
  // present is the special extra parameter reserved for the transition info.
  bool get isEmpty =>
      state.allParams.isEmpty ||
      (state.allParams.length == 1 &&
          state.extraMap.containsKey(kTransitionInfoKey));
  bool isAsyncParam(MapEntry<String, dynamic> param) =>
      asyncParams.containsKey(param.key) && param.value is String;
  bool get hasFutures => state.allParams.entries.any(isAsyncParam);
  Future<bool> completeFutures() => Future.wait(
        state.allParams.entries.where(isAsyncParam).map(
          (param) async {
            final doc = await asyncParams[param.key]!(param.value)
                .onError((_, __) => null);
            if (doc != null) {
              futureParamValues[param.key] = doc;
              return true;
            }
            return false;
          },
        ),
      ).onError((_, __) => [false]).then((v) => v.every((e) => e));

  dynamic getParam<T>(
    String paramName,
    ParamType type, {
    bool isList = false,
    List<String>? collectionNamePath,
    StructBuilder<T>? structBuilder,
  }) {
    if (futureParamValues.containsKey(paramName)) {
      return futureParamValues[paramName];
    }
    if (!state.allParams.containsKey(paramName)) {
      return null;
    }
    final param = state.allParams[paramName];
    // Got parameter from `extras`, so just directly return it.
    if (param is! String) {
      return param;
    }
    // Return serialized value.
    return deserializeParam<T>(
      param,
      type,
      isList,
      collectionNamePath: collectionNamePath,
      structBuilder: structBuilder,
    );
  }
}

class FFRoute {
  const FFRoute({
    required this.name,
    required this.path,
    required this.builder,
    this.requireAuth = false,
    this.asyncParams = const {},
    this.routes = const [],
  });

  final String name;
  final String path;
  final bool requireAuth;
  final Map<String, Future<dynamic> Function(String)> asyncParams;
  final Widget Function(BuildContext, FFParameters) builder;
  final List<GoRoute> routes;

  GoRoute toRoute(AppStateNotifier appStateNotifier) => GoRoute(
        name: name,
        path: path,
        redirect: (context, state) {
          if (appStateNotifier.shouldRedirect) {
            final redirectLocation = appStateNotifier.getRedirectLocation();
            appStateNotifier.clearRedirectLocation();
            return redirectLocation;
          }

          if (requireAuth && !appStateNotifier.loggedIn) {
            appStateNotifier.setRedirectLocationIfUnset(state.uri.toString());
            return '/welcomeScreenPage';
          }
          return null;
        },
        pageBuilder: (context, state) {
          fixStatusBarOniOS16AndBelow(context);
          final ffParams = FFParameters(state, asyncParams);
          final page = ffParams.hasFutures
              ? FutureBuilder(
                  future: ffParams.completeFutures(),
                  builder: (context, _) => builder(context, ffParams),
                )
              : builder(context, ffParams);
          final child = appStateNotifier.loading
              ? Center(
                  child: SizedBox(
                    width: 40.0,
                    height: 40.0,
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(
                        FlutterFlowTheme.of(context).primary,
                      ),
                    ),
                  ),
                )
              : page;

          final transitionInfo = state.transitionInfo;
          return transitionInfo.hasTransition
              ? CustomTransitionPage(
                  key: state.pageKey,
                  name: state.name,
                  child: child,
                  transitionDuration: transitionInfo.duration,
                  transitionsBuilder:
                      (context, animation, secondaryAnimation, child) =>
                          PageTransition(
                    type: transitionInfo.transitionType,
                    duration: transitionInfo.duration,
                    reverseDuration: transitionInfo.duration,
                    alignment: transitionInfo.alignment,
                    curve: transitionInfo.transitionType ==
                            PageTransitionType.scale
                        ? const Interval(0.0, 0.5)
                        : Curves.linear,
                    child: child,
                  ).buildTransitions(
                    context,
                    animation,
                    secondaryAnimation,
                    child,
                  ),
                )
              : MaterialPage(
                  key: state.pageKey, name: state.name, child: child);
        },
        routes: routes,
      );
}

class TransitionInfo {
  const TransitionInfo({
    required this.hasTransition,
    this.transitionType = PageTransitionType.fade,
    this.duration = const Duration(milliseconds: 300),
    this.alignment,
  });

  final bool hasTransition;
  final PageTransitionType transitionType;
  final Duration duration;
  final Alignment? alignment;

  static TransitionInfo appDefault() => TransitionInfo(hasTransition: false);
}

class RootPageContext {
  const RootPageContext(this.isRootPage, [this.errorRoute]);
  final bool isRootPage;
  final String? errorRoute;

  static bool isInactiveRootPage(BuildContext context) {
    final rootPageContext = context.read<RootPageContext?>();
    final isRootPage = rootPageContext?.isRootPage ?? false;
    final location = GoRouterState.of(context).uri.toString();
    return isRootPage &&
        location != '/' &&
        location != rootPageContext?.errorRoute;
  }

  static Widget wrap(Widget child, {String? errorRoute}) => Provider.value(
        value: RootPageContext(true, errorRoute),
        child: child,
      );
}

extension GoRouterLocationExtension on GoRouter {
  String getCurrentLocation() {
    final RouteMatch lastMatch = routerDelegate.currentConfiguration.last;
    final RouteMatchList matchList = lastMatch is ImperativeRouteMatch
        ? lastMatch.matches
        : routerDelegate.currentConfiguration;
    return matchList.uri.toString();
  }
}
