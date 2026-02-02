// Centralized Adyen configuration
export const adyenConfig = {
  // Environment detection
  getEnvironment: () => {
    // Check localStorage override first (for testing)
    const forcedEnv = localStorage.getItem("adyen_force_env");
    if (forcedEnv === "live" || forcedEnv === "test") {
      return forcedEnv;
    }

    // Auto-detect based on hostname
    const hostname = window.location.hostname;

    if (
      hostname.includes("unlimitedremit.com") &&
      !hostname.includes("staging") &&
      !hostname.includes("dev") &&
      !hostname.includes("test")
    ) {
      return "live";
    }

    return "test"; // Default to test for safety
  },

  // Get full configuration
  getConfig: (env = null) => {
    const environment = env || adyenConfig.getEnvironment();
    const isLive = environment === "live";

    const config = {
      environment,
      isLive,
      clientKey: isLive
        ? import.meta.env.VITE_ADYEN_LIVE_CLIENT_KEY ||
          "live_MDVSR7AQ75GT3JUGNXHL2Y7X4AN3OY6J"
        : import.meta.env.VITE_ADYEN_TEST_CLIENT_KEY ||
          "test_44NHURRQARCK3ISEQX3OKJWCNAMILJJS",
      checkoutUrl: isLive
        ? "https://checkoutshopper-live.adyen.com"
        : "https://checkoutshopper-test.adyen.com",
      sdkVersion: isLive ? "5.62.0" : "5.58.0",
      analytics: isLive,
      riskEnabled: isLive,
    };

    return config;
  },

  // Validate configuration
  validate: () => {
    const config = adyenConfig.getConfig();
    const warnings = [];

    if (config.isLive && window.location.hostname.includes("localhost")) {
      warnings.push("WARNING: Using LIVE environment on localhost!");
    }

    if (!config.clientKey.startsWith(config.environment + "_")) {
      warnings.push(
        `WARNING: Client key prefix doesn't match environment (${config.environment})`
      );
    }

    return {
      valid: warnings.length === 0,
      environment: config.environment,
      isLive: config.isLive,
      warnings,
      config,
    };
  },

  // SDK loading helper
  loadSDK: async () => {
    const config = adyenConfig.getConfig();

    return new Promise((resolve, reject) => {
      if (window.AdyenCheckout) {
        resolve(window.AdyenCheckout);
        return;
      }

      const script = document.createElement("script");
      script.src = `${config.checkoutUrl}/checkoutshopper/sdk/${config.sdkVersion}/adyen.js`;
      script.async = true;
      script.crossOrigin = "anonymous";

      script.onload = () => {
        if (window.AdyenCheckout) {
          resolve(window.AdyenCheckout);
        } else {
          reject(new Error("AdyenCheckout not available after loading"));
        }
      };

      script.onerror = reject;
      document.head.appendChild(script);
    });
  },
};

export default adyenConfig;
