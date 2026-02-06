import fp from 'fastify-plugin';
import * as mailer from 'nodemailer';

import { env } from '../config';


class MailerProvider {
    private readonly transport = mailer.createTransport(
        {
            service: 'Gmail',
            auth: {
                user: env.EMAIL_SMTP_USER,
                pass: env.EMAIL_SMTP_PASS
            }
        },
        { from: env.EMAIL_FROM }
    );

    async checkTransporter() {
        await this.transport.verify();
    }

    async sendMail(arg: mailer.SendMailOptions) {
        return await this.transport.sendMail(arg);
    }
}

export default fp((app, options, done) => {
    const provider = new MailerProvider();

    app.decorate('mailerProvider', provider);

    done();
}, { name: 'mailer-plugin' });

declare module 'fastify' {
    interface FastifyInstance {
        mailerProvider?: MailerProvider;
    }
}
