export class FileConvertTypeDto {
  r: string;
  t: string;
  f: string;
  path: string;
  outSox: string;
  outLame: string;
  constructor(
    r,
    t,
    f,
    path = 'var/spool/asterisk/monitor/',
    outSox = '',
    outLame = '',
  ) {
    this.r = r;
    this.t = t;
    this.f = f;
    this.path = path;
    this.outSox = outSox;
    this.outLame = outLame;
  }
}
