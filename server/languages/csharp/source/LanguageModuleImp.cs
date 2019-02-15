using System;
using Grpc.Core;
using System.Threading.Tasks;

namespace language_csharp
{
	class LanguageModuleImp : LanguageModule.LanguageModuleBase
	{
		private CodegenManager codegen;
		
		public LanguageModuleImp(string templateDir) {
			this.codegen = new CodegenManager(templateDir);
		}
		
		public override Task<LanguageCapabilities> GetCapabilities(Empty request, ServerCallContext context)
		{
			return Task.FromResult(new LanguageCapabilities {
				Language = "csharp",
				Capabilities = (int)Capabilities.GenerateAsts | (int)Capabilities.IoMatching | (int)Capabilities.UnitTesting
			});
		}
		
		public override Task<SandboxDetails> GetSandboxDetails(Empty request, ServerCallContext context)
		{
			return Task.FromResult(new SandboxDetails {
				Image = "adamrehn/language-toolbox-sandbox-csharp",
				Command = {"bash", "-c", "cat > /tmp/temp.zip && unzip -qq -d /tmp /tmp/temp.zip && chmod -R 777 *.* && dotnet /tmp/CodegenOutput.dll"}
			});
		}
		
		public override Task<GenerateAstResponse> GenerateAst(GenerateAstRequest request, ServerCallContext context)
		{
			try
			{
				var ast = AstGenerator.generateAst(request.Source);
				return Task.FromResult(new GenerateAstResponse {
					Error = "",
					Ast = ast
				});
			}
			catch (Exception e)
			{
				return Task.FromResult(new GenerateAstResponse {
					Error = e.Message,
					Ast = ""
				});
			}
		}
		
		public override Task<CodegenIOCaptureResponse> CodegenIOCapture(CodegenIOCaptureRequest request, ServerCallContext context)
		{
			try
			{
				var zip = IOCaptureCodegen.performCodegen(this.codegen, request.Source, request.Invocation, request.Stdin);
				return Task.FromResult(new CodegenIOCaptureResponse {
					Error = "",
					Data = Google.Protobuf.ByteString.CopyFrom(zip)
				});
			}
			catch (Exception e)
			{
				return Task.FromResult(new CodegenIOCaptureResponse {
					Error = e.Message,
					Data = Google.Protobuf.ByteString.CopyFromUtf8("")
				});
			}
		}
		
		public override Task<CodegenUnitTestsResponse> CodegenUnitTests(CodegenUnitTestsRequest request, ServerCallContext context)
		{
			try
			{
				var zip = UnitTestCodegen.performCodegen(this.codegen, request.Source, request.Tests);
				return Task.FromResult(new CodegenUnitTestsResponse {
					Error = "",
					Data = Google.Protobuf.ByteString.CopyFrom(zip)
				});
			}
			catch (Exception e)
			{
				return Task.FromResult(new CodegenUnitTestsResponse {
					Error = e.Message,
					Data = Google.Protobuf.ByteString.CopyFromUtf8("")
				});
			}
		}
	}
}
