import express from 'express';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
const app = new express();

app.get('/node/recognizeCallRecord', async (req, res) => {
  const filePath = req.query.filePath;
  console.log('--- recognizeCallRecord ---', filePath);

  if (filePath) {
    const bodyFormData = new FormData();
    bodyFormData.append(
      'file',
      fs.createReadStream(
        `/home/alex/www/test_recognize/2022/09/19/${filePath}`,
      ),
    );

    try {
      const { data, status } = await axios.post(
        `http://127.0.0.1:3001/Recognize/recognizeLong`,
        bodyFormData,
        {
          headers: {
            'Content-Type': `multipart/form-data; boundary=${bodyFormData._boundary}`,
          },
        },
      );

      console.log(data);
      res.status(200);
      res.send(data);
    } catch (e) {
      res.status(400);
      res.send(e.toString());
    }
  } else {
    res.status(400);
    res.send('Error: filePath is not exist');
  }

  res.end();
});

app.listen(3003, () => {
  console.log('app listening : 3003');
});
