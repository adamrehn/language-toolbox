import { LogProvider } from './LogProvider';
import * as winston from 'winston';

export class WinstonLogProvider implements LogProvider
{
	public constructor(logFile? : string)
	{
		//If a log file was specified, add it as a transport
		if (logFile !== undefined && logFile !== null && logFile.length > 0) {
			winston.add(winston.transports.File, { filename: logFile, handleExceptions: true, level: 'verbose' });
		}
		
		//Log any unhandled exceptions in the application
		winston.remove(winston.transports.Console);
		winston.add(winston.transports.Console, { colorize: true, handleExceptions: true, level: 'verbose' });
	}
	
	public log(level : string, message : string, meta? : any) : void {
		winston.log(level, message, meta);
	}
	
	public info(message : string, meta? : any) : void {
		winston.info(message, meta);
	}
	
	public warn(message : string, meta? : any) : void {
		winston.warn(message, meta);
	}
	
	public error(message : string, meta? : any) : void {
		winston.error(message, meta);
	}
	
	public verbose(message : string, meta? : any) : void {
		winston.verbose(message, meta);
	}
}
