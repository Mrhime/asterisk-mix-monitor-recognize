import * as moment from 'moment/moment';
import 'moment-timezone';

export const convertExtensionUsername = (extensionUsername: string): number => {
  return Number(extensionUsername.replace('PJSIP/', ''));
};

export const convertEventId = (id: string): string => {
  if (id) {
    if (id.indexOf('.') !== -1) {
      return id.replace('.', '_');
    }
  }
  return id;
};

export const getTimeStamp = (): number => {
  return moment().unix();
};

export const getDatePath = (delay = 0): string => {
  if (delay !== 0) {
    return moment()
      .tz('Europe/Moscow')
      .subtract(delay, 'days')
      .format('YYYY/MM/DD');
  }
  return moment().tz('Europe/Moscow').format('YYYY/MM/DD');
};
export const normalizePhone = (phone: string): number => {
  return Number(phone.replace(/[^0-9]/g, ''));
};
