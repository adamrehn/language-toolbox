class IOStuff
{
	public static void ioStuff()
	{
		System.Console.Out.WriteLine("This is stdout data.");
		System.Console.Error.WriteLine("This is stderr data.");
		
		string data = System.Console.In.ReadLine();
		System.Console.Out.WriteLine("The stdin data: " + data);
	}
}
