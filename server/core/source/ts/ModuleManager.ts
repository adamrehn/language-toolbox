import { LanguageModule } from './LanguageModule';
import { PortAllocator } from './PortAllocator';
import { LogProvider } from './LogProvider';
import * as path from 'path';
import * as grpc from 'grpc';
import * as globRaw from 'glob';
import { promisify } from 'util';
const glob = promisify(globRaw);

export class ModuleManager
{
	private modules : Map<string,LanguageModule>;
	private logger : LogProvider;
	
	//This class should not be instantiated directly, instead use ModuleManager.createFromDir()
	protected constructor(logger : LogProvider)
	{
		this.modules = new Map<string,LanguageModule>();
		this.logger = logger;
	}
	
	//Creates a ModuleManager instance for the language modules in the specified directory
	public static async createFromDir(dir : string, ports : PortAllocator, logger : LogProvider)
	{
		try
		{
			//Create the module manager to hold the valid modules
			let manager = new ModuleManager(logger);
			
			//Scan the directory for language modules
			let descriptorFiles = await glob(path.join(dir, '*', 'module.json'));
			for (let descriptorFile of descriptorFiles)
			{
				//Attempt to create the module
				try
				{
					let module = new LanguageModule(descriptorFile, logger);
					await module.start(ports.getNextPort());
					let capabilities = module.GetCapabilities();
					manager.addModule(capabilities.language, module);
				}
				catch (err) {
					logger.warn(`ignoring invalid language module from descriptor file '${descriptorFile}'`, {'error': err.message});
				}
			}
			
			return manager;
		}
		catch (err)
		{
			//Propagate any errors
			throw err;
		}
	}
	
	//Attempts to restart a module after it has crashed
	private attemptRestart(language : string, module : LanguageModule)
	{
		//Log output
		this.logger.warn(`child process for ${language} language module crashed, attempting to restart it...`);
		
		//Remove the module from our list
		this.modules.delete(language);
		
		//Attempt to start the module again
		module.restart().then(() =>
		{
			this.logger.info(`successfully restarted child process for ${language} language module`);
			this.addModule(language, module);
		})
		.catch((err : Error) => {
			this.logger.error(`failed to restart child process for ${language} language module`);
		});
	}
	
	//Adds a module for the specified language
	public addModule(language : string, module : LanguageModule)
	{
		//Add the module to our list
		this.modules.set(language, module);
		
		//Attempt to restart the module if it crashes
		module.once('close', (code : number) => {
			this.attemptRestart(language, module);
		});
	}
	
	//Attempts to retrieve the module for the specified language
	public getModule(language : string)
	{
		if (this.modules.has(language) === true) {
			return <LanguageModule>(this.modules.get(language));
		}
		
		throw new Error(`no language module available for language "${language}"`);
	}
	
	//Lists the languages that we have modules for
	public listLanguages() {
		return Array.from(this.modules.keys());
	}
}
