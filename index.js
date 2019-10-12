require('dotenv').config();
const Fs = require('fs');
const Path = require('path');
const Axios = require('axios');
const ShortId = require('shortid');

const { DOWNLOAD_URL, FILE_FORMAT } = process.env;
const DOWNLOADS_COUNT = Number.parseInt(process.env.DOWNLOADS_COUNT);

function downloadFile(url) {
  const fileName = `_${ShortId.generate()}.${FILE_FORMAT}`;
  const directory = 'downloads';
  const path = Path.resolve(__dirname, directory, fileName);
  const writer = Fs.createWriteStream(path);

  return Axios({
    url,
    method: 'GET',
    responseType: 'stream'
  })
    .then((response) => {
      response.data.pipe(writer);

      return new Promise((res, rej) => {
        writer.on('finish', res);
        writer.on('error', rej);
      })
    })
    .catch((e) => {
      return new Promise((res) => {
        Fs.unlink(path, () => res(e));
      })
    });

}

console.log(`Download URL: ${DOWNLOAD_URL}`);
console.log(`Downloads Count: ${DOWNLOADS_COUNT}`);

const downloads = Array(DOWNLOADS_COUNT).fill().map(() => downloadFile(DOWNLOAD_URL));

Promise.all(downloads)
  .then((results) => {
    const errors = results.filter(r => !!r);
    const error_count = errors.length;
    const success_count = results.length - error_count;
    console.log(`Downloaded ${success_count} times, failed ${error_count} times`);
  })
  .catch((e) => console.error(e.toString()));
