const axios = require('axios');
const AppError = require('../utils/Apperror');

async function getauthtoken() {
  try {
    const formdata = new FormData();
    formdata.append('client_id', process.env.DEEPVUE_CLIENTID);
    formdata.append('client_secret', process.env.DEEPVUE_SECRET_KEY);

    const response = await axios.post(
      'https://production.deepvue.tech/v1/authorize',
      formdata,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.access_token;
  } catch {
    //console.log('error accessing the api call');
    throw new AppError('Failed to get access token from DeepVue API', 500);
  }
}

async function panverify(pan_number) {
  try {
    const token = await getauthtoken();
    console.log(token);
    const response = await axios.get(
      `https://production.deepvue.tech/v1/verification/pan-plus?pan_number=${pan_number}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-api-key': process.env.DEEPVUE_SECRET_KEY,
        },
      }
    );

    //console.log('verification success',response.data)
    return response.data;
  } catch {
    //console.log('error accessing the api call');
    throw new AppError('Failed to verify PAN number', 500);
  }
}

module.exports = panverify;
