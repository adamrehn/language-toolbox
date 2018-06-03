using System;
using Newtonsoft.Json;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;

namespace language_csharp
{
	public class ParseException : System.Exception {
		public ParseException(string message) : base(message) {}
	}
	
	public class AstGenerator
	{
		public static string generateAst(string source)
		{
			//Attempt to parse the supplied source code
			var ast = CSharpSyntaxTree.ParseText(source).GetRoot();
			
			//If there were any errors during parsing, report the first one
			var diagnostics = ast.GetDiagnostics();
			foreach (var diag in diagnostics)
			{
				if (diag.Severity == Microsoft.CodeAnalysis.DiagnosticSeverity.Error) {
					throw new ParseException(diag.ToString());
				}
			}
			
			//Convert the AST to JSON, ignoring any attributes with circular references (e.g. each node's Parent attribute)
			JsonSerializerSettings settings = new JsonSerializerSettings();
			settings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
			return Newtonsoft.Json.JsonConvert.SerializeObject(ast, settings);
		}
	}
}
