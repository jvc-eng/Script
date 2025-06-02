(async () => {
  const BASE64_STRING = "yhgLegqE3rorpuZk1OJh7ivVlGwTWb8lvw0MiYl0zGyldQ5C6Tk7FCAX6A9lJW3ec7t4g0wWv2UCmaQQOJxjKLoj1CL/B8N7/uyDhzA7a9xwXJRPjSSS+u8Tadq4ZgPrjar+7w/WssX8BEsG9mlonlSk+cDnE7G0ouPTgR7+zG71pQKkGvg28wa9nDy1w9c9R6kGjvuTuWBHDDKLzdCVYJtC/9GbhGaB0udjiq91K3fhE79VeBhhvBckXy+j40IxeGQYRu6KgNRS/i30ZXWjA6RkxPAX9z0Wt4B1gkYbnJf7yJ5C0vmGgQcweI3UddmLEbIeYxEVKwnhcvpXUUBC9jBh5W7BP5h++EmlyNKUptl8IUnR4azlc0qJZ3HXVuOo/dAFilXpFBU+Gj2UGdTUNGCcQtNlOaYcxcZ5PP2jIJk=";//输入base64位加密内容
  const key = "TmPrPhkOf8by0cvx";//输入密钥
  const iv = "TmPrPhkOf8by0cvx";//输入密钥变量

  const ENV_URL = "https://raw.githubusercontent.com/Alex0510/Eric/master/surge/Script/evn.js";
  const UTILS_URLS = [
    "https://cdn.jsdelivr.net/gh/xzxxn777/Surge@main/Utils/Utils.js",
    "https://raw.githubusercontent.com/xzxxn777/Surge/main/Utils/Utils.js",
    "https://gitlab.com/xzxxn777/Surge/-/raw/main/Utils/Utils.js"
  ];

  let $;

  try {
    const Env = await loadRemoteModule("Env_Cache", ENV_URL, "Env");
    $ = new Env("🧪Base64解密");

    const utils = await loadUtilsWithFallback();
    if (!utils) {
      console.log("❌ Utils 加载失败");
      return $.done({});
    }

    const CryptoJS = utils.createCryptoJS?.();
    if (!CryptoJS) {
      console.log("❌ CryptoJS 初始化失败");
      return $.done({});
    }

    const decrypted = AES_Decrypt(BASE64_STRING, key, iv, CryptoJS);
    if (decrypted) {
      console.log("✅ 解密结果：\n" + decrypted);
    } else {
      console.log("⚠️ 解密失败或结果为空");
    }

    return $.done({});
  } catch (e) {
    console.log("❎ 脚本异常:", e && e.stack ? e.stack : e);
    if ($ && typeof $.done === "function") return $.done({});
    if (typeof $done === "function") return $done({});
  }

  function AES_Decrypt(data, key, iv, CryptoJS) {
    const decrypted = CryptoJS.AES.decrypt(
      {
        ciphertext: CryptoJS.enc.Base64.parse(data)
      },
      CryptoJS.enc.Utf8.parse(key),
      {
        iv: CryptoJS.enc.Utf8.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );
    return decrypted.toString(CryptoJS.enc.Utf8);
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