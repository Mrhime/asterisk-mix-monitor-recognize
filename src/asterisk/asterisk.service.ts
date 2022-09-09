import {ConfigService} from "@nestjs/config";
import * as AmiClient from 'asterisk-ami-client';
import {Logger} from "@nestjs/common";
import {getDatePath} from "../utils";

export class AsteriskService {
    readonly amiClient: any

    constructor(private readonly config: ConfigService,
                private readonly logger: Logger) {
        this.amiClient = new AmiClient({
            reconnect: true,
            keepAlive: true,
            maxAttemptsCount: 30,
            attemptsDelay: 1200,
            eventFilter: [
                'SuccessfulAuth',
                'ChallengeSent',
                'PeerStatus',
                'ContactStatus',
                'Registry',
                'RequestNotSupported',
            ],
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
                        // this.logger.log(event);
                    })

                    .on('NewСhannel', (event) => {
                        // console.log(event);
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

    startMixMonitor(event) {
        console.log(event)
        if (event.Uniqueid.indexOf(';2') === -1) {
            let client_phone = ''
            let call_id = event.Uniqueid

            let date_str = getDatePath()
            let file = ''

            if (client_phone) {
                file = call_id + '_' + client_phone + '.wav';
            } else {
                file = call_id + '.wav';
            }

            const dir = date_str
            const tmp_dir = 'tmp'
            const file_r = `${dir}/r_${file}`
            const file_t = `${dir}/t_${file}`
            const file_res = `${dir}/${file}`

            // let options = `r(${file_r})t(${file_t}),/usr/bin/sox /var/spool/asterisk/monitor/${file_r} /var/spool/asterisk/monitor/${file_t} --channels 2 --combine merge /var/spool/asterisk/monitor/${file_res} && rm -f /var/spool/asterisk/monitor/${file_r} && rm -f /var/spool/asterisk/monitor/${file_t} `
            //S - добавлять тишину если файлы разной длинны

            let options = `Sr(${file_r})t(${file_t})`
            // && ! rm -f /var/spool/asterisk/monitor/${file_r}
            // console.log({
            //     file: file,
            //     date_str: date_str,
            //     options: options,
            // })

            this.amiClient.action({
                Action: 'MixMonitor',
                Channel: event.Uniqueid,
                File: '',
                options: options,
                // command: `! rm -f /var/spool/asterisk/monitor/${file_t} `,
            })
        }
    }
    startMixMonitorAction(queue: number) {
        this.amiClient.action({
            Action: 'QueueReload',
            ActionID: 'AmiQueueReload',
            Queue: queue,
            Members: 'yes',
            Rules: 'yes',
            Parameters: 'yes',
        });
    }

}