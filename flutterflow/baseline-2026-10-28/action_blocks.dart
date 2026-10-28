// App-level action blocks. Call one from any action by name, e.g. internetSnackbar(...);
internetSnackbar() {
  mainSanckbar(title: 'Please turn on internet...');
}

mainSanckbar({String title}) {
  HideSnackBar();
  snackBar(
    title,
    durationMillis: 2000,
    backgroundColor: primaryText,
    color: whiteToBlackColor,
    fontSize: 17,
    textAlign: TextAlign.start,
    hidePrevious: true,
  );
}

AddOrRemoveIdentificationFavourite({MainDataModel data}) {
  if (appState.favouriteDataList.where((e) => e == data).isSet) {
    appState.favouriteDataList.remove(data);
    mainSanckbar(title: 'Removed from favourite', shouldSetState: true);
  } else {
    appState.favouriteDataList.add(data);
    mainSanckbar(title: 'Added to favourite', shouldSetState: true);
  }
}

DataClearBlock() {
  SetState.batch([
    appState.isLogin = false,
    appState.searchList.clear(),
    appState.favouriteDataList.clear(),
    appState.isPro = Unset(),
    appState.isAdsTap = 0,
  ]);
}
