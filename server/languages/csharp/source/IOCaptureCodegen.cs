using System;
using System.Text;
using System.Collections.Generic;

namespace language_csharp
{
	public class IOCaptureCodegen
	{
		public static byte[] performCodegen(CodegenManager codegen, string source, string invocation, string stdin)
		{
			//Generate the boilerplate code to populate the body of the main() method
			StringBuilder bodyCode = new StringBuilder();
			bodyCode.Append("var stdinData = @\"");
			bodyCode.Append(stdin.Replace("\"", "\"\""));
			bodyCode.Append("\";");
			bodyCode.Append(@"
			System.Console.SetIn(new System.IO.StreamReader(new System.IO.MemoryStream(System.Text.Encoding.UTF8.GetBytes(stdinData))));
			try
			{
				" + invocation + @"
			}
			catch (System.Exception e) {
				System.Console.Error.WriteLine(""Error: "" + e.ToString());
			}
			");
			
			//Perform codegen
			return codegen.performCodegen(source, bodyCode.ToString());
		}
	}
}
