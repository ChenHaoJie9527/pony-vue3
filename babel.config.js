const presets = [
  [
    "@babel/preset-env",
    {
      targets: {
        node: "current",
      },
      useBuiltIns: "usage",
      corejs: "3.6.4",
    },
  ],
  "@babel/preset-typescript",
];

module.exports = { presets };
