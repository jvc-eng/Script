(async () => {
  const TARGET_URL = "http://cnc07api.cnc07.com/api/cnc07iuapis";
  const ENV_URL = "https://raw.githubusercontent.com/Alex0510/Eric/master/surge/Script/evn.js";
  const UTILS_URLS = [
    "https://cdn.jsdelivr.net/gh/xzxxn777/Surge@main/Utils/Utils.js",
    "https://raw.githubusercontent.com/xzxxn777/Surge/main/Utils/Utils.js",
    "https://gitlab.com/xzxxn777/Surge/-/raw/main/Utils/Utils.js"
  ];

  const key = "1kv10h7t*C3f8c@$";
  const iv = "a$61&bxb5n35c2w9"; 

  try {
    const Env = await loadRemoteModule("Env_Cache", ENV_URL, "Env");
    const $ = new Env("🧪SS提取转换");

    console.log("🔔开始请求与解密");

    const raw = await get(TARGET_URL);
    const json = JSON.parse(raw);
    const encrypted = json.servers;
    if (!encrypted) return $.done({});

    const utils = await loadUtilsWithFallback();
    const CryptoJS = utils.createCryptoJS?.();
    if (!CryptoJS) throw new Error("CryptoJS 初始化失败");

    const decrypted = AES_Decrypt(encrypted, key, iv, CryptoJS);
    if (!decrypted) {
      console.log("⚠️ 解密失败或内容为空");
      return $.done({});
    }

    const content = decrypted.startsWith("z") ? decrypted.slice(1) : decrypted;

    const ssRegex = /SS\s*=\s*ss\s*,\s*([\d.]+),\s*(\d+),encrypt-method=([\w-]+),password=([\w\d]+)/g;
    const results = [];
    let match;

    while ((match = ssRegex.exec(content)) !== null) {
      const [_, ip, port, method, password] = match;
      const formatted = `${method}:${password}@${ip}:${port}`;
      const base64Str = utils.base64Encode?.(formatted) || CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(formatted));

      // 尝试提取 city，如果匹配不到就标记 Unknown
      const cityMatch = new RegExp(`${ip}.*?"city":"([^"]+)"`).exec(content);
      const cityName = cityMatch ? cityMatch[1] : "Unknown";

      const final = `ss://${base64Str}#${cityName}`;
      results.push(final);
    }

    if (results.length) {
      console.log("✅ Eric提取结果：");
      results.forEach(r => console.log(r));
      $.msg("🧪SS节点转换成功", "", results[0]); // 只通知第一个
    } else {
      console.log("⚠️ 未提取到任何 SS 节点");
    }

    return $.done({});
  } catch (e) {
    console.log("❎ 脚本异常:", e.message || e);
    typeof $ !== "undefined" ? $.done({}) : $done({});
  }

  function AES_Decrypt(data, key, iv, CryptoJS) {
    try {
      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: CryptoJS.enc.Base64.parse(data) },
        CryptoJS.enc.Utf8.parse(key),
        {
          iv: CryptoJS.enc.Utf8.parse(iv),
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      );
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (e) {
      console.log("❌ AES 解密异常:", e.message || e);
      return null;
    }
  }

  async function loadUtilsWithFallback() {
    for (const url of UTILS_URLS) {
      try {
        const utils = await loadRemoteModule("Utils_Cache", url, "creatUtils");
        if (utils) return utils;
      } catch (e) {
        console.log(`⚠️ Utils 加载失败 ${url}: ${e.message}`);
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
      console.log("⚠️ 模块 eval 错误:", e.message);
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
