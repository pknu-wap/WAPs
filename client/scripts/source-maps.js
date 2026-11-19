const configPath = require.resolve("react-scripts/config/webpack.config");
const createConfig = require(configPath);

require.cache[configPath].exports = (webpackEnv) => {
  const config = createConfig(webpackEnv);
  const sourceMapRule = config.module.rules.find(
    (rule) => rule.loader === require.resolve("source-map-loader"),
  );
  if (sourceMapRule) {
    // html5-qrcode 2.3.8 maps point outside the package to missing TS sources.
    sourceMapRule.exclude = [
      sourceMapRule.exclude,
      /node_modules[\\/]html5-qrcode[\\/]/,
    ];
  }
  return config;
};
