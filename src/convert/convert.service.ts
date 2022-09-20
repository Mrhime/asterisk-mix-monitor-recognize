import { Injectable, Logger } from '@nestjs/common';
import { DatePathDto } from './dto/date-path.dto';
import * as fs from 'fs';
import { FileConvertTypeDto } from './dto/file-convert-type.dto';
import * as SoxAsync from 'sox-async';
import { Lame } from 'node-lame';
import { Cron } from '@nestjs/schedule';
import { getDatePath } from '../asterisk/asterisk.utils';
@Injectable()
export class ConvertService {
  constructor(private readonly logger: Logger) {}
  private sox = new SoxAsync();
  private delayCronDaysConvert = 1;
  @Cron('00 02 * * *')
  async handleCron() {
    const path = getDatePath(this.delayCronDaysConvert);
    await this.convertPath(new DatePathDto(path));
  }
  async convertPath(datePathDto: DatePathDto) {
    const directoryFiles = await this.getRecords(datePathDto);
    const basePath = '/home/alex/www/test_recognize/';
    const files: Array<FileConvertTypeDto> = [];

    const rFiles = [];
    const tFiles = [];
    directoryFiles.forEach((f) => {
      if (f.indexOf('r_') !== -1) {
        rFiles.push(f);
      }
      if (f.indexOf('t_') !== -1) {
        tFiles.push(f);
      }
    });

    rFiles.forEach((r) => {
      const f = r.substring(2, r.length);
      const t = tFiles.find((e) => e.indexOf(f) !== -1);
      files.push(new FileConvertTypeDto(r, t, f, basePath + datePathDto.path));
    });
    if (!files) {
      this.logger.error('no Converted, no Files', {
        file: files,
      });
      return false;
    }
    for (const file of files) {
      await this.convertMp3(file);
    }
    return files.length;
  }

  async convertMp3(data: FileConvertTypeDto) {
    const res = await this.merge(data);
    if (res) {
      data.outSox = res;
      try {
        await new Lame({
          output: data.outSox.replace('.wav', '.mp3'),
          bitrate: 16,
        })
          .setFile(data.outSox)
          .encode();
        await this.unlinkFile(data.outSox);
        await this.unlinkFile(data.path + '/' + data.r);
        await this.unlinkFile(data.path + '/' + data.t);
        data.outLame = data.outSox.replace('.wav', '.mp3');
        return data.outLame;
      } catch (e) {
        this.logger.error('no Converted, no Files', {
          data: data,
          err: e,
        });
      }
    }
    return false;
  }

  async merge(data: FileConvertTypeDto) {
    try {
      return await this.sox.run({
        inputFile: [data.path + '/' + data.r, data.path + '/' + data.t],
        outputFile: data.path + '/' + data.f,
        output: {
          bits: 16,
          rate: 8000,
          channels: 2,
          M: true,
          combine: 'merge',
        },
      });
    } catch (e) {
      this.logger.error('no Converted, no Files', {
        data: data,
        err: e,
      });
      return null;
    }
  }

  async unlinkFile(file) {
    await fs.unlinkSync(file);
  }

  async getRecords(path: DatePathDto) {
    const basePath = '/home/alex/www/test_recognize/';
    let directoryFiles = [];
    try {
      directoryFiles = await fs.promises.readdir(basePath + path.path);
    } catch (e) {
      this.logger.error('no Converted, Error Path', {
        path: path,
        err: e,
      });
    }
    if (path.phone) {
      directoryFiles = directoryFiles.filter(
        (file) => file.indexOf(path.phone) !== -1,
      );
    }
    return directoryFiles;
  }
}
