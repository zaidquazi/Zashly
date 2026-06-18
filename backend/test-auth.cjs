const axios = require("axios");
const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");

const jar = new CookieJar();
const client = wrapper(axios.create({ jar, withCredentials: true }));

async function testAuth() {
  try {
    const res = await client.post("http://localhost:5002/api/auth/login", {
      username: "zashlytester",
      password: "Password123!"
    });
    console.log("Login success:", res.data.success);
    
    // Check cookies
    const cookies = await jar.getCookies("http://localhost:5002");
    console.log("Cookies saved in jar:");
    cookies.forEach(c => console.log(c.toString()));

    // Now let's try /auth/me without jwt (simulating expired jwt)
    console.log("\nSimulating expired JWT...");
    const filteredCookies = cookies.filter(c => c.key !== "jwt");
    jar.removeAllCookiesSync();
    for (const c of filteredCookies) {
      await jar.setCookie(c, "http://localhost:5002");
    }
    
    // Check if we can refresh
    console.log("\nAttempting refresh...");
    const refreshRes = await client.post("http://localhost:5002/api/auth/refresh");
    console.log("Refresh success:", refreshRes.data.success);
    
    const newCookies = await jar.getCookies("http://localhost:5002");
    console.log("New cookies saved in jar:");
    newCookies.forEach(c => console.log(c.toString()));

  } catch (err) {
    if (err.response) {
      console.error("HTTP Error:", err.response.status, err.response.data);
    } else {
      console.error("Network Error:", err.message);
    }
  }
}

testAuth();
