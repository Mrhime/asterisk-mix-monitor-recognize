import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { RecognizeDto } from './dto/recognize.dto';
import * as fs from 'fs';
import { HttpService } from '@nestjs/axios';
import { join, resolve } from 'path';
import * as jose from 'node-jose';

import { ConfigService } from '@nestjs/config';
import { response } from 'express';
const EasyYandexS3 = require('easy-yandex-s3');

@Injectable()
export class RecognizeService {
  private readonly logger = new Logger(RecognizeService.name);

  private IAMToken: string;
  private folderId: string;
  private s3: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.folderId = this.configService.get('YA_FOLDER_ID');
    setTimeout(() => {
      this.updateIAMToken();
    }, 1000);

    setInterval(() => {
      this.updateIAMToken();
    }, 1000 * 60 * 60);

    this.s3 = new EasyYandexS3({
      auth: {
        accessKeyId: this.configService.get('YA_ACCESS_KEY_ID'), //'YCAJEGkZx-cEtoB7FfGuLzQbN',
        secretAccessKey: this.configService.get('YA_SECRET_ACCESS_KEY'), //'YCOmBq9hQtkCWRuegT8OU8vT4x7a5M7pqyswo-kY',
      },
      Bucket: this.configService.get('YA_BUCKET'), // например, "my-storage",
      debug: false, // Дебаг в консоли, потом можете удалить в релизе
    });
  }

  async updateIAMToken(): Promise<void> {
    const key = fs.readFileSync(join(__dirname, '../../YANDEX'));

    //'<идентификатор_сервисного_аккаунта>';
    const serviceAccountId = this.configService.get('YA_SERVICE_ACCOUNT_ID');

    //'<идентификатор_открытого_ключа>';
    const keyId = this.configService.get('YA_PRIVATE_KEY_ID');
    const now = Math.floor(new Date().getTime() / 1000);

    const payload = {
      aud: 'https://iam.api.cloud.yandex.net/iam/v1/tokens',
      iss: serviceAccountId,
      iat: now,
      exp: now + 3600,
    };

    jose.JWK.asKey(key, 'pem', { kid: keyId, alg: 'PS256' }).then((result) => {
      jose.JWS.createSign({ format: 'compact' }, result)
        .update(JSON.stringify(payload))
        .final()
        .then((result) => {
          // result — это сформированный JWT.
          this.httpService.axiosRef
            .post('https://iam.api.cloud.yandex.net/iam/v1/tokens', {
              jwt: result,
            })
            .then(({ data }) => {
              this.IAMToken = data.iamToken;

              try {
                fs.writeFileSync('IAM_TOKEN', data.iamToken);
              } catch (err) {
                this.logger.error(err);
              }
            })
            .catch((e) => {
              this.logger.error(e.toString());
            });
        });
    });
  }

  timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async recognizeByPath(dto: RecognizeDto): Promise<any> {
    if (fs.existsSync(dto.file)) {
      const file = {
        buffer: {},
      };

      file.buffer = await fs.readFileSync(dto.file);
      return this.recognizeLong(file, dto);
    } else {
      this.logger.error('Not upload, please check path file!');
      throw new BadRequestException('Not upload, please check path file!');
    }
  }

  /**** Recognize long **/

  async recognizeLong(file, dto: RecognizeDto): Promise<any> {
    const fileName = `${dto.id}-${Date.now()}.wav`;
    const { Location } = await this.s3.Upload(
      {
        buffer: file.buffer,
        body: fileName,
      },
      '/',
    );
    if (!Location) {
      this.logger.error('Not upload, please check cloud settings!');
      throw new BadRequestException('Not upload, please check cloud settings!');
    }

    // .mp3  mimetype: 'audio/mpeg',
    // .wav   mimetype: 'audio/wave',
    let audioEncoding = 'LINEAR16_PCM';
    if (file.mimetype === 'audio/mpeg') {
      audioEncoding = 'MP3';
    }

    const { data, status } = await this.httpService.axiosRef.post(
      'https://transcribe.api.cloud.yandex.net/speech/stt/v2/longRunningRecognize',
      {
        config: {
          specification: {
            languageCode: 'ru-RU',
            model: 'general:rc',
            // audioEncoding: 'LINEAR16_PCM',
            audioEncoding: audioEncoding, //'MP3',
            sampleRateHertz: 8000,
            audioChannelCount: 2,
          },
        },
        audio: {
          uri: Location,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${this.IAMToken}`,
        },
      },
    );

    if (status !== 200) {
      this.logger.error('Not recognize, please check cloud settings!');
      throw new BadRequestException(
        'Not recognize, please check cloud settings!',
      );
    }

    const { id } = data;
    return await this.runLongRunningRecognizeGetResult(id, fileName);
  }

  async runLongRunningRecognizeGetResult(id: string, fileName: string) {
    while (true) {
      await this.timeout(5000);
      const res = await this.longRunningRecognizeGetResult(id, fileName);
      if (res.done === true) {
        return res;
      }
    }
  }

  private async longRunningRecognizeGetResult(
    id: string,
    fileName: string,
  ): Promise<any> {
    const { data, status } = await this.httpService.axiosRef.get(
      `https://operation.api.cloud.yandex.net/operations/${id}`,
      {
        headers: {
          Authorization: `Bearer ${this.IAMToken}`,
        },
      },
    );

    if (status === 200 && data.done === true) {
      const res = {
        done: data.done,
        items: [],
      };

      if (data.response.chunks) {
        res.items = data.response.chunks.map((chunk) => {
          const item = {
            channelTag: chunk.channelTag,
            alternatives: [],
          };

          if (chunk.alternatives) {
            item.alternatives = chunk.alternatives.map((a) => {
              return {
                text: a.text,
                confidence: a.confidence,
              };
            });
          }
          return item;
        });
      }

      const remove = await this.s3.Remove(fileName);
      if (remove === false) {
        this.logger.error('Not removed, please check cloud settings!');
      }
      return res;
    }

    return { done: false };
  }
}
