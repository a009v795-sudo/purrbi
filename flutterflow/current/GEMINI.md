# FlutterFlow project as text

This folder is a FlutterFlow app as Dart-syntax files; `./fft push` applies your edits to the live project.

## Files

- `PROJECT.md`: map of pages, routes, parameters, components, action blocks, custom code, schema and theme.
- `pages/*.dart`, `components/*.dart`: one page or component per file, named after its class in snake_case (`AboutPage` → `pages/about_page.dart`).
- `schema.dart`, `theme.dart`, `settings.dart`, `api.dart`, `action_blocks.dart`, `translations/<code>.dart`, `tests.dart`, `tests/`, `custom_code/`: below; create a missing one. `agents.dart`: AI agents and their steps (`./fft vocab ai_agents`).
- `assets/`: files push uploads, used as `'assets/<name>'` (`Image('assets/logo.png', isNetwork: false)`; `./fft assets`). `native/`: Info.plist, AndroidManifest.xml, ... (`./fft native --help`). `supabase/functions/<name>/index.ts`: an Edge Function (`./fft vocab edge_functions`).
- Never read or edit `generated_code/` and `.fft/`.

## Workflow

1. Read `PROJECT.md` unless your context already has it (imported: @PROJECT.md ), then only the files you need.
2. Edit or create files. After each edit an automatic check reports problems (`path:line:col: error: ...`): fix them.
3. Push as you go, so the user watches the app take shape. After `theme.dart` and `api.dart` check clean, run `./fft push` BEFORE writing pages: it saves them so the user sees progress. Then push each new page's layout, with real labels, then its data, actions and states, one page per push. If some files have errors, `./fft push` still saves the clean ones and lists the rest with errors: fix them and push again (`--only <files>` pushes just those). `-m "<what the user will see>"` names the checkpoint in the user's panel: a few words, like "Login page layout". A single small change is one push.
4. Before your final reply, fix your last push's warnings and say plainly what is still a placeholder. Never re-add a removed field to pass a push: wire it or drop the read.

