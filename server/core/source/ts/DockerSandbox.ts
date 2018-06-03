import { SubprocessManagerBase } from './SubprocessManagerBase';
import { spawn, SpawnOptions } from 'child_process';

//The default timeout (in seconds) that we apply to sandbox execution
const DEFAULT_TIMEOUT = 30;

//The memory limit (in MB) that we apply to sandbox execution
const MEMORY_LIMIT = 512;

//The size limit (in bytes) that we apply to sandbox stdout and stderr
const STDOUT_LIMIT = 10 * 1024 * 1024;  //10MiB
const STDERR_LIMIT = 1  * 1024 * 1024;  //1MiB

export class SandboxOutput
{
	public stdout : Buffer;
	public stderr : Buffer;
	
	public constructor()
	{
		this.stdout = Buffer.alloc(0);
		this.stderr = Buffer.alloc(0);
	}
}

export class DockerSandbox extends SubprocessManagerBase
{
	public constructor() {
		super();
	}
	
	//Attempts to run the specified sandbox image and command with the supplied input data, and returns the output data
	public run(sandboxDetails : any, input : Buffer, combine : boolean, timeout : number)
	{
		return new Promise<SandboxOutput>((resolve : Function, reject : Function) =>
		{
			//If the docker container is already running, emit an error
			if (this.isRunning() === true)
			{
				reject(new Error('Cannot start a new child process while the previous one is still running.'));
				return;
			}
			
			//If no timeout value was specified, use the default timeout
			let sandboxTimeout = (timeout != 0) ? timeout : DEFAULT_TIMEOUT;
			
			//Spawn the docker client child process
			this.process = spawn('docker', [
				'run',
				'--init',
				'--rm',
				'-a', 'stdin',
				'-a', 'stdout',
				'-a', 'stderr',
				'-i',
				'--log-driver', 'none',
				'--net=none',
				'--cpus=1',
				`--memory=${MEMORY_LIMIT}m`,
				`--memory-swap=${MEMORY_LIMIT}m`,
				'--memory-swappiness=0',
				'--ulimit', `cpu=${sandboxTimeout}`,
				'--ulimit', 'nproc=1',
				'--read-only',
				'--tmpfs', '/tmp:rw,nosuid,nodev,exec',
				'-w', '/tmp',
				`${sandboxDetails.image}`,
				'timeout', '--signal=SIGKILL', `${sandboxTimeout}`
			].concat(sandboxDetails.command));
			
			//Emit an error if the child process could not be started
			this.process.once('error', (err : Error) => {
				reject(new Error('Failed to start child process.'));
			});
			
			//Write the supplied input data to the stdin of the child process
			this.process.stdin.write(input);
			this.process.stdin.end();
			
			//Helper function for buffering child process output and enforcing size limits
			let outputHelper = (data : Buffer, target : any, key : string, limit : number) =>
			{
				target[key] = Buffer.concat([target[key], data]);
				if (target[key].byteLength > limit)
				{
					reject(new Error('Child process output exceeded maximum permitted length.'));
					this.kill();
				}
			};
			
			//TODO: HOW TO ENFORCE CORRECT ORDERING OF INTERLEAVED STDOUT AND STDERR?
			//FLUSHING IN THE CHILD PROCESS DOESN'T APPEAR TO FLUSH THE BUFFER IN NODE,
			//WHICH MEANS THAT EVENT ORDERING IS NOT GUARANTEED.
			
			//Determine if we are combining stdout and stderr, in which case we combine their size limits
			let stdoutLimit = (combine === true) ? STDOUT_LIMIT + STDERR_LIMIT : STDOUT_LIMIT;
			let stderrTarget = (combine === true) ? 'stdout' : 'stderr';
			
			//Buffer all output from the child process, enforcing size limits
			let output = new SandboxOutput();
			this.process.stdout.on('data', (data : Buffer) => { outputHelper(data, output, 'stdout', stdoutLimit); });
			this.process.stderr.on('data', (data : Buffer) => { outputHelper(data, output, stderrTarget, STDERR_LIMIT); });
			
			//Register our event handler for process termination
			this.process.on('exit', (code : number, signal? : number) =>
			{
				//Release our reference to the ChildProcess object
				this.process = null;
				
				//Determine if the child process completed successfully
				if (code === 0) {
					resolve(output);
				}
				else {
					reject(new Error(`child process terminated with exit code ${code}, stdout "${output.stdout}", and stderr "${output.stderr}"`));
				}
			});
		});
	}
}
