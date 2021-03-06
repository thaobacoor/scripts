const generateCode = (len = 16) => {
  let text = '';
  let possible = '0123456789';
  for (let i = 0; i < len; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const minutes = (num) => num * 60 * 1000

module.exports = { generateCode, sleep, minutes }