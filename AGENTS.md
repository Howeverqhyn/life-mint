This is an Expo SDK 57 app (Expo Go) plus a small API in `/server`.

Routes live in `app/`, not `src/app`. Shared code lives in `src/`. The LifePack shape is `src/types/life-pack.ts`; the API mirrors it in `server/src/schema.ts`.

Phone users open the app with Expo Go. Do not bump to Expo SDK 58 unless Expo Go on the stores supports it — during the SDK 58 transition, store builds of Expo Go still run SDK 57.

Before changing an Expo API, read the matching docs at `https://docs.expo.dev/versions/v57.0.0/`. Install native modules with `npx expo install`, not a bare version pin.

`ios/` and `android/` are generated. Do not commit them.
