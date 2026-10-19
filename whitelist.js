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
      "salt": "7f588d1e999156d2af88d51876946110",
      "hash": "eb379e3f4e4f00fb7a546c17bd32aa7aa013ef5f7bc0a903a59b239c375916ae",
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
      "salt": "3114f08c27db3b1d1d33d2a4fcee2551",
      "hash": "4306441fea794c8c398a386ef2146be1e92a6482d8ef56de682da453a977222d",
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
      "salt": "31cd4fa9c6cf229d4a510a4378bf66a2",
      "hash": "f593294527ec2816b2cb6e82a70f4d9076159d5aaa65bb890c48aab06f3a4a43",
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
      "salt": "3dac0effc899d791f5da8dae0a335c2d",
      "hash": "32b4bdc68c2546e47810291da6a7c24b263dc009df7a4c2234c85c37ac1d9a49",
      "enabled": true
    },
    {
      "salt": "7a50d66e55a68b498dd2937530e2e171",
      "hash": "e74f06c1d5a6e501a1ac5ee0699fdd86837db89e52cf2d06a6e97a6fe5b22982",
      "enabled": true
    },
    {
      "salt": "0f3b66ea5299850a3946b2a8d071cc1e",
      "hash": "a7617a54970d9b1a51c97e78d9413c544cf1400973b9e1e86445da0cf2e0298a",
      "enabled": true
    },
    {
      "salt": "309b5d1c963a2610dd8c454a226b955b",
      "hash": "5cbf6bfdb8bcb64870e42333e8de5f8ffeaa15cfb18ab21f9891aff1643c4414",
      "enabled": true
    },
    {
      "salt": "ba41cb4ce6739b3eacb1f89f25d62b1e",
      "hash": "35842d3bbe3cce684cc0bdffc273350485e97721e5b7a8a5cfde7d7670ec9bf5",
      "enabled": true
    }
  ],
  "english": [
    {
      "salt": "f53922ea78cdc897efa37fa09735d186",
      "hash": "dee8dffe71a54ac68f63083c5068c3f87bba6394b5d80b8c7f65bb0359a57af2",
      "enabled": true
    }
  ]
};
