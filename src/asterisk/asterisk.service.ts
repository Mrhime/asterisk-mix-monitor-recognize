import { ConfigService } from '@nestjs/config';
import * as AmiClient from 'asterisk-ami-client';
import { Injectable, Logger } from '@nestjs/common';
import { convertEventId, getDatePath } from './asterisk.utils';
import { ContextEnum } from './enum/context.enum';
import * as fs from 'fs';

@Injectable()
export class AsteriskService {
  readonly amiClient: any;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: Logger,
  ) {
    this.amiClient = new AmiClient({
      reconnect: true,
      keepAlive: true,
      maxAttemptsCount: 30,
      attemptsDelay: 1200,
    });
    this.connectAmi();
  }

  connectAmi() {
    this.amiClient
      .connect(this.config.get('AMI_USER'), this.config.get('AMI_PASSWORD'), {
        host: this.config.get('AMI_HOST') || '127.0.0.1',
        port: this.config.get('AMI_PORT') || '5038',
      })
      .then(() => {
        this.logger.log('Ami connected');
        this.amiClient
          .on('response', (response) => {
            this.logger.log(response);
          })
          .on('event', (event) => {
            // this.logger.log(event.Event);
          })

          .on('Newchannel', (event) => {
            this.newChannelHandler(event);
          })
          .on('data', (chunk) => {
            // this.logger.log(chunk);
          })
          .on('connect', () => {
            this.logger.log('Ami connect');
          })
          .on('disconnect', () => {
            this.logger.log('Ami disconnect');
          })
          .on('reconnection', () => {
            this.logger.log('Ami reconnection');
          })
          .on('internalError', (error) => {
            this.logger.log('Ami ', error);
          });
      })
      .catch((error) => {
        this.logger.error(error);
      });
  }

  newChannelHandler(event) {
    if (
      event.Uniqueid === event.Linkedid &&
      event.Uniqueid.indexOf(';2') === -1
    ) {
      const call = {
        id: convertEventId(event.Uniqueid),
        uniqueId: event.Uniqueid,
        clientPhone: null,
      };

      console.log(event);
      if (event.Context === ContextEnum.outbound) {
        call.clientPhone = event.Exten;
      } else if (event.Context === ContextEnum.inbound) {
        call.clientPhone = event.CallerIDNum;
      }
      this.startMixMonitor(call);
      console.log(call);
    }
  }

  startMixMonitor(call) {
    let file = call.id + '.wav';

    if (call.clientPhone) {
      file = call.id + '_' + call.clientPhone + '.wav';
    }

    const dir = 'test_recognize/' + getDatePath();
    const file_r = `${dir}/r_${file}`;
    const file_t = `${dir}/t_${file}`;
    const file_res = `${dir}/${file}`;

    //S - добавлять тишину если файлы разной длинны

    const options = `Sr(${file_r})t(${file_t})`;

    this.amiClient.action({
      Action: 'MixMonitor',
      Channel: call.uniqueId,
      File: '',
      options: options,
    });

    console.log({
      ev: 'startMixMonitor',
      fileOut: file_res,
      option: options,
    });
  }

  async getRecords(path) {
    let files = fs.readdirSync('/home/alex/www/test_recognize/' + path.path);
    if (path.phone) {
      files = files.filter((file) => file.indexOf(path.phone) !== -1);
    }
    console.log(files.toString());
    return files;
  }
}
