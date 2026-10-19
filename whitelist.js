/**
 * 唯一需要维护的名单文件：whitelist.js
 * ----------------------------------------------------
 * auto      = 汽车维修白名单（只允许汽车维修）
 * marketing = 商务营销白名单（只允许商务营销）
 * english   = 英语白名单（只允许英语）
 * 姓名 + 手机号必须在【所选科目】的同一条记录中同时匹配。
 * 同一个人要考多个科目，请把同一条记录分别添加到对应数组。
 * enabled: false 表示停用；删除整行也可以取消该科目的资格。
 * 姓名和手机号请都使用双引号；每条记录后加英文逗号。
 *
 * 重要：本文件会随网页公开下载，不是私有数据库。
 * 以下为演示信息，不发送短信、不验证手机归属。勿填入敏感真实名单。
 * 需要保护真实名单、短信验证、可靠次数限制时必须改用私有后端。
 */
window.EXAM_WHITELISTS = {
  // 本地验证有效期（小时）。不是服务端会话或真实身份验证。
  sessionHours: 12,

  // ① 汽车维修白名单
  auto: [
    { name: "汽车测试", phone: "13800000001", enabled: true },
    { name: "双科测试", phone: "13800000003", enabled: true },
    { name: "张康健", phone: "18551643088", enabled: true },
    { name: "杨志豪", phone: "13584071470", enabled: true },
    { name: "黄博文", phone: "13151050839", enabled: true },
    { name: "胡立", phone: "18251579715", enabled: true },
    { name: "侯诗语", phone: "13912957956", enabled: true },
    { name: "郭昊", phone: "13912957956", enabled: true },
    { name: "林宇晨", phone: "19895853919", enabled: true },
    { name: "王钦龙", phone: "19915400536", enabled: true },
    { name: "皇甫幼天", phone: "13094962418", enabled: true },
    { name: "陈昕奇", phone: "17361890138", enabled: true },
    { name: "顾恺之", phone: "18101590701", enabled: true },
    { name: "王锐", phone: "13222081350", enabled: true },
    { name: "杨希杰", phone: "19291969956", enabled: true },
    { name: "杨豪", phone: "18352486186", enabled: true },
    { name: "尹一名", phone: "17312877559", enabled: true },
    { name: "邓睿轩", phone: "19033770392", enabled: true },
    { name: "苗志成", phone: "19216124640", enabled: true },
    { name: "王慕涵", phone: "17772270028", enabled: true },
    { name: "王坤", phone: "18061495070", enabled: true },
    { name: "王之瑜", phone: "15312450735", enabled: true },
    { name: "刘浩俊", phone: "14762477676", enabled: true },
    { name: "邢智程", phone: "17361983386", enabled: true },
    { name: "舒宝乐", phone: "19156636820", enabled: true },
    { name: "季国豪", phone: "17372968486", enabled: true },
    { name: "陈佩文", phone: "15784055757", enabled: true },
    // 在这里添加汽车维修考生，例如：
    // { name: "考生姓名", phone: "11位手机号", enabled: true },
  ],

  // ② 商务营销白名单
  marketing: [
    { name: "营销测试", phone: "13800000002", enabled: true },
    { name: "双科测试", phone: "13800000003", enabled: true },
    { name: "靳健洋", phone: "17696711236", enabled: true },
    { name: "王钰娇", phone: "19171906946", enabled: true },
    { name: "曹瀚丹", phone: "17749511259", enabled: true },
    { name: "周雨馨", phone: "13052838060", enabled: true },
    { name: "魏薇", phone: "13914496153", enabled: true },
    { name: "周思妤", phone: "16605111748", enabled: true },
    // 在这里添加商务营销考生，例如：
    // { name: "考生姓名", phone: "11位手机号", enabled: true },
  ],
  // ③ 英语白名单，独立授权，不自动继承其他科目名单。
  english: [
    { name: "英语测试", phone: "13800000004", enabled: true },
    // 在这里添加英语考生，例如：
    // { name: "考生姓名", phone: "11位手机号", enabled: true },
  ],
};
