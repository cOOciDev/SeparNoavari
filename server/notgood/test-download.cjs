const fs = require('fs');
const axios = require('axios').default;
const tough = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

(async () => {
  try {
    const jar = new tough.CookieJar();
    const client = wrapper(axios.create({ baseURL: 'http://localhost:5501', jar, withCredentials: true, responseType: 'stream' }));
    // login as admin
    await client.post('/api/login', { email: 'hamedanian79@gmail.com', password: 'mahdi0011!' });
    // download idea 2
    const res = await client.get('/api/ideas/2/download');
    console.log('status', res.status, 'headers', res.headers['content-type']);
    const out = fs.createWriteStream('./idea-2.zip');
    res.data.pipe(out);
    out.on('finish', () => console.log('Saved idea-2.zip'));
  } catch (err) {
    if (err.response) {
      console.error('Response error:', err.response.status, err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
})();