A selected widget (`[#n]`, `node_key:` in the prompt's Context): `./fft set <node_key> color=primary "text='Hi'"` edits, checks and pushes a property change; `./fft set <node_key>` prints its file:line.

`./fft status` lists your changes, `./fft activity` everyone's recent edits. Edit with the Edit tool. A push refreshes the files (read them again before editing) and lists each line stored in FlutterFlow's own form, `file:line: `written` → `stored``; a "not stored" line did not land: write it another way, or use `./fft raw`.

Edit in place: what a file doesn't show (widget keys, hidden settings) is kept, matched by widget name and position; a widget copied with exactly its pulled text keeps them. A new wrapper is a new widget even under an existing name: to look the same it needs all that widget's arguments, `Bound(...)` values included.

`./fft vocab` lists every widget, action, value form, trigger and setting; `./fft vocab <part>` the matching ones (`*`: required), `./fft vocab <note>` a syntax note (`lists`, `animations`, ...), `./fft vocab <Name>` one widget or action's arguments and the defaults a pull leaves out. A name marked `(legacy only)` is never pulled: write what its brackets name (`[alias: Blur]`, `[covered: x.toggle()]`). For API calls, run `./fft help api` first.

## Pages and components

Files are parsed, never compiled: no imports, constructors or `setState`. One `@Page` or `@Component` class per file; a page's root is `Scaffold(...)`. Reusable UI is a `@Component()` file, placed like a widget; a method is an action block, never a widget builder.

```dart page
@Page(route: '/notes')
class NotesPage {
  final String folderId; // page parameter; `final String? folderId;` is optional
  bool saving = false; // page state, with its default
  List<Note> notes; // a list starts empty
  onLoad() {
    notes = appState.notes;
  }
  build() => Scaffold(
    appBar: AppBar(title: Text('Notes')),
    body: ListView(
      source: notes,
      itemBuilder: (note) => NoteCard(title: note.text, onTap: () {
        context.push(NoteDetailPage(noteId: note.text));
      }),
    ),
  );
}

@Page(route: '/note')
class NoteDetailPage {
  final String noteId;
  build() => Scaffold(appBar: AppBar(title: Text('Note')), body: Text(noteId, style: titleMedium));
}

@Component()
class NoteCard {
  final String title; // component parameter
  bool open = false; // component state
  build() => Container(child: Text(title, maxLines: open ? 10 : 1), onTap: () {
    open = !open;
  });
}
```

- `@Page` takes `route:`, `initial: true` (the start page, taking the flag from another), `onlyAuthenticated: true`, `pageTitle:`. A page without `initial:` keeps its stored flag.
- Fields match by name: retyping one or changing its default keeps it and its reads; renaming replaces it.
- An instance passes the component's parameters by name, plus `visible:`, `padding:`, `name:` and triggers (`./fft vocab instances`). A callback parameter (pulled as `final UnsupportedAction onMore;`) is a closure, `SavedCard(onMore: () { ... })`, run inside the component with `ParamAction('onMore');`.
- A component's body sits in a root `Container(..., color: Color(0x00000000))`. A name that isn't an identifier (`pop-account`) is written as `PROJECT.md` shows it; a component named like a widget is `IconButtonComponent`.

## Widgets

Widgets have Flutter-like names. Every widget takes `visible:`, `name:`, `padding:` (outer), `opacity:`, `animations:` (`./fft vocab animations`), triggers and `outerAlignment:` (`Alignment.center` centres it in its place; `alignment:` places its children).

```dart widget
Column(
  children: [
    Text('Notes', style: titleLarge, color: primaryText, maxLines: 2),
    Row(children: [
      Expanded(TextField(name: 'searchInput', hint: 'Search', keyboard: Keyboard.email)),
      IconButton('add', size: 24, color: primary, onTap: () { context.push(NotesPage(folderId: 'inbox')); }),
    ], spacing: 8),
    Container(child: Text('Card'), padding: EdgeInsets.all(16), margin: EdgeInsets.only(top: 8), color: secondaryBackground, borderRadius: 12, width: double.infinity, height: 120),
    Button('Save', width: double.infinity, color: tertiary, textColor: primaryText, borderRadius: 20, disabled: saving, onTap: () { saving = true; }),
    Icon('home', size: 20, color: secondaryText),
  ],
  crossAxis: CrossAxis.start,
  mainAxis: MainAxis.center,
  spacing: 12,
)
```

- A Container's `padding:` is inside the box, `margin:` around it. `Column` and `Row` fill their axis (`minSize: MainAxisSize.min` shrinks one). `Expanded(child, flex: 2)` and `Flexible(child)` take the child first. `Toggle` is the Switch; `Stack`, `Wrap`, `PageView`, `TabBar`, `Slider`, `GenUiChat` (an AI chat showing your components: `./fft vocab genui`) and ~100 more: `./fft vocab`. Colors and text styles: `theme.dart` names (`./fft vocab theme`).
- Triggers are closures: `onTap:`, `onLongPress:`, gestures (the closure gets `details`), an input's `onChanged: (value) { ... }` (`./fft vocab trigger`). A swipe goes on the Row or Container spanning its area: `onHorizontalDragStart` saves `details.globalPosition.dx` in page state, `onHorizontalDragEnd` compares to it.

### Lists and queries

A list repeats its `itemBuilder` item (the builder's parameter) over `source:` (a list value) or a `query:`; `ListView(children: [...])` lists fixed widgets.

```dart widget
ListView(
  query: FirestoreQuery(tasks, where: [FirestoreWhere('done', '==', false)], orderBy: [FirestoreOrderBy('createdAt', descending: true)], limit: 20),
  itemBuilder: (task) => Row(children: [
    Checkbox(value: task.done, onChanged: (value) { FirestoreUpdate(task.ref, collection: tasks, fields: {'done': value}); }),
    Text(task.title),
  ]),
  spacing: 8,
)
```

`query:` also sits on a `Column`, `Container`, `GridView` or `Dropdown`, written as the action step: `FirestoreQuery(...)` (`singleDocument: true`: the first match), `FirestoreRead(tasks, ref)`, `PostgresQuery(athletes, query: PostgresQuerySpec(filters: [...], orderBys: [PostgresOrderBy('last_name')], limit: 10))` (`isSingleRow: true`: one row), an API call `GetUser(id: userId)` (a list: `source: ListPosts().dataStruct`). Under a single-result query, read it by repeating the query's text exactly. Counts come from `Count(FirestoreQuery(...))`, never a stored counter. `./fft vocab lists`: query options, caches, tabs, page views.

## Values

```dart widget
Column(
  children: [
    Text('Hi ${currentUser.displayName}, ${Count(tags)} tags'),
    Text(title ?? 'Untitled'), // fallback when null or empty
    Text((count > 3) ? 'Many' : 'Few', color: saving ? secondaryText : primaryText),
    Text(appState.displayName, visible: emailInput.text != '' && !saving),
    Text(DateFormat(globalProperties.currentTimestamp, 'yMMMd')),
    Text(NumberFormat(count, NumberStyle.decimal, decimals: 2)),
  ],
)
```

- Page parameters and state by name; `appState.x`; `item.field`, `item.ref`; inputs `emailInput.text`, `myToggle.value`; `currentUser.email`, `.uid`, `.ref`; `Priority.high`; `Constant('pageSize')`; `globalProperties.screenWidth`.
- Conditions: `== != < > <= >= ! && ||`, `x.isSet`, `(a) ? b : c`. Lists: `.first`, `.last`, `[i]`, `.where((e) => ...)`, `.map((e) => ...)`, `.sortedBy((e) => ...)`, `.take(n)`, `.contains(v)`, `Count(list)`.
- Custom functions by name: `nextWeek(selectedDate)`. Anything else (`count + 1`, `title.trim()`) is plain Dart, stored as code.
- A step's output by its `outputAs:` name: `found.title`, an API call's `user.dataStruct.email`, `user.succeeded`.
- An unnamed widget is its quoted key, `WidgetState('Switch_ab12').value`; one in a component instance its path, `WidgetState('loginForm/email').text`. `Unset()` is an empty value.
- `Bound('a1b2c3d4', 'hint')` is a stored value the text can't show: keep, move or replace it, or copy it to the same argument.
- `./fft vocab values` lists every form (also `conditions`, `globals`, `list_ops`, `json_api`, `values_sources`).

## Actions

An action closure runs its statements in order, each one FlutterFlow action. "Then" and "after" in the ask fix that order: check the chain against it step by step.

```dart actions
saving = true; // page state; app state: appState.notes.add(note)
count += 1; // also -= 1; ++ and -- store and print as += 1, -= 1
tags.add(emailInput.text);
notes.add(Note(text: title)); // a new struct
tags.removeAt(0);
showDone.toggle();
context.push(NoteDetailPage(noteId: noteId));
context.pop();
snackBar('Saved');
ShowDialog.message(title: 'Saved', message: 'All done', dismissText: 'OK');
ConfirmDialog(title: 'Delete?', message: 'This cannot be undone.', confirmText: 'Delete', dismissText: 'Cancel', onConfirm: () { tags.clear(); });
ShowBottomSheet(NoteCard(title: title));
ValidateForm('signupForm'); // stops the action when a field is invalid
UploadData(source: UploadSource.gallery, destination: UploadDestination.firebase, key: 'photo');
Parallel([() { count += 1; }, () { saving = false; }]);
greet(who: title, times: 2); // an action block
Logout();
if (count > 10) {
  return; // ends the action
} else if (emailInput.text == '') {
  snackBar('Enter an email');
} else {
  for (final item in appState.notes) {
    if (item.text == '') {
      break;
    }
    tags.add(item.text);
  }
}
```

`if / else if / else` is one conditional. A loop (`for`, `while`) names its variable `item` (`item2` nested), read only in its body. Data (`./fft vocab actions_database`); `outputAs: 'name'` names a result for later steps:

```dart actions
FirestoreCreate(tasks, fields: {'title': emailInput.text, 'done': false, 'createdAt': FieldValue.serverTimestamp()}, outputAs: 'created');
FirestoreUpdate(DocumentReferenceOf(created), collection: tasks, fields: {'done': true});
FirestoreQuery(tasks, where: [FirestoreWhere('done', '==', true)], singleTimeQuery: true, outputAs: 'doneTasks');
count = Count(doneTasks);
FirestoreDelete(DocumentReferenceOf(created));
PostgresQuery(athletes, query: PostgresQuerySpec(filters: [PostgresFilter('team_name', relation: PostgresFilterRelation.equalTo, value: title)]), outputAs: 'rows');
GetUser(id: currentUser.uid, outputAs: 'user');
Shop.AddItem(name: title, onSuccess: () { snackBar('Added'); }, onFailure: () { snackBar('Failed'); });
LoginEmailPassword(emailInput.text, passwordInput.text);
```

- Custom actions: `actions.sendInvite(email: title);`. Others without a typed form: `Actions.<name>(...)`, message arguments as calls (`StripeSinglePayment(amount: 10)`).
- An upload's results are `ActionResult.uploadUrl('photo')`, `ActionResult.uploadedFile('photo')` by its `key:`: push the upload step first.
- `unawaited(step);` doesn't wait. `Disabled(() { ... });` holds switched-off steps: unwrap them to run. A state update rebuilds the widget it runs in.
- `unsupported('...');` is a stored step the text can't show (`./fft vocab unsupported`): keep, delete or `./fft raw` it. `unsupported('action')` is blank: write the step there.

A page or component method is an action block scoped to it; a function in `action_blocks.dart` is app-level. Call one as a statement, its typed parameters by name. To move steps into a block, cut them (`unsupported(...)` lines too) and paste them into the method, where its parameters replace the page's of the same name. Delete the method to delete the block.

```dart action_blocks.dart
greet({String who, int times}) {
  snackBar('Hi $who');
  appState.displayName = who;
}
```

## Design

Design polishes what the task asks for and never changes it: keep the requested texts, labels, names, widget types, data sources and structure; add no sections or states. Follow `PROJECT.md`'s "Design conventions" if any; copy its pages.

- **Design first.** For a mockup, an HTML page or "make it look like", and for any brief that asks for a polished, beautiful or modern look, decide the design before the first page edit, as you would in CSS: page background, surface, accent and text colours, one Google font, 4 to 6 role text styles (display, title, body, caption, ...). Write them to `theme.dart` (a named colour each, a `TextStyle` per role, the font as `primaryFont`), then build with those names. Their look wins over the defaults below; "From a web design" maps CSS to widgets.
- **Dark designs.** The canvas, previews and light-mode phones show light values, whatever `darkMode` says. A dark design sets its own page background (`Scaffold(backgroundColor: night)`), a custom colour with the same light and dark value, and colours its surfaces and text the same way; it never relies on theme mode.
- **Spacing.** Pad the body 16 to 24 (`padding: EdgeInsets.all(16)` on its Column). `spacing:` 8 in a card or row, 12 between fields, 16 to 24 between sections.
- **Type and colour.** Theme names only, no `fontSize:`, `fontWeight:` or `Color(0x...)` in a page: add a missing one to `theme.dart`. Plain briefs use the defaults: `headlineSmall` body title, `titleMedium` section and card titles, `bodyMedium` text, `secondaryText` captions, `error` errors.
- **Hierarchy.** One title: the AppBar's or one atop the body, never both. A header names each section; a card (`secondaryBackground` Container, radius 12, padding 16) groups content; a list row starts with an `Icon`.
- **Forms.** Every field has a `label:`; `hint:` only shows an example. Fields go in a Column of their own, in a `Form` with validation messages, checked by `ValidateForm` first. A Dropdown has a `hint:` or an initial `value:`. The save writes every input shown, chips, dropdowns and toggles too: check each before you push. The main button is full width, 48 to 56 high.
- **States.** Don't change how a page loads its data to show states. A list of one collection keeps its own `query:` (a search hides rows with `visible:`), never a page-state copy; only a list filtered by another record's field loads in `onLoad`, reading that field from the read's output. Its empty message is a component in its `empty:` slot. Page flags (`sending`, `failed`) are for what an action does; a state widget gets `visible: <flag> ?? false`. A retry reruns the request: `Actions.refreshDatabaseRequest('<widget name>')` for a widget's `query:`, or the action's call again, setting its state again; `Rebuild()` alone shows the cached failure. A bound Text gets a canvas-only sample, `Text(Preview(count, '12'))` (never on `'${count}'`), or it renders `[1]` or empty in the editor; `./fft sample <Call>` fills an API call's from its live response.
- **Content and words.** Realistic samples in the domain's words and units (°C, €, dates), never lorem ipsum or `[item]`. Labels in the user's terms; buttons say what happens ("Save changes"); errors say what went wrong and how to fix it, no apology; sentence case.
- **Not generic.** One primary action per screen. Don't centre everything, stack full-width buttons, use emoji as icons or oversize headers; cards only group meaningful content.
- **Widgets, not HTML.** Never draw a page or section as HTML in a `WebView` or `HtmlView` unless the task asks for one.
- **Phone fit.** Design for 390 px wide: `Expanded`/flex in Rows, no fixed widths; scroll a page whose content can grow. Tap targets 44 px or more.

```dart page
@Page(route: '/new-task')
class NewTaskPage {
  build() => Scaffold(
    appBar: AppBar(title: Text('New task')),
    body: Form(name: 'newTaskForm', child: Column(children: [
      Text('Details', style: titleMedium),
      Column(children: [
        TextField(label: 'Title', hint: 'e.g. Buy milk', required: true, requiredMessage: 'Enter a title', name: 'titleInput'),
        Dropdown(options: ['Low', 'Normal', 'High'], value: 'Normal', label: 'Priority', name: 'priorityInput'),
      ], spacing: 12),
      Button('Create task', width: double.infinity, height: 52, onTap: () {
        ValidateForm('newTaskForm');
        FirestoreCreate(tasks, fields: {'title': titleInput.text, 'done': false});
        context.pop();
      }),
    ], crossAxis: CrossAxis.start, spacing: 24, padding: EdgeInsets.all(16))),
  );
}
```

Fix each `ui.*` or `action.*` warning `./fft check` prints: none blocks a push, each is a real flaw. A `note:` is optional advice.

## From a web design

CSS → fft; match how the design renders, not its code.

- `linear-gradient(Adeg, a, b P%)` → `gradient: Gradient.linear([GradientStop(a, 0), GradientStop(b, P/100)], angle: A - 180)` (`90deg` → `angle: 270`); `radial-gradient` → `Gradient.radial([...], radius: r, centerX: x, centerY: y)`, in fractions of the box.
- `border`, `border-radius`, `overflow: hidden` → `borderColor:`, `borderWidth:`, `borderRadius:`, `clipContent: true`; `border-radius: 50%` → `boxShape: BoxShape.circle`, `width:` the diameter.
- `box-shadow: x y b s c` → `boxShadow: Shadow(dx: x, dy: y, blur: b, spread: s, color: c)`. Glass, `backdrop-filter: blur(Npx)` → `Blur(sigmaX: N, sigmaY: N, borderRadius: r, child: Container(color: Color(0x33FFFFFF), ...))`; `backdrop: false` blurs the child.
- `padding`, `margin`, `gap` → `padding:` (a Container's needs a `child:`), `margin:`, `spacing:`. Flexbox → Row or Column: `justify-content` → `mainAxis:`, `align-items` → `crossAxis:`, `flex: 1` → `Expanded(...)`.
- `grid-template-columns: repeat(N, 1fr)` → a Row of N `Expanded(...)`; equal-height cards: one `height:`, or `GridView(columns: N, childAspectRatio: r, children: [...])`. `useIntrinsicHeight: true` with `crossAxis: CrossAxis.stretch` blanks the canvas from that Row down.
- `position: absolute`, `::before`, `::after` → a child of `Stack(alignment: Alignment.topLeft)` (else it centres; later children paint on top), placed with `outerAlignment:` and `padding:` or `margin:`. A negative offset → `Transform(translate: Vector2D(x: -75, y: -65), child: ...)`; a Transform holds one of `translate:`, `scale:`, `skew:`, `rotateInDegrees:`.
- `letter-spacing`, `line-height`, `text-transform: uppercase` → `letterSpacing:` (with a `style:`), `lineHeight:`, capitals.
- Emoji, unicode or SVG icons → `Icon('<material name>')`; `<img>` → `Image(url, fit: ImageFit.cover)`; `background-image` → `image: DecorationImage(path: url, fit: ImageFit.cover)`.
- `transition`, `@keyframes` → `animations: [WidgetAnimation(effects: [FadeEffect(), SlideEffect(beginDy: 20, endDy: 0)], durationMs: 400)]`; `animated: true` animates a Container's own changes.
- `@media` → `responsiveVisibility: ResponsiveVisibility(phoneHidden: true)` hides parts; there are no per-breakpoint values.

## Custom code (`custom_code/`)

Real Dart, compiled as written; `PROJECT.md` lists its parameters. `custom_code/widgets/<name>.dart` (the constructor declares the parameters, plus `width` and `height`) and `custom_code/actions/<name>.dart` (parameters after `BuildContext context`, a `Future<T>` result) are whole files; `custom_code/functions.dart` holds every function. A new file or function creates one; deleting removes it.

- Parameter types: `String int double bool DateTime Color LatLng dynamic`, `List<...>`, structs (`NoteStruct`), enums. Give a new parameter a default (`this.count = 0`) or pass it wherever the widget is used.
- Pub packages: `pubDependencies` in `settings.dart`. `./fft check` checks only their syntax here: take types and imports from `PROJECT.md` and the existing custom code.
- A custom widget is placed like a component, `PragueGymMap(maxPrice: 9, width: 200, height: 80)`; one named like a widget as `CustomWidget('Name', arguments: {'param': value})`.

## When the format can't express it

`./fft raw pages/home.dart:42` exports the widget, `Opaque(...)` or `unsupported(...)` on line 42 (for a `Bound(...)`, its widget; `--triggers` adds actions) to `raw/home-42.json`: edit that JSON, and `./fft push` applies it after your file edits. An action the format can't write: one FlutterFlow action's JSON (e.g. another step's export) in `raw/<name>.json`, run as `raw('raw/<name>.json');`.

## Schema (`schema.dart`)

```dart schema.dart
@Struct()
class Note { String text; DateTime createdAt; }

enum Priority { low, high }

@AppState()
class appState {
  @persisted
  List<Note> notes = [];
  String displayName = '';
}

@Collection(seed: [
  {'id': 't1', 'title': 'Buy milk', 'done': false, 'createdAt': '2026-01-05T09:00:00Z'},
])
class tasks { String title; bool done; DateTime createdAt; DocumentReference<projects> project; }

@Collection()
class projects { String name; }

@Collection(parent: projects) // a subcollection
class comments { String text; }

final auth = FirebaseAuth(providers: [email], signInPage: 'LoginPage', homePage: 'HomePage');
```

- Types: `String int double bool DateTime ImagePath Color Json LatLng`, `List<T>`, structs, enums, `DocumentReference<collection>`. A collection's name as a type is one of its documents (`final tasks task;`), a table's one of its rows (`athletes athlete;`).
- `seed:` rows fill a collection in Test Mode (`id`: the document id; a reference `'projects/p1'`; ISO dates). `@Table()` classes are the Supabase tables FlutterFlow read (`@primaryKey`; `// references athletes.id`: a foreign key).
- Sign-in needs one auth backend (`providers` `email google apple anonymous`); `SupabaseAuth` and `CustomAuth(userType: 'User')` (a `User` struct) take the same `signInPage:`/`homePage:`. `homePage` is the signed-in root: route roles in its `onLoad`, or make the router page the `homePage`.

## Theme (`theme.dart`)

```dart theme.dart
final darkMode = true; // adds a dark mode
final primary = Color(0xFF4B39EF, dark: 0xFF6F61EF); // light, dark
final night = Color(0xFF0E1116, dark: 0xFF0E1116); // the same in both modes
final primaryFont = 'Inter'; // any Google Font
final cardTitle = TextStyle(font: primaryFont, size: 18, weight: 600, name: 'Card Title');
```

- Edit a value, add a custom color or text style (a new style needs `font:`) or delete one; pages can use a new name in the same push. `name:` is FlutterFlow's name if it differs from the identifier; change it to rename.
- `final designSystem = 'Brand Kit';`: the theme is that library's, read-only. Name another library to switch, or delete the line for the project's own; push a switch alone.
- The 16 theme colors, 15 text styles and used custom ones can't be deleted. Tokens (`Spacing`, `Radius`, `Shadows`), `scrollbar`, `pullToRefresh` and `fonts` live here, icon families in `icons.dart` (`Icon(IconData('cart', custom: true))`); a font or icon file is the path `./fft sdk assets upload` prints.

## API calls (`api.dart`)

A call is a function whose parameters are its variables, used as `$name` in the URL, headers, query and body; an `@ApiGroup` class shares its base URL, headers and variables. Type every response: write the call, run `./fft struct GetUser User`. One live GET declares the response's structs in schema.dart (fields named by its JSON keys, exactly) and adds `parseAs: User` (`List<User>`: a list). If it can't GET it (auth, a body), write both yourself.

```dart api.dart
GetUser({String id = 'u1'}) => Get(
  'https://api.example.com/users/$id',
  parseAs: User,
);

@ApiGroup('https://api.example.com/v1/', headers: ['apikey: $key'])
class Shop {
  String key = 'anon';
  AddItem({String name}) => Post(
    'items',
    json: '''
{"name": "$name"}''',
  );
}
```

```dart schema.dart
@Struct()
class User { String email; List<String> tags; UserAddress address; }

@Struct()
class UserAddress { String city; }
```

Hold it in typed state (or a parameter `final User user;`) and bind its fields (a list item: `.first`, `[i]`):

```dart page
@Page(route: '/profile')
class ProfilePage {
  User user;
  onLoad() {
    GetUser(id: currentUser.uid, onSuccess: (response) { user = response.dataStruct; });
  }
  build() => Scaffold(body: Column(children: [Text(user.address.city), ListView(source: user.tags, itemBuilder: (tag) => Text(tag))]));
}
```

A widget's `query: GetUser(id: uid)` is read under it as `GetUser(id: uid).dataStruct.email`, repeating the query exactly. Methods `Get Post Put Patch Delete`; a body is `json:`, `text:`, `form:` or `multipart:`; `private:`, `cached:`, `name:`, ... (`./fft vocab api`). JSON paths are only the fallback, for a key FlutterFlow can't name (`type`): `response: {'kind': JsonPath<String>(r'$.type')}`, read `response.jsonBody.kind`. Never fall back to a WebView or hardcoded data.

## Settings (`settings.dart`)

One declaration per integration or setting: add it to enable, edit to change, delete to disable. `./fft vocab Stripe` lists a declaration's arguments; environment values, start-up actions, app events, Dynamic Links, app icon, splash, web, platforms, permissions: `./fft vocab app_settings`.

```dart settings.dart
final appNames = AppNames(displayName: 'Notes', packageName: 'com.example.notes');
final bottomNav = BottomNav(items: [NavItem(HomePage, icon: 'home', label: 'Home'), NavItem(NotesPage, icon: 'notes', label: 'Notes')]);
final pubDependencies = <String, Object>{'http': '^1.2.0', 'kit': Git(url: 'https://github.com/o/kit.git', ref: 'v2')};
const int pageSize = 20; // an app constant: Constant('pageSize')
final languages = Languages(['en', 'de']); // the primary language first
```

Keys never show: `secret` keeps a stored key or private environment value. Set a key with `secretRef('NAME')` (an environment value) or a string, a private value with `printenv NAME | ./fft secret NAME`: `RevenueCat(appStoreKey: secretRef('RC_IOS_KEY'), playStoreKey: secret)`.

## Translations (`translations/<code>.dart`)

Each language but the primary one has a file: every text the app shows, by its primary text, per page or component (`app`: in-app and permission messages).

```dart translations/de.dart
final NotesPage = {'Notes': 'Notizen'};
```

`''` is untranslated: the app shows nothing. Translate the texts you add or change; lines left out keep theirs. `('Save', 2)` is a second `'Save'` translated differently. An edited text keeps its translations. `LanguageText(en: 'Hi', de: 'Hallo')` is a value per language.

## Tests (`tests.dart`, `tests/`)

`tests/checkout.dart` is the group Checkout, `tests/checkout/card.dart` its subgroup, `tests.dart` ungrouped tests. Steps are Flutter test calls (`./fft vocab tests`); a widget's `node_key` is `find.byNodeKey('...')`. Leave a `kept(n)` step as pulled.

```dart tests/notes.dart
final group = TestGroup('Notes', tests: [
  Test('opens a note', given: [entryPage(NotesPage)], steps: [tap(find.text('Notes')), pumpAndSettle(), expect(find.text('Note'), findsOneWidget)]),
]);
```

## Project actions (`./fft sdk`)

`./fft sdk <command>` runs a FlutterFlow AI SDK command on this project (`@project`), then re-pulls (unpushed edits stay for `./fft push`). `./fft sdk` lists them: `add-library <library-id> --name ui` and other library commands, `branch create|checkout|list|close <name>` (main is `""`; checkout needs all pushed and switches this workspace; in an editor-linked workspace (`./fft status` shows `editor:`) it asks the user: keep working until the workspace is re-pointed), `merge start|status|auto|resolve|commit`, `test-pilot list @project`, `doctor`.

## What you can't do here

- Only the files above reach FlutterFlow. Any other file (a `DESIGN_SYSTEM.md`, notes) stays in this folder: `./fft status` lists it as `local`.
- No file publishes a design system or makes this project a library. `./fft sdk publish-library --target lib:<name> --version 1.0.0` publishes a library this project uses; `--allow-primary` (this project) makes it a library for good, so ask first.
- `./fft sdk create-project --name Demo` makes another project, which needs its own workspace.

## Common errors

A mistake, its error, the fix; errors name the closest match.

```dart errors
Row(children: [], mainAxis: MainAxisAlignment.center) // Unknown name MainAxisAlignment → MainAxis.center
```

## Checking your edits

No automatic check runs after your edits in this workspace. Run `./fft check` after editing and fix what it reports before `./fft push`.
