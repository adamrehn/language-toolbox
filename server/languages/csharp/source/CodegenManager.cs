using System;
using System.IO;
using System.IO.Compression;

namespace language_csharp
{
	public class CodegenError : System.Exception {
		public CodegenError(string message) : base(message) {}
	}
	
	public class CodegenManager
	{
		private string templateCode;
		private string projectFile;
		
		public CodegenManager(string templateDir)
		{
			this.templateCode = File.ReadAllText(Path.Combine(templateDir, "Program.cs.template"));
			this.projectFile = File.ReadAllText(Path.Combine(templateDir, "CodegenOutput.csproj.template"));
		}
		
		public byte[] performCodegen(string prefixCode, string mainCode)
		{
			using (TempDirectory tempDir = new TempDirectory())
			{
				//Populate the template source code
				string codegenSource = this.templateCode;
				codegenSource = codegenSource.Replace("//$$__PREFIX_CODE__$$", prefixCode);
				codegenSource = codegenSource.Replace("//$$__MAIN_CODE__$$", mainCode);
				
				//Write our template files to the temp directory
				File.WriteAllText(Path.Combine(tempDir.getPath(), "Program.cs"), codegenSource);
				File.WriteAllText(Path.Combine(tempDir.getPath(), "CodegenOutput.csproj"), this.projectFile);
				
				//Attempt to perform codegen
				ProcessOutput buildOutput = Utility.execute("dotnet", "publish -c Release -f netcoreapp2.0", tempDir.getPath());
				if (buildOutput.code != 0) {
					throw new CodegenError($"build failed with exit code: {buildOutput.code}, stdout: \"{buildOutput.stdout}\" and stderr: \"{buildOutput.stderr}\"");
				}
				
				//Attempt to zip up the codegen results
				string zipFile = Path.Combine(tempDir.getPath(), "zipped.zip");
				ZipFile.CreateFromDirectory(Path.Combine(tempDir.getPath(), "bin", "Release", "netcoreapp2.0", "publish"), zipFile);
				
				//Retrieve the generated zip file
				return File.ReadAllBytes(zipFile);
			}
		}
	}
}
