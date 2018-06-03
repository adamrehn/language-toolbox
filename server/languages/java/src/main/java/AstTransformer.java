import com.github.javaparser.printer.JsonPrinter;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.JavaParser;

public class AstTransformer
{
	public static String generateAst(String source)
	{
		CompilationUnit ast = JavaParser.parse(source);
		JsonPrinter printer = new JsonPrinter(true);
		return printer.output(ast);
	}
}
