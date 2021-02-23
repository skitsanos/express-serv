import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';
import * as dayjs from 'dayjs';
import * as cfg from 'config';

interface BuilderConfig
{
    appName: string;
    port: number;
    routesLocation: string;
    middlewareLocation: string;
    publicLocation: string;
}

const loggingFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.splat(),
    winston.format.printf(info =>
    {
        return `${dayjs().format('YYYYMMDD HH:mm:ss.SSSS')} ${info.level}: ${info.message}`;
    }));

class ElapsedTime
{
    private precision: number = 3;
    private start = process.hrtime();

    public time()
    {
        const elapsed = process.hrtime(this.start)[1] / 1000000; // divide by a million to get nano to milli
        this.start = process.hrtime(); // reset the timer

        return {
            value: elapsed,
            s: process.hrtime(this.start)[0],
            ms: Number(elapsed.toFixed(this.precision))
        };
    };
}

class Builder
{
    public app = express();

    private env = process.env.NODE_ENV || 'default';

    private logger = winston.createLogger({
        exitOnError: false,
        transports: [
            new winston.transports.Console({
                format: loggingFormat
            })
        ]
    });

    private elapsedBoot = new ElapsedTime();

    private config: BuilderConfig = {
        appName: 'express-builder',
        port: 3000,
        routesLocation: path.join(__dirname, '../routes'),
        middlewareLocation: path.join(__dirname, '../middleware'),
        publicLocation: path.join(__dirname, '../public')
    };

    private supportedMethods: string[] = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'];

    constructor()
    {
        this.logger.info(`NODE_ENV = ${this.env}`);
    }

    private parsePath(p)
    {
        if (fs.existsSync(p))
        {
            const fsItems = fs.readdirSync(p);
            if (fsItems.length > 0)
            {
                for (const item of fsItems)
                {
                    const fullPath = path.join(p, item);
                    if (fs.lstatSync(fullPath).isDirectory())
                    {
                        this.parsePath(fullPath);
                    }

                    if (fs.lstatSync(fullPath).isFile())
                    {
                        const method = path.basename(fullPath, '.ts').toLowerCase();
                        if (this.supportedMethods.map(el => el.toLowerCase()).includes(method))
                        {
                            const temp = fullPath
                                .split(this.config.routesLocation)[1]
                                .split(`${method}.ts`)[0];
                            const pathToHandle = temp.substring(0, temp.length - 1).replace(/\\/gi, '/');

                            const m = require(fullPath);
                            console.log(m.default)
                            //parse path params
                            const pathParsed = pathToHandle.replace(/\$/gi, ':');
                            this.app[method](pathParsed, m.default);

                            this.logger.info(`Added support for ${method.toUpperCase()} ${pathParsed}`);
                        }
                    }
                }
            }
        }
        else
        {
            throw new Error(`ROUTE_HANDLERS: ${p} not found`);
        }
    }

    public init(): void
    {
        try
        {
            this.config = {...this.config, ...cfg.get(this.env)};
        } catch (ex)
        {
            this.logger.error(ex.toString());
            process.exit(1);
        }

        //check if public location exists
        if (fs.existsSync(this.config.publicLocation))
        {
            this.app.use(express.static(this.config.publicLocation));
        }

        this.app.get('/_version', (reg, res) =>
        {
            res.send({
                version: '3.0.1',
                app: this.config.appName,
                env: process.env.NODE_ENV
            });
        });

        const elapsedRoutes = new ElapsedTime();
        this.logger.info(`Getting routes handlers from ${this.config.routesLocation} ...`);
        this.parsePath(this.config.routesLocation);
        const elapsedTimeRoutes = elapsedRoutes.time();
        this.logger.info(`Parsing routes handlers completed in ${elapsedTimeRoutes.s}s ${elapsedTimeRoutes.ms}ms`);

        if (cfg.has(`${this.env}.autoStart`) && cfg.get(`${this.env}.autoStart`))
        {
            this.app.listen(this.config.port, (): void =>
            {
                this.logger.info(`Listening on port ${this.config.port}`);
                this.logger.info(`PID: ${process.pid}`);

                const elapsedTimeBoot = this.elapsedBoot.time();
                this.logger.info(`Boot time ${elapsedTimeBoot.s}s ${elapsedTimeBoot.ms}ms`);
            });
        }
        else
        {
            this.logger.info(`Server auto staring is disabled in {${this.env}} configuration`);
            const elapsedTimeBoot = this.elapsedBoot.time();
            this.logger.info(`Ready in ${elapsedTimeBoot.s}s ${elapsedTimeBoot.ms}ms`);
        }
    }
}

export default Builder;
