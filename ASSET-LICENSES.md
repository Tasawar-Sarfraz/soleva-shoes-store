# Asset sources and licences

SOLEVA is an original fictional demonstration brand. No product image, review, statistic, location or performance claim is presented as a real operating business asset.

| Asset | Source | Licence / notes |
| --- | --- | --- |
| Product illustrations, hero posters and favicon | Original SOLEVA SVG code in `src/lib/artwork.ts` and `public/favicon.svg` | Original project artwork, supplied with this application; no external image rights required |
| Procedural footwear models, sole study, showroom and globe outline | Original source in `src/components/three` and `public/showroom` | Original illustrative geometry; reusable category models, not scans or scientific measurements |
| Procedural woven texture and monogram bitmap | Created locally by model/monogram code | Original texture; no external texture download |
| DM Sans variable Latin font | Fontsource package `@fontsource-variable/dm-sans` 5.3.0, https://fontsource.org/fonts/dm-sans ; upstream https://github.com/googlefonts/dm-fonts | SIL Open Font License 1.1; text included in `public/licenses/DM-Sans-OFL.txt` |
| DM Serif Display italic font | Fontsource package `@fontsource/dm-serif-display` 5.3.0, https://fontsource.org/fonts/dm-serif-display | SIL Open Font License 1.1; text in `public/licenses/DM-Serif-Display-OFL.txt` |
| Lucide icons | `lucide-react`, https://lucide.dev | ISC; rendered locally from the installed package |
| Three.js | https://github.com/mrdoob/three.js | MIT |
| React Three Fiber / Drei | https://github.com/pmndrs/react-three-fiber ; https://github.com/pmndrs/drei | MIT; no remote environment HDRI, font or model is requested |
| Babylon.js | https://github.com/BabylonJS/Babylon.js | Apache-2.0 |
| A-Frame browser runtime | `aframe` 1.8.0, https://github.com/aframevr/aframe | MIT; source licence copied to `public/licenses/A-Frame-MIT.txt` |
| Cesium Workers / Assets / Widgets / ThirdParty | `cesium` 1.146.0, https://github.com/CesiumGS/cesium | Apache-2.0 plus upstream third-party notices retained in those directories. Main licence copied to `public/licenses/Cesium-Apache-2.0.txt`. Credit display remains enabled |
| gl-matrix | https://github.com/toji/gl-matrix | MIT |
| Spline integration package | https://github.com/splinetool/react-spline | Runtime/integration package licences apply; **no Spline scene is included or licensed by this delivery** |

Other code dependencies keep their upstream npm licences and notices, available after `npm ci`. They are identified exactly by `package-lock.json`. This project does not grant rights to third-party trademarks or a scene later supplied by an operator. Before public deployment, review your actual product assets, scene licence and package licences for your intended use.

The only upstream Git dependency (`dmarcos/three-bmfont-text`) is an A-Frame dependency, locked at `c3eec235b9188aa0d8ed949101236e6d5fccf071`. Its installed JavaScript files were compared byte-for-byte with that Git commit using the authenticated HTTPS route. No checksum or TLS verification was disabled.
