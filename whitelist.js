/**
 * 仅含姓名与手机号后6位的校验值，不含明文个人资料。
 * 使用 node scripts/manage-whitelist.mjs 维护，勿手工加入个人资料。
 * 每条记录随机盐 + PBKDF2-SHA-256（600000次）。
 * 校验值仍可能被离线猜测；纯前端入口不能替代服务端认证。
 */
window.EXAM_WHITELISTS = {
  "version": 3,
  "credential": "name-phone-last6",
  "algorithm": "PBKDF2-SHA-256",
  "iterations": 600000,
  "sessionHours": 12,
  "auto": [
    {
      "salt": "9e4bbe5ff3109263effc7b3c304f9791",
      "hash": "bda7d75c82e0ebcaf82cce001e35326db92875180a488ca0225c0caf09277851",
      "enabled": true
    },
    {
      "salt": "5a420c7e193309867d6604534723ee40",
      "hash": "4fb17d48ba71fa4a11c23f135da52d545a5e3671a7a49b15bc89d9e41e1061c5",
      "enabled": true
    },
    {
      "salt": "3a3b0072683a0f77d212a896b71de439",
      "hash": "73c5fbeba5a07a222744ac0fb7120a8bf954428255a805239f9a1420f04e8e85",
      "enabled": true
    },
    {
      "salt": "69f01f70a46198d8b4993524944e9108",
      "hash": "7b135a6716a81fdd8d059db077665ba83251c04d6c932e9afec75dc9aa330873",
      "enabled": true
    },
    {
      "salt": "fbf4e14d3708a242d308a246e494ff0d",
      "hash": "d73bfaf0cbad80d5f6a2a5f45076d023a2cffe88e164ee83e60a5cfdce6ef118",
      "enabled": true
    },
    {
      "salt": "292f53836d6a15de13294af4745922e9",
      "hash": "f53afcde5e3ad443c1b517f915a703c245fcb251d1b0bb4d49300a856b16a726",
      "enabled": true
    },
    {
      "salt": "f473aeb3d7175482cf5583678d91b389",
      "hash": "50aa690557102242f8e0ec8bc0eecc648e9338855e023ac19bd772b65210da5b",
      "enabled": true
    },
    {
      "salt": "754994d130acf17f4b2e3f16b815725a",
      "hash": "b4bfeca57555d82d354735b6be4f8219f18ebd4c64ffa913164491fa23b3edb0",
      "enabled": true
    },
    {
      "salt": "5ed5cb16df40e505251a2d61ec80d705",
      "hash": "e5b5f54b78bddf0af2f6bf90f4973fe8748bfd3276974b5191e160de6109fb62",
      "enabled": true
    },
    {
      "salt": "8eeb03e07e1c4e2ff20b7e9ff054a3e9",
      "hash": "2e223548862ff5d55ae9252035f45a1f00a3aed384b3f0361ed6688aa7aa597d",
      "enabled": true
    },
    {
      "salt": "0fd364726a8f3b3d2454090562645b84",
      "hash": "5e397ad262fddbf5ec43f17914b140f99b7b0dba86e39580e1d6a0134724d11c",
      "enabled": true
    },
    {
      "salt": "c1706d49eb9ea700de6fd14c9841b8c8",
      "hash": "b1bb8f5b45a282ce5413c7cd2f3ba1861dfcf5a94ef50ed7eba446db804f1675",
      "enabled": true
    },
    {
      "salt": "5df2e9057718439d2b213922686b03c6",
      "hash": "420843203df945c9406dcd6cae0bba49cb8e373c137e7b1bd530acd9b08c7565",
      "enabled": true
    },
    {
      "salt": "a8293de4cbe62142b8c8910b170aef4b",
      "hash": "8c8580443dde48c78ea1d58eb282d607458a3f73bc3fe3a82f9d6b68da4867b6",
      "enabled": true
    },
    {
      "salt": "6343195e05d0f579c704ed005149479b",
      "hash": "f3df7dd44b01258dfea8fcae0081dbc757fa274ce6f4334be43c987b417e0b8f",
      "enabled": true
    },
    {
      "salt": "dbe88a5d02da1de5d304a4093c513fcb",
      "hash": "38a106654b06e367bebfc0b31d7e3c457b5d226f5fc24115c84765c7e8cbebfd",
      "enabled": true
    },
    {
      "salt": "93c9ad4d68186222d44733a6fc05d082",
      "hash": "c9d7f7302f02c8c5dbeb268c9aa3304adad3f39f6d8283877c9f036804151c61",
      "enabled": true
    },
    {
      "salt": "194794fdd7e2a1640d24ae557a4a691f",
      "hash": "83f48d5653d3eb0d410e5d3263e20c827067cd1ce67b2ae9d15a7f7d57837dc3",
      "enabled": true
    },
    {
      "salt": "385c34b8b81e4edc5d0401052847ffb3",
      "hash": "9c7465c7a2b17352e916e2de00738353bb52878c2fa776cb18a1089e92b28acc",
      "enabled": true
    },
    {
      "salt": "b5ec6ba7f3349dc75eae7e62ea657019",
      "hash": "15c2ab6c614a9c9270a81b5e5a0935ca36e4ead956c11479cdb5b16814b9c22b",
      "enabled": true
    },
    {
      "salt": "c18ad0a494a5cbcbd454db41207ef594",
      "hash": "a1f779546c35a89edf975ccb71c26bd07240aaa94ee1019d61c5900c547966aa",
      "enabled": true
    },
    {
      "salt": "756a5f9722bbd05aac4567d0fcdad582",
      "hash": "da861de0eabd75c33a91873a0a2797f1bbbe1683b0fcc21b41a6f55f85a27fdb",
      "enabled": true
    },
    {
      "salt": "3e662c455b73c2e82e79373dff247e70",
      "hash": "aadf63eddd1c463c53e9b993d4d0dc22054591c862930b471501984fa42c35d6",
      "enabled": true
    },
    {
      "salt": "2fbe60d6708b46ee5fedcba3d70ffce5",
      "hash": "364553aa8a3d359a512f14041f909fe9206fb3d6ad5d8b3a64dcc60942f808e8",
      "enabled": true
    },
    {
      "salt": "58ba87d3e2844d81703634318e0fad6f",
      "hash": "d82a9ad0006bba95e94252607682c75f3c296302a81755b51b57a1a09cfb8ad1",
      "enabled": true
    },
    {
      "salt": "ffaea66059c54e381e8e0edd2f26c254",
      "hash": "c7169643ad2bb4f9c6820b5ab41d048d5d872316f41438baa77b72551d7cadae",
      "enabled": true
    },
    {
      "salt": "3f3a9cf513d6c17fd42fd145511636c7",
      "hash": "64700f59ca28946beca291c9a468cbb8d0d844a204fcef080fc9f00a764f955d",
      "enabled": true
    },
    {
      "salt": "fee989d11f72ddacaf403cf431888049",
      "hash": "5b55a47e51c04165839775a31ac2e42f86cd175b6ad169bdfbce6470bbdaeb8f",
      "enabled": true
    },
    {
      "salt": "7a691054ce3991dda0a2439061703bc3",
      "hash": "bea1f49b093f16749d15d5c40e2c1821cd6f8eda67eb8b93960c711cee215521",
      "enabled": true
    },
    {
      "salt": "a62a8b2067bd230fc43816d5c27cf2fc",
      "hash": "28c61110ccb58e01e804218b2a9636ddd9c21fd864e8c8f4a8dcd2b9f5b1d6f6",
      "enabled": true
    },
    {
      "salt": "9b65a739e60a7e85658a29f18ee22951",
      "hash": "345f87a843af1c0451ebfe3464aeab2710bea07f6f2542fe3167847d469029c3",
      "enabled": true
    },
    {
      "salt": "2cb58ee57e9a1851c4bac18932b8aaf8",
      "hash": "504a28bda4638a9e9e2b73aae19d717253af2ca8d28995b73d87c207f6df9478",
      "enabled": true
    },
    {
      "salt": "84ca5a82349d4679505450d3114772c3",
      "hash": "1bec8227242315001ab58fd2873e09c7370ffef5dd40a438b50d0009fdfa9f5e",
      "enabled": true
    },
    {
      "salt": "172874067846f748cc2b538a343c2c8e",
      "hash": "7b1f20a9bcd9e26e1ffc313563138c7772ca348e9d2e6257bb8abe363e9fe583",
      "enabled": true
    },
    {
      "salt": "ebaf47a32f04e314fb380757e27855f0",
      "hash": "6b887f32e219719c3dc05f4bd19a8e7b3890a69291cf6d6863aba9b2ff19a658",
      "enabled": true
    }
  ],
  "marketing": [
    {
      "salt": "bcc93a305de0b2f90314e9c45972203b",
      "hash": "7560510b6299f17047389f66d9449867517fd6a4bdace3c29b5286a045cd623b",
      "enabled": true
    },
    {
      "salt": "78b5af5f2baba74ffda0cfb724c26e0a",
      "hash": "3b2ef61e3377afe19cd0ccb91b30585e7b26c4bfd04259dc7aac48c14113d54a",
      "enabled": true
    },
    {
      "salt": "63904807eb1840f83160d28e4dfaabac",
      "hash": "dfcb1909593263444258ae7db6a223781dca645216d9699967415b01a600b2b8",
      "enabled": true
    },
    {
      "salt": "ca2231f1ca5a0c33e60ebee5e1dba715",
      "hash": "1d66fb54c4f9423fefe28f1793a35206090e85d86f82cafde25c1fe2dbec9307",
      "enabled": true
    },
    {
      "salt": "7a50d66e55a68b498dd2937530e2e171",
      "hash": "e74f06c1d5a6e501a1ac5ee0699fdd86837db89e52cf2d06a6e97a6fe5b22982",
      "enabled": true
    },
    {
      "salt": "51c73877ddc204e5c2d182f02733c085",
      "hash": "57dfcf5c8560d62737ef14c9084b63f0193a55ff179e171df0db5739dce54292",
      "enabled": true
    },
    {
      "salt": "f3c5f45f6575a4184dc9ffd9d95aef87",
      "hash": "9b0d807fcc56b30b2602d448852cb5dde47cfd9099229a13f4e158b9f072c854",
      "enabled": true
    },
    {
      "salt": "ba41cb4ce6739b3eacb1f89f25d62b1e",
      "hash": "35842d3bbe3cce684cc0bdffc273350485e97721e5b7a8a5cfde7d7670ec9bf5",
      "enabled": true
    },
    {
      "salt": "cc634ffd83cf431edf8f443e8b10f51a",
      "hash": "338c95d57aaaa7e173d868830382438d796c10af5b14b9c771ea63fa0c747250",
      "enabled": true
    },
    {
      "salt": "9b77e53cb937f8cbdb5b6e0ad279033d",
      "hash": "018a8aa63b61bd778d24ce59bcd9d9f2727fcfb2dfac920d5a11bb80355530c7",
      "enabled": true
    },
    {
      "salt": "a75ad6c23bcbe541324e41ddc27d3f98",
      "hash": "51d0fb15b811a9ed236308f1ca369da95dbd422301d5dc3e9fa3b05e2bd7ed59",
      "enabled": true
    },
    {
      "salt": "eb1e5f432b9ad2476bca20fa24ae7cc9",
      "hash": "5b58797bba601e1fca76d7d32827dc305e5dd2ae58ddda33123f5bb54571e816",
      "enabled": true
    },
    {
      "salt": "593584a152abf249cc53bc05d33c6004",
      "hash": "6eaff76e6561c07b72bdd43ab8738d77c05fb4291d11dd8761ca28501b763123",
      "enabled": true
    },
    {
      "salt": "68ffb2040ac9f01a264aa179b622ef07",
      "hash": "682263acab66938787788dc68e60905bb40117cc5b0540e41232e9f6c3ced0fd",
      "enabled": true
    },
    {
      "salt": "cb23183ea3eafcf3f1dc4f65d9fcd487",
      "hash": "98ff03750962b269d09ef361f14bf83f414cba3bf9836d9350c0395d3c8b632c",
      "enabled": true
    },
    {
      "salt": "68202f73fe500fafa0fef3100735d7bf",
      "hash": "b8cd935f74843cf4bb7e016c5aa86df9e610ead64472a7fd15efa577c1d85ecd",
      "enabled": true
    },
    {
      "salt": "7bd55eb26c4ab62ee6545262784e7bae",
      "hash": "87b7c00df8b9d4a0a1270b7d4b5db33adc5cd4f3cbe839910e1ac2035bf1890f",
      "enabled": true
    },
    {
      "salt": "8602419e72c8b4fb58666fb825e139cd",
      "hash": "01755c6433232a17407e9bae9022bd131ae3f0eb388ec73351bfa3431ee4d1a9",
      "enabled": true
    },
    {
      "salt": "3ddc91bfc5fe8687b9e3ff345cc26d01",
      "hash": "57060c1e48091ee0b06f5f9acda18173a7e143f26673f404859f7bdc55162d34",
      "enabled": true
    },
    {
      "salt": "229c69485c64ceda898ced3e0f329827",
      "hash": "53c290107b6393718b4de89a6a879677fe22b796bd9c756c004542ff40cd6a1c",
      "enabled": true
    },
    {
      "salt": "4aa3eef00f359f69aa0be2354d06aaef",
      "hash": "6922145b3c8ca35538f3b08c45eaf306283a15c191fa54c9e697e72bc991fa8e",
      "enabled": true
    },
    {
      "salt": "f4b8ab03ac52db6e39017ec654eb3e69",
      "hash": "5f923fe8db94ed922c233b14cd15843a44c8141ce039f7ba7006c6271a45da22",
      "enabled": true
    },
    {
      "salt": "717b15195a2469b6361962f39452fe8b",
      "hash": "105c2002691298f435f8399cce5d63b86a11807ef057b2b2f01d3616b7d8bd34",
      "enabled": true
    },
    {
      "salt": "715af056f679a71b842e2f84d85d519f",
      "hash": "78f95612f5f2e5972e738dfe682a3e4fdce164daa3db0c2ceda64df106202211",
      "enabled": true
    },
    {
      "salt": "9ccd13573c5619e251ea94ac7b057df3",
      "hash": "a0cc1e331f0f3396800e174de9015720059cf9260625992f1f0664bc9ed92947",
      "enabled": true
    },
    {
      "salt": "d8d2f2c1a9132240e9f2ef8bf35e51cc",
      "hash": "4c27ef41f5ad52c3bcc19ba284659fdf2f48cbb376e68c03f5860e8a6c7a1bc4",
      "enabled": true
    },
    {
      "salt": "934819754edc41af95647d08178810b8",
      "hash": "686fb3ff4555cac4c4c23f1769b133ad001d0000822891cce9b3009c76b1f6a5",
      "enabled": true
    },
    {
      "salt": "c0833063ae6d6168a2ca2b2725f16db3",
      "hash": "cfca54c6f98e1f7c5fa73828a34e1c2044210abec095f20923a6192e91eec55c",
      "enabled": true
    },
    {
      "salt": "12207f119e447161debd0dddc7ffbd36",
      "hash": "a793aad8815daef192f3968bc6f3bf62ad82e9f2f295f4cb2db64ef59075e11d",
      "enabled": true
    },
    {
      "salt": "c778727d3822174969f150374c5f4fd5",
      "hash": "d083d32a85a34ef352dee803a61a5079a69b375725625973535548e398d596a2",
      "enabled": true
    },
    {
      "salt": "fd2f754a2f0dd8654ee6e9141633fc77",
      "hash": "75a06655efe8491522f801c58b5f3fe190898df373550f9f94c9c130e4a93ea9",
      "enabled": true
    },
    {
      "salt": "985356e0a9da1b468c04c8c4a65759d8",
      "hash": "ca1c0bfe227583e8da38d0956b10c5f2576745504715af405c1437169831986e",
      "enabled": true
    },
    {
      "salt": "2c899073dacd6baf0b822407271dbf2a",
      "hash": "e13662d9a67aaa8917e1279acb067599c91aee2531b239112515666367d4bed2",
      "enabled": true
    },
    {
      "salt": "01821cce221afcb35759a762d368f76c",
      "hash": "b675216dec06f6602aa2a8b511bc8654623a080a36c554a26939e6001980fdfe",
      "enabled": true
    },
    {
      "salt": "a7fc8d81e1651bfb0d75648634b540da",
      "hash": "1ec2c35caeafb8552375ec14f18e40179e52514dc9bb3a9f56e66451aabc8ea0",
      "enabled": true
    }
  ],
  "english": [
    {
      "salt": "f53922ea78cdc897efa37fa09735d186",
      "hash": "dee8dffe71a54ac68f63083c5068c3f87bba6394b5d80b8c7f65bb0359a57af2",
      "enabled": true
    },
    {
      "salt": "925101d4d6c541cdfc08773e6f0bbbe2",
      "hash": "43bad639d0b7c7cfa091cef6248989a7a3a0f5f36defde1b260dc2841d32cfc9",
      "enabled": true
    },
    {
      "salt": "7cbf276334fa24725e92721fa40fc33f",
      "hash": "d0069c5888adba43845246eb99bb2e88a5c4903225ef6ba90501a0cee278071a",
      "enabled": true
    },
    {
      "salt": "ac28041bf0bdfb66a202328a92646ed9",
      "hash": "acb190d0cbc5982e4998c253df0502d804d82c4a2eb9acba8b9f817e4c131d72",
      "enabled": true
    },
    {
      "salt": "4e0ec7788f1f93942c70605fb46df8e0",
      "hash": "1b87bb5ca2bbb5621e946938644ccb8e8b34f6139f247c07160946442b569ee2",
      "enabled": true
    },
    {
      "salt": "f9b68e0df6e87d835b32fbf9618e8527",
      "hash": "93265276902407ec466944a205221e7a5692ad0e7504e2a136b35508cb0bc2d6",
      "enabled": true
    },
    {
      "salt": "42649e48e8b693b990f24648309526f0",
      "hash": "eb9219aacc6f58a104778c88bf495f669f9a2deafeb09389bb43a2e143f45ae3",
      "enabled": true
    },
    {
      "salt": "855dcc8c92436845c9099af098c679bd",
      "hash": "3adcdf579c2dea18aae62b141d0185f6ab5beceade1dfe049f169546a6c8e6aa",
      "enabled": true
    },
    {
      "salt": "3bd7dd657c3e9f00a4d58a07e9ea18a8",
      "hash": "9748cf91e522879b2333e4ce17cc546005b2f5cb298026e4d19b7b4935daa9ce",
      "enabled": true
    },
    {
      "salt": "db4b5dd9afd113ea8390b0494ad7b7fb",
      "hash": "94813140639b3f81663b03dc299dfb1339bde87e28dac7017800152e9d8fbae4",
      "enabled": true
    },
    {
      "salt": "e783b9ac033f571d6ec48235edfb8ab1",
      "hash": "3d174a9cfe5c7ba7919d53409a8f69847d5380331946d21043261cf81760154b",
      "enabled": true
    },
    {
      "salt": "862588d779b095a1e6c0169772df0c92",
      "hash": "818d6d441ff35389b81f05ebbefea20132713f4b8b63b165880907840451ed84",
      "enabled": true
    },
    {
      "salt": "068327214d18f4141eaa7fb135322ef5",
      "hash": "1328bfb36ab110c078ca8b5f1f0006f0c87fa258cfdb94e748cac8c189f6e0fc",
      "enabled": true
    },
    {
      "salt": "3db8b80e35869f0bd70e2ca1c72370ed",
      "hash": "2d05c28dfd9b4c438e5beb0947f9f5caffaad95730dd64e56eb461ace9f5f8a1",
      "enabled": true
    },
    {
      "salt": "1c9f6a492a911c02dec9364e115bd084",
      "hash": "d0c85f7052c7fb7b387f2dbe489c2366bf24ba63015ea082de6c53848dd9caa3",
      "enabled": true
    },
    {
      "salt": "daee9ec27de56880de54c6f9ab764344",
      "hash": "031a857448c3742f9fbf3651bff4e70dc108666aab5ed6dd95152b9a09335e64",
      "enabled": true
    },
    {
      "salt": "6c2b13d1d51fceb629ad14a80e4ddad2",
      "hash": "78fd22cc6efcc305eb5c6a101cdcbbc399ccc435aee795a7337f5596f02abbbd",
      "enabled": true
    },
    {
      "salt": "083cadb42762c94d454704b6bea704ad",
      "hash": "94c979fdac0aeedc9aad9469458434db0d1a3268005cd45b5eed85a6471612eb",
      "enabled": true
    },
    {
      "salt": "c3b7bbfa058185d58e979f3364e12ba7",
      "hash": "2a2959ca46f9f950310192d8d3b8acc58a4418f34762e56931bf15df640ccccb",
      "enabled": true
    },
    {
      "salt": "db3b27b7531afebcf4e3edf21507dffb",
      "hash": "a02e218f4cdb6387757e3d30d8217eca894b0251870f76fca76a54c0c13f2c25",
      "enabled": true
    },
    {
      "salt": "a4ae50cf087cf0bf1e023369d1f93865",
      "hash": "f404f00fe41aff1ad840aa2c60f55e51bc054a2377ffbe0715d80d2f69436c88",
      "enabled": true
    },
    {
      "salt": "7fa9b66b85c09ff9e3cbbe644a597ca5",
      "hash": "f13e2173be218561a21c702699e1ecb05dbfc49418f4b8a50f0a884ac3951806",
      "enabled": true
    },
    {
      "salt": "e75cd3ec333a423803ac0475cfca5010",
      "hash": "dfa86bd31f21f485ac50fd4db28d3f5d9a0f12ac8c2f7e03fb35d5af7b783211",
      "enabled": true
    },
    {
      "salt": "3032d34e2597d6000906ed99f7856793",
      "hash": "4d18c45656e387314464c6cf9aea4cf7dfde57853ebbf17a5734e7a0a2b85d8c",
      "enabled": true
    },
    {
      "salt": "2ffc960d3adf09afde4c980b61aee179",
      "hash": "cb4fae2f5248f876be3c5232305fab94eae161309fadf3ae440d91a3eaf09bcc",
      "enabled": true
    },
    {
      "salt": "b746294f09c6ba256209b4ecb7c273a6",
      "hash": "91306527c0b473e0d6223792d9f1f0fc105d13442cabe435afb9ea70b717fc57",
      "enabled": true
    },
    {
      "salt": "3b0e402a06fba971163a48883cf0b1a9",
      "hash": "475f5f62dab6d2a1d24922bae69fbd70b9e19ee56ead9f43daf9dea752184bd2",
      "enabled": true
    },
    {
      "salt": "5a2a9e99fb2e206f435ba92877c996bc",
      "hash": "3a30d732b9539fe3af1484bca5138563bed9f14c6ff11c52573c1469004edf00",
      "enabled": true
    },
    {
      "salt": "ceab98232463075e7bc0a3e4164b3cee",
      "hash": "0b8d9051ae6f7508eac9bdd2987307baef4968abb5bc201597548724d36300c0",
      "enabled": true
    },
    {
      "salt": "8715109db0223c7b4f73e4f795fa5c2a",
      "hash": "3a79ff42f984efc3e980adb326266567dd254cefe4e538818079b22dadaf2979",
      "enabled": true
    },
    {
      "salt": "27fe72fbaa51a9f5c1adacb93b10aa15",
      "hash": "1f3489fc7495551ef1e9b6b1a33e3874566bed52f63c4c514f6df4c9dd9565ec",
      "enabled": true
    },
    {
      "salt": "dc89fd174516d8ecc8beb49f4e0c9f3e",
      "hash": "c22396112972c92d1b19e851f90b45b5af374004d5dd232c78e79357a8b5449c",
      "enabled": true
    },
    {
      "salt": "8a0e4180e2ec6b3bae9b9afd6709c92b",
      "hash": "12bb95af7e5e8564be833cb6ebfc8aa27683937403c0009f9c42868e9f5da69f",
      "enabled": true
    },
    {
      "salt": "bd28c302bbc880f6e13fe8701e228f01",
      "hash": "b9e6267177fe2105cb5e5673b4ebdc8730ae97f798599ff48a0e3b5665170843",
      "enabled": true
    }
  ]
};
