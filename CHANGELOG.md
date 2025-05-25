# Changelog

## [0.5.2](https://github.com/contane/foreman/compare/v0.5.1...v0.5.2) (2025-05-25)


### Bug Fixes

* **deps:** update dependencies (non-major) ([#199](https://github.com/contane/foreman/issues/199)) ([391fe1e](https://github.com/contane/foreman/commit/391fe1efb74311a1bb7631b687e11c1a611ec5c8))
* **deps:** update dependencies (non-major) ([#207](https://github.com/contane/foreman/issues/207)) ([36d9944](https://github.com/contane/foreman/commit/36d994416431947128cb4e413e447e8dbb76e866))
* **deps:** update dependencies (non-major) ([#211](https://github.com/contane/foreman/issues/211)) ([c9d4ad5](https://github.com/contane/foreman/commit/c9d4ad5c79a907eac50369c33f730cbf9a70c74e))
* **deps:** update dependencies (non-major) ([#213](https://github.com/contane/foreman/issues/213)) ([c5cc7c9](https://github.com/contane/foreman/commit/c5cc7c9840f87cd1d9f29728b79823d25ac185e1))
* **deps:** update dependencies (non-major) ([#225](https://github.com/contane/foreman/issues/225)) ([cc5b318](https://github.com/contane/foreman/commit/cc5b318286a79711f155b5ba40e676cd784d6de3))
* **deps:** update dependencies (non-major) ([#228](https://github.com/contane/foreman/issues/228)) ([05d055e](https://github.com/contane/foreman/commit/05d055e9fd69a95b37029b86fd1d7290aefbcc46))
* **deps:** update dependency fastify to v5.3.2 [security] ([#218](https://github.com/contane/foreman/issues/218)) ([51c635f](https://github.com/contane/foreman/commit/51c635f2f656eecb3b88add31f1a4f851b4f6866))
* **deps:** update dependency secure-json-parse to v4 ([#215](https://github.com/contane/foreman/issues/215)) ([d901152](https://github.com/contane/foreman/commit/d9011527e8e108bcd4604875ab068fdb402fd0ef))
* **deps:** update dependency yaml to v2.7.0 ([#196](https://github.com/contane/foreman/issues/196)) ([cce9bd9](https://github.com/contane/foreman/commit/cce9bd910e65f16a843b16e889d2161905607637))
* **deps:** update node.js to v22.14.0 ([#210](https://github.com/contane/foreman/issues/210)) ([3501d83](https://github.com/contane/foreman/commit/3501d839ce00cf5701b99294a52ae2132301e2f3))
* **deps:** update node.js to v22.15.1 ([#224](https://github.com/contane/foreman/issues/224)) ([d538840](https://github.com/contane/foreman/commit/d538840548f3aec3d9c579eca685d0c6118a1704))
* **deps:** update node.js to v22.16.0 ([#230](https://github.com/contane/foreman/issues/230)) ([3c17a33](https://github.com/contane/foreman/commit/3c17a3339a31977ae5303022b28da3417784e0b9))

## [0.5.1](https://github.com/contane/foreman/compare/v0.5.0...v0.5.1) (2024-12-24)


### Bug Fixes

* Ensure proper OIDC redirect_uri is used ([#192](https://github.com/contane/foreman/issues/192)) ([894b4db](https://github.com/contane/foreman/commit/894b4db2834206be931da86cac490008cc25a43c))

## [0.5.0](https://github.com/contane/foreman/compare/v0.4.3...v0.5.0) (2024-12-24)


### ⚠ BREAKING CHANGES

* Foreman now requires the OIDC issuer to use HTTPS. Plain HTTP is no longer supported for OpenID Connect authentication.
* Require Node.js v22.12.0 or later ([#189](https://github.com/contane/foreman/issues/189))
* Kubernetes client v1 requires HTTPS for connecting to the Kubernetes API server. While this should not cause any problems in practice, as Kubernetes API servers are typically exposed over HTTPS, it would still break non-standard HTTP-only setups.

### Features

* Optimize Docker image, build for amd64+arm64 ([#173](https://github.com/contane/foreman/issues/173)) ([8d35b6d](https://github.com/contane/foreman/commit/8d35b6ddb60301248990c0d5ff5e114d3b390079))
* Update Kubernetes client to v1 ([#188](https://github.com/contane/foreman/issues/188)) ([2c09c9e](https://github.com/contane/foreman/commit/2c09c9e2fb79cc84084d18552fb454e68d21a3eb))
* Update openid-client to v6, require HTTPS for issuer ([#190](https://github.com/contane/foreman/issues/190)) ([05658f4](https://github.com/contane/foreman/commit/05658f478b88a578617b80bbc4b523791d5da305))


### Bug Fixes

* **deps:** update dependencies (non-major) ([#178](https://github.com/contane/foreman/issues/178)) ([5542721](https://github.com/contane/foreman/commit/5542721f64db99a0fa925b65999bc67cef096f41))
* **deps:** update dependencies (non-major) ([#185](https://github.com/contane/foreman/issues/185)) ([e7c156a](https://github.com/contane/foreman/commit/e7c156af286e1546e1da213617dfd87bb0353d2e))
* **deps:** update dependency fastify to v5.2.0 ([#181](https://github.com/contane/foreman/issues/181)) ([2aa081d](https://github.com/contane/foreman/commit/2aa081d45845c8e41d8222f19a7d3c5169a845bb))
* **deps:** update node.js to v22 ([#158](https://github.com/contane/foreman/issues/158)) ([2b070f1](https://github.com/contane/foreman/commit/2b070f1a31998cba34ecf72b12ae486ad6ea3618))
* **deps:** update react monorepo to v19 (major) ([#179](https://github.com/contane/foreman/issues/179)) ([5c786d1](https://github.com/contane/foreman/commit/5c786d1c63b371fe90aad3e7008e0b32b4ac57d6))


### Miscellaneous Chores

* Require Node.js v22.12.0 or later ([#189](https://github.com/contane/foreman/issues/189)) ([af7ef37](https://github.com/contane/foreman/commit/af7ef37514078d7c45cd238972b20126441ffbfa))

## [0.4.3](https://github.com/contane/foreman/compare/v0.4.2...v0.4.3) (2024-11-30)


### Bug Fixes

* **deps:** update dependencies (non-major) ([#160](https://github.com/contane/foreman/issues/160)) ([c8a9ecb](https://github.com/contane/foreman/commit/c8a9ecbf1c49f23524cc0cd3fd8f6715577c43dd))
* **deps:** update dependencies (non-major) ([#167](https://github.com/contane/foreman/issues/167)) ([048396e](https://github.com/contane/foreman/commit/048396e597e7fc376250d40a5766e21066593106))
* **deps:** update dependency @kubernetes/client-node to v0.22.2 ([#147](https://github.com/contane/foreman/issues/147)) ([7fa7fd0](https://github.com/contane/foreman/commit/7fa7fd05c192a5f9ec098b784075d4625391ecbf))
* **deps:** update dependency pino-pretty to v12 ([#161](https://github.com/contane/foreman/issues/161)) ([ee2985a](https://github.com/contane/foreman/commit/ee2985a6d2931022ea335505d347b6f2db30b542))
* **deps:** update dependency pino-pretty to v13 ([#163](https://github.com/contane/foreman/issues/163)) ([e71806d](https://github.com/contane/foreman/commit/e71806d289847c3bc067b3c61af8d186931ae08e))
* **deps:** update dependency react-router-dom to v7 ([#170](https://github.com/contane/foreman/issues/170)) ([bc841bf](https://github.com/contane/foreman/commit/bc841bfb5af906e4fed3aa04a73d6ae20fa07af0))
* **deps:** update dependency secure-json-parse to v3 ([#166](https://github.com/contane/foreman/issues/166)) ([befa477](https://github.com/contane/foreman/commit/befa4771b92449737d22a610be2c1acf7f303aba))
* **deps:** update dependency secure-json-parse to v3 ([#172](https://github.com/contane/foreman/issues/172)) ([a19325d](https://github.com/contane/foreman/commit/a19325d6c79ef76d50a1fcbf1f5eff0203b86297))
* **deps:** update dependency yaml to v2.6.0 ([#142](https://github.com/contane/foreman/issues/142)) ([79c46c1](https://github.com/contane/foreman/commit/79c46c189416e4724987e92a189595c143bc72b9))
* **deps:** Update Fastify to v5 ([#140](https://github.com/contane/foreman/issues/140)) ([58643d5](https://github.com/contane/foreman/commit/58643d5dc401d3156d32cd0ab10820c91c5f63b1))
* **deps:** update node.js to v20.18.1 ([#169](https://github.com/contane/foreman/issues/169)) ([f79733c](https://github.com/contane/foreman/commit/f79733c1062a3c9c4a3f444b3cdf8e675574f2ac))
* Update ESLint to v9, update config, and fix new lint errors ([#144](https://github.com/contane/foreman/issues/144)) ([b0bec98](https://github.com/contane/foreman/commit/b0bec9803b0a5e1cecb2503ffff79be6570c63cc))

## [0.4.2](https://github.com/contane/foreman/compare/v0.4.1...v0.4.2) (2024-10-12)


### Bug Fixes

* Avoid crash if run without config directory ([#137](https://github.com/contane/foreman/issues/137)) ([1986b55](https://github.com/contane/foreman/commit/1986b55befb593a57a1c12dbb9e60e9210b6a28e))
* **deps:** Pin sodium-native to v4.2.0 ([#136](https://github.com/contane/foreman/issues/136)) ([6042482](https://github.com/contane/foreman/commit/6042482f1f9bb1e3c1e5b854c76e0c544137cab6))
* **deps:** update dependency @headlessui/react to v2.1.10 ([#131](https://github.com/contane/foreman/issues/131)) ([211e794](https://github.com/contane/foreman/commit/211e7941b42370c6ab31ca01d10db67465ee8835))
* **deps:** update dependency react-router-dom to v6.27.0 ([#134](https://github.com/contane/foreman/issues/134)) ([bf08a53](https://github.com/contane/foreman/commit/bf08a533b03859c2768240fc0ac725877f224e0e))

## [0.4.1](https://github.com/contane/foreman/compare/v0.4.0...v0.4.1) (2024-10-05)


### Bug Fixes

* **deps:** update dependency @headlessui/react to v2.1.6 ([#101](https://github.com/contane/foreman/issues/101)) ([54f3430](https://github.com/contane/foreman/commit/54f3430bf6cff35b130c24678d78562ee94d2be7))
* **deps:** update dependency @headlessui/react to v2.1.8 ([#109](https://github.com/contane/foreman/issues/109)) ([a169d30](https://github.com/contane/foreman/commit/a169d304d1d1fcc8dbb3df8f7deaa37e7078f3a0))
* **deps:** update dependency @headlessui/react to v2.1.9 ([#122](https://github.com/contane/foreman/issues/122)) ([d9d13c3](https://github.com/contane/foreman/commit/d9d13c3f86e59ba29bc97d47cb1dd44b93c1a3f0))
* **deps:** update dependency @kubernetes/client-node to v0.22.0 ([#111](https://github.com/contane/foreman/issues/111)) ([7be37be](https://github.com/contane/foreman/commit/7be37be6147eeb1cd05cc8cbd6bd38cdeaca07e8))
* **deps:** update dependency luxon to v3.5.0 ([#87](https://github.com/contane/foreman/issues/87)) ([c6cf8f0](https://github.com/contane/foreman/commit/c6cf8f0600bc0afb46a956cfb6c12e5ee20ab315))
* **deps:** update dependency openid-client to v5.7.0 ([#106](https://github.com/contane/foreman/issues/106)) ([030648a](https://github.com/contane/foreman/commit/030648aed13d0120c4741ba55fafbc7f7866163c))
* **deps:** update dependency pino to v9.4.0 ([#104](https://github.com/contane/foreman/issues/104)) ([1920005](https://github.com/contane/foreman/commit/19200057e793459f8dbb5897d0260758312e94e2))
* **deps:** update dependency react-loading-skeleton to v3.5.0 ([#120](https://github.com/contane/foreman/issues/120)) ([1a899aa](https://github.com/contane/foreman/commit/1a899aa50f85da7c291e8aaa74338ebfd1d87dde))
* **deps:** update dependency react-router-dom to v6.26.0 ([#84](https://github.com/contane/foreman/issues/84)) ([d48c73b](https://github.com/contane/foreman/commit/d48c73b47e936109f8278ad4bfd69e5da6e386c8))
* **deps:** update dependency react-router-dom to v6.26.2 ([#98](https://github.com/contane/foreman/issues/98)) ([474cce0](https://github.com/contane/foreman/commit/474cce061945e4f52c743853a2eb25ee0cf10df1))
* **deps:** update dependency yaml to v2.5.1 ([#105](https://github.com/contane/foreman/issues/105)) ([1843bf3](https://github.com/contane/foreman/commit/1843bf385dbafa4218c5256d552a81dc1249f7f3))
* **deps:** update node docker tag to v20.17.0 ([#94](https://github.com/contane/foreman/issues/94)) ([4c9ce0e](https://github.com/contane/foreman/commit/4c9ce0e145fb3b33026f9f026dbe74f8db375094))
* **deps:** update node.js to v20.18.0 ([#124](https://github.com/contane/foreman/issues/124)) ([e9ed12d](https://github.com/contane/foreman/commit/e9ed12d2c949d6b5d333e0cf200f376d9aa33ffa))
* Remove unnecessary `??` operator ([#107](https://github.com/contane/foreman/issues/107)) ([5359660](https://github.com/contane/foreman/commit/53596602c161833de2c6803fe855f8b17e814fce))

## [0.4.0](https://github.com/contane/foreman/compare/v0.3.0...v0.4.0) (2024-07-25)


### Features

* Handle termination signals ([#65](https://github.com/contane/foreman/issues/65)) ([a257d4b](https://github.com/contane/foreman/commit/a257d4b2571225a281245e309e04a918311222f9))


### Bug Fixes

* **deps:** update dependency pino to v9.3.1 ([#55](https://github.com/contane/foreman/issues/55)) ([06e3d72](https://github.com/contane/foreman/commit/06e3d7280c132765acffb7597282a419c337dba6))
* **deps:** update dependency pino to v9.3.2 ([#78](https://github.com/contane/foreman/issues/78)) ([6ee64fc](https://github.com/contane/foreman/commit/6ee64fcfb547288f78003d45b6c2274bd7867a44))
* **deps:** update dependency pino-pretty to v11.2.2 ([#79](https://github.com/contane/foreman/issues/79)) ([e54d928](https://github.com/contane/foreman/commit/e54d92802061ebdcd36140ef7e3b7546b64db363))
* **deps:** update dependency react-router-dom to v6.25.0 ([#58](https://github.com/contane/foreman/issues/58)) ([dffe84e](https://github.com/contane/foreman/commit/dffe84e5fda5b7d7f2822cbe6af7aa5a53a80112))
* **deps:** update dependency react-router-dom to v6.25.1 ([#63](https://github.com/contane/foreman/issues/63)) ([08d91bd](https://github.com/contane/foreman/commit/08d91bd9d71dab583c91fbac1aa07c3d30bf65a4))
* **deps:** update dependency yaml to v2.5.0 ([#73](https://github.com/contane/foreman/issues/73)) ([de4e93b](https://github.com/contane/foreman/commit/de4e93b977f46ef29418f59a8c5efc829d43f807))
* **deps:** update font awesome to v6.6.0 ([#60](https://github.com/contane/foreman/issues/60)) ([46dd2f7](https://github.com/contane/foreman/commit/46dd2f74d689c79eb96c6164efa97c9650ba4398))
* **deps:** update node.js to v20.16.0 ([#72](https://github.com/contane/foreman/issues/72)) ([d2074b4](https://github.com/contane/foreman/commit/d2074b43179caef958a4d630d5d98ee84f872bbf))
* Serialize access to pod logs ([#53](https://github.com/contane/foreman/issues/53)) ([9cbc552](https://github.com/contane/foreman/commit/9cbc552779033dd5f41f99211396180a19bc4816))
* Skip parsing irrelevant log lines for progress ([#50](https://github.com/contane/foreman/issues/50)) ([cf56240](https://github.com/contane/foreman/commit/cf56240315564d95d8673ff68c8bc8a4bd3e01e1))

## [0.3.0](https://github.com/contane/foreman/compare/v0.2.0...v0.3.0) (2024-07-14)


### Features

* Handle CronJob not found ([#43](https://github.com/contane/foreman/issues/43)) ([b8a094b](https://github.com/contane/foreman/commit/b8a094bc591d5870788512041e232c5a28630da9))
* Handle empty repository autodiscovery ([#45](https://github.com/contane/foreman/issues/45)) ([b35022a](https://github.com/contane/foreman/commit/b35022ac8985750fd8a8295b61a70b6a07c0db71))
* Use consistent design for card components ([#35](https://github.com/contane/foreman/issues/35)) ([7f230f3](https://github.com/contane/foreman/commit/7f230f3d1016e40db8369359970bc8140a66892f))
* Verify job ownership ([#37](https://github.com/contane/foreman/issues/37)) ([f854f8c](https://github.com/contane/foreman/commit/f854f8cc46d2987e923a72eeed0d3dbde8aa1ad7))


### Bug Fixes

* Refactor progress extraction and add tests ([#40](https://github.com/contane/foreman/issues/40)) ([060f041](https://github.com/contane/foreman/commit/060f041d0606d5ac1b4a2ead99f4c57b0fa1b3c7))
* Set fixed height for LogDialog ([#44](https://github.com/contane/foreman/issues/44)) ([c5471be](https://github.com/contane/foreman/commit/c5471be1051d7286253de191f8e449c292e4471f))
* Use distinct icons for "status dot" ([#38](https://github.com/contane/foreman/issues/38)) ([90a2a02](https://github.com/contane/foreman/commit/90a2a02660a826ead4eb73001aabb43a48dc7f6c))

## [0.2.0](https://github.com/contane/foreman/compare/v0.1.1...v0.2.0) (2024-07-10)


### Features

* Show a message when the job list is empty ([#29](https://github.com/contane/foreman/issues/29)) ([19f0e8b](https://github.com/contane/foreman/commit/19f0e8bdc784513c8309ebc68209cf91eca3ab93))


### Bug Fixes

* **deps:** update node.js to v20.15.1 ([#33](https://github.com/contane/foreman/issues/33)) ([46069e0](https://github.com/contane/foreman/commit/46069e0181b2c95b64a32be04fcc75e9f2cf01d4))

## [0.1.1](https://github.com/contane/foreman/compare/v0.1.0...v0.1.1) (2024-07-08)


### Bug Fixes

* Avoid page flickering on pod completion ([#24](https://github.com/contane/foreman/issues/24)) ([5ca292f](https://github.com/contane/foreman/commit/5ca292fd2408b728334801f7867789f88362b670))

## 0.1.0 (2024-07-06)


### Features

* Add project files and source ([#1](https://github.com/contane/foreman/issues/1)) ([f6f51a3](https://github.com/contane/foreman/commit/f6f51a34e663ffe48e78b876b7bfb8b1250e0f50))


### Bug Fixes

* **deps:** update dependency superstruct to v2.0.2 ([#2](https://github.com/contane/foreman/issues/2)) ([5bf825f](https://github.com/contane/foreman/commit/5bf825f72e7db3d13078b05868dea6703c05ba78))
* Set next release to v0.1.0 ([99f3336](https://github.com/contane/foreman/commit/99f3336191bf79dffe556fad157579bb4fbdbc1d))
