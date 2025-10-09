const axios = require('axios').default;
const fs = require('fs');
const FormData = require('form-data');
const tough = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

(async () => {
  try {
    const jar = new tough.CookieJar();
    const client = wrapper(axios.create({ baseURL: 'http://localhost:5501', jar, withCredentials: true }));
    // login
    const loginRes = await client.post('/api/login', { email: 'hamedanian79@gmail.com', password: 'mahdi0011!' });
  console.log('login res data:', loginRes.data);
  console.log('login headers set-cookie:', loginRes.headers['set-cookie']);
  // show cookies in jar
  const cookies = await jar.getCookies('http://localhost:5501');
  console.log('cookies in jar after login:', cookies.map(c=>c.cookieString()));
    // build form
    const form = new FormData();
    form.append('submitter_full_name', 'Test User');
    form.append('contact_email', 'test@example.com');
    form.append('track', 'defense');
    form.append('idea_title', 'Test Idea');
    form.append('executive_summary', 'This is a test summary that is long enough to pass validation. '.repeat(5));
    form.append('team_members[0]', 'Alice');
    form.append('pdf_file', fs.createReadStream(__dirname + '/dummy.pdf'));
    form.append('word_file', fs.createReadStream(__dirname + '/dummy.docx'));

    const submitRes = await client.post('/api/submit-idea', form, { headers: form.getHeaders() });
    console.log('submit res status:', submitRes.status, 'data:', submitRes.data);
  } catch (err) {
    if (err.response) {
      console.error('Response error:', err.response.status, err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
})();
