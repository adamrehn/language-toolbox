export class PortAllocator
{
	private currPort : number;
	
	public constructor(startingPort : number) {
		this.currPort = startingPort;
	}
	
	public getNextPort() {
		return this.currPort++;
	}
}
