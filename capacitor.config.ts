import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "lk.kcsc.admin",
  appName: "KCSC Admin",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      // Club maroon — the splash reads as the crest, not a white flash.
      backgroundColor: "#720000",
      splashFullScreen: false,
      splashImmersive: false,
    },
  },
}

export default config
