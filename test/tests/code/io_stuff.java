import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.io.IOException;

class IOStuff
{
	public static void ioStuff()
	{
		System.out.println("This is stdout data.");
		System.err.println("This is stderr data.");
		
		try
		{
			BufferedReader stdin = new BufferedReader(new InputStreamReader(System.in));
			String data = stdin.readLine();
			System.out.println("The stdin data: " + data);
		}
		catch (IOException e) {
			System.err.println("FAILED TO READ STDIN DATA!");
		}
	}
}
