# led-controller-CS410-SP2025

### Initial Setup (MAC)

**Ensure you have both npm and Xcode installed**
Within Xcode ensure you also download the IOS components so that we can emulate an Iphone.

From here run:

```bash
cd ledapp; npm install
```

also run (dependency manager for Xcode) 
```bash
brew install cocoapods
```
and run to check if properly installed
```bash
pod --version
```

If you recieve an issue about Xcode not pointing to the correct path even after installing Xcode:
1. Ensure that it is installed under `/Applications` and not `/Users/{user}/Applications`
2. Then run this 
```bash
sudo xcode-select -s /Applications/Xcode.app/ContentsDeveloper
```

Now run these commands to install all dependencies and create the `dist` directory:

```bash
npm install && npm run build && npx cap sync ios
```

Next, run this command to open up the project emulator in Xcode:
```bash
npx cap open ios
```

*Within Xcode, choose the device to emulate then click the play button. This is essentially a non-live preview of the fully bundled app.*

---
### Development Workflow

To simply work on the UI:
```bash
cd ledapp; npm run dev
```
From here you can work from within localhost.

**Whenever you want to run the emulator you must run these commands EVERY TIME:**
```bash
npm run build && npx cap sync ios && npx cap open ios
```
