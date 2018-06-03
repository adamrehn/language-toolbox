import { ChildProcess } from 'child_process';
import { LogProvider } from './LogProvider';
import { EventEmitter } from 'events';

export class SubprocessManagerBase
{
	protected events : EventEmitter;
	protected process : ChildProcess | null = null;
	
	public constructor()
	{
		//Create our event emitter
		this.events = new EventEmitter();
	}
	
	//Registers an event handler with our EventEmitter
	public on(event : string, callback : (...args: any[]) => void) {
		this.events.on(event, callback);
	}
	
	//Registers a once-only event handler with our EventEmitter
	public once(event : string, callback : (...args: any[]) => void) {
		this.events.once(event, callback);
	}
	
	//Removes event handlers from our EventEmitter
	public removeAllListeners(event : string) {
		this.events.removeAllListeners(event);
	}
	
	//Determines if the child process is currently running
	public isRunning() {
		return (this.process !== null);
	}
	
	//Kills the child process if it is currently running
	public kill()
	{
		if (this.process !== null) {
			this.process.kill();
		}
	}
}
