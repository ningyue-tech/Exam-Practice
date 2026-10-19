/**
 * 仅含名单校验值，不含明文姓名、手机号。
 * 使用 node scripts/manage-whitelist.mjs 维护，勿手工加入个人资料。
 * 每条记录随机盐 + PBKDF2-SHA-256（600000次）。
 * 校验值仍可能被离线猜测；纯前端入口不能替代服务端认证。
 */
window.EXAM_WHITELISTS = {
  "version": 2,
  "algorithm": "PBKDF2-SHA-256",
  "iterations": 600000,
  "sessionHours": 12,
  "auto": [
    {
      "salt": "4bdbc29d2b7e36becef1245294dd6a62",
      "hash": "0dda73aa747c652692cded2f770ad60c456e1b46652f5c806a4ac8a995933e22",
      "enabled": true
    },
    {
      "salt": "04511208bcfe99f0332b73a718032d57",
      "hash": "e4de6c43b79e1070b1cd8230b90664f42d937d79a0a69e08064a3186dfeb1990",
      "enabled": true
    },
    {
      "salt": "0c023e5d8c7519662f3be4a6b6aa9165",
      "hash": "6fed5507fb6ceb980b295b4c02b81da10fa3020dee9b30a538f24d728169f247",
      "enabled": true
    },
    {
      "salt": "09effa55d6fa91f27217445dbc1ab492",
      "hash": "53b8e680fd3e1da5ad2f1208cb019205612f00071a0c37471facaf6e615fd988",
      "enabled": true
    },
    {
      "salt": "9aaf0a9ec4e7a0e192d80ac92e4a20be",
      "hash": "3d36e2883b8062c22e974d5908e8d736b6425ed850866a53a92d612dbb778381",
      "enabled": true
    },
    {
      "salt": "c89315b8415bb475e128a0dee429f015",
      "hash": "06f8ed3e926d6f9e4fa2a17207d839d470a9c00635d7293ee20e691cc7419867",
      "enabled": true
    },
    {
      "salt": "77b72c7d1ed3bec044ca8632b7e70c1c",
      "hash": "01bd843fe40af23f5f00371bf467241abea0c3cacaea5398783f099c5b597171",
      "enabled": true
    },
    {
      "salt": "d178ddc0a0216ed84e587188b47eae46",
      "hash": "3d8a3d7ac298d84277539ffa735c606dba2559ac717d205588112c1713b033da",
      "enabled": true
    },
    {
      "salt": "4c974a33a7b8609d4d15f22fac886bc2",
      "hash": "c281a2746a14afd1813eeae9852b72165ca0e3339527c45700dde302854db5f9",
      "enabled": true
    },
    {
      "salt": "e0a4ad378dd07d3507d86eed10dc995d",
      "hash": "6710c13ff86436f4b86333e40e78a8fc628d594dc3e1d35ecd574020a67a93c7",
      "enabled": true
    },
    {
      "salt": "55012b7422f9812e572eef0bb67e7b3d",
      "hash": "0e5e35a646be99865be9082ffbfd5cff8ea1b9d9a24d699bea4e1ae40e9a716c",
      "enabled": true
    },
    {
      "salt": "2c7312b44994b3d305a7351b149b852e",
      "hash": "75e388a73b2f89068e89134f2a3fe4c0a58b0a29fee1f7c6070149fbc48c6419",
      "enabled": true
    },
    {
      "salt": "9e00992f5c1b41dcd76ab5033df45682",
      "hash": "661c8183e22efb08564f44e80d6617d7c31879d8331def796e8851d2cd2ce82a",
      "enabled": true
    },
    {
      "salt": "549a0fb57f11abdd3ad1853b7bac3ca8",
      "hash": "8aa38da4b512293dd704a221e9c71b75b2cc86dab96dd3ac33fa3c0daff0d53b",
      "enabled": true
    },
    {
      "salt": "69a172e4b1e9b325f3493a9cb504f3a0",
      "hash": "40845f6845ef6e29efd7e405de86bd377437ed334dc039d5b38e462e5605a3a2",
      "enabled": true
    },
    {
      "salt": "3337b97f9568c27eecdb0825db457fa4",
      "hash": "4d7c778c83d70897755468da255e65afb700dcab3bbafd4941ca574523e8d761",
      "enabled": true
    },
    {
      "salt": "2805705b42283a409fd8dfeef2ddf48e",
      "hash": "7d427af75b48d1cd720f26a209153338b9474f6013a5f060629dd7209df1c24f",
      "enabled": true
    },
    {
      "salt": "bbdbe91ee94d8feb38fcc8f14494dc24",
      "hash": "dead82daa19f46e44a7181e952bea0606ccb212996fddde848ae02fadc094f42",
      "enabled": true
    },
    {
      "salt": "b7a53cade6e7ec1b6a09f7facae60957",
      "hash": "0200156e027397f1892cd9f5dd896ae8a5c7d9865888357e6abeb50166d07b79",
      "enabled": true
    },
    {
      "salt": "77344daf168cd78cd9e2cd391057191d",
      "hash": "06e54e8e56726dac3ec4806b84fecc1763b47845a787bdf3c94711ca1adf96a8",
      "enabled": true
    },
    {
      "salt": "2594581e23470022043af2c8f743c43f",
      "hash": "d2360287c69d46893689e183eedd49922bc9a27f4dfd38c81313f4e2e9fd9f60",
      "enabled": true
    },
    {
      "salt": "c6944c3c9ba135b104e7d8bd8f1fb03d",
      "hash": "1003e88e68ede7d8230dcfc9dceb18473e79f262610158afedc0b7d46db32abb",
      "enabled": true
    },
    {
      "salt": "2556760979c4e52d3de7beb5176305b8",
      "hash": "5d3124bf327acf759955a19ca466895beaf7401663291a4d812a00d5971a15e4",
      "enabled": true
    },
    {
      "salt": "bdef3d277756f522a6fd19bcc225ec96",
      "hash": "2fe225c1dd11f7c10aed86abb6f1b7d99cac0d4db6e183a6d1a5cb6f1cda1606",
      "enabled": true
    },
    {
      "salt": "058e3ab7e7810cd76585af57a370a3c6",
      "hash": "e3a2a64b4a82c98feb87f5427b70b3a2ea10e7ad532e6313f29aa6c6ecef17f4",
      "enabled": true
    },
    {
      "salt": "eef314036507e74a8b537f1621b31ada",
      "hash": "59b07a2e29e4b3fbe37e045a11e120c63b100158377cadc0d302872abd905dc9",
      "enabled": true
    },
    {
      "salt": "4e99bf29011c55266aefdabd3d9031b4",
      "hash": "af84f3d0ef4f59ca26600d0553ba3ddaa856aafdeb42eb90f6949cab1070978a",
      "enabled": true
    }
  ],
  "marketing": [
    {
      "salt": "079c577a2a241966e9b02a2514f4d077",
      "hash": "42c1cdac1eca776652baacf7b88509a5b1675d5b1c7417cf043fd2299d0ac663",
      "enabled": true
    },
    {
      "salt": "03b722f3ae3e7c9b111e1891543a3d5f",
      "hash": "e4d243f87ca8b1e7f7ca060921040f59dd920f1c6cc45e7ae97e15b2cc1b5e37",
      "enabled": true
    },
    {
      "salt": "bddb4a37291db909479cb081bb919dc9",
      "hash": "c749885e024f63b2609e68d4013b211c534417d94ca94a4baa18eaf7e5d33a91",
      "enabled": true
    },
    {
      "salt": "2a19cb6af28fe05456974c63a7198cb3",
      "hash": "cfb7141ddfad8ad56e7b9150a7e94fb35b1c629181bf937e2eecffaa0523506d",
      "enabled": true
    },
    {
      "salt": "e821c45efbd844c44d6104a2215cb637",
      "hash": "2c2c207712439668ce52b6fc8b1fd879a229f474e31b81b8dca7cebce28c4b26",
      "enabled": true
    },
    {
      "salt": "67446e051506783d86e57af8a9c07dcb",
      "hash": "7dcf33046c3e401a3e2e3788a2ff07d89d9d42a57f8daf2bfd25d9e3b314d7e6",
      "enabled": true
    },
    {
      "salt": "ad498026d3ee0fedf53a38380c30873a",
      "hash": "93d612d19c609f3c8ba8cc23f932d945d90ed3cee1268ac13d9ef60c58c7277c",
      "enabled": true
    },
    {
      "salt": "8dc0114a9b8741966e0f0f0e06282b7e",
      "hash": "288d65fd27c72ca2eb39d799542fb244e9c637d8038f8cb56140488b01db6891",
      "enabled": true
    }
  ],
  "english": [
    {
      "salt": "b51d360763036662e55d8fd2a9ca6bac",
      "hash": "325b0467419eb261b725846f94a855ac31136dfa2fd6a0e819ac66d2ec39f6f1",
      "enabled": true
    }
  ]
};
