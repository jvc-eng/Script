(async () => {
  const ENV_URL = "https://raw.githubusercontent.com/Alex0510/Eric/master/surge/Script/evn.js";
  const UTILS_URLS = [
    "https://cdn.jsdelivr.net/gh/xzxxn777/Surge@main/Utils/Utils.js",
    "https://raw.githubusercontent.com/xzxxn777/Surge/main/Utils/Utils.js"
  ];

  let $;

  try {
    const Env = await loadRemoteModule("Env_Cache", ENV_URL, "Env");
    $ = new Env("🔐 AES/DES 解密工具");

    // 🚀 弹窗输入数据
    const BASE64_STRING = await $.input("请输入 Base64 加密内容：");
    const KEY_INPUT = await $.input("请输入明文密钥（留空使用 Base64 密钥）：");
    const IV_INPUT = await $.input("请输入明文 IV（留空使用 Base64 IV）：");

    // 🔐 Base64 编码密钥（可自行替换）
    const BASE64_KEY_INPUT = "bWkwamE3bHNiMzBjNDdlNg==";
    const BASE64_IV_INPUT = "QS0xNi1CeXRlLVN0cmluZw==";

    console.log("🧩 准备解密：", BASE64_STRING);

    const utils = await loadUtilsWithFallback();
    if (!utils) throw new Error("Utils 加载失败");
    const CryptoJS = utils.createCryptoJS?.();
    if (!CryptoJS) throw new Error("CryptoJS 初始化失败");

    const keys = [];

    if (KEY_INPUT) {
      keys.push({
        name: "明文密钥",
        key: CryptoJS.enc.Utf8.parse(KEY_INPUT),
        iv: CryptoJS.enc.Utf8.parse(IV_INPUT),
      });
    }

    keys.push({
      name: "Base64 密钥",
      key: CryptoJS.enc.Base64.parse(BASE64_KEY_INPUT),
      iv: CryptoJS.enc.Base64.parse(BASE64_IV_INPUT),
    });

    let success = false;

    for (const item of keys) {
      console.log(`🔑 尝试使用 ${item.name} 解密:`);

      let decrypted = AES_Decrypt(BASE64_STRING, item.key, item.iv, CryptoJS);
      if (decrypted) {
        console.log("✅ AES-CBC 解密结果：\n" + decrypted);
        success = true;
        break;
      }

      decrypted = AES_Decrypt_ECB(BASE64_STRING, item.key, CryptoJS);
      if (decrypted) {
        console.log("✅ AES-ECB 解密结果：\n" + decrypted);
        success = true;
        break;
      }

      decrypted = DES_Decrypt_CBC(BASE64_STRING, item.key, item.iv, CryptoJS);
      if (decrypted) {
        console.log("✅ DES-CBC 解密结果：\n" + decrypted);
        success = true;
        break;
      }

      decrypted = DES_Decrypt_ECB(BASE64_STRING, item.key, CryptoJS);
      if (decrypted) {
        console.log("✅ DES-ECB 解密结果：\n" + decrypted);
        success = true;
        break;
      }
    }

    if (!success) {
      console.log("❌ 所有方式解密失败，请检查密钥/数据是否正确");
    }

    return $.done({});
  } catch (e) {
    console.log("❎ 脚本异常:", e?.stack || e);
    if ($ && typeof $.done === "function") return $.done({});
    if (typeof $done === "function") return $done({});
  }

  function AES_Decrypt(data, key, iv, CryptoJS) {
    try {
      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: CryptoJS.enc.Base64.parse(data) },
        key,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      );
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch {
      return null;
    }
  }

  function AES_Decrypt_ECB(data, key, CryptoJS) {
    try {
      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: CryptoJS.enc.Base64.parse(data) },
        key,
        {
          mode: CryptoJS.mode.ECB,
          padding: CryptoJS.pad.Pkcs7
        }
      );
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch {
      return null;
    }
  }

  function DES_Decrypt_CBC(data, key, iv, CryptoJS) {
    try {
      const decrypted = CryptoJS.DES.decrypt(
        { ciphertext: CryptoJS.enc.Base64.parse(data) },
        key,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      );
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch {
      return null;
    }
  }

  function DES_Decrypt_ECB(data, key, CryptoJS) {
    try {
      const decrypted = CryptoJS.DES.decrypt(
        { ciphertext: CryptoJS.enc.Base64.parse(data) },
        key,
        {
          mode: CryptoJS.mode.ECB,
          padding: CryptoJS.pad.Pkcs7
        }
      );
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch {
      return null;
    }
  }

  async function loadUtilsWithFallback() {
    for (const url of UTILS_URLS) {
      try {
        const utils = await loadRemoteModule("Utils_Cache", url, "creatUtils");
        if (utils) return utils;
      } catch (e) {
        console.log(`⚠️ Utils 加载失败: ${url}: ${e.message}`);
      }
    }
    return null;
  }

  async function loadRemoteModule(cacheKey, url, exportedName) {
    const code = read(cacheKey);
    if (code) {
      const mod = evalModule(code, exportedName);
      if (mod) return mod;
    }

    const script = await get(url);
    if (!script) throw new Error(`${exportedName} 下载失败`);
    write(script, cacheKey);
    const mod = evalModule(script, exportedName);
    if (!mod) throw new Error(`${exportedName} 加载失败`);
    return mod;
  }

  function evalModule(code, exportedName) {
    try {
      eval(code);
      if (exportedName === "Env" && typeof Env === "function") return Env;
      if (exportedName === "creatUtils" && typeof creatUtils === "function") return creatUtils();
    } catch (e) {
      console.log(`⚠️ 模块解析失败: ${e.message}`);
    }
    return null;
  }

  function get(url) {
    return new Promise(resolve => {
      if (typeof $httpClient !== "undefined") {
        $httpClient.get({ url }, (err, resp, data) => {
          resolve(!err && resp.status === 200 ? data : null);
        });
      } else if (typeof $task !== "undefined") {
        $task.fetch({ url }).then(resp => resolve(resp.body), () => resolve(null));
      } else {
        resolve(null);
      }
    });
  }

  function read(key) {
    if (typeof $persistentStore !== "undefined") return $persistentStore.read(key);
    if (typeof $prefs !== "undefined") return $prefs.valueForKey(key);
    return null;
  }

  function write(value, key) {
    if (typeof $persistentStore !== "undefined") return $persistentStore.write(value, key);
    if (typeof $prefs !== "undefined") return $prefs.setValueForKey(value, key);
  }
})();
