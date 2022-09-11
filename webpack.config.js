const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    index: './src/Collapsible.tsx',
    hooks: './src/useCollapsible.ts',
    legacy: './src/LegacyCollapsible.tsx',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
    // /**
    //  * Makes UMD build available on both browsers and Node.js
    //  * https://webpack.js.org/configuration/output/#outputglobalobject
    //  */
    globalObject: 'this',
  },
  resolve: { extensions: ['.ts', '.tsx'] },
  module: { rules: [{ test: /\.tsx?$/, loader: 'ts-loader' }] },
  externals: ['react'],
};
