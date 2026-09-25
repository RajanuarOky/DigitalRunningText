import cascadeLayers from '@csstools/postcss-cascade-layers';
import colorMixFunction from '@csstools/postcss-color-mix-function';

export default {
  plugins: [
    cascadeLayers(),
    colorMixFunction(),
  ],
};
