import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'dart:io';
import '../widgets/circulat_indicator_white.dart' as custom_widgets;

RewardedInterstitialAd? _rewardedInterstitialAd;
bool _isRewardedInterstitialLoading = false;

Future<bool> rewardedInterstitialAds(
  BuildContext context,
  Future Function() callback,
) async {
  if (_isRewardedInterstitialLoading) {
    debugPrint('Ad is already loading.');
    return false;
  }
  _isRewardedInterstitialLoading = true;
  bool success = false;

  // Show circular loading indicator while ad loads
  showDialog(
    context: context,
    barrierDismissible: false,
    builder: (context) {
      return Center(
        child: Container(
          width: 35,
          height: 35,
          child: custom_widgets.CirculatIndicatorWhite(
            width: 35,
            height: 35,
          ),
        ),
      );
    },
  );

  final String adUnitId = Platform.isAndroid
      ? FFAppState().androidRewardedAdsId
      : FFAppState().iosRewardedAdsId;

  try {
    await RewardedInterstitialAd.load(
      adUnitId: adUnitId,
      request: const AdRequest(),
      rewardedInterstitialAdLoadCallback: RewardedInterstitialAdLoadCallback(
        onAdLoaded: (RewardedInterstitialAd ad) {
          debugPrint('Rewarded Interstitial Ad Loaded.');
          Navigator.of(context, rootNavigator: true).pop(); // dismiss loader
          _rewardedInterstitialAd = ad;

          ad.fullScreenContentCallback = FullScreenContentCallback(
            onAdDismissedFullScreenContent: (RewardedInterstitialAd ad) async {
              debugPrint('Rewarded Interstitial Ad dismissed.');
              ad.dispose();
              _rewardedInterstitialAd = null;
              _isRewardedInterstitialLoading = false;
            },
            onAdFailedToShowFullScreenContent:
                (RewardedInterstitialAd ad, AdError error) {
              debugPrint('Failed to show rewarded interstitial ad: $error');
              ad.dispose();
              _rewardedInterstitialAd = null;
              _isRewardedInterstitialLoading = false;
            },
          );

          ad.show(
            onUserEarnedReward: (AdWithoutView ad, RewardItem reward) async {
              debugPrint("User earned reward: ${reward.amount} ${reward.type}");
              await callback();
            },
          );

          success = true;
        },
        onAdFailedToLoad: (LoadAdError error) {
          debugPrint('Rewarded Interstitial Ad failed to load: $error');
          Navigator.of(context, rootNavigator: true).pop(); // dismiss loader
          _rewardedInterstitialAd = null;
          _isRewardedInterstitialLoading = false;
        },
      ),
    );
  } catch (e) {
    debugPrint('Exception while loading rewarded interstitial: $e');
    Navigator.of(context, rootNavigator: true).pop(); // dismiss loader
    _isRewardedInterstitialLoading = false;
  }

  return success;
}